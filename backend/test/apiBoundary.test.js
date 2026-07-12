import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

const withServer = async (callback) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
};

test("protected API routes return 401 without token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/clients`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.message, "Token requerido");
  });
});

test("login validates required credentials before database lookup", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "", password: "", companyCode: "" })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "Email, contrasena y codigo de compania son requeridos");
  });
});

test("public register can be disabled for controlled beta", async () => {
  const previousValue = process.env.DISABLE_PUBLIC_REGISTER;
  process.env.DISABLE_PUBLIC_REGISTER = "true";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const body = await response.json();

      assert.equal(response.status, 403);
      assert.equal(body.message, "Registro publico deshabilitado. Solicita acceso al administrador.");
    });
  } finally {
    if (previousValue === undefined) {
      delete process.env.DISABLE_PUBLIC_REGISTER;
    } else {
      process.env.DISABLE_PUBLIC_REGISTER = previousValue;
    }
  }
});

test("unknown API routes return clear 404", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/no-existe`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.message, "Ruta no encontrada. Verifica la direccion o el recurso solicitado.");
  });
});

test("API responses do not expose Express technology header", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);

    assert.equal(response.status, 200);
    assert.equal(response.headers.has("x-powered-by"), false);
  });
});
