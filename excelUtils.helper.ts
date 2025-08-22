
import ExcelJS from 'exceljs';

interface WorksheetData {
  [key: string]: any[][];
}

function createWorkbookFromObject(dataObject: WorksheetData): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  
  // Iterate through object keys (worksheet names)
  for (const [sheetName, sheetData] of Object.entries(dataObject)) {
    // Create worksheet
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Add data to worksheet from 2D array
    sheetData.forEach(row => {
      worksheet.addRow(row);
    });
    
    // Auto-adjust column widths
    worksheet.columns.forEach(column => {
      let maxLength = 10; // Minimum width
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        maxLength = Math.max(maxLength, columnLength);
      });
      column.width = maxLength < 50 ? maxLength : 50; // Cap max width
    });
  }
  
  return workbook;
}

async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  // Write workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export {
  createWorkbookFromObject,
  workbookToBuffer
};
