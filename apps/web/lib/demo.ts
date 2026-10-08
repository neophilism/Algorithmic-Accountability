import type {
  AccountabilityDashboardData,
} from "./dashboard";

export type DemoTimelineEvent = {
  at: string;
  kind:
    | "inventory"
    | "assessment"
    | "authorization"
    | "monitoring"
    | "reassessment"
    | "incident"
    | "finding"
    | "remediation"
    | "retirement";
  title: string;
  detail: string;
};

export type DemoDeploymentDetail = {
  id: string;
  name: string;
  subtitle: string;
  status:
    | "approved"
    | "conditional"
    | "blocked"
    | "reassessment"
    | "suspended";
  riskTier:
    | "minimal"
    | "limited"
    | "high"
    | "critical";
  systemName: string;
  modelVersion: string;
  purpose: string;
  affectedPopulation: string;
  humanRole: string;
  authorization: {
    state: string;
    authority: string;
    validUntil: string | null;
    conditions: string[];
  };
  assessment: {
    state: string;
    residualRisk: string;
    summary: string;
  };
  monitoring: {
    state: string;
    summary: string;
  };
  findings: Array<{
    severity: string;
    status: string;
    title: string;
  }>;
  remediation: {
    state: string;
    summary: string;
  } | null;
  deadlines: Array<{
    type: string;
    dueAt: string;
    status: string;
  }>;
  timeline: DemoTimelineEvent[];
};

function isoOffset(
  days: number,
): string {
  const date = new Date();
  date.setUTCDate(
    date.getUTCDate() + days,
  );
  return date.toISOString();
}

