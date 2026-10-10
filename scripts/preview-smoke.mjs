const rawBase = process.env.PREVIEW_BASE_URL ?? process.argv[2];
if (!rawBase) {
  console.error("PREVIEW_BASE_URL or a base URL argument is required");
  process.exit(2);
}

let base;
try {
  const url = new URL(rawBase);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("Preview monitoring requires an HTTPS URL");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Preview URL must not contain credentials, query or fragment");
  }
  base = url.origin;
} catch (error) {
  console.error("Invalid preview URL: " + (error instanceof Error ? error.message : String(error)));
  process.exit(2);
}

const checks = [
  {
    path: "/",
    verify: async (response) => (await response.text()).includes("Fictional demonstration data"),
  },
  {
    path: "/api/config",
    verify: async (response) => {
      const raw = await response.text();
      JSON.parse(raw);
      return !raw.includes("CAIAE_OPERATOR_TOKEN") && !raw.includes("AA_ADMIN_PASSWORD");
    },
  },
  {
    path: "/api/engine-health",
    verify: async (response) => {
      const payload = await response.json();
      return payload.demo === true && payload.fictional === true &&
        payload.engine?.status === "ok";
    },
  },
  {
    path: "/api/dashboard",
    verify: async (response) => {
      const payload = await response.json();
      return payload.metrics?.deployments === 5 &&
        Array.isArray(payload.deployments) && payload.deployments.length === 5;
    },
  },
  { path: "/deployments/demo-permit-review-assistant", name: "Permit Review Assistant" },
  { path: "/deployments/demo-housing-priority-score", name: "Housing Priority Score" },
  { path: "/deployments/demo-benefits-eligibility-screen", name: "Benefits Eligibility Screen" },
  { path: "/deployments/demo-claims-priority-v4", name: "Claims Priority Model" },
  { path: "/deployments/demo-fraud-alert-routing", name: "Fraud Alert Routing" },
];

const attempts = Number(process.env.SMOKE_ATTEMPTS ?? "4");
if (!Number.isInteger(attempts) || attempts < 1 || attempts > 8) {
  console.error("SMOKE_ATTEMPTS must be between 1 and 8");
  process.exit(2);
}

async function checkOne({ path, verify, name }) {
  let status = null;
  let problem = "not attempted";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(base + path, {
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(55_000),
      });
      status = response.status;
      if (status === 200) {
        const matches = verify
          ? await verify(response)
          : (await response.text()).includes(name);
        if (matches) {
          console.log(JSON.stringify({ path, status, verified: true, attempt }));
          return true;
        }
        problem = "content assertion failed";
      } else {
        problem = "HTTP " + status;
      }
    } catch (error) {
      problem = error instanceof Error ? error.message : String(error);
    }
    if (attempt < attempts) {
      await new Promise(resolve => setTimeout(resolve, 10_000));
    }
  }
  console.error(JSON.stringify({ path, status, verified: false, problem }));
  return false;
}

let passed = 0;
for (const check of checks) {
  if (await checkOne(check)) passed += 1;
}
console.log(JSON.stringify({ base, passing: passed, total: checks.length, status: passed === checks.length ? "passed" : "failed" }));
if (passed !== checks.length) process.exit(1);
