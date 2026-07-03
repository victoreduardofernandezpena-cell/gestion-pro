export const getErrorMessage = (error, fallback = "Ocurrio un error inesperado") => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message === "Network Error") return "No se pudo conectar con el servidor. Verifica que el backend este corriendo.";
  return fallback;
};
