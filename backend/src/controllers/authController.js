import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { generateCompanyCode, normalizeCompanyCode } from "../utils/companyCode.js";
import { validatePasswordPolicy } from "../utils/passwordPolicy.js";

const serializeCompany = (company) => ({
  id: company.id,
  name: company.name,
  tradeName: company.tradeName,
  code: company.code
});

export { normalizeCompanyCode };

const ensureCompanyDefaults = async (tx, company, payload = {}) => {
  await tx.companySetting.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      businessName: company.name,
      tradeName: company.tradeName || company.name,
      rnc: company.rnc,
      phone: company.phone,
      email: company.email,
      address: company.address,
      city: payload.city || "Santo Domingo",
      country: payload.country || "Republica Dominicana",
      currency: "DOP",
      currencySymbol: "RD$",
      defaultTaxRate: 18
    }
  });

  await tx.documentSetting.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      invoiceTerms: "Pago segun condiciones acordadas.",
      invoiceNotes: "Gracias por su compra.",
      purchaseTerms: "Compra registrada en el sistema.",
      purchaseNotes: "Documento interno de compra.",
      footerText: "Documento generado desde Gestion Pro.",
      showLogo: true,
      showRnc: true,
      showAddress: true
    }
  });

  await tx.taxSetting.create({
    data: {
      companyId: company.id,
      name: "ITBIS 18%",
      rate: 18,
      description: "Impuesto por defecto",
      isDefault: true,
      isActive: true
    }
  });

  for (const numbering of [
    { documentType: "INVOICE", prefix: "FAC", nextNumber: 1 },
    { documentType: "PURCHASE", prefix: "COM", nextNumber: 1 },
    { documentType: "ACCOUNTING_ENTRY", prefix: "AST", nextNumber: 1 }
  ]) {
    await tx.numberingSetting.create({
      data: { ...numbering, companyId: company.id, padding: 6, isActive: true }
    });
  }

  await tx.loyaltySetting.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      amountPerPoint: 100,
      rewardValue: 1,
      minimumPurchaseAmount: 100,
      allowRedeem: true,
      minimumRedeemAmount: 1,
      isActive: true
    }
  });

  await tx.warehouse.create({
    data: {
      companyId: company.id,
      name: "Almacen Principal",
      code: "MAIN",
      isActive: true
    }
  });

  await tx.cashBox.create({
    data: {
      companyId: company.id,
      name: "Caja Principal",
      description: "Caja principal creada automaticamente al registrar el negocio.",
      initialBalance: 0,
      currentBalance: 0,
      isActive: true
    }
  });
};

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

export const register = async (req, res, next) => {
  try {
    if (process.env.DISABLE_PUBLIC_REGISTER === "true") {
      return res.status(403).json({ message: "Registro publico deshabilitado. Solicita acceso al administrador." });
    }

    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const companyName = req.body.companyName?.trim();
    const tradeName = req.body.tradeName?.trim() || companyName;
    const rnc = req.body.rnc?.trim() || null;
    const phone = req.body.phone?.trim() || null;
    const address = req.body.address?.trim() || null;
    const city = req.body.city?.trim() || "Santo Domingo";
    const country = req.body.country?.trim() || "Republica Dominicana";

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ message: "Nombre, email, contrasena y nombre del negocio son requeridos" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email invalido" });
    }
    if (companyName.length < 2) {
      return res.status(400).json({ message: "El nombre del negocio debe tener al menos 2 caracteres" });
    }
    const passwordValidation = validatePasswordPolicy(password);
    if (passwordValidation) return res.status(400).json({ message: passwordValidation });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ message: "Ya existe una cuenta con ese email" });

    const { user, company, userCompany } = await prisma.$transaction(async (tx) => {
      const companyCode = await generateCompanyCode(tx, companyName);
      const company = await tx.company.create({
        data: {
          name: companyName,
          tradeName,
          code: companyCode,
          rnc,
          phone,
          email,
          address,
          isActive: true
        }
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(password, 10),
          role: "admin",
          isActive: true,
          mustChangePassword: false,
          passwordChangedAt: new Date()
        }
      });

      const userCompany = await tx.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "admin",
          isActive: true
        }
      });

      await ensureCompanyDefaults(tx, company, { city, country });
      return { user, company, userCompany };
    });

    await createAuditLog({
      userId: user.id,
      companyId: company.id,
      action: "COMPANY_REGISTERED",
      module: "AUTH",
      entityType: "Company",
      entityId: company.id,
      description: `Negocio registrado: ${company.name} (${company.code})`,
      req
    });

    await createAuditLog({
      userId: user.id,
      companyId: company.id,
      action: "PUBLIC_ACCOUNT_REGISTERED",
      module: "AUTH",
      entityType: "User",
      entityId: user.id,
      description: `Cuenta creada desde registro publico: ${email}`,
      req
    });

    await createAuditLog({
      userId: user.id,
      companyId: company.id,
      action: "USER_COMPANY_ASSIGNED",
      module: "AUTH",
      entityType: "UserCompany",
      entityId: userCompany.id,
      description: `Usuario asignado como admin a ${company.code}`,
      req
    });

    res.status(201).json({
      message: "Negocio creado correctamente",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userCompany.role
      },
      company: serializeCompany(company)
    });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe una cuenta o empresa con esos datos" });
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, companyCode } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedCompanyCode = normalizeCompanyCode(companyCode);

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
