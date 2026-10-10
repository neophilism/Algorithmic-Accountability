import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAccess } from "../lib/access";

const production = {
  AA_DEMO_MODE: "false",
  AA_ADMIN_USERNAME: "operator",
  AA_ADMIN_PASSWORD: "a-strong-example-password-not-for-production",
};
const basic = (value: string) => "Basic " + Buffer.from(value, "utf8").toString("base64");

test("fictional demo is public only when explicitly enabled", () => {
  assert.equal(evaluateAccess(null, { AA_DEMO_MODE: "true" }), "demo");
  assert.equal(evaluateAccess(null, {}), "unconfigured");
});

test("real-data mode fails closed for missing or weak access secrets", () => {
  assert.equal(evaluateAccess(null, { AA_ADMIN_USERNAME: "admin", AA_ADMIN_PASSWORD: "short" }), "unconfigured");
  assert.equal(evaluateAccess(null, { AA_ADMIN_USERNAME: "admin" }), "unconfigured");
});

test("real-data mode enforces matching credentials", () => {
  assert.equal(evaluateAccess(null, production), "unauthorized");
  assert.equal(evaluateAccess(basic("operator:wrong-password"), production), "unauthorized");
  assert.equal(evaluateAccess(basic("other:" + production.AA_ADMIN_PASSWORD), production), "unauthorized");
  assert.equal(evaluateAccess(basic("operator:" + production.AA_ADMIN_PASSWORD), production), "authorized");
});

test("malformed and oversized auth headers fail closed", () => {
  assert.equal(evaluateAccess("Bearer token", production), "unauthorized");
  assert.equal(evaluateAccess("Basic !!!!!", production), "unauthorized");
  assert.equal(evaluateAccess("Basic " + "A".repeat(9000), production), "unauthorized");
  assert.equal(evaluateAccess(basic("missing-colon"), production), "unauthorized");
});
