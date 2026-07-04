import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const money = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });
const date = new Intl.DateTimeFormat("es-DO", { year: "numeric", month: "short", day: "2-digit" });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");

const formatValue = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return date.format(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value);
};

const writeKeyValues = (doc, data = {}) => {
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== "") {
      doc.font("Helvetica-Bold").text(`${key}: `, { continued: true });
      doc.font("Helvetica").text(formatValue(value));
    }
  }
};

const drawTable = (doc, columns, rows) => {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const width = usableWidth / columns.length;
  let y = doc.y + 8;

  doc.fontSize(8).font("Helvetica-Bold");
  columns.forEach((column, index) => {
    doc.text(column.header, startX + index * width, y, { width: width - 4 });
  });
  y += 18;
  doc.moveTo(startX, y - 4).lineTo(startX + usableWidth, y - 4).strokeColor("#CBD5E1").stroke();

  doc.font("Helvetica").strokeColor("#CBD5E1");
  rows.forEach((row) => {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    columns.forEach((column, index) => {
      const value = column.value ? column.value(row) : row[column.key];
      doc.text(formatValue(value), startX + index * width, y, { width: width - 4 });
    });
    y += 18;
  });
  doc.y = y + 8;
};

const writeCompanyHeader = (doc, company, documentSettings) => {
  if (!company) return;
  const headerStartY = doc.y;
  if (documentSettings?.showLogo && company.logoUrl) {
    try {
      let logoSource = null;
      if (company.logoUrl.startsWith("data:image/")) {
        logoSource = Buffer.from(company.logoUrl.split(",")[1] || "", "base64");
      } else if (company.logoUrl.startsWith("/uploads/")) {
        const logoPath = path.join(backendRoot, company.logoUrl.replace(/^\/+/, ""));
        logoSource = fs.existsSync(logoPath) ? logoPath : null;
      }
      if (logoSource) {
        const logoHeight = 65;
        doc.image(logoSource, doc.page.margins.left, headerStartY, { fit: [90, logoHeight] });
        doc.y = headerStartY + logoHeight + 10;
      }
    } catch (error) {
      // El PDF debe generarse aunque el logo no pueda cargarse.
    }
  }
  doc.fontSize(16).font("Helvetica-Bold").text(company.tradeName || company.businessName);
  doc.fontSize(9).font("Helvetica");
  if (documentSettings?.showRnc && company.rnc) doc.text(`RNC: ${company.rnc}`);
  if (documentSettings?.showAddress && company.address) doc.text(company.address);
  if (company.phone || company.email) doc.text([company.phone, company.email].filter(Boolean).join(" | "));
  doc.moveDown();
};

export const sendReportPdf = (res, { filename, title, filters = {}, totals = {}, columns = [], rows = [], company, documentSettings }) => {
  const doc = new PDFDocument({ margin: 40, size: "A4", layout: columns.length > 5 ? "landscape" : "portrait" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename || "reporte.pdf"}"`);
  doc.pipe(res);

  writeCompanyHeader(doc, company, documentSettings);
  doc.fontSize(18).font("Helvetica-Bold").text(title);
  doc.moveDown(0.3).fontSize(9).font("Helvetica").text(`Generado: ${new Date().toLocaleString("es-DO")}`);

  doc.moveDown();
  doc.fontSize(10).font("Helvetica-Bold").text("Filtros");
  doc.fontSize(9).font("Helvetica");
  writeKeyValues(doc, filters);

  doc.moveDown();
  doc.fontSize(10).font("Helvetica-Bold").text("Totales");
  doc.fontSize(9).font("Helvetica");
  writeKeyValues(doc, totals);

  doc.moveDown();
  drawTable(doc, columns, rows);
  if (documentSettings?.footerText) {
    doc.moveDown();
    doc.fontSize(8).font("Helvetica").text(documentSettings.footerText, { align: "center" });
  }
  doc.end();
};

export const sendDocumentPdf = (res, { filename, title, subtitle, details = {}, columns = [], rows = [], totals = {}, notes, terms, company, documentSettings }) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  writeCompanyHeader(doc, company, documentSettings);
  doc.fontSize(20).font("Helvetica-Bold").text(title);
  if (subtitle) doc.fontSize(10).font("Helvetica").text(subtitle);
  doc.moveDown();

  doc.fontSize(10);
  writeKeyValues(doc, details);
  doc.moveDown();
  drawTable(doc, columns, rows);

  doc.moveDown();
  doc.fontSize(10).font("Helvetica-Bold").text("Totales");
  doc.fontSize(9).font("Helvetica");
  const formattedTotals = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, typeof value === "number" ? money.format(value) : value]));
  writeKeyValues(doc, formattedTotals);

  if (notes) {
    doc.moveDown();
    doc.fontSize(10).font("Helvetica-Bold").text("Notas");
    doc.fontSize(9).font("Helvetica").text(notes);
  }
  if (terms) {
    doc.moveDown();
    doc.fontSize(10).font("Helvetica-Bold").text("Terminos");
    doc.fontSize(9).font("Helvetica").text(terms);
  }
  if (documentSettings?.footerText) {
    doc.moveDown();
    doc.fontSize(8).font("Helvetica").text(documentSettings.footerText, { align: "center" });
  }

  doc.end();
};
