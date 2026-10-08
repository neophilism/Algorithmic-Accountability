export type MonitoringMetricCategory =
  | "performance"
  | "reliability"
  | "fairness"
  | "drift"
  | "data-quality"
  | "human-override"
  | "contestability";

export type MonitoringThreshold =
  | {
      kind: "minimum";
      value: number;
    }
  | {
      kind: "maximum";
      value: number;
    }
  | {
      kind: "range";
      minimum: number;
      maximum: number;
    };

export interface MonitoringMetricDefinition {
  metricId: string;
  label: string;
  category: MonitoringMetricCategory;
  unit: string;
  threshold: MonitoringThreshold;
  description: string;
}

export interface MonitoringPlanInput {
  deploymentContextResourceId: string;
  planId: string;
  title: string;
  owner: string;
  cadenceDescription: string;
  createdAt: string;
  validFrom?: string;
  validUntil?: string;
  metrics: MonitoringMetricDefinition[];
  sourceUris?: string[];
}

export interface MonitoringObservationValue {
  metricId: string;
  value: number;
  sampleSize?: number;
  segment?: string;
  notes?: string;
}

export interface MonitoringObservationInput {
  deploymentContextResourceId: string;
  monitoringPlanEvidenceId: string;
  observedAt: string;
  observationId: string;
  values: MonitoringObservationValue[];
  sourceUris?: string[];
}

export interface MonitoringBreach {
  metricId: string;
  label: string;
  category: MonitoringMetricCategory;
  observedValue: number;
  threshold: MonitoringThreshold;
}

export interface MonitoringEvaluation {
  passed: boolean;
  breaches: MonitoringBreach[];
}
