import prisma from "../prisma.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const defaults = {
  invoiceTerms: "Pago segun condiciones acordadas.",
  invoiceNotes: "Gracias por su compra.",
  purchaseTerms: "Compra registrada en el sistema.",
  purchaseNotes: "Documento interno de compra.",
  footerText: "Documento generado desde Gestion Pro.",
  showLogo: true,
  showRnc: true,
  showAddress: true
};

const getOrCreate = async (companyId) => {
  const existing = await prisma.documentSetting.findUnique({ where: { companyId } });
  if (existing) return existing;
  return prisma.documentSetting.create({ data: { ...defaults, companyId } });
};

export const getDocumentSettings = async (req, res, next) => {
  try { res.json(await getOrCreate(requireCompanyId(req))); } catch (error) { next(error); }
};

export const updateDocumentSettings = async (req, res, next) => {
  try {
    const current = await getOrCreate(requireCompanyId(req));
    const setting = await prisma.documentSetting.update({
      where: { id: current.id },
      data: {
        invoiceTerms: req.body.invoiceTerms || null,
        invoiceNotes: req.body.invoiceNotes || null,
        purchaseTerms: req.body.purchaseTerms || null,
        purchaseNotes: req.body.purchaseNotes || null,
        footerText: req.body.footerText || null,
        showLogo: req.body.showLogo ?? true,
        showRnc: req.body.showRnc ?? true,
        showAddress: req.body.showAddress ?? true
      }
    });
    await createAuditLog({ action: "DOCUMENT_SETTINGS_UPDATED", module: "CONFIGURACION", entityType: "DocumentSetting", entityId: setting.id, description: "Configuracion de documentos actualizada", req });
    res.json(setting);
  } catch (error) { next(error); }
};
