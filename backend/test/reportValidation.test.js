import test from "node:test";
import assert from "node:assert/strict";
import { MAX_REPORT_RANGE_DAYS, prepareReportQuery } from "../src/controllers/reportController.js";

test("prepareReportQuery accepts valid date ranges", () => {
  const query = prepareReportQuery({ startDate: "2026-01-01", endDate: "2026-01-31" });

  assert.equal(query.__startDate.toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(query.__endDate.toISOString(), "2026-01-31T00:00:00.000Z");
});

test("prepareReportQuery rejects invalid date format", () => {
  assert.throws(() => prepareReportQuery({ startDate: "01/01/2026" }), /YYYY-MM-DD/);
});

test("prepareReportQuery rejects reversed date ranges", () => {
  assert.throws(() => prepareReportQuery({ startDate: "2026-02-01", endDate: "2026-01-01" }), /fecha desde/);
});

test("prepareReportQuery limits large report date ranges", () => {
  assert.throws(() => prepareReportQuery({ startDate: "2025-01-01", endDate: "2026-12-31" }), new RegExp(String(MAX_REPORT_RANGE_DAYS)));
});
