import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { validatePasswordPolicy } from "../utils/passwordPolicy.js";

const serializeCompany = (company) => ({
  id: company.id,
  name: company.name,
  tradeName: company.tradeName,
  code: company.code
});

const buildToken = ({ user, company, role }) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET no esta configurado en el servidor");
    error.status = 500;
    throw error;
  }

  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      email: user.email,
      companyId: company.id,
      companyCode: company.code,
      companyName: company.tradeName || company.name,
      role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
};

export const login = async (req, res, next) => {
  try {
    const { email, password, companyCode } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedCompanyCode = companyCode?.trim().toUpperCase();

    if (!normalizedEmail || !password || !normalizedCompanyCode) {
      return res.status(400).json({ message: "Email, contrasena y codigo de compania son requeridos" });
    }

    const company = await prisma.company.findUnique({ where: { code: normalizedCompanyCode } });
    if (!company) {
      await createAuditLog({ action: "LOGIN_FAILED", module: "AUTH", entityType: "Company", entityId: normalizedCompanyCode, description: `Codigo de compania invalido: ${normalizedCompanyCode}`, req });
      return res.status(401).json({ message: "Codigo de compania invalido." });
    }
    if (!company.isActive) {
      await createAuditLog({ companyId: company.id, action: "LOGIN_FAILED", module: "AUTH", entityType: "Company", entityId: company.id, description: "Intento de login en compania inactiva", req });
      return res.status(403).json({ message: "La compania esta inactiva." });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      await createAuditLog({ companyId: company.id, action: "LOGIN_FAILED", module: "AUTH", entityType: "User", description: `Intento de login para email no registrado: ${normalizedEmail}`, req });
      return res.status(401).json({ message: "Usuario o contrasena incorrectos" });
    }
    if (!user.isActive) {
      await createAuditLog({ userId: user.id, companyId: company.id, action: "LOGIN_FAILED", module: "AUTH", entityType: "User", entityId: user.id, description: "Intento de login con usuario inactivo", req });
      return res.status(403).json({ message: "Usuario inactivo. Contacta al administrador." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      await createAuditLog({ userId: user.id, companyId: company.id, action: "LOGIN_FAILED", module: "AUTH", entityType: "User", entityId: user.id, description: "Password incorrecto", req });
      return res.status(401).json({ message: "Usuario o contrasena incorrectos" });
    }

    const userCompany = await prisma.userCompany.findUnique({
      where: { userId_companyId: { userId: user.id, companyId: company.id } }
    });
    if (!userCompany || !userCompany.isActive) {
      await createAuditLog({ userId: user.id, companyId: company.id, action: "LOGIN_FAILED", module: "AUTH", entityType: "UserCompany", description: "Usuario sin acceso activo a la compania", req });
      return res.status(403).json({ message: "El usuario no tiene acceso activo a esta compania." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    await createAuditLog({ userId: user.id, companyId: company.id, action: "LOGIN_SUCCESS", module: "AUTH", entityType: "User", entityId: user.id, description: `Login exitoso en ${company.code}`, req });
    const token = buildToken({ user, company, role: userCompany.role });

    res.json({
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: userCompany.role,
        isActive: updatedUser.isActive,
        mustChangePassword: updatedUser.mustChangePassword,
        lastLoginAt: updatedUser.lastLoginAt
      },
      company: serializeCompany(company)
    });
  } catch (error) {
    next(error);
  }
};

export const profile = async (req, res) => {
  res.json({ user: req.user, company: req.user.company });
};

export const changeForcedPassword = async (req, res, next) => {
  try {
    const validation = validatePasswordPolicy(req.body.newPassword);
    if (validation) return res.status(400).json({ message: validation });

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: await bcrypt.hash(req.body.newPassword, 10),
        mustChangePassword: false,
        passwordChangedAt: new Date()
      }
    });

    await createAuditLog({
      action: "USER_FORCED_PASSWORD_CHANGED",
      module: "AUTH",
      entityType: "User",
      entityId: req.user.id,
      description: "Cambio obligatorio de contrasena completado",
      req
    });

    res.json({ message: "Contrasena actualizada correctamente" });
  } catch (error) {
    next(error);
  }
};
