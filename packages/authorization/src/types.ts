import type {
  RiskTier,
} from "@algorithmic-accountability/assessment";

export type DeploymentAuthorizationMode =
  | "standard"
  | "emergency";

export interface DeploymentAuthorizationConditions {
  allowedPurpose: string;
  humanReviewRequired: boolean;
  appealOrReviewRequired: boolean;
  monitoringRequired: boolean;
  prohibitedUses: string[];
  additionalConditions?: string[];
}

export interface DeploymentAuthorizationRequest {
  deploymentContextResourceId: string;
  requestedByPrincipalId: string;
  eligibleApproverPrincipalIds: string[];
  approvalAuthority: string;
  validFrom?: string;
  validUntil: string;
  approvalQuorum?: number;
  conditions: DeploymentAuthorizationConditions;
  mode?: DeploymentAuthorizationMode;
  emergencyReviewDueAt?: string;
  emergencyJustification?: string;
  correlationId?: string;
}

export interface DeploymentAuthorizationPrerequisite {
  assessmentEvidenceId: string;
  assessmentCapturedAt: string | null;
  riskTier: RiskTier;
  minimumApprovalQuorum: number;
}
