import bcrypt from "bcryptjs";
import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";
import { validatePasswordPolicy } from "../utils/passwordPolicy.js";
import { findManyMaybePaginated, hasPaginationQuery } from "../utils/pagination.js";

const ROLES = ["admin", "ventas", "almacen", "contabilidad"];
const normalizeEmail = (email) => email?.trim().toLowerCase();
const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  passwordChangedAt: true,
  lastPasswordResetAt: true,
  lastLoginAt: true
};

const serializeUserCompany = (item) => ({
  id: item.user.id,
  name: item.user.name,
  email: item.user.email,
  role: item.role,
  isActive: item.isActive && item.user.isActive,
  userIsActive: item.user.isActive,
  mustChangePassword: item.user.mustChangePassword,
  passwordChangedAt: item.user.passwordChangedAt,
  lastPasswordResetAt: item.user.lastPasswordResetAt,
  lastLoginAt: item.user.lastLoginAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
});

const validateUserPayload = (body, { requirePassword = false } = {}) => {
  const name = body.name?.trim();
  const email = normalizeEmail(body.email);
  const role = body.role;
  const password = body.password;
  if (!name) return { message: "El nombre es obligatorio" };
  if (!email) return { message: "El email es obligatorio" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { message: "Email invalido" };
  if (!ROLES.includes(role)) return { message: "Rol invalido" };
  if (requirePassword) {
    const passwordValidation = validatePasswordPolicy(password);
    if (passwordValidation) return { message: passwordValidation };
  }
  return { name, email, role, password };
};

const activeCompanyAdminCount = (companyId) => prisma.userCompany.count({ where: { companyId, role: "admin", isActive: true, user: { isActive: true } } });

export const listUsers = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const search = req.query.search?.trim();
    const role = req.query.role;
    const isActive = req.query.status === "active" ? true : req.query.status === "inactive" ? false : undefined;
    const where = {
      companyId,
      ...(ROLES.includes(role) ? { role } : {}),
      ...(isActive === undefined ? {} : { isActive }),
      ...(search ? { user: { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } } : {})
    };
    const result = await findManyMaybePaginated(prisma.userCompany, {
      where,
      include: { user: { select: userSelect } },
      orderBy: { createdAt: "desc" }
    }, req.query);
    if (hasPaginationQuery(req.query)) {
      return res.json({ data: result.data.map(serializeUserCompany), meta: result.meta });
    }
    res.json(result.map(serializeUserCompany));
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de usuario invalido" });
    const item = await prisma.userCompany.findUnique({
      where: { userId_companyId: { userId: id, companyId: requireCompanyId(req) } },
      include: { user: { select: userSelect } }
    });
    if (!item) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(serializeUserCompany(item));
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const payload = validateUserPayload(req.body, { requirePassword: true });
    if (payload.message) return res.status(400).json({ message: payload.message });

    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email: payload.email } });
      const user = existingUser
        ? await tx.user.update({ where: { id: existingUser.id }, data: { name: payload.name, isActive: true } })
        : await tx.user.create({
            data: { name: payload.name, email: payload.email, password: await bcrypt.hash(payload.password, 10), role: payload.role, isActive: true }
          });

      const userCompany = await tx.userCompany.upsert({
        where: { userId_companyId: { userId: user.id, companyId } },
        update: { role: payload.role, isActive: true },
        create: { userId: user.id, companyId, role: payload.role, isActive: true },
        include: { user: { select: userSelect } }
      });
      return userCompany;
    });

    await createAuditLog({ action: "USER_CREATED", module: "SEGURIDAD", entityType: "User", entityId: result.user.id, description: `Usuario asignado: ${result.user.email}`, req });
    res.status(201).json(serializeUserCompany(result));
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de usuario invalido" });
    const payload = validateUserPayload(req.body);
    if (payload.message) return res.status(400).json({ message: payload.message });
    const companyId = requireCompanyId(req);
    const existing = await prisma.userCompany.findUnique({ where: { userId_companyId: { userId: id, companyId } } });
    if (!existing) return res.status(404).json({ message: "Usuario no encontrado" });

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { name: payload.name, email: payload.email } });
      return tx.userCompany.update({
        where: { userId_companyId: { userId: id, companyId } },
        data: { role: payload.role },
        include: { user: { select: userSelect } }
      });
    });

    await createAuditLog({ action: "USER_UPDATED", module: "SEGURIDAD", entityType: "User", entityId: result.user.id, description: `Usuario actualizado: ${result.user.email}`, req });
    res.json(serializeUserCompany(result));
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe un usuario con ese email" });
    next(error);
  }
};

