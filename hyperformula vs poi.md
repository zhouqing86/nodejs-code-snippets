要评估Node.js下的HyperFormula与Java的Apache POI在公式评估（Formula Evaluation）方面的能力，我们需要从多个维度进行比较，包括性能、功能、易用性、兼容性以及适用场景等。以下是对两者的详细分析：

---

### 1. **概述**
- **HyperFormula**：
  - HyperFormula 是一个用 TypeScript 编写的开源、无头（headless）电子表格计算引擎，专为在浏览器或 Node.js 环境中执行类电子表格计算设计。
  - 它支持约 400 种内置函数，与 Microsoft Excel 和 Google Sheets 的公式语法高度兼容。
  - 适用于需要动态数据分析的场景，如财务工具、仪表盘、在线计算器等。
  - 特点包括高性能解析和评估、支持自定义函数、支持撤销/重做、CRUD 操作、命名表达式等。[](https://npm-compare.com/hyperformula)[](https://www.npmjs.com/package/hyperformula?activeTab=readme)

- **Apache POI**：
  - Apache POI 是一个成熟的 Java 库，主要用于处理 Microsoft Office 文件格式（如 Excel 的 .xls 和 .xlsx）。
  - 其公式评估功能允许解析和计算 Excel 文件中的公式，支持大约 140 种内置函数，并支持用户定义函数（需用 Java 实现并注册）。
  - 主要用于处理现有 Excel 文件或生成新的 Excel 文件，适合需要与 Excel 文件交互的服务器端应用。[](https://poi.apache.org/components/spreadsheet/eval.html)[](https://deepwiki.com/apache/poi/3.1.3-formula-evaluation)

---

### 2. **公式评估能力比较**

#### (1) **函数支持**
- **HyperFormula**：
  - 支持约 **400 种内置函数**，覆盖了 Excel 和 Google Sheets 的大多数常用函数（如数学、统计、逻辑、文本处理等）。
  - 支持自定义函数，开发者可以通过 JavaScript/TypeScript 轻松扩展功能。
  - 提供公式本地化支持（17 种语言），适合多语言应用场景。[](https://npm-compare.com/hyperformula)[](https://github.com/handsontable/hyperformula)
- **Apache POI**：
  - 支持约 **140 种内置函数**，涵盖常见的算术、逻辑和部分统计函数，但相比 HyperFormula，函数覆盖范围较窄。
  - 支持用户定义函数，但需要用 Java 编写并注册到宏启用工作簿中，扩展性稍显复杂。
  - 不支持公式本地化，专注于 Excel 兼容性。[](https://poi.apache.org/components/spreadsheet/eval.html)[](https://deepwiki.com/apache/poi/3.1.3-formula-evaluation)

**结论**：HyperFormula 在函数数量和扩展性上更强大，特别是在需要广泛函数支持或多语言场景时。

#### (2) **性能**
- **HyperFormula**：
  - 设计目标是高性能，优化了公式解析和评估，适合处理大型数据集。
  - 官方文档宣称其解析和评估速度快，适合实时计算场景（如 Web 应用中的动态仪表盘）。
  - 由于是 JavaScript 引擎，运行在 Node.js 或浏览器环境中，内存管理和性能 Intelligent Memory Management (Garbage Collection) 通常能有效回收内存，避免性能瓶颈。
  - 实际性能数据较少公开，但其轻量级设计和无文件 I/O 开销使其在内存受限环境中表现良好。[](https://npm-compare.com/hyperformula)

- **Apache POI**：
  - 性能受限于 Excel 文件的 I/O 操作和复杂公式计算，尤其在处理大量公式（例如 30,000 个公式）时，评估时间可能长达 30 分钟，服务器 CPU 使用率可能达到 100%。
  - 提供缓存机制以提高性能，但仍需手动调用 `clearAllCachedResultValues()` 或 `notifyUpdateCell()` 来确保计算结果正确。
  - 批处理（如 `evaluateAll()`）比逐个单元格评估更快，但对大型工作簿仍可能较慢。[](https://stackoverflow.com/questions/36208881/formula-evaluation-performance-in-apache-poi)[](https://deepwiki.com/apache/poi/3.1.3-formula-evaluation)

**结论**：HyperFormula 在纯公式计算场景中通常比 Apache POI 更快，因为它无需处理文件 I/O，且专为高效计算优化。Apache POI 的性能瓶颈主要来自文件操作和复杂公式评估。

#### (3) **跨工作簿引用**
- **HyperFormula**：
  - 目前不支持跨工作簿的外部引用，公式计算局限于单个实例的数据。
  - 适合独立计算场景，不依赖外部文件。[](https://npm-compare.com/hyperformula)

- **Apache POI**：
  - 支持跨工作簿引用（外部引用），如 `=SUM([Finances.xlsx]Numbers!D10:D25)`。
  - 需要通过 `setupReferencedWorkbooks` 配置外部工作簿的映射，支持复杂场景，但需要额外资源加载外部文件。
  - 若外部工作簿不可用，可通过 `setIgnoreMissingWorkbooks(true)` 使用缓存结果。[](https://poi.apache.org/components/spreadsheet/eval.html)[](https://poi.apache.org/apidocs/dev/org/apache/poi/ss/usermodel/FormulaEvaluator.html)

**结论**：Apache POI 在跨工作簿引用方面更强大，适合需要处理复杂 Excel 文件依赖关系的场景。

#### (4) **易用性**
- **HyperFormula**：
  - API 设计直观，易于在 Node.js 或浏览器中集成，代码简洁（如 PMT 公式示例）。
  - 不依赖 UI，适合嵌入到各种业务逻辑中，学习曲线较平缓。
  - 提供 React、Angular、Vue 等框架的集成支持，适合现代 Web 开发。[](https://www.npmjs.com/package/hyperformula?activeTab=readme)[](https://github.com/handsontable/hyperformula)
- **Apache POI**：
  - API 较为复杂，涉及 Java 的类和方法调用（如 `FormulaEvaluator.evaluate()`、`evaluateInCell()` 等）。
  - 需要处理 Excel 文件的结构（如工作簿、Sheet、Row、Cell），代码量较大。
  - 适合熟悉 Java 和 Excel 文件格式的开发者，但学习曲线较陡。[](https://poi.apache.org/components/spreadsheet/eval.html)[](https://deepwiki.com/apache/poi/3.1.3-formula-evaluation)

**结论**：HyperFormula 的 API 更现代化、更易用，适合快速开发；Apache POI 更适合需要深度 Excel 文件操作的场景。

#### (5) **兼容性与适用场景**
- **HyperFormula**：
  - 与 Excel 和 Google Sheets 的公式语法兼容，但不直接操作 Excel 文件。
  - 适合无头计算场景，如在线计算器、业务逻辑构建器、自定义电子表格应用等。
  - 不支持 Excel 的一些高级功能（如数据表、外部数据源函数）。[](https://npm-compare.com/hyperformula)[](https://handsontable.com/blog/introducing-hyperformula-fast-javascript-calculation-engine)
- **Apache POI**：
  - 专为操作 Excel 文件（.xls 和 .xlsx）设计，支持公式评估、单元格样式、文件读写等。
  - 适合需要直接处理 Excel 文件的服务器端应用，如报表生成、数据导出等。
  - 支持部分高级 Excel 功能（如循环引用），但某些高级函数（如数组公式）支持有限。[](https://deepwiki.com/apache/poi/3.1.3-formula-evaluation)

**结论**：HyperFormula 更适合轻量级、独立公式计算场景；Apache POI 更适合需要深度 Excel 文件操作的复杂场景。

#### (6) **扩展性**
- **HyperFormula**：
  - 支持通过 JavaScript/TypeScript 编写自定义函数，扩展简单。
  - 支持 CRUD 操作、撤销/重做、剪贴板、数据排序等功能，适合动态数据处理。[](https://www.npmjs.com/package/hyperformula?activeTab=readme)[](https://github.com/handsontable/hyperformula)
- **Apache POI**：
  - 支持自定义函数，但需要用 Java 编写并注册到宏启用工作簿，扩展复杂。
  - 提供循环引用处理、缓存管理等高级功能，但实现成本较高。[](https://deepwiki.com/apache/poi/3.1.3-formula-evaluation)

**结论**：HyperFormula 在自定义函数和动态数据操作的扩展性上更灵活。

---

### 3. **实际案例分析**
- **HyperFormula 示例**（计算抵押贷款付款）：
  ```javascript
  import { HyperFormula } from 'hyperformula';
  const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
  const sheetName = hf.addSheet('Mortgage Calculator');
  const sheetId = hf.getSheetId(sheetName);
  hf.addNamedExpression('AnnualInterestRate', '8%');
  hf.addNamedExpression('NumberOfMonths', 360);
  hf.addNamedExpression('LoanAmount', 800000);
  hf.setCellContents({ sheet: sheetId, row: 0, col: 0 }, [['Monthly Payment', '=PMT(AnnualInterestRate/12, NumberOfMonths, -LoanAmount)']]);
  console.log(hf.getCellValue({ sheet: sheetId, row: 0, col: 1 }));
  ```
  - 代码简洁，专注于公式计算，无需文件操作。[](https://www.npmjs.com/package/hyperformula?activeTab=readme)

- **Apache POI 示例**（评估公式）：
  ```java
  FileInputStream fis = new FileInputStream("test.xls");
  Workbook wb = new HSSFWorkbook(fis);
  FormulaEvaluator evaluator = wb.getCreationHelper().createFormulaEvaluator();
  CellReference cellReference = new CellReference("B3");
  Row row = wb.getSheetAt(0).getRow(cellReference.getRow());
  Cell cell = row.getCell(cellReference.getCol());
  CellValue cellValue = evaluator.evaluate(cell);
  System.out.println(cellValue.getNumberValue());
  ```
  - 代码需要处理文件加载、单元格定位等，较为繁琐。[](https://poi.apache.org/components/spreadsheet/eval.html)

---

### 4. **优缺点总结**
| 特性                     | HyperFormula                              | Apache POI                                |
|-------------------------|------------------------------------------|------------------------------------------|
| **内置函数数量**         | ~400，覆盖广泛                            | ~140，覆盖较窄                            |
| **性能**                | 高性能，适合实时计算                      | 受文件 I/O 和复杂公式限制，性能较低        |
| **跨工作簿引用**         | 不支持                                   | 支持，适合复杂 Excel 文件处理             |
| **易用性**              | API 简单，适合现代 Web 开发               | API 复杂，适合 Java 开发者                |
| **适用场景**            | 无头计算、Web 应用、动态数据处理          | Excel 文件操作、报表生成                 |
| **扩展性**              | 自定义函数简单，支持动态操作              | 自定义函数复杂，支持高级 Excel 功能       |

---

### 5. **结论**
- **HyperFormula 是否比 Apache POI 更强大？**
  - 在**公式评估**的特定领域，HyperFormula 在以下方面更强大：
    - **函数支持**：提供更多内置函数（400 vs 140），支持多语言公式。
    - **性能**：无需文件 I/O，解析和评估速度更快，适合实时计算。
    - **易用性**：API 更现代化，适合快速开发和 Web 应用。
    - **扩展性**：自定义函数实现更简单，适合动态数据处理。
  - **Apache POI 的优势**：
    - 专为 Excel 文件操作设计，支持跨工作簿引用和复杂 Excel 功能。
    - 适合需要深度文件操作的场景，如报表生成或批量数据处理。
    - 对循环引用和缓存管理有更完善的支持。

- **选择建议**：
  - 如果你的应用主要需要**高效的公式计算**（如在线计算器、实时仪表盘），且不依赖 Excel 文件，**HyperFormula** 是更强大的选择。
  - 如果你的应用需要**处理 Excel 文件**（如读写 .xlsx 文件、跨工作簿引用），**Apache POI** 是更合适的选择。

根据你的具体需求（是否需要文件操作或仅关注公式计算），可以选择更适合的工具。如果需要进一步的性能测试数据或具体场景分析，请提供更多细节，我可以帮你设计更精确的比较！


根据提供的参考资料和网络信息，我整理了 HyperFormula 和 Apache POI 支持的函数列表。由于完整列出 HyperFormula 的 395 个函数和 Apache POI 的 202 个函数会导致表格过于冗长，我将重点列出两者的函数类别和部分代表性函数，并在表格中对两者支持的函数进行分类对比，并说明部分差异。如果需要完整的函数列表，我可以提供更详细的补充，或你可以在 HyperFormula 官方文档（https://hyperformula.handsontable.com/guide/built-in-functions.html）和 Apache POI 文档（Appendix A 或通过 `WorkbookEvaluator.getSupportedFunctionNames()`）中查找。

以下是 HyperFormula 和 Apache POI 支持的函数的对比表格，左侧列出 HyperFormula 的函数类别和部分代表性函数，右侧列出 Apache POI 的函数类别和部分代表性函数。表格会尽量涵盖主要类别，并标注两者的差异。

---

### HyperFormula vs Apache POI 支持的函数对比

| **HyperFormula 支持的函数** | **Apache POI 支持的函数** |
|----------------------------|--------------------------|
| **函数总数**：395（截至 v3.0.0） | **函数总数**：202（截至 v5.2.0） |
| **类别：数组操作 (Array Manipulation)**<br> - ARRAYFORMULA<br> - FILTER<br> - ARRAY_CONSTRAIN | **类别：数组操作**<br> - 部分支持通过 `Sheet.setArrayFormula()`<br> - 不支持 FILTER、ARRAY_CONSTRAIN 等专用数组函数 |
| **类别：日期和时间 (Date and Time)**<br> - DATE, DATEDIF, DATEVALUE<br> - DAY, DAYS, DAYS360<br> - EDATE, EOMONTH<br> - HOUR, MINUTE, SECOND<br> - NETWORKDAYS, NETWORKDAYS.INTL<br> - NOW, TODAY, WEEKDAY, WEEKNUM<br> - WORKDAY, WORKDAY.INTL, YEARFRAC | **类别：日期和时间**<br> - DATE, DATEVALUE<br> - DAY, DAYS, DAYS360<br> - EDATE, EOMONTH<br> - HOUR, MINUTE, SECOND<br> - NOW, TODAY, WEEKDAY<br> - 不支持 NETWORKDAYS.INTL, WORKDAY.INTL, YEARFRAC |
| **类别：工程函数 (Engineering)**<br> - BIN2DEC, BIN2HEX, BIN2OCT<br> - BITAND, BITLSHIFT, BITOR, BITRSHIFT, BITXOR<br> - COMPLEX, IMABS, IMAGINARY, IMARGUMENT<br> - DEC2BIN, DEC2HEX, DEC2OCT<br> - ERF, ERFC<br> - HEX2BIN, HEX2DEC, HEX2OCT<br> - OCT2BIN, OCT2DEC, OCT2HEX | **类别：工程函数**<br> - BIN2DEC, COMPLEX<br> - DEC2BIN, DEC2HEX<br> - DELTA, HEX2DEC<br> - 不支持 BITAND, BITLSHIFT, BITOR, BITRSHIFT, BITXOR, ERF, ERFC 等 |
| **类别：信息函数 (Information)**<br> - ISBINARY, ISBLANK, ISERR, ISERROR<br> - ISEVEN, ISFORMULA, ISLOGICAL, ISNA<br> - ISNONTEXT, ISNUMBER, ISODD, ISREF, ISTEXT<br> - SHEET, SHEETS, NA | **类别：信息函数**<br> - ISBLANK, ISERR, ISERROR<br> - ISLOGICAL, ISNA, ISNUMBER, ISTEXT<br> - NA<br> - 不支持 ISBINARY, ISFORMULA, ISNONTEXT, ISREF, SHEET, SHEETS |
| **类别：财务函数 (Financial)**<br> - CUMIPMT, CUMPRINC<br> - DB, DDB, DOLLARDE, DOLLARFR<br> - EFFECT, FV, FVSCHEDULE<br> - IPMT, IRR, ISPMT, MIRR, NOMINAL<br> - NPER, NPV, PMT, PPMT, PV<br> - RATE, SLN, SYD, VDB | **类别：财务函数**<br> - CUMIPMT, CUMPRINC<br> - DB, DDB, DOLLARDE, DOLLARFR<br> - FV, IPMT, IRR, MIRR<br> - NPER, NPV, PMT, PPMT, PV<br> - RATE<br> - 不支持 EFFECT, FVSCHEDULE, ISPMT, NOMINAL, SLN, SYD, VDB |
| **类别：逻辑函数 (Logical)**<br> - AND, FALSE, IF, IFERROR, IFNA<br> - NOT, OR, TRUE, XOR | **类别：逻辑函数**<br> - AND, FALSE, IF<br> - NOT, OR, TRUE<br> - 不支持 IFERROR, IFNA, XOR |
| **类别：查找和引用 (Lookup and Reference)**<br> - CHOOSE, COLUMN, COLUMNS<br> - HLOOKUP, INDEX, MATCH<br> - ROW, ROWS, VLOOKUP | **类别：查找和引用**<br> - CHOOSE, COLUMN, COLUMNS<br> - HLOOKUP, INDEX, LOOKUP, MATCH<br> - ROW, ROWS, VLOOKUP<br> - 支持 INDIRECT |
| **类别：数学和三角函数 (Math and Trigonometry)**<br> - ABS, ACOS, ACOSH, ASIN, ASINH<br> - ATAN, ATAN2, ATANH<br> - CEILING, CEILING.MATH, CEILING.PRECISE<br> - COS, COSH, EXP, FACT, FLOOR<br> - FLOOR.MATH, FLOOR.PRECISE<br> - LN, LOG, LOG10, PI, POWER<br> - ROUND, ROUNDDOWN, ROUNDUP<br> - SIN, SINH, SQRT, SUM, SUMPRODUCT | **类别：数学和三角函数**<br> - ABS, ACOS, ACOSH, ASIN, ASINH<br> - ATAN, ATAN2, ATANH<br> - CEILING, CEILING.MATH, CEILING.PRECISE<br> - COS, COSH, EXP, FACT, FLOOR<br> - FLOOR.MATH, FLOOR.PRECISE<br> - LN, LOG, LOG10, PI, POWER<br> - ROUND, ROUNDDOWN, ROUNDUP<br> - SIN, SINH, SQRT, SQRTPI, SUM, SUMPRODUCT |
| **类别：矩阵函数 (Matrix)**<br> - MDETERM, MINVERSE, MMULT<br> - MUNIT, TRANSPOSE | **类别：矩阵函数**<br> - 不支持 MDETERM, MINVERSE, MMULT, MUNIT, TRANSPOSE |
| **类别：操作符 (Operator)**<br> - 支持标准算术和逻辑操作符<br> - 区间操作符（如 UNION、INTERSECTION）部分支持 | **类别：操作符**<br> - 支持标准算术和逻辑操作符<br> - 部分支持区间操作符（如 UNION、INTERSECTION） |
| **类别：统计函数 (Statistical)**<br> - AVEDEV, AVERAGE, AVERAGEA<br> - COUNT, COUNTA, COUNTBLANK<br> - MAX, MIN, MEDIAN<br> - STDEV, STDEV.S, STDEV.P<br> - VAR, VAR.S, VAR.P | **类别：统计函数**<br> - AVERAGE, AVERAGEA<br> - COUNT, COUNTA, COUNTBLANK, COUNTIF, COUNTIFS<br> - MAX, MIN, MAXIFS, MINIFS<br> - STDEV, STDEV.P, STDEV.S<br> - VAR, VAR.P, VAR.S<br> - 不支持 AVEDEV, MEDIAN |
| **类别：文本函数 (Text)**<br> - CONCAT, CONCATENATE, LEFT, LEN<br> - LOWER, MID, RIGHT, SUBSTITUTE<br> - TEXT, TRIM, UPPER | **类别：文本函数**<br> - CONCATENATE, LEFT, LEN<br> - LOWER, MID, RIGHT, SUBSTITUTE<br> - TEXT, TRIM, UPPER<br> - 支持 REPLACE, REPT |
| **不支持的类别**<br> - 兼容性函数 (Compatibility)<br> - 立方体函数 (Cube)<br> - 数据库函数 (Database) | **支持的额外类别**<br> - 数据库函数 (Database)<br>   - DAVERAGE, DCOUNT, DCOUNTA<br>   - DGET, DMAX, DMIN, DPRODUCT<br>   - DSTDEV, DSTDEVP, DSUM, DVAR, DVARP |

---

### 关键差异和说明
1. **函数数量**：
   - **HyperFormula**：提供 395 个函数，覆盖广泛的类别，特别在工程函数和矩阵函数方面有明显优势。支持多语言（17 种语言）和自定义函数扩展，适合动态、实时计算场景。[](https://hyperformula.handsontable.com/guide/built-in-functions.html)
   - **Apache POI**：支持 202 个函数，主要针对 Excel 文件操作，函数覆盖范围较窄，尤其在工程和矩阵函数方面较弱。[](https://poi.apache.org/components/spreadsheet/eval-devguide.html)

2. **类别覆盖**：
   - HyperFormula 支持矩阵函数（如 MDETERM、MINVERSE、MMULT），而 Apache POI 不支持。
   - Apache POI 支持数据库函数（如 DAVERAGE、DCOUNT），而 HyperFormula 不支持数据库、兼容性和立方体函数。
   - HyperFormula 的数组操作函数（如 FILTER、ARRAY_CONSTRAIN）更现代化，Apache POI 的数组支持较为基础，仅通过 `Sheet.setArrayFormula()` 实现。

3. **代表性函数差异**：
   - HyperFormula 支持一些现代 Excel 函数（如 NETWORKDAYS.INTL、WORKDAY.INTL、IFERROR、IFNA），而 Apache POI 缺乏对这些函数的支持。
   - Apache POI 支持 INDIRECT 和部分数据库函数，适合需要复杂 Excel 文件操作的场景。

4. **扩展性**：
   - HyperFormula 允许通过 JavaScript/TypeScript 轻松添加自定义函数。
   - Apache POI 支持用户定义函数，但需要通过 Java 实现并注册到宏启用工作簿，扩展较为复杂。[](https://poi.apache.org/components/spreadsheet/user-defined-functions.html)

5. **局限性**：
   - HyperFormula 不支持跨工作簿引用和某些高级 Excel 功能（如数据表）。
   - Apache POI 在处理复杂公式或大量数据时性能较差，且不支持多语言公式。

---

### 获取完整函数列表
- **HyperFormula**：完整列表可参考官方文档（https://hyperformula.handsontable.com/guide/built-in-functions.html），列出了所有 395 个函数及其语法。[](https://hyperformula.handsontable.com/guide/built-in-functions.html)
- **Apache POI**：可以通过以下代码获取支持的函数列表：
  ```java
  import org.apache.poi.ss.formula.WorkbookEvaluator;
  Collection<String> supportedFuncs = WorkbookEvaluator.getSupportedFunctionNames();
  System.out.println("Supported Functions: " + supportedFuncs.size());
  System.out.println(supportedFuncs);
  ```
  或者参考 Apache POI 文档的 Appendix A（https://poi.apache.org/developers/formula.html）。[](https://poi.apache.org/components/spreadsheet/eval-devguide.html)

---

### 总结
- **HyperFormula** 在函数数量（395 vs 202）、现代化函数支持（如 FILTER、IFERROR）和易用性上更强大，适合无头计算和 Web 应用。
- **Apache POI** 在 Excel 文件操作和数据库函数方面有优势，适合需要处理复杂 Excel 文件的场景。
- 如果需要特定函数的详细实现或代码示例，请告诉我，我可以进一步提供相关信息！


### 关键点
- 使用 HyperFormula 和 ExcelJS 配合，可以有效评估 Excel 文件中的所有公式，适合复杂计算场景。
- 实现步骤包括读取 Excel 文件、提取数据和公式，然后通过 HyperFormula 进行计算。
- 需要注意公式可能存在解析问题，需根据具体情况调整。

### 概述
通过 HyperFormula 和 ExcelJS 的结合，可以在 Node.js 环境中评估 Excel 文件中的所有公式。以下是实现步骤的简要说明：

#### 安装与准备
首先，确保安装必要的包：
- 使用以下命令安装：
  ```bash
  npm install exceljs hyperformula
  ```

#### 示例代码
以下是一个示例，展示如何读取 Excel 文件并评估公式：
```javascript
const ExcelJS = require('exceljs');
const { HyperFormula } = require('hyperformula');

function fixFormulas(sheetName, formula) {
  return formula;
}

function workbookToHyperFormula(workbook, fixFormulas) {
  const sheets = {};
  for (const sheet of workbook.worksheets) {
    const sheetData = [];
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const rowData = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let value = cell.value;
        if (cell.formula) {
          value = { formula: fixFormulas(sheet.name, cell.formula) };
        } else if (typeof value === 'object' && value !== null) {
          if (value.result) {
            value = value.result;
          } else if (value.richText) {
            value = value.richText.map(rt => rt.text).join('');
          }
        }
        rowData.push(value);
      });
      sheetData.push(rowData);
    });
    sheets[sheet.name] = sheetData;
  }
  const hf = HyperFormula.buildFromSheets(sheets, {
    licenseKey: 'gpl-v3',
    dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
    timeFormats: ['hh:mm', 'hh:mm:ss.sss'],
    ignorePunctuation: true,
    leapYear1900: true,
    localeLang: 'enGB',
    functionArgSeparator: ',',
  });
  return hf;
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('example.xlsx');
  
  const hfInstance = workbookToHyperFormula(workbook, fixFormulas);
  
  const sheetId = hfInstance.getSheetId('Sheet1');
  if (sheetId === undefined) {
    console.log('Sheet not found');
    return;
  }
  
  const cellValue = hfInstance.getCellValue({ sheet: sheetId, row: 0, col: 0 });
  console.log('Value of A1:', cellValue);
}

main().catch(err => console.error(err));
```
这个示例读取名为 'example.xlsx' 的文件，评估公式，并打印 Sheet1 中 A1 单元格的计算值。

#### 注意事项
- 确保 Excel 文件包含公式，且文件路径正确。
- 如果公式解析有问题，可能需要调整 `fixFormulas` 函数来处理特定情况。
- HyperFormula 支持约 400 个内置函数，适合复杂计算，但可能需要额外配置日期格式等选项。

---

### 调查报告

以下是关于使用 HyperFormula 和 ExcelJS 配合评估 Excel 文件中所有公式的详细调查，涵盖背景、技术选择、实现步骤以及潜在局限性，旨在为用户提供全面的参考。

#### 背景与需求分析
Excel 文件中的公式是其核心功能之一，允许用户通过公式动态计算数据，尤其是在涉及跨表引用（如 Sheet1 的公式引用 Sheet2 的单元格）时，评估这些公式在 Node.js 环境中尤为重要。用户可能需要自动化处理这些公式，例如在后端服务中生成报告或验证数据，而不依赖于 Excel 应用程序本身。

传统的 Excel 处理库如 ExcelJS 可以读取公式，但通常返回公式字符串而非计算结果。因此，需寻找能够动态评估公式的解决方案。HyperFormula 作为一个无头电子表格引擎，支持解析和评估公式，结合 ExcelJS 的文件读取能力，可以实现这一需求。

#### 技术选择与评估
通过研究，发现以下库可能适用于评估 Excel 公式：

1. **HyperFormula**  
   - **描述**：基于 TypeScript 的无头电子表格引擎，支持解析和评估公式，适用于浏览器和 Node.js。  
   - **功能**：提供约 400 个内置函数，支持跨表引用、自定义函数等，性能优化较高。  
   - **使用场景**：需手动加载 Excel 文件数据并设置到 HyperFormula 实例中，步骤较复杂，例如：读取 Excel 文件后，提取数据和公式，创建 HyperFormula 实例，设置公式后评估。  
   - **维护状态**：最新版本为 3.0.0，发布于 2025 年 1 月 14 日，npm 注册中有 30 个依赖项目，活跃度较高。  
   - **优势**：功能全面，适合复杂计算场景。  
   - **局限性**：集成复杂，学习曲线较陡，对于简单公式评估可能过于重型。

2. **ExcelJS**  
   - **描述**：一个用于读取、操作和写入 Excel 文件的 JavaScript 库，支持 XLSX 文件格式。  
   - **功能**：可以读取单元格值、公式，但不直接评估公式，需结合其他库如 HyperFormula 进行计算。  
   - **使用场景**：常用于文件 I/O 操作，配合 HyperFormula 处理公式评估。  
   - **维护状态**：活跃度高，最新版本支持广泛，适合生产环境。  
   - **优势**：文件读取功能强大，易于集成。  
   - **局限性**：不直接支持公式评估，需额外处理。

综合比较，HyperFormula 因其强大的公式评估能力，结合 ExcelJS 的文件读取功能，成为评估 Excel 公式的最佳选择。

#### 实现步骤与示例
以下是使用 HyperFormula 和 ExcelJS 的详细步骤：

1. **安装依赖**  
   执行以下命令安装 `exceljs` 和 `hyperformula`：  
   ```bash
   npm install exceljs hyperformula
   ```

2. **读取 Excel 文件并评估公式**  
   使用以下代码示例：  
   ```javascript
   const ExcelJS = require('exceljs');
   const { HyperFormula } = require('hyperformula');

   function fixFormulas(sheetName, formula) {
     return formula;
   }

   function workbookToHyperFormula(workbook, fixFormulas) {
     const sheets = {};
     for (const sheet of workbook.worksheets) {
       const sheetData = [];
       sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
         const rowData = [];
         row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
           let value = cell.value;
           if (cell.formula) {
             value = { formula: fixFormulas(sheet.name, cell.formula) };
           } else if (typeof value === 'object' && value !== null) {
             if (value.result) {
               value = value.result;
             } else if (value.richText) {
               value = value.richText.map(rt => rt.text).join('');
             }
           }
           rowData.push(value);
         });
         sheetData.push(rowData);
       });
       sheets[sheet.name] = sheetData;
     }
     const hf = HyperFormula.buildFromSheets(sheets, {
       licenseKey: 'gpl-v3',
       dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
       timeFormats: ['hh:mm', 'hh:mm:ss.sss'],
       ignorePunctuation: true,
       leapYear1900: true,
       localeLang: 'enGB',
       functionArgSeparator: ',',
     });
     return hf;
   }

   async function main() {
     const workbook = new ExcelJS.Workbook();
     await workbook.xlsx.readFile('example.xlsx');
     
     const hfInstance = workbookToHyperFormula(workbook, fixFormulas);
     
     const sheetId = hfInstance.getSheetId('Sheet1');
     if (sheetId === undefined) {
       console.log('Sheet not found');
       return;
     }
     
     const cellValue = hfInstance.getCellValue({ sheet: sheetId, row: 0, col: 0 });
     console.log('Value of A1:', cellValue);
   }

   main().catch(err => console.error(err));
   ```

3. **扩展功能**  
   - 如果公式涉及非标准函数或需要自定义逻辑，可以调整 `fixFormulas` 函数。例如，处理特定公式语法问题，如替换非法字符。
   - 可以遍历所有单元格获取计算值，适合需要全面评估的场景。

#### 潜在局限性与注意事项
- **公式解析**：HyperFormula 可能对某些公式有严格的语法要求，例如 sheet 名称或单元格引用格式。如果遇到问题，需通过 `fixFormulas` 函数调整。例如，GitHub gist 中提到需要替换 "mecc2" 为 "mecctwo" 以符合 HyperFormula 的正则表达式。
- **性能**：对于包含大量公式或大数据量的 Excel 文件，计算可能较慢，需测试性能瓶颈。
- **维护状态**：HyperFormula 最近更新为 2025 年 1 月，活跃度较高，但需关注未来更新。ExcelJS 同样维护良好，适合生产环境。
- **错误处理**：HyperFormula 会返回错误值（如循环引用），需在获取单元格值时处理。

#### 对比表：主要库功能与适用性

| 库名称       | 支持跨表引用 | 易用性 | 性能 | 维护活跃度 | 适用场景                     |
|--------------|--------------|--------|------|------------|------------------------------|
| HyperFormula | 是           | 中     | 高   | 高         | 复杂计算，大型数据处理       |
| ExcelJS      | 否           | 高     | 中   | 高         | 文件读取，不评估公式         |

#### 结论与推荐
研究表明，在 Node.js 技术栈下，使用 HyperFormula 和 ExcelJS 配合是评估 Excel 文件中所有公式的有效方法。HyperFormula 提供强大的公式评估能力，ExcelJS 负责文件读取，结合使用可以覆盖大多数需求。用户可根据文件复杂度和性能需求调整 `fixFormulas` 函数或配置选项。对于跨表引用等复杂场景，HyperFormula 已证明有效，但需注意其公式解析的严格性。

支持链接：  
- [HyperFormula npm 页面](https://www.npmjs.com/package/hyperformula)  
- [ExcelJS npm 页面](https://www.npmjs.com/package/exceljs)  
- [HyperFormula 文件导入文档](https://hyperformula.handsontable.com/guide/file-import.html)  
- [GitHub 示例](https://gist.github.com/dabreegster/253ab5f6e489bfbb55584d21fe428081)


### 关键点
- 使用 HyperFormula 和 ExcelJS 可以评估 Excel 文件中的所有公式，并将计算结果写回 Excel 文件。
- 研究表明，这种方法适合复杂计算场景，但可能需要调整公式解析以处理特定问题。

---

### 直接回答

以下是使用 HyperFormula 和 ExcelJS 评估 Excel 文件中所有公式并将结果写回的步骤，适合大多数用户需求：

#### 安装与准备
首先，确保安装必要的包：
- 运行以下命令：
  ```bash
  npm install exceljs hyperformula
  ```

#### 实现步骤
1. **读取 Excel 文件**：使用 ExcelJS 读取输入的 Excel 文件。
2. **构建 HyperFormula 实例**：提取文件中的数据和公式，创建 HyperFormula 实例以计算所有公式。
3. **获取计算结果**：从 HyperFormula 获取每个工作表的计算值。
4. **更新 Excel 文件**：将计算结果更新到 ExcelJS 的工作表中，替换原有的公式。
5. **保存文件**：将更新后的工作表保存为新的 Excel 文件。

以下是一个示例代码，展示如何实现上述步骤：

```javascript
const ExcelJS = require('exceljs');
const { HyperFormula } = require('hyperformula');

function fixFormulas(sheetName, formula) {
    return formula; // 根据需要调整公式
}

function workbookToHyperFormula(workbook, fixFormulas) {
    const sheets = {};
    for (const sheet of workbook.worksheets) {
        const sheetData = [];
        sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            const rowData = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                let value = cell.value;
                if (cell.formula) {
                    value = { formula: fixFormulas(sheet.name, cell.formula) };
                } else if (typeof value === 'object' && value !== null) {
                    if (value.result) {
                        value = value.result;
                    } else if (value.richText) {
                        value = value.richText.map(rt => rt.text).join('');
                    }
                }
                rowData.push(value);
            });
            sheetData.push(rowData);
        });
        sheets[sheet.name] = sheetData;
    }
    const hf = HyperFormula.buildFromSheets(sheets, {
        licenseKey: 'gpl-v3',
    });
    return hf;
}

async function evaluateAndWriteBack(inputFile, outputFile) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputFile);
    
    const hfInstance = workbookToHyperFormula(workbook, fixFormulas);
    
    for (const sheetName of hfInstance.getSheetNames()) {
        const sheetId = hfInstance.getSheetId(sheetName);
        const values = hfInstance.getSheetValues(sheetId);
        
        const excelSheet = workbook.getWorksheet(sheetName);
        
        values.forEach((row, rowIndex) => {
            row.forEach((cellValue, colIndex) => {
                const cell = excelSheet.getCell(rowIndex + 1, colIndex + 1);
                cell.value = cellValue;
            });
        });
    }
    
    await workbook.xlsx.writeFile(outputFile);
    console.log(`Excel 文件已更新并保存至 ${outputFile}`);
}

// 使用示例
evaluateAndWriteBack('input.xlsx', 'output.xlsx').catch(err => console.error(err));
```

#### 注意事项
- 如果公式解析有问题，可能需要调整 `fixFormulas` 函数，例如处理特定公式语法。
- 确保输入文件存在且是有效的 Excel 文件。
- 计算结果会替换原有的公式，生成静态值。

支持链接：
- [HyperFormula 文档](https://hyperformula.handsontable.com/)
- [ExcelJS 文档](https://github.com/exceljs/exceljs)
- [GitHub Gist 示例](https://gist.github.com/dabreegster/253ab5f6e489bfbb55584d21fe428081)

---

### 调查报告

以下是关于使用 HyperFormula 和 ExcelJS 配合评估 Excel 文件中所有公式并将结果写回的详细调查，涵盖背景、技术选择、实现步骤以及潜在局限性，旨在为用户提供全面的参考。

#### 背景与需求分析
Excel 文件中的公式是其核心功能之一，允许用户通过公式动态计算数据，尤其是在涉及跨表引用（如 Sheet1 的公式引用 Sheet2 的单元格）时，评估这些公式在 Node.js 环境中尤为重要。用户可能需要自动化处理这些公式，例如在后端服务中生成报告或验证数据，而不依赖于 Excel 应用程序本身。此外，用户可能希望将计算结果写回 Excel 文件，替换原有的公式，以生成静态值文件。

传统的 Excel 处理库如 ExcelJS 可以读取公式，但通常返回公式字符串而非计算结果。因此，需寻找能够动态评估公式的解决方案，并结合文件写入功能。

#### 技术选择与评估
通过研究，发现以下库可能适用于评估 Excel 公式并写回：

1. **HyperFormula**  
   - **描述**：基于 TypeScript 的无头电子表格引擎，支持解析和评估公式，适用于浏览器和 Node.js。  
   - **功能**：提供约 400 个内置函数，支持跨表引用、自定义函数等，性能优化较高。  
   - **使用场景**：需手动加载 Excel 文件数据并设置到 HyperFormula 实例中，步骤较复杂，例如：读取 Excel 文件后，提取数据和公式，创建 HyperFormula 实例，设置公式后评估，并将结果写回。  
   - **维护状态**：最新版本为 3.0.0，发布于 2025 年 1 月 14 日，npm 注册中有 30 个依赖项目，活跃度较高。  
   - **优势**：功能全面，适合复杂计算场景，支持高效批量操作。  
   - **局限性**：集成复杂，学习曲线较陡，对于简单公式评估可能过于重型。

2. **ExcelJS**  
   - **描述**：一个用于读取、操作和写入 Excel 文件的 JavaScript 库，支持 XLSX 文件格式。  
   - **功能**：可以读取单元格值、公式，并支持写入文件，但不直接评估公式，需结合其他库如 HyperFormula 进行计算。  
   - **使用场景**：常用于文件 I/O 操作，配合 HyperFormula 处理公式评估和结果写入。  
   - **维护状态**：活跃度高，最新版本支持广泛，适合生产环境。  
   - **优势**：文件读取和写入功能强大，易于集成。  
   - **局限性**：不直接支持公式评估，需额外处理。

综合比较，HyperFormula 因其强大的公式评估能力，结合 ExcelJS 的文件读取和写入功能，成为评估 Excel 公式并写回的最佳选择。

#### 实现步骤与示例
以下是使用 HyperFormula 和 ExcelJS 的详细步骤：

1. **安装依赖**  
   执行以下命令安装 `exceljs` 和 `hyperformula`：  
   ```bash
   npm install exceljs hyperformula
   ```

2. **读取 Excel 文件并评估公式**  
   使用以下代码示例：  
   ```javascript
   const ExcelJS = require('exceljs');
   const { HyperFormula } = require('hyperformula');

   function fixFormulas(sheetName, formula) {
       return formula; // 可以根据需要调整，例如处理特定公式语法
   }

   function workbookToHyperFormula(workbook, fixFormulas) {
       const sheets = {};
       for (const sheet of workbook.worksheets) {
           const sheetData = [];
           sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
               const rowData = [];
               row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                   let value = cell.value;
                   if (cell.formula) {
                       value = { formula: fixFormulas(sheet.name, cell.formula) };
                   } else if (typeof value === 'object' && value !== null) {
                       if (value.result) {
                           value = value.result;
                       } else if (value.richText) {
                           value = value.richText.map(rt => rt.text).join('');
                       }
                   }
                   rowData.push(value);
               });
               sheetData.push(rowData);
           });
           sheets[sheet.name] = sheetData;
       }
       const hf = HyperFormula.buildFromSheets(sheets, {
           licenseKey: 'gpl-v3',
           dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
           timeFormats: ['hh:mm', 'hh:mm:ss.sss'],
           ignorePunctuation: true,
           leapYear1900: true,
           localeLang: 'enGB',
           functionArgSeparator: ',',
       });
       return hf;
   }

   async function evaluateAndWriteBack(inputFile, outputFile) {
       const workbook = new ExcelJS.Workbook();
       await workbook.xlsx.readFile(inputFile);
       
       const hfInstance = workbookToHyperFormula(workbook, fixFormulas);
       
       for (const sheetName of hfInstance.getSheetNames()) {
           const sheetId = hfInstance.getSheetId(sheetName);
           const values = hfInstance.getSheetValues(sheetId);
           
           const excelSheet = workbook.getWorksheet(sheetName);
           
           values.forEach((row, rowIndex) => {
               row.forEach((cellValue, colIndex) => {
                   const cell = excelSheet.getCell(rowIndex + 1, colIndex + 1);
                   cell.value = cellValue;
               });
           });
       }
       
       await workbook.xlsx.writeFile(outputFile);
       console.log(`Excel 文件已更新并保存至 ${outputFile}`);
   }

   // 使用示例
   evaluateAndWriteBack('input.xlsx', 'output.xlsx').catch(err => console.error(err));
   ```

3. **扩展功能**  
   - 如果公式涉及非标准函数或需要自定义逻辑，可以调整 `fixFormulas` 函数。例如，处理特定公式语法问题，如替换非法字符。
   - 可以遍历所有单元格获取计算值，适合需要全面评估的场景。

#### 潜在局限性与注意事项
- **公式解析**：HyperFormula 可能对某些公式有严格的语法要求，例如 sheet 名称或单元格引用格式。如果遇到问题，需通过 `fixFormulas` 函数调整。例如，GitHub gist 中提到需要替换 "mecc2" 为 "mecctwo" 以符合 HyperFormula 的正则表达式。
- **性能**：对于包含大量公式或大数据量的 Excel 文件，计算可能较慢，需测试性能瓶颈。
- **维护状态**：HyperFormula 最近更新为 2025 年 1 月，活跃度较高，但需关注未来更新。ExcelJS 同样维护良好，适合生产环境。
- **错误处理**：HyperFormula 会返回错误值（如循环引用），需在获取单元格值时处理。
- **日期处理**：HyperFormula 将日期存储为数字，写入 ExcelJS 时需确保单元格格式正确，否则可能显示为数字而非日期。

#### 对比表：主要库功能与适用性

| 库名称       | 支持跨表引用 | 易用性 | 性能 | 维护活跃度 | 适用场景                     |
|--------------|--------------|--------|------|------------|------------------------------|
| HyperFormula | 是           | 中     | 高   | 高         | 复杂计算，大型数据处理       |
| ExcelJS      | 否           | 高     | 中   | 高         | 文件读取和写入，不评估公式   |

#### 结论与推荐
研究表明，在 Node.js 技术栈下，使用 HyperFormula 和 ExcelJS 配合是评估 Excel 文件中所有公式并写回的有效方法。HyperFormula 提供强大的公式评估能力，ExcelJS 负责文件读取和写入，结合使用可以覆盖大多数需求。用户可根据文件复杂度和性能需求调整 `fixFormulas` 函数或配置选项。对于跨表引用等复杂场景，HyperFormula 已证明有效，但需注意其公式解析的严格性。

支持链接：
- [HyperFormula npm 页面](https://www.npmjs.com/package/hyperformula)
- [ExcelJS npm 页面](https://www.npmjs.com/package/exceljs)
- [HyperFormula 文件导入文档](https://hyperformula.handsontable.com/guide/file-import.html)
- [GitHub 示例](https://gist.github.com/dabreegster/253ab5f6e489bfbb55584d21fe428081)


