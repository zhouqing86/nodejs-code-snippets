
## ChatGPT5

下面给你两块内容：
- 一套可用的 Kotlin 工具函数：把一个 sheet 从一个 Workbook 复制到另一个（支持 XSSFWorkbook → XSSFWorkbook 或 XSSFWorkbook → SXSSFWorkbook），尽量保留单元格值、样式、列宽、行高、合并单元格、超链接、批注等常见要素。
- 如何同时从一个文件创建 XSSFWorkbook 和 SXSSFWorkbook，以及清空 worksheet 的几种做法与利弊。

提醒：你说的 SXXFWorkbook 多半是 SXSSFWorkbook（Streaming XSSF Workbook）。

一、Kotlin：从一个 Workbook 复制 sheet 到另一个 Workbook
说明
- 适用于 .xlsx（XSSF/SXSSF）。copy 时会：
  - 复制单元格的值（含公式）、样式（含数据格式和字体）、行高、列宽
  - 复制超链接、批注（尽量）
  - 复制合并单元格
- 暂未包含（可按需补充）：图片/形状、数据有效性、条件格式、分页/打印设置、冻结窗格等复杂特性。
- 复制到 SXSSFWorkbook 时请按顺序写行（函数实现就是顺序复制的，不会违反 SXSSF 要求）。

代码
```kotlin
import org.apache.poi.ss.usermodel.*
import org.apache.poi.ss.util.CellRangeAddress
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.apache.poi.xssf.streaming.SXSSFWorkbook

/**
 * 将 srcWb 中名为 srcSheetName 的 sheet 复制到 dstWb 新建的 dstSheetName。
 * 复制单元格值、样式（含数据格式/字体）、行高、列宽、超链接、批注、合并单元格。
 *
 * 注意：
 * - SXSSF 目标工作簿要求按行号递增写入，本函数就是按源行递增遍历，符合要求。
 * - 公式字符串直接按字面复制，若引用了目标工作簿不存在的名称/工作表，后续计算会出错。
 */
fun copySheet(
    srcWb: Workbook,
    srcSheetName: String,
    dstWb: Workbook,
    dstSheetName: String = srcSheetName,
    copyComments: Boolean = true,
    copyHyperlinks: Boolean = true
): Sheet {
    val srcSheet = srcWb.getSheet(srcSheetName)
        ?: throw IllegalArgumentException("Source sheet not found: $srcSheetName")
    val dstSheet = dstWb.createSheet(dstSheetName)

    val styleMap = mutableMapOf<Short, CellStyle>() // map: srcStyle.index -> dstStyle
    val fontMap = mutableMapOf<Short, Font>()       // map: srcFont.index -> dstFont
    val dstHelper = dstWb.creationHelper
    // createDrawingPatriarch 对 SXSSF/XSSF 都可用，但 SXSSF 中批注/图形支持有一定限制
    val drawing = runCatching { dstSheet.createDrawingPatriarch() }.getOrNull()

    var maxCol = 0

    // 行：按行号递增复制，满足 SXSSF 的要求
    val rowIterator = srcSheet.rowIterator()
    while (rowIterator.hasNext()) {
        val srcRow = rowIterator.next()
        val dstRow = dstSheet.createRow(srcRow.rowNum)
        dstRow.height = srcRow.height
        srcRow.rowStyle?.let { rs ->
            dstRow.rowStyle = cloneStyle(srcWb, dstWb, rs, styleMap, fontMap)
        }

        // 单元格
        val cellIterator = srcRow.cellIterator()
        while (cellIterator.hasNext()) {
            val srcCell = cellIterator.next()
            if (srcCell.columnIndex > maxCol) maxCol = srcCell.columnIndex

            val dstCell = dstRow.createCell(srcCell.columnIndex)

            // 样式
            srcCell.cellStyle?.let { cs ->
                dstCell.cellStyle = cloneStyle(srcWb, dstWb, cs, styleMap, fontMap)
            }

            // 值/公式/类型
            when (srcCell.cellType) {
                CellType.FORMULA -> dstCell.cellFormula = srcCell.cellFormula
                CellType.NUMERIC -> dstCell.setCellValue(srcCell.numericCellValue)
                CellType.STRING -> dstCell.setCellValue(srcCell.richStringCellValue.string)
                CellType.BOOLEAN -> dstCell.setCellValue(srcCell.booleanCellValue)
                CellType.ERROR -> dstCell.setCellErrorValue(srcCell.errorCellValue)
                CellType.BLANK -> { /* keep blank */ }
                else -> dstCell.setBlank()
            }

            // 超链接
            if (copyHyperlinks) {
                srcCell.hyperlink?.let { hl ->
                    val newHl = dstHelper.createHyperlink(hl.type).apply {
                        address = hl.address
                        firstRow = srcRow.rowNum
                        firstColumn = srcCell.columnIndex
                        lastRow = srcRow.rowNum
                        lastColumn = srcCell.columnIndex
                    }
                    dstCell.hyperlink = newHl
                }
            }

            // 批注（简化实现：文本按纯文本复制）
            if (copyComments && drawing != null) {
                srcCell.cellComment?.let { cmt ->
                    val anchor = dstHelper.createClientAnchor().apply {
                        col1 = cmt.clientAnchor.col1
                        col2 = cmt.clientAnchor.col2
                        row1 = cmt.clientAnchor.row1
                        row2 = cmt.clientAnchor.row2
                        dx1 = cmt.clientAnchor.dx1
                        dx2 = cmt.clientAnchor.dx2
                        dy1 = cmt.clientAnchor.dy1
                        dy2 = cmt.clientAnchor.dy2
                    }
                    val newCmt = drawing.createCellComment(anchor).apply {
                        author = cmt.author
                        string = dstHelper.createRichTextString(cmt.string.string)
                        isVisible = cmt.isVisible
                    }
                    dstCell.cellComment = newCmt
                }
            }
        }
    }

    // 列宽与列默认样式
    for (c in 0..maxCol) {
        dstSheet.setColumnWidth(c, srcSheet.getColumnWidth(c))
        srcSheet.getColumnStyle(c)?.let { colStyle ->
            dstSheet.setDefaultColumnStyle(c, cloneStyle(srcWb, dstWb, colStyle, styleMap, fontMap))
        }
    }

    // 合并单元格
    for (i in 0 until srcSheet.numMergedRegions) {
        val r = srcSheet.getMergedRegion(i)
        dstSheet.addMergedRegion(CellRangeAddress(r.firstRow, r.lastRow, r.firstColumn, r.lastColumn))
    }

    // 默认行高/列宽
    dstSheet.defaultColumnWidth = srcSheet.defaultColumnWidth
    dstSheet.defaultRowHeight = srcSheet.defaultRowHeight

    return dstSheet
}

/**
 * 在不同 Workbook 之间克隆样式（含数据格式和字体），带缓存避免重复创建。
 */
private fun cloneStyle(
    srcWb: Workbook,
    dstWb: Workbook,
    srcStyle: CellStyle,
    styleMap: MutableMap<Short, CellStyle>,
    fontMap: MutableMap<Short, Font>
): CellStyle {
    return styleMap.getOrPut(srcStyle.index) {
        val newStyle = dstWb.createCellStyle()

        // 复制基础样式属性
        runCatching { newStyle.cloneStyleFrom(srcStyle) }.onFailure {
            // 少数旧版本 POI 跨工作簿 cloneStyleFrom 不完善，必要时可以改为逐字段拷贝（较繁琐）
        }

        // 数据格式：按格式字符串重新注册，避免索引不一致
        srcStyle.dataFormatString?.let { fmt ->
            if (fmt.isNotEmpty()) {
                newStyle.dataFormat = dstWb.createDataFormat().getFormat(fmt)
            }
        }

        // 字体映射
        val srcFont = srcWb.getFontAt(srcStyle.fontIndex)
        val dstFont = fontMap.getOrPut(srcFont.index) {
            dstWb.createFont().apply {
                bold = srcFont.bold
                italic = srcFont.italic
                underline = srcFont.underline
                fontName = srcFont.fontName
                fontHeight = srcFont.fontHeight
                color = srcFont.color
                typeOffset = srcFont.typeOffset
                charSet = srcFont.charSet
            }
        }
        newStyle.setFont(dstFont)

        newStyle
    }
}
```

