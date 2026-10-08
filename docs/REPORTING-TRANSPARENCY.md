# Reporting, transparency, and certification

PR 10 turns the accumulated Algorithmic Accountability lifecycle into operator
and public-safe reporting surfaces.

## Operator portfolio

The web application can now load every `deployment-context` in the configured
CAIAE organization and build a portfolio view containing:

- open and blocking findings;
- overdue deadlines;
- active impact assessments;
- monitoring observations; and
- active certifications.

The dashboard uses server-side operator credentials only. Public configuration
endpoints never expose the operator token.

## Deployment accountability report

`@algorithmic-accountability/reporting` builds a detailed deployment report
from CAIAE resources, evidence, findings, deadlines, certifications, and the
generic compliance report.

The package also exposes CAIAE's rendered text/CSV compliance reports rather
than reimplementing export logic.

## Public-safe summary

Public transparency is opt-in and whitelist-based.

The default public projection may include:

- purpose;
- decision domain;
- human role;
- decision effect; and
- whether appeal/review is available.

It does **not** dump arbitrary resource attributes. Fields such as internal
notes, vendor-sensitive information, detailed input categories, or affected
population descriptions are not published merely because they exist in engine
state.

Callers may further reduce the allowed field list.

## Certification is optional

The application does not assume that every deployment requires certification.

A certification can be issued only when the caller explicitly supplies:

- a certification type;
- a supporting CAIAE check;
- an issuing principal; and
- the policy authority that calls for certification.

The policy authority is persisted in certification metadata. This keeps
certification traceable to a real organizational, contractual, regulatory, or
legal basis rather than manufacturing a generic "AI approved" badge.

CAIAE remains responsible for certification criteria, blocking findings,
validity, suspension, reinstatement, revocation, renewal, and public
verification.

## Architectural boundary

No CAIAE internal database or service package is imported. Reporting,
certification, deadlines, evidence, and findings are consumed through
`@caiae/sdk`.
