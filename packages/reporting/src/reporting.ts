import type {
  Certification,
  ComplianceEngineClient,
  JsonObject,
} from "@caiae/sdk";

import type {
  AccountabilityCertificationInput,
  DeploymentAccountabilityReport,
  PublicAccountabilitySummary,
  PublicDeploymentField,
} from "./types.js";

export type ReportingClient =
  Pick<
    ComplianceEngineClient,
    | "getResource"
    | "getComplianceReport"
    | "getRenderedComplianceReport"
    | "listEvidenceForResource"
    | "listFindingsForResource"
    | "listCertificationsForResource"
    | "listDeadlinesBySubject"
    | "getDeadlineStatus"
    | "issueCertification"
    | "listResources"
  >;

const defaultPublicFields:
  PublicDeploymentField[] = [
    "purpose",
    "decisionDomain",
    "humanRole",
    "decisionEffect",
    "appealOrReviewAvailable",
  ];

export async function loadAccountabilityPortfolio(
  client: ReportingClient,
  asOf = new Date().toISOString(),
): Promise<DeploymentAccountabilityReport[]> {
  const deployments =
    await client.listResources({
      resourceType:
        "deployment-context",
    });

  return Promise.all(
    deployments.map(
      (deployment) =>
        loadDeploymentAccountabilityReport(
          client,
          deployment.id,
          asOf,
        ),
    ),
  );
}

export async function loadDeploymentAccountabilityReport(
  client: ReportingClient,
  deploymentContextResourceId: string,
  asOf = new Date().toISOString(),
): Promise<DeploymentAccountabilityReport> {
  validDate(asOf, "asOf");

  const deployment =
    await client.getResource(
      deploymentContextResourceId,
    );

  requireDeployment(
    deployment.resourceType,
  );

  const [
    engineReport,
    evidence,
    findings,
    certifications,
    deadlines,
  ] = await Promise.all([
    client.getComplianceReport(
      deployment.id,
      asOf,
    ),
    client.listEvidenceForResource(
      deployment.id,
    ),
    client.listFindingsForResource(
      deployment.id,
    ),
    client.listCertificationsForResource(
      deployment.id,
    ),
    client.listDeadlinesBySubject(
      "deployment-context",
      deployment.id,
    ),
  ]);

  const deadlineViews =
    await Promise.all(
      deadlines.map(
        async (deadline) => ({
          deadline,
          status:
            await client.getDeadlineStatus(
              deadline.id,
              asOf,
            ),
        }),
      ),
    );

  const assessments =
    evidence.filter(
      (item) =>
        item.evidenceType ===
          "algorithmic-impact-assessment" &&
        item.status === "active",
    );
  const monitoringEvidence =
    evidence.filter(
      (item) =>
        item.evidenceType ===
          "algorithmic-monitoring-observation" &&
        item.status === "active",
    );
  const incidentEvidence =
    evidence.filter(
      (item) =>
        item.evidenceType ===
          "algorithmic-accountability-incident" &&
        item.status === "active",
    );

  const openFindings =
    findings.filter(
      (finding) =>
        finding.status !==
          "closed" &&
        finding.status !==
          "resolved",
    );
  const blockingFindings =
    openFindings.filter(
      (finding) =>
        finding.severity ===
          "high" ||
        finding.severity ===
          "critical",
    );
  const validCertifications =
    certifications.filter(
      certificationIsValid,
    );

  return {
    generatedAt:
      new Date().toISOString(),
    asOf,
    deployment,
    engineReport,
    assessments,
    monitoringEvidence,
    incidentEvidence,
    findings,
    certifications:
      certifications.map(
        (item) =>
          JSON.parse(
            JSON.stringify(item),
          ) as Record<
            string,
            unknown
          >,
      ),
    deadlines:
      deadlineViews,
    metrics: {
      openFindings:
        openFindings.length,
      blockingFindings:
        blockingFindings.length,
      overdueDeadlines:
        deadlineViews.filter(
          (item) =>
            item.status.status ===
            "overdue",
        ).length,
      activeAssessments:
        assessments.length,
      monitoringObservations:
        monitoringEvidence.length,
      validCertifications:
        validCertifications.length,
    },
  };
}

