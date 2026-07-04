import dotenv from "dotenv";
import { createDatabaseBackup } from "../utils/backupUtils.js";

dotenv.config();

try {
  const backup = await createDatabaseBackup();
  console.log(`Backup creado: ${backup.filename} (${backup.size} bytes)`);
} catch (error) {
  console.error(error.message || "No se pudo crear el backup");
  process.exit(1);
}
