import type {
  accountabilityDimensions,
} from "@algorithmic-accountability/policy";

export type AccountabilityDimension =
  (typeof accountabilityDimensions)[number];

export type AssessmentStatus =
  | "satisfied"
  | "partial"
  | "not-satisfied"
  | "not-applicable";

export type HarmSeverity =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export type HarmLikelihood =
  | "rare"
  | "unlikely"
  | "possible"
  | "likely"
  | "almost-certain";

export type RiskTier =
  | "minimal"
  | "limited"
  | "high"
  | "critical";

export interface DimensionAssessment {
  status: AssessmentStatus;
  rationale: string;
}

export interface ForeseeableHarm {
  category: string;
  description: string;
  affectedGroup: string;
  severity: HarmSeverity;
  likelihood: HarmLikelihood;
  mitigation: string;
  residualSeverity?: HarmSeverity;
  residualLikelihood?: HarmLikelihood;
}

export interface ImpactAssessmentInput {
  deploymentContextResourceId: string;
  assessmentId: string;
  title: string;
  assessor: string;
  assessedAt: string;
  intendedBenefits: string[];
  foreseeableHarms: ForeseeableHarm[];
  dimensions: Record<
    AccountabilityDimension,
    DimensionAssessment
  >;
  overallRationale: string;
  sourceUris?: string[];
  supersedesEvidenceId?: string;
}

export interface AssessmentCompletenessIssue {
  code:
    | "missing-benefit"
    | "missing-harm-analysis"
    | "missing-dimension-rationale"
    | "missing-overall-rationale"
    | "invalid-date"
    | "invalid-source-uri";
  path: string;
  message: string;
}

export interface ClassifiedRisk {
  tier: RiskTier;
  grossScore: number;
  residualScore: number;
  highestGrossHarmIndex: number | null;
  highestResidualHarmIndex: number | null;
}