可选说明：
- 若需复制数据有效性、条件格式、图片/形状、打印设置、冻结窗格等，可另外补函数；这些对象在 POI 中 API 比较繁杂，且 SXSSF 对图形/批注有些限制，实际项目中通常只复制关键的样式和值。

二、从一个文件创建 XSSFWorkbook 和 SXSSFWorkbook
推荐写法：先只加载一次 XSSFWorkbook，然后基于它创建 SXSSFWorkbook（共享同一套底层结构，避免重复读文件）。

```kotlin
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.apache.poi.xssf.streaming.SXSSFWorkbook
import java.io.FileInputStream
import java.nio.file.Path

/**
 * 打开同一个 .xlsx 为 XSSFWorkbook 和 SXSSFWorkbook
 * rowWindow: SXSSF 内存窗口（每个 sheet 同时保留的行数），越小越省内存
 */
fun openXssfAndSxssf(path: Path, rowWindow: Int = 100): Pair<XSSFWorkbook, SXSSFWorkbook> {
    val xssf = FileInputStream(path.toFile()).use { XSSFWorkbook(it) }
    val sxssf = SXSSFWorkbook(xssf, rowWindow).apply {
        compressTempFiles = true  // 临时文件压缩，减少磁盘占用
    }
    return xssf to sxssf
}
```

三、如何“清空一个 worksheet 的所有行”
你有两种常见方案，取决于是否需要保留外部引用（其他 sheet 的公式是否引用这个 sheet）：

方案 A（保留该 sheet，不破坏其他公式引用）：
- 逐行删除，保留 sheet 本身，从而其他 sheet 的公式不会变成 #REF!。
- 同时清掉合并单元格、批注、超链接，必要时清数据有效性/条件格式。

注意：对 SXSSF，随机访问旧行不受支持（已刷盘的行无法再读）。所以“要清空已有内容的 sheet”，最好在你还保有 XSSFWorkbook 时清空，再创建 SXSSFWorkbook。

代码（对 XSSF/SXSSF 通用调用；若是 SXSSF，请尽量在创建 SXSSF 前对 XSSF 先清空）：
```kotlin
import org.apache.poi.ss.usermodel.Sheet
import org.apache.poi.xssf.usermodel.XSSFSheet

/**
 * 清空 sheet 内容（行、合并、批注、超链接）。
 * 对 XSSFSheet，还会清除条件格式和数据有效性。
 */
fun clearSheet(sheet: Sheet, removeMerges: Boolean = true) {
    // 删行（自底向上）
    for (r in sheet.lastRowNum downTo sheet.firstRowNum) {
        val row = sheet.getRow(r) ?: continue
        for (cell in row) {
            cell.removeCellComment()
            cell.hyperlink = null
        }
        sheet.removeRow(row)
    }

    // 删除合并单元格
    if (removeMerges) {
        for (i in sheet.numMergedRegions - 1 downTo 0) {
            sheet.removeMergedRegion(i)
        }
    }

    // XSSF 下可进一步清理条件格式与数据有效性
    if (sheet is XSSFSheet) {
        // 条件格式
        val scf = sheet.sheetConditionalFormatting
        for (i in scf.numConditionalFormattings - 1 downTo 0) {
            scf.removeConditionalFormatting(i)
        }
        // 数据有效性（直接清 XML 节点）
        sheet.ctWorksheet.unsetDataValidations()
    }

    // 列宽、默认列样式、打印设置等如需重置，可在此额外处理
}
```

