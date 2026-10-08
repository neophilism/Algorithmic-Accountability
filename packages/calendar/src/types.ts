export type AccountabilityDeadlineKind =
  | "impact-assessment"
  | "reassessment"
  | "monitoring-review"
  | "remediation"
  | "authorization-renewal"
  | "retirement-closeout";

export interface AccountabilityDeadlineInput {
  deploymentContextResourceId: string;
  kind: AccountabilityDeadlineKind;
  dueAt: string;
  createdByPrincipalId?: string;
  warningWindowSeconds?: number;
  gracePeriodSeconds?: number;
  escalationAfterSeconds?: number[];
  recurrenceIntervalSeconds?: number;
  recurrenceEndAt?: string;
  maxOccurrences?: number;
  relatedAuthorizationId?: string;
  relatedFindingId?: string;
  correlationId?: string;
}

export interface RenewalReadinessInput {
  deploymentContextResourceId: string;
  authorizationId: string;
  asOf: string;
  assessmentMaxAgeSeconds?: number;
  monitoringObservationMaxAgeSeconds?: number;
}

export interface RenewalReadinessCheck {
  key:
    | "deployment-active"
    | "authorization-matches-deployment"
    | "authorization-currently-effective"
    | "active-impact-assessment"
    | "assessment-current"
    | "no-blocking-findings"
    | "monitoring-evidence";
  passed: boolean;
  detail: string;
}

export interface RenewalReadiness {
  eligible: boolean;
  checks: RenewalReadinessCheck[];
  assessmentEvidenceId: string | null;
  latestMonitoringEvidenceId: string | null;
}