const demoDeployments:
  DemoDeploymentDetail[] = [
  {
    id:
      "demo-permit-review-assistant",
    name:
      "Permit Review Assistant",
    subtitle:
      "Low-consequence document triage with human final review",
    status: "approved",
    riskTier: "limited",
    systemName:
      "Civic Document Classifier",
    modelVersion: "2.3.1",
    purpose:
      "Route permit applications to the correct human review queue and identify missing document categories.",
    affectedPopulation:
      "Applicants submitting building and business permit materials.",
    humanRole:
      "Human reviewers make every substantive decision and may disregard the recommendation.",
    authorization: {
      state: "Approved",
      authority:
        "Example City Algorithmic Accountability Policy",
      validUntil:
        isoOffset(160),
      conditions: [
        "No automated permit denial",
        "Human reviewer required",
        "Quarterly sampling review",
      ],
    },
    assessment: {
      state: "Current",
      residualRisk: "Limited",
      summary:
        "Impact assessment found low decision consequence because the system only routes documents and cannot determine eligibility.",
    },
    monitoring: {
      state: "Within thresholds",
      summary:
        "Routing accuracy and manual override rates remain within the approved operating range.",
    },
    findings: [],
    remediation: null,
    deadlines: [
      {
        type:
          "Monitoring review",
        dueAt: isoOffset(28),
        status: "scheduled",
      },
      {
        type:
          "Authorization renewal",
        dueAt: isoOffset(130),
        status: "scheduled",
      },
    ],
    timeline: [
      {
        at: isoOffset(-150),
        kind: "inventory",
        title:
          "Deployment inventoried",
        detail:
          "System, model version, purpose, operator, and affected population registered separately.",
      },
      {
        at: isoOffset(-130),
        kind: "assessment",
        title:
          "Impact assessment completed",
        detail:
          "Residual risk classified limited.",
      },
      {
        at: isoOffset(-120),
        kind: "authorization",
        title:
          "Deployment authorized",
        detail:
          "Approval conditioned on human final review and quarterly monitoring.",
      },
    ],
  },
  {
    id:
      "demo-housing-priority-score",
    name:
      "Housing Priority Score",
    subtitle:
      "High-impact prioritization with strict conditional approval",
    status: "conditional",
    riskTier: "high",
    systemName:
      "Housing Assistance Prioritizer",
    modelVersion: "5.0.0",
    purpose:
      "Rank applications for expedited human case review during periods of excess demand.",
    affectedPopulation:
      "Applicants seeking emergency housing assistance.",
    humanRole:
      "Caseworkers make final placement decisions and must document deviations from or reliance on the score.",
    authorization: {
      state:
        "Conditionally approved",
      authority:
        "Example County Responsible Automation Standard",
      validUntil:
        isoOffset(80),
      conditions: [
        "No automatic denial",
        "Mandatory human review",
        "Appeal route must remain available",
        "Monthly disparity monitoring",
        "Any subgroup threshold breach triggers reassessment",
      ],
    },
    assessment: {
      state: "Current",
      residualRisk: "High",
      summary:
        "High consequence and vulnerable population require multi-reviewer authorization and tighter monitoring.",
    },
    monitoring: {
      state:
        "Enhanced monitoring",
      summary:
        "Monthly disparity, override, appeal, and data-quality metrics are required by authorization conditions.",
    },
    findings: [
      {
        severity: "medium",
        status: "acknowledged",
        title:
          "Caseworker reason-code completion below target",
      },
    ],
    remediation: {
      state: "in progress",
      summary:
        "Workflow update requires reason codes before final case disposition.",
    },
    deadlines: [
      {
        type:
          "Monitoring review",
        dueAt: isoOffset(12),
        status: "warning",
      },
      {
        type:
          "Authorization renewal",
        dueAt: isoOffset(55),
        status: "scheduled",
      },
    ],
    timeline: [
      {
        at: isoOffset(-110),
        kind: "assessment",
        title:
          "High-risk assessment completed",
        detail:
          "Review covered fairness, contestability, human oversight, privacy, accessibility, and operational controls.",
      },
      {
        at: isoOffset(-100),
        kind: "authorization",
        title:
          "Conditional authorization approved",
        detail:
          "Two-reviewer quorum with explicit monitoring and appeal conditions.",
      },
      {
        at: isoOffset(-18),
        kind: "finding",
        title:
          "Documentation finding opened",
        detail:
          "Reason-code completion fell below the organization threshold.",
      },
      {
        at: isoOffset(-12),
        kind: "remediation",
        title:
          "Corrective action started",
        detail:
          "Case workflow change is being implemented and will require verification.",
      },
    ],
  },
  {
    id:
      "demo-benefits-eligibility-screen",
    name:
      "Benefits Eligibility Screen",
    subtitle:
      "Deployment blocked before launch after impact assessment",
    status: "blocked",
    riskTier: "critical",
    systemName:
      "Eligibility Prediction Engine",
    modelVersion: "1.0.0-rc4",
    purpose:
      "Predict likely ineligibility before full benefits review.",
    affectedPopulation:
      "Applicants for essential public benefits.",
    humanRole:
      "Proposed design would have allowed staff to close cases based primarily on the automated score.",
    authorization: {
      state: "Denied",
      authority:
        "Example State High-Impact Systems Policy",
      validUntil: null,
      conditions: [],
    },
    assessment: {
      state:
        "Completed — unacceptable residual risk",
      residualRisk: "Critical",
      summary:
        "Assessment found insufficient contestability, unreliable subgroup performance, and excessive dependence on the automated score for a high-consequence decision.",
    },
    monitoring: {
      state:
        "Not deployed",
      summary:
        "Monitoring plan was reviewed but deployment never entered operation.",
    },
    findings: [
      {
        severity: "critical",
        status: "open",
        title:
          "Proposed decision process lacks adequate human review",
      },
      {
        severity: "high",
        status: "open",
        title:
          "Subgroup validation evidence is insufficient",
      },
    ],
    remediation: null,
    deadlines: [
      {
        type:
          "Redesign reassessment",
        dueAt: isoOffset(45),
        status: "scheduled",
      },
    ],
    timeline: [
      {
        at: isoOffset(-42),
        kind: "inventory",
        title:
          "Proposed deployment registered",
        detail:
          "The use was inventoried before production launch.",
      },
      {
        at: isoOffset(-31),
        kind: "assessment",
        title:
          "Critical residual risk identified",
        detail:
          "Assessment documented decision-rights and performance deficiencies.",
      },
      {
        at: isoOffset(-25),
        kind: "authorization",
        title:
          "Deployment authorization denied",
        detail:
          "System was blocked before launch; no production deployment occurred.",
      },
    ],
  },
  {
    id:
      "demo-claims-priority-v4",
    name:
      "Claims Priority Model v4",
    subtitle:
      "Previously authorized use returned to reassessment after material model change",
    status:
      "reassessment",
    riskTier: "high",
    systemName:
      "Claims Priority Model",
    modelVersion: "4.0.0",
    purpose:
      "Prioritize claims for specialized human review.",
    affectedPopulation:
      "Claimants whose cases enter the specialized review queue.",
    humanRole:
      "Human adjudicators retain final authority.",
    authorization: {
      state:
        "Reauthorization required",
      authority:
        "Example Agency Model Change Policy",
      validUntil: null,
      conditions: [
        "Prior v3 authorization does not carry forward to material v4 changes",
      ],
    },
    assessment: {
      state:
        "Reassessment in progress",
      residualRisk: "High",
      summary:
        "New feature set and retraining data materially changed the evaluated system and invalidated authorization continuity.",
    },
    monitoring: {
      state:
        "Pre-deployment validation",
      summary:
        "v4 is being evaluated against historical holdout data; v3 remains the currently authorized production version.",
    },
    findings: [],
    remediation: null,
    deadlines: [
      {
        type:
          "Reassessment",
        dueAt: isoOffset(14),
        status: "warning",
      },
    ],
    timeline: [
      {
        at: isoOffset(-95),
        kind: "authorization",
        title:
          "v3 deployment authorized",
        detail:
          "Prior version authorized for this deployment context.",
      },
      {
        at: isoOffset(-19),
        kind: "reassessment",
        title:
          "Material model change detected",
        detail:
          "v4 changed model inputs and training data enough to require reassessment and new authorization.",
      },
    ],
  },
  {
    id:
      "demo-fraud-alert-routing",
    name:
      "Fraud Alert Routing",
    subtitle:
      "Monitoring breach led to incident, finding, remediation, and operational suspension",
    status: "suspended",
    riskTier: "high",
    systemName:
      "Transaction Alert Router",
    modelVersion: "7.2.0",
    purpose:
      "Prioritize potentially fraudulent transactions for analyst investigation.",
    affectedPopulation:
      "Customers whose transactions generate fraud alerts.",
    humanRole:
      "Analysts determine whether action is taken; alerts alone cannot close accounts.",
    authorization: {
      state:
        "Suspended pending corrective action",
      authority:
        "Example Financial Services AI Control Standard",
      validUntil:
        isoOffset(95),
      conditions: [
        "False-positive disparity threshold",
        "Human analyst final action",
        "Weekly drift monitoring",
      ],
    },
    assessment: {
      state: "Current",
      residualRisk: "High",
      summary:
        "High-volume operational use approved with explicit disparity and drift thresholds.",
    },
    monitoring: {
      state:
        "Threshold breached",
      summary:
        "False-positive disparity exceeded the authorization threshold after a data-distribution shift.",
    },
    findings: [
      {
        severity: "high",
        status:
          "acknowledged",
        title:
          "False-positive disparity exceeded approved threshold",
      },
    ],
    remediation: {
      state:
        "ready for verification",
      summary:
        "Feature pipeline was corrected, model retrained, and retrospective validation completed; independent verification is pending.",
    },
    deadlines: [
      {
        type:
          "Corrective action verification",
        dueAt: isoOffset(5),
        status: "warning",
      },
      {
        type:
          "Reassessment",
        dueAt: isoOffset(9),
        status: "warning",
      },
    ],
    timeline: [
      {
        at: isoOffset(-36),
        kind: "monitoring",
        title:
          "Monitoring threshold breached",
        detail:
          "Segment disparity exceeded the approved maximum.",
      },
      {
        at: isoOffset(-35),
        kind: "reassessment",
        title:
          "Operational reassessment triggered",
        detail:
          "Threshold breach required immediate review.",
      },
      {
        at: isoOffset(-34),
        kind: "incident",
        title:
          "Accountability incident recorded",
        detail:
          "Observed disparity and affected transaction cohort were documented as evidence.",
      },
      {
        at: isoOffset(-33),
        kind: "finding",
        title:
          "High-severity finding opened",
        detail:
          "Monitoring failure was formally linked to the deployment and authorization conditions.",
      },
      {
        at: isoOffset(-32),
        kind: "authorization",
        title:
          "Operations suspended",
        detail:
          "Deployment was placed inactive pending verified corrective action.",
      },
      {
        at: isoOffset(-20),
        kind: "remediation",
        title:
          "Corrective action submitted",
        detail:
          "Retraining and validation evidence submitted for independent verification.",
      },
    ],
  },
];

