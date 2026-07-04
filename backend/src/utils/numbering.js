const fallback = {
  INVOICE: "FAC",
  PURCHASE: "COM",
  ACCOUNTING_ENTRY: "AST"
};

export const getNextDocumentNumber = async (tx, documentType, companyId) => {
  const setting = await tx.numberingSetting.findFirst({
    where: { documentType, isActive: true, ...(companyId ? { companyId } : {}) },
    orderBy: { id: "asc" }
  });

  if (!setting) {
    const prefix = fallback[documentType] || documentType;
    return `${prefix}-000001`;
  }

  const documentNumber = `${setting.prefix}-${String(setting.nextNumber).padStart(setting.padding, "0")}`;
  await tx.numberingSetting.update({
    where: { id: setting.id },
    data: { nextNumber: { increment: 1 } }
  });
  return documentNumber;
};
