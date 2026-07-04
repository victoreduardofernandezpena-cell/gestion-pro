import bcrypt from "bcryptjs";
import prisma from "../prisma.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { validatePasswordPolicy } from "../utils/passwordPolicy.js";

const userSelect = { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true, lastLoginAt: true, createdAt: true, updatedAt: true };
const normalizeEmail = (email) => email?.trim().toLowerCase();

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: userSelect });
    res.json({ ...user, role: req.user.role, company: req.user.company });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = normalizeEmail(req.body.email);
    if (!name) return res.status(400).json({ message: "El nombre es obligatorio" });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Email invalido" });
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { name, email }, select: userSelect });
    await createAuditLog({ action: "PROFILE_UPDATED", module: "PERFIL", entityType: "User", entityId: user.id, description: "Perfil actualizado", req });
    res.json({ ...user, role: req.user.role, company: req.user.company });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe un usuario con ese email" });
    next(error);
  }
};

export const changeProfilePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword) return res.status(400).json({ message: "La contrasena actual es obligatoria" });
    const validation = validatePasswordPolicy(newPassword);
    if (validation) return res.status(400).json({ message: validation });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: "La contrasena actual no es correcta" });
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        mustChangePassword: false,
        passwordChangedAt: new Date()
      }
    });
    await createAuditLog({ action: "PROFILE_PASSWORD_CHANGED", module: "PERFIL", entityType: "User", entityId: req.user.id, description: "Password propio actualizado", req });
    res.json({ message: "Contrasena actualizada" });
  } catch (error) {
    next(error);
  }
};
