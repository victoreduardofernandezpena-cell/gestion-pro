import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token requerido" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET no esta configurado en el servidor" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
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
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
};
