import type {
  ComplianceEngineClient,
  DeclarativeRuleSet,
  Evidence,
  EvidenceView,
  Finding,
  FindingStatus,
  FindingView,
  JsonObject,
  Resource,
} from "@caiae/sdk";
import {
  evaluateOperationalEvent,
  recordReassessmentTrigger,
} from "@algorithmic-accountability/reassessment";

import type {
  AccountabilityCaseInput,
  AccountabilityCaseReviewInput,
  AccountabilityCaseReviewResult,
  AccountabilityCaseSeverity,
} from "./types.js";

export type CaseClient =
  Pick<
    ComplianceEngineClient,
    | "getResource"
    | "createEvidence"
    | "getEvidence"
    | "runCheck"
    | "syncFailedCheckFindings"
    | "listFindingsForResource"
    | "assignFindingOwner"
    | "acknowledgeFinding"
    | "disputeFinding"
    | "resolveFindingDispute"
  >;

export async function createAccountabilityCaseEvidence(
  client: CaseClient,
  input: AccountabilityCaseInput,
): Promise<EvidenceView> {
  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );
  requireDeploymentContext(
    deployment,
  );
  validateCaseInput(input);

  return client.createEvidence({
    resourceId:
      input.deploymentContextResourceId,
    evidenceType:
      input.kind ===
      "complaint"
        ? "algorithmic-complaint"
        : "algorithmic-incident",
    title:
      input.title.trim(),
    source:
      "algorithmic-accountability",
    capturedAt:
      input.reportedAt,
    ...(input.sourceUris?.[0]
      ? {
          uri:
            input.sourceUris[0],
        }
      : {}),
    provenance: jsonObject({
      caseId:
        input.caseId,
      reporterType:
        input.reporterType,
      reportedAt:
        input.reportedAt,
      sourceUris:
        input.sourceUris ?? [],
    }),
    attributes: jsonObject({
      caseId:
        input.caseId,
      kind:
        input.kind,
      summary:
        input.summary.trim(),
      severity:
        input.severity,
      status:
        "reported",
      ...(input.modelVersionResourceId
        ? {
            modelVersionResourceId:
              input.modelVersionResourceId,
          }
        : {}),
      ...(input.relatedAuthorizationId
        ? {
            relatedAuthorizationId:
              input.relatedAuthorizationId,
          }
        : {}),
    }),
    metadata: {
      accountabilityDomain:
        "algorithmic-accountability",
      evidenceKind:
        input.kind,
      allegationStatus:
        "unreviewed",
    },
  });
}

