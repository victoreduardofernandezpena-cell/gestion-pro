import test from "node:test";
import assert from "node:assert/strict";
import { requireCompanyId, scopedData, scopedWhere } from "../src/utils/companyScope.js";

test("requireCompanyId reads active company from authenticated request", () => {
  assert.equal(requireCompanyId({ user: { companyId: 7 } }), 7);
});

test("requireCompanyId rejects missing company context", () => {
  assert.throws(() => requireCompanyId({ user: {} }), /Compania requerida/);
});

test("scopedWhere and scopedData force companyId from session", () => {
  const req = { user: { companyId: 12 } };
  assert.deepEqual(scopedWhere(req, { status: "ACTIVE" }), { status: "ACTIVE", companyId: 12 });
  assert.deepEqual(scopedData(req, { name: "Cliente" }), { name: "Cliente", companyId: 12 });
});
