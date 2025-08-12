Here’s a Kotlin utility you can drop in to evaluate formulas with Apache POI 5.4.1. It emphasizes performance, supports multi-threaded evaluation, and lets you limit evaluation to specific sheets when you don’t need to recalc everything.

Code (Kotlin)
- Uses MultithreadedFormulaEvaluator when parallelThreads > 1
- Falls back to single-threaded evaluation
- Lets you clear old cached results if you modified values outside the evaluator
- Optionally evaluate only specific sheets (saves a lot of time on big files)

```kotlin
import org.apache.poi.hssf.usermodel.HSSFWorkbook
import org.apache.poi.ss.usermodel.*
import org.apache.poi.ss.formula.MultithreadedFormulaEvaluator
import org.apache.poi.xssf.usermodel.XSSFWorkbook

object PoiFormulaEval {

    /**
     * Evaluate formulas in the workbook.
     *
     * @param wb Workbook (XSSFWorkbook/HSSFWorkbook)
     * @param parallelThreads number of threads to use; 1 disables parallel evaluation
     * @param onlySheets if provided, only these sheet names are evaluated
     * @param clearCachedResultsFirst clear all cached formula results before evaluation (useful if you changed inputs
     *                                via direct cell.setXxx without notifying the evaluator earlier)
     */
    @JvmStatic
    fun evaluateWorkbookFormulas(
        wb: Workbook,
        parallelThreads: Int = Runtime.getRuntime().availableProcessors().coerceAtLeast(1),
        onlySheets: Collection<String>? = null,
        clearCachedResultsFirst: Boolean = false
    ) {
        if (clearCachedResultsFirst) {
            wb.creationHelper.createFormulaEvaluator().clearAllCachedResultValues()
        }

        if (onlySheets == null) {
            // Evaluate entire workbook
            if (parallelThreads > 1) {
                evaluateAllMultiThreaded(wb, parallelThreads)
            } else {
                evaluateAllSingleThreaded(wb)
            }
        } else {
            // Evaluate only selected sheets
            if (parallelThreads > 1) {
                evaluateSheetsMultiThreaded(wb, parallelThreads, onlySheets)
            } else {
                evaluateSheetsSingleThreaded(wb, onlySheets)
            }
        }
    }

    private fun evaluateAllSingleThreaded(wb: Workbook) {
        when (wb) {
            is XSSFWorkbook -> {
                // Uses POI's optimized path
                org.apache.poi.xssf.usermodel.XSSFFormulaEvaluator.evaluateAllFormulaCells(wb)
            }
            is HSSFWorkbook -> {
                org.apache.poi.hssf.usermodel.HSSFFormulaEvaluator.evaluateAllFormulaCells(wb)
            }
            else -> {
                // Generic fallback (rarely needed)
                val evaluator = wb.creationHelper.createFormulaEvaluator()
                for (i in 0 until wb.numberOfSheets) {
                    val sheet = wb.getSheetAt(i)
                    for (row in sheet) for (cell in row) {
                        if (cell.cellType == CellType.FORMULA) evaluator.evaluateFormulaCell(cell)
                    }
                }
            }
        }
    }

    private fun evaluateSheetsSingleThreaded(wb: Workbook, onlySheets: Collection<String>) {
        val evaluator = wb.creationHelper.createFormulaEvaluator()
        for (name in onlySheets) {
            val sheet = wb.getSheet(name) ?: continue
            for (row in sheet) for (cell in row) {
                if (cell.cellType == CellType.FORMULA) evaluator.evaluateFormulaCell(cell)
            }
        }
    }

    private fun evaluateAllMultiThreaded(wb: Workbook, threads: Int) {
        val mt = MultithreadedFormulaEvaluator(wb, threads)
        mt.evaluateAll()
        // No explicit shutdown required; POI manages the pool internally
    }

    private fun evaluateSheetsMultiThreaded(wb: Workbook, threads: Int, onlySheets: Collection<String>) {
        val mt = MultithreadedFormulaEvaluator(wb, threads)
        for (name in onlySheets) {
            val sheet = wb.getSheet(name) ?: continue
            for (row in sheet) for (cell in row) {
                if (cell.cellType == CellType.FORMULA) mt.evaluateFormulaCell(cell)
            }
        }
    }
}
```

Usage
```kotlin
import org.apache.poi.ss.usermodel.WorkbookFactory
import java.io.FileInputStream
import java.io.FileOutputStream

fun main() {
    FileInputStream("input.xlsx").use { fis ->
        val wb = WorkbookFactory.create(fis)

        // Evaluate all formulas using parallelism
        PoiFormulaEval.evaluateWorkbookFormulas(
            wb = wb,
            parallelThreads = Runtime.getRuntime().availableProcessors(), // e.g., 8
            clearCachedResultsFirst = false
        )

        // Persist updated cached formula values (optional)
        FileOutputStream("output.xlsx").use { fos -> wb.write(fos) }
        wb.close()
    }
}
```

Performance tips (especially for thousands of LOOKUP/VLOOKUP)
- Use parallel evaluation when helpful:
  - MultithreadedFormulaEvaluator speeds up when there are many independent formulas across sheets/cells. If most formulas are chained (heavy dependencies), returns diminish.
- Evaluate only what you need:
  - If only certain sheets are relevant, pass onlySheets to avoid iterating the entire workbook.
- Reuse the evaluator for repeated runs:
  - If you update input cells programmatically and need to re-evaluate repeatedly, reuse a single evaluator and call:
    - evaluator.notifyUpdateCell(cell) after changing inputs
    - evaluator.evaluateFormulaCell(formulaCell) for impacted formulas
  - This preserves caches and avoids full workbook re-evaluation.
- Avoid clearing caches unless necessary:
  - clearCachedResultsFirst = true forces a cold start. Use only when inputs were changed without notifying the evaluator.
- VLOOKUP specifics:
  - Many workbooks use VLOOKUP(..., FALSE) on large ranges (exact match). That’s O(n) per lookup and slow anywhere (Excel or POI).
  - If you control the workbook, consider:
    - Sorting the lookup table and using approximate match (TRUE) where possible.
    - Replacing repeated VLOOKUPs with MATCH+INDEX patterns that can be reused, or with helper columns.
- External links:
  - If your file has external links you don’t want to resolve, single-threaded XSSF/HSSF evaluators support ignoring missing external workbooks. For example:
    - val x = org.apache.poi.xssf.usermodel.XSSFFormulaEvaluator(wb as XSSFWorkbook)
    - x.setIgnoreMissingWorkbooks(true)
  - For multi-threaded evaluation, prefer to ensure external links are resolvable or avoid them; ignoring missing workbooks is less flexible in the multi-thread API.

When to consider even more advanced options
- What-if/parallel scenarios with different inputs:
  - POI provides ForkedEvaluator to evaluate the same workbook concurrently with different input sets without cloning the whole workbook per thread.
- Cross-workbook references:
  - If formulas reference other files, set up evaluators for each and call XSSFFormulaEvaluator.setupEnvironment(...) with the workbook names and evaluators.

This should give you a fast default and room to dial in performance for your heaviest workbooks. If you can share a profile (number of formula cells, VLOOKUP table sizes), I can help tune thread count and strategy further.
