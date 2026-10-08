import {
  loadAccountabilityDashboard,
} from "../../../lib/dashboard";

export const dynamic =
  "force-dynamic";

export async function GET() {
  const dashboard =
    await loadAccountabilityDashboard();

  if (
    dashboard.state ===
    "ready"
  ) {
    return Response.json(
      dashboard.data,
      {
        headers: {
          "cache-control":
            "no-store",
        },
      },
    );
  }

  return Response.json(
    dashboard,
    {
      status:
        dashboard.state ===
        "unconfigured"
          ? 503
          : 502,
      headers: {
        "cache-control":
          "no-store",
      },
    },
  );
}
