import assert from "node:assert/strict";
import test from "node:test";

import {
  cancelAccountabilityDeadline,
  evaluateRenewalReadiness,
  scheduleAuthorizationRenewalDeadline,
  scheduleMonitoringReviewDeadline,
} from "../src/index.js";

const asOf =
  "2026-10-08T00:00:00.000Z";

function resource(
  overrides = {},
) {
  return {
    id: "deployment-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceType:
      "deployment-context",
    name: "Example deployment",
    externalRef: "example",
    status: "active",
    attributes: {},
    metadata: {},
    createdAt: asOf,
    updatedAt: asOf,
    ...overrides,
  };
}

function authorization(
  overrides = {},
) {
  return {
    authorization: {
      id: "auth-1",
      organizationId:
        "11111111-1111-4111-8111-111111111111",
      resourceId:
        "deployment-1",
      authorizationType:
        "algorithmic-deployment",
      status: "approved",
      requestedByPrincipalId:
        "principal-1",
      decidedByPrincipalId:
        "principal-2",
      requestedAt:
        "2026-09-01T00:00:00.000Z",
      decidedAt:
        "2026-09-02T00:00:00.000Z",
      validFrom:
        "2026-09-02T00:00:00.000Z",
      validUntil:
        "2026-12-31T00:00:00.000Z",
      scope: {},
      conditions: {
        monitoringRequired: true,
      },
      approvalQuorum: 1,
      approvalAuthority:
        "Accountability board",
      emergency: false,
      emergencyReviewDueAt:
        null,
      emergencyReviewedAt:
        null,
      createdAt:
        "2026-09-01T00:00:00.000Z",
      updatedAt:
        "2026-09-02T00:00:00.000Z",
      metadata: {},
      ...overrides,
    },
    decisions: [],
    eligibleApproverPrincipalIds: [],
    approvalCount: 1,
  };
}

function evidence(
  id,
  type,
  capturedAt,
) {
  return {
    id,
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceId:
      "deployment-1",
    evidenceType: type,
    title: type,
    status: "active",
    submittedByPrincipalId: null,
    source: null,
    uri: null,
    mediaType: null,
    fileName: null,
    checksumAlgorithm: null,
    checksum: null,
    capturedAt,
    validFrom: null,
    validUntil: null,
    provenance: {},
    supersedesEvidenceId: null,
    supersededAt: null,
    attributes: {},
    metadata: {},
    createdAt: capturedAt,
    updatedAt: capturedAt,
  };
}

function client(
  overrides = {},
) {
  return {
    getResource:
      async () => resource(),
    createDeadline:
      async (input) => ({
        deadline: {
          id: "deadline-1",
          ...input,
        },
        clock: null,
        occurrences: [],
      }),
    getDeadlineStatus:
      async () => ({
        status: "due",
        escalationLevel: 0,
        warningAt: asOf,
        dueAt: asOf,
        overdueAt: asOf,
      }),
    listDeadlinesBySubject:
      async () => [],
    satisfyDeadline:
      async () => ({
        deadline: {
          id: "deadline-1",
        },
        clock: null,
        occurrences: [],
      }),
    cancelDeadline:
      async () => ({
        deadline: {
          id: "deadline-1",
        },
        clock: null,
        occurrences: [],
      }),
    getAuthorization:
      async () => authorization(),
    listEvidenceForResource:
      async () => [
        evidence(
          "assessment-1",
          "algorithmic-impact-assessment",
          "2026-10-01T00:00:00.000Z",
        ),
        evidence(
          "monitoring-1",
          "algorithmic-monitoring-observation",
          "2026-10-07T00:00:00.000Z",
        ),
      ],
    listFindingsForResource:
      async () => [],
    ...overrides,
  };
}

test("authorization renewal deadline is tied to deployment and authorization", async () => {
  let captured;

  const c = client({
    createDeadline:
      async (input) => {
        captured = input;
        return {
          deadline: {
            id: "deadline-1",
            ...input,
          },
          clock: null,
          occurrences: [],
        };
      },
  });

  await scheduleAuthorizationRenewalDeadline(
    c,
    {
      deploymentContextResourceId:
        "deployment-1",
      relatedAuthorizationId:
        "auth-1",
      dueAt:
        "2026-12-01T00:00:00.000Z",
    },
  );

  assert.equal(
    captured.deadlineType,
    "algorithmic-accountability.authorization-renewal",
  );
  assert.equal(
    captured.subjectType,
    "deployment-context",
  );
  assert.equal(
    captured.metadata
      .relatedAuthorizationId,
    "auth-1",
  );
});

