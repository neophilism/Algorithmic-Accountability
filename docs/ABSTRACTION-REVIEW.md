# PR 12 — second thin-application abstraction review

## Architectural conclusion

Algorithmic Accountability exercises CAIAE using context-specific authorization, assessment evidence, monitoring, reassessment, findings, deadlines, remediation, certification and reporting. Federal Encryption Compliance exercises the same public engine from a different policy domain.

The domain boundary remains: algorithmic-system, model-version, deployment-context, risk matrices, fairness thresholds, impact dimensions, human review, contestability, and algorithmic-specific certification authority belong to this application, not CAIAE.

Generic cross-domain components — resources, evidence, authorization, findings, deadlines, remediation, certification and reporting — are already expressed in CAIAE. This review identified no further SDK extension that is justified without a reproducible missing generic capability. Do not introduce domain nouns upstream merely to complete this milestone.

## Enforced coupling check

Run `npm run check:boundary`. This audits TypeScript and JavaScript source in apps/ and packages/, rejects non-SDK `@caiae/*` imports and direct references to `vendor/caiae`, and runs during `npm run typecheck` in CI. It is a guardrail against accidental internal engine coupling, not a full supply-chain audit.

The engine is intentionally pinned as a submodule for reproducible builds. Any future upgrade must separately validate SDK compatibility, authorization invariants, and migration behavior.

## Access boundary / production gates

The Render Blueprint runs `AA_DEMO_MODE=true` and hosts **fictional data only**. In real-data mode, application pages and APIs fail closed until `AA_ADMIN_USERNAME` and a password of at least 16 characters (`AA_ADMIN_PASSWORD`) are configured. They then require matching HTTP Basic credentials. Always use HTTPS; this is a small operator access gate, **not** individual RBAC, MFA, session management, or a replacement for engine authorization policies. Before sensitive or multi-user production use, introduce individual identities, MFA, authorization and access audit logging. The public health probe is not an authorization or data-access endpoint.

No use of the fictional demo establishes that an external CAIAE service is live or that any real deployment has been authorized.

## Operational acceptance

1. GitHub CI: boundary check, strict types, tests and production build.
2. Render: deploy the free public fictional preview and run `npm run preview:smoke` with its actual HTTPS URL.
3. Real engine: configure CAIAE endpoint, organization, token and operator access secret via provider secret storage; validate end-to-end access denial and legitimate scoped read.
4. Engine Room: observe real GitHub PR state and real Render health/deploy telemetry independently. A passing demo must never be labeled production-ready.
5. Never ship secrets in the repository; document the upstream engine pin and deploy revision.
