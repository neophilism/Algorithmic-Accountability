# Architecture

Algorithmic Accountability is a thin application of the
[Compliance, Authorization & Immutable Audit Engine](https://github.com/neophilism/Compliance-Authorization-Immutable-Audit-Engine).

The application owns algorithmic-accountability vocabulary, policy bundles,
assessment schemas, workflow composition, presentation, and demonstration
fixtures. The upstream engine owns reusable compliance, authorization,
evidence, deadline, finding, remediation, certification, reporting, security,
and tamper-evident audit primitives.

## Governing distinction

This application is intentionally unlike Federal Encryption Compliance.

Federal Encryption primarily asks whether a technical system satisfies a
defined body of encryption requirements.

Algorithmic Accountability asks whether a **particular deployment context** of
an algorithmic system has been assessed and authorized, whether its conditions
remain satisfied during operation, and whether material changes or observed
harms require reassessment, remediation, suspension, renewal, or retirement.

A model is therefore not treated as globally "approved" merely because one use
was approved.

## Core resources

### Algorithmic system

The model, rules engine, scoring system, ranking system, or automated decision
capability.

### Deployment context

The specific use of an algorithmic system: purpose, decision process, affected
population, operator, environment, and other context needed to judge whether
that use is acceptable.

This is the primary authorization subject.

### Model version

A materially identifiable release. Historical authorizations and assessments
remain attached to the version and deployment context they actually evaluated.

## Accountability lifecycle

```text
inventory
  -> impact assessment
  -> authorization
  -> deployment
  -> monitoring
  -> reassessment
  -> finding
  -> remediation
  -> renewal or retirement
```

Material changes can move an operating deployment back into assessment and
authorization without erasing its previous history.

## Engine boundary

Downstream runtime code uses `@caiae/sdk`. It must not reach into CAIAE
database tables or internal service packages.

If a reusable capability needed by Algorithmic Accountability is absent from
the SDK, the preferred sequence is:

1. define the generic capability upstream;
2. expose it through the CAIAE SDK;
3. consume the new SDK surface here.

Algorithmic-specific nouns and policy assumptions stay downstream.

## Legal status

PR 1 establishes a generic governance framework and assumes **no enacted
statute or legal mandate**. Later policy bundles may map concrete laws,
regulations, procurement rules, executive policies, or organizational
standards onto the same application lifecycle without changing the generic
engine.
