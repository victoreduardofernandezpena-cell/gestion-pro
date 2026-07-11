import test from "node:test";
import assert from "node:assert/strict";
import { roleHasPermission } from "../src/constants/roles.js";

test("admin can access every permission", () => {
  assert.equal(roleHasPermission("admin", "reports:read"), true);
  assert.equal(roleHasPermission("admin", "users:write"), true);
});

test("ventas has sales and loyalty permissions only", () => {
  assert.equal(roleHasPermission("ventas", "clients:read"), true);
  assert.equal(roleHasPermission("ventas", "invoices:create"), true);
  assert.equal(roleHasPermission("ventas", "bank:write"), false);
});

test("almacen has inventory permissions but not accounting", () => {
  assert.equal(roleHasPermission("almacen", "inventory:write"), true);
  assert.equal(roleHasPermission("almacen", "reports:read"), false);
});

test("contabilidad has finance/report permissions but not loyalty", () => {
  assert.equal(roleHasPermission("contabilidad", "bank:write"), true);
  assert.equal(roleHasPermission("contabilidad", "reports:read"), true);
  assert.equal(roleHasPermission("contabilidad", "loyalty:redeem"), false);
});
