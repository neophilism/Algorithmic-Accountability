import type {
  ComplianceEngineClient,
  Evidence,
  EvidenceView,
  JsonObject,
  Resource,
} from "@caiae/sdk";
import {
  evaluateOperationalEvent,
  recordReassessmentTrigger,
  type ReassessmentDecision,
} from "@algorithmic-accountability/reassessment";

import type {
  MonitoringBreach,
  MonitoringEvaluation,
  MonitoringMetricDefinition,
  MonitoringObservationInput,
  MonitoringPlanInput,
  MonitoringThreshold,
} from "./types.js";

export type MonitoringClient =
  Pick<
    ComplianceEngineClient,
    | "getResource"
    | "getEvidence"
    | "createEvidence"
  >;

export interface RecordedMonitoringObservation {
  observationEvidence: EvidenceView;
  evaluation: MonitoringEvaluation;
  reassessmentDecision: ReassessmentDecision | null;
  reassessmentTriggerEvidence: EvidenceView | null;
}

export async function createMonitoringPlanEvidence(
  client: MonitoringClient,
  input: MonitoringPlanInput,
): Promise<EvidenceView> {
  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );

  requireDeploymentContext(
    deployment,
  );
  validatePlan(input);

  return client.createEvidence({
    resourceId:
      input.deploymentContextResourceId,
    evidenceType:
      "algorithmic-monitoring-plan",
    title: input.title.trim(),
    source:
      "algorithmic-accountability",
    capturedAt:
      input.createdAt,
    ...(input.validFrom
      ? {
          validFrom:
            input.validFrom,
        }
      : {}),
    ...(input.validUntil
      ? {
          validUntil:
            input.validUntil,
        }
      : {}),
    ...(input.sourceUris?.[0]
      ? {
          uri:
            input.sourceUris[0],
        }
      : {}),
    provenance: jsonObject({
      planId:
        input.planId,
      owner:
        input.owner,
      createdAt:
        input.createdAt,
      sourceUris:
        input.sourceUris ?? [],
      methodology:
        "algorithmic-accountability-monitoring-v1",
    }),
    attributes: jsonObject({
      planId:
        input.planId,
      owner:
        input.owner,
      cadenceDescription:
        input.cadenceDescription,
      metrics:
        input.metrics,
    }),
    metadata: {
      accountabilityDomain:
        "algorithmic-accountability",
      evidenceKind:
        "monitoring-plan",
    },
  });
}

export async function recordMonitoringObservation(
  client: MonitoringClient,
  input: MonitoringObservationInput,
): Promise<RecordedMonitoringObservation> {
  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );
  requireDeploymentContext(
    deployment,
  );

  validateObservationInput(
    input,
  );

  const planView =
    await client.getEvidence(
      input.monitoringPlanEvidenceId,
    );
  const plan =
    planView.evidence;

  validatePlanEvidence(
    plan,
    input.deploymentContextResourceId,
  );

  const metrics =
    parseMetrics(
      plan.attributes.metrics,
    );

  const evaluation =
    evaluateMonitoringObservation(
      metrics,
      input.values,
    );

  const observationEvidence =
    await client.createEvidence({
      resourceId:
        input.deploymentContextResourceId,
      evidenceType:
        "algorithmic-monitoring-observation",
      title:
        "Monitoring observation " +
        input.observationId,
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
        observationId:
          input.observationId,
        monitoringPlanEvidenceId:
          input.monitoringPlanEvidenceId,
        observedAt:
          input.observedAt,
        sourceUris:
          input.sourceUris ?? [],
      }),
      attributes: jsonObject({
        values:
          input.values,
        passed:
          evaluation.passed,
        breaches:
          evaluation.breaches,
      }),
      metadata: {
        accountabilityDomain:
          "algorithmic-accountability",
        evidenceKind:
          "monitoring-observation",
        thresholdBreach:
          !evaluation.passed,
      },
    });

  if (evaluation.passed) {
    return {
      observationEvidence,
      evaluation,
      reassessmentDecision:
        null,
      reassessmentTriggerEvidence:
        null,
    };
  }

  const decision =
    evaluateOperationalEvent({
      kind:
        "monitoring-threshold-breach",
      summary:
        breachSummary(
          evaluation.breaches,
        ),
    });

  const triggerEvidence =
    await recordReassessmentTrigger(
      client,
      {
        deploymentContextResourceId:
          input.deploymentContextResourceId,
        observedAt:
          input.observedAt,
        summary:
          breachSummary(
            evaluation.breaches,
          ),
        decision,
        sourceUris:
          input.sourceUris,
      },
    );

  return {
    observationEvidence,
    evaluation,
    reassessmentDecision:
      decision,
    reassessmentTriggerEvidence:
      triggerEvidence,
  };
}

