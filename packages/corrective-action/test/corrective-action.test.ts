import assert from "node:assert/strict";
import test from "node:test";

import {
  closeRemediatedFinding,
  createCorrectiveActionPlan,
  resumeDeploymentOperation,
  retireDeployment,
  suspendDeploymentOperation,
} from "../src/index.js";

const now =
  "2026-10-08T03:00:00.000Z";

function deployment(
  overrides = {},
) {
  return {
    id: "deployment-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceType:
      "deployment-context",
    name: "Deployment",
    externalRef: null,
    status: "active",
    attributes: {},
    metadata: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function findingView(
  remediationStatuses = [
    "verified",
  ],
) {
  return {
    finding: {
      id: "finding-1",
      organizationId:
        "11111111-1111-4111-8111-111111111111",
      resourceId:
        "deployment-1",
      checkId: "check-1",
      ruleId: null,
      ruleKey: "rule-1",
      ruleSetKey: "rules",
      ruleSetVersion: "1",
      severity: "high",
      status: "remediating",
      ownerPrincipalId: null,
      title: "Finding",
      description: "Issue",
      ruleResult: {},
      openedAt: now,
      acknowledgedAt: null,
      acknowledgedByPrincipalId:
        null,
      disputedAt: null,
      disputedByPrincipalId:
        null,
      disputeReason: null,
      resolvedAt: null,
      closedAt: null,
      reopenedAt: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    },
    remediations:
      remediationStatuses.map(
        (status, index) => ({
          id:
            "remediation-" +
            index,
          organizationId:
            "11111111-1111-4111-8111-111111111111",
          findingId:
            "finding-1",
          deadlineId: null,
          createdByPrincipalId:
            "creator",
          ownerPrincipalId:
            null,
          status,
          plan: "Fix it",
          dueAt: null,
          startedAt: null,
          completedAt: null,
          verifiedAt:
            status ===
            "verified"
              ? now
              : null,
          verifiedByPrincipalId:
            status ===
            "verified"
              ? "reviewer"
              : null,
          verificationNote:
            null,
          rejectedAt: null,
          rejectedByPrincipalId:
            null,
          rejectionReason: null,
          cancelledAt: null,
          metadata: {},
          createdAt: now,
          updatedAt: now,
        }),
      ),
  };
}

test("corrective action cannot be added to a closed finding", async () => {
  const client = {
    getFinding:
      async () => ({
        ...findingView(),
        finding: {
          ...findingView()
            .finding,
          status: "closed",
        },
      }),
    createRemediation:
      async () => {
        throw new Error(
          "must not create",
        );
      },
  };

  await assert.rejects(
    () =>
      createCorrectiveActionPlan(
        client,
        {
          findingId:
            "finding-1",
          createdByPrincipalId:
            "creator",
          plan:
            "Correct the issue",
        },
      ),
    /closed or resolved/,
  );
});

test("finding closes only after all active remediations are verified", async () => {
  let closed = false;
  const client = {
    getFinding:
      async () =>
        findingView([
          "verified",
          "verified",
          "cancelled",
        ]),
    closeFinding:
      async () => {
        closed = true;
        return findingView();
      },
  };

  await closeRemediatedFinding(
    client,
    "finding-1",
    "reviewer",
  );

  assert.equal(
    closed,
    true,
  );

  client.getFinding =
    async () =>
      findingView([
        "verified",
        "in_progress",
      ]);

  await assert.rejects(
    () =>
      closeRemediatedFinding(
        client,
        "finding-1",
        "reviewer",
      ),
    /every active remediation is verified/,
  );
});

test("operational suspension pauses deployment and creates immutable evidence", async () => {
  let update;
  let evidence;

  const client = {
    getResource:
      async () =>
        deployment(),
    updateResource:
      async (
        _id,
        input,
      ) => {
        update = input;
        return deployment({
          status:
            input.status,
          metadata:
            input.metadata,
          updatedAt:
            "2026-10-08T03:01:00.000Z",
        });
      },
    createEvidence:
      async (input) => {
        evidence = input;
        return {
          evidence: {
            id:
              "suspension-evidence",
          },
          attestations: [],
        };
      },
  };

  const result =
    await suspendDeploymentOperation(
      client,
      {
        deploymentContextResourceId:
          "deployment-1",
        principalId:
          "operator-1",
        reason:
          "Critical finding requires pause.",
        findingId:
          "finding-1",
        authorizationId:
          "authorization-1",
        suspendedAt: now,
      },
    );

  assert.equal(
    update.status,
    "inactive",
  );
  assert.equal(
    update.expectedUpdatedAt,
    now,
  );
  assert.equal(
    evidence.evidenceType,
    "algorithmic-operational-suspension",
  );
  assert.equal(
    result.evidenceId,
    "suspension-evidence",
  );
});

test("resumption is blocked by open high severity findings", async () => {
  const client = {
    getResource:
      async () =>
        deployment({
          status:
            "inactive",
        }),
    listFindingsForResource:
      async () => [
        {
          id: "finding-1",
          severity: "high",
          status: "open",
        },
      ],
    getAuthorizationEffectiveness:
      async () => ({
        effective: true,
        reason: "approved",
      }),
    updateResource:
      async () => {
        throw new Error(
          "must not update",
        );
      },
    createEvidence:
      async () => {
        throw new Error(
          "must not create",
        );
      },
  };

  await assert.rejects(
    () =>
      resumeDeploymentOperation(
        client,
        {
          deploymentContextResourceId:
            "deployment-1",
          principalId:
            "operator-1",
          rationale:
            "Resume",
          resumedAt: now,
          authorizationId:
            "authorization-1",
        },
      ),
    /blocking findings remain open/,
  );
});

test("resumption with authorization requires effective authorization", async () => {
  const client = {
    getResource:
      async () =>
        deployment({
          status:
            "inactive",
        }),
    listFindingsForResource:
      async () => [],
    getAuthorizationEffectiveness:
      async () => ({
        effective: false,
        reason: "revoked",
      }),
    updateResource:
      async () => {
        throw new Error();
      },
    createEvidence:
      async () => {
        throw new Error();
      },
  };

  await assert.rejects(
    () =>
      resumeDeploymentOperation(
        client,
        {
          deploymentContextResourceId:
            "deployment-1",
          principalId:
            "operator-1",
          rationale:
            "Resume",
          resumedAt: now,
          authorizationId:
            "authorization-1",
        },
      ),
    /without effective authorization/,
  );
});

test("retirement archives deployment and links replacement without rewriting history", async () => {
  let update;
  let evidence;

  const client = {
    getResource:
      async (id) =>
        id ===
        "deployment-1"
          ? deployment()
          : deployment({
              id:
                "deployment-2",
            }),
    updateResource:
      async (
        _id,
        input,
      ) => {
        update = input;
        return deployment({
          status:
            "archived",
          metadata:
            input.metadata,
        });
      },
    createEvidence:
      async (input) => {
        evidence = input;
        return {
          evidence: {
            id:
              "retirement-evidence",
          },
          attestations: [],
        };
      },
  };

  await retireDeployment(
    client,
    {
      deploymentContextResourceId:
        "deployment-1",
      principalId:
        "operator-1",
      reason:
        "Replaced by reassessed deployment.",
      retiredAt: now,
      replacementDeploymentContextResourceId:
        "deployment-2",
    },
  );

  assert.equal(
    update.status,
    "archived",
  );
  assert.equal(
    update.metadata
      .replacementDeploymentContextResourceId,
    "deployment-2",
  );
  assert.equal(
    evidence.evidenceType,
    "algorithmic-deployment-retirement",
  );
});
