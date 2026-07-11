import test from "node:test";
import assert from "node:assert/strict";
import { isForcedPasswordAllowedPath, shouldBlockForcedPasswordChange } from "../src/middleware/authMiddleware.js";
import { canAccessRole } from "../src/middleware/roleMiddleware.js";
import { buildAllowedOrigins, isCorsOriginAllowed } from "../src/utils/cors.js";

test("forced password change blocks normal API paths", () => {
  assert.equal(shouldBlockForcedPasswordChange({ mustChangePassword: true }, "/api/clients"), true);
});

test("forced password change allows profile and password update paths", () => {
  assert.equal(isForcedPasswordAllowedPath("/api/auth/profile"), true);
  assert.equal(isForcedPasswordAllowedPath("/api/auth/change-forced-password"), true);
  assert.equal(shouldBlockForcedPasswordChange({ mustChangePassword: true }, "/api/auth/change-forced-password"), false);
});

test("users without forced password change can continue", () => {
  assert.equal(shouldBlockForcedPasswordChange({ mustChangePassword: false }, "/api/clients"), false);
});

test("role helper allows only configured roles", () => {
  assert.equal(canAccessRole({ role: "admin" }, ["admin"]), true);
  assert.equal(canAccessRole({ role: "ventas" }, ["admin", "contabilidad"]), false);
  assert.equal(canAccessRole(null, ["admin"]), false);
});

test("CORS origins are normalized and production excludes local development origins", () => {
  const allowedOrigins = buildAllowedOrigins({
    NODE_ENV: "production",
    FRONTEND_URL: "https://erp.example.com/",
    FRONTEND_URLS: "https://panel.example.com, https://beta.example.com/"
  });

  assert.deepEqual(allowedOrigins, ["https://erp.example.com", "https://panel.example.com", "https://beta.example.com"]);
  assert.equal(isCorsOriginAllowed("https://erp.example.com/", allowedOrigins), true);
  assert.equal(isCorsOriginAllowed("http://localhost:5173", allowedOrigins), false);
});