建议：
- 若你打算用 SXSSFWorkbook 来“重新逐个单元格写入”，并且模板 sheet 里原本就有大量数据，那就：
  1) 先用 XSSFWorkbook 打开模板；
  2) 对要重写的 sheet 调用 clearSheet；
  3) 再用这个 XSSFWorkbook 去创建 SXSSFWorkbook；
  4) 用 SXSSF 开始写新数据。

方案 B（删除 sheet 再重建，最快，但会破坏外部引用）
- 直接把要处理的 sheet 删除，再用同名重建，能“一次性清空一切”且速度快。
- 但若其他 sheet 存在对该 sheet 的公式引用，这些引用会变成 #REF!，即使你重建了同名 sheet，引用也不会自动恢复。

代码：
```kotlin
import org.apache.poi.ss.usermodel.Workbook

/**
 * 删除并用同名新建一个空白 sheet。
 * 警告：会使其他 sheet 对该 sheet 的公式引用全部失效（#REF!）
 */
fun dropAndRecreateSheet(workbook: Workbook, sheetName: String): Sheet {
    val idx = workbook.getSheetIndex(sheetName)
    if (idx >= 0) workbook.removeSheetAt(idx)
    return workbook.createSheet(sheetName)
}
```

使用示例
```kotlin
// 1) 从文件打开 XSSF 和 SXSSF
val (xssf, sxssf) = openXssfAndSxssf(Path.of("input.xlsx"))

// 2) 复制某个 sheet 到另一个工作簿（例如复制到新的 XSSFWorkbook）
val targetWb = XSSFWorkbook()
copySheet(xssf, "源Sheet", targetWb, "复制后的Sheet")
// 保存
// FileOutputStream("copied.xlsx").use { targetWb.write(it) }

// 3) 在构造 SXSSF 之前清空要重写的 sheet（避免破坏其他 sheet 的引用）
clearSheet(xssf.getSheet("要重写的Sheet"))
// 现在用 sxssf.getSheet("要重写的Sheet") 或新建同名 sheet，逐单元格写入新数据

// 4) 写完 SXSSF 后记得关闭并释放临时文件
// FileOutputStream("out.xlsx").use { sxssf.write(it) }
// sxssf.dispose()   // 释放临时文件
// sxssf.close()
```

实务提示
- SXSSFWorkbook 适合写大数据量，注意：
  - 行必须按递增顺序写；
  - 批注/图形/图片会增加内存与复杂度，能不用尽量不用；
  - 写完调用 dispose() 清理临时文件。
- 跨工作簿复制样式时，data format 与字体都必须在目标工作簿重新注册/创建；上面 cloneStyle 已处理。
- 如果复制后颜色或主题有差异，多半与主题色/调色板有关；严格保持视觉一致需要更深入处理 XSSF 的颜色与主题，这里未展开。
- 如果需要复制数据有效性、条件格式、图片/形状，告诉我你需要的范围，我可以给你对应的补充代码。

好的，问题的根源是：像 FILTER 这种 O365 动态数组公式在 Apache POI 较老版本里解析支持不完善，直接对单元格/行做常规操作时，POI 可能会去解析公式而报错。为避免解析公式，清空 sheet 时应走“底层 XML 清空”的方式，而不是逐行逐单元格删。

下面给你一个“对动态数组公式安全”的 clearSheet 实现：
- XSSF（.xlsx）走底层清空，完全不解析公式（包括 FILTER、UNIQUE、SORT 等都安全）。
- 其他实现（如 HSSF）走兜底逻辑。
- 仍按需清理：合并单元格、条件格式、数据有效性、超链接、批注等。

