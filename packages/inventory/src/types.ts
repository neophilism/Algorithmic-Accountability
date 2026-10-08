export type AlgorithmicSystemKind =
  | "predictive-model"
  | "classification"
  | "ranking"
  | "scoring"
  | "recommendation"
  | "generative"
  | "optimization"
  | "rules-engine"
  | "hybrid"
  | "other";

export type InventoryLifecycleState =
  | "development"
  | "validation"
  | "active"
  | "paused"
  | "retired";

export type ProviderType =
  | "internal"
  | "vendor"
  | "open-source"
  | "mixed";

export type HumanRole =
  | "decision-maker"
  | "reviewer"
  | "override-capable"
  | "appeal-review"
  | "none";

export type DecisionEffect =
  | "informational"
  | "recommendation"
  | "ranking"
  | "screening"
  | "eligibility"
  | "allocation"
  | "enforcement"
  | "other";

export interface AlgorithmicSystemInventoryInput {
  externalRef: string;
  name: string;
  description: string;
  systemKind: AlgorithmicSystemKind;
  primaryFunction: string;
  ownerUnit: string;
  providerType: ProviderType;
  providerName?: string;
  lifecycleState: InventoryLifecycleState;
  documentationUrls?: string[];
  provenanceSummary?: string;
}

export interface ModelVersionInventoryInput {
  externalRef: string;
  name: string;
  algorithmicSystemResourceId: string;
  versionLabel: string;
  lifecycleState: InventoryLifecycleState;
  releasedAt?: string;
  previousModelVersionResourceId?: string;
  changeSummary: string;
  codeRevision?: string;
  modelArtifactDigest?: string;
  trainingDataVersion?: string;
}

export interface DeploymentContextInventoryInput {
  externalRef: string;
  name: string;
  algorithmicSystemResourceId: string;
  modelVersionResourceId: string;
  purpose: string;
  decisionProcess: string;
  decisionDomain: string;
  affectedPopulationDescription: string;
  operatorUnit: string;
  geographicScope: string;
  humanRole: HumanRole;
  decisionEffect: DecisionEffect;
  inputDataCategories: string[];
  outputDescription: string;
  plannedStartAt?: string;
  plannedEndAt?: string;
  appealOrReviewAvailable: boolean;
}

export type InventoryRecordInput =
  | {
      kind: "algorithmic-system";
      value: AlgorithmicSystemInventoryInput;
    }
  | {
      kind: "model-version";
      value: ModelVersionInventoryInput;
    }
  | {
      kind: "deployment-context";
      value: DeploymentContextInventoryInput;
    };
