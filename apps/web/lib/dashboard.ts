import {
  loadAccountabilityPortfolio,
  type DeploymentAccountabilityReport,
} from "@algorithmic-accountability/reporting";
import {
  SdkError,
} from "@caiae/sdk";

import {
  createOperatorEngineClient,
  readOperatorReadiness,
  type OperatorEnvironment,
} from "./operator";

export type AccountabilityDashboardData = {
  generatedAt: string;
  metrics: {
    deployments: number;
    deploymentsWithBlockingFindings: number;
    openFindings: number;
    overdueDeadlines: number;
    activeAssessments: number;
    monitoringObservations: number;
    validCertifications: number;
  };
  deployments: Array<{
    id: string;
    name: string;
    status: string;
    purpose: string | null;
    decisionDomain: string | null;
    modelVersionResourceId: string | null;
    openFindings: number;
    blockingFindings: number;
    overdueDeadlines: number;
    activeAssessments: number;
    monitoringObservations: number;
    validCertifications: number;
  }>;
};

export type AccountabilityDashboardState =
  | {
      state: "unconfigured";
      missing: string[];
      engineBaseUrl: string;
    }
  | {
      state: "error";
      message: string;
      engineBaseUrl: string;
    }
  | {
      state: "ready";
      data: AccountabilityDashboardData;
      engineBaseUrl: string;
    };

export async function loadAccountabilityDashboard(
  env: OperatorEnvironment =
    process.env as OperatorEnvironment,
): Promise<AccountabilityDashboardState> {
  const readiness =
    readOperatorReadiness(env);

  if (!readiness.configured) {
    return {
      state: "unconfigured",
      missing: readiness.missing,
      engineBaseUrl:
        readiness.engineBaseUrl,
    };
  }

  try {
    const client =
      createOperatorEngineClient(
        env,
      );
    const portfolio =
      await loadAccountabilityPortfolio(
        client,
      );

    return {
      state: "ready",
      engineBaseUrl:
        readiness.engineBaseUrl,
      data:
        projectPortfolio(
          portfolio,
        ),
    };
  } catch (error) {
    return {
      state: "error",
      engineBaseUrl:
        readiness.engineBaseUrl,
      message:
        error instanceof
          SdkError
          ? error.message +
            " (HTTP " +
            error.status +
            ")"
          : error instanceof Error
            ? error.message
            : "Unable to load accountability dashboard",
    };
  }
}

export function projectPortfolio(
  portfolio:
    DeploymentAccountabilityReport[],
): AccountabilityDashboardData {
  const deployments =
    portfolio.map(
      (report) => ({
        id:
          report.deployment.id,
        name:
          report.deployment.name,
        status:
          report.deployment.status,
        purpose:
          stringAttribute(
            report,
            "purpose",
          ),
        decisionDomain:
          stringAttribute(
            report,
            "decisionDomain",
          ),
        modelVersionResourceId:
          stringAttribute(
            report,
            "modelVersionResourceId",
          ),
        ...report.metrics,
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
        sum(
          deployments,
          "openFindings",
        ),
      overdueDeadlines:
        sum(
          deployments,
          "overdueDeadlines",
        ),
      activeAssessments:
        sum(
          deployments,
          "activeAssessments",
        ),
      monitoringObservations:
        sum(
          deployments,
          "monitoringObservations",
        ),
      validCertifications:
        sum(
          deployments,
          "validCertifications",
        ),
    },
    deployments,
  };
}

function stringAttribute(
  report:
    DeploymentAccountabilityReport,
  key: string,
): string | null {
  const value =
    report.deployment
      .attributes[key];
  return typeof value ===
      "string" &&
    value.trim() !== ""
    ? value
    : null;
}

function sum(
  items:
    AccountabilityDashboardData[
      "deployments"
    ],
  key:
    | "openFindings"
    | "overdueDeadlines"
    | "activeAssessments"
    | "monitoringObservations"
    | "validCertifications",
): number {
  return items.reduce(
    (total, item) =>
      total + item[key],
    0,
  );
}
