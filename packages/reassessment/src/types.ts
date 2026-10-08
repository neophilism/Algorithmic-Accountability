import type {
  reassessmentTriggers,
} from "@algorithmic-accountability/policy";

export type ReassessmentTrigger =
  (typeof reassessmentTriggers)[number];

export type AuthorizationContinuity =
  | "continues"
  | "review-required"
  | "reauthorization-required";

export interface DeploymentAccountabilitySnapshot {
  modelVersionResourceId: string;
  purpose: string;
  decisionProcess: string;
  affectedPopulationDescription: string;
  inputDataCategories: string[];
}

export interface ReassessmentDecision {
  reassessmentRequired: boolean;
  triggers: ReassessmentTrigger[];
  authorizationContinuity: AuthorizationContinuity;
  rationale: string;
}

export type OperationalReassessmentEvent =
  | {
      kind: "new-harm-or-incident";
      summary: string;
    }
  | {
      kind: "monitoring-threshold-breach";
      summary: string;
    }
  | {
      kind: "scheduled-review";
      summary: string;
    };

export interface RecordReassessmentTriggerInput {
  deploymentContextResourceId: string;
  observedAt: string;
  summary: string;
  decision: ReassessmentDecision;
  previousSnapshot?: DeploymentAccountabilitySnapshot;
  proposedSnapshot?: DeploymentAccountabilitySnapshot;
  relatedAuthorizationId?: string;
  priorAssessmentEvidenceId?: string;
  sourceUris?: string[];
}
