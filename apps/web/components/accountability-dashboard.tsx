import Link from "next/link";

import type {
  AccountabilityDashboardState,
} from "../lib/dashboard";

export function AccountabilityDashboard({
  dashboard,
}: {
  dashboard:
    AccountabilityDashboardState;
}) {
  if (
    dashboard.state !==
    "ready"
  ) {
    return (
      <section className="panel setup-panel">
        <div className="panel-heading">
          <p className="eyebrow">
            Operator dashboard
          </p>
          <h2>
            {dashboard.state ===
            "unconfigured"
              ? "Connect an engine organization"
              : "Accountability data unavailable"}
          </h2>
        </div>
        <div className="setup-copy">
          {dashboard.state ===
          "unconfigured" ? (
            <>
              <p>
                The application is running, but the server-side operator context is incomplete.
              </p>
              <ul>
                {dashboard.missing.map(
                  (name) => (
                    <li key={name}>
                      <code>
                        {name}
                      </code>
                    </li>
                  ),
                )}
              </ul>
            </>
          ) : (
            <p>
              {dashboard.message}
            </p>
          )}
        </div>
      </section>
    );
  }

  const {
    metrics,
    deployments,
  } = dashboard.data;

  return (
    <section className="panel">
      <div className="panel-heading dashboard-heading">
        <div>
          <p className="eyebrow">
            Operator dashboard
          </p>
          <h2>
            Deployment accountability portfolio
          </h2>
        </div>
        <span className="portfolio-count">
          {metrics.deployments} deployments
        </span>
      </div>

      <div className="metric-grid">
        <Metric
          label="Blocking deployments"
          value={
            metrics.deploymentsWithBlockingFindings
          }
        />
        <Metric
          label="Open findings"
          value={metrics.openFindings}
        />
        <Metric
          label="Overdue deadlines"
          value={metrics.overdueDeadlines}
        />
        <Metric
          label="Active assessments"
          value={metrics.activeAssessments}
        />
        <Metric
          label="Monitoring observations"
          value={metrics.monitoringObservations}
        />
        <Metric
          label="Valid certifications"
          value={metrics.validCertifications}
        />
      </div>

      <div className="deployment-table">
        <div className="deployment-row deployment-header">
          <span>Deployment</span>
          <span>Purpose / domain</span>
          <span>Findings</span>
          <span>Deadlines</span>
          <span>Assessment</span>
          <span>Monitoring</span>
        </div>
        {deployments.map(
          (deployment) => (
            <div
              className="deployment-row"
              key={deployment.id}
            >
              <div>
                <strong>
                  <Link href={"/deployments/" + deployment.id}>
                    {deployment.name}
                  </Link>
                </strong>
                <small>
                  {deployment.status}
                </small>
              </div>
              <div>
                <strong>
                  {deployment.decisionDomain ??
                    "Not specified"}
                </strong>
                <small>
                  {deployment.purpose ??
                    "Purpose not specified"}
                </small>
              </div>
              <span>
                {deployment.openFindings}
                {deployment.blockingFindings >
                0
                  ? " (" +
                    deployment.blockingFindings +
                    " blocking)"
                  : ""}
              </span>
              <span>
                {deployment.overdueDeadlines}
              </span>
              <span>
                {deployment.activeAssessments}
              </span>
              <span>
                {deployment.monitoringObservations}
              </span>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
