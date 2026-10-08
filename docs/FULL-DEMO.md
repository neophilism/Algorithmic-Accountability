# Full fictional demonstration

PR 11 provides a self-contained public demonstration of the Algorithmic
Accountability application.

The demo requires no database, operator token, or external CAIAE deployment.
It is activated explicitly with:

```text
AA_DEMO_MODE=true
```

All records are fictional.

## Demonstrated lifecycle states

The public portfolio contains five deliberately different deployment contexts.

### Permit Review Assistant

A limited-risk use that was assessed, authorized, deployed, and is operating
within monitoring thresholds.

### Housing Priority Score

A high-impact deployment with conditional authorization, mandatory human
review, appeal availability, enhanced disparity monitoring, and an active
medium-severity corrective action.

### Benefits Eligibility Screen

A critical-risk proposed deployment that was **blocked before launch** because
the impact assessment found unacceptable residual risk, inadequate human
review, and insufficient subgroup validation.

This case demonstrates that the engine can enforce authorization-before-
deployment rather than merely audit systems after they are already operating.

### Claims Priority Model v4

A previously authorized use whose new model version introduces a material
change. The old authorization does not silently carry forward; the new version
returns to reassessment and requires reauthorization.

### Fraud Alert Routing

A deployed system whose monitoring threshold was breached. The demo shows the
chain:

```text
monitoring breach
  -> reassessment
  -> incident evidence
  -> formal finding
  -> operational suspension
  -> corrective action
  -> verification deadline
```

## Drill-downs

Every deployment can be opened from the portfolio. The detail view shows:

- system/version identity;
- risk tier;
- deployment purpose and affected population;
- human decision role;
- authorization state and conditions;
- impact-assessment state;
- monitoring state;
- findings;
- remediation;
- deadlines; and
- a chronological accountability history.

## Safety and truthfulness

The demo is visibly labeled **Fictional demonstration data**.

It does not claim:

- that any named organization actually uses these systems;
- that any legal regime requires these controls;
- that a fictional authorization is a real governmental approval; or
- that the underlying policy framework is enacted law.

## Preview deployment

The repository includes a Render Blueprint for a free public preview with
`AA_DEMO_MODE=true`.

After deployment, run:

```bash
PREVIEW_BASE_URL=https://algorithmic-accountability-preview.onrender.com npm run preview:smoke
```

The smoke test covers the portfolio, config endpoint, demo health endpoint, dashboard
API, and representative drill-down pages.
