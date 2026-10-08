# Impact assessment and risk classification

PR 3 adds a context-specific algorithmic impact assessment workflow.

Assessments attach to **deployment-context** resources, not globally to an
algorithmic system. This preserves the central design rule that the same model
may have very different accountability outcomes in different uses.

## Assessment dimensions

Every assessment must address:

- purpose limitation;
- affected population;
- human review;
- data governance;
- privacy;
- security;
- performance;
- fairness;
- explainability;
- contestability;
- accessibility; and
- recordkeeping.

Each dimension receives a status and a written rationale. A dimension marked
not applicable still requires an explanation.

## Benefits and harms

An assessment records at least one intended benefit and at least one foreseeable
harm analysis.

Each harm records:

- category and description;
- affected group;
- severity;
- likelihood;
- mitigation;
- optional residual severity; and
- optional residual likelihood.

## Risk classification

PR 3 uses a deterministic 4 x 5 severity/likelihood matrix.

Severity weights:

- low = 1;
- moderate = 2;
- high = 3;
- critical = 4.

Likelihood weights:

- rare = 1;
- unlikely = 2;
- possible = 3;
- likely = 4;
- almost certain = 5.

The maximum harm score defines the gross score. The maximum post-mitigation
score defines residual risk.

Residual tiers are:

- 0-4: minimal;
- 5-8: limited;
- 9-12: high;
- 13-20: critical.

This classification is application policy, not a hard-coded CAIAE engine rule.

## Evidence persistence

A complete assessment is stored through `@caiae/sdk` as evidence type:

```text
algorithmic-impact-assessment
```

The evidence record stores:

- structured assessment content;
- computed gross/residual risk;
- assessor and assessment identity;
- source/provenance links;
- assessment timestamp; and
- optional supersession of an earlier assessment.

The engine supplies generic immutable evidence history. The downstream
application owns the algorithmic-accountability schema and risk semantics.

## Next step

PR 4 uses these assessments as prerequisites for authorization-before-deployment.
