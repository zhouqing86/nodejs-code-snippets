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


The issue you're encountering is that Apache POI is automatically converting the formula `=INDEX(B$1:B2,MATCH(1,(A$1:A2<=C1)*(B$1:B2<>0),0))` to `=INDEX(B$1:B2,MATCH(1,(@A$1:A2<=C1)*(@B$1:B2<>0),0))`, adding the `@` (implicit intersection operator) to the range references. This change is causing the formula evaluation to fail in Apache POI. Let’s break down why this happens and how to fix it.

### Why Apache POI Adds `@` and Why It Fails
1. **Implicit Intersection Operator (`@`)**:
   - The `@` operator was introduced in Excel’s dynamic array formulas (Excel 365/2021) to explicitly request a single value from a range or array, ensuring compatibility with older array formulas.
   - When Apache POI processes formulas, its formula parser (as of POI 5.2.0 or later) may automatically insert `@` for certain range references in array formulas to mimic Excel’s behavior, especially when it detects that the formula might be evaluated in a context expecting a single value.
   - In your formula, `A$1:A2` and `B$1:B2` are range references that produce arrays. POI’s parser may misinterpret the context and prepend `@` to these ranges, effectively reducing `A$1:A2` to a single value (e.g., the value in the current row) rather than treating it as an array. This breaks the array operation `(A$1:A2<=C1)*(B$1:B2<>0)`, which expects to evaluate the entire range.

2. **Why Evaluation Fails**:
   - The formula `=INDEX(B$1:B2,MATCH(1,(@A$1:A2<=C1)*(@B$1:B2<>0),0))` with `@` operators evaluates `A$1:A2` and `B$1:B2` as single values (e.g., `A2` and `B2` if the formula is in row 2). This results in:
     - `(@A$1:A2<=C1)` → `A2<=C1` → `TRUE` (since `A2` = 2025-08-01 and `C1` = 2025-08-01).
     - `(@B$1:B2<>0)` → `B2<>0` → `FALSE` (since `B2` = 0).
     - `(TRUE)*(FALSE)` → `0`.
     - `MATCH(1, 0, 0)` fails because it’s looking for `1` in a single value `0`, resulting in a `#N/A` error or evaluation failure.
   - Apache POI’s formula evaluator may not handle this modified formula correctly because the `@` operator disrupts the array context that `MATCH` expects, and POI’s support for dynamic array formulas (including `@`) is incomplete or buggy.

3. **Apache POI Limitations**:
   - Apache POI (even in versions like 5.2.0 or later) has limited support for Excel’s dynamic array formulas introduced in Excel 365. The insertion of `@` suggests POI is trying to emulate Excel’s behavior but incorrectly applies it to array operations.
   - The `FormulaEvaluator` in POI may throw a `NotImplementedException` or produce incorrect results when encountering `@` in array formulas, as it struggles with dynamic array semantics or array operations in `MATCH`.

### Workaround Solutions
To resolve this, we need to either prevent POI from inserting `@` operators or use a formula that avoids array operations entirely, ensuring compatibility with POI’s formula evaluator. Here are two solutions:

#### Solution 1: Simplify the Formula to Avoid Array Operations
Instead of relying on array formulas, use a combination of `IF`, `INDEX`, and `MATCH` that POI can evaluate without implicit array handling. A reliable alternative is to iterate over the rows explicitly or use a formula that avoids multi-cell range operations.

**Alternative Formula**:
```
=INDEX(B$1:B2,MAX(IF((A$1:A2<=C1)*(B$1:B2<>0),ROW(A$1:A2)-ROW(A$1)+1)))
```

**Explanation**:
- `(A$1:A2<=C1)*(B$1:B2<>0)`: Produces an array of `1` and `0` (same as before):
  - Row 1: `(2025-07-30<=2025-08-01)*(1.02<>0)` → `1`
  - Row 2: `(2025-08-01<=2025-08-01)*(0<>0)` → `0`
- `IF(...,ROW(A$1:A2)-ROW(A$1)+1)`: Returns the relative row numbers where the condition is `TRUE` (e.g., `[1, FALSE]`).
- `MAX(...)`: Finds the highest row number where the condition is met (e.g., `1`).
- `INDEX(B$1:B2, ...)`: Returns the value from `B$1:B2` at the max row position (e.g., `B1` = `1.02`).

