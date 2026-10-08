import type {
  ComplianceEngineClient,
  Deadline,
  DeadlineStatusSnapshot,
  DeadlineView,
  Evidence,
  Finding,
} from "@caiae/sdk";

import type {
  AccountabilityDeadlineInput,
  RenewalReadiness,
  RenewalReadinessInput,
} from "./types.js";

export type CalendarClient =
  Pick<
    ComplianceEngineClient,
    | "createDeadline"
    | "getDeadlineStatus"
    | "listDeadlinesBySubject"
    | "satisfyDeadline"
    | "cancelDeadline"
    | "getResource"
    | "getAuthorization"
    | "listEvidenceForResource"
    | "listFindingsForResource"
  >;

const DEADLINE_PREFIX =
  "algorithmic-accountability.";

export async function scheduleAccountabilityDeadline(
  client: CalendarClient,
  input: AccountabilityDeadlineInput,
): Promise<DeadlineView> {
  validateDeadlineInput(input);

  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );

  if (
    deployment.resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "accountability deadlines must target a deployment-context resource",
    );
  }

  if (
    deployment.status ===
    "archived" &&
    input.kind !==
      "retirement-closeout"
  ) {
    throw new Error(
      "only retirement closeout deadlines may be added to an archived deployment",
    );
  }

  return client.createDeadline({
    resourceId:
      input.deploymentContextResourceId,
    subjectType:
      "deployment-context",
    subjectId:
      input.deploymentContextResourceId,
    deadlineType:
      DEADLINE_PREFIX +
      input.kind,
    dueAt: input.dueAt,
    ...(input.createdByPrincipalId
      ? {
          createdByPrincipalId:
            input.createdByPrincipalId,
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
    ...(input.recurrenceIntervalSeconds !==
    undefined
      ? {
          recurrenceIntervalSeconds:
            input.recurrenceIntervalSeconds,
        }
      : {}),
    ...(input.recurrenceEndAt
      ? {
          recurrenceEndAt:
            input.recurrenceEndAt,
        }
      : {}),
    ...(input.maxOccurrences !==
    undefined
      ? {
          maxOccurrences:
            input.maxOccurrences,
        }
      : {}),
    metadata: {
      accountabilityDomain:
        "algorithmic-accountability",
      deadlineKind: input.kind,
      ...(input.relatedAuthorizationId
        ? {
            relatedAuthorizationId:
              input.relatedAuthorizationId,
          }
        : {}),
      ...(input.relatedFindingId
        ? {
            relatedFindingId:
              input.relatedFindingId,
          }
        : {}),
    },
    ...(input.correlationId
      ? {
          correlationId:
            input.correlationId,
        }
      : {}),
  });
}

export function scheduleImpactAssessmentDeadline(
  client: CalendarClient,
  input: Omit<
    AccountabilityDeadlineInput,
    "kind"
  >,
) {
  return scheduleAccountabilityDeadline(
    client,
    {
      ...input,
      kind: "impact-assessment",
    },
  );
}

export function scheduleReassessmentDeadline(
  client: CalendarClient,
  input: Omit<
    AccountabilityDeadlineInput,
    "kind"
  >,
) {
  return scheduleAccountabilityDeadline(
    client,
    {
      ...input,
      kind: "reassessment",
    },
  );
}

export function scheduleMonitoringReviewDeadline(
  client: CalendarClient,
  input: Omit<
    AccountabilityDeadlineInput,
    "kind"
  >,
) {
  return scheduleAccountabilityDeadline(
    client,
    {
      ...input,
      kind: "monitoring-review",
    },
  );
}

export function scheduleAuthorizationRenewalDeadline(
  client: CalendarClient,
  input: Omit<
    AccountabilityDeadlineInput,
    "kind"
  > & {
    relatedAuthorizationId: string;
  },
) {
  return scheduleAccountabilityDeadline(
    client,
    {
      ...input,
      kind:
        "authorization-renewal",
    },
  );
}

export function scheduleRemediationDeadline(
  client: CalendarClient,
  input: Omit<
    AccountabilityDeadlineInput,
    "kind"
  > & {
    relatedFindingId: string;
  },
) {
  return scheduleAccountabilityDeadline(
    client,
    {
      ...input,
      kind: "remediation",
    },
  );
}

export function scheduleRetirementCloseoutDeadline(
  client: CalendarClient,
  input: Omit<
    AccountabilityDeadlineInput,
    "kind"
  >,
) {
  return scheduleAccountabilityDeadline(
    client,
    {
      ...input,
      kind: "retirement-closeout",
    },
  );
}

export function listDeploymentDeadlines(
  client: CalendarClient,
  deploymentContextResourceId: string,
): Promise<Deadline[]> {
  return client.listDeadlinesBySubject(
    "deployment-context",
    deploymentContextResourceId,
  );
}

export function getAccountabilityDeadlineStatus(
  client: CalendarClient,
  deadlineId: string,
  at?: string,
): Promise<DeadlineStatusSnapshot> {
  return client.getDeadlineStatus(
    deadlineId,
    at,
  );
}

export function satisfyAccountabilityDeadline(
  client: CalendarClient,
  deadlineId: string,
  principalId: string,
  satisfiedAt?: string,
  correlationId?: string,
): Promise<DeadlineView> {
  return client.satisfyDeadline(
    deadlineId,
    {
      principalId,
      ...(satisfiedAt
        ? { satisfiedAt }
        : {}),
      ...(correlationId
        ? { correlationId }
        : {}),
    },
  );
}

export function cancelAccountabilityDeadline(
  client: CalendarClient,
  deadlineId: string,
  principalId: string,
  reason: string,
  correlationId?: string,
): Promise<DeadlineView> {
  if (reason.trim() === "") {
    throw new Error(
      "deadline cancellation reason is required",
    );
  }

  return client.cancelDeadline(
    deadlineId,
    {
      principalId,
      reason: reason.trim(),
      ...(correlationId
        ? { correlationId }
        : {}),
    },
  );
}

export async function evaluateRenewalReadiness(
  client: CalendarClient,
  input: RenewalReadinessInput,
): Promise<RenewalReadiness> {
  validateDate(
    input.asOf,
    "asOf",
  );
  positiveOptional(
    input.assessmentMaxAgeSeconds,
    "assessmentMaxAgeSeconds",
  );
  positiveOptional(
    input.monitoringObservationMaxAgeSeconds,
    "monitoringObservationMaxAgeSeconds",
  );

  const [
    deployment,
    authorization,
    evidence,
    findings,
  ] = await Promise.all([
    client.getResource(
      input.deploymentContextResourceId,
    ),
    client.getAuthorization(
      input.authorizationId,
    ),
    client.listEvidenceForResource(
      input.deploymentContextResourceId,
    ),
    client.listFindingsForResource(
      input.deploymentContextResourceId,
    ),
  ]);

  const checks: RenewalReadiness["checks"] =
    [];

  const deploymentActive =
    deployment.resourceType ===
      "deployment-context" &&
    deployment.status === "active";

  checks.push({
    key: "deployment-active",
    passed: deploymentActive,
    detail: deploymentActive
      ? "deployment context is active"
      : "renewal requires an active deployment-context resource",
  });

  const authorizationMatches =
    authorization.authorization
      .resourceId ===
    deployment.id;

  checks.push({
    key:
      "authorization-matches-deployment",
    passed:
      authorizationMatches,
    detail: authorizationMatches
      ? "authorization belongs to this deployment"
      : "authorization belongs to a different resource",
  });

  const authorizationEffective =
    effectiveAuthorizationAt(
      authorization.authorization,
      input.asOf,
    );

  checks.push({
    key:
      "authorization-currently-effective",
    passed:
      authorizationEffective,
    detail:
      authorizationEffective
        ? "authorization is approved and within its validity window"
        : "authorization is not currently effective",
  });

  const assessment =
    latestActiveEvidence(
      evidence,
      "algorithmic-impact-assessment",
    );

  checks.push({
    key:
      "active-impact-assessment",
    passed:
      assessment !== null,
    detail: assessment
      ? "active impact assessment is available"
      : "renewal requires an active impact assessment",
  });

  const assessmentCurrent =
    assessment !== null &&
    evidenceWithinAge(
      assessment,
      input.asOf,
      input.assessmentMaxAgeSeconds,
    );

  checks.push({
    key: "assessment-current",
    passed: assessmentCurrent,
    detail:
      assessmentCurrent
        ? "impact assessment is within the required review window"
        : assessment
          ? "impact assessment is older than the configured renewal window"
          : "impact assessment currency cannot be established",
  });

  const blocking =
    findings.filter(
      isBlockingFinding,
    );

  checks.push({
    key:
      "no-blocking-findings",
    passed:
      blocking.length === 0,
    detail:
      blocking.length === 0
        ? "no unresolved high or critical findings"
        : String(
            blocking.length,
          ) +
          " unresolved high/critical finding(s) block renewal",
  });

  const monitoringRequired =
    authorization.authorization
      .conditions
      .monitoringRequired ===
    true;

  const monitoring =
    latestActiveEvidence(
      evidence,
      "algorithmic-monitoring-observation",
    );

  const monitoringCurrent =
    !monitoringRequired ||
    (monitoring !== null &&
      evidenceWithinAge(
        monitoring,
        input.asOf,
        input.monitoringObservationMaxAgeSeconds,
      ));

  checks.push({
    key:
      "monitoring-evidence",
    passed:
      monitoringCurrent,
    detail:
      !monitoringRequired
        ? "current authorization does not require monitoring evidence"
        : monitoringCurrent
          ? "required monitoring evidence is current"
          : "required monitoring evidence is missing or stale",
  });

  return {
    eligible:
      checks.every(
        (check) => check.passed,
      ),
    checks,
    assessmentEvidenceId:
      assessment?.id ?? null,
    latestMonitoringEvidenceId:
      monitoring?.id ?? null,
  };
}

function effectiveAuthorizationAt(
  authorization: {
    status: string;
    validFrom: string | null;
    validUntil: string | null;
  },
  at: string,
): boolean {
  if (
    authorization.status !==
    "approved"
  ) {
    return false;
  }

  const when =
    Date.parse(at);

  if (
    authorization.validFrom &&
    when <
      Date.parse(
        authorization.validFrom,
      )
  ) {
    return false;
  }

  if (
    authorization.validUntil &&
    when >=
      Date.parse(
        authorization.validUntil,
      )
  ) {
    return false;
  }

  return true;
}

function latestActiveEvidence(
  evidence: Evidence[],
  evidenceType: string,
): Evidence | null {
  return (
    evidence
      .filter(
        (item) =>
          item.evidenceType ===
            evidenceType &&
          item.status ===
            "active",
      )
      .sort(
        (a, b) =>
          evidenceTime(b) -
          evidenceTime(a),
      )[0] ?? null
  );
}

function evidenceWithinAge(
  evidence: Evidence,
  asOf: string,
  maxAgeSeconds?: number,
): boolean {
  if (
    maxAgeSeconds ===
    undefined
  ) {
    return true;
  }

  return (
    Date.parse(asOf) -
      evidenceTime(evidence) <=
    maxAgeSeconds * 1000
  );
}

function evidenceTime(
  evidence: Evidence,
): number {
  return Date.parse(
    evidence.capturedAt ??
      evidence.createdAt,
  );
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
      "high" ||
      finding.severity ===
        "critical")
  );
}