export async function reviewAccountabilityCase(
  client: CaseClient,
  input: AccountabilityCaseReviewInput,
): Promise<AccountabilityCaseReviewResult> {
  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );
  requireDeploymentContext(
    deployment,
  );
  validateReviewInput(input);

  const caseView =
    await client.getEvidence(
      input.caseEvidenceId,
    );
  const caseEvidence =
    caseView.evidence;

  validateCaseEvidence(
    caseEvidence,
    input.deploymentContextResourceId,
  );

  const severity =
    parseSeverity(
      caseEvidence.attributes
        .severity,
    );

  const reviewEvidence =
    await client.createEvidence({
      resourceId:
        input.deploymentContextResourceId,
      evidenceType:
        "algorithmic-case-review",
      title:
        "Review of " +
        caseEvidence.title,
      source:
        "algorithmic-accountability",
      capturedAt:
        input.reviewedAt,
      provenance: jsonObject({
        caseEvidenceId:
          input.caseEvidenceId,
        reviewedByPrincipalId:
          input.reviewedByPrincipalId,
        reviewedAt:
          input.reviewedAt,
      }),
      attributes: jsonObject({
        outcome:
          input.outcome,
        rationale:
          input.rationale.trim(),
        severity,
        originalCaseKind:
          caseEvidence.evidenceType ===
          "algorithmic-complaint"
            ? "complaint"
            : "incident",
      }),
      metadata: {
        accountabilityDomain:
          "algorithmic-accountability",
        evidenceKind:
          "case-review",
        reviewOutcome:
          input.outcome,
      },
      ...(input.correlationId
        ? {
            correlationId:
              input.correlationId,
          }
        : {}),
    });

  const substantiated =
    input.outcome ===
    "substantiated";

  const check =
    await client.runCheck({
      resourceId:
        input.deploymentContextResourceId,
      requestedByPrincipalId:
        input.reviewedByPrincipalId,
      evaluatedAt:
        input.reviewedAt,
      ruleSet:
        accountabilityCaseRuleSet(
          severity,
        ),
      facts: jsonObject({
        caseSubstantiated:
          substantiated,
        caseEvidenceId:
          input.caseEvidenceId,
        reviewEvidenceId:
          reviewEvidence.evidence.id,
        modelVersionResourceId:
          caseEvidence.attributes
            .modelVersionResourceId ??
          deployment.attributes
            .modelVersionResourceId ??
          null,
        relatedAuthorizationId:
          caseEvidence.attributes
            .relatedAuthorizationId ??
          null,
      }),
      metadata: jsonObject({
        accountabilityDomain:
          "algorithmic-accountability",
        checkKind:
          "case-substantiation",
        caseEvidenceId:
          input.caseEvidenceId,
        reviewEvidenceId:
          reviewEvidence.evidence.id,
      }),
      ...(input.correlationId
        ? {
            correlationId:
              input.correlationId,
          }
        : {}),
    });

  let findings:
    Finding[] = [];
  let reassessmentTriggered =
    false;

  if (substantiated) {
    findings =
      (
        await client.syncFailedCheckFindings(
          check.check.id,
          input.correlationId ??
            null,
        )
      ).findings;

    const decision =
      evaluateOperationalEvent({
        kind:
          "new-harm-or-incident",
        summary:
          "Substantiated accountability case: " +
          caseEvidence.title,
      });

    const priorAssessmentEvidenceId =
      stringOrUndefined(
        caseEvidence.provenance
          .assessmentEvidenceId,
      );
    const relatedAuthorizationId =
      stringOrUndefined(
        caseEvidence.attributes
          .relatedAuthorizationId,
      );

    await recordReassessmentTrigger(
      client,
      {
        deploymentContextResourceId:
          input.deploymentContextResourceId,
        observedAt:
          input.reviewedAt,
        summary:
          "Substantiated accountability case: " +
          caseEvidence.title,
        decision,
        ...(priorAssessmentEvidenceId
          ? {
              priorAssessmentEvidenceId,
            }
          : {}),
        ...(relatedAuthorizationId
          ? {
              relatedAuthorizationId,
            }
          : {}),
      },
    );

    reassessmentTriggered =
      true;
  }

  return {
    reviewEvidenceId:
      reviewEvidence.evidence.id,
    checkId:
      check.check.id,
    checkStatus:
      check.check.status,
    findings,
    reassessmentTriggered,
  };
}

export async function listAccountabilityFindings(
  client: CaseClient,
  deploymentContextResourceId: string,
  status?: FindingStatus,
): Promise<Finding[]> {
  return client.listFindingsForResource(
    deploymentContextResourceId,
    status
      ? { status }
      : {},
  );
}

export async function assignAccountabilityFindingOwner(
  client: CaseClient,
  findingId: string,
  principalId: string,
  ownerPrincipalId: string | null,
): Promise<FindingView> {
  return client.assignFindingOwner(
    findingId,
    {
      principalId,
      ownerPrincipalId,
    },
  );
}

export async function acknowledgeAccountabilityFinding(
  client: CaseClient,
  findingId: string,
  principalId: string,
): Promise<FindingView> {
  return client.acknowledgeFinding(
    findingId,
    {
      principalId,
    },
  );
}

export async function disputeAccountabilityFinding(
  client: CaseClient,
  findingId: string,
  principalId: string,
  reason: string,
): Promise<FindingView> {
  required(
    reason,
    "dispute reason",
  );

  return client.disputeFinding(
    findingId,
    {
      principalId,
      reason:
        reason.trim(),
    },
  );
}