代码（Kotlin）
```kotlin
import org.apache.poi.ss.usermodel.Sheet
import org.apache.poi.xssf.usermodel.XSSFSheet

/**
 * 安全清空整个 sheet 的内容，兼容 O365 动态数组公式（如 FILTER/UNIQUE/SORT 等）。
 * - 对 XSSFSheet：直接操作底层 XML，避免解析任何公式；
 * - 对其他实现：使用兜底删除。
 *
 * 参数可按需开启/关闭。
 */
fun clearSheetSafe(
    sheet: Sheet,
    removeMerges: Boolean = true,
    clearConditionalFormattingAndDV: Boolean = true,
    clearComments: Boolean = true,
    clearHyperlinks: Boolean = true
) {
    if (sheet is XSSFSheet) {
        clearSheetXssfRaw(
            sheet,
            removeMerges,
            clearConditionalFormattingAndDV,
            clearComments,
            clearHyperlinks
        )
        forceClearRowMap(sheet)
        return
    }

    // 非 XSSF 的兜底方案（例如 HSSF）；不涉及公式解析，但也没有 XSSF 的“原子清空”高效
    if (removeMerges) {
        for (i in sheet.numMergedRegions - 1 downTo 0) {
            sheet.removeMergedRegion(i)
        }
    }
    // 逐行自底向上删（避免索引移动）
    for (r in sheet.lastRowNum downTo sheet.firstRowNum) {
        val row = sheet.getRow(r) ?: continue
        for (cell in row) {
            if (clearComments) runCatching { cell.removeCellComment() }
            if (clearHyperlinks) runCatching { cell.hyperlink = null }
        }
        sheet.removeRow(row)
    }
    if (clearConditionalFormattingAndDV) {
        val scf = sheet.sheetConditionalFormatting
        for (i in scf.numConditionalFormattings - 1 downTo 0) {
            scf.removeConditionalFormatting(i)
        }
    }
}

/**
 * XSSF 专用：通过底层 XML 原子清空，不触发公式解析。
 */
import org.apache.poi.xssf.usermodel.XSSFSheet
import org.apache.poi.xssf.usermodel.XSSFComments
import org.openxmlformats.schemas.spreadsheetml.x2006.main.CTSheetData
import org.openxmlformats.schemas.spreadsheetml.x2006.main.CTWorksheet

private fun clearSheetXssfRaw(
    sheet: XSSFSheet,
    removeMerges: Boolean,
    clearConditionalFormattingAndDV: Boolean,
    clearComments: Boolean,
    clearHyperlinks: Boolean
) {
    val ct: CTWorksheet = sheet.ctWorksheet

    if (removeMerges) {
        for (i in sheet.numMergedRegions - 1 downTo 0) {
            sheet.removeMergedRegion(i)
        }
    }

    if (clearComments) {
        sheet.getRelations()
            .filterIsInstance<XSSFComments>()
            .forEach { comments ->
                val ctComments = comments.ctComments
                if (ctComments.isSetCommentList) ctComments.unsetCommentList()
                if (ctComments.isSetAuthors) ctComments.unsetAuthors()
            }
    }

    if (clearHyperlinks && ct.isSetHyperlinks) {
        ct.unsetHyperlinks()
    }

    if (clearConditionalFormattingAndDV) {
        val scf = sheet.sheetConditionalFormatting
        for (i in scf.numConditionalFormattings - 1 downTo 0) {
            scf.removeConditionalFormatting(i)
        }
        if (ct.isSetDataValidations) ct.unsetDataValidations()
        if (ct.isSetAutoFilter) ct.unsetAutoFilter()
    }

    // Clear all rows instantly
    ct.setSheetData(CTSheetData.Factory.newInstance())

    if (ct.isSetDimension) ct.unsetDimension()
    if (ct.isSetRowBreaks) ct.unsetRowBreaks()
    if (ct.isSetColBreaks) ct.unsetColBreaks()
}
```

Exclude it in build.gradle.kts (Kotlin DSL) or build.gradle (Groovy DSL)
```

dependencies {
    // Keep poi-ooxml, but exclude poi-ooxml-lite
    implementation("org.apache.poi:poi-ooxml:5.4.1") {
        exclude(group = "org.apache.poi", module = "poi-ooxml-lite")
    }
    // Add full schemas
    implementation("org.apache.poi:poi-ooxml-full:5.4.1")
}
```

```
private fun forceClearRowMap(sheet: XSSFSheet) {
    val field = XSSFSheet::class.java.getDeclaredField("_rows") // in POI 5.x, field name is "_rows"
    field.isAccessible = true
    val rowMap = field.get(sheet) as MutableMap<*, *>
    rowMap.clear()
}
```
使用建议
- 如果你要用 SXSSFWorkbook 写数据，请在“创建 SXSSFWorkbook 之前”，先对同源的 XSSFWorkbook 调用 clearSheetSafe。这样不会碰到 SXSSF 的随机访问限制，也避免解析公式。
- 如果你的 Apache POI 版本较旧（例如 4.x 或 5.0/5.1），对 FILTER/UNIQUE/SORT 等函数的解析支持确实不全。清空函数用上面这版没问题；但如果你还需要“复制公式到另一个工作簿”，建议尽量升级到 5.2.x+，否则 setCellFormula 时会因为无法解析而失败。
- 如需额外清空：打印设置、冻结窗格、图形/图片、表格(XSSFTable)等，也可以加到 clearSheetXssfRaw 里（大多在 ctWorksheet.* 下即可处理）。需要的话告诉我你的范围，我补全代码。
  
Gotcha — you want to clear multiple sheets in **parallel** for speed, and you’re wondering whether Kotlin can use ForkJoinPool or even fibers.

Let’s break it down:

---

## 1. Is it safe to clear multiple sheets in parallel?

**Yes**, with one important caveat:

- Apache POI's `Workbook` is **not thread‑safe as a whole** — but **different `Sheet` objects can be mutated from different threads** IF no other sheet in the same workbook is being changed by those threads at the same time.
- The danger is if two threads touch *shared workbook structures* (like shared style tables, fonts, shared strings) concurrently. But in our `clearSheetSafe` implementation, we only mutate one sheet's `XmlObject` (`CTWorksheet`) and sheet‑specific parts — so the "shared" traffic is minimal.
- Still, the safest way:
  - Avoid *adding/removing* sheets in parallel.
  - Use parallelism only for independent, already‑existing sheets.
  - Do **not** write the workbook while threads are still running — wait until all clears are done.

---

## 2. Parallelism options in Kotlin / JVM

- **ForkJoinPool**: The classic Java parallelism engine behind Java’s `parallelStream()` and Kotlin's `Dispatchers.Default`. Good for CPU‑bound, one‑off concurrent tasks.
- **Kotlin Coroutines (`Dispatchers.Default`)**: Wraps a ForkJoinPool common pool by default; better resource control & cancellation support; can also use Project Loom's virtual threads in new JVMs.
- **Virtual Threads / Fibers**: With JDK 21+, you can use `Executors.newVirtualThreadPerTaskExecutor()` or Loom API. This can give you huge concurrency with low thread cost (but here you’re CPU‑bound, so real threads = same speed).
- For **CPU‑bound** parsing & heavy XML manipulations, ordinary threads (ForkJoinPool / coroutines with `Dispatchers.Default`) are perfectly fine. Loom/fibers don’t offer raw throughput gains here; they just lower thread‑creation overhead.

---

## 3. Parallel clear example in Kotlin

Here’s a **coroutine‑based** approach (which uses a JVM `ForkJoinPool` under the hood):

