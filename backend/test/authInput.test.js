import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCompanyCode } from "../src/controllers/authController.js";
import { validatePasswordPolicy } from "../src/utils/passwordPolicy.js";

test("normalizeCompanyCode trims, uppercases and removes unsafe characters", () => {
  assert.equal(normalizeCompanyCode(" negocio 01! "), "NEGOCIO01");
  assert.equal(normalizeCompanyCode("gp_demo-1"), "GP_DEMO-1");
});

test("password policy blocks weak beta credentials", () => {
  assert.equal(validatePasswordPolicy("12345678"), "La nueva contrasena debe incluir al menos una letra");
  assert.equal(validatePasswordPolicy("Password1"), "");
  assert.equal(validatePasswordPolicy("admin123"), "La nueva contrasena es demasiado debil");
});
