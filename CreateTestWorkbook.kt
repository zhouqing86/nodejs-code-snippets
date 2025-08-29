import org.apache.poi.ss.usermodel.*
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.apache.poi.ss.util.CellRangeAddress
import java.io.FileOutputStream

fun createTestWorkbook(filePath: String) {
    // Create a new workbook
    val workbook = XSSFWorkbook()
    val sheet = workbook.createSheet("Test Sheet")

    // Create styles for formatting
    val font = workbook.createFont().apply {
        color = IndexedColors.BLUE.index
        underline = Font.U_SINGLE
    }
    val hyperlinkStyle = workbook.createCellStyle().apply {
        setFont(font)
    }

    // Add Hyperlink
    val creationHelper = workbook.creationHelper
    val hyperlink = creationHelper.createHyperlink(HyperlinkType.URL)
    hyperlink.address = "https://www.example.com"

    val row1 = sheet.createRow(0)
    val cellA1 = row1.createCell(0)
    cellA1.setCellValue("Click me!")
    cellA1.hyperlink = hyperlink
    cellA1.cellStyle = hyperlinkStyle

    // Add Conditional Formatting
    val sheetCF = sheet.sheetConditionalFormatting
    val cfRule = sheetCF.createConditionalFormattingRule("A2>10")
    val cfPattern = cfRule.createPatternFormatting()
    cfPattern.fillBackgroundColor = IndexedColors.YELLOW.index
    cfPattern.fillPattern = FillPatternType.SOLID_FOREGROUND

    val cfRegions = arrayOf(CellRangeAddress.valueOf("A2:A10"))
    sheetCF.addConditionalFormatting(cfRegions, cfRule)

    // Populate some test data for conditional formatting
    for (i in 2..10) {
        val row = sheet.createRow(i - 1)
        val cell = row.createCell(0)
        cell.setCellValue((i * 2).toDouble())
    }

    // Add Comment
    val drawing = sheet.createDrawingPatriarch()
    val comment = drawing.createCellComment(drawing.createAnchor(0, 0, 0, 0, 2, 2, 6, 5))
    comment.string = creationHelper.createRichTextString("This is a test comment")
    comment.author = "Grok"
    
    val cellC3 = sheet.getRow(2).createCell(2)
    cellC3.setCellValue("Commented Cell")
    cellC3.cellComment = comment

    // Auto-size columns
    (0..2).forEach { sheet.autoSizeColumn(it) }

    // Save the workbook
    FileOutputStream(filePath).use { outputStream ->
        workbook.write(outputStream)
    }
    workbook.close()
}
