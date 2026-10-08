import type {
  AuthorizationEffectiveness,
  AuthorizationRecord,
  ComplianceEngineClient,
  Evidence,
  JsonObject,
} from "@caiae/sdk";

import type {
  RiskTier,
} from "@algorithmic-accountability/assessment";

import type {
  DeploymentAuthorizationPrerequisite,
  DeploymentAuthorizationRequest,
} from "./types.js";

export type AuthorizationClient =
  Pick<
    ComplianceEngineClient,
    | "getResource"
    | "listEvidenceForResource"
    | "requestAuthorization"
    | "recordAuthorizationDecision"
    | "getAuthorizationEffectiveness"
    | "revokeAuthorization"
  >;

const riskTiers =
  new Set<RiskTier>([
    "minimal",
    "limited",
    "high",
    "critical",
  ]);

export function minimumApprovalQuorum(
  riskTier: RiskTier,
): number {
  switch (riskTier) {
    case "minimal":
    case "limited":
      return 1;
    case "high":
      return 2;
    case "critical":
      return 3;
  }
}

export async function resolveAuthorizationPrerequisite(
  client: AuthorizationClient,
  deploymentContextResourceId: string,
): Promise<DeploymentAuthorizationPrerequisite> {
  const deployment =
    await client.getResource(
      deploymentContextResourceId,
    );

  if (
    deployment.resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "deployment authorization must target a deployment-context resource",
    );
  }

  const evidence =
    await client.listEvidenceForResource(
      deploymentContextResourceId,
    );

  const assessment =
    latestActiveAssessment(
      evidence,
    );

  if (!assessment) {
    throw new Error(
      "deployment authorization requires an active algorithmic impact assessment",
    );
  }

  const riskTier =
    assessment.metadata
      .riskTier;

  if (
    typeof riskTier !==
      "string" ||
    !riskTiers.has(
      riskTier as RiskTier,
    )
  ) {
    throw new Error(
      "impact assessment is missing a valid risk tier",
    );
  }

  const tier =
    riskTier as RiskTier;

  return {
    assessmentEvidenceId:
      assessment.id,
    assessmentCapturedAt:
      assessment.capturedAt,
    riskTier: tier,
    minimumApprovalQuorum:
      minimumApprovalQuorum(
        tier,
      ),
  };
}

export async function requestDeploymentAuthorization(
  client: AuthorizationClient,
  input: DeploymentAuthorizationRequest,
): Promise<AuthorizationRecord> {
  validateRequest(input);

  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );

  if (
    deployment.resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "deployment authorization must target a deployment-context resource",
    );
  }

  const prerequisite =
    await resolveAuthorizationPrerequisite(
      client,
      input.deploymentContextResourceId,
    );

  const quorum =
    input.approvalQuorum ??
    prerequisite.minimumApprovalQuorum;

  if (
    quorum <
    prerequisite.minimumApprovalQuorum
  ) {
    throw new Error(
      "approval quorum is below the minimum for " +
        prerequisite.riskTier +
        " residual risk",
    );
  }

  const distinctApprovers =
    new Set(
      input.eligibleApproverPrincipalIds,
    );

  if (
    distinctApprovers.size <
    quorum
  ) {
    throw new Error(
      "eligible approvers must be sufficient to satisfy the approval quorum",
    );
  }

  const emergency =
    (input.mode ??
      "standard") ===
    "emergency";

  return client.requestAuthorization({
    resourceId:
      input.deploymentContextResourceId,
    authorizationType:
      "algorithmic-deployment",
    requestedByPrincipalId:
      input.requestedByPrincipalId,
    ...(input.validFrom
      ? {
          validFrom:
            input.validFrom,
        }
      : {}),
    validUntil:
      input.validUntil,
    scope: jsonObject({
      deploymentContextResourceId:
        input.deploymentContextResourceId,
      algorithmicSystemResourceId:
        deployment.attributes
          .algorithmicSystemResourceId ??
        null,
      modelVersionResourceId:
        deployment.attributes
          .modelVersionResourceId ??
        null,
      purpose:
        deployment.attributes
          .purpose ??
        null,
    }),
    conditions:
      jsonObject(
        input.conditions,
      ),
    approvalQuorum:
      quorum,
    approvalAuthority:
      input.approvalAuthority,
    eligibleApproverPrincipalIds:
      [
        ...distinctApprovers,
      ],
    emergency,
    ...(emergency
      ? {
          emergencyReviewDueAt:
            input.emergencyReviewDueAt!,
        }
      : {}),
    metadata: jsonObject({
      accountabilityDomain:
        "algorithmic-accountability",
      authorizationKind:
        "deployment",
      assessmentEvidenceId:
        prerequisite.assessmentEvidenceId,
      assessmentCapturedAt:
        prerequisite.assessmentCapturedAt,
      residualRiskTier:
        prerequisite.riskTier,
      mode:
        input.mode ??
        "standard",
      ...(input.emergencyJustification
        ? {
            emergencyJustification:
              input.emergencyJustification,
          }
        : {}),
    }),
    ...(input.correlationId
      ? {
          correlationId:
            input.correlationId,
        }
      : {}),
  });
}

