export const normalizeCompanyCode = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const buildBaseCode = (companyName) => {
  const normalized = normalizeCompanyCode(companyName);
  const parts = normalized.split("-").filter(Boolean);
  const base = parts.length > 1 ? parts.slice(0, 2).join("-") : normalized;
  return (base || "NEGOCIO").slice(0, 12).replace(/-$/g, "") || "NEGOCIO";
};

export const generateCompanyCode = async (tx, companyName) => {
  const base = buildBaseCode(companyName);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const code = `${base}-${suffix}`;
    const existing = await tx.company.findUnique({ where: { code } });
    if (!existing) return code;
  }

  throw Object.assign(new Error("No fue posible generar un codigo de compania unico. Intenta nuevamente."), { status: 500 });
};
