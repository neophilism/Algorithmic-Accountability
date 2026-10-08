import type {
  ClassifiedRisk,
  ForeseeableHarm,
  HarmLikelihood,
  HarmSeverity,
  RiskTier,
} from "./types.js";

const severityWeight: Record<
  HarmSeverity,
  number
> = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

const likelihoodWeight: Record<
  HarmLikelihood,
  number
> = {
  rare: 1,
  unlikely: 2,
  possible: 3,
  likely: 4,
  "almost-certain": 5,
};

export function classifyImpactRisk(
  harms: ForeseeableHarm[],
): ClassifiedRisk {
  let grossScore = 0;
  let residualScore = 0;
  let highestGrossHarmIndex:
    number | null = null;
  let highestResidualHarmIndex:
    number | null = null;

  harms.forEach(
    (harm, index) => {
      const gross =
        score(
          harm.severity,
          harm.likelihood,
        );
      const residual =
        score(
          harm.residualSeverity ??
            harm.severity,
          harm.residualLikelihood ??
            harm.likelihood,
        );

      if (gross > grossScore) {
        grossScore = gross;
        highestGrossHarmIndex =
          index;
      }

      if (
        residual >
        residualScore
      ) {
        residualScore =
          residual;
        highestResidualHarmIndex =
          index;
      }
    },
  );

  return {
    tier:
      tierFor(
        residualScore,
      ),
    grossScore,
    residualScore,
    highestGrossHarmIndex,
    highestResidualHarmIndex,
  };
}

export function tierFor(
  score: number,
): RiskTier {
  if (score <= 4) {
    return "minimal";
  }
  if (score <= 8) {
    return "limited";
  }
  if (score <= 12) {
    return "high";
  }
  return "critical";
}

function score(
  severity: HarmSeverity,
  likelihood: HarmLikelihood,
): number {
  return (
    severityWeight[severity] *
    likelihoodWeight[likelihood]
  );
}
