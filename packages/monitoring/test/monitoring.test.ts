import assert from "node:assert/strict";
import test from "node:test";

import {
  createMonitoringPlanEvidence,
  evaluateMonitoringObservation,
  recordMonitoringObservation,
} from "../src/index.js";

const now =
  "2026-10-08T02:00:00.000Z";

const planInput = {
  deploymentContextResourceId:
    "deployment-1",
  planId:
    "monitoring-plan-1",
  title:
    "Underwriting monitoring plan",
  owner:
    "Responsible AI Office",
  cadenceDescription:
    "Monthly review with weekly automated metric collection.",
  createdAt: now,
  metrics: [
    {
      metricId:
        "approval-accuracy",
      label:
        "Validation accuracy",
      category:
        "performance",
      unit: "ratio",
      threshold: {
        kind: "minimum",
        value: 0.9,
      },
      description:
        "Accuracy on the approved validation benchmark.",
    },
    {
      metricId:
        "service-availability",
      label:
        "Service availability",
      category:
        "reliability",
      unit: "ratio",
      threshold: {
        kind: "minimum",
        value: 0.99,
      },
      description:
        "Availability during operating hours.",
    },
    {
      metricId:
        "group-gap",
      label:
        "Maximum subgroup outcome gap",
      category:
        "fairness",
      unit: "ratio",
      threshold: {
        kind: "maximum",
        value: 0.1,
      },
      description:
        "Maximum monitored disparity across approved comparison groups.",
    },
    {
      metricId:
        "drift-score",
      label:
        "Feature drift score",
      category:
        "drift",
      unit: "score",
      threshold: {
        kind: "maximum",
        value: 0.2,
      },
      description:
        "Aggregate production feature drift.",
    },
    {
      metricId:
        "missing-data-rate",
      label:
        "Missing data rate",
      category:
        "data-quality",
      unit: "ratio",
      threshold: {
        kind: "maximum",
        value: 0.03,
      },
      description:
        "Share of required production fields missing.",
    },
    {
      metricId:
        "override-rate",
      label:
        "Human override rate",
      category:
        "human-override",
      unit: "ratio",
      threshold: {
        kind: "range",
        minimum: 0,
        maximum: 0.35,
      },
      description:
        "Share of cases in which a reviewer overrides the model recommendation.",
    },
    {
      metricId:
        "contest-rate",
      label:
        "Contest rate",
      category:
        "contestability",
      unit: "ratio",
      threshold: {
        kind: "maximum",
        value: 0.08,
      },
      description:
        "Share of decisions formally contested.",
    },
  ],
};

