const movementLabels = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste"
};

export const buildDocumentMovement = ({ documentNumber, referenceNumber = documentNumber, reason, note = null }) => ({
  document: documentNumber || null,
  reference: referenceNumber || null,
  reason: reason || (documentNumber ? `Documento #${documentNumber}` : null),
  note
});

export const buildInventoryOriginLabel = (movement = {}) => {
  const typeLabel = movementLabels[movement.type] || "Movimiento";
  if (movement.document) return `${typeLabel} - ${movement.document}`;
  if (movement.reference) return `${typeLabel} - Ref. ${movement.reference}`;
  if (movement.reason) return `${typeLabel} - ${movement.reason}`;
  return `${typeLabel} manual`;
};

export const parseInventoryDateRange = (query = {}) => {
  const parseDate = (value, label, endOfDay = false) => {
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      const error = new Error(`${label} debe tener formato YYYY-MM-DD`);
      error.status = 400;
      throw error;
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      const error = new Error(`${label} no es una fecha valida`);
      error.status = 400;
      throw error;
    }
    if (endOfDay) date.setUTCHours(23, 59, 59, 999);
    return date;
  };

  const startDate = parseDate(query.startDate, "La fecha inicio");
  const endDate = parseDate(query.endDate, "La fecha fin", true);
  if (startDate && endDate && startDate > endDate) {
    const error = new Error("La fecha inicio no puede ser mayor que la fecha fin");
    error.status = 400;
    throw error;
  }
  return { startDate, endDate };
};
