import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const clientSelect = {
  id: true,
  name: true,
  rnc: true,
  phone: true,
  email: true,
  address: true,
  createdAt: true,
  updatedAt: true
};

export const listClients = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const companyId = requireCompanyId(req);
    const clients = await prisma.client.findMany({
      where: {
        companyId,
        ...(search
          ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { rnc: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } }
            ]
          }
          : {})
      },
      select: clientSelect,
      orderBy: { createdAt: "desc" }
    });

    res.json(clients);
  } catch (error) {
    next(error);
  }
};

export const getClient = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cliente invalido" });

    const client = await prisma.client.findFirst({
      where: { id, companyId: requireCompanyId(req) },
      select: clientSelect
    });

    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const { name, rnc, phone, email, address } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }

    const client = await prisma.client.create({
      data: { companyId: requireCompanyId(req), name: name.trim(), rnc, phone, email, address },
      select: clientSelect
    });
    await createAuditLog({ action: "CLIENT_CREATED", module: "CLIENTES", entityType: "Client", entityId: client.id, description: `Cliente creado: ${client.name}`, req });

    res.status(201).json(client);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Ya existe un cliente con ese RNC" });
    }
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cliente invalido" });

    const { name, rnc, phone, email, address } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }

    const existing = await prisma.client.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Cliente no encontrado" });

    const client = await prisma.client.update({
      where: { id },
      data: { name: name.trim(), rnc, phone, email, address },
      select: clientSelect
    });
    await createAuditLog({ action: "CLIENT_UPDATED", module: "CLIENTES", entityType: "Client", entityId: client.id, description: `Cliente actualizado: ${client.name}`, req });

    res.json(client);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Ya existe un cliente con ese RNC" });
    }
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cliente invalido" });

    const existing = await prisma.client.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Cliente no encontrado" });

    await prisma.client.delete({ where: { id } });
    await createAuditLog({ action: "CLIENT_DELETED", module: "CLIENTES", entityType: "Client", entityId: id, description: "Cliente eliminado", req });
    sendDeleted(res, "Cliente");
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    next(error);
  }
};
