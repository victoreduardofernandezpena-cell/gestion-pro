import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupsDir = path.resolve(__dirname, "../../backups");

export const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const resolveDashboardRange = ({ period = "month", startDate, endDate }) => {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);
  const normalized = ["today", "week", "month", "quarter", "year", "custom"].includes(period) ? period : "month";

  if (normalized === "custom") {
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      const error = new Error("Rango de fechas invalido");
      error.status = 400;
      throw error;
    }
    parsedStart.setHours(0, 0, 0, 0);
    parsedEnd.setHours(23, 59, 59, 999);
    return { period: "custom", start: parsedStart, end: parsedEnd };
  }

  if (normalized === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (normalized === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
  } else if (normalized === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (normalized === "quarter") {
    start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else if (normalized === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  }
  end.setHours(23, 59, 59, 999);
  return { period: normalized, start, end };
};

export const monthKey = (date) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
};

export const getLastBackupInfo = async () => {
  try {
    await fs.mkdir(backupsDir, { recursive: true });
    const files = await fs.readdir(backupsDir);
    const backups = await Promise.all(
      files
        .filter((filename) => /^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/.test(filename))
        .map(async (filename) => {
          const stats = await fs.stat(path.join(backupsDir, filename));
          return { filename, createdAt: stats.birthtime, size: stats.size };
        })
    );
    return backups.sort((a, b) => b.createdAt - a.createdAt)[0] || null;
  } catch (error) {
    return null;
  }
};

export const sumBy = (rows, picker) => rows.reduce((sum, row) => sum + Number(picker(row) || 0), 0);
