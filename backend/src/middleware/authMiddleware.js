import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { validateJwtSecret } from "../utils/security.js";

export const forcedPasswordAllowedPaths = ["/api/auth/profile", "/api/auth/change-forced-password"];

export const isForcedPasswordAllowedPath = (path = "") => {
  const normalizedPath = path.split("?")[0].replace(/\/$/, "");
  return forcedPasswordAllowedPaths.includes(normalizedPath);
};

export const shouldBlockForcedPasswordChange = (user, path) => {
  return Boolean(user?.mustChangePassword && !isForcedPasswordAllowedPath(path));
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, validateJwtSecret());
    const userId = payload.userId || payload.id;
    const companyId = payload.companyId;

    if (!userId || !companyId) {
      return res.status(401).json({ message: "Token sin compania activa" });
    }

    const userCompany = await prisma.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true, lastLoginAt: true, createdAt: true } },
        company: { select: { id: true, name: true, tradeName: true, code: true, isActive: true } }
      }
    });

    if (!userCompany?.user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    if (!userCompany.user.isActive) {
      return res.status(403).json({ message: "Usuario inactivo" });
    }
    if (!userCompany.company?.isActive) {
      return res.status(403).json({ message: "La compania esta inactiva" });
    }
    if (!userCompany.isActive) {
      return res.status(403).json({ message: "Acceso inactivo para esta compania" });
    }

    req.user = {
      ...userCompany.user,
      role: userCompany.role,
      mustChangePassword: userCompany.user.mustChangePassword,
      companyId: userCompany.companyId,
      companyCode: userCompany.company.code,
      companyName: userCompany.company.tradeName || userCompany.company.name,
      company: {
        id: userCompany.company.id,
        name: userCompany.company.name,
        tradeName: userCompany.company.tradeName,
        code: userCompany.company.code
      }
    };

    if (shouldBlockForcedPasswordChange(req.user, req.originalUrl || req.path)) {
      return res.status(403).json({ message: "Debes cambiar tu contrasena antes de continuar" });
    }

    next();
  } catch (error) {
    if (error.status >= 500) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
};
