import assert from "node:assert/strict";
import test from "node:test";

import {
  accountabilityDimensions,
  accountabilityLifecycle,
  algorithmicAccountabilityResourceTypes,
  frameworkMetadata,
  reassessmentTriggers,
} from "../src/index.js";

test("foundation models system, deployment context, and model version separately", () => {
  assert.deepEqual(
    Object.keys(
      algorithmicAccountabilityResourceTypes,
    ).sort(),
    [
      "algorithmic-system",
      "deployment-context",
      "model-version",
    ],
  );
});

test("authorization precedes deployment in the accountability lifecycle", () => {
  assert.ok(
    accountabilityLifecycle.indexOf(
      "authorization",
    ) <
      accountabilityLifecycle.indexOf(
        "deployment",
      ),
  );
});

test("continuous accountability continues after initial deployment", () => {
  const deployment =
    accountabilityLifecycle.indexOf(
      "deployment",
    );

  for (const stage of [
    "monitoring",
    "reassessment",
    "finding",
    "remediation",
    "renewal-or-retirement",
  ] as const) {
    assert.ok(
      accountabilityLifecycle.indexOf(
        stage,
      ) > deployment,
    );
  }
});

test("material changes and observed harms trigger reassessment", () => {
  assert.ok(
    reassessmentTriggers.includes(
      "material-model-change",
    ),
  );
  assert.ok(
    reassessmentTriggers.includes(
      "material-purpose-change",
    ),
  );
  assert.ok(
    reassessmentTriggers.includes(
      "new-harm-or-incident",
    ),
  );
});

test("framework covers decision-rights as well as model performance", () => {
  for (const dimension of [
    "human-review",
    "fairness",
    "explainability",
    "contestability",
    "accessibility",
  ] as const) {
    assert.ok(
      accountabilityDimensions.includes(
        dimension,
      ),
    );
  }
});

test("foundation does not pretend a legal mandate exists", () => {
  assert.equal(
    frameworkMetadata.sourceStatus,
    "policy-framework",
  );
  assert.equal(
    frameworkMetadata.legalAuthorityAssumed,
    false,
  );
});
