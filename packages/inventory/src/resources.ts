import type {
  ComplianceEngineClient,
  Resource,
} from "@caiae/sdk";

import type {
  AlgorithmicSystemInventoryInput,
  DeploymentContextInventoryInput,
  ModelVersionInventoryInput,
} from "./types.js";

export const INVENTORY_RESOURCE_TYPES = {
  system: "algorithmic-system",
  version: "model-version",
  deployment: "deployment-context",
} as const;

export type CreateResourceInput =
  Parameters<
    ComplianceEngineClient[
      "createResource"
    ]
  >[0];

export type InventoryClient =
  Pick<
    ComplianceEngineClient,
    | "createResource"
    | "getResource"
    | "listResources"
  >;

export function buildAlgorithmicSystemResource(
  input: AlgorithmicSystemInventoryInput,
): CreateResourceInput {
  validateAlgorithmicSystem(input);

  return {
    resourceType:
      INVENTORY_RESOURCE_TYPES.system,
    name: input.name.trim(),
    externalRef:
      input.externalRef.trim(),
    status:
      inventoryStatus(
        input.lifecycleState,
      ),
    attributes: {
      description:
        input.description.trim(),
      systemKind: input.systemKind,
      primaryFunction:
        input.primaryFunction.trim(),
      ownerUnit:
        input.ownerUnit.trim(),
      providerType:
        input.providerType,
      ...(input.providerName
        ? {
            providerName:
              input.providerName.trim(),
          }
        : {}),
      lifecycleState:
        input.lifecycleState,
      ...(input.documentationUrls
        ? {
            documentationUrls:
              input.documentationUrls,
          }
        : {}),
      ...(input.provenanceSummary
        ? {
            provenanceSummary:
              input.provenanceSummary.trim(),
          }
        : {}),
    },
    metadata: {
      accountabilityDomain:
        "algorithmic-accountability",
      inventoryKind:
        "algorithmic-system",
    },
  };
}

export function buildModelVersionResource(
  input: ModelVersionInventoryInput,
): CreateResourceInput {
  validateModelVersion(input);

  return {
    resourceType:
      INVENTORY_RESOURCE_TYPES.version,
    name: input.name.trim(),
    externalRef:
      input.externalRef.trim(),
    status:
      inventoryStatus(
        input.lifecycleState,
      ),
    attributes: {
      algorithmicSystemResourceId:
        input.algorithmicSystemResourceId.trim(),
      versionLabel:
        input.versionLabel.trim(),
      lifecycleState:
        input.lifecycleState,
      changeSummary:
        input.changeSummary.trim(),
      ...(input.releasedAt
        ? {
            releasedAt:
              input.releasedAt,
          }
        : {}),
      ...(input.previousModelVersionResourceId
        ? {
            previousModelVersionResourceId:
              input.previousModelVersionResourceId.trim(),
          }
        : {}),
      ...(input.codeRevision
        ? {
            codeRevision:
              input.codeRevision.trim(),
          }
        : {}),
      ...(input.modelArtifactDigest
        ? {
            modelArtifactDigest:
              input.modelArtifactDigest.trim(),
          }
        : {}),
      ...(input.trainingDataVersion
        ? {
            trainingDataVersion:
              input.trainingDataVersion.trim(),
          }
        : {}),
    },
    metadata: {
      accountabilityDomain:
        "algorithmic-accountability",
      inventoryKind:
        "model-version",
    },
  };
}

export function buildDeploymentContextResource(
  input: DeploymentContextInventoryInput,
): CreateResourceInput {
  validateDeploymentContext(input);

  return {
    resourceType:
      INVENTORY_RESOURCE_TYPES.deployment,
    name: input.name.trim(),
    externalRef:
      input.externalRef.trim(),
    status: "active",
    attributes: {
      algorithmicSystemResourceId:
        input.algorithmicSystemResourceId.trim(),
      modelVersionResourceId:
        input.modelVersionResourceId.trim(),
      purpose:
        input.purpose.trim(),
      decisionProcess:
        input.decisionProcess.trim(),
      decisionDomain:
        input.decisionDomain.trim(),
      affectedPopulationDescription:
        input.affectedPopulationDescription.trim(),
      operatorUnit:
        input.operatorUnit.trim(),
      geographicScope:
        input.geographicScope.trim(),
      humanRole:
        input.humanRole,
      decisionEffect:
        input.decisionEffect,
      inputDataCategories:
        input.inputDataCategories,
      outputDescription:
        input.outputDescription.trim(),
      appealOrReviewAvailable:
        input.appealOrReviewAvailable,
      ...(input.plannedStartAt
        ? {
            plannedStartAt:
              input.plannedStartAt,
          }
        : {}),
      ...(input.plannedEndAt
        ? {
            plannedEndAt:
              input.plannedEndAt,
          }
        : {}),
    },
    metadata: {
      accountabilityDomain:
        "algorithmic-accountability",
      inventoryKind:
        "deployment-context",
      authorizationSubject: true,
    },
  };
}

export async function createAlgorithmicSystem(
  client: InventoryClient,
  input: AlgorithmicSystemInventoryInput,
): Promise<Resource> {
  return client.createResource(
    buildAlgorithmicSystemResource(
      input,
    ),
  );
}

