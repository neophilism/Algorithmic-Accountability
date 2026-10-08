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

**PR 10 — Reporting, transparency, and certification**

PR 10 adds operator and public-safe reporting:

- a server-side operator portfolio across deployment contexts;
- per-deployment accountability reports covering assessments, monitoring, incidents, findings, deadlines, and certifications;
- aggregate dashboard metrics;
- text/CSV engine report export;
- whitelist-based public accountability summaries that never dump arbitrary engine attributes; and
- optional certification issuance only when an explicit policy authority and supporting CAIAE check are supplied.

Certification remains policy-driven and is not treated as a universal "AI approved" state.

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
- [Authorization before deployment](docs/AUTHORIZATION.md)
- [Material change and reassessment](docs/REASSESSMENT.md)
- [Continuous monitoring](docs/MONITORING.md)
- [Complaints, incidents, and findings](docs/CASES-FINDINGS.md)
- [Corrective action](docs/CORRECTIVE-ACTION.md)
- [Deadlines and renewal](docs/DEADLINES-RENEWAL.md)
- [Reporting and transparency](docs/REPORTING-TRANSPARENCY.md)
- [Development plan](docs/DEVELOPMENT-PLAN.md)
