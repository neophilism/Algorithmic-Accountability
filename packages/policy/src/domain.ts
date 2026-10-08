export const algorithmicAccountabilityResourceTypes = {
  "algorithmic-system": {
    label: "Algorithmic system",
    purpose:
      "Identifies the model, rules engine, scoring system, ranking system, or automated decision capability being governed.",
  },
  "deployment-context": {
    label: "Deployment context",
    purpose:
      "Separates a system from a specific use, affected population, decision process, operator, and purpose so authorization can be context-specific.",
  },
  "model-version": {
    label: "Model version",
    purpose:
      "Identifies a materially distinguishable release so changes can trigger reassessment without rewriting prior history.",
  },
} as const;

export type AlgorithmicAccountabilityResourceType =
  keyof typeof algorithmicAccountabilityResourceTypes;

export const accountabilityLifecycle = [
  "inventory",
  "impact-assessment",
  "authorization",
  "deployment",
  "monitoring",
  "reassessment",
  "finding",
  "remediation",
  "renewal-or-retirement",
] as const;

export type AccountabilityLifecycleStage =
  (typeof accountabilityLifecycle)[number];

export const accountabilityDimensions = [
  "purpose-limitation",
  "affected-population",
  "human-review",
  "data-governance",
  "privacy",
  "security",
  "performance",
  "fairness",
  "explainability",
  "contestability",
  "accessibility",
  "recordkeeping",
] as const;

export const reassessmentTriggers = [
  "material-model-change",
  "material-data-change",
  "material-purpose-change",
  "material-population-change",
  "material-decision-process-change",
  "new-harm-or-incident",
  "monitoring-threshold-breach",
  "scheduled-review",
] as const;

export const frameworkMetadata = {
  sourceStatus: "policy-framework",
  legalAuthorityAssumed: false,
  primaryControl:
    "authorization-before-deployment",
  invariant:
    "Prior accountability history remains append-only when systems, versions, assessments, or authorization decisions change.",
} as const;
