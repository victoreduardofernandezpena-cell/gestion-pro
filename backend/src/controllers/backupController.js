import fs from "fs/promises";
import { createAuditLog } from "../utils/auditLogger.js";
import { checkBackupAvailability, createDatabaseBackup, deleteBackupFile, getBackupPath, listBackupFiles } from "../utils/backupUtils.js";

export const listBackups = async (req, res) => {
  res.json({ backups: await listBackupFiles() });
};

export const getBackupStatus = async (req, res) => {
  res.json({ status: await checkBackupAvailability() });
};

export const createBackup = async (req, res) => {
  const backup = await createDatabaseBackup();
  await createAuditLog({
    action: "BACKUP_CREATED",
    module: "SYSTEM",
    entityType: "Backup",
    entityId: backup.filename,
    description: `Backup creado: ${backup.filename}`,
    req
  });
  res.status(201).json({ backup });
};

export const downloadBackup = async (req, res) => {
  const { filename } = req.params;
  const filePath = getBackupPath(filename);
  await fs.access(filePath);

  await createAuditLog({
    action: "BACKUP_DOWNLOADED",
    module: "SYSTEM",
    entityType: "Backup",
    entityId: filename,
    description: `Backup descargado: ${filename}`,
    req
  });

  res.download(filePath, filename);
};

export const deleteBackup = async (req, res) => {
  const { filename } = req.params;
  await deleteBackupFile(filename);
  await createAuditLog({
    action: "BACKUP_DELETED",
    module: "SYSTEM",
    entityType: "Backup",
    entityId: filename,
    description: `Backup eliminado: ${filename}`,
    req
  });
  res.json({ message: "Backup eliminado correctamente" });
};

export const restoreBackup = async (req, res) => {
  const { filename } = req.params;
  getBackupPath(filename);
  await createAuditLog({
    action: "BACKUP_RESTORE_ATTEMPTED",
    module: "SYSTEM",
    entityType: "Backup",
    entityId: filename,
    description: "Intento de restauracion de backup. Restauracion automatica deshabilitada por seguridad.",
    req
  });

  res.status(409).json({
    message: "Restauracion manual requerida por seguridad."
  });
};