function deployment() {
  return {
    id: "deployment-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceType:
      "deployment-context",
    name:
      "Loan underwriting",
    externalRef: null,
    status: "active",
    attributes: {},
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function planEvidence() {
  return {
    id: "plan-evidence-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceId:
      "deployment-1",
    evidenceType:
      "algorithmic-monitoring-plan",
    title:
      "Monitoring plan",
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
    attributes: {
      planId:
        planInput.planId,
      owner:
        planInput.owner,
      cadenceDescription:
        planInput.cadenceDescription,
      metrics:
        planInput.metrics,
    },
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function passingValues() {
  return [
    {
      metricId:
        "approval-accuracy",
      value: 0.94,
    },
    {
      metricId:
        "service-availability",
      value: 0.995,
    },
    {
      metricId:
        "group-gap",
      value: 0.05,
    },
    {
      metricId:
        "drift-score",
      value: 0.1,
    },
    {
      metricId:
        "missing-data-rate",
      value: 0.01,
    },
    {
      metricId:
        "override-rate",
      value: 0.12,
    },
    {
      metricId:
        "contest-rate",
      value: 0.03,
    },
  ];
}

test("monitoring evaluation supports minimum maximum and range thresholds", () => {
  const passing =
    evaluateMonitoringObservation(
      planInput.metrics,
      passingValues(),
    );

  assert.equal(
    passing.passed,
    true,
  );
  assert.deepEqual(
    passing.breaches,
    [],
  );

  const failing =
    evaluateMonitoringObservation(
      planInput.metrics,
      passingValues().map(
        (item) =>
          item.metricId ===
          "group-gap"
            ? {
                ...item,
                value: 0.18,
              }
            : item,
      ),
    );

  assert.equal(
    failing.passed,
    false,
  );
  assert.equal(
    failing.breaches[0]
      .metricId,
    "group-gap",
  );
});

test("monitoring observation requires every planned metric exactly once", () => {
  assert.throws(
    () =>
      evaluateMonitoringObservation(
        planInput.metrics,
        passingValues().slice(
          0,
          -1,
        ),
      ),
    /missing required monitoring metric/,
  );

  assert.throws(
    () =>
      evaluateMonitoringObservation(
        planInput.metrics,
        [
          ...passingValues(),
          passingValues()[0],
        ],
      ),
    /duplicate monitoring observation metric/,
  );
});

test("monitoring plan persists as deployment evidence", async () => {
  let created;

  const client = {
    getResource:
      async () =>
        deployment(),
    getEvidence:
      async () => ({
        evidence:
          planEvidence(),
        attestations: [],
      }),
    createEvidence:
      async (input) => {
        created = input;
        return {
          evidence: {
            ...planEvidence(),
            id: "created-plan",
            evidenceType:
              input.evidenceType,
            title: input.title,
            attributes:
              input.attributes ?? {},
            metadata:
              input.metadata ?? {},
          },
          attestations: [],
        };
      },
  };

  const result =
    await createMonitoringPlanEvidence(
      client,
      planInput,
    );

  assert.equal(
    result.evidence.evidenceType,
    "algorithmic-monitoring-plan",
  );
  assert.equal(
    created.metadata
      .evidenceKind,
    "monitoring-plan",
  );
});

test("passing observation records evidence without reassessment trigger", async () => {
  const created = [];

  const client = {
    getResource:
      async () =>
        deployment(),
    getEvidence:
      async () => ({
        evidence:
          planEvidence(),
        attestations: [],
      }),
    createEvidence:
      async (input) => {
        created.push(input);
        return {
          evidence: {
            ...planEvidence(),
            id:
              "evidence-" +
              created.length,
            evidenceType:
              input.evidenceType,
            title: input.title,
            attributes:
              input.attributes ?? {},
            metadata:
              input.metadata ?? {},
            capturedAt:
              input.capturedAt ??
              now,
          },
          attestations: [],
        };
      },
  };

  const result =
    await recordMonitoringObservation(
      client,
      {
        deploymentContextResourceId:
          "deployment-1",
        monitoringPlanEvidenceId:
          "plan-evidence-1",
        observedAt: now,
        observationId:
          "obs-1",
        values:
          passingValues(),
      },
    );

  assert.equal(
    result.evaluation.passed,
    true,
  );
  assert.equal(
    result.reassessmentDecision,
    null,
  );
  assert.equal(
    created.length,
    1,
  );
});

test("threshold breach records both observation and reassessment-trigger evidence", async () => {
  const created = [];

  const client = {
    getResource:
      async () =>
        deployment(),
    getEvidence:
      async () => ({
        evidence:
          planEvidence(),
        attestations: [],
      }),
    createEvidence:
      async (input) => {
        created.push(input);
        return {
          evidence: {
            ...planEvidence(),
            id:
              "evidence-" +
              created.length,
            evidenceType:
              input.evidenceType,
            title: input.title,
            attributes:
              input.attributes ?? {},
            metadata:
              input.metadata ?? {},
            capturedAt:
              input.capturedAt ??
              now,
          },
          attestations: [],
        };
      },
  };

  const values =
    passingValues().map(
      (item) =>
        item.metricId ===
        "drift-score"
          ? {
              ...item,
              value: 0.31,
            }
          : item,
    );

  const result =
    await recordMonitoringObservation(
      client,
      {
        deploymentContextResourceId:
          "deployment-1",
        monitoringPlanEvidenceId:
          "plan-evidence-1",
        observedAt: now,
        observationId:
          "obs-2",
        values,
      },
    );

  assert.equal(
    result.evaluation.passed,
    false,
  );
  assert.equal(
    result.reassessmentDecision
      .authorizationContinuity,
    "review-required",
  );
  assert.deepEqual(
    created.map(
      (item) =>
        item.evidenceType,
    ),
    [
      "algorithmic-monitoring-observation",
      "algorithmic-reassessment-trigger",
    ],
  );
});

test("monitoring plan from another deployment is rejected", async () => {
  const client = {
    getResource:
      async () =>
        deployment(),
    getEvidence:
      async () => ({
        evidence: {
          ...planEvidence(),
          resourceId:
            "deployment-2",
        },
        attestations: [],
      }),
    createEvidence:
      async () => {
        throw new Error(
          "must not create",
        );
      },
  };

  await assert.rejects(
    () =>
      recordMonitoringObservation(
        client,
        {
          deploymentContextResourceId:
            "deployment-1",
          monitoringPlanEvidenceId:
            "plan-evidence-1",
          observedAt: now,
          observationId:
            "obs-3",
          values:
            passingValues(),
        },
      ),
    /different deployment context/,
  );
});
