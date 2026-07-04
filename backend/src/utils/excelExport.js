const nowStamp = () => new Date().toISOString().slice(0, 10);

const csvValue = (value) => {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const rowToCsv = (row) => row.map(csvValue).join(",");

export const sendExcel = (res, { filename, title, filters = {}, totals = {}, rows = [] }) => {
  const csvRows = [
    [title],
    ["Generado", new Date().toLocaleString("es-DO")],
    [],
    ["Filtros"]
  ];

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") csvRows.push([key, value]);
  }

  csvRows.push([], ["Totales"]);
  for (const [key, value] of Object.entries(totals)) {
    csvRows.push([key, value]);
  }

  csvRows.push([]);
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    csvRows.push(headers);
    for (const row of rows) {
      csvRows.push(headers.map((header) => row[header]));
    }
  } else {
    csvRows.push(["Sin datos"]);
  }

  const safeFilename = (filename || `reporte_${nowStamp()}.xlsx`).replace(/\.xlsx$/i, ".csv");
  const csv = `\uFEFF${csvRows.map(rowToCsv).join("\r\n")}`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
  res.send(csv);
};