export async function createModelVersion(
  client: InventoryClient,
  input: ModelVersionInventoryInput,
): Promise<Resource> {
  const system =
    await client.getResource(
      input.algorithmicSystemResourceId,
    );

  requireType(
    system,
    INVENTORY_RESOURCE_TYPES.system,
    "model version parent",
  );

  if (
    input.previousModelVersionResourceId
  ) {
    const previous =
      await client.getResource(
        input.previousModelVersionResourceId,
      );
    requireType(
      previous,
      INVENTORY_RESOURCE_TYPES.version,
      "previous model version",
    );

    if (
      previous.attributes
        .algorithmicSystemResourceId !==
      system.id
    ) {
      throw new Error(
        "previous model version belongs to a different algorithmic system",
      );
    }
  }

  return client.createResource(
    buildModelVersionResource(
      input,
    ),
  );
}

export async function createDeploymentContext(
  client: InventoryClient,
  input: DeploymentContextInventoryInput,
): Promise<Resource> {
  const [system, version] =
    await Promise.all([
      client.getResource(
        input.algorithmicSystemResourceId,
      ),
      client.getResource(
        input.modelVersionResourceId,
      ),
    ]);

  requireType(
    system,
    INVENTORY_RESOURCE_TYPES.system,
    "deployment system",
  );
  requireType(
    version,
    INVENTORY_RESOURCE_TYPES.version,
    "deployment model version",
  );

  if (
    version.attributes
      .algorithmicSystemResourceId !==
    system.id
  ) {
    throw new Error(
      "deployment model version does not belong to the selected algorithmic system",
    );
  }

  return client.createResource(
    buildDeploymentContextResource(
      input,
    ),
  );
}

export async function listInventory(
  client: InventoryClient,
  resourceType:
    | "algorithmic-system"
    | "model-version"
    | "deployment-context",
): Promise<Resource[]> {
  return client.listResources({
    resourceType,
  });
}

function requireType(
  resource: Resource,
  expected: string,
  label: string,
): void {
  if (
    resource.resourceType !==
    expected
  ) {
    throw new Error(
      label +
        " must be resource type " +
        expected,
    );
  }
}

function inventoryStatus(
  state:
    | "development"
    | "validation"
    | "active"
    | "paused"
    | "retired",
): Resource["status"] {
  return state === "retired"
    ? "archived"
    : state === "paused"
      ? "inactive"
      : "active";
}

function validateAlgorithmicSystem(
  input: AlgorithmicSystemInventoryInput,
): void {
  required(
    input.externalRef,
    "externalRef",
  );
  required(input.name, "name");
  required(
    input.description,
    "description",
  );
  required(
    input.primaryFunction,
    "primaryFunction",
  );
  required(
    input.ownerUnit,
    "ownerUnit",
  );

  if (input.providerName) {
    required(
      input.providerName,
      "providerName",
    );
  }

  for (
    const url of
    input.documentationUrls ?? []
  ) {
    validUrl(
      url,
      "documentationUrls",
    );
  }
}

function validateModelVersion(
  input: ModelVersionInventoryInput,
): void {
  required(
    input.externalRef,
    "externalRef",
  );
  required(input.name, "name");
  required(
    input.algorithmicSystemResourceId,
    "algorithmicSystemResourceId",
  );
  required(
    input.versionLabel,
    "versionLabel",
  );
  required(
    input.changeSummary,
    "changeSummary",
  );

  if (input.releasedAt) {
    validDateTime(
      input.releasedAt,
      "releasedAt",
    );
  }
}

function validateDeploymentContext(
  input: DeploymentContextInventoryInput,
): void {
  for (const [value, label] of [
    [input.externalRef, "externalRef"],
    [input.name, "name"],
    [
      input.algorithmicSystemResourceId,
      "algorithmicSystemResourceId",
    ],
    [
      input.modelVersionResourceId,
      "modelVersionResourceId",
    ],
    [input.purpose, "purpose"],
    [
      input.decisionProcess,
      "decisionProcess",
    ],
    [
      input.decisionDomain,
      "decisionDomain",
    ],
    [
      input.affectedPopulationDescription,
      "affectedPopulationDescription",
    ],
    [
      input.operatorUnit,
      "operatorUnit",
    ],
    [
      input.geographicScope,
      "geographicScope",
    ],
    [
      input.outputDescription,
      "outputDescription",
    ],
  ] as const) {
    required(value, label);
  }

  if (
    input.inputDataCategories.length ===
    0
  ) {
    throw new Error(
      "inputDataCategories must contain at least one category",
    );
  }

  if (input.plannedStartAt) {
    validDateTime(
      input.plannedStartAt,
      "plannedStartAt",
    );
  }
  if (input.plannedEndAt) {
    validDateTime(
      input.plannedEndAt,
      "plannedEndAt",
    );
  }
  if (
    input.plannedStartAt &&
    input.plannedEndAt &&
    new Date(
      input.plannedEndAt,
    ).getTime() <
      new Date(
        input.plannedStartAt,
      ).getTime()
  ) {
    throw new Error(
      "plannedEndAt must not be before plannedStartAt",
    );
  }
}

function required(
  value: string,
  label: string,
): void {
  if (value.trim() === "") {
    throw new Error(
      label +
        " must be non-empty",
    );
  }
}

function validDateTime(
  value: string,
  label: string,
): void {
  if (
    Number.isNaN(
      Date.parse(value),
    )
  ) {
    throw new Error(
      label +
        " must be an ISO date-time",
    );
  }
}

function validUrl(
  value: string,
  label: string,
): void {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      label +
        " must contain valid http/https URLs",
    );
  }
}
