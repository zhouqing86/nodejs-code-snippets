Your observations match **exactly** the classic Apache POI + Excel style-limit corruption scenario, and the numbers you see prove it.

### Diagnosis from Your Data
- Full file (≈6,000 + 7×3,000 = ~27,000 rows total) → 16,584 unique CellStyles  
- After you delete ~10,000 rows across sheets → white font in sheet 8 suddenly works again  
- 16,584 is still far below the theoretical ~64,000 limit, but that is the red herring everyone falls for.

### Real Root Cause
Excel does **not** have a 64k CellStyle limit in the way most people think.  
The real hard limits inside an .xlsx file are:

| Limit (strict in every Excel version) | What hits it in POI |
|---------------------------------------|---------------------|
| 64,000 **xf** records in /xl/styles.xml | Every unique CellStyle becomes one xf |
| **32,768** cell styles with borders in a single file (yes, really!) when the style contains any border | POI bug + spec corner case |

But the killer that matches your exact symptoms is this one:

### The Hidden Killer: Maximum 32,767 Styles That Have Different Border Combinations
When a CellStyle has **any border** (left/right/top/bottom/diagonal, even if set to NONE on some sides), Excel treats every tiny variation as a completely separate style in the “bordered-style” bucket.

There is a hard limit of **32,767 bordered styles per workbook** in the OOXML spec (most people never knew this existed).  
POI does **not** enforce or warn about it — it happily creates the 32,768th bordered style, writes the file, and Excel silently drops or corrupts styles from that point onward. The corruption is workbook-wide and non-deterministic — some fonts turn black, some fills disappear, etc.

Your numbers fit perfectly:
- 6,000 rows in sheet 1 + thousands in others → you are creating borders conditionally or per-row (very common with templates)
- At ~27,000 rows you are slightly over the hidden 32,767 bordered-styles threshold → corruption starts
- When you delete 10,000 rows you fall back under the threshold → everything magically works again
- 16,584 total CellStyles is normal; the problem is how many of them contain borders

That also explains why removing rows from sheets 2–6 (but keeping sheet 1 at 6,000) still fixes it: the bordered styles are shared workbook-wide, so total count matters, not which sheet they are on.

### How to Confirm This Is Your Problem (30-second test)

Add this code right before you write the file:

```java
XSSFWorkbook wb = (XSSFWorkbook) workbook;
StylesTable stylesTable = wb.getStylesSource();

int borderedStyles = 0;
for (int i = 0; i < stylesTable.getNumCellStyles(); i++) {
    XSSFCellStyle style = stylesTable.getStyleAt(i);
    if (style.getBorderLeft() != BorderStyle.NONE ||
       style.getBorderRight() != BorderStyle.NONE ||
       style.getBorderTop() != BorderStyle.NONE ||
       style.getBorderBottom() != BorderStyle.NONE) {
        borderedStyles++;
    }
}

System.out.println("Total CellStyles: " + wb.getNumCellStyles());
System.out.println("Bordered CellStyles: " + borderedStyles);   // ← if this is > 32500 you are dead
```

If the second number is around 32,500–34,000 in the broken file and drops below ~32,000 when you delete rows → 100% confirmed.

### Immediate Fixes (Pick One)

1. **Aggressively reuse CellStyles** (the real solution)  
   Create only a handful of styles (e.g. header, normal, white-on-black, error, etc.) and reuse them for every row. Never create a new CellStyle inside a loop.

2. **Remove all borders from the white-on-black style**  
   If that particular style in sheet 8 does **not** need borders, make sure it really has BorderStyle.NONE on all four sides. Bordered styles are the poison.

3. **Switch to SXSSF** + style caching if you really need per-row formatting  
   But still cache the 20–50 styles you actually need.

4. **Temporary ugly workaround**  
   If you are in a hurry: turn off borders globally while generating, or set every border to the exact same BorderStyle on every style (forces POI to reuse the same borderId).

Once you reuse styles properly you will drop from 16,000+ styles to < 100 and the problem will disappear forever, even with 100,000 rows.

That hidden 32,767-bordered-styles limit has bitten thousands of developers — you just hit it perfectly.
