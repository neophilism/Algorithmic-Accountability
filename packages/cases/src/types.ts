import type {
  Finding,
} from "@caiae/sdk";

export type AccountabilityCaseKind =
  | "complaint"
  | "incident";

export type AccountabilityCaseSeverity =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export type ReporterType =
  | "affected-person"
  | "internal"
  | "monitoring"
  | "auditor"
  | "public"
  | "other";

export interface AccountabilityCaseInput {
  deploymentContextResourceId: string;
  caseId: string;
  kind: AccountabilityCaseKind;
  title: string;
  summary: string;
  reportedAt: string;
  reporterType: ReporterType;
  severity: AccountabilityCaseSeverity;
  modelVersionResourceId?: string;
  relatedAuthorizationId?: string;
  sourceUris?: string[];
}

export type CaseReviewOutcome =
  | "substantiated"
  | "unsubstantiated";

export interface AccountabilityCaseReviewInput {
  deploymentContextResourceId: string;
  caseEvidenceId: string;
  outcome: CaseReviewOutcome;
  reviewedAt: string;
  reviewedByPrincipalId: string;
  rationale: string;
  correlationId?: string;
}

export interface AccountabilityCaseReviewResult {
  reviewEvidenceId: string;
  checkId: string;
  checkStatus: string;
  findings: Finding[];
  reassessmentTriggered: boolean;
}
