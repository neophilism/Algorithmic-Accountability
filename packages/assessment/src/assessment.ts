import {
  accountabilityDimensions,
} from "@algorithmic-accountability/policy";
import type {
  ComplianceEngineClient,
  EvidenceView,
  Resource,
} from "@caiae/sdk";

import {
  classifyImpactRisk,
} from "./risk.js";
import type {
  AssessmentCompletenessIssue,
  ImpactAssessmentInput,
} from "./types.js";

export type AssessmentClient =
  Pick<
    ComplianceEngineClient,
    | "getResource"
    | "createEvidence"
  >;

export function validateImpactAssessment(
  input: ImpactAssessmentInput,
): AssessmentCompletenessIssue[] {
  const issues:
    AssessmentCompletenessIssue[] =
    [];

  if (
    input.intendedBenefits
      .map((value) =>
        value.trim(),
      )
      .filter(Boolean)
      .length === 0
  ) {
    issues.push({
      code: "missing-benefit",
      path: "intendedBenefits",
      message:
        "At least one intended benefit is required.",
    });
  }

  if (
    input.foreseeableHarms
      .length === 0
  ) {
    issues.push({
      code:
        "missing-harm-analysis",
      path: "foreseeableHarms",
      message:
        "At least one foreseeable-harm analysis is required.",
    });
  }

  for (
    const dimension of
    accountabilityDimensions
  ) {
    const assessment =
      input.dimensions[
        dimension
      ];
    if (
      !assessment ||
      assessment.rationale
        .trim() === ""
    ) {
      issues.push({
        code:
          "missing-dimension-rationale",
        path:
          "dimensions." +
          dimension,
        message:
          "Every accountability dimension requires a rationale.",
      });
    }
  }

  if (
    input.overallRationale
      .trim() === ""
  ) {
    issues.push({
      code:
        "missing-overall-rationale",
      path:
        "overallRationale",
      message:
        "Overall assessment rationale is required.",
    });
  }

  if (
    Number.isNaN(
      Date.parse(
        input.assessedAt,
      ),
    )
  ) {
    issues.push({
      code: "invalid-date",
      path: "assessedAt",
      message:
        "assessedAt must be an ISO date-time.",
    });
  }

  for (
    const [
      index,
      sourceUri,
    ] of (
      input.sourceUris ?? []
    ).entries()
  ) {
    if (
      !isHttpUrl(sourceUri)
    ) {
      issues.push({
        code:
          "invalid-source-uri",
        path:
          "sourceUris[" +
          index +
          "]",
        message:
          "Assessment source URIs must use http or https.",
      });
    }
  }

  return issues;
}

export async function createImpactAssessmentEvidence(
  client: AssessmentClient,
  input: ImpactAssessmentInput,
): Promise<EvidenceView> {
  const deployment =
    await client.getResource(
      input.deploymentContextResourceId,
    );

  requireDeploymentContext(
    deployment,
  );

  const issues =
    validateImpactAssessment(
      input,
    );

  if (issues.length > 0) {
    throw new Error(
      "impact assessment is incomplete: " +
        issues
          .map(
            (issue) =>
              issue.path,
          )
          .join(", "),
    );
  }

  const risk =
    classifyImpactRisk(
      input.foreseeableHarms,
    );

  return client.createEvidence({
    resourceId:
      input.deploymentContextResourceId,
    evidenceType:
      "algorithmic-impact-assessment",
    title:
      input.title.trim(),
    source:
      "algorithmic-accountability",
    capturedAt:
      input.assessedAt,
    ...(input.sourceUris?.[0]
      ? {
          uri:
            input.sourceUris[0],
        }
      : {}),
    ...(input.supersedesEvidenceId
      ? {
          supersedesEvidenceId:
            input.supersedesEvidenceId,
        }
      : {}),
    provenance: {
      assessmentId:
        input.assessmentId,
      assessor:
        input.assessor,
      assessedAt:
        input.assessedAt,
      sourceUris:
        input.sourceUris ?? [],
      methodology:
        "algorithmic-accountability-impact-assessment-v1",
    },
    attributes: {
      intendedBenefits:
        input.intendedBenefits,
      foreseeableHarms:
        input.foreseeableHarms,
      dimensions:
        input.dimensions,
      overallRationale:
        input.overallRationale,
      risk,
    },
    metadata: {
      accountabilityDomain:
        "algorithmic-accountability",
      assessmentKind:
        "impact-assessment",
      riskTier:
        risk.tier,
      grossRiskScore:
        risk.grossScore,
      residualRiskScore:
        risk.residualScore,
    },
  });
}

function requireDeploymentContext(
  resource: Resource,
): void {
  if (
    resource.resourceType !==
    "deployment-context"
  ) {
    throw new Error(
      "impact assessment must attach to a deployment-context resource",
    );
  }
}

function isHttpUrl(
  value: string,
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}
