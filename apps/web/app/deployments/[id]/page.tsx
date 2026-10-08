import Link from "next/link";
import {
  notFound,
} from "next/navigation";
import {
  loadDeploymentAccountabilityReport,
} from "@algorithmic-accountability/reporting";

import {
  DemoBanner,
} from "../../../components/demo-banner";
import {
  getAlgorithmicAccountabilityDemoDeployment,
} from "../../../lib/demo";
import {
  isAlgorithmicAccountabilityDemoMode,
} from "../../../lib/demo-mode";
import {
  createOperatorEngineClient,
  readOperatorReadiness,
} from "../../../lib/operator";

export const dynamic =
  "force-dynamic";

export default async function DeploymentPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;
  const demoMode =
    isAlgorithmicAccountabilityDemoMode();

  if (demoMode) {
    const deployment =
      getAlgorithmicAccountabilityDemoDeployment(
        id,
      );

    if (!deployment) {
      notFound();
    }

    return (
      <main className="shell">
        <PageHeader />
        <DemoBanner />
        <nav className="detail-nav">
          <Link href="/">
            ← Portfolio
          </Link>
        </nav>

        <section className="detail-hero">
          <p className="eyebrow">
            {deployment.status} ·{" "}
            {deployment.riskTier} risk
          </p>
          <h1>
            {deployment.name}
          </h1>
          <p className="lede">
            {deployment.subtitle}
          </p>
        </section>

        <section className="detail-grid">
          <DetailCard
            label="System / version"
            value={
              deployment.systemName +
              " · " +
              deployment.modelVersion
            }
          />
          <DetailCard
            label="Authorization"
            value={
              deployment.authorization
                .state
            }
          />
          <DetailCard
            label="Assessment"
            value={
              deployment.assessment
                .state
            }
          />
          <DetailCard
            label="Monitoring"
            value={
              deployment.monitoring
                .state
            }
          />
        </section>

        <section className="two-column">
          <article className="panel">
            <div className="panel-heading">
              <p className="eyebrow">
                Deployment context
              </p>
              <h2>
                What is being governed
              </h2>
            </div>
            <div className="detail-copy">
              <LabelValue
                label="Purpose"
                value={
                  deployment.purpose
                }
              />
              <LabelValue
                label="Affected population"
                value={
                  deployment.affectedPopulation
                }
              />
              <LabelValue
                label="Human role"
                value={
                  deployment.humanRole
                }
              />
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <p className="eyebrow">
                Authorization conditions
              </p>
              <h2>
                Permission is contextual
              </h2>
            </div>
            <div className="detail-copy">
              <LabelValue
                label="Authority"
                value={
                  deployment.authorization
                    .authority
                }
              />
              <LabelValue
                label="Valid until"
                value={
                  deployment.authorization
                    .validUntil ??
                  "No active authorization"
                }
              />
              <ul className="condition-list">
                {deployment.authorization
                  .conditions.length >
                0 ? (
                  deployment.authorization.conditions.map(
                    (condition) => (
                      <li
                        key={
                          condition
                        }
                      >
                        {condition}
                      </li>
                    ),
                  )
                ) : (
                  <li>
                    No authorization
                    conditions because
                    deployment is not
                    approved.
                  </li>
                )}
              </ul>
            </div>
          </article>
        </section>

        <section className="two-column">
          <article className="panel">
            <div className="panel-heading">
              <p className="eyebrow">
                Impact assessment
              </p>
              <h2>
                {
                  deployment.assessment
                    .residualRisk
                }{" "}
                residual risk
              </h2>
            </div>
            <div className="detail-copy">
              <p>
                {
                  deployment.assessment
                    .summary
                }
              </p>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <p className="eyebrow">
                Continuous monitoring
              </p>
              <h2>
                {
                  deployment.monitoring
                    .state
                }
              </h2>
            </div>
            <div className="detail-copy">
              <p>
                {
                  deployment.monitoring
                    .summary
                }
              </p>
            </div>
          </article>
        </section>

        <section className="two-column">
          <article className="panel">
            <div className="panel-heading">
              <p className="eyebrow">
                Findings / corrective action
              </p>
              <h2>
                Accountability state
              </h2>
            </div>
            <div className="detail-copy">
              {deployment.findings
                .length === 0 ? (
                <p>
                  No open findings.
                </p>
              ) : (
                <ul className="finding-list">
                  {deployment.findings.map(
                    (
                      finding,
                      index,
                    ) => (
                      <li
                        key={
                          finding.title +
                          index
                        }
                      >
                        <strong>
                          {
                            finding.severity
                          }{" "}
                          ·{" "}
                          {
                            finding.status
                          }
                        </strong>
                        <span>
                          {
                            finding.title
                          }
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}
              {deployment.remediation && (
                <div className="remediation-note">
                  <strong>
                    Remediation ·{" "}
                    {
                      deployment.remediation
                        .state
                    }
                  </strong>
                  <p>
                    {
                      deployment.remediation
                        .summary
                    }
                  </p>
                </div>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <p className="eyebrow">
                Deadlines
              </p>
              <h2>
                Review calendar
              </h2>
            </div>
            <div className="deadline-stack">
              {deployment.deadlines.map(
                (deadline) => (
                  <div
                    key={
                      deadline.type +
                      deadline.dueAt
                    }
                  >
                    <strong>
                      {
                        deadline.type
                      }
                    </strong>
                    <span>
                      {
                        deadline.status
                      }{" "}
                      ·{" "}
                      {new Date(
                        deadline.dueAt,
                      ).toLocaleDateString(
                        "en-US",
                        {
                          dateStyle:
                            "medium",
                        },
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">
              Immutable accountability history
            </p>
            <h2>
              What happened, in order
            </h2>
          </div>
          <ol className="timeline">
            {deployment.timeline.map(
              (event, index) => (
                <li
                  key={
                    event.title +
                    index
                  }
                >
                  <time>
                    {new Date(
                      event.at,
                    ).toLocaleDateString(
                      "en-US",
                      {
                        dateStyle:
                          "medium",
                      },
                    )}
                  </time>
                  <div>
                    <span>
                      {event.kind}
                    </span>
                    <strong>
                      {
                        event.title
                      }
                    </strong>
                    <p>
                      {
                        event.detail
                      }
                    </p>
                  </div>
                </li>
              ),
            )}
          </ol>
        </section>
      </main>
    );
  }

  const readiness =
    readOperatorReadiness();

  if (
    !readiness.configured
  ) {
    return (
      <main className="shell">
        <PageHeader />
        <nav className="detail-nav">
          <Link href="/">
            ← Portfolio
          </Link>
        </nav>
        <section className="panel setup-panel">
          <div className="panel-heading">
            <p className="eyebrow">
              Deployment drill-down
            </p>
            <h2>
              Operator context required
            </h2>
          </div>
          <div className="setup-copy">
            <p>
              Configure CAIAE_ORGANIZATION_ID and CAIAE_OPERATOR_TOKEN to load a real deployment report.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const report =
    await loadDeploymentAccountabilityReport(
      createOperatorEngineClient(),
      id,
    );

  return (
    <main className="shell">
      <PageHeader />
      <nav className="detail-nav">
        <Link href="/">
          ← Portfolio
        </Link>
      </nav>
      <section className="detail-hero compact">
        <p className="eyebrow">
          Live CAIAE deployment
        </p>
        <h1>
          {report.deployment.name}
        </h1>
      </section>
      <section className="detail-grid">
        <DetailCard
          label="Open findings"
          value={String(
            report.metrics
              .openFindings,
          )}
        />
        <DetailCard
          label="Blocking findings"
          value={String(
            report.metrics
              .blockingFindings,
          )}
        />
        <DetailCard
          label="Overdue deadlines"
          value={String(
            report.metrics
              .overdueDeadlines,
          )}
        />
        <DetailCard
          label="Monitoring observations"
          value={String(
            report.metrics
              .monitoringObservations,
          )}
        />
      </section>
    </main>
  );
}

function PageHeader() {
  return (
    <header className="masthead">
      <div>
        <span className="mark">
          AA
        </span>
        <div>
          <strong>
            Algorithmic Accountability
          </strong>
          <span>
            Deployment accountability record
          </span>
        </div>
      </div>
    </header>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LabelValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="label-value">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}
