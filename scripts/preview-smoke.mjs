const rawBase =
  process.env.PREVIEW_BASE_URL ??
  process.argv[2];

if (!rawBase) {
  console.error(
    "PREVIEW_BASE_URL or a base URL argument is required",
  );
  process.exit(2);
}

const base =
  rawBase.replace(/\/$/, "");

const checks = [
  "/",
  "/api/config",
  "/api/engine-health",
  "/api/dashboard",
  "/deployments/demo-permit-review-assistant",
  "/deployments/demo-benefits-eligibility-screen",
  "/deployments/demo-fraud-alert-routing",
];

let failed = false;

for (const path of checks) {
  try {
    const response =
      await fetch(
        base + path,
        {
          redirect: "follow",
          signal:
            AbortSignal.timeout(
              20_000,
            ),
        },
      );

    const ok =
      response.status === 200;

    console.log(
      JSON.stringify({
        path,
        status:
          response.status,
        expected: 200,
        ok,
      }),
    );

    if (!ok) failed = true;
  } catch (error) {
    failed = true;
    console.error(
      JSON.stringify({
        path,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }),
    );
  }
}

if (failed) {
  process.exit(1);
}