export function buildPublicAccountabilitySummary(
  report: DeploymentAccountabilityReport,
  options: {
    fields?: PublicDeploymentField[];
  } = {},
): PublicAccountabilitySummary {
  const allowed =
    new Set(
      options.fields ??
        defaultPublicFields,
    );
  const attributes:
    Record<string, unknown> = {};

  for (
    const field of
    defaultPublicFields
  ) {
    if (
      allowed.has(field) &&
      field in
        report.deployment
          .attributes
    ) {
      attributes[field] =
        report.deployment
          .attributes[field];
    }
  }

  return {
    schemaVersion: "1",
    generatedAt:
      report.generatedAt,
    deployment: {
      id: report.deployment.id,
      name:
        report.deployment.name,
      status:
        report.deployment.status,
      externalRef:
        report.deployment
          .externalRef,
      attributes,
    },
    accountability: {
      ...report.metrics,
    },
  };
}

export async function issueAccountabilityCertification(
  client: ReportingClient,
  input: AccountabilityCertificationInput,
) {
  required(
    input.certificationType,
    "certificationType",
  );
  required(
    input.policyAuthority,
    "policyAuthority",
  );
  required(
    input.supportingCheckId,
    "supportingCheckId",
  );
  required(
    input.issuedByPrincipalId,
    "issuedByPrincipalId",
  );

  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );
  requireDeployment(
    deployment.resourceType,
  );

  return client.issueCertification({
    resourceId:
      deployment.id,
    certificationType:
      input.certificationType.trim(),
    supportingCheckId:
      input.supportingCheckId,
    issuedByPrincipalId:
      input.issuedByPrincipalId,
    ...(input.validFrom
      ? {
          validFrom:
            input.validFrom,
        }
      : {}),
    ...(input.validUntil
      ? {
          validUntil:
            input.validUntil,
        }
      : {}),
    ...(input.validitySeconds !==
    undefined
      ? {
          validitySeconds:
            input.validitySeconds,
        }
      : {}),
    criteria: {
      ...(input.maximumCheckAgeSeconds !==
      undefined
        ? {
            maximumCheckAgeSeconds:
              input.maximumCheckAgeSeconds,
          }
        : {}),
      ...(input.blockingFindingSeverities
        ? {
            blockingFindingSeverities:
              input.blockingFindingSeverities,
          }
        : {}),
    },
    ...(input.conditions
      ? {
          conditions:
            jsonObject(
              input.conditions,
            ),
        }
      : {}),
    metadata: {
      accountabilityDomain:
        "algorithmic-accountability",
      policyAuthority:
        input.policyAuthority.trim(),
      optionalCertification:
        true,
    },
    ...(input.correlationId
      ? {
          correlationId:
            input.correlationId,
        }
      : {}),
  });
}

export function getRenderedDeploymentReport(
  client: ReportingClient,
  format: "csv" | "text",
  deploymentContextResourceId: string,
  asOf?: string,
) {
  return client.getRenderedComplianceReport(
    format,
    deploymentContextResourceId,
    asOf,
  );
}

function certificationIsValid(
  certification: Certification,
): boolean {
  return (
    certification.status ===
      "active" ||
    certification.status ===
      "valid"
  );
}

function requireDeployment(
  resourceType: string,
): void {
  if (
    resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "accountability reporting must target a deployment-context resource",
    );
  }
}

function required(
  value: string,
  label: string,
): void {
  if (value.trim() === "") {
    throw new Error(
      label +
        " must be non-empty",
    );
  }
}

function validDate(
  value: string,
  label: string,
): void {
  if (
    Number.isNaN(
      Date.parse(value),
    )
  ) {
    throw new Error(
      label +
        " must be an ISO date-time",
    );
  }
}

function jsonObject(
  value: unknown,
): JsonObject {
  return JSON.parse(
    JSON.stringify(value),
  ) as JsonObject;
}
