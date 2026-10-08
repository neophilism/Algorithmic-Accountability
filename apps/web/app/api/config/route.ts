import {
  toPublicThinAppConfig,
} from "@caiae/sdk";

import {
  buildThinAppConfig,
} from "../../../lib/config";

export const dynamic =
  "force-dynamic";

export async function GET() {
  return Response.json(
    toPublicThinAppConfig(
      buildThinAppConfig(),
    ),
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
