import {
  createPublicClient,
} from "@caiae/sdk";

import {
  buildThinAppConfig,
} from "./config";

export function createPublicEngineClient() {
  const config =
    buildThinAppConfig();
  const {
    apiBaseUrl,
    organizationId,
    requestTimeoutMs,
  } = config.engine;

  return createPublicClient({
    baseUrl: apiBaseUrl,
    ...(organizationId
      ? { organizationId }
      : {}),
    ...(requestTimeoutMs
      ? { requestTimeoutMs }
      : {}),
  });
}
