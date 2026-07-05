export const notFound = (req, res) => {
  res.status(404).json({ message: "Ruta no encontrada. Verifica la direccion o el recurso solicitado." });
};
