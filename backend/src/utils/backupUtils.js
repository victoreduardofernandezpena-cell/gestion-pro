import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const backupsDir = path.resolve(process.env.BACKUP_DIR || path.resolve(__dirname, "../../backups"));

const backupNamePattern = /^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/;

export const ensureBackupsDir = async () => {
  await fs.mkdir(backupsDir, { recursive: true });
};

export const formatBackupFilename = (date = new Date()) => {
  const stamp = date.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "-");
  return `backup_${stamp}.sql`;
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

  if (process.env.DISABLE_LOCAL_BACKUPS === "true" || (process.env.NODE_ENV === "production" && process.env.ENABLE_LOCAL_BACKUPS !== "true")) {
    return {
      available: false,
      command,
      message: "Los backups locales estan deshabilitados en produccion. Usa los backups del proveedor de base de datos o habilita ENABLE_LOCAL_BACKUPS=true en un servidor con pg_dump y almacenamiento persistente."
    };
  }

  if (process.env.PG_DUMP_PATH) {
    try {
      await fs.access(command);
    } catch {
      return {
        available: false,
        command,
        message: `No se encontro pg_dump en la ruta configurada: ${command}. Ajusta PG_DUMP_PATH en el entorno del backend.`
      };
    }
  }

  return new Promise((resolve) => {
    execFile(command, ["--version"], (error, stdout) => {
      if (error) {
        resolve({
          available: false,
          command,
          message: "No se encontro pg_dump en el servidor. Instala PostgreSQL client o configura PG_DUMP_PATH en el entorno donde corre el backend."
        });
        return;
      }

      resolve({
        available: true,
        command,
        version: stdout?.trim() || "pg_dump disponible",
        message: "Backups locales disponibles."
      });
    });
  });
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
