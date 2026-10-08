import assert from "node:assert/strict";
import test from "node:test";

import {
  createAccountabilityCaseEvidence,
  reviewAccountabilityCase,
} from "../src/index.js";

const now =
  "2026-10-08T02:30:00.000Z";

function deployment() {
  return {
    id: "deployment-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceType:
      "deployment-context",
    name: "Deployment",
    externalRef: null,
    status: "active",
    attributes: {
      modelVersionResourceId:
        "version-3",
    },
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function complaintEvidence() {
  return {
    id: "case-evidence-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceId:
      "deployment-1",
    evidenceType:
      "algorithmic-complaint",
    title:
      "Applicant review complaint",
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
      caseId: "case-1",
      kind: "complaint",
      summary:
        "Applicant alleges reason factors were inconsistent.",
      severity: "high",
      status: "reported",
      relatedAuthorizationId:
        "authorization-1",
    },
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function baseClient() {
  const createdEvidence = [];
  const checks = [];
  let syncCount = 0;

  return {
    createdEvidence,
    checks,
    get syncCount() {
      return syncCount;
    },
    getResource:
      async () =>
        deployment(),
    createEvidence:
      async (input) => {
        createdEvidence.push(input);
        return {
          evidence: {
            ...complaintEvidence(),
            id:
              "created-evidence-" +
              createdEvidence.length,
            evidenceType:
              input.evidenceType,
            title: input.title,
            source:
              input.source ?? null,
            capturedAt:
              input.capturedAt ?? null,
            provenance:
              input.provenance ?? {},
            attributes:
              input.attributes ?? {},
            metadata:
              input.metadata ?? {},
          },
          attestations: [],
        };
      },
    getEvidence:
      async () => ({
        evidence:
          complaintEvidence(),
        attestations: [],
      }),
    runCheck:
      async (input) => {
        checks.push(input);
        const substantiated =
          input.facts
            ?.caseSubstantiated ===
          true;
        return {
          check: {
            id:
              "check-" +
              checks.length,
            organizationId:
              "11111111-1111-4111-8111-111111111111",
            resourceId:
              input.resourceId,
            status:
              substantiated
                ? "failed"
                : "passed",
          },
          evaluation: {},
        };
      },
    syncFailedCheckFindings:
      async () => {
        syncCount += 1;
        return {
          findings: [
            {
              id: "finding-1",
              organizationId:
                "11111111-1111-4111-8111-111111111111",
              resourceId:
                "deployment-1",
              checkId: "check-1",
              ruleId: null,
              ruleKey:
                "aa.no-substantiated-accountability-case",
              ruleSetKey:
                "algorithmic-accountability-case",
              ruleSetVersion: "1",
              severity: "high",
              status: "open",
              ownerPrincipalId:
                null,
              title:
                "No substantiated accountability case requiring corrective action",
              description:
                "Substantiated case",
              ruleResult: {},
              openedAt: now,
              acknowledgedAt:
                null,
              acknowledgedByPrincipalId:
                null,
              disputedAt: null,
              disputedByPrincipalId:
                null,
              disputeReason:
                null,
              resolvedAt: null,
              closedAt: null,
              reopenedAt: null,
              metadata: {},
              createdAt: now,
              updatedAt: now,
            },
          ],
        };
      },
    listFindingsForResource:
      async () => [],
    assignFindingOwner:
      async () => ({
        finding: {},
        remediations: [],
      }),
    acknowledgeFinding:
      async () => ({
        finding: {},
        remediations: [],
      }),
    disputeFinding:
      async () => ({
        finding: {},
        remediations: [],
      }),
    resolveFindingDispute:
      async () => ({
        finding: {},
        remediations: [],
      }),
  };
}

test("reported complaint is evidence, not automatically a finding", async () => {
  const client =
    baseClient();

  const result =
    await createAccountabilityCaseEvidence(
      client,
      {
        deploymentContextResourceId:
          "deployment-1",
        caseId: "case-1",
        kind: "complaint",
        title:
          "Applicant complaint",
        summary:
          "Applicant requests review.",
        reportedAt: now,
        reporterType:
          "affected-person",
        severity: "moderate",
      },
    );

  assert.equal(
    result.evidence.evidenceType,
    "algorithmic-complaint",
  );
  assert.equal(
    client.syncCount,
    0,
  );
  assert.equal(
    client.checks.length,
    0,
  );
});

test("unsubstantiated review records a passing check and no finding", async () => {
  const client =
    baseClient();

  const result =
    await reviewAccountabilityCase(
      client,
      {
        deploymentContextResourceId:
          "deployment-1",
        caseEvidenceId:
          "case-evidence-1",
        outcome:
          "unsubstantiated",
        reviewedAt: now,
        reviewedByPrincipalId:
          "reviewer-1",
        rationale:
          "Available evidence did not substantiate the allegation.",
      },
    );

  assert.equal(
    result.checkStatus,
    "passed",
  );
  assert.deepEqual(
    result.findings,
    [],
  );
  assert.equal(
    result.reassessmentTriggered,
    false,
  );
  assert.equal(
    client.syncCount,
    0,
  );
});

test("substantiated review creates failed check, formal finding, and reassessment trigger", async () => {
  const client =
    baseClient();

  const result =
    await reviewAccountabilityCase(
      client,
      {
        deploymentContextResourceId:
          "deployment-1",
        caseEvidenceId:
          "case-evidence-1",
        outcome:
          "substantiated",
        reviewedAt: now,
        reviewedByPrincipalId:
          "reviewer-1",
        rationale:
          "Evidence confirms the accountability failure.",
      },
    );

  assert.equal(
    result.checkStatus,
    "failed",
  );
  assert.equal(
    result.findings.length,
    1,
  );
  assert.equal(
    result.findings[0]
      .severity,
    "high",
  );
  assert.equal(
    client.syncCount,
    1,
  );
  assert.equal(
    result.reassessmentTriggered,
    true,
  );
  assert.deepEqual(
    client.createdEvidence.map(
      (item) =>
        item.evidenceType,
    ),
    [
      "algorithmic-case-review",
      "algorithmic-reassessment-trigger",
    ],
  );
});

test("case severity is translated into CAIAE rule severity without changing semantics", async () => {
  const client =
    baseClient();

  await reviewAccountabilityCase(
    client,
    {
      deploymentContextResourceId:
        "deployment-1",
      caseEvidenceId:
        "case-evidence-1",
      outcome:
        "substantiated",
      reviewedAt: now,
      reviewedByPrincipalId:
        "reviewer-1",
      rationale:
        "Substantiated.",
    },
  );

  assert.equal(
    client.checks[0]
      .ruleSet.rules[0]
      .severity,
    "high",
  );
});

test("case evidence from another deployment is rejected", async () => {
  const client =
    baseClient();
  client.getEvidence =
    async () => ({
      evidence: {
        ...complaintEvidence(),
        resourceId:
          "deployment-2",
      },
      attestations: [],
    });

  await assert.rejects(
    () =>
      reviewAccountabilityCase(
        client,
        {
          deploymentContextResourceId:
            "deployment-1",
          caseEvidenceId:
            "case-evidence-1",
          outcome:
            "substantiated",
          reviewedAt: now,
          reviewedByPrincipalId:
            "reviewer-1",
          rationale:
            "Substantiated.",
        },
      ),
    /different deployment context/,
  );
});
