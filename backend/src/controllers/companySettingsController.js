import prisma from "../prisma.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const defaults = {
  businessName: "Gestion Pro",
  tradeName: "Mi Empresa",
  currency: "DOP",
  currencySymbol: "RD$",
  defaultTaxRate: 18
};

const getOrCreateCompany = async (companyId) => {
  const existing = await prisma.companySetting.findUnique({ where: { companyId } });
  if (existing) return existing;
  return prisma.companySetting.create({ data: { ...defaults, companyId } });
};

export const getCompanySettings = async (req, res, next) => {
  try {
    res.json(await getOrCreateCompany(requireCompanyId(req)));
  } catch (error) {
    next(error);
  }
};

export const updateCompanySettings = async (req, res, next) => {
  try {
    const current = await getOrCreateCompany(requireCompanyId(req));
    const businessName = req.body.businessName?.trim();
    const defaultTaxRate = Number(req.body.defaultTaxRate ?? 18);
    if (!businessName) return res.status(400).json({ message: "El nombre legal es obligatorio" });
    if (Number.isNaN(defaultTaxRate) || defaultTaxRate < 0) return res.status(400).json({ message: "El impuesto por defecto no puede ser negativo" });
    const setting = await prisma.companySetting.update({
      where: { id: current.id },
      data: {
        businessName,
        tradeName: req.body.tradeName || null,
        rnc: req.body.rnc || null,
        phone: req.body.phone || null,
        email: req.body.email || null,
        address: req.body.address || null,
        city: req.body.city || null,
        country: req.body.country || null,
        website: req.body.website || null,
        logoUrl: req.body.logoUrl || null,
        currency: req.body.currency || "DOP",
        currencySymbol: req.body.currencySymbol || "RD$",
        defaultTaxRate
      }
    });
    await createAuditLog({ action: "COMPANY_SETTINGS_UPDATED", module: "CONFIGURACION", entityType: "CompanySetting", entityId: setting.id, description: "Configuracion de empresa actualizada", req });
    res.json(setting);
  } catch (error) {
    next(error);
  }
};

export const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Debe seleccionar una imagen de logo" });
    }

    const current = await getOrCreateCompany(requireCompanyId(req));
    const logoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const setting = await prisma.companySetting.update({
      where: { id: current.id },
      data: { logoUrl }
    });

    await createAuditLog({
      action: "COMPANY_LOGO_UPDATED",
      module: "CONFIGURACION",
      entityType: "CompanySetting",
      entityId: setting.id,
      description: "Logo empresarial actualizado",
      req
    });

    res.json({
      message: "Logo actualizado correctamente",
      logoUrl
    });
  } catch (error) {
    next(error);
  }
};
