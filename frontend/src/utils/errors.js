export const getErrorMessage = (error, fallback = "Ocurrio un error inesperado") => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.status === 401) return "Tu sesion expiro. Inicia sesion nuevamente.";
  if (error?.response?.status === 403) return "No tienes permiso para realizar esta accion.";
  if (error?.response?.status === 404) return "No se encontro el recurso solicitado.";
  if (error?.response?.status >= 500) return "El servidor no pudo completar la accion. Intenta nuevamente o contacta al administrador.";
  if (error?.message === "Network Error") return "No se pudo conectar con el servidor. Verifica que el backend este corriendo.";
  return fallback;
};
