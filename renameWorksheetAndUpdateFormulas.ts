import * as ExcelJS from 'exceljs';

/**
 * Renames a worksheet and updates all formula references across the workbook
 * @param workbook The ExcelJS workbook
 * @param oldSheetName The current name of the worksheet
 * @param newSheetName The new name for the worksheet
 */
async function renameWorksheetAndUpdateFormulas(
  workbook: ExcelJS.Workbook,
  oldSheetName: string,
  newSheetName: string
): Promise<void> {
  // Find the worksheet
  const worksheet = workbook.getWorksheet(oldSheetName);
  if (!worksheet) {
    throw new Error(`Worksheet '${oldSheetName}' not found`);
  }

  // Rename the worksheet
  worksheet.name = newSheetName;

  // Function to update formula references
  const updateFormula = (formula: string): string => {
    // Create a regex to match the old sheet name in formulas
    // Handles cases where sheet name is followed by ! or is quoted
    const sheetNameRegex = new RegExp(`(['"]?)${oldSheetName}\\1!`, 'g');
    return formula.replace(sheetNameRegex, `'${newSheetName}'!`);
  };

  // Iterate through all worksheets
  workbook.eachSheet((ws) => {
    // Iterate through all cells in the worksheet
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.formula) {
          cell.value = {
            formula: updateFormula(cell.formula),
            result: cell.result,
            ...(cell.value as any).ref ? { ref: (cell.value as any).ref } : {},
            ...(cell.value as any).shareType ? { shareType: (cell.value as any).shareType } : {},
          };
        }
        // Check if cell has a shared formula
        if ((cell.value as any)?.sharedFormula) {
          // Preserve the sharedFormula reference and result
          cell.value = {
            sharedFormula: (cell.value as any).sharedFormula,
            result: cell.result,
          };
        }
      });
    });
  });
}

export default renameWorksheetAndUpdateFormulas;



import * as ExcelJS from 'exceljs';
import renameWorksheetAndUpdateFormulas from './updateWorksheetReferences';

describe('renameWorksheetAndUpdateFormulas', () => {
  let workbook: ExcelJS.Workbook;

  beforeEach(() => {
    workbook = new ExcelJS.Workbook();
  });

  test('should throw error if worksheet not found', async () => {
    await expect(
      renameWorksheetAndUpdateFormulas(workbook, 'NonExistent', 'NewName')
    ).rejects.toThrow("Worksheet 'NonExistent' not found");
  });

  test('should rename worksheet and update simple formula references', async () => {
    // Setup workbook with two sheets
    const sheet1 = workbook.addWorksheet('Sheet1');
    const sheet2 = workbook.addWorksheet('Sheet2');
    
    // Add some formulas
    sheet1.getCell('A1').value = { formula: 'Sheet2!B1', result: 42 };
    sheet2.getCell('A1').value = { formula: 'Sheet1!A1+10', result: 52 };

    await renameWorksheetAndUpdateFormulas(workbook, 'Sheet1', 'DataSheet');

    // Verify worksheet renamed
    expect(workbook.getWorksheet('DataSheet')).toBeDefined();
    expect(workbook.getWorksheet('Sheet1')).toBeUndefined();

    // Verify formula updates
    expect(sheet1.getCell('A1').formula).toBe('Sheet2!B1');
    expect(sheet2.getCell('A1').formula).toBe('DataSheet!A1+10');
    expect(sheet2.getCell('A1').result).toBe(52); // Result preserved
  });

  test('should handle quoted sheet names in formulas', async () => {
    const sheet1 = workbook.addWorksheet('Sheet One');
    const sheet2 = workbook.addWorksheet('Sheet2');
    
    sheet2.getCell('A1').value = { formula: "'Sheet One'!A1", result: 100 };

    await renameWorksheetAndUpdateFormulas(workbook, 'Sheet One', 'Data Sheet');

    expect(workbook.getWorksheet('Data Sheet')).toBeDefined();
    expect(sheet2.getCell('A1').formula).toBe("'Data Sheet'!A1");
    expect(sheet2.getCell('A1').result).toBe(100);
  });

  test('should update shared formulas', async () => {
    const sheet1 = workbook.addWorksheet('Sheet1');
    const sheet2 = workbook.addWorksheet('Sheet2');
    
    // Create shared formula
    sheet2.getCell('A1').value = { formula: 'Sheet1!A1*2', result: 20, ref: 'A1:A2', shareType: 'shared' };
    sheet2.getCell('A2').value = { sharedFormula: 'A1', result: 20 };
    
    await renameWorksheetAndUpdateFormulas(workbook, 'Sheet1', 'DataSheet');

    expect(workbook.getWorksheet('DataSheet')).toBeDefined();
    expect(sheet2.getCell('A1').formula).toBe('DataSheet!A1*2');
    expect((sheet2.getCell('A2').value as any).sharedFormula).toBe('A1');
    expect((sheet2.getCell('A2').value as any).result).toBe(20);
  });

  test('should not modify formulas that don’t reference the renamed sheet', async () => {
    const sheet1 = workbook.addWorksheet('Sheet1');
    const sheet2 = workbook.addWorksheet('Sheet2');
    
    const originalFormula = 'B1+C1';
    sheet2.getCell('A1').value = { formula: originalFormula, result: 30 };

    await renameWorksheetAndUpdateFormulas(workbook, 'Sheet1', 'DataSheet');

    expect(sheet2.getCell('A1').formula).toBe(originalFormula);
    expect(sheet2.getCell('A1').result).toBe(30);
  });
});
