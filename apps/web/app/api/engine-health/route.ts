import {
  SdkError,
} from "@caiae/sdk";

import {
  createPublicEngineClient,
} from "../../../lib/engine";
import {
  isAlgorithmicAccountabilityDemoMode,
} from "../../../lib/demo-mode";

export const dynamic =
  "force-dynamic";

export async function GET() {
  if (isAlgorithmicAccountabilityDemoMode()) {
    return Response.json({
      engine: {
        status: "ok",
        service: "algorithmic-accountability-demo",
        release: "fictional-demo",
        timestamp: new Date().toISOString(),
      },
      demo: true,
      fictional: true,
    });
  }

  try {
    const engine =
      await createPublicEngineClient()
        .getHealth();

    return Response.json({
      engine,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          "engine_unavailable",
        message:
          error instanceof SdkError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Engine health check failed",
      },
      {
        status: 503,
      },
    );
  }
}
