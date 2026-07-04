import prisma from "../prisma.js";

export const createAuditLog = async ({
  userId,
  companyId,
  action,
  module,
  entityType,
  entityId,
  description,
  req
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || req?.user?.id || null,
        companyId: companyId || req?.user?.companyId || null,
        action,
        module,
        entityType: entityType || null,
        entityId: entityId !== undefined && entityId !== null ? String(entityId) : null,
        description: description || null,
        ipAddress: req?.ip || null,
        userAgent: req?.headers?.["user-agent"] || null
      }
    });
  } catch (error) {
    console.error("No fue posible registrar auditoria", error);
  }
};