export async function recordDeploymentAuthorizationDecision(
  client: AuthorizationClient,
  authorizationId: string,
  input: {
    principalId: string;
    decision:
      | "approve"
      | "deny";
    rationale: string;
    correlationId?: string;
  },
): Promise<AuthorizationRecord> {
  if (
    input.rationale.trim() ===
    ""
  ) {
    throw new Error(
      "authorization decision rationale is required",
    );
  }

  return client.recordAuthorizationDecision(
    authorizationId,
    {
      principalId:
        input.principalId,
      decision:
        input.decision,
      rationale:
        input.rationale.trim(),
      ...(input.correlationId
        ? {
            correlationId:
              input.correlationId,
          }
        : {}),
    },
  );
}

export async function getDeploymentAuthorizationEffectiveness(
  client: AuthorizationClient,
  authorizationId: string,
  at?: string,
): Promise<AuthorizationEffectiveness> {
  return client.getAuthorizationEffectiveness(
    authorizationId,
    at,
  );
}

export async function revokeDeploymentAuthorization(
  client: AuthorizationClient,
  authorizationId: string,
  input: {
    principalId: string;
    reason: string;
    correlationId?: string;
  },
): Promise<AuthorizationRecord> {
  if (
    input.reason.trim() ===
    ""
  ) {
    throw new Error(
      "revocation reason is required",
    );
  }

  return client.revokeAuthorization(
    authorizationId,
    {
      principalId:
        input.principalId,
      reason:
        input.reason.trim(),
      ...(input.correlationId
        ? {
            correlationId:
              input.correlationId,
          }
        : {}),
    },
  );
}

function latestActiveAssessment(
  evidence: Evidence[],
): Evidence | null {
  return (
    evidence
      .filter(
        (item) =>
          item.evidenceType ===
            "algorithmic-impact-assessment" &&
          item.status ===
            "active",
      )
      .sort(
        (a, b) =>
          assessmentTime(b) -
          assessmentTime(a),
      )[0] ?? null
  );
}

function assessmentTime(
  evidence: Evidence,
): number {
  const value =
    evidence.capturedAt ??
    evidence.createdAt;
  return Date.parse(value);
}

function validateRequest(
  input: DeploymentAuthorizationRequest,
): void {
  required(
    input.deploymentContextResourceId,
    "deploymentContextResourceId",
  );
  required(
    input.requestedByPrincipalId,
    "requestedByPrincipalId",
  );
  required(
    input.approvalAuthority,
    "approvalAuthority",
  );
  required(
    input.validUntil,
    "validUntil",
  );
  required(
    input.conditions
      .allowedPurpose,
    "conditions.allowedPurpose",
  );

  validDate(
    input.validUntil,
    "validUntil",
  );

  if (input.validFrom) {
    validDate(
      input.validFrom,
      "validFrom",
    );
    if (
      Date.parse(
        input.validUntil,
      ) <=
      Date.parse(
        input.validFrom,
      )
    ) {
      throw new Error(
        "validUntil must be after validFrom",
      );
    }
  }

  if (
    input.eligibleApproverPrincipalIds
      .length === 0
  ) {
    throw new Error(
      "at least one eligible approver is required",
    );
  }

  const mode =
    input.mode ??
    "standard";

  if (
    mode === "emergency"
  ) {
    if (
      !input.emergencyReviewDueAt
    ) {
      throw new Error(
        "emergencyReviewDueAt is required for emergency authorization",
      );
    }
    if (
      !input.emergencyJustification ||
      input.emergencyJustification
        .trim() === ""
    ) {
      throw new Error(
        "emergencyJustification is required for emergency authorization",
      );
    }
    validDate(
      input.emergencyReviewDueAt,
      "emergencyReviewDueAt",
    );
    if (
      Date.parse(
        input.emergencyReviewDueAt,
      ) >
      Date.parse(
        input.validUntil,
      )
    ) {
      throw new Error(
        "emergency review must be due no later than authorization expiration",
      );
    }
  }
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

function jsonObject(
  value: unknown,
): JsonObject {
  return JSON.parse(
    JSON.stringify(value),
  ) as JsonObject;
}
