const isProduction = process.env.NODE_ENV === "production";

const prismaErrorMessages = {
  P2002: "Ya existe un registro con estos datos unicos",
  P2025: "Registro no encontrado"
};

export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError" ? 401 : 500);
  const prismaMessage = err.code ? prismaErrorMessages[err.code] : null;
  const message = prismaMessage || err.message || "Error interno del servidor";

  if (!isProduction) {
    console.error(err);
  } else if (status >= 500) {
    console.error(message);
  }

  res.status(status).json({
    message: status >= 500 && !prismaMessage && !err.expose ? "Error interno del servidor" : message,
    ...(!isProduction && err.message ? { error: err.message } : {})
  });
};
