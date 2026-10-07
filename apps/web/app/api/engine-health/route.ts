import {
  SdkError,
} from "@caiae/sdk";

import {
  createPublicEngineClient,
} from "../../../lib/engine";

export const dynamic =
  "force-dynamic";

export async function GET() {
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
