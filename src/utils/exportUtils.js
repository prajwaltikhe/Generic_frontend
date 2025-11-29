import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const buildWorksheetFromTable = (columns, rows) => {
  const safeColumns = (columns || []).map((c) => ({ header: c.header || c.key || '', key: c.key }));
  const headers = safeColumns.map((c) => c.header);
  const data = (rows || []).map((row) =>
    safeColumns.map((c) => {
      const cell = c.key in row ? row[c.key] : '';
      if (cell == null) return '';
      if (typeof cell === 'object') return JSON.stringify(cell);
      return String(cell);
    })
  );
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  return worksheet;
};

export const exportToExcel = ({ columns = [], rows = [], fileName = 'report.xlsx' }) => {
  const wb = XLSX.utils.book_new();
  const ws = buildWorksheetFromTable(columns, rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
};

export const exportToPDF = ({ columns = [], rows = [], fileName = 'report.pdf', orientation = 'landscape' }) => {
  const doc = new jsPDF({ orientation });
  const safeColumns = (columns || []).map((c) => ({ header: c.header || c.key || '', dataKey: c.key }));
  const body = (rows || []).map((row) => {
    const obj = {};
    safeColumns.forEach((c) => {
      const cell = c.dataKey in row ? row[c.dataKey] : '';
      obj[c.dataKey] = cell == null ? '' : typeof cell === 'object' ? JSON.stringify(cell) : String(cell);
    });
    return obj;
  });

  autoTable(doc, {
    columns: safeColumns,
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [7, 22, 61] },
    startY: 14,
    margin: { top: 12, right: 10, bottom: 12, left: 10 },
  });

  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};

export const buildExportRows = ({ columns = [], data = [] }) => {
  return (data || []).map((row) =>
    (columns || []).reduce((acc, col) => {
      const key = col.key;
      let value = row[key];
      if (value == null) value = '';
      if (typeof value === 'object') value = JSON.stringify(value);
      acc[key] = value;
      return acc;
    }, {})
  );
};

export default { exportToExcel, exportToPDF, buildExportRows };
