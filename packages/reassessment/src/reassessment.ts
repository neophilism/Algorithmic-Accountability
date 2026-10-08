import type {
  ComplianceEngineClient,
  EvidenceView,
  JsonObject,
  Resource,
} from "@caiae/sdk";

import type {
  AuthorizationContinuity,
  DeploymentAccountabilitySnapshot,
  OperationalReassessmentEvent,
  ReassessmentDecision,
  ReassessmentTrigger,
  RecordReassessmentTriggerInput,
} from "./types.js";

export type ReassessmentClient =
  Pick<
    ComplianceEngineClient,
    | "getResource"
    | "createEvidence"
  >;

const materialChangeTriggers =
  new Set<ReassessmentTrigger>([
    "material-model-change",
    "material-data-change",
    "material-purpose-change",
    "material-population-change",
    "material-decision-process-change",
  ]);

export function snapshotDeployment(
  resource: Resource,
): DeploymentAccountabilitySnapshot {
  if (
    resource.resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "reassessment snapshot requires a deployment-context resource",
    );
  }

  return {
    modelVersionResourceId:
      stringAttribute(
        resource,
        "modelVersionResourceId",
      ),
    purpose:
      stringAttribute(
        resource,
        "purpose",
      ),
    decisionProcess:
      stringAttribute(
        resource,
        "decisionProcess",
      ),
    affectedPopulationDescription:
      stringAttribute(
        resource,
        "affectedPopulationDescription",
      ),
    inputDataCategories:
      stringArrayAttribute(
        resource,
        "inputDataCategories",
      ),
  };
}

export function evaluateDeploymentChange(
  previous: DeploymentAccountabilitySnapshot,
  proposed: DeploymentAccountabilitySnapshot,
): ReassessmentDecision {
  const triggers:
    ReassessmentTrigger[] = [];

  if (
    previous.modelVersionResourceId !==
    proposed.modelVersionResourceId
  ) {
    triggers.push(
      "material-model-change",
    );
  }

  if (
    normalize(previous.purpose) !==
    normalize(proposed.purpose)
  ) {
    triggers.push(
      "material-purpose-change",
    );
  }

  if (
    normalize(
      previous.affectedPopulationDescription,
    ) !==
    normalize(
      proposed.affectedPopulationDescription,
    )
  ) {
    triggers.push(
      "material-population-change",
    );
  }

  if (
    normalize(
      previous.decisionProcess,
    ) !==
    normalize(
      proposed.decisionProcess,
    )
  ) {
    triggers.push(
      "material-decision-process-change",
    );
  }

  if (
    !sameStringSet(
      previous.inputDataCategories,
      proposed.inputDataCategories,
    )
  ) {
    triggers.push(
      "material-data-change",
    );
  }

  return decisionFor(
    triggers,
  );
}

export function evaluateOperationalEvent(
  event: OperationalReassessmentEvent,
): ReassessmentDecision {
  if (
    event.summary.trim() === ""
  ) {
    throw new Error(
      "operational reassessment event summary is required",
    );
  }

  return decisionFor([
    event.kind,
  ]);
}

export function combineReassessmentDecisions(
  ...decisions: ReassessmentDecision[]
): ReassessmentDecision {
  const triggers =
    uniqueTriggers(
      decisions.flatMap(
        (decision) =>
          decision.triggers,
      ),
    );

  return decisionFor(
    triggers,
  );
}