export function evaluateMonitoringObservation(
  metrics: MonitoringMetricDefinition[],
  values: MonitoringObservationInput["values"],
): MonitoringEvaluation {
  const definitions =
    new Map(
      metrics.map(
        (metric) => [
          metric.metricId,
          metric,
        ],
      ),
    );

  const seen =
    new Set<string>();

  for (
    const value of values
  ) {
    if (
      seen.has(
        value.metricId,
      )
    ) {
      throw new Error(
        "duplicate monitoring observation metric: " +
          value.metricId,
      );
    }
    seen.add(
      value.metricId,
    );

    if (
      !definitions.has(
        value.metricId,
      )
    ) {
      throw new Error(
        "observation includes metric not defined by monitoring plan: " +
          value.metricId,
      );
    }

    if (
      !Number.isFinite(
        value.value,
      )
    ) {
      throw new Error(
        "monitoring observation values must be finite numbers",
      );
    }
  }

  for (
    const metric of metrics
  ) {
    if (
      !seen.has(
        metric.metricId,
      )
    ) {
      throw new Error(
        "observation is missing required monitoring metric: " +
          metric.metricId,
      );
    }
  }

  const breaches:
    MonitoringBreach[] = [];

  for (
    const value of values
  ) {
    const definition =
      definitions.get(
        value.metricId,
      )!;

    if (
      thresholdBreached(
        value.value,
        definition.threshold,
      )
    ) {
      breaches.push({
        metricId:
          definition.metricId,
        label:
          definition.label,
        category:
          definition.category,
        observedValue:
          value.value,
        threshold:
          definition.threshold,
      });
    }
  }

  return {
    passed:
      breaches.length === 0,
    breaches,
  };
}

function thresholdBreached(
  value: number,
  threshold: MonitoringThreshold,
): boolean {
  switch (threshold.kind) {
    case "minimum":
      return (
        value <
        threshold.value
      );
    case "maximum":
      return (
        value >
        threshold.value
      );
    case "range":
      return (
        value <
          threshold.minimum ||
        value >
          threshold.maximum
      );
  }
}

function validatePlan(
  input: MonitoringPlanInput,
): void {
  required(
    input.planId,
    "planId",
  );
  required(
    input.title,
    "title",
  );
  required(
    input.owner,
    "owner",
  );
  required(
    input.cadenceDescription,
    "cadenceDescription",
  );
  validDate(
    input.createdAt,
    "createdAt",
  );

  if (
    input.metrics.length === 0
  ) {
    throw new Error(
      "monitoring plan requires at least one metric",
    );
  }

  const ids =
    new Set<string>();

  for (
    const metric of
    input.metrics
  ) {
    required(
      metric.metricId,
      "metricId",
    );
    required(
      metric.label,
      "metric.label",
    );
    required(
      metric.unit,
      "metric.unit",
    );
    required(
      metric.description,
      "metric.description",
    );

    if (
      ids.has(
        metric.metricId,
      )
    ) {
      throw new Error(
        "monitoring metric ids must be unique",
      );
    }
    ids.add(
      metric.metricId,
    );

    validateThreshold(
      metric.threshold,
    );
  }

  if (input.validFrom) {
    validDate(
      input.validFrom,
      "validFrom",
    );
  }
  if (input.validUntil) {
    validDate(
      input.validUntil,
      "validUntil",
    );
  }

  for (
    const uri of
    input.sourceUris ?? []
  ) {
    validateHttpUrl(uri);
  }
}

function validateObservationInput(
  input: MonitoringObservationInput,
): void {
  required(
    input.observationId,
    "observationId",
  );
  validDate(
    input.observedAt,
    "observedAt",
  );

  if (
    input.values.length === 0
  ) {
    throw new Error(
      "monitoring observation requires values",
    );
  }

  for (
    const uri of
    input.sourceUris ?? []
  ) {
    validateHttpUrl(uri);
  }
}

function validatePlanEvidence(
  plan: Evidence,
  deploymentResourceId: string,
): void {
  if (
    plan.evidenceType !==
    "algorithmic-monitoring-plan" ||
    plan.status !==
    "active"
  ) {
    throw new Error(
      "monitoring observation requires an active algorithmic monitoring plan",
    );
  }

  if (
    plan.resourceId !==
    deploymentResourceId
  ) {
    throw new Error(
      "monitoring plan belongs to a different deployment context",
    );
  }
}

function parseMetrics(
  value: JsonObject[string],
): MonitoringMetricDefinition[] {
  if (
    !Array.isArray(value)
  ) {
    throw new Error(
      "monitoring plan evidence is missing metrics",
    );
  }

  const parsed =
    JSON.parse(
      JSON.stringify(value),
    ) as MonitoringMetricDefinition[];

  if (
    parsed.length === 0
  ) {
    throw new Error(
      "monitoring plan evidence contains no metrics",
    );
  }

  for (
    const metric of parsed
  ) {
    validateThreshold(
      metric.threshold,
    );
  }

  return parsed;
}

function validateThreshold(
  threshold: MonitoringThreshold,
): void {
  switch (threshold.kind) {
    case "minimum":
    case "maximum":
      if (
        !Number.isFinite(
          threshold.value,
        )
      ) {
        throw new Error(
          "monitoring threshold must be finite",
        );
      }
      return;
    case "range":
      if (
        !Number.isFinite(
          threshold.minimum,
        ) ||
        !Number.isFinite(
          threshold.maximum,
        ) ||
        threshold.minimum >
          threshold.maximum
      ) {
        throw new Error(
          "monitoring range threshold is invalid",
        );
      }
  }
}

function requireDeploymentContext(
  resource: Resource,
): void {
  if (
    resource.resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "monitoring must attach to a deployment-context resource",
    );
  }
}

function breachSummary(
  breaches: MonitoringBreach[],
): string {
  return (
    "Monitoring threshold breach: " +
    breaches
      .map(
        (breach) =>
          breach.metricId +
          "=" +
          breach.observedValue,
      )
      .join(", ")
  );
}

function required(
  value: string,
  label: string,
): void {
  if (
    value.trim() === ""
  ) {
    throw new Error(
      label +
        " must be non-empty",
    );
  }
}

function validDate(
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