function validateDeadlineInput(
  input: AccountabilityDeadlineInput,
): void {
  required(
    input.deploymentContextResourceId,
    "deploymentContextResourceId",
  );
  validateDate(
    input.dueAt,
    "dueAt",
  );

  if (
    input.recurrenceIntervalSeconds !==
      undefined &&
    input.recurrenceIntervalSeconds <
      1
  ) {
    throw new Error(
      "recurrenceIntervalSeconds must be positive",
    );
  }

  if (
    input.recurrenceEndAt
  ) {
    validateDate(
      input.recurrenceEndAt,
      "recurrenceEndAt",
    );
    if (
      Date.parse(
        input.recurrenceEndAt,
      ) <
      Date.parse(
        input.dueAt,
      )
    ) {
      throw new Error(
        "recurrenceEndAt must not be before dueAt",
      );
    }
  }

  if (
    input.kind ===
      "authorization-renewal" &&
    !input.relatedAuthorizationId
  ) {
    throw new Error(
      "authorization renewal deadlines require relatedAuthorizationId",
    );
  }

  if (
    input.kind ===
      "remediation" &&
    !input.relatedFindingId
  ) {
    throw new Error(
      "remediation deadlines require relatedFindingId",
    );
  }
}

function validateDate(
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

function positiveOptional(
  value: number | undefined,
  label: string,
): void {
  if (
    value !== undefined &&
    (!Number.isFinite(value) ||
      value < 0)
  ) {
    throw new Error(
      label +
        " must be zero or greater",
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
