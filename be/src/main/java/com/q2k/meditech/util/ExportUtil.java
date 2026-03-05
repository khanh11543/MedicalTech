package com.q2k.meditech.util;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Function;

/**
 * Utility class for exporting data to CSV and Excel (XLSX) formats.
 * <p>
 * Usage example:
 * <pre>
 * List&lt;ExportColumn&lt;AuditLogDTO&gt;&gt; columns = List.of(
 *     ExportColumn.of("ID", dto -&gt; String.valueOf(dto.getId())),
 *     ExportColumn.of("Action", AuditLogDTO::getAction),
 *     ExportColumn.of("Date", dto -&gt; dto.getCreatedAt().toString())
 * );
 * byte[] csv = ExportUtil.toCsv(columns, dataList);
 * byte[] xlsx = ExportUtil.toExcel(columns, dataList, "Audit Logs");
 * </pre>
 */
@Slf4j
public final class ExportUtil {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private ExportUtil() {
        // Utility class — no instantiation
    }

    /**
     * Column definition for export operations.
     *
     * @param <T> the type of data row
     */
    @Data
    @Builder
    public static class ExportColumn<T> {
        private String header;
        private Function<T, String> extractor;

        /**
         * Factory method for creating a column definition.
         *
         * @param header    the column header text
         * @param extractor function to extract the cell value from a data row
         * @param <T>       the type of data row
         * @return new ExportColumn
         */
        public static <T> ExportColumn<T> of(String header, Function<T, String> extractor) {
            return ExportColumn.<T>builder()
                    .header(header)
                    .extractor(extractor)
                    .build();
        }
    }

    // ===================== CSV =====================

    /**
     * Export data to CSV format (UTF-8 with BOM for Excel compatibility).
     *
     * @param columns column definitions
     * @param data    list of data rows
     * @param <T>     the type of data row
     * @return CSV content as byte array
     */
    public static <T> byte[] toCsv(List<ExportColumn<T>> columns, List<T> data) {
        StringBuilder sb = new StringBuilder();

        // UTF-8 BOM for Excel compatibility
        sb.append('\uFEFF');

        // Header row
        for (int i = 0; i < columns.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(escapeCsv(columns.get(i).getHeader()));
        }
        sb.append('\n');

        // Data rows
        for (T row : data) {
            for (int i = 0; i < columns.size(); i++) {
                if (i > 0) sb.append(',');
                String value = safeExtract(columns.get(i), row);
                sb.append(escapeCsv(value));
            }
            sb.append('\n');
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    /**
     * Escape a value for CSV: wrap in quotes if it contains comma, quote, or newline.
     */
    private static String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // ===================== Excel (XLSX) =====================

    /**
     * Export data to Excel XLSX format.
     *
     * @param columns   column definitions
     * @param data      list of data rows
     * @param sheetName the name of the worksheet
     * @param <T>       the type of data row
     * @return XLSX content as byte array
     * @throws IOException if writing fails
     */
    public static <T> byte[] toExcel(List<ExportColumn<T>> columns, List<T> data, String sheetName)
            throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(sheetName != null ? sheetName : "Data");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Data style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setWrapText(true);

            // Header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns.get(i).getHeader());
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            for (int rowIdx = 0; rowIdx < data.size(); rowIdx++) {
                Row row = sheet.createRow(rowIdx + 1);
                T item = data.get(rowIdx);
                for (int colIdx = 0; colIdx < columns.size(); colIdx++) {
                    Cell cell = row.createCell(colIdx);
                    String value = safeExtract(columns.get(colIdx), item);
                    cell.setCellValue(value != null ? value : "");
                    cell.setCellStyle(dataStyle);
                }
            }

            // Auto-size columns (max 50 chars width)
            for (int i = 0; i < columns.size(); i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                int maxWidth = 50 * 256; // 50 characters
                if (currentWidth > maxWidth) {
                    sheet.setColumnWidth(i, maxWidth);
                }
            }

            // Freeze header row
            sheet.createFreezePane(0, 1);

            // Auto-filter
            if (!columns.isEmpty()) {
                sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(
                        0, 0, 0, columns.size() - 1));
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ===================== PDF (iText) =====================

    /**
     * Export data to PDF format using iText.
     *
     * @param columns   column definitions
     * @param data      list of data rows
     * @param title     document title
     * @param <T>       the type of data row
     * @return PDF content as byte array
     * @throws IOException if writing fails
     */
    public static <T> byte[] toPdf(List<ExportColumn<T>> columns, List<T> data, String title)
            throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfDocument pdfDoc =
                    new com.itextpdf.kernel.pdf.PdfDocument(new com.itextpdf.kernel.pdf.PdfWriter(out));
            // Landscape for wide tables
            pdfDoc.setDefaultPageSize(com.itextpdf.kernel.geom.PageSize.A4.rotate());

            com.itextpdf.layout.Document document = new com.itextpdf.layout.Document(pdfDoc);
            document.setMargins(20, 20, 20, 20);

            // Title
            if (title != null && !title.isBlank()) {
                document.add(new com.itextpdf.layout.element.Paragraph(title)
                        .setFontSize(16)
                        .setBold()
                        .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                        .setMarginBottom(10));

                // Timestamp
                document.add(new com.itextpdf.layout.element.Paragraph(
                        "Generated: " + LocalDateTime.now().format(DATETIME_FORMAT))
                        .setFontSize(8)
                        .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.RIGHT)
                        .setMarginBottom(10));
            }

            // Table
            float[] columnWidths = new float[columns.size()];
            java.util.Arrays.fill(columnWidths, 1f);
            com.itextpdf.layout.element.Table table =
                    new com.itextpdf.layout.element.Table(com.itextpdf.layout.properties.UnitValue.createPercentArray(columnWidths))
                            .useAllAvailableWidth();

            // Header cells
            com.itextpdf.layout.borders.Border headerBorder = new com.itextpdf.layout.borders.SolidBorder(
                    com.itextpdf.kernel.colors.ColorConstants.DARK_GRAY, 0.5f);
            for (ExportColumn<T> col : columns) {
                com.itextpdf.layout.element.Cell cell = new com.itextpdf.layout.element.Cell()
                        .add(new com.itextpdf.layout.element.Paragraph(col.getHeader())
                                .setBold()
                                .setFontSize(9))
                        .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(220, 230, 241))
                        .setBorder(headerBorder)
                        .setPadding(4);
                table.addHeaderCell(cell);
            }