export async function recordReassessmentTrigger(
  client: ReassessmentClient,
  input: RecordReassessmentTriggerInput,
): Promise<EvidenceView> {
  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );

  if (
    deployment.resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "reassessment trigger must attach to a deployment-context resource",
    );
  }

  if (
    !input.decision
      .reassessmentRequired ||
    input.decision.triggers
      .length === 0
  ) {
    throw new Error(
      "only actual reassessment requirements may be recorded as trigger evidence",
    );
  }

  if (
    input.summary.trim() ===
    ""
  ) {
    throw new Error(
      "reassessment trigger summary is required",
    );
  }

  if (
    Number.isNaN(
      Date.parse(
        input.observedAt,
      ),
    )
  ) {
    throw new Error(
      "observedAt must be an ISO date-time",
    );
  }

  for (
    const uri of
    input.sourceUris ?? []
  ) {
    validateHttpUrl(uri);
  }

  return client.createEvidence({
    resourceId:
      input.deploymentContextResourceId,
    evidenceType:
      "algorithmic-reassessment-trigger",
    title:
      "Reassessment required: " +
      input.decision.triggers.join(
        ", ",
      ),
    source:
      "algorithmic-accountability",
    capturedAt:
      input.observedAt,
    ...(input.sourceUris?.[0]
      ? {
          uri:
            input.sourceUris[0],
        }
      : {}),
    provenance: jsonObject({
      observedAt:
        input.observedAt,
      sourceUris:
        input.sourceUris ?? [],
      methodology:
        "algorithmic-accountability-reassessment-v1",
    }),
    attributes: jsonObject({
      summary:
        input.summary.trim(),
      triggers:
        input.decision.triggers,
      authorizationContinuity:
        input.decision
          .authorizationContinuity,
      rationale:
        input.decision.rationale,
      ...(input.previousSnapshot
        ? {
            previousSnapshot:
              input.previousSnapshot,
          }
        : {}),
      ...(input.proposedSnapshot
        ? {
            proposedSnapshot:
              input.proposedSnapshot,
          }
        : {}),
      ...(input.relatedAuthorizationId
        ? {
            relatedAuthorizationId:
              input.relatedAuthorizationId,
          }
        : {}),
      ...(input.priorAssessmentEvidenceId
        ? {
            priorAssessmentEvidenceId:
              input.priorAssessmentEvidenceId,
          }
        : {}),
    }),
    metadata: {
      accountabilityDomain:
        "algorithmic-accountability",
      evidenceKind:
        "reassessment-trigger",
      authorizationContinuity:
        input.decision
          .authorizationContinuity,
    },
  });
}

function decisionFor(
  rawTriggers: ReassessmentTrigger[],
): ReassessmentDecision {
  const triggers =
    uniqueTriggers(
      rawTriggers,
    );

  if (
    triggers.length === 0
  ) {
    return {
      reassessmentRequired:
        false,
      triggers: [],
      authorizationContinuity:
        "continues",
      rationale:
        "No configured reassessment trigger was detected.",
    };
  }

  const hasMaterialChange =
    triggers.some(
      (trigger) =>
        materialChangeTriggers.has(
          trigger,
        ),
    );

  const authorizationContinuity:
    AuthorizationContinuity =
    hasMaterialChange
      ? "reauthorization-required"
      : "review-required";

  return {
    reassessmentRequired: true,
    triggers,
    authorizationContinuity,
    rationale:
      hasMaterialChange
        ? "A material deployment change requires a new assessment and authorization before the changed deployment is treated as authorized."
        : "An operational or scheduled trigger requires reassessment. Existing authorization is not automatically rewritten or converted into a pass.",
  };
}

function uniqueTriggers(
  triggers: ReassessmentTrigger[],
): ReassessmentTrigger[] {
  return [
    ...new Set(triggers),
  ];
}

function normalize(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function sameStringSet(
  a: string[],
  b: string[],
): boolean {
  const left = [
    ...new Set(
      a.map(normalize),
    ),
  ].sort();
  const right = [
    ...new Set(
      b.map(normalize),
    ),
  ].sort();

  return (
    left.length ===
      right.length &&
    left.every(
      (value, index) =>
        value === right[index],
    )
  );
}

function stringAttribute(
  resource: Resource,
  key: string,
): string {
  const value =
    resource.attributes[key];

  if (
    typeof value !==
      "string" ||
    value.trim() === ""
  ) {
    throw new Error(
      "deployment context is missing " +
        key,
    );
  }

  return value;
}

function stringArrayAttribute(
  resource: Resource,
  key: string,
): string[] {
  const value =
    resource.attributes[key];

  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        typeof item !==
        "string",
    )
  ) {
    throw new Error(
      "deployment context is missing " +
        key,
    );
  }

  return value as string[];
}

function validateHttpUrl(
  value: string,
): void {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "http:" &&
      url.protocol !==
        "https:"
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "source URIs must use http or https",
    );
  }
}

function jsonObject(
  value: unknown,
): JsonObject {
  return JSON.parse(
    JSON.stringify(value),
  ) as JsonObject;
}
