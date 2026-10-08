import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAlgorithmicSystemResource,
  buildDeploymentContextResource,
  buildModelVersionResource,
  createDeploymentContext,
  createModelVersion,
  listInventory,
} from "../src/index.js";

const now =
  "2026-10-08T00:00:00.000Z";

function resource(
  overrides,
) {
  return {
    id: "resource-1",
    organizationId:
      "11111111-1111-4111-8111-111111111111",
    resourceType:
      "algorithmic-system",
    name: "Example",
    externalRef: "example",
    status: "active",
    attributes: {},
    metadata: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const systemInput = {
  externalRef:
    "credit-risk-engine",
  name:
    "Credit Risk Engine",
  description:
    "Produces a risk score used in underwriting review.",
  systemKind: "scoring",
  primaryFunction:
    "Estimate repayment risk",
  ownerUnit:
    "Risk Engineering",
  providerType: "internal",
  lifecycleState: "active",
  documentationUrls: [
    "https://example.com/model-card",
  ],
};

const versionInput = {
  externalRef:
    "credit-risk-engine:v3",
  name:
    "Credit Risk Engine v3",
  algorithmicSystemResourceId:
    "system-1",
  versionLabel: "3.0.0",
  lifecycleState: "active",
  releasedAt:
    "2026-09-15T12:00:00.000Z",
  changeSummary:
    "Retrained with a newer feature pipeline.",
  codeRevision: "abc123",
};

const deploymentInput = {
  externalRef:
    "consumer-loan-underwriting",
  name:
    "Consumer loan underwriting",
  algorithmicSystemResourceId:
    "system-1",
  modelVersionResourceId:
    "version-3",
  purpose:
    "Support consumer lending underwriting decisions.",
  decisionProcess:
    "Score is reviewed with application materials before a final decision.",
  decisionDomain:
    "consumer-lending",
  affectedPopulationDescription:
    "Applicants for consumer installment loans.",
  operatorUnit:
    "Consumer Lending",
  geographicScope:
    "United States",
  humanRole:
    "decision-maker",
  decisionEffect:
    "eligibility",
  inputDataCategories: [
    "application-data",
    "credit-history",
  ],
  outputDescription:
    "Risk score and reason factors.",
  plannedStartAt:
    "2026-11-01T00:00:00.000Z",
  appealOrReviewAvailable: true,
};

test("system inventory maps to a CAIAE resource without global approval state", () => {
  const mapped =
    buildAlgorithmicSystemResource(
      systemInput,
    );

  assert.equal(
    mapped.resourceType,
    "algorithmic-system",
  );
  assert.equal(
    mapped.attributes
      ?.lifecycleState,
    "active",
  );
  assert.equal(
    "authorized" in
      (mapped.attributes ?? {}),
    false,
  );
  assert.equal(
    "approvalStatus" in
      (mapped.attributes ?? {}),
    false,
  );
});

test("model versions preserve system lineage and change identity", () => {
  const mapped =
    buildModelVersionResource(
      versionInput,
    );

  assert.equal(
    mapped.resourceType,
    "model-version",
  );
  assert.equal(
    mapped.attributes
      ?.algorithmicSystemResourceId,
    "system-1",
  );
  assert.equal(
    mapped.attributes
      ?.versionLabel,
    "3.0.0",
  );
});

test("deployment context is the future authorization subject", () => {
  const mapped =
    buildDeploymentContextResource(
      deploymentInput,
    );

  assert.equal(
    mapped.resourceType,
    "deployment-context",
  );
  assert.equal(
    mapped.metadata
      ?.authorizationSubject,
    true,
  );
  assert.equal(
    mapped.attributes
      ?.algorithmicSystemResourceId,
    "system-1",
  );
  assert.equal(
    mapped.attributes
      ?.modelVersionResourceId,
    "version-3",
  );
  assert.equal(
    mapped.attributes
      ?.affectedPopulationDescription,
    deploymentInput
      .affectedPopulationDescription,
  );
});

test("model version creation rejects a non-system parent", async () => {
  const client = {
    getResource: async () =>
      resource({
        resourceType:
          "deployment-context",
      }),
    createResource:
      async () => {
        throw new Error(
          "must not create",
        );
      },
    listResources:
      async () => [],
  };

  await assert.rejects(
    () =>
      createModelVersion(
        client,
        versionInput,
      ),
    /model version parent must be resource type algorithmic-system/,
  );
});

test("previous version must belong to the same algorithmic system", async () => {
  const client = {
    getResource:
      async (id) => {
        if (id === "system-1") {
          return resource({
            id: "system-1",
          });
        }
        return resource({
          id: "version-2",
          resourceType:
            "model-version",
          attributes: {
            algorithmicSystemResourceId:
              "another-system",
          },
        });
      },
    createResource:
      async () => {
        throw new Error(
          "must not create",
        );
      },
    listResources:
      async () => [],
  };

  await assert.rejects(
    () =>
      createModelVersion(
        client,
        {
          ...versionInput,
          previousModelVersionResourceId:
            "version-2",
        },
      ),
    /previous model version belongs to a different algorithmic system/,
  );
});

test("deployment rejects a model version from another system", async () => {
  const client = {
    getResource:
      async (id) =>
        id === "system-1"
          ? resource({
              id: "system-1",
            })
          : resource({
              id: "version-3",
              resourceType:
                "model-version",
              attributes: {
                algorithmicSystemResourceId:
                  "system-2",
              },
            }),
    createResource:
      async () => {
        throw new Error(
          "must not create",
        );
      },
    listResources:
      async () => [],
  };

  await assert.rejects(
    () =>
      createDeploymentContext(
        client,
        deploymentInput,
      ),
    /does not belong to the selected algorithmic system/,
  );
});

test("valid deployment creates a context-specific CAIAE resource", async () => {
  let created;

  const client = {
    getResource:
      async (id) =>
        id === "system-1"
          ? resource({
              id: "system-1",
            })
          : resource({
              id: "version-3",
              resourceType:
                "model-version",
              attributes: {
                algorithmicSystemResourceId:
                  "system-1",
              },
            }),
    createResource:
      async (input) => {
        created = input;
        return resource({
          id: "deployment-1",
          resourceType:
            input.resourceType,
          name: input.name,
          externalRef:
            input.externalRef ?? null,
          status:
            input.status ??
            "active",
          attributes:
            input.attributes ?? {},
          metadata:
            input.metadata ?? {},
        });
      },
    listResources:
      async () => [],
  };

  const result =
    await createDeploymentContext(
      client,
      deploymentInput,
    );

  assert.equal(
    result.id,
    "deployment-1",
  );
  assert.equal(
    created.resourceType,
    "deployment-context",
  );
});

test("inventory listing delegates resource-type filtering to CAIAE", async () => {
  let filter;

  const client = {
    getResource:
      async () =>
        resource({}),
    createResource:
      async () =>
        resource({}),
    listResources:
      async (options) => {
        filter =
          options.resourceType;
        return [];
      },
  };

  await listInventory(
    client,
    "model-version",
  );

  assert.equal(
    filter,
    "model-version",
  );
});

test("deployment validation rejects empty data categories and inverted dates", () => {
  assert.throws(
    () =>
      buildDeploymentContextResource(
        {
          ...deploymentInput,
          inputDataCategories: [],
        },
      ),
    /inputDataCategories/,
  );

  assert.throws(
    () =>
      buildDeploymentContextResource(
        {
          ...deploymentInput,
          plannedStartAt:
            "2026-12-01T00:00:00.000Z",
          plannedEndAt:
            "2026-11-01T00:00:00.000Z",
        },
      ),
    /plannedEndAt/,
  );
});
