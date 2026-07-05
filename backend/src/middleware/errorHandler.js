const isProduction = process.env.NODE_ENV === "production";
const exposeDebugErrors = !isProduction && process.env.DEBUG_ERRORS === "true";

const prismaErrorMessages = {
  P2002: "Ya existe un registro con estos datos unicos.",
  P2003: "No se puede completar la accion porque el registro esta relacionado con otros datos.",
  P2014: "No se puede completar la accion por una relacion de datos invalida.",
  P2025: "Registro no encontrado."
};

export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError" ? 401 : 500);
  const prismaMessage = err.code ? prismaErrorMessages[err.code] : null;
  const fallbackMessages = {
    401: "Sesion invalida o expirada. Inicia sesion nuevamente.",
    403: "No tienes permiso para realizar esta accion.",
    404: "Recurso no encontrado.",
    500: "Error interno del servidor. Intenta nuevamente o contacta al administrador."
  };
  const message = prismaMessage || err.message || fallbackMessages[status] || "Error interno del servidor. Intenta nuevamente o contacta al administrador.";

  if (!isProduction) {
    console.error(err);
  } else if (status >= 500) {
    console.error(message);
  }

  res.status(status).json({
    message: status >= 500 && !prismaMessage && !err.expose ? fallbackMessages[500] : message,
    ...(err.code ? { code: err.code } : {}),
    ...(exposeDebugErrors && err.message ? { error: err.message } : {})
  });
};
