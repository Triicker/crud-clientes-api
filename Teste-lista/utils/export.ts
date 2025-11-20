export const exportToCsv = (filename: string, headers: string[], data: (string | undefined | null)[][]) => {
  if (!data || data.length === 0) {
    return;
  }

  const escapeCsvCell = (cell: string | undefined | null): string => {
    const cellValue = cell === null || cell === undefined ? '' : String(cell);
    // If the cell contains a comma, double quote, or newline, wrap it in double quotes
    // and escape any existing double quotes by doubling them
    if (/[",\n]/.test(cellValue)) {
      return `"${cellValue.replace(/"/g, '""')}"`;
    }
    return cellValue;
  };

  let csvContent = headers.map(escapeCsvCell).join(',') + '\n';
  
  csvContent += data
    .map(row => row.map(escapeCsvCell).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
