# Continuous monitoring

PR 6 adds operational monitoring to the accountability lifecycle.

Monitoring is attached to a specific deployment context and uses CAIAE evidence
records for both the approved monitoring plan and each observation.

## Monitoring plan

A plan records:

- owner;
- cadence;
- validity window;
- source/provenance links; and
- one or more typed metric definitions.

Supported metric categories are:

- performance;
- reliability;
- fairness;
- drift;
- data quality;
- human override;
- contestability.

The framework supports minimum, maximum, and range thresholds.

## Observation requirements

Each observation must provide exactly one finite numeric value for every metric
defined by the active plan. Missing, duplicate, or unknown metrics are rejected.

Observation evidence is stored as:

```text
algorithmic-monitoring-observation
```

It contains the observed values, pass/fail result, and any threshold breaches.

## Threshold-driven reassessment

A passing observation simply becomes part of the deployment's evidence history.

If one or more thresholds are breached, PR 6 automatically creates a
`monitoring-threshold-breach` reassessment decision and persists the associated
`algorithmic-reassessment-trigger` evidence introduced in PR 5.

The result is:

```text
monitoring observation
  -> threshold evaluation
  -> breach
  -> reassessment trigger
  -> review-required authorization continuity
```

The breach does not silently revoke authorization and does not yet create a
formal finding. PR 7 owns complaints, incidents, and finding creation.

## Separation of concerns

CAIAE supplies generic evidence persistence and immutable history.

Algorithmic Accountability owns:

- which metrics matter;
- how thresholds are interpreted;
- what constitutes a breach; and
- the connection from breach to algorithmic reassessment.

This remains a downstream policy layer rather than adding AI-specific concepts
to the generic engine.
