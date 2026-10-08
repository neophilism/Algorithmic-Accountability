import type {
  ComplianceReport,
  Deadline,
  DeadlineStatusSnapshot,
  Evidence,
  Finding,
  Resource,
} from "@caiae/sdk";

export interface DeploymentDeadlineReport {
  deadline: Deadline;
  status: DeadlineStatusSnapshot;
}

export interface DeploymentAccountabilityReport {
  generatedAt: string;
  asOf: string;
  deployment: Resource;
  engineReport: ComplianceReport;
  assessments: Evidence[];
  monitoringEvidence: Evidence[];
  incidentEvidence: Evidence[];
  findings: Finding[];
  certifications: Array<Record<string, unknown>>;
  deadlines: DeploymentDeadlineReport[];
  metrics: {
    openFindings: number;
    blockingFindings: number;
    overdueDeadlines: number;
    activeAssessments: number;
    monitoringObservations: number;
    validCertifications: number;
  };
}

export type PublicDeploymentField =
  | "purpose"
  | "decisionDomain"
  | "humanRole"
  | "decisionEffect"
  | "appealOrReviewAvailable";

export interface PublicAccountabilitySummary {
  schemaVersion: "1";
  generatedAt: string;
  deployment: {
    id: string;
    name: string;
    status: string;
    externalRef: string | null;
    attributes: Record<string, unknown>;
  };
  accountability: {
    openFindings: number;
    blockingFindings: number;
    overdueDeadlines: number;
    activeAssessments: number;
    monitoringObservations: number;
    validCertifications: number;
  };
}

export interface AccountabilityCertificationInput {
  deploymentContextResourceId: string;
  certificationType: string;
  supportingCheckId: string;
  issuedByPrincipalId: string;
  policyAuthority: string;
  validFrom?: string;
  validUntil?: string;
  validitySeconds?: number;
  maximumCheckAgeSeconds?: number;
  blockingFindingSeverities?: Array<
    "info" | "low" | "medium" | "high" | "critical"
  >;
  conditions?: Record<string, unknown>;
  correlationId?: string;
}
