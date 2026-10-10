# Public preview uptime and demo-integrity checks

The public Render demo is hosted at:

https://algorithmic-accountability-preview.onrender.com

A GitHub Actions workflow (`.github/workflows/preview-smoke.yml`) runs after successful CI on `main`, on a 15-minute schedule and on manual dispatch. It invokes `scripts/preview-smoke.mjs` from a network-enabled runner. Unlike a green Render deploy, these tests request the actual HTTPS endpoints and verify **fictional demo content**.

The smoke monitor checks nine routes: the homepage, public configuration, demonstration engine-health, dashboard API and five individual deployment detail pages. It requires an explicit `demo: true` and `fictional: true` response; the dashboard must show five fictional deployments. An unauthorized, missing, stale or real-data response fails the run. Failures surface in GitHub Actions. GitHub scheduled jobs can be delayed or skipped and are not a guaranteed 24/7 SLA or paging service.

The preview remains a fictional demonstration, not a production multi-user accountability deployment. Real data requires the controls documented in [the abstraction audit](ABSTRACTION-REVIEW.md). Never add real operator credentials to the public preview.

Engine Room already inventories this repository and the associated Render service. Its provider deployment status and 10-minute HTTP observations should be shown as **separate** signals. Render free services may sleep and a HEAD or GET timeout alone does not prove outage. For a true production SLA, add dedicated monitoring, proper individual access controls and incident routing.
