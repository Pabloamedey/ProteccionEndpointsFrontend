import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (data, title, columns) => {
  const doc = new jsPDF();
  doc.text(`Lista de ${title}`, 14, 10);

  const tableRows = data.map(item => columns.map(col => item[col]));

  autoTable(doc, {
    head: [columns],
    body: tableRows,
    startY: 20,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [240, 126, 229] }
  });

  const fecha = new Date().toLocaleDateString();
  doc.setFontSize(10);
  doc.setTextColor(156, 163, 175); 
  doc.text(`Generado el ${fecha}`, 14, doc.internal.pageSize.height - 20);
  doc.text("Hecho por Milena Sivit — 2025", 14, doc.internal.pageSize.height - 14);

  doc.save(`${title}.pdf`);
};
