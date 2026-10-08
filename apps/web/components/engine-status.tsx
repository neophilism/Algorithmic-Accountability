"use client";

import {
  useEffect,
  useState,
} from "react";

type Status =
  | { state: "checking" }
  | {
      state: "online";
      release: string | null;
    }
  | {
      state: "offline";
      message: string;
    };

export function EngineStatus() {
  const [status, setStatus] =
    useState<Status>({
      state: "checking",
    });

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const response =
          await fetch(
            "/api/engine-health",
            {
              cache: "no-store",
            },
          );
        const body =
          await response.json();

        if (!active) return;

        if (
          response.ok &&
          body.engine?.status ===
            "ok"
        ) {
          setStatus({
            state: "online",
            release:
              body.engine.release ??
              null,
          });
          return;
        }

        setStatus({
          state: "offline",
          message:
            body.message ??
            "Engine unavailable",
        });
      } catch {
        if (active) {
          setStatus({
            state: "offline",
            message:
              "Engine unavailable",
          });
        }
      }
    }

    void check();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className={
        "engine-status " +
        status.state
      }
      aria-live="polite"
    >
      <span
        className="status-dot"
        aria-hidden="true"
      />
      <span>
        {status.state ===
        "checking"
          ? "Checking CAIAE"
          : status.state ===
              "online"
            ? "CAIAE connected" +
              (status.release
                ? " · " +
                  status.release
                : "")
            : status.message}
      </span>
    </div>
  );
}
