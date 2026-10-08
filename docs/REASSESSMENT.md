# Material change and reassessment

PR 5 establishes when an operating or proposed deployment must return to
assessment and, where necessary, authorization.

## Material deployment changes

The application compares the accountability snapshot previously assessed with
the proposed deployment state.

The following changes are material:

- model version;
- input-data categories;
- purpose;
- affected-population description; and
- decision process.

Any of these produces:

```text
reassessmentRequired = true
authorizationContinuity = reauthorization-required
```

The existing authorization history is not edited. Instead, the changed
deployment requires a new assessment and new authorization before the changed
state is treated as authorized.

## Operational triggers

The following events also require reassessment:

- a newly observed harm or incident;
- a monitoring-threshold breach; and
- a scheduled review.

These produce:

```text
authorizationContinuity = review-required
```

That does **not** automatically revoke or rewrite an existing authorization.
Later incident/finding and corrective-action PRs determine whether continued
operation should be suspended or authorization revoked.

## Reassessment-trigger evidence

Actual reassessment requirements can be persisted through the CAIAE SDK as:

```text
algorithmic-reassessment-trigger
```

The evidence can record:

- trigger type(s);
- observation time;
- summary;
- prior and proposed accountability snapshots;
- related authorization ID;
- prior assessment evidence ID;
- source URIs; and
- the resulting authorization-continuity decision.

This gives the eventual reassessment a traceable reason for occurring.

## Version continuity rule

A deployment authorized for model version A is not automatically authorized for
model version B.

The authorization itself remains historically valid for the scope it actually
covered, while the proposed version change creates a separate reauthorization
requirement.

That distinction preserves immutable decision history without allowing stale
approvals to drift onto materially different deployments.
