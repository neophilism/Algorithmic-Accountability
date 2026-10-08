import type {
  ComplianceEngineClient,
  Finding,
  FindingView,
  JsonObject,
  Resource,
} from "@caiae/sdk";

import type {
  CorrectiveActionPlanInput,
  DeploymentRetirementInput,
  OperationalResumptionInput,
  OperationalSuspensionInput,
} from "./types.js";

export type CorrectiveActionClient =
  Pick<
    ComplianceEngineClient,
    | "getFinding"
    | "createRemediation"
    | "startRemediation"
    | "submitRemediationForVerification"
    | "verifyRemediation"
    | "rejectRemediation"
    | "cancelRemediation"
    | "closeFinding"
    | "reopenFinding"
    | "getResource"
    | "updateResource"
    | "createEvidence"
    | "listFindingsForResource"
    | "getAuthorizationEffectiveness"
  >;

export async function createCorrectiveActionPlan(
  client: CorrectiveActionClient,
  input: CorrectiveActionPlanInput,
): Promise<FindingView> {
  required(
    input.findingId,
    "findingId",
  );
  required(
    input.createdByPrincipalId,
    "createdByPrincipalId",
  );
  required(
    input.plan,
    "plan",
  );

  if (input.dueAt) {
    validDate(
      input.dueAt,
      "dueAt",
    );
  }

  const finding =
    await client.getFinding(
      input.findingId,
    );

  if (
    finding.finding.status ===
      "closed" ||
    finding.finding.status ===
      "resolved"
  ) {
    throw new Error(
      "cannot create corrective action for a closed or resolved finding",
    );
  }

  return client.createRemediation(
    input.findingId,
    {
      createdByPrincipalId:
        input.createdByPrincipalId,
      ...(input.ownerPrincipalId
        ? {
            ownerPrincipalId:
              input.ownerPrincipalId,
          }
        : {}),
      plan:
        input.plan.trim(),
      ...(input.dueAt
        ? {
            dueAt:
              input.dueAt,
          }
        : {}),
      ...(input.warningWindowSeconds !==
      undefined
        ? {
            warningWindowSeconds:
              input.warningWindowSeconds,
          }
        : {}),
      ...(input.gracePeriodSeconds !==
      undefined
        ? {
            gracePeriodSeconds:
              input.gracePeriodSeconds,
          }
        : {}),
      ...(input.escalationAfterSeconds
        ? {
            escalationAfterSeconds:
              input.escalationAfterSeconds,
          }
        : {}),
      metadata: {
        accountabilityDomain:
          "algorithmic-accountability",
        correctiveActionKind:
          "finding-remediation",
      },
      ...(input.correlationId
        ? {
            correlationId:
              input.correlationId,
          }
        : {}),
    },
  );
}

export async function startCorrectiveAction(
  client: CorrectiveActionClient,
  remediationId: string,
  principalId: string,
  correlationId?: string,
): Promise<FindingView> {
  return client.startRemediation(
    remediationId,
    {
      principalId,
      ...(correlationId
        ? { correlationId }
        : {}),
    },
  );
}

export async function submitCorrectiveActionForVerification(
  client: CorrectiveActionClient,
  remediationId: string,
  principalId: string,
  correlationId?: string,
): Promise<FindingView> {
  return client.submitRemediationForVerification(
    remediationId,
    {
      principalId,
      ...(correlationId
        ? { correlationId }
        : {}),
    },
  );
}

export async function verifyCorrectiveAction(
  client: CorrectiveActionClient,
  remediationId: string,
  input: {
    principalId: string;
    note?: string;
    correlationId?: string;
  },
): Promise<FindingView> {
  return client.verifyRemediation(
    remediationId,
    {
      principalId:
        input.principalId,
      ...(input.note
        ? {
            note:
              input.note.trim(),
          }
        : {}),
      ...(input.correlationId
        ? {
            correlationId:
              input.correlationId,
          }
        : {}),
    },
  );
}

