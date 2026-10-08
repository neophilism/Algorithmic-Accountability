import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyImpactRisk,
  createImpactAssessmentEvidence,
  validateImpactAssessment,
} from "../src/index.js";

const now =
  "2026-10-08T00:30:00.000Z";

const dimensions = {
  "purpose-limitation": {
    status: "satisfied",
    rationale:
      "Purpose is narrowly defined.",
  },
  "affected-population": {
    status: "partial",
    rationale:
      "Population impacts require continued monitoring.",
  },
  "human-review": {
    status: "satisfied",
    rationale:
      "A human makes the final decision.",
  },
  "data-governance": {
    status: "satisfied",
    rationale:
      "Input data has documented stewardship.",
  },
  privacy: {
    status: "satisfied",
    rationale:
      "Privacy controls are documented.",
  },
  security: {
    status: "satisfied",
    rationale:
      "Security controls are documented.",
  },
  performance: {
    status: "satisfied",
    rationale:
      "Performance validation is current.",
  },
  fairness: {
    status: "partial",
    rationale:
      "Observed subgroup differences require monitoring.",
  },
  explainability: {
    status: "satisfied",
    rationale:
      "Reason factors are provided.",
  },
  contestability: {
    status: "satisfied",
    rationale:
      "Applicants can request review.",
  },
  accessibility: {
    status: "satisfied",
    rationale:
      "Review process supports accessible channels.",
  },
  recordkeeping: {
    status: "satisfied",
    rationale:
      "Decision records are retained.",
  },
};

const input = {
  deploymentContextResourceId:
    "deployment-1",
  assessmentId:
    "assessment-2026-001",
  title:
    "Consumer lending impact assessment",
  assessor:
    "Responsible AI Office",
  assessedAt: now,
  intendedBenefits: [
    "Improve consistency of underwriting review.",
  ],
  foreseeableHarms: [
    {
      category:
        "financial-access",
      description:
        "Qualified applicants could receive an adverse risk score.",
      affectedGroup:
        "Consumer loan applicants",
      severity: "high",
      likelihood: "possible",
      mitigation:
        "Human review and adverse-action reason factors.",
      residualSeverity:
        "moderate",
      residualLikelihood:
        "unlikely",
    },
  ],
  dimensions,
  overallRationale:
    "Residual risk requires conditional controls and monitoring.",
  sourceUris: [
    "https://example.com/assessment",
  ],
};

test("risk classification uses residual rather than gross risk for tier", () => {
  const risk =
    classifyImpactRisk(
      input.foreseeableHarms,
    );

  assert.equal(
    risk.grossScore,
    9,
  );
  assert.equal(
    risk.residualScore,
    4,
  );
  assert.equal(
    risk.tier,
    "minimal",
  );
});

test("completeness requires every accountability dimension rationale", () => {
  const incomplete = {
    ...input,
    dimensions: {
      ...dimensions,
      fairness: {
        status:
          "not-applicable",
        rationale: "",
      },
    },
  };

  const issues =
    validateImpactAssessment(
      incomplete,
    );

  assert.ok(
    issues.some(
      (issue) =>
        issue.path ===
        "dimensions.fairness",
    ),
  );
});

test("assessment requires benefit and harm analysis", () => {
  const issues =
    validateImpactAssessment({
      ...input,
      intendedBenefits: [],
      foreseeableHarms: [],
    });

  assert.ok(
    issues.some(
      (issue) =>
        issue.code ===
        "missing-benefit",
    ),
  );
  assert.ok(
    issues.some(
      (issue) =>
        issue.code ===
        "missing-harm-analysis",
    ),
  );
});

test("assessment evidence must attach to deployment context", async () => {
  const client = {
    getResource:
      async () => ({
        id: "system-1",
        organizationId:
          "11111111-1111-4111-8111-111111111111",
        resourceType:
          "algorithmic-system",
        name: "System",
        externalRef: null,
        status: "active",
        attributes: {},
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
      createImpactAssessmentEvidence(
        client,
        input,
      ),
    /deployment-context/,
  );
});

test("complete assessment persists as CAIAE evidence with provenance and risk", async () => {
  let created;

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
        attributes: {},
        metadata: {},
        createdAt: now,
        updatedAt: now,
      }),
    createEvidence:
      async (value) => {
        created = value;
        return {
          evidence: {
            id: "evidence-1",
            organizationId:
              "11111111-1111-4111-8111-111111111111",
            resourceId:
              value.resourceId,
            evidenceType:
              value.evidenceType,
            title:
              value.title,
            status: "active",
            submittedByPrincipalId:
              null,
            source:
              value.source ?? null,
            uri:
              value.uri ?? null,
            mediaType: null,
            fileName: null,
            checksumAlgorithm:
              null,
            checksum: null,
            capturedAt:
              value.capturedAt ?? null,
            validFrom: null,
            validUntil: null,
            provenance:
              value.provenance ?? {},
            supersedesEvidenceId:
              null,
            supersededAt: null,
            attributes:
              value.attributes ?? {},
            metadata:
              value.metadata ?? {},
            createdAt: now,
            updatedAt: now,
          },
          attestations: [],
        };
      },
  };

  const result =
    await createImpactAssessmentEvidence(
      client,
      input,
    );

  assert.equal(
    result.evidence.evidenceType,
    "algorithmic-impact-assessment",
  );
  assert.equal(
    created.metadata
      .riskTier,
    "minimal",
  );
  assert.equal(
    created.provenance
      .assessmentId,
    "assessment-2026-001",
  );
});

test("invalid source URIs are rejected by completeness validation", () => {
  const issues =
    validateImpactAssessment({
      ...input,
      sourceUris: [
        "file:///private/report.pdf",
      ],
    });

  assert.ok(
    issues.some(
      (issue) =>
        issue.code ===
        "invalid-source-uri",
    ),
  );
});