**Why This Works**:
- This formula is an array formula in Excel (requires `Ctrl+Shift+Enter` in older versions), but Apache POI’s `FormulaEvaluator` supports `IF`, `MAX`, `ROW`, and `INDEX` well, even in array contexts.
- It avoids the complex array arithmetic that triggers `@` insertion in POI’s parser.

**Java Code to Test**:
```java
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;

public class FormulaEvaluation {
    public static void main(String[] args) throws Exception {
        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("Sheet1");

        // Set date format
        CellStyle dateStyle = workbook.createCellStyle();
        dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd"));

        // Set data
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

        // Set formula
        Cell formulaCell = row3.createCell(3);
        formulaCell.setCellFormula("INDEX(B$1:B2,MAX(IF((A$1:A2<=C1)*(B$1:B2<>0),ROW(A$1:A2)-ROW(A$1)+1)))");

        // Evaluate
        FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
        evaluator.evaluateAll();

        // Get result
        CellValue cellValue = evaluator.evaluate(formulaCell);
        System.out.println("Formula result: " + cellValue.getNumberValue()); // Should print 1.02

        // Save workbook
        try (FileOutputStream out = new FileOutputStream("formula_output.xlsx")) {
            workbook.write(out);
        }
        workbook.close();
    }
}
```

#### Solution 2: Compute Logic in Java
If the above formula still triggers `@` insertion or fails, you can bypass POI’s formula evaluator entirely by implementing the logic in Java. This is a robust workaround when POI’s formula support is unreliable.

**Java Implementation**:
```java
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;

public class CustomFormulaLogic {
    public static void main(String[] args) throws Exception {
        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("Sheet1");

        // Set date format
        CellStyle dateStyle = workbook.createCellStyle();
        dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd"));

        // Set data
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

        // Compute logic in Java
        Cell resultCell = row3.createCell(3);
        double result = computeLookup(sheet, 0, 1, 2, 2); // Columns A, B, C, row 2
        resultCell.setCellValue(result);

        // Save workbook
        try (FileOutputStream out = new FileOutputStream("custom_output.xlsx")) {
            workbook.write(out);
        }
        workbook.close();
    }

    private static double computeLookup(Sheet sheet, int colA, int colB, int colC, int endRow) {
        Date c1Value = sheet.getRow(endRow).getCell(colC).getDateCellValue();
        double lastValidValue = 0;
        for (int i = 0; i <= endRow; i++) {
            Row row = sheet.getRow(i);
            Date aValue = row.getCell(colA).getDateCellValue();
            double bValue = row.getCell(colB).getNumericCellValue();
            if (aValue.compareTo(c1Value) <= 0 && bValue != 0) {
                lastValidValue = bValue;
            }
        }
        return lastValidValue; // Returns 1.02
    }
}
```

**Explanation**:
- The `computeLookup` method iterates over rows in columns `A` and `B`, checking if `A`’s date is `<= C1` and `B`’s value is non-zero, and keeps the last valid `B` value.
- This avoids any formula evaluation issues in POI and directly computes the result (`1.02`).

### Additional Notes
- **POI Version**: Ensure you’re using Apache POI 5.2.0 or later, as older versions have even less robust formula support. Check for updates beyond 5.2.0, as bug fixes for array formulas or `@` handling may have been added.
- **Debugging `@` Insertion**: If POI continues to insert `@`, you can try setting the formula string explicitly without array operations or use `workbook.setForceFormulaRecalculation(true)` to ensure Excel recalculates the formula correctly when the file is opened, bypassing POI’s evaluator.
- **Excel Validation**: Test the formula `=INDEX(B$1:B2,MAX(IF((A$1:A2<=C1)*(B$1:B2<>0),ROW(A$1:A2)-ROW(A$1)+1)))` in Excel to confirm it returns `1.02`. If it works in Excel but fails in POI, the issue is definitely POI’s handling of array formulas.
- **Logging**: Enable POI logging (`org.apache.poi.ss.formula`) to diagnose evaluation errors or confirm if `@` insertion is the root cause.

### Why Solution 1 Should Work
The `INDEX`/`MAX`/`IF` formula is less likely to trigger `@` insertion because it uses `IF` to explicitly handle the array logic, which POI’s evaluator supports better than direct array arithmetic. If it still fails, Solution 2 (Java logic) is a foolproof fallback.

Try Solution 1 first, as it keeps the logic in the spreadsheet. If it fails or `@` persists, use Solution 2. Let me know if you encounter specific errors or need further tweaks!
