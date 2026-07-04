export const getDefaultTaxRate = async (client, companyId) => {
  const companyWhere = companyId ? { companyId } : {};
  const tax = await client.taxSetting.findFirst({ where: { ...companyWhere, isDefault: true, isActive: true } });
  if (tax) return Number(tax.rate) / 100;
  const company = await client.companySetting.findFirst({ where: companyWhere });
  return Number(company?.defaultTaxRate ?? 18) / 100;
};

export const getDocumentSetting = async (client, companyId) => {
  return client.documentSetting.findFirst({ where: companyId ? { companyId } : undefined });
};

export const getCompanySetting = async (client, companyId) => {
  return client.companySetting.findFirst({ where: companyId ? { companyId } : undefined });
};
