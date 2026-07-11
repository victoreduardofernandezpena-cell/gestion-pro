import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const backupsDir = path.resolve(process.env.BACKUP_DIR || path.resolve(__dirname, "../../backups"));

const backupNamePattern = /^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.(sql|json)$/;
const portableBackupModels = [
  "company",
  "user",
  "userCompany",
  "companySetting",
  "documentSetting",
  "taxSetting",
  "numberingSetting",
  "systemCategory",
  "loyaltySetting",
  "brand",
  "warehouse",
  "cashBox",
  "bankAccount",
  "client",
  "supplier",
  "product",
  "inventoryMovement",
  "invoice",
  "invoiceItem",
  "payment",
  "loyaltyAccount",
  "loyaltyTransaction",
  "purchase",
  "purchaseItem",
  "purchasePayment",
  "bankTransaction",
  "cashTransaction",
  "expense",
  "accountingAccount",
  "accountingEntry",
  "accountingEntryLine",
  "department",
  "position",
  "employee",
  "attendanceRecord",
  "payroll",
  "payrollItem",
  "employeePayment",
  "auditLog"
];

export const ensureBackupsDir = async () => {
  await fs.mkdir(backupsDir, { recursive: true });
};

export const formatBackupFilename = (date = new Date(), extension = "sql") => {
  const stamp = date.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "-");
  return `backup_${stamp}.${extension}`;
};

export const assertValidBackupFilename = (filename) => {
  if (!backupNamePattern.test(filename)) {
    const error = new Error("Nombre de backup invalido");
    error.status = 400;
    throw error;
  }
};

export const getBackupPath = (filename) => {
  assertValidBackupFilename(filename);
  return path.join(backupsDir, filename);
};

export const listBackupFiles = async () => {
  await ensureBackupsDir();
  const files = await fs.readdir(backupsDir);
  const backups = await Promise.all(
    files
      .filter((filename) => backupNamePattern.test(filename))
      .map(async (filename) => {
        const stats = await fs.stat(path.join(backupsDir, filename));
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
  );

  return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getPgDumpCommand = () => process.env.PG_DUMP_PATH || "pg_dump";

export const checkBackupAvailability = async () => {
  const command = getPgDumpCommand();

  if (process.env.DISABLE_BACKUPS === "true") {
    return {
      available: false,
      command,
      mode: "disabled",
      message: "Los backups estan deshabilitados por configuracion del servidor."
    };
  }

  if (process.env.DISABLE_LOCAL_BACKUPS === "true" || (process.env.NODE_ENV === "production" && process.env.ENABLE_LOCAL_BACKUPS !== "true")) {
    return {
      available: true,
      command,
      mode: "portable-json",
      message: "Backups portables JSON activos. Para backup SQL con pg_dump, usa un servidor con pg_dump, almacenamiento persistente y ENABLE_LOCAL_BACKUPS=true."
    };
  }

  if (process.env.PG_DUMP_PATH) {
    try {
      await fs.access(command);
    } catch {
      return {
        available: true,
        command,
        mode: "portable-json",
        message: `No se encontro pg_dump en la ruta configurada: ${command}. Se usara backup portable JSON.`
      };
    }
  }

  return new Promise((resolve) => {
    execFile(command, ["--version"], (error, stdout) => {
      if (error) {
        resolve({
          available: true,
          command,
          mode: "portable-json",
          message: "No se encontro pg_dump en el servidor. Se usara backup portable JSON."
        });
        return;
      }

      resolve({
        available: true,
        command,
        mode: "pg-dump",
        version: stdout?.trim() || "pg_dump disponible",
        message: "Backups SQL locales disponibles."
      });
    });
  });
};

const createPortableJsonBackup = async () => {
  await ensureBackupsDir();
  const filename = formatBackupFilename(new Date(), "json");
  const filePath = path.join(backupsDir, filename);
  const data = {};

  for (const model of portableBackupModels) {
    if (prisma[model]?.findMany) {
      data[model] = await prisma[model].findMany();
    }
  }

  const payload = {
    format: "gestion-pro-portable-json",
    version: 1,
    createdAt: new Date().toISOString(),
    source: "Gestion Pro",
    note: "Backup portable generado desde Prisma. Para restauracion, importar en una base compatible respetando dependencias.",
    data
  };

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  const stats = await fs.stat(filePath);
  await cleanupOldBackups();
  return { filename, size: stats.size, createdAt: stats.birthtime, format: "json" };
};

export const createDatabaseBackup = async () => {
  if (!process.env.DATABASE_URL) {
    const error = new Error("DATABASE_URL no esta configurada");
    error.status = 500;
    error.expose = true;
    throw error;
  }

  const availability = await checkBackupAvailability();
  if (!availability.available) {
    const error = new Error(availability.message);
    error.status = 503;
    error.expose = true;
    throw error;
  }
  if (availability.mode === "portable-json") {
    return createPortableJsonBackup();
  }

  await ensureBackupsDir();
  const filename = formatBackupFilename();
  const filePath = path.join(backupsDir, filename);
  const databaseUrl = new URL(process.env.DATABASE_URL);
  const schema = databaseUrl.searchParams.get("schema");
  databaseUrl.searchParams.delete("schema");
  const args = [
    databaseUrl.toString(),
    "--file",
    filePath,
    "--no-owner",
    "--no-privileges",
    ...(schema ? [`--schema=${schema}`] : [])
  ];

  await new Promise((resolve, reject) => {
    const pgDumpCommand = getPgDumpCommand();

    execFile(pgDumpCommand, args, (error) => {
      if (error) {
        const backupError = new Error("No se pudo crear el backup. Verifica que pg_dump este instalado y que el backend tenga permisos para escribir backups.");
        backupError.status = 503;
        backupError.expose = true;
        backupError.cause = error;
        reject(backupError);
        return;
      }
      resolve();
    });
  });

  const stats = await fs.stat(filePath);
  await cleanupOldBackups();
  return { filename, size: stats.size, createdAt: stats.birthtime };
};

export const deleteBackupFile = async (filename) => {
  const filePath = getBackupPath(filename);
  await fs.unlink(filePath);
};

export const cleanupOldBackups = async () => {
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 0);
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return;

  const backups = await listBackupFiles();
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  await Promise.all(
    backups
      .filter((backup) => new Date(backup.createdAt).getTime() < cutoff)
      .map((backup) => fs.unlink(path.join(backupsDir, backup.filename)).catch(() => null))
  );
};
