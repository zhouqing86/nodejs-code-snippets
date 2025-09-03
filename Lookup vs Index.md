The `LOOKUP` function in your Excel formula `=LOOKUP(2, 1/((A$1:A2<=C1)*(B$1:B2<>0)), B$1:B2)` is causing issues with Apache POI because, as of the latest updates, POI’s formula evaluation support for certain complex array formulas, including `LOOKUP` with array operations, is incomplete or may throw a `NotImplementedException`. This is likely due to the formula’s reliance on Excel’s implicit array handling, which POI struggles with for some functions. Let’s break this down and find a replacement formula that Apache POI can evaluate reliably, given your data:

- **A1**: `2025-07-30` (date)
- **A2**: `2025-08-01` (date)
- **B1**: `1.02` (numeric)
- **B2**: `0` (numeric)
- **C1**: `2025-08-01` (date)

### Understanding the Original Formula
The formula `=LOOKUP(2, 1/((A$1:A2<=C1)*(B$1:B2<>0)), B$1:B2)` does the following:
1. **Condition Evaluation**:
   - `A$1:A2<=C1` checks which dates in `A1:A2` are less than or equal to `C1` (2025-08-01). This returns an array of `TRUE`/`FALSE`:
     - `A1` (2025-07-30) <= `C1` (2025-08-01) → `TRUE`
     - `A2` (2025-08-01) <= `C1` (2025-08-01) → `TRUE`
   - `B$1:B2<>0` checks which values in `B1:B2` are not zero:
     - `B1` (1.02) ≠ 0 → `TRUE`
     - `B2` (0) ≠ 0 → `FALSE`
   - `(A$1:A2<=C1)*(B$1:B2<>0)` multiplies these boolean arrays (Excel treats `TRUE` as 1, `FALSE` as 0):
     - Row 1: `TRUE * TRUE` = `1`
     - Row 2: `TRUE * FALSE` = `0`
2. **Array Inversion**:
   - `1/((A$1:A2<=C1)*(B$1:B2<>0))` computes the reciprocal:
     - Row 1: `1/1` = `1`
     - Row 2: `1/0` = `#DIV/0!` (Excel handles this by ignoring errors in `LOOKUP`)
3. **LOOKUP Operation**:
   - `LOOKUP(2, ...)` searches for `2` in the resulting array `[1, #DIV/0!]`. Since `2` is not found, it takes the last non-error value from `B$1:B2` where the condition array is non-zero, which is `B1` = `1.02`.

The formula effectively returns the last value in `B$1:B2` where the corresponding `A$1:A2` date is less than or equal to `C1` and the `B$1:B2` value is non-zero. For your data, this is `1.02` (from `B1`).

