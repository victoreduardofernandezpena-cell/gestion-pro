import prisma from "../prisma.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

export const getLoyaltySettings = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    let settings = await prisma.loyaltySetting.findUnique({ where: { companyId } });
    if (!settings) {
      settings = await prisma.loyaltySetting.create({ data: { companyId } });
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateLoyaltySettings = async (req, res, next) => {
  try {
    const data = {
      amountPerPoint: Number(req.body.amountPerPoint),
      rewardValue: Number(req.body.rewardValue),
      minimumPurchaseAmount: Number(req.body.minimumPurchaseAmount),
      allowRedeem: Boolean(req.body.allowRedeem),
      minimumRedeemAmount: Number(req.body.minimumRedeemAmount),
      isActive: Boolean(req.body.isActive)
    };

    if (Object.values(data).some((value) => typeof value === "number" && (Number.isNaN(value) || value < 0))) {
      return res.status(400).json({ message: "Los valores numericos no pueden ser negativos" });
    }
    if (data.amountPerPoint <= 0 || data.rewardValue <= 0) {
      return res.status(400).json({ message: "Monto por punto y valor de recompensa deben ser mayores que cero" });
    }

    const companyId = requireCompanyId(req);
    const existing = await prisma.loyaltySetting.findUnique({ where: { companyId } });
    const settings = existing
      ? await prisma.loyaltySetting.update({ where: { id: existing.id }, data })
      : await prisma.loyaltySetting.create({ data: { ...data, companyId } });

    await createAuditLog({
      action: "LOYALTY_SETTINGS_UPDATED",
      module: "FIDELIZACION",
      entityType: "LoyaltySetting",
      entityId: settings.id,
      description: "Configuracion de fidelizacion actualizada",
      req
    });

    res.json(settings);
  } catch (error) {
    next(error);
  }
};
