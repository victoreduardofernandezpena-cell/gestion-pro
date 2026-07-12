import test from "node:test";
import assert from "node:assert/strict";
import { isForcedPasswordAllowedPath, shouldBlockForcedPasswordChange } from "../src/middleware/authMiddleware.js";
import { canAccessRole } from "../src/middleware/roleMiddleware.js";
import { buildAllowedOrigins, isCorsOriginAllowed } from "../src/utils/cors.js";
import { buildLoginRateLimitConfig, parsePositiveInteger, shouldDisableLoginRateLimit, validateJwtSecret } from "../src/utils/security.js";

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

test("login rate limit config falls back to safe defaults", () => {
  assert.equal(parsePositiveInteger("abc", 10), 10);
  assert.equal(parsePositiveInteger("-5", 10), 10);
  assert.equal(parsePositiveInteger("20", 10), 20);

  const config = buildLoginRateLimitConfig({ LOGIN_RATE_LIMIT_WINDOW_MS: "60000", LOGIN_RATE_LIMIT_MAX: "3" });
  assert.equal(config.windowMs, 60000);
  assert.equal(config.limit, 3);
});

test("login rate limit can be disabled only with explicit true", () => {
  assert.equal(shouldDisableLoginRateLimit({ DISABLE_LOGIN_RATE_LIMIT: "true" }), true);
  assert.equal(shouldDisableLoginRateLimit({ DISABLE_LOGIN_RATE_LIMIT: "false" }), false);
});

test("production JWT secret must be configured and strong", () => {
  assert.throws(() => validateJwtSecret({ NODE_ENV: "production", JWT_SECRET: "CHANGE_THIS_SECRET" }), /JWT_SECRET inseguro/);
  assert.throws(() => validateJwtSecret({ NODE_ENV: "production", JWT_SECRET: "short" }), /JWT_SECRET inseguro/);
  assert.equal(validateJwtSecret({ NODE_ENV: "production", JWT_SECRET: "12345678901234567890123456789012" }), "12345678901234567890123456789012");
});
