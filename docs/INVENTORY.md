# Inventory and lineage

PR 2 introduces the canonical Algorithmic Accountability inventory model.

The package is:

```text
@algorithmic-accountability/inventory
```

It maps application-specific inventory records onto ordinary CAIAE resources
through the public SDK.

## Three distinct identities

### Algorithmic system

Represents the underlying capability: a model, scoring engine, ranking system,
rules engine, generative system, or other automated decision capability.

The system record captures identity, purpose, ownership, provider/provenance,
and lifecycle state.

It deliberately does **not** contain an `approved` or `authorized` flag.

### Model version

Represents a materially identifiable release of an algorithmic system.

Each version points to exactly one algorithmic-system resource. Optional
previous-version lineage supports a reviewable sequence without rewriting
history.

Version records can capture release time, change summary, code revision,
artifact digest, and training-data version.

### Deployment context

Represents one concrete use of one model version.

It records:

- purpose;
- decision process and domain;
- affected-population description;
- operating unit and geographic scope;
- human role;
- decision effect;
- input data categories;
- output description;
- planned operating window; and
- whether appeal or review is available.

The deployment context is marked in resource metadata as the future
`authorizationSubject`.

## Why authorization belongs to deployment context

Algorithmic accountability is contextual.

The same model can be appropriate for an internal forecasting task and
inappropriate for a high-consequence eligibility decision. Likewise, a model
version authorized in one environment should not silently grant permission for
another use.

PR 2 therefore establishes this invariant:

> Model identity, version identity, and deployment authorization are separate
> concerns.

PR 4 will attach CAIAE authorization records to deployment-context resources.
It will not make a model globally "approved."

## Lineage enforcement

The inventory service checks engine state before creating linked records:

- model versions require an existing `algorithmic-system` parent;
- a previous version, when supplied, must be a `model-version` belonging to
  the same system;
- a deployment context requires both an algorithmic system and model version;
- the selected version must belong to the selected system.

These checks use the CAIAE SDK and do not access engine persistence directly.

## Status mapping

CAIAE exposes generic resource states. Application lifecycle states map as:

- development / validation / active -> `active`;
- paused -> `inactive`;
- retired -> `archived`.

The more specific application state remains in resource attributes.