test("periodic monitoring deadlines preserve recurrence", async () => {
  let captured;

  const c = client({
    createDeadline:
      async (input) => {
        captured = input;
        return {
          deadline: {
            id: "deadline-1",
            ...input,
          },
          clock: null,
          occurrences: [],
        };
      },
  });

  await scheduleMonitoringReviewDeadline(
    c,
    {
      deploymentContextResourceId:
        "deployment-1",
      dueAt:
        "2026-11-01T00:00:00.000Z",
      recurrenceIntervalSeconds:
        2_592_000,
      maxOccurrences: 12,
    },
  );

  assert.equal(
    captured.recurrenceIntervalSeconds,
    2_592_000,
  );
  assert.equal(
    captured.maxOccurrences,
    12,
  );
});

test("renewal readiness passes with current assessment, monitoring, and no blockers", async () => {
  const result =
    await evaluateRenewalReadiness(
      client(),
      {
        deploymentContextResourceId:
          "deployment-1",
        authorizationId:
          "auth-1",
        asOf,
        assessmentMaxAgeSeconds:
          30 * 24 * 60 * 60,
        monitoringObservationMaxAgeSeconds:
          7 * 24 * 60 * 60,
      },
    );

  assert.equal(
    result.eligible,
    true,
  );
  assert.equal(
    result.assessmentEvidenceId,
    "assessment-1",
  );
  assert.equal(
    result.latestMonitoringEvidenceId,
    "monitoring-1",
  );
});

test("renewal readiness fails closed for stale assessment or blocking finding", async () => {
  const c = client({
    listEvidenceForResource:
      async () => [
        evidence(
          "assessment-old",
          "algorithmic-impact-assessment",
          "2026-01-01T00:00:00.000Z",
        ),
        evidence(
          "monitoring-1",
          "algorithmic-monitoring-observation",
          "2026-10-07T00:00:00.000Z",
        ),
      ],
    listFindingsForResource:
      async () => [
        {
          id: "finding-1",
          status: "open",
          severity: "high",
        },
      ],
  });

  const result =
    await evaluateRenewalReadiness(
      c,
      {
        deploymentContextResourceId:
          "deployment-1",
        authorizationId:
          "auth-1",
        asOf,
        assessmentMaxAgeSeconds:
          30 * 24 * 60 * 60,
      },
    );

  assert.equal(
    result.eligible,
    false,
  );
  assert.equal(
    result.checks.find(
      (check) =>
        check.key ===
        "assessment-current",
    )?.passed,
    false,
  );
  assert.equal(
    result.checks.find(
      (check) =>
        check.key ===
        "no-blocking-findings",
    )?.passed,
    false,
  );
});

test("monitoring evidence is only mandatory when authorization requires it", async () => {
  const withoutMonitoring =
    client({
      getAuthorization:
        async () =>
          authorization({
            conditions: {
              monitoringRequired:
                false,
            },
          }),
      listEvidenceForResource:
        async () => [
          evidence(
            "assessment-1",
            "algorithmic-impact-assessment",
            "2026-10-01T00:00:00.000Z",
          ),
        ],
    });

  const result =
    await evaluateRenewalReadiness(
      withoutMonitoring,
      {
        deploymentContextResourceId:
          "deployment-1",
        authorizationId:
          "auth-1",
        asOf,
      },
    );

  assert.equal(
    result.eligible,
    true,
  );
});

test("archived deployments only accept retirement closeout deadlines", async () => {
  const archived =
    client({
      getResource:
        async () =>
          resource({
            status: "archived",
          }),
    });

  await assert.rejects(
    () =>
      scheduleMonitoringReviewDeadline(
        archived,
        {
          deploymentContextResourceId:
            "deployment-1",
          dueAt:
            "2026-11-01T00:00:00.000Z",
        },
      ),
    /only retirement closeout deadlines/,
  );
});

test("deadline cancellation requires a reason", async () => {
  assert.throws(
    () =>
      cancelAccountabilityDeadline(
        client(),
        "deadline-1",
        "principal-1",
        "   ",
      ),
    /cancellation reason/,
  );
});
