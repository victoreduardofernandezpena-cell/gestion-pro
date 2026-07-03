import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";

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
    const clients = await prisma.client.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { rnc: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } }
            ]
          }
        : undefined,
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

    const client = await prisma.client.findUnique({
      where: { id },
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
      data: { name: name.trim(), rnc, phone, email, address },
      select: clientSelect
    });

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

    const client = await prisma.client.update({
      where: { id },
      data: { name: name.trim(), rnc, phone, email, address },
      select: clientSelect
    });

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

    await prisma.client.delete({ where: { id } });
    sendDeleted(res, "Cliente");
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    next(error);
  }
};