### Why Apache POI Fails
Apache POI (as of version 5.2.0 and later, based on available information) supports 202 built-in Excel functions but has incomplete support for array formulas and certain functions like `LOOKUP` when used with complex array operations. The formula’s use of array arithmetic (`*`) and error handling (`#DIV/0!`) in `LOOKUP` likely triggers a `NotImplementedException` or incorrect evaluation because POI doesn’t fully handle Excel’s implicit array processing or error suppression in `LOOKUP`.[](https://poi.apache.org/components/spreadsheet/eval-devguide.html)[](https://medium.com/%40pjfanning/excel-formula-evaluation-in-apache-poi-92d9c81891ea)

### Replacement Formula
To work around this, we need a formula that achieves the same result but uses functions that Apache POI supports reliably, such as `INDEX`, `MATCH`, `IF`, or `SUMPRODUCT`, which are better implemented in POI. Here’s a replacement formula that should work:

**Replacement Formula**:
```
=INDEX(B$1:B2, MATCH(1, (A$1:A2<=C1)*(B$1:B2<>0), 0))
```

This is an array formula in Excel, so it needs to be entered with `Ctrl+Shift+Enter` in older Excel versions, but POI can evaluate it correctly if implemented properly. Let’s break it down:
- `(A$1:A2<=C1)*(B$1:B2<>0)`: Same as before, generates an array of `1` and `0`:
  - Row 1: `1` (because `A1<=C1` and `B1<>0`)
  - Row 2: `0` (because `B2=0`)
- `MATCH(1, ..., 0)`: Finds the position of the first `1` in the array (exact match), which is position 1 (corresponding to `B1`).
- `INDEX(B$1:B2, ...)`: Returns the value from `B$1:B2` at the matched position, i.e., `B1` = `1.02`.

### Why This Works in Apache POI
- **Supported Functions**: `INDEX` and `MATCH` are among the 202 functions supported by Apache POI as of version 5.2.0, and they handle array operations better than `LOOKUP` in POI’s implementation.[](https://poi.apache.org/components/spreadsheet/eval-devguide.html)[](https://stackoverflow.com/questions/70855089/how-many-functions-are-supported-by-apache-poi-and-where-these-missing-function)
- **Simpler Array Handling**: The formula avoids the reciprocal operation (`1/`) that generates `#DIV/0!` errors, which POI may not handle gracefully.
- **Explicit Logic**: `INDEX` and `MATCH` explicitly define the lookup process, making it easier for POI’s `FormulaEvaluator` to process.

### Java Code to Implement and Evaluate
Here’s how you can implement and evaluate this formula using Apache POI:

```java
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;

public class FormulaEvaluation {
    public static void main(String[] args) throws Exception {
        // Create workbook and sheet
        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("Sheet1");

        // Set date format for cells
        CellStyle dateStyle = workbook.createCellStyle();
        dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd"));

        // Set up data
        Row row1 = sheet.createRow(0);
        Cell a1 = row1.createCell(0);
        a1.setCellValue(new SimpleDateFormat("yyyy-MM-dd").parse("2025-07-30"));
        a1.setCellStyle(dateStyle);
        Cell b1 = row1.createCell(1);
        b1.setCellValue(1.02);

        Row row2 = sheet.createRow(1);
        Cell a2 = row2.createCell(0);
        a2.setCellValue(new SimpleDateFormat("yyyy-MM-dd").parse("2025-08-01"));
        a2.setCellStyle(dateStyle);
        Cell b2 = row2.createCell(1);
        b2.setCellValue(0);

        Row row3 = sheet.createRow(2);
        Cell c1 = row3.createCell(2);
        c1.setCellValue(new SimpleDateFormat("yyyy-MM-dd").parse("2025-08-01"));
        c1.setCellStyle(dateStyle);

        // Set the formula in D3 (or any cell)
        Cell formulaCell = row3.createCell(3);
        formulaCell.setCellFormula("INDEX(B$1:B2,MATCH(1,(A$1:A2<=C1)*(B$1:B2<>0),0))");

        // Evaluate the formula
        FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
        evaluator.evaluateAll();

        // Get the evaluated result
        CellValue cellValue = evaluator.evaluate(formulaCell);
        System.out.println("Formula result: " + cellValue.getNumberValue()); // Should print 1.02

        // Save the workbook
        try (FileOutputStream out = new FileOutputStream("formula_output.xlsx")) {
            workbook.write(out);
        }
        workbook.close();
    }
}
```

### Key Notes
- **Date Handling**: Excel stores dates as numeric serial numbers (days since 1900-01-01). Ensure cells `A1`, `A2`, and `C1` are formatted as dates using `CellStyle` to avoid issues with POI’s date handling.[](https://stackoverflow.com/questions/3148535/how-to-read-excel-cell-having-date-with-apache-poi)[](https://poi.apache.org/apidocs/3.17/org/apache/poi/ss/usermodel/DateUtil.html)
- **FormulaEvaluator**: The `evaluateAll()` method updates the cached results for all formulas in the workbook, ensuring the result is computed correctly.[](https://poi.apache.org/components/spreadsheet/eval.html)
- **POI Version**: Use Apache POI 5.2.0 or later for better formula support. If you encounter a `NotImplementedException`, it may indicate that your POI version lacks full support for array formulas, and you may need to simplify further or implement a custom function.[](https://poi.apache.org/components/spreadsheet/eval-devguide.html)
- **Alternative Approach**: If `INDEX`/`MATCH` still fails, you could use `SUMPRODUCT` as another alternative, e.g., `=SUMPRODUCT((A$1:A2<=C1)*(B$1:B2<>0)*B$1:B2)`. However, this assumes a single matching value, as `SUMPRODUCT` sums the results, which may not fit all use cases. Test this carefully, as `SUMPRODUCT` is supported but can be tricky with arrays in POI.

### If the Replacement Fails
If the `INDEX`/`MATCH` formula still causes issues in Apache POI, you can:
1. **Implement a Custom Function**: Create a Java implementation of the `LOOKUP` logic and register it with POI’s `WorkbookEvaluator` at runtime. This involves writing a `Function` implementation to mimic the `LOOKUP` behavior.[](https://poi.apache.org/components/spreadsheet/eval-devguide.html)[](https://poi.apache.org/components/spreadsheet/user-defined-functions.html)
   ```java
   import org.apache.poi.ss.formula.functions.*;
   import org.apache.poi.ss.formula.eval.*;

   public class CustomLookup implements Function {
       @Override
       public ValueEval evaluate(ValueEval[] args, int srcRowIndex, int srcColumnIndex) {
           // Implement LOOKUP logic here
           // Parse args for lookup_value, lookup_vector, result_vector
           // Handle array operations and return the result
           return new NumberEval(1.02); // Example return
       }
   }
   ```
   Register it with:
   ```java
   WorkbookEvaluator.registerFunction("CUSTOMLOOKUP", new CustomLookup());
   ```
   Then use `CUSTOMLOOKUP` in your formula.
2. **Precompute in Java**: If the formula is too complex, compute the logic in Java by iterating over the cells in `A$1:A2` and `B$1:B2`, applying the conditions, and setting the result directly in the cell.

### Testing and Validation
- Test the formula in Excel first to ensure it returns `1.02` as expected.
- Run the Java code with POI 5.2.0 or later to confirm evaluation.
- If errors persist, check the POI logs (enable `POI.FormulaEval` logging) for details on unsupported functions or array handling issues.[](https://poi.apache.org/components/spreadsheet/eval.html)

This `INDEX`/`MATCH` replacement should work reliably in Apache POI for your use case, as it avoids the problematic aspects of `LOOKUP` while achieving the same result. If you need further assistance with implementation or encounter specific errors, let me know![](https://poi.apache.org/components/spreadsheet/eval-devguide.html)[](https://poi.apache.org/components/spreadsheet/eval.html)[](https://medium.com/%40pjfanning/excel-formula-evaluation-in-apache-poi-92d9c81891ea)
