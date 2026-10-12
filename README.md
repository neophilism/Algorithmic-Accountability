# Algorithmic Accountability

**Full development plan and cross-account handoff:** [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md).

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

**PR 11 — Full fictional demonstration**

PR 11 adds the complete self-contained demonstration:

- five fictional deployment contexts spanning approved, conditional, blocked, reassessment, and suspended states;
- a low-risk authorized use;
- a high-impact conditional authorization;
- a proposed system blocked before launch;
- a material model change requiring reassessment and reauthorization;
- a monitoring-threshold breach that becomes an incident, finding, suspension, and corrective action;
- clickable deployment drill-downs with authorization conditions, assessments, monitoring, findings, remediation, deadlines, and immutable timeline; and
- a reproducible Render preview plus smoke test.

The public demo requires no database or operator credentials and is visibly labeled fictional.

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
- [Full fictional demonstration](docs/FULL-DEMO.md)
- [Development plan](docs/DEVELOPMENT-PLAN.md)

## End-to-End Everywhere progress

The canonical [security/e2eesa-status.json](security/e2eesa-status.json) records standard implementation, complete testing and independent expert review separately. Engine Room reads it automatically from GitHub. All initial stages are pending; existing profile locks and approved decisions remain authoritative. Read [adoption and independent-account instructions](docs/E2EESA_ADOPTION.md), and run `python3 scripts/validate_e2eesa_status.py`. Record validation does not establish product security or certification.
