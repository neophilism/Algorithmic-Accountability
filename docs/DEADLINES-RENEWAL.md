# Deadlines, periodic review, and renewal

PR 9 adds the accountability calendar for algorithmic deployments.

The application uses CAIAE's generic deadline engine rather than introducing a
second scheduler.

## Deadline classes

The downstream application defines six semantic deadline kinds:

- `impact-assessment`;
- `reassessment`;
- `monitoring-review`;
- `remediation`;
- `authorization-renewal`; and
- `retirement-closeout`.

They are persisted in CAIAE with namespaced deadline types such as:

```text
algorithmic-accountability.authorization-renewal
```

All deadlines are attached to the relevant `deployment-context` subject and
resource.

## Recurring monitoring and periodic review

The CAIAE deadline recurrence primitive is used directly for recurring
monitoring reviews. Applications may specify an interval, end date, and/or
maximum occurrence count.

No background cadence is hard-coded into the generic engine or this thin
application. Concrete policy bundles decide the required review frequency.

## Authorization renewal readiness

Renewal is deliberately **not** automatic.

The application evaluates whether the current record is ready to enter a new
authorization decision. The current checks are:

1. the deployment context is still active;
2. the authorization belongs to that deployment;
3. the existing authorization is currently approved and within its validity
   window;
4. an active algorithmic impact assessment exists;
5. the assessment is within the configured review-age window;
6. no unresolved high or critical findings exist; and
7. if the current authorization requires monitoring, current monitoring
   observation evidence exists.

Passing these checks means the deployment is eligible to **request renewal**.
It does not extend the authorization and does not bypass the approval workflow
from PR 4.

## Remediation clocks

Finding remediation may already carry a remediation due date through CAIAE.
PR 9 additionally supports a first-class accountability deadline linked to the
finding when a policy or oversight workflow requires explicit deadline
tracking, warning windows, grace periods, or escalation.

## Retirement

Archived deployments reject new assessment, monitoring, remediation, or
renewal deadlines. They may receive only `retirement-closeout` deadlines for
final records, evidence, deletion/retention work, or other closure obligations.

## Policy neutrality

This package establishes scheduling mechanics, not mandatory periods.

A later legal, regulatory, procurement, or organizational policy bundle can
set exact periods without changing CAIAE or the calendar package.
