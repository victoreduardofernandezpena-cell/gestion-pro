import test from "node:test";
import assert from "node:assert/strict";
import { generateCompanyCode, normalizeCompanyCode } from "../src/utils/companyCode.js";
import { validatePasswordPolicy } from "../src/utils/passwordPolicy.js";

test("normalizeCompanyCode trims, uppercases and removes unsafe characters", () => {
  assert.equal(normalizeCompanyCode(" negocio 01! "), "NEGOCIO-01");
  assert.equal(normalizeCompanyCode("Mi Tienda RD"), "MI-TIENDA-RD");
  assert.equal(normalizeCompanyCode("Comercial Peña"), "COMERCIAL-PENA");
});

test("generateCompanyCode creates readable unique company codes", async () => {
  const seen = new Set();
  const tx = {
    company: {
      findUnique: async ({ where }) => seen.has(where.code) ? { id: 1, code: where.code } : null
    }
  };

  const code = await generateCompanyCode(tx, "Mi Tienda RD");
  assert.match(code, /^MI-TIENDA-\d{4}$/);
  seen.add(code);

  const nextCode = await generateCompanyCode(tx, "Mi Tienda RD");
  assert.match(nextCode, /^MI-TIENDA-\d{4}$/);
  assert.notEqual(nextCode, code);
});

test("password policy blocks weak beta credentials", () => {
  assert.equal(validatePasswordPolicy("12345678"), "La nueva contrasena debe incluir al menos una letra");
  assert.equal(validatePasswordPolicy("Password1"), "");
  assert.equal(validatePasswordPolicy("admin123"), "La nueva contrasena es demasiado debil");
});