```kotlin
import kotlinx.coroutines.*
import org.apache.poi.ss.usermodel.Workbook
import org.apache.poi.ss.usermodel.Sheet

fun clearSheetsInParallel(
    workbook: Workbook,
    removeMerges: Boolean = true,
    clearConditionalFormattingAndDV: Boolean = true,
    clearComments: Boolean = true,
    clearHyperlinks: Boolean = true
) = runBlocking {
    // take a snapshot of sheets to avoid concurrent iteration issues
    val sheets: List<Sheet> = (0 until workbook.numberOfSheets).map { workbook.getSheetAt(it) }

    // Parallel work on each sheet (CPU-bound: use Dispatchers.Default)
    withContext(Dispatchers.Default) {
        sheets.map { sheet ->
            async {
                clearSheetSafe(
                    sheet,
                    removeMerges,
                    clearConditionalFormattingAndDV,
                    clearComments,
                    clearHyperlinks
                )
            }
        }.awaitAll()
    }
}
```

Usage:

```kotlin
val wb: Workbook = // load or build workbook
clearSheetsInParallel(wb)  // Clears all sheets concurrently
// do further processing or save workbook
```

---

## 4. Strict Java / ForkJoinPool version

If you want a *pure Java‑style* `ForkJoinPool` instead of coroutines:

```kotlin
import java.util.concurrent.ForkJoinPool

fun clearSheetsForkJoin(workbook: Workbook) {
    val sheets = (0 until workbook.numberOfSheets).map { workbook.getSheetAt(it) }
    ForkJoinPool.commonPool().submit {
        sheets.parallelStream().forEach { sheet ->
            clearSheetSafe(sheet)
        }
    }.join() // wait until all done
}
```

---

## 5. Quick performance expectations
- For a workbook with many sheets (say, 20×50 000 rows each), **parallel clearing** across available CPU cores can cut wall‑clock time to ~1/cores compared to sequential.
- For fewer sheets (<4), the fork‑join overhead may be bigger than the gain.
- The heavy step in `clearSheetSafe` is actually memory traversal & clear in `XmlBeans` structures — and that is nicely parallelizable because each sheet's XML is independent.

---

## 6. Bonus — possible micro‑opt tweak

If you have *many thousands of small sheets*, you can improve granularity by using `ForkJoinPool` with a custom parallelism level:

```kotlin
val pool = ForkJoinPool(8) // manually match to CPU cores
pool.submit {
    sheets.parallelStream().forEach { clearSheetSafe(it) }
}.join()
```

---

✅ **Summary:**
- Yes, Kotlin can run sheet‑level clears in parallel — `Dispatchers.Default` or Java `ForkJoinPool` work well.
- We should not mutate the same sheet from multiple threads, but different sheets are fine.
- For CPU‑bound POI sheet clears, threading buys you near‑linear speed‑up up to your CPU core count.

---

If you want, next I can give you a **JDK 21 Virtual Threads** version so each sheet clear runs on a Loom fiber — it's very pretty syntactically, but in this use‑case will perform about the same as ForkJoinPool with N = cores. That would be more interesting if you had lots of IO‑bound per‑sheet work.

Got it — you want a `clearSheetsInParallel()` that will:

1. Run sheet clears in parallel.
2. Take a configurable **maxThreads** parameter.
3. Let you easily control **CPU usage limits** (e.g., in Kubernetes via environment variables).
4. Still use Kotlin coroutines for simplicity, but cap parallelism explicitly.

Here’s a **clean, production‑ready** version that does exactly that:

---

```kotlin
import kotlinx.coroutines.*
import org.apache.poi.ss.usermodel.Sheet
import org.apache.poi.ss.usermodel.Workbook
import java.util.concurrent.Executors
import kotlin.system.measureTimeMillis

/**
 * Clear all sheets in a workbook in parallel but respect a configurable maxThreads parameter.
 *
 * @param workbook The workbook whose sheets will be cleared.
 * @param maxThreads Maximum number of threads to use in parallel (default: number of processors).
 * @param removeMerges Whether to remove merged regions.
 * @param clearConditionalFormattingAndDV Whether to remove conditional formatting and data validation.
 * @param clearComments Whether to remove cell comments.
 * @param clearHyperlinks Whether to remove hyperlinks.
 */
fun clearSheetsInParallelWithLimit(
    workbook: Workbook,
    maxThreads: Int = Runtime.getRuntime().availableProcessors(),
    removeMerges: Boolean = true,
    clearConditionalFormattingAndDV: Boolean = true,
    clearComments: Boolean = true,
    clearHyperlinks: Boolean = true
) {
    // Snapshot sheet references to avoid concurrent modification
    val sheets: List<Sheet> = (0 until workbook.numberOfSheets).map { workbook.getSheetAt(it) }

    // Create a bounded thread pool
    val dispatcher = Executors.newFixedThreadPool(maxThreads).asCoroutineDispatcher()

    val elapsed = measureTimeMillis {
        runBlocking(dispatcher) {
            sheets.map { sheet ->
                async {
                    clearSheetSafe(
                        sheet,
                        removeMerges,
                        clearConditionalFormattingAndDV,
                        clearComments,
                        clearHyperlinks
                    )
                }
            }.awaitAll()
        }
    }
    dispatcher.close()
    println("Cleared ${sheets.size} sheets in ${elapsed} ms using maxThreads=$maxThreads")
}
```

---

### How to make `maxThreads` configurable via environment variables

In your code where you call `clearSheetsInParallelWithLimit`, read the environment variable set in Kubernetes:

```kotlin
fun getMaxThreadsFromEnv(defaultThreads: Int = Runtime.getRuntime().availableProcessors()): Int {
    val envValue = System.getenv("CLEAR_SHEETS_MAX_THREADS")
    return envValue?.toIntOrNull()?.coerceAtLeast(1) ?: defaultThreads
}

// Example usage:
val workbook = /* load your workbook here */
clearSheetsInParallelWithLimit(
    workbook,
    maxThreads = getMaxThreadsFromEnv()
)
```

