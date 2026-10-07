import {
  createPublicClient,
} from "@caiae/sdk";

import {
  buildThinAppConfig,
} from "./config";

export function createPublicEngineClient() {
  const config =
    buildThinAppConfig();

  return createPublicClient({
    baseUrl:
      config.engine.apiBaseUrl,
    organizationId:
      config.engine.organizationId,
    requestTimeoutMs:
      config.engine.requestTimeoutMs,
  });
}
