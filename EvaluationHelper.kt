import com.aspose.cells.Workbook
import com.aspose.cells.CalculationOptions
import com.aspose.cells.CellsException
import org.apache.poi.ss.usermodel.WorkbookFactory
import java.io.File
import java.io.FileOutputStream

/**
 * Uses Aspose.Cells (version above 25.0) to load an Excel file, evaluate all formulas in all worksheets,
 * and save the result to a new file.
 *
 * @param inputFilePath Path to the input Excel file.
 * @param outputFilePath Path to save the output Excel file.
 * @throws Exception If there's an error during loading, calculation, or saving.
 */
fun evaluateFormulasWithAspose(inputFilePath: String, outputFilePath: String) {
    // Load the workbook
    val workbook = Workbook(inputFilePath)
    
    // Create calculation options (default options are usually sufficient)
    val options = CalculationOptions()
    options.ignoreError = true // Optional: Ignore errors during calculation
    
    try {
        // Calculate all formulas in the workbook
        workbook.calculateFormula(options)
    } catch (e: CellsException) {
        System.err.println("Error during formula calculation: ${e.message}")
        throw e
    }
    
    // Save the workbook to the output file
    workbook.save(outputFilePath)
}

/**
 * Uses Apache POI (version above 5.4.0) to load an Excel file, evaluate all formulas in all worksheets,
 * and save the result to a new file.
 *
 * @param inputFilePath Path to the input Excel file (supports .xls and .xlsx).
 * @param outputFilePath Path to save the output Excel file.
 * @throws Exception If there's an error during loading, evaluation, or saving.
 */
fun evaluateFormulasWithPOI(inputFilePath: String, outputFilePath: String) {
    // Load the workbook (automatically detects .xls or .xlsx)
    WorkbookFactory.create(File(inputFilePath)).use { workbook ->
        // Create a formula evaluator for the workbook
        val evaluator = workbook.creationHelper.createFormulaEvaluator()
        
        // Evaluate all formula cells in the workbook
        evaluator.evaluateAll()
        
        // Save the workbook to the output file
        FileOutputStream(outputFilePath).use { out ->
            workbook.write(out)
        }
    }
}