export async function resolveAccountabilityFindingDispute(
  client: CaseClient,
  findingId: string,
  input: {
    principalId: string;
    outcome:
      | "uphold"
      | "dismiss";
    rationale: string;
  },
): Promise<FindingView> {
  required(
    input.rationale,
    "dispute resolution rationale",
  );

  return client.resolveFindingDispute(
    findingId,
    {
      principalId:
        input.principalId,
      outcome:
        input.outcome,
      rationale:
        input.rationale.trim(),
    },
  );
}

function accountabilityCaseRuleSet(
  severity: AccountabilityCaseSeverity,
): DeclarativeRuleSet {
  return {
    schemaVersion: "1",
    id:
      "algorithmic-accountability-case",
    version: "1",
    title:
      "Algorithmic accountability case review",
    description:
      "A substantiated algorithmic-accountability complaint or incident fails this check and creates a formal finding.",
    metadata: {
      downstreamApp:
        "algorithmic-accountability",
      purpose:
        "case-substantiation",
    },
    rules: [
      {
        id:
          "aa.no-substantiated-accountability-case",
        title:
          "No substantiated accountability case requiring corrective action",
        description:
          "A deployment fails this rule when a reviewed complaint or incident is substantiated.",
        severity:
          severity ===
          "moderate"
            ? "medium"
            : severity,
        appliesWhen: {
          field:
            "resource.resourceType",
          operator:
            "equals",
          value:
            "deployment-context",
        },
        require: {
          field:
            "facts.caseSubstantiated",
          operator:
            "equals",
          value: false,
        },
        metadata: {
          accountabilityDomain:
            "algorithmic-accountability",
        },
      },
    ],
  };
}

function validateCaseInput(
  input: AccountabilityCaseInput,
): void {
  required(
    input.caseId,
    "caseId",
  );
  required(
    input.title,
    "title",
  );
  required(
    input.summary,
    "summary",
  );
  validDate(
    input.reportedAt,
    "reportedAt",
  );

  for (
    const uri of
    input.sourceUris ?? []
  ) {
    validHttpUrl(uri);
  }
}

function validateReviewInput(
  input: AccountabilityCaseReviewInput,
): void {
  required(
    input.caseEvidenceId,
    "caseEvidenceId",
  );
  required(
    input.reviewedByPrincipalId,
    "reviewedByPrincipalId",
  );
  required(
    input.rationale,
    "rationale",
  );
  validDate(
    input.reviewedAt,
    "reviewedAt",
  );
}

function validateCaseEvidence(
  evidence: Evidence,
  deploymentContextResourceId: string,
): void {
  if (
    ![
      "algorithmic-complaint",
      "algorithmic-incident",
    ].includes(
      evidence.evidenceType,
    ) ||
    evidence.status !==
      "active"
  ) {
    throw new Error(
      "case review requires an active complaint or incident evidence record",
    );
  }

  if (
    evidence.resourceId !==
    deploymentContextResourceId
  ) {
    throw new Error(
      "case evidence belongs to a different deployment context",
    );
  }
}

function requireDeploymentContext(
  resource: Resource,
): void {
  if (
    resource.resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "accountability cases must attach to deployment-context resources",
    );
  }
}

function parseSeverity(
  value: JsonObject[string] | undefined,
): AccountabilityCaseSeverity {
  if (
    value === "low" ||
    value === "moderate" ||
    value === "high" ||
    value === "critical"
  ) {
    return value;
  }

  throw new Error(
    "case evidence is missing a valid severity",
  );
}

function stringOrUndefined(
  value: JsonObject[string] | undefined,
): string | undefined {
  return typeof value ===
    "string"
    ? value
    : undefined;
}

function required(
  value: string,
  label: string,
): void {
  if (
    value.trim() === ""
  ) {
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

function validHttpUrl(
  value: string,
): void {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "http:" &&
      url.protocol !==
        "https:"
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "source URIs must use http or https",
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
