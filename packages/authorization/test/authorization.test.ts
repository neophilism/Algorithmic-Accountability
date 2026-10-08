import assert from "node:assert/strict";
import test from "node:test";

import {
  minimumApprovalQuorum,
  requestDeploymentAuthorization,
} from "../src/index.js";

const now =
  "2026-10-08T01:00:00.000Z";

function deployment() {
  return {
    id: "deployment-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceType:
      "deployment-context",
    name:
      "Loan underwriting",
    externalRef:
      "loan-underwriting",
    status: "active",
    attributes: {
      algorithmicSystemResourceId:
        "system-1",
      modelVersionResourceId:
        "version-3",
      purpose:
        "Support underwriting decisions",
    },
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function assessment(
  riskTier = "limited",
) {
  return {
    id: "evidence-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceId:
      "deployment-1",
    evidenceType:
      "algorithmic-impact-assessment",
    title: "Assessment",
    status: "active",
    submittedByPrincipalId:
      null,
    source:
      "algorithmic-accountability",
    uri: null,
    mediaType: null,
    fileName: null,
    checksumAlgorithm: null,
    checksum: null,
    capturedAt: now,
    validFrom: null,
    validUntil: null,
    provenance: {},
    supersedesEvidenceId: null,
    supersededAt: null,
    attributes: {},
    metadata: {
      riskTier,
    },
    createdAt: now,
    updatedAt: now,
  };
}

const baseRequest = {
  deploymentContextResourceId:
    "deployment-1",
  requestedByPrincipalId:
    "principal-requester",
  eligibleApproverPrincipalIds: [
    "principal-approver-1",
    "principal-approver-2",
    "principal-approver-3",
  ],
  approvalAuthority:
    "Responsible AI Governance Policy",
  validUntil:
    "2027-01-01T00:00:00.000Z",
  conditions: {
    allowedPurpose:
      "Support underwriting decisions",
    humanReviewRequired: true,
    appealOrReviewRequired: true,
    monitoringRequired: true,
    prohibitedUses: [
      "fully automated denial",
    ],
  },
};

test("risk tier sets minimum approval quorum", () => {
  assert.equal(
    minimumApprovalQuorum(
      "minimal",
    ),
    1,
  );
  assert.equal(
    minimumApprovalQuorum(
      "limited",
    ),
    1,
  );
  assert.equal(
    minimumApprovalQuorum(
      "high",
    ),
    2,
  );
  assert.equal(
    minimumApprovalQuorum(
      "critical",
    ),
    3,
  );
});

test("authorization fails closed without an active impact assessment", async () => {
  const client = {
    getResource:
      async () =>
        deployment(),
    listEvidenceForResource:
      async () => [],
    requestAuthorization:
      async () => {
        throw new Error(
          "must not request",
        );
      },
    recordAuthorizationDecision:
      async () => {
        throw new Error();
      },
    getAuthorizationEffectiveness:
      async () => ({
        effective: false,
        reason: "pending",
      }),
    revokeAuthorization:
      async () => {
        throw new Error();
      },
  };

  await assert.rejects(
    () =>
      requestDeploymentAuthorization(
        client,
        baseRequest,
      ),
    /requires an active algorithmic impact assessment/,
  );
});

test("high-risk deployment requires multi-approver quorum", async () => {
  const client = {
    getResource:
      async () =>
        deployment(),
    listEvidenceForResource:
      async () => [
        assessment("high"),
      ],
    requestAuthorization:
      async () => {
        throw new Error(
          "must not request",
        );
      },
    recordAuthorizationDecision:
      async () => {
        throw new Error();
      },
    getAuthorizationEffectiveness:
      async () => ({
        effective: false,
        reason: "pending",
      }),
    revokeAuthorization:
      async () => {
        throw new Error();
      },
  };

  await assert.rejects(
    () =>
      requestDeploymentAuthorization(
        client,
        {
          ...baseRequest,
          approvalQuorum: 1,
        },
      ),
    /below the minimum for high residual risk/,
  );
});

test("authorization request carries deployment scope, assessment identity, and enforceable conditions", async () => {
  let requested;

  const client = {
    getResource:
      async () =>
        deployment(),
    listEvidenceForResource:
      async () => [
        assessment("high"),
      ],
    requestAuthorization:
      async (input) => {
        requested = input;
        return {
          authorization: {
            id: "authorization-1",
            organizationId:
              "11111111-1111-4111-8111-111111111111",
            resourceId:
              input.resourceId,
            authorizationType:
              input.authorizationType,
            status: "pending",
            requestedByPrincipalId:
              input.requestedByPrincipalId,
            decidedByPrincipalId:
              null,
            requestedAt: now,
            decidedAt: null,
            validFrom: null,
            validUntil:
              input.validUntil ??
              null,
            scope:
              input.scope ?? {},
            conditions:
              input.conditions ?? {},
            approvalQuorum:
              input.approvalQuorum ??
              1,
            approvalAuthority:
              input.approvalAuthority ??
              null,
            emergency:
              input.emergency ??
              false,
            emergencyReviewDueAt:
              null,
            emergencyReviewedAt:
              null,
            metadata:
              input.metadata ?? {},
            createdAt: now,
            updatedAt: now,
          },
          decisions: [],
          eligibleApproverPrincipalIds:
            input.eligibleApproverPrincipalIds ??
            [],
          approvalCount: 0,
        };
      },
    recordAuthorizationDecision:
      async () => {
        throw new Error();
      },
    getAuthorizationEffectiveness:
      async () => ({
        effective: false,
        reason: "pending",
      }),
    revokeAuthorization:
      async () => {
        throw new Error();
      },
  };

  await requestDeploymentAuthorization(
    client,
    baseRequest,
  );

  assert.equal(
    requested.approvalQuorum,
    2,
  );
  assert.equal(
    requested.metadata
      .assessmentEvidenceId,
    "evidence-1",
  );
  assert.equal(
    requested.metadata
      .residualRiskTier,
    "high",
  );
  assert.equal(
    requested.scope
      .modelVersionResourceId,
    "version-3",
  );
  assert.equal(
    requested.conditions
      .humanReviewRequired,
    true,
  );
  assert.equal(
    requested.conditions
      .monitoringRequired,
    true,
  );
});

test("emergency authorization remains finite and reviewable", async () => {
  let requested;

  const client = {
    getResource:
      async () =>
        deployment(),
    listEvidenceForResource:
      async () => [
        assessment("limited"),
      ],
    requestAuthorization:
      async (input) => {
        requested = input;
        return {
          authorization: {},
          decisions: [],
          eligibleApproverPrincipalIds:
            [],
          approvalCount: 0,
        };
      },
    recordAuthorizationDecision:
      async () => {
        throw new Error();
      },
    getAuthorizationEffectiveness:
      async () => ({
        effective: false,
        reason: "pending",
      }),
    revokeAuthorization:
      async () => {
        throw new Error();
      },
  };

  await requestDeploymentAuthorization(
    client,
    {
      ...baseRequest,
      mode: "emergency",
      emergencyJustification:
        "Temporary continuity need",
      emergencyReviewDueAt:
        "2026-10-09T00:00:00.000Z",
      validUntil:
        "2026-10-10T00:00:00.000Z",
    },
  );

  assert.equal(
    requested.emergency,
    true,
  );
  assert.equal(
    requested.emergencyReviewDueAt,
    "2026-10-09T00:00:00.000Z",
  );
  assert.equal(
    requested.metadata
      .emergencyJustification,
    "Temporary continuity need",
  );
});

test("emergency review cannot fall after authorization expiration", async () => {
  const client = {
    getResource:
      async () =>
        deployment(),
    listEvidenceForResource:
      async () => [
        assessment(),
      ],
    requestAuthorization:
      async () => {
        throw new Error();
      },
    recordAuthorizationDecision:
      async () => {
        throw new Error();
      },
    getAuthorizationEffectiveness:
      async () => ({
        effective: false,
        reason: "pending",
      }),
    revokeAuthorization:
      async () => {
        throw new Error();
      },
  };

  await assert.rejects(
    () =>
      requestDeploymentAuthorization(
        client,
        {
          ...baseRequest,
          mode: "emergency",
          emergencyJustification:
            "Continuity",
          emergencyReviewDueAt:
            "2027-02-01T00:00:00.000Z",
        },
      ),
    /review must be due no later than authorization expiration/,
  );
});
