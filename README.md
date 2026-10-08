# Algorithmic Accountability

Algorithmic Accountability is a thin application of the
[Compliance, Authorization & Immutable Audit Engine](https://github.com/neophilism/Compliance-Authorization-Immutable-Audit-Engine)
for governing algorithmic systems and automated decision deployments.

Unlike the Federal Encryption Compliance application, this project is centered
on **authorization before deployment and continuous accountability after
deployment** rather than technical encryption-control compliance.

## Core idea

The application separates:

- the **algorithmic system** itself;
- the **deployment context** in which it is used; and
- the **model version** actually assessed and authorized.

That distinction allows the same underlying system to have different
authorization outcomes for different purposes, populations, decision processes,
or versions.

The initial lifecycle is:

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

## Current milestone

**PR 3 — Impact assessment and risk classification**

PR 3 adds deployment-context impact assessment and risk classification:

- complete review across twelve accountability dimensions;
- intended-benefit and foreseeable-harm analysis;
- deterministic gross and residual risk scoring;
- explicit assessment completeness checks;
- provenance and source links;
- CAIAE evidence persistence through the SDK; and
- supersession support for reassessments without rewriting prior evidence.

No enacted statute or legal mandate is assumed by PR 1. The initial policy
source status is explicitly `policy-framework`.

## Upstream engine

Pinned engine commit:

```text
813711f056e2cb97102d6fdccad4effc55f74b1b
```

The engine is included at `vendor/caiae` as a pinned git submodule.
Downstream application code consumes reusable engine behavior through
`@caiae/sdk`; it does not share or reach into CAIAE database tables.

## Development

Requirements:

- Node.js 24
- npm
- git submodules

Clone with submodules, then run:

```bash
git submodule update --init --recursive
npm install
npm run typecheck
npm test
npm run build
```

For local development:

```bash
npm run dev
```

The default engine endpoint is `http://localhost:4000`. Override it with
`CAIAE_API_BASE_URL`.

See:

- [Architecture](docs/ARCHITECTURE.md)
- [Inventory and lineage](docs/INVENTORY.md)
- [Impact assessment](docs/IMPACT-ASSESSMENT.md)
- [Development plan](docs/DEVELOPMENT-PLAN.md)