export async function rejectCorrectiveAction(
  client: CorrectiveActionClient,
  remediationId: string,
  input: {
    principalId: string;
    reason: string;
    correlationId?: string;
  },
): Promise<FindingView> {
  required(
    input.reason,
    "rejection reason",
  );

  return client.rejectRemediation(
    remediationId,
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

export async function cancelCorrectiveAction(
  client: CorrectiveActionClient,
  remediationId: string,
  input: {
    principalId: string;
    reason: string;
    correlationId?: string;
  },
): Promise<FindingView> {
  required(
    input.reason,
    "cancellation reason",
  );

  return client.cancelRemediation(
    remediationId,
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

export async function closeRemediatedFinding(
  client: CorrectiveActionClient,
  findingId: string,
  principalId: string,
  correlationId?: string,
): Promise<FindingView> {
  const view =
    await client.getFinding(
      findingId,
    );

  const activeRemediations =
    view.remediations.filter(
      (remediation) =>
        remediation.status !==
        "cancelled",
    );

  if (
    activeRemediations.length ===
      0 ||
    activeRemediations.some(
      (remediation) =>
        remediation.status !==
        "verified",
    )
  ) {
    throw new Error(
      "finding cannot close until every active remediation is verified",
    );
  }

  return client.closeFinding(
    findingId,
    {
      principalId,
      ...(correlationId
        ? { correlationId }
        : {}),
    },
  );
}

export async function reopenAccountabilityFinding(
  client: CorrectiveActionClient,
  findingId: string,
  principalId: string,
  correlationId?: string,
): Promise<FindingView> {
  return client.reopenFinding(
    findingId,
    {
      principalId,
      ...(correlationId
        ? { correlationId }
        : {}),
    },
  );
}

export async function suspendDeploymentOperation(
  client: CorrectiveActionClient,
  input: OperationalSuspensionInput,
): Promise<{
  resource: Resource;
  evidenceId: string;
}> {
  validateSuspension(input);

  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );
  requireDeploymentContext(
    deployment,
  );

  if (
    deployment.status ===
    "archived"
  ) {
    throw new Error(
      "retired deployment cannot be operationally suspended",
    );
  }

  const updated =
    await client.updateResource(
      deployment.id,
      {
        expectedUpdatedAt:
          deployment.updatedAt,
        status: "inactive",
        metadata:
          mergeMetadata(
            deployment.metadata,
            {
              operationallySuspended:
                true,
              operationalSuspendedAt:
                input.suspendedAt,
              operationalSuspendedByPrincipalId:
                input.principalId,
            },
          ),
        ...(input.correlationId
          ? {
              correlationId:
                input.correlationId,
            }
          : {}),
      },
    );

  const evidence =
    await client.createEvidence({
      resourceId:
        deployment.id,
      evidenceType:
        "algorithmic-operational-suspension",
      title:
        "Operational suspension",
      source:
        "algorithmic-accountability",
      capturedAt:
        input.suspendedAt,
      provenance: {
        principalId:
          input.principalId,
      },
      attributes: jsonObject({
        reason:
          input.reason.trim(),
        ...(input.findingId
          ? {
              findingId:
                input.findingId,
            }
          : {}),
        ...(input.authorizationId
          ? {
              authorizationId:
                input.authorizationId,
            }
          : {}),
      }),
      metadata: {
        accountabilityDomain:
          "algorithmic-accountability",
        evidenceKind:
          "operational-suspension",
      },
      ...(input.correlationId
        ? {
            correlationId:
              input.correlationId,
          }
        : {}),
    });

  return {
    resource: updated,
    evidenceId:
      evidence.evidence.id,
  };
}

export async function resumeDeploymentOperation(
  client: CorrectiveActionClient,
  input: OperationalResumptionInput,
): Promise<{
  resource: Resource;
  evidenceId: string;
}> {
  required(
    input.rationale,
    "resumption rationale",
  );
  validDate(
    input.resumedAt,
    "resumedAt",
  );

  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );
  requireDeploymentContext(
    deployment,
  );

  if (
    deployment.status !==
    "inactive"
  ) {
    throw new Error(
      "only an inactive deployment can be resumed",
    );
  }

  const blocking =
    await client.listFindingsForResource(
      deployment.id,
    );

  if (
    blocking.some(
      isBlockingFinding,
    )
  ) {
    throw new Error(
      "deployment cannot resume while blocking findings remain open",
    );
  }

  if (
    input.authorizationId
  ) {
    const effectiveness =
      await client.getAuthorizationEffectiveness(
        input.authorizationId,
        input.resumedAt,
      );

    if (
      !effectiveness.effective
    ) {
      throw new Error(
        "deployment cannot resume without effective authorization",
      );
    }
  }

  const updated =
    await client.updateResource(
      deployment.id,
      {
        expectedUpdatedAt:
          deployment.updatedAt,
        status: "active",
        metadata:
          mergeMetadata(
            deployment.metadata,
            {
              operationallySuspended:
                false,
              operationalResumedAt:
                input.resumedAt,
              operationalResumedByPrincipalId:
                input.principalId,
            },
          ),
        ...(input.correlationId
          ? {
              correlationId:
                input.correlationId,
            }
          : {}),
      },
    );

  const evidence =
    await client.createEvidence({
      resourceId:
        deployment.id,
      evidenceType:
        "algorithmic-operational-resumption",
      title:
        "Operational resumption",
      source:
        "algorithmic-accountability",
      capturedAt:
        input.resumedAt,
      provenance: {
        principalId:
          input.principalId,
      },
      attributes: jsonObject({
        rationale:
          input.rationale.trim(),
        ...(input.authorizationId
          ? {
              authorizationId:
                input.authorizationId,
            }
          : {}),
      }),
      metadata: {
        accountabilityDomain:
          "algorithmic-accountability",
        evidenceKind:
          "operational-resumption",
      },
      ...(input.correlationId
        ? {
            correlationId:
              input.correlationId,
          }
        : {}),
    });

  return {
    resource: updated,
    evidenceId:
      evidence.evidence.id,
  };
}

export async function retireDeployment(
  client: CorrectiveActionClient,
  input: DeploymentRetirementInput,
): Promise<{
  resource: Resource;
  evidenceId: string;
}> {
  required(
    input.reason,
    "retirement reason",
  );
  validDate(
    input.retiredAt,
    "retiredAt",
  );

  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );
  requireDeploymentContext(
    deployment,
  );

  if (
    input.replacementDeploymentContextResourceId
  ) {
    const replacement =
      await client.getResource(
        input.replacementDeploymentContextResourceId,
      );
    requireDeploymentContext(
      replacement,
    );

    if (
      replacement.id ===
      deployment.id
    ) {
      throw new Error(
        "replacement deployment must be different from retired deployment",
      );
    }
  }

  const updated =
    await client.updateResource(
      deployment.id,
      {
        expectedUpdatedAt:
          deployment.updatedAt,
        status: "archived",
        metadata:
          mergeMetadata(
            deployment.metadata,
            {
              retiredAt:
                input.retiredAt,
              retiredByPrincipalId:
                input.principalId,
              ...(input.replacementDeploymentContextResourceId
                ? {
                    replacementDeploymentContextResourceId:
                      input.replacementDeploymentContextResourceId,
                  }
                : {}),
            },
          ),
        ...(input.correlationId
          ? {
              correlationId:
                input.correlationId,
            }
          : {}),
      },
    );

  const evidence =
    await client.createEvidence({
      resourceId:
        deployment.id,
      evidenceType:
        "algorithmic-deployment-retirement",
      title:
        "Deployment retired",
      source:
        "algorithmic-accountability",
      capturedAt:
        input.retiredAt,
      provenance: {
        principalId:
          input.principalId,
      },
      attributes: jsonObject({
        reason:
          input.reason.trim(),
        ...(input.replacementDeploymentContextResourceId
          ? {
              replacementDeploymentContextResourceId:
                input.replacementDeploymentContextResourceId,
            }
          : {}),
      }),
      metadata: {
        accountabilityDomain:
          "algorithmic-accountability",
        evidenceKind:
          "deployment-retirement",
      },
      ...(input.correlationId
        ? {
            correlationId:
              input.correlationId,
          }
        : {}),
    });

  return {
    resource: updated,
    evidenceId:
      evidence.evidence.id,
  };
}

function isBlockingFinding(
  finding: Finding,
): boolean {
  return (
    finding.status !==
      "closed" &&
    finding.status !==
      "resolved" &&
    (finding.severity ===
      "critical" ||
      finding.severity ===
        "high")
  );
}

function requireDeploymentContext(
  resource: Resource,
): void {
  if (
    resource.resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "corrective operational action must target a deployment-context resource",
    );
  }
}

function validateSuspension(
  input: OperationalSuspensionInput,
): void {
  required(
    input.principalId,
    "principalId",
  );
  required(
    input.reason,
    "suspension reason",
  );
  validDate(
    input.suspendedAt,
    "suspendedAt",
  );
}

function mergeMetadata(
  existing: JsonObject,
  additions: JsonObject,
): JsonObject {
  return {
    ...existing,
    ...additions,
  };
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
