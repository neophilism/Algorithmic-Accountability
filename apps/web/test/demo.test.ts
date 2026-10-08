import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAlgorithmicAccountabilityDemoDashboard,
  getAlgorithmicAccountabilityDemoDeployment,
  listAlgorithmicAccountabilityDemoDeployments,
} from "../lib/demo";
import {
  isAlgorithmicAccountabilityDemoMode,
} from "../lib/demo-mode";

test("demo mode is explicit and opt-in", () => {
  assert.equal(
    isAlgorithmicAccountabilityDemoMode(
      {},
    ),
    false,
  );
  assert.equal(
    isAlgorithmicAccountabilityDemoMode(
      {
        AA_DEMO_MODE:
          "true",
      },
    ),
    true,
  );
});

test("full demo includes five distinct accountability states", () => {
  const items =
    listAlgorithmicAccountabilityDemoDeployments();

  assert.equal(
    items.length,
    5,
  );

  const states =
    new Set(
      items.map(
        (item) =>
          item.status,
      ),
    );

  for (const state of [
    "approved",
    "conditional",
    "blocked",
    "reassessment",
    "suspended",
  ]) {
    assert.ok(
      states.has(
        state as
          | "approved"
          | "conditional"
          | "blocked"
          | "reassessment"
          | "suspended",
      ),
    );
  }
});

test("blocked case demonstrates authorization before deployment", () => {
  const blocked =
    getAlgorithmicAccountabilityDemoDeployment(
      "demo-benefits-eligibility-screen",
    );

  assert.ok(blocked);
  assert.equal(
    blocked.status,
    "blocked",
  );
  assert.equal(
    blocked.authorization
      .state,
    "Denied",
  );
  assert.ok(
    blocked.timeline.some(
      (event) =>
        event.kind ===
          "authorization" &&
        event.detail.includes(
          "blocked before launch",
        ),
    ),
  );
});

test("material model change demonstrates reassessment and reauthorization", () => {
  const changed =
    getAlgorithmicAccountabilityDemoDeployment(
      "demo-claims-priority-v4",
    );

  assert.ok(changed);
  assert.equal(
    changed.status,
    "reassessment",
  );
  assert.equal(
    changed.authorization
      .state,
    "Reauthorization required",
  );
  assert.ok(
    changed.timeline.some(
      (event) =>
        event.kind ===
        "reassessment",
    ),
  );
});

test("monitoring breach demonstrates incident finding remediation and suspension", () => {
  const incident =
    getAlgorithmicAccountabilityDemoDeployment(
      "demo-fraud-alert-routing",
    );

  assert.ok(incident);
  assert.equal(
    incident.status,
    "suspended",
  );
  assert.equal(
    incident.monitoring
      .state,
    "Threshold breached",
  );

  const kinds =
    new Set(
      incident.timeline.map(
        (event) => event.kind,
      ),
    );

  for (const kind of [
    "monitoring",
    "reassessment",
    "incident",
    "finding",
    "remediation",
    "authorization",
  ]) {
    assert.ok(
      kinds.has(
        kind as
          | "monitoring"
          | "reassessment"
          | "incident"
          | "finding"
          | "remediation"
          | "authorization",
      ),
    );
  }
});

test("portfolio metrics reflect fictional lifecycle records", () => {
  const dashboard =
    buildAlgorithmicAccountabilityDemoDashboard();

  assert.equal(
    dashboard.metrics
      .deployments,
    5,
  );
  assert.ok(
    dashboard.metrics
      .deploymentsWithBlockingFindings >=
      2,
  );
  assert.ok(
    dashboard.metrics
      .openFindings >= 4,
  );
  assert.ok(
    dashboard.metrics
      .monitoringObservations >
      0,
  );
});
