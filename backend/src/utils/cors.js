const normalizeOrigin = (origin = "") => origin.trim().replace(/\/$/, "");

export const buildAllowedOrigins = (env = process.env) => {
  const configuredOrigins = [env.FRONTEND_URL, env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean);

  const developmentOrigins =
    env.NODE_ENV === "production" ? [] : ["http://localhost:5173", "http://127.0.0.1:5173"];

  return [...new Set([...configuredOrigins, ...developmentOrigins])];
};

export const isCorsOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) return true;
  return allowedOrigins.includes(normalizeOrigin(origin));
};