            // Data cells
            com.itextpdf.layout.borders.Border dataBorder = new com.itextpdf.layout.borders.SolidBorder(
                    com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY, 0.3f);
            for (int i = 0; i < data.size(); i++) {
                T item = data.get(i);
                com.itextpdf.kernel.colors.Color bgColor = (i % 2 == 0)
                        ? com.itextpdf.kernel.colors.ColorConstants.WHITE
                        : new com.itextpdf.kernel.colors.DeviceRgb(245, 245, 245);
                for (ExportColumn<T> col : columns) {
                    String value = safeExtract(col, item);
                    com.itextpdf.layout.element.Cell cell = new com.itextpdf.layout.element.Cell()
                            .add(new com.itextpdf.layout.element.Paragraph(value != null ? value : "")
                                    .setFontSize(8))
                            .setBackgroundColor(bgColor)
                            .setBorder(dataBorder)
                            .setPadding(3);
                    table.addCell(cell);
                }
            }

            document.add(table);

            // Footer
            document.add(new com.itextpdf.layout.element.Paragraph(
                    "Total records: " + data.size())
                    .setFontSize(8)
                    .setMarginTop(5)
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.LEFT));

            document.close();
            return out.toByteArray();
        }
    }

    // ===================== Helpers =====================

    private static <T> String safeExtract(ExportColumn<T> column, T row) {
        try {
            return column.getExtractor().apply(row);
        } catch (Exception e) {
            log.trace("Failed to extract value for column '{}': {}", column.getHeader(), e.getMessage());
            return "";
        }
    }

    /**
     * Format a LocalDateTime for export display.
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATETIME_FORMAT) : "";
    }

    /**
     * Format a LocalDate for export display.
     */
    public static String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMAT) : "";
    }

    /**
     * Safely convert any object to a string for export.
     */
    public static String safeToString(Object value) {
        return value != null ? value.toString() : "";
    }

    /**
     * Generate a filename with timestamp.
     *
     * @param prefix the file prefix (e.g. "audit_logs")
     * @param extension the file extension (e.g. "csv", "xlsx", "pdf")
     * @return filename like "audit_logs_2026-02-17_143052.csv"
     */
    public static String generateFilename(String prefix, String extension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmmss"));
        return prefix + "_" + timestamp + "." + extension;
    }
}
