export const parsePositiveInteger = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

export const shouldDisableLoginRateLimit = (env = process.env) => env.DISABLE_LOGIN_RATE_LIMIT === "true";

export const buildLoginRateLimitConfig = (env = process.env) => ({
  windowMs: parsePositiveInteger(env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  limit: parsePositiveInteger(env.LOGIN_RATE_LIMIT_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de login. Intenta nuevamente mas tarde." }
});

export const validateJwtSecret = (env = process.env) => {
  const secret = env.JWT_SECRET;
  if (!secret) {
    const error = new Error("JWT_SECRET no esta configurado en el servidor");
    error.status = 500;
    throw error;
  }

  if (env.NODE_ENV === "production" && (secret === "CHANGE_THIS_SECRET" || secret.length < 32)) {
    const error = new Error("JWT_SECRET inseguro. Configura un secreto fuerte antes de operar en produccion.");
    error.status = 500;
    throw error;
  }

  return secret;
};