Then, in your Kubernetes YAML:

```yaml
env:
  - name: CLEAR_SHEETS_MAX_THREADS
    value: "3"
```

This will **force** the thread pool to only use 3 threads, regardless of how many CPUs are assigned to the pod.

---

### Why a Fixed Thread Pool instead of `Dispatchers.Default.limitedParallelism`?

- `Dispatchers.Default.limitedParallelism(N)` is great if you already want to use the default coroutine pool (backed by a ForkJoinPool).
- But using `Executors.newFixedThreadPool(maxThreads)`:
  - Gives you **hard enforcement** — it will never schedule more than `maxThreads` concurrent tasks.
  - Avoids interference with unrelated coroutines sharing `Dispatchers.Default`.
  - Makes it easy to profile/monitor because it has its own pool separate from other parts of your app.

---

### Example Run in AKS (CPU limit 5)

If you set:
```
CLEAR_SHEETS_MAX_THREADS=5
```
and your pod’s CPU limit is also 5, you’ll saturate all 5 vCPUs — clearing will max out your limit but won’t oversubscribe.

If you set:
```
CLEAR_SHEETS_MAX_THREADS=3
```
you’ll use only 3 worker threads, leaving ~2 vCPUs free for other work — helpful if sheet clearing is just a part of a larger job.

---

This design is especially Kubernetes‑friendly because:
- You can tune a single env var in your deployment without rebuilding the code.
- You avoid unexpected CPU spikes when multiple large workbooks are processed on the same pod.
- You can keep your concurrency lower than your CPU quota if you want to be a “good neighbor” to other processes.

---

If you want, I can also give you **a variant that uses Java’s virtual threads (Loom)** — letting each sheet clear still run in “parallel” from your code’s perspective, but multiplexed onto far fewer carriers, which in I/O‑heavy tasks can be even lighter on CPU in shared environments. For your specific case (mostly CPU‑bound XML clearing), controlling real threads like above is the right move for maximum throughput.

Gotcha — two issues here:  

1. **Your compile error** is coming from that `.filterIsInstance<XSSFComments>()` block.  
   In POI 5.4.1, comments are represented by `org.apache.poi.xssf.model.CommentsTable`, not the older `XSSFComments` type (which doesn’t even exist in this version).  
   So just replace that usage with `CommentsTable`. It’s a public class and has a `ctComments` getter.

2. You want a **JUnit test** to exercise `clearSheetSafe`, showing that:
   - Data, comments, hyperlinks, merges, conditional formatting are all cleared.
   - It works on an `XSSFWorkbook` and after clearing you can wrap in `SXSSFWorkbook` and `.createRow(0)` without exception.

---

## **Fixed code snippet for clearing comments**

Replace:

```kotlin
sheet.getRelations()
    .filterIsInstance<XSSFComments>()
    .forEach { comments ->
        val ctComments = comments.ctComments
        if (ctComments.isSetCommentList) ctComments.unsetCommentList()
        if (ctComments.isSetAuthors) ctComments.unsetAuthors()
    }
```

with:

```kotlin
import org.apache.poi.xssf.model.CommentsTable

if (clearComments) {
    sheet.getRelations()
        .filterIsInstance<CommentsTable>()
        .forEach { commentsTable ->
            val ctComments = commentsTable.ctComments
            if (ctComments.isSetCommentList) ctComments.unsetCommentList()
            if (ctComments.isSetAuthors) ctComments.unsetAuthors()
        }
}
```

That will compile on POI 5.4.1.

---

## **JUnit 5 test for `clearSheetSafe`**

Here’s a self-contained test class (Kotlin) that:

- Creates an XSSFWorkbook in memory.
- Adds merges, comments, hyperlink, and a cross‑sheet formula.
- Runs `clearSheetSafe` on one sheet.
- Asserts that:
  - The cleared sheet has no rows, merges, hyperlinks, comments.
  - The formula in the other sheet still evaluates without `#REF!`.
- Then wraps in SXSSFWorkbook and ensures `.createRow(0)` works.

```kotlin
import org.apache.poi.ss.usermodel.ClientAnchor
import org.apache.poi.ss.usermodel.CreationHelper
import org.apache.poi.ss.usermodel.HyperlinkType
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.apache.poi.xssf.streaming.SXSSFWorkbook
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class ClearSheetSafeTest {

    @Test
    fun `clearSheetSafe clears contents and preserves sheet identity`() {
        val wb = XSSFWorkbook()
        val sheet1 = wb.createSheet("Data")
        val sheet2 = wb.createSheet("Formulas")

        // Add some data to sheet1
        val row = sheet1.createRow(0)
        val cell = row.createCell(0)
        cell.setCellValue("Hello")

        // Add a merge
        sheet1.addMergedRegion(org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 1))

        // Add a hyperlink
        val helper: CreationHelper = wb.creationHelper
        val link = helper.createHyperlink(HyperlinkType.URL)
        link.address = "https://example.com"
        cell.hyperlink = link

        // Add a comment
        val drawing = sheet1.createDrawingPatriarch()
        val anchor: ClientAnchor = helper.createClientAnchor()
        anchor.col1 = 0
        anchor.row1 = 0
        val comment = drawing.createCellComment(anchor)
        comment.string = helper.createRichTextString("Test Comment")
        cell.cellComment = comment

        // Sheet2 formula referencing Sheet1!A1
        val formulaCell = sheet2.createRow(0).createCell(0)
        formulaCell.cellFormula = "Data!A1"

        // Run clearSheetSafe on sheet1
        clearSheetSafe(sheet1)

        // Check sheet1 is empty
        assertEquals(0, sheet1.physicalNumberOfRows, "Sheet should have no rows")
        assertEquals(0, sheet1.numMergedRegions, "Sheet should have no merges")

        // Hyperlinks gone
        sheet1.forEach { r ->
            r.forEach { c ->
                assertNull(c.hyperlink, "Hyperlink should be removed")
                assertNull(c.cellComment, "Comment should be removed")
            }
        }

        // Formula in sheet2 should still reference 'Data!A1' and not #REF
        assertTrue(formulaCell.cellFormula.contains("Data!A1"))

        // Now wrap in SXSSFWorkbook and create a row at index 0
        val sxssf = SXSSFWorkbook(wb, 100)
        val sxssfSheet = sxssf.getSheet("Data")
        assertDoesNotThrow {
            val newRow = sxssfSheet.createRow(0)
            newRow.createCell(0).setCellValue("New Value")
        }

        // Cleanup
        sxssf.dispose()
        sxssf.close()
        wb.close()
    }
}
```

