import test from "node:test";
import assert from "node:assert/strict";
import { buildDocumentMovement, buildInventoryOriginLabel, parseInventoryDateRange } from "../src/utils/inventoryTraceability.js";

test("buildDocumentMovement creates consistent document fields", () => {
  assert.deepEqual(buildDocumentMovement({ documentNumber: "FAC-000001", reason: "Factura #FAC-000001" }), {
    document: "FAC-000001",
    reference: "FAC-000001",
    reason: "Factura #FAC-000001",
    note: null
  });
});

test("buildInventoryOriginLabel prefers document over reference and reason", () => {
  assert.equal(buildInventoryOriginLabel({ type: "SALIDA", document: "FAC-000001", reference: "REF-1", reason: "Venta" }), "Salida - FAC-000001");
  assert.equal(buildInventoryOriginLabel({ type: "ENTRADA", reference: "COM-000001" }), "Entrada - Ref. COM-000001");
  assert.equal(buildInventoryOriginLabel({ type: "AJUSTE", reason: "Conteo fisico" }), "Ajuste - Conteo fisico");
});

test("parseInventoryDateRange validates date filters", () => {
  const range = parseInventoryDateRange({ startDate: "2026-07-01", endDate: "2026-07-31" });
  assert.equal(range.startDate.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(range.endDate.toISOString(), "2026-07-31T23:59:59.999Z");
  assert.throws(() => parseInventoryDateRange({ startDate: "2026/07/01" }), /YYYY-MM-DD/);
  assert.throws(() => parseInventoryDateRange({ startDate: "2026-08-01", endDate: "2026-07-01" }), /fecha inicio/);
});
