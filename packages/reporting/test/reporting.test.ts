import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPublicAccountabilitySummary,
  issueAccountabilityCertification,
  loadDeploymentAccountabilityReport,
} from "../src/index.js";

const now =
  "2026-10-08T00:00:00.000Z";

function deployment() {
  return {
    id: "deployment-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceType:
      "deployment-context",
    name:
      "Benefits eligibility triage",
    externalRef:
      "benefits-triage",
    status: "active",
    attributes: {
      purpose:
        "Prioritize applications for human review.",
      decisionDomain:
        "public-benefits",
      humanRole:
        "decision-maker",
      decisionEffect:
        "screening",
      appealOrReviewAvailable:
        true,
      affectedPopulationDescription:
        "Applicants for benefits",
      secretVendorNote:
        "must never enter public summary",
    },
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function evidence(
  id,
  evidenceType,
) {
  return {
    id,
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceId:
      "deployment-1",
    evidenceType,
    title: evidenceType,
    status: "active",
    submittedByPrincipalId: null,
    source: null,
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
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function client(
  overrides = {},
) {
  return {
    getResource:
      async () => deployment(),
    listResources:
      async () => [deployment()],
    getComplianceReport:
      async () => ({
        schemaVersion: "1",
        reportType: "compliance",
        scope: {
          organizationId:
            "11111111-1111-4111-8111-111111111111",
          resourceId:
            "deployment-1",
        },
        organization: {
          id:
            "11111111-1111-4111-8111-111111111111",
          name:
            "Example Organization",
          slug:
            "example",
          status: "active",
        },
        resources: [],
        checks: [],
        findings: [],
        certifications: [],
      }),
    getRenderedComplianceReport:
      async () => ({
        format: "text",
        mediaType:
          "text/plain",
        body: "report",
      }),
    listEvidenceForResource:
      async () => [
        evidence(
          "assessment-1",
          "algorithmic-impact-assessment",
        ),
        evidence(
          "monitoring-1",
          "algorithmic-monitoring-observation",
        ),
        evidence(
          "incident-1",
          "algorithmic-accountability-incident",
        ),
      ],
    listFindingsForResource:
      async () => [
        {
          id: "finding-high",
          status: "open",
          severity: "high",
        },
        {
          id: "finding-closed",
          status: "closed",
          severity: "critical",
        },
      ],
    listCertificationsForResource:
      async () => [
        {
          id: "cert-active",
          status: "active",
        },
        {
          id: "cert-expired",
          status: "expired",
        },
      ],
    listDeadlinesBySubject:
      async () => [
        {
          id: "deadline-1",
        },
      ],
    getDeadlineStatus:
      async () => ({
        status: "overdue",
        escalationLevel: 1,
        warningAt: now,
        dueAt: now,
        overdueAt: now,
      }),
    issueCertification:
      async (input) => ({
        certification: {
          id: "cert-new",
          ...input,
        },
      }),
    ...overrides,
  };
}

test("deployment report aggregates lifecycle evidence, findings, deadlines, and certifications", async () => {
  const report =
    await loadDeploymentAccountabilityReport(
      client(),
      "deployment-1",
      now,
    );

  assert.equal(
    report.metrics.openFindings,
    1,
  );
  assert.equal(
    report.metrics.blockingFindings,
    1,
  );
  assert.equal(
    report.metrics.overdueDeadlines,
    1,
  );
  assert.equal(
    report.metrics.activeAssessments,
    1,
  );
  assert.equal(
    report.metrics.monitoringObservations,
    1,
  );
  assert.equal(
    report.metrics.validCertifications,
    1,
  );
  assert.equal(
    report.incidentEvidence.length,
    1,
  );
});

test("public summary whitelists fields instead of dumping resource attributes", async () => {
  const report =
    await loadDeploymentAccountabilityReport(
      client(),
      "deployment-1",
      now,
    );

  const publicSummary =
    buildPublicAccountabilitySummary(
      report,
    );

  assert.equal(
    publicSummary.deployment
      .attributes.purpose,
    "Prioritize applications for human review.",
  );
  assert.equal(
    "secretVendorNote" in
      publicSummary.deployment
        .attributes,
    false,
  );
  assert.equal(
    "affectedPopulationDescription" in
      publicSummary.deployment
        .attributes,
    false,
  );
});

test("public field selection can further reduce disclosure", async () => {
  const report =
    await loadDeploymentAccountabilityReport(
      client(),
      "deployment-1",
      now,
    );

  const publicSummary =
    buildPublicAccountabilitySummary(
      report,
      {
        fields: [
          "purpose",
        ],
      },
    );

  assert.deepEqual(
    Object.keys(
      publicSummary.deployment
        .attributes,
    ),
    ["purpose"],
  );
});

test("certification requires explicit policy authority and targets deployment context", async () => {
  let captured;

  const c = client({
    issueCertification:
      async (input) => {
        captured = input;
        return {
          certification: {
            id: "cert-new",
            ...input,
          },
        };
      },
  });

  await issueAccountabilityCertification(
    c,
    {
      deploymentContextResourceId:
        "deployment-1",
      certificationType:
        "organizational-accountability-attestation",
      supportingCheckId:
        "check-1",
      issuedByPrincipalId:
        "principal-1",
      policyAuthority:
        "Internal AI Governance Policy v2",
      maximumCheckAgeSeconds:
        86_400,
      blockingFindingSeverities: [
        "high",
        "critical",
      ],
    },
  );

  assert.equal(
    captured.resourceId,
    "deployment-1",
  );
  assert.equal(
    captured.metadata
      .policyAuthority,
    "Internal AI Governance Policy v2",
  );
  assert.equal(
    captured.metadata
      .optionalCertification,
    true,
  );
});

test("certification fails closed without explicit authority", async () => {
  await assert.rejects(
    () =>
      issueAccountabilityCertification(
        client(),
        {
          deploymentContextResourceId:
            "deployment-1",
          certificationType:
            "attestation",
          supportingCheckId:
            "check-1",
          issuedByPrincipalId:
            "principal-1",
          policyAuthority: "   ",
        },
      ),
    /policyAuthority/,
  );
});

test("reporting refuses non-deployment resources", async () => {
  const c = client({
    getResource:
      async () => ({
        ...deployment(),
        resourceType:
          "algorithmic-system",
      }),
  });

  await assert.rejects(
    () =>
      loadDeploymentAccountabilityReport(
        c,
        "system-1",
        now,
      ),
    /deployment-context/,
  );
});