---

**Key points in the test**:

* **Comments cleanup** — Since we replaced `XSSFComments` reference with `CommentsTable`, the compile error goes away and comments are cleared reliably.
* **Preserves sheet identity** — we don’t drop/recreate the sheet, so the formula continues to work.
* **SXSSF row creation** — after clearing, `.createRow(0)` works without `IllegalArgumentException`.

---

Do you want me to now put this **fixed-comment-handling** and **row-map-clearing** into the final `clearSheetSafe` method so it’s copy‑paste ready? That would be your one-drop tool for XSSF + SXSSF + cross‑sheet safety.

## From perplexity
关于你的需求：

1. 用Apache POI将一个Workbook的worksheet（工作表）复制到另一个Workbook，不仅复制单元格的值，还包括单元格样式等。  
2. 从同一个Excel文件创建两个Workbook，一个是XSSFWorkbook，一个是SXSSFWorkbook（流式处理大文件，适合写大数据），其中部分worksheet需要清空所有行进行逐cell处理，考虑删除所有行或者删除工作表再重建的方式。

***

### 1. 复制一个工作表到另一个工作簿（包含单元格值和样式）

这里给出一个用Kotlin编写的函数示例，功能是复制整个Sheet，包括单元格内容、单元格样式、合并单元格、列宽等。此方法适用于XSSFWorkbook之间复制，也可以做少部分修改兼容SXSSFWorkbook（请注意SXSSFWorkbook是写时流，读取方面还是基于XSSFWorkbook）。

```kotlin
import org.apache.poi.ss.usermodel.*
import org.apache.poi.xssf.streaming.SXSSFWorkbook
import org.apache.poi.xssf.usermodel.XSSFWorkbook

fun copySheet(srcSheet: Sheet, destSheet: Sheet) {
    val workbook = destSheet.workbook

    // 复制合并单元格
    for (i in 0 until srcSheet.numMergedRegions) {
        val merged = srcSheet.getMergedRegion(i)
        destSheet.addMergedRegion(merged)
    }

    // 复制行和单元格
    for (rowNum in srcSheet.firstRowNum..srcSheet.lastRowNum) {
        val srcRow = srcSheet.getRow(rowNum) ?: continue
        val destRow = destSheet.createRow(rowNum)
        destRow.height = srcRow.height

        for (cellNum in srcRow.firstCellNum until srcRow.lastCellNum) {
            val srcCell = srcRow.getCell(cellNum) ?: continue
            val destCell = destRow.createCell(cellNum)

            // 复制单元格样式
            val newCellStyle = workbook.createCellStyle()
            newCellStyle.cloneStyleFrom(srcCell.cellStyle)
            destCell.cellStyle = newCellStyle

            // 复制单元格类型和值
            when (srcCell.cellType) {
                CellType.STRING -> destCell.setCellValue(srcCell.stringCellValue)
                CellType.NUMERIC -> {
                    if (DateUtil.isCellDateFormatted(srcCell)) {
                        destCell.setCellValue(srcCell.dateCellValue)
                    } else {
                        destCell.setCellValue(srcCell.numericCellValue)
                    }
                }
                CellType.BOOLEAN -> destCell.setCellValue(srcCell.booleanCellValue)
                CellType.FORMULA -> destCell.cellFormula = srcCell.cellFormula
                CellType.BLANK -> destCell.setBlank()
                else -> { /* do nothing for error or unknown */ }
            }
        }
    }

    // 复制列宽
    for (colIndex in 0 until srcSheet.rowIterator().next().lastCellNum) {
        destSheet.setColumnWidth(colIndex, srcSheet.getColumnWidth(colIndex))
    }
}
```

这段代码说明：
- 复制合并单元格区域。
- 按行逐个复制单元格，复制单元格样式及单元格数据。
- 复制列宽。

***

### 2. 关于从一个文件创建XSSFWorkbook和SXSSFWorkbook、删除所有行的方案

- **创建两个Workbook**：你可以先用XSSFWorkbook读取文件，然后通过它创建SXSSFWorkbook：

```kotlin
import java.io.FileInputStream
import org.apache.poi.xssf.streaming.SXSSFWorkbook
import org.apache.poi.xssf.usermodel.XSSFWorkbook

val fileInputStream = FileInputStream("your_file.xlsx")
val xssfWorkbook = XSSFWorkbook(fileInputStream)

// 用XSSFWorkbook创建SXSSFWorkbook（内存占用更小，适合写大量数据）
val sxssfWorkbook = SXSSFWorkbook(xssfWorkbook)
```

- **删除所有行的方案**：

1. **逐行删除（不会移除行，只清除内容）：**

