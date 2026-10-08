import {
  createOperatorClient,
  type ComplianceEngineClient,
} from "@caiae/sdk";

import {
  buildThinAppConfig,
} from "./config";

export type OperatorEnvironment = {
  CAIAE_API_BASE_URL?: string;
  CAIAE_ORGANIZATION_ID?: string;
  CAIAE_OPERATOR_TOKEN?: string;
  AA_DEMO_MODE?: string;
};

export type OperatorReadiness = {
  configured: boolean;
  missing: Array<
    | "CAIAE_ORGANIZATION_ID"
    | "CAIAE_OPERATOR_TOKEN"
  >;
  engineBaseUrl: string;
  organizationId: string | null;
};

export function readOperatorReadiness(
  env: OperatorEnvironment =
    process.env as OperatorEnvironment,
): OperatorReadiness {
  const config =
    buildThinAppConfig(env);
  const token =
    env.CAIAE_OPERATOR_TOKEN
      ?.trim();
  const missing:
    OperatorReadiness["missing"] =
    [];

  if (
    !config.engine.organizationId
  ) {
    missing.push(
      "CAIAE_ORGANIZATION_ID",
    );
  }
  if (!token) {
    missing.push(
      "CAIAE_OPERATOR_TOKEN",
    );
  }

  return {
    configured:
      missing.length === 0,
    missing,
    engineBaseUrl:
      config.engine.apiBaseUrl,
    organizationId:
      config.engine.organizationId ??
      null,
  };
}

export function createOperatorEngineClient(
  env: OperatorEnvironment =
    process.env as OperatorEnvironment,
): ComplianceEngineClient {
  const readiness =
    readOperatorReadiness(env);
  const token =
    env.CAIAE_OPERATOR_TOKEN
      ?.trim();

  if (
    !readiness.configured ||
    !readiness.organizationId ||
    !token
  ) {
    throw new Error(
      "operator dashboard requires CAIAE_ORGANIZATION_ID and CAIAE_OPERATOR_TOKEN",
    );
  }

  return createOperatorClient({
    baseUrl:
      readiness.engineBaseUrl,
    organizationId:
      readiness.organizationId,
    token,
  });
}
