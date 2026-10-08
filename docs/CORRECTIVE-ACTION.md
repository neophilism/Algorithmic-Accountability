# Remediation, suspension, and corrective action

PR 8 adds corrective action after a formal CAIAE finding.

## Remediation lifecycle

The downstream package wraps CAIAE's native remediation workflow:

```text
planned
  -> in progress
  -> ready for verification
  -> verified
```

Verification may reject work back for correction, and a remediation can also be
cancelled with an explicit reason.

A finding can only be closed by the application after every non-cancelled
remediation attached to it is verified.

## Operational suspension

CAIAE currently exposes authorization approval/denial/revocation but not a
generic authorization-suspension state.

PR 8 therefore does **not** invent one.

A temporary operational pause is represented by:

1. marking the deployment-context resource inactive through the CAIAE SDK; and
2. creating `algorithmic-operational-suspension` evidence with the responsible
   principal, reason, and optional finding/authorization references.

The authorization record itself remains historically unchanged. If permission
is formally withdrawn, the PR 4 authorization-revocation workflow should be
used.

## Resumption

An inactive deployment can resume only when:

- no open high/critical finding remains; and
- if an authorization ID is supplied, that authorization is effective at the
  resumption time.

Resumption returns the deployment resource to active and records
`algorithmic-operational-resumption` evidence.

## Retirement

Permanent retirement:

- archives the deployment-context resource;
- records retirement time and responsible principal;
- may link a replacement deployment context; and
- creates `algorithmic-deployment-retirement` evidence.

A replacement is a new deployment context with its own assessment,
authorization, and monitoring history. Retirement therefore does not rewrite or
transfer the old deployment's approvals.

## Boundary

CAIAE supplies findings, remediation state transitions, resources, evidence,
and immutable audit history.

Algorithmic Accountability supplies the policy that determines when a finding
requires an operational pause, when resumption is acceptable, and how
deployment retirement/replacement is represented.