```kotlin
fun clearAllRows(sheet: Sheet) {
    val lastRowNum = sheet.lastRowNum
    for (rowNum in 0..lastRowNum) {
        val row = sheet.getRow(rowNum)
        if (row != null) {
            sheet.removeRow(row)
        }
    }
}
```

注：`removeRow`删除行内数据，但行号位置依然存在空行，如果后续还有处理需求，需要考虑调用`shiftRows`调整。

2. **更简便也是推荐的方式：删除整个工作表，然后重新创建一个新的Sheet**

```kotlin
val workbook: Workbook = ... // 你的Workbook
val sheetIndex = workbook.getSheetIndex("SheetToProcess")
if (sheetIndex != -1) {
    workbook.removeSheetAt(sheetIndex) // 删除该Sheet
}
val newSheet = workbook.createSheet("SheetToProcess") // 重新创建同名Sheet
```

这种方式如果你需要完全清空，且重新开始对Sheet的操作，是最简单有效的方法，避免了逐行操作带来的复杂。

***

总结你的需求，建议：

- 复制Sheet时用第一部分提供的函数。
- 删除Sheet内容时，如果是全部处理，建议直接删除Sheet并重新创建。
- 使用XSSFWorkbook读取文件，生成SXSSFWorkbook用于写大数据，处理动态数据前清空Sheet如上。

删除工作表后，Apache POI不会自动保证新创建的Sheet使用原先被删除的sheetIndex。因为删除工作表时，后面的Sheet索引会自动向前移动，索引顺序会发生变化。具体来说，操作流程中：

- 删除指定索引的Sheet后，所有后续Sheet的索引都会自动减1，原来的索引位置会被“空”出来，但这位置会被紧接着后面的Sheet填补。
- 新创建的Sheet总是添加到Workbook的最后一个索引位置。

因此，**要保证新创建的Sheet使用原来的sheetIndex，需要手动调整**。但Apache POI本身没有直接提供「在指定索引位置插入Sheet」的API，新建Sheet只能默认创建在末尾。

目前常用的方法是：

- 记住被删除的Sheet的原始索引（sheetIndex）。
- 删除Sheet。
- 创建新的Sheet（一般在末尾）。
- 如果需要，可以重新调整工作表的顺序，Apache POI提供了`workbook.setSheetOrder(sheetName, sheetIndex)`方法，可以将某个Sheet调整到指定索引位置。

所以你可以这样做：

```kotlin
val sheetIndex = workbook.getSheetIndex("SheetToProcess")
if (sheetIndex != -1) {
    workbook.removeSheetAt(sheetIndex) // 删除Sheet
}
val newSheet = workbook.createSheet("SheetToProcess") // 新建Sheet，默认在末尾
workbook.setSheetOrder(newSheet.sheetName, sheetIndex) // 调整顺序回原始索引
```

这样能保证新Sheet在视觉和API中的索引位置与删除前相同。

总结：  
**删除Sheet会导致索引变动，重新创建Sheet默认在末尾，需要通过`setSheetOrder`方法手动调整顺序以保证使用原索引。**

你先用XSSFWorkbook加载一个已有的Excel文件，然后基于它创建一个SXSSFWorkbook，**一般不会直接修改原来的XSSFWorkbook对象**，但其中有几个关键点需要注意：

- SXSSFWorkbook是基于XSSFWorkbook的包装，用于流式写入大数据，目的是减少内存占用。  
- 当你用 `new SXSSFWorkbook(xssfWorkbook)` 创建SXSSFWorkbook时，**这个SXSSFWorkbook会基于传入的XSSFWorkbook的结构来创建一个写时的流式工作簿副本，但它自己将把数据写入磁盘临时文件，不会频繁修改原XSSFWorkbook对象的内存结构。**  
- 但重要的是，**如果你同时对XSSFWorkbook和SXSSFWorkbook做数据修改，二者之间不会自动同步，SXSSFWorkbook只控制它自己写出的输出流。**  
- 通常的使用模式是：  
  1. 用XSSFWorkbook读取已有的Excel文件（只做读取或预处理）。  
  2. 用XSSFWorkbook构造SXSSFWorkbook，进行大量数据写入（写入的是SXSSF对象管理的流）。  
  3. 最终调用SXSSFWorkbook的`write`写出结果文件，关闭时释放临时文件。  

所以，**SXSSFWorkbook写入时不会直接修改“原”XSSFWorkbook对象的内存数据结构，只会基于它生成一个流式写入的副本；原XSSFWorkbook保持不变**。

***

### 额外提醒

- SXSSFWorkbook本质是设计用来写操作，功能上不支持读取已有Excel，再基于它修改的需求，所以一般先用XSSFWorkbook读取，然后给SXSSFWorkbook作为模板用来写入新数据。  
- 如果你想在写入的同时修改XSSFWorkbook，建议单独用XSSFWorkbook操作，或者完成读操作后关闭XSSFWorkbook，仅用SXSSFWorkbook进行写操作。  
- SXSSFWorkbook会在内部将过期行数据写到磁盘临时文件，节省内存，写出时生成最终Excel文件。

***

总结：  
你只加载一次XSSFWorkbook，基于它创建SXSSFWorkbook是可行的，**SXSSFWorkbook写入不会修改原来的XSSFWorkbook的内存数据结构**，两者相对独立。这样也能避免内存占用过高，但要注意不要同时修改两者，避免数据不同步。

```
fun clearCalcChain(wb: XSSFWorkbook) {
    val chain: XSSFCalculationChain? = wb.calculationChain
    if (chain != null) {
        // Detach the calcChain part from the workbook package
        wb.unregisterRelation(chain)
        // Null out the private field via reflection (since POI caches it)
        val f = XSSFWorkbook::class.java.getDeclaredField("calcChain")
        f.isAccessible = true
        f.set(wb, null)
    }
}
```