export const changeUserStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const isActive = Boolean(req.body.isActive);
    if (!id) return res.status(400).json({ message: "ID de usuario invalido" });
    const companyId = requireCompanyId(req);
    const existing = await prisma.userCompany.findUnique({ where: { userId_companyId: { userId: id, companyId } }, include: { user: { select: userSelect } } });
    if (!existing) return res.status(404).json({ message: "Usuario no encontrado" });
    if (id === req.user.id && !isActive) return res.status(400).json({ message: "No puedes desactivarte a ti mismo" });
    if (existing.role === "admin" && existing.isActive && !isActive && (await activeCompanyAdminCount(companyId)) <= 1) {
      return res.status(400).json({ message: "No se puede desactivar el ultimo admin activo de la compania" });
    }
    const item = await prisma.userCompany.update({ where: { userId_companyId: { userId: id, companyId } }, data: { isActive }, include: { user: { select: userSelect } } });
    await createAuditLog({ action: "USER_STATUS_CHANGED", module: "SEGURIDAD", entityType: "User", entityId: item.user.id, description: `Acceso cambiado a ${isActive ? "activo" : "inactivo"}: ${item.user.email}`, req });
    res.json(serializeUserCompany(item));
  } catch (error) {
    next(error);
  }
};

export const changeUserPassword = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const password = req.body.password;
    if (!id) return res.status(400).json({ message: "ID de usuario invalido" });
    const validation = validatePasswordPolicy(password);
    if (validation) return res.status(400).json({ message: validation });
    const item = await prisma.userCompany.findUnique({ where: { userId_companyId: { userId: id, companyId: requireCompanyId(req) } }, include: { user: { select: userSelect } } });
    if (!item) return res.status(404).json({ message: "Usuario no encontrado" });
    const user = await prisma.user.update({
      where: { id },
      data: {
        password: await bcrypt.hash(password, 10),
        mustChangePassword: true,
        lastPasswordResetAt: new Date(),
        passwordChangedAt: null
      },
      select: userSelect
    });
    await createAuditLog({ action: "USER_PASSWORD_RESET", module: "SEGURIDAD", entityType: "User", entityId: user.id, description: `Password reseteado por admin para: ${user.email}`, req });
    res.json({ message: "Contrasena actualizada", user: serializeUserCompany({ ...item, user }) });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de usuario invalido" });
    if (id === req.user.id) return res.status(400).json({ message: "Usa tu perfil para cambiar tu propia contrasena" });

    const validation = validatePasswordPolicy(req.body.newPassword);
    if (validation) return res.status(400).json({ message: validation });

    const companyId = requireCompanyId(req);
    const item = await prisma.userCompany.findUnique({
      where: { userId_companyId: { userId: id, companyId } },
      include: { user: { select: userSelect } }
    });
    if (!item) return res.status(404).json({ message: "Usuario no encontrado" });

    await prisma.user.update({
      where: { id },
      data: {
        password: await bcrypt.hash(req.body.newPassword, 10),
        mustChangePassword: true,
        lastPasswordResetAt: new Date(),
        passwordChangedAt: null
      }
    });

    await createAuditLog({
      action: "USER_PASSWORD_RESET",
      module: "SEGURIDAD",
      entityType: "User",
      entityId: id,
      description: `Password reseteado por admin para: ${item.user.email}`,
      req
    });

    res.json({ message: "Contrasena reseteada correctamente. El usuario debera cambiarla al iniciar sesion." });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  req.body.isActive = false;
  return changeUserStatus(req, res, next);
};
