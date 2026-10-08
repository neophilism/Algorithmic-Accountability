import {
  accountabilityDimensions,
  accountabilityLifecycle,
  algorithmicAccountabilityResourceTypes,
  frameworkMetadata,
  reassessmentTriggers,
} from "@algorithmic-accountability/policy";

import {
  EngineStatus,
} from "../components/engine-status";
import {
  AccountabilityDashboard,
} from "../components/accountability-dashboard";
import {
  DemoBanner,
} from "../components/demo-banner";
import {
  buildThinAppConfig,
} from "../lib/config";
import {
  loadAccountabilityDashboard,
} from "../lib/dashboard";
import {
  isAlgorithmicAccountabilityDemoMode,
} from "../lib/demo-mode";

export const dynamic =
  "force-dynamic";

function words(value: string) {
  return value
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

export default async function HomePage() {
  const [config, dashboard] =
    await Promise.all([
      Promise.resolve(buildThinAppConfig()),
      loadAccountabilityDashboard(),
    ]);

  const demoMode =
    isAlgorithmicAccountabilityDemoMode();

  return (
    <main className="shell">
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
              Assessment · Authorization · Continuous Oversight
            </span>
          </div>
        </div>
        <EngineStatus />
      </header>

      {demoMode && <DemoBanner />}

      <section className="hero">
        <p className="eyebrow">
          Second CAIAE thin application
        </p>
        <h1>
          Govern the decision context,
          not just the model.
        </h1>
        <p className="lede">
          A system can be acceptable for
          one purpose and unacceptable for
          another. This application treats
          each deployment context as a
          separately assessable,
          authorizable, monitored, and
          auditable use of an algorithmic
          system.
        </p>
      </section>

      <section className="principle">
        <div>
          <span>Primary control</span>
          <strong>
            Authorization before deployment
          </strong>
        </div>
        <p>
          No statute is assumed by this
          foundation. The current source
          status is{" "}
          <strong>
            {frameworkMetadata.sourceStatus}
          </strong>
          ; later policy bundles can attach
          concrete legal or organizational
          authority without changing the
          engine.
        </p>
      </section>

      <AccountabilityDashboard dashboard={dashboard} />

      <section className="panel">
        <div className="panel-heading">
          <p className="eyebrow">
            Accountability lifecycle
          </p>
          <h2>
            One continuous chain of
            responsibility
          </h2>
        </div>
        <ol className="lifecycle">
          {accountabilityLifecycle.map(
            (stage, index) => (
              <li key={stage}>
                <span>
                  {String(
                    index + 1,
                  ).padStart(
                    2,
                    "0",
                  )}
                </span>
                <strong>
                  {words(stage)}
                </strong>
              </li>
            ),
          )}
        </ol>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">
              Governed resources
            </p>
            <h2>
              Separate identity from use
            </h2>
          </div>
          <div className="stack">
            {Object.entries(
              algorithmicAccountabilityResourceTypes,
            ).map(
              ([
                id,
                definition,
              ]) => (
                <div
                  className="stack-row"
                  key={id}
                >
                  <div>
                    <strong>
                      {
                        definition.label
                      }
                    </strong>
                    <code>
                      {id}
                    </code>
                  </div>
                  <p>
                    {
                      definition.purpose
                    }
                  </p>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">
              Reassessment
            </p>
            <h2>
              Change creates a new review
              obligation
            </h2>
          </div>
          <div className="tag-grid">
            {reassessmentTriggers.map(
              (trigger) => (
                <span key={trigger}>
                  {words(trigger)}
                </span>
              ),
            )}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <p className="eyebrow">
            Review dimensions
          </p>
          <h2>
            Technical performance is only
            one part of accountability
          </h2>
        </div>
        <div className="dimension-grid">
          {accountabilityDimensions.map(
            (dimension) => (
              <div key={dimension}>
                {words(dimension)}
              </div>
            ),
          )}
        </div>
      </section>

      <footer className="footer">
        <div>
          <span>
            Engine boundary
          </span>
          <strong>
            {
              config.engine
                .apiBaseUrl
            }
          </strong>
        </div>
        <div>
          <span>
            Engine pin
          </span>
          <strong>
            813711f
          </strong>
        </div>
        <div>
          <span>
            Legal authority assumed
          </span>
          <strong>No</strong>
        </div>
      </footer>
    </main>
  );
}
