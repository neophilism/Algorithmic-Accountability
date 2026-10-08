# Authorization before deployment

PR 4 makes the deployment context the enforceable authorization boundary.

A model or model version is never globally marked "approved." Authorization is
requested for a specific deployment context after an active impact assessment
exists.

## Prerequisite

Before an authorization request can be created, the application verifies:

1. the target is a `deployment-context` resource;
2. the deployment has an active `algorithmic-impact-assessment` evidence
   record; and
3. that evidence contains a valid residual risk tier.

The authorization record stores the exact assessment evidence ID used for the
decision.

## Risk-sensitive quorum

The application policy sets a minimum approval quorum:

- minimal: 1;
- limited: 1;
- high: 2;
- critical: 3.

A request may require a larger quorum but never a smaller one.

This is downstream governance policy, not a CAIAE engine assumption.

## Conditions

Every request contains structured operating conditions including:

- allowed purpose;
- whether human review is required;
- whether appeal/review is required;
- whether monitoring is required;
- prohibited uses; and
- optional additional conditions.

CAIAE persists these as ordinary authorization conditions.

## Scope

The authorization scope snapshots the deployment context's:

- system resource;
- model-version resource; and
- stated purpose.

This means a later model-version or purpose change does not silently inherit an
older approval. PR 5 turns those changes into formal reassessment triggers.

## Validity and effectiveness

Every deployment authorization has an explicit expiration.

The application uses CAIAE's native authorization-effectiveness calculation to
distinguish pending, denied, revoked, expired, not-yet-valid, validity-expired,
and approved states.

## Emergency mode

Emergency authorization is still a separate, auditable authorization record. It
requires:

- an explicit justification;
- an emergency review due time; and
- a validity expiration no earlier than the required review.

Emergency mode does **not** change the impact-assessment risk tier or transform
failed checks/findings into passes.

## Decision and revocation

Reviewers record approve/deny decisions through the CAIAE SDK with mandatory
rationale. Revocation likewise requires a principal and reason.

The full decision trail remains in CAIAE's immutable audit history.
