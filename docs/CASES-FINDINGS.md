# Complaints, incidents, and findings

PR 7 separates reports, reviews, formal findings, and later remediation.

## Reported cases

A complaint or incident is first stored as evidence attached to a deployment
context:

```text
algorithmic-complaint
algorithmic-incident
```

The report records its own case ID, reporter type, severity, summary, time,
source links, and optional model-version / authorization references.

A report is **not** a finding merely because it exists.

## Review

A reviewer records a separate `algorithmic-case-review` evidence record with:

- substantiated or unsubstantiated outcome;
- reviewer identity;
- review timestamp;
- rationale; and
- link back to the original case evidence.

The original report remains unchanged.

## Finding creation

Every review runs a downstream accountability check through the CAIAE SDK.

An unsubstantiated review passes the check and does not create a formal finding.

A substantiated review fails the check and then uses CAIAE's generic
`syncFailedCheckFindings` capability. The engine creates the formal finding
with severity derived from the reviewed case.

That means the chain is explicit:

```text
report
  -> review
  -> substantiation check
  -> failed check
  -> formal finding
```

A substantiated case also creates the PR 5 `new-harm-or-incident`
reassessment trigger. The existing authorization is therefore marked for
review, but it is not silently rewritten or revoked.

## Finding workflow

PR 7 exposes CAIAE's generic finding workflow for algorithmic-accountability
cases:

- list findings;
- assign owner;
- acknowledge;
- dispute; and
- resolve a dispute by upholding or dismissing it.

PR 8 builds remediation, verification, suspension, and corrective action on top
of these findings.

## Traceability

The case check carries links to:

- deployment context;
- model version;
- original case evidence;
- review evidence; and
- related authorization, when one exists.

The resulting finding points back to the failed check. This keeps the whole
chain inspectable without adding AI-specific finding tables to CAIAE.