export function buildAlgorithmicAccountabilityDemoDashboard():
  AccountabilityDashboardData {
  const deployments =
    demoDeployments.map(
      (item) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        purpose: item.purpose,
        decisionDomain:
          inferDomain(item.id),
        modelVersionResourceId:
          "demo-version-" +
          item.modelVersion,
        openFindings:
          item.findings.filter(
            (finding) =>
              finding.status !==
                "closed" &&
              finding.status !==
                "resolved",
          ).length,
        blockingFindings:
          item.findings.filter(
            (finding) =>
              finding.status !==
                "closed" &&
              finding.status !==
                "resolved" &&
              (finding.severity ===
                "high" ||
                finding.severity ===
                  "critical"),
          ).length,
        overdueDeadlines:
          item.deadlines.filter(
            (deadline) =>
              deadline.status ===
              "overdue",
          ).length,
        activeAssessments:
          item.assessment.state
            .toLowerCase()
            .includes("not")
            ? 0
            : 1,
        monitoringObservations:
          item.monitoring.state ===
            "Not deployed"
            ? 0
            : item.status ===
                "reassessment"
              ? 0
              : 3,
        validCertifications:
          item.status ===
            "approved"
            ? 1
            : 0,
      }),
    );

  return {
    generatedAt:
      new Date().toISOString(),
    metrics: {
      deployments:
        deployments.length,
      deploymentsWithBlockingFindings:
        deployments.filter(
          (item) =>
            item.blockingFindings >
            0,
        ).length,
      openFindings:
        deployments.reduce(
          (sum, item) =>
            sum +
            item.openFindings,
          0,
        ),
      overdueDeadlines:
        deployments.reduce(
          (sum, item) =>
            sum +
            item.overdueDeadlines,
          0,
        ),
      activeAssessments:
        deployments.reduce(
          (sum, item) =>
            sum +
            item.activeAssessments,
          0,
        ),
      monitoringObservations:
        deployments.reduce(
          (sum, item) =>
            sum +
            item.monitoringObservations,
          0,
        ),
      validCertifications:
        deployments.reduce(
          (sum, item) =>
            sum +
            item.validCertifications,
          0,
        ),
    },
    deployments,
  };
}

export function getAlgorithmicAccountabilityDemoDeployment(
  id: string,
): DemoDeploymentDetail | null {
  return (
    demoDeployments.find(
      (item) => item.id === id,
    ) ?? null
  );
}

export function listAlgorithmicAccountabilityDemoDeployments():
  DemoDeploymentDetail[] {
  return demoDeployments;
}

function inferDomain(
  id: string,
): string {
  if (
    id.includes("permit")
  ) {
    return "permitting";
  }
  if (
    id.includes("housing")
  ) {
    return "housing-assistance";
  }
  if (
    id.includes("benefits")
  ) {
    return "public-benefits";
  }
  if (
    id.includes("claims")
  ) {
    return "claims-review";
  }
  return "fraud-operations";
}
