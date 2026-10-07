import rawConfig from "../../../config/thin-app.config.json";
import {
  parseThinAppConfig,
  type ThinAppConfig,
} from "@caiae/sdk";

type ConfigEnvironment = {
  CAIAE_API_BASE_URL?: string;
  CAIAE_ORGANIZATION_ID?: string;
};

export function buildThinAppConfig(
  env: ConfigEnvironment =
    process.env as ConfigEnvironment,
): ThinAppConfig {
  const apiBaseUrl =
    env.CAIAE_API_BASE_URL?.trim() ||
    rawConfig.engine.apiBaseUrl;
  const organizationId =
    env.CAIAE_ORGANIZATION_ID?.trim();

  return parseThinAppConfig({
    ...rawConfig,
    engine: {
      ...rawConfig.engine,
      apiBaseUrl,
      ...(organizationId
        ? { organizationId }
        : {}),
    },
  });
}
