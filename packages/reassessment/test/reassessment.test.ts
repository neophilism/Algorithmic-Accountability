import assert from "node:assert/strict";
import test from "node:test";

import {
  combineReassessmentDecisions,
  evaluateDeploymentChange,
  evaluateOperationalEvent,
  recordReassessmentTrigger,
  snapshotDeployment,
} from "../src/index.js";

const now =
  "2026-10-08T01:30:00.000Z";

const previous = {
  modelVersionResourceId:
    "version-3",
  purpose:
    "Support underwriting decisions",
  decisionProcess:
    "Human reviewer considers score with application materials.",
  affectedPopulationDescription:
    "Consumer loan applicants",
  inputDataCategories: [
    "application-data",
    "credit-history",
  ],
};

test("model version change requires reassessment and reauthorization", () => {
  const decision =
    evaluateDeploymentChange(
      previous,
      {
        ...previous,
        modelVersionResourceId:
          "version-4",
      },
    );

  assert.equal(
    decision.reassessmentRequired,
    true,
  );
  assert.deepEqual(
    decision.triggers,
    [
      "material-model-change",
    ],
  );
  assert.equal(
    decision.authorizationContinuity,
    "reauthorization-required",
  );
});

test("data category changes are set-based and order-insensitive", () => {
  const unchanged =
    evaluateDeploymentChange(
      previous,
      {
        ...previous,
        inputDataCategories: [
          "credit-history",
          "application-data",
        ],
      },
    );
  assert.equal(
    unchanged.reassessmentRequired,
    false,
  );

  const changed =
    evaluateDeploymentChange(
      previous,
      {
        ...previous,
        inputDataCategories: [
          "credit-history",
          "application-data",
          "device-data",
        ],
      },
    );
  assert.deepEqual(
    changed.triggers,
    [
      "material-data-change",
    ],
  );
});

test("purpose population and decision-process changes all force reauthorization", () => {
  const decision =
    evaluateDeploymentChange(
      previous,
      {
        ...previous,
        purpose:
          "Automatically determine eligibility",
        decisionProcess:
          "System produces final decision",
        affectedPopulationDescription:
          "Mortgage applicants",
      },
    );

  assert.deepEqual(
    new Set(
      decision.triggers,
    ),
    new Set([
      "material-purpose-change",
      "material-population-change",
      "material-decision-process-change",
    ]),
  );
  assert.equal(
    decision.authorizationContinuity,
    "reauthorization-required",
  );
});

test("incident monitoring and scheduled review require review without silently revoking", () => {
  for (const kind of [
    "new-harm-or-incident",
    "monitoring-threshold-breach",
    "scheduled-review",
  ]) {
    const decision =
      evaluateOperationalEvent({
        kind,
        summary:
          "Review trigger observed.",
      });

    assert.equal(
      decision.reassessmentRequired,
      true,
    );
    assert.equal(
      decision.authorizationContinuity,
      "review-required",
    );
  }
});

test("combined decisions escalate to reauthorization when any material change exists", () => {
  const scheduled =
    evaluateOperationalEvent({
      kind: "scheduled-review",
      summary: "Annual review",
    });
  const material =
    evaluateDeploymentChange(
      previous,
      {
        ...previous,
        modelVersionResourceId:
          "version-4",
      },
    );

  const combined =
    combineReassessmentDecisions(
      scheduled,
      material,
    );

  assert.equal(
    combined.authorizationContinuity,
    "reauthorization-required",
  );
  assert.equal(
    combined.triggers.length,
    2,
  );
});

test("deployment snapshot reads the accountability fields used for materiality", () => {
  const snapshot =
    snapshotDeployment({
      id: "deployment-1",
      organizationId:
        "11111111-1111-4111-8111-111111111111",
      resourceType:
        "deployment-context",
      name: "Deployment",
      externalRef: null,
      status: "active",
      attributes: {
        ...previous,
      },
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

  assert.deepEqual(
    snapshot,
    previous,
  );
});

test("reassessment trigger persists auditable evidence with continuity decision", async () => {
  let created;

  const decision =
    evaluateDeploymentChange(
      previous,
      {
        ...previous,
        modelVersionResourceId:
          "version-4",
      },
    );

  const client = {
    getResource:
      async () => ({
        id: "deployment-1",
        organizationId:
          "11111111-1111-4111-8111-111111111111",
        resourceType:
          "deployment-context",
        name: "Deployment",
        externalRef: null,
        status: "active",
        attributes: {
          ...previous,
        },
        metadata: {},
        createdAt: now,
        updatedAt: now,
      }),
    createEvidence:
      async (input) => {
        created = input;
        return {
          evidence: {
            id: "evidence-trigger",
            organizationId:
              "11111111-1111-4111-8111-111111111111",
            resourceId:
              input.resourceId,
            evidenceType:
              input.evidenceType,
            title: input.title,
            status: "active",
            submittedByPrincipalId:
              null,
            source:
              input.source ?? null,
            uri:
              input.uri ?? null,
            mediaType: null,
            fileName: null,
            checksumAlgorithm:
              null,
            checksum: null,
            capturedAt:
              input.capturedAt ?? null,
            validFrom: null,
            validUntil: null,
            provenance:
              input.provenance ?? {},
            supersedesEvidenceId:
              null,
            supersededAt: null,
            attributes:
              input.attributes ?? {},
            metadata:
              input.metadata ?? {},
            createdAt: now,
            updatedAt: now,
          },
          attestations: [],
        };
      },
  };

  await recordReassessmentTrigger(
    client,
    {
      deploymentContextResourceId:
        "deployment-1",
      observedAt: now,
      summary:
        "Version 4 proposed for deployment.",
      decision,
      previousSnapshot:
        previous,
      proposedSnapshot: {
        ...previous,
        modelVersionResourceId:
          "version-4",
      },
      relatedAuthorizationId:
        "authorization-1",
      priorAssessmentEvidenceId:
        "assessment-1",
    },
  );

  assert.equal(
    created.evidenceType,
    "algorithmic-reassessment-trigger",
  );
  assert.equal(
    created.metadata
      .authorizationContinuity,
    "reauthorization-required",
  );
  assert.deepEqual(
    created.attributes
      .triggers,
    [
      "material-model-change",
    ],
  );
});

test("no-change decisions are not persisted as trigger evidence", async () => {
  const client = {
    getResource:
      async () => ({
        id: "deployment-1",
        organizationId:
          "11111111-1111-4111-8111-111111111111",
        resourceType:
          "deployment-context",
        name: "Deployment",
        externalRef: null,
        status: "active",
        attributes: {
          ...previous,
        },
        metadata: {},
        createdAt: now,
        updatedAt: now,
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
      recordReassessmentTrigger(
        client,
        {
          deploymentContextResourceId:
            "deployment-1",
          observedAt: now,
          summary:
            "No material change",
          decision:
            evaluateDeploymentChange(
              previous,
              previous,
            ),
        },
      ),
    /only actual reassessment requirements/,
  );
});
