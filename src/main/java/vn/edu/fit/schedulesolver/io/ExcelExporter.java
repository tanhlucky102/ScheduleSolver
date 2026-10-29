package vn.edu.fit.schedulesolver.io;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.solver.TimetableMetrics;

/** Xuất TKB ra file Excel: 2 sheet lưới theo mẫu của khoa, thêm sheet "Danh sách" và "Đánh giá". */
public class ExcelExporter {
    // cột D..I là Monday..Saturday, cột J là Tiết BĐ
    private static final int FIRST_DAY_COLUMN = 3;
    private static final int PERIOD_COLUMN = 9;
    private static final float ROW_HEIGHT_POINTS = 39.9f;
    // tên sheet không được chứa dấu "/" nên dùng "-"
    public static final String REGULAR_SHEET = "TKB IT + MME";
    public static final String ADVANCED_SHEET = "TKB CLC - Tiên tiến";

    private final Map<String, CellStyle> sessionStyles = new HashMap<>();

    public void export(File file, Workspace workspace, List<Assignment> assignments,
                       TimetableMetrics metrics, String title) throws IOException {
        sessionStyles.clear();
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle bold = createBoldStyle(workbook);

            writeGrid(workbook, workbook.createSheet(REGULAR_SHEET), workspace, assignments, title,
                    TimetableTemplate.REGULAR);
            writeGrid(workbook, workbook.createSheet(ADVANCED_SHEET), workspace, assignments, title,
                    TimetableTemplate.ADVANCED);
            writeList(workbook.createSheet("Danh sách"), workspace, assignments, bold);
            writeReport(workbook.createSheet("Đánh giá"), metrics, bold);

            try (OutputStream output = new FileOutputStream(file)) {
                workbook.write(output);
            }
        }
    }

    /** Ghi một sheet TKB: cột A tên khối, B buổi, C giờ của ca, D..I các ngày, J Tiết BĐ. */
    private void writeGrid(XSSFWorkbook workbook, Sheet sheet, Workspace workspace, List<Assignment> assignments,
                           String title, int timetable) {
        TimetableTemplate template = new TimetableTemplate(workspace, assignments, timetable);
        CellStyle normal = createStyle(workbook, -1, false, 12, 0, false);
        CellStyle big = createStyle(workbook, -1, true, 14, 0, false);

        sheet.createRow(0).setHeightInPoints(9f);
        Row row1 = sheet.createRow(1);
        setText(row1, FIRST_DAY_COLUMN, "FACULTY OF INFORMATION TECHNOLOGY", normal);
        setText(row1, 7, "VERSION", normal);
        setText(row1, 8, "DATE", normal);
        Row row2 = sheet.createRow(2);
        setText(row2, FIRST_DAY_COLUMN, "T I M E T A B L E   -   " + template.getTitle(), big);
        setText(row2, 7, "DRAFT", normal);
        setText(row2, 8, LocalDate.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")), normal);
        Row row3 = sheet.createRow(3);
        setText(row3, FIRST_DAY_COLUMN, title, normal);
        setText(row3, 7, "D R A F T    V E R S I O N", normal);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 3, 6));
        sheet.addMergedRegion(new CellRangeAddress(2, 2, 3, 6));
        sheet.addMergedRegion(new CellRangeAddress(3, 3, 3, 6));
        sheet.addMergedRegion(new CellRangeAddress(3, 3, 7, 8));

        // dòng 5 là hàng Color code, dòng 6 là tên ngày
        writeColorCodeRow(workbook, sheet, template, 4);
        CellStyle border = createStyle(workbook, 0xFFFFFF, false, 10, 0, false);
        Row days = sheet.createRow(5);
        days.setHeightInPoints(ROW_HEIGHT_POINTS);
        for (int day = 0; day < TimetableTemplate.DAY_NAMES.length; day++) {
            setText(days, FIRST_DAY_COLUMN + day, TimetableTemplate.DAY_NAMES[day], border);
        }
        setText(days, PERIOD_COLUMN, TimetableTemplate.PERIOD_TITLE, border);

        int next = 6;
        for (int block : template.getBlocks()) {
            next = writeBlock(workbook, sheet, template, block, next);
        }

        sheet.setColumnWidth(0, 1126);
        sheet.setColumnWidth(1, 1177);
        sheet.setColumnWidth(2, 3302);
        for (int day = 0; day < TimetableTemplate.DAY_NAMES.length; day++) {
            sheet.setColumnWidth(FIRST_DAY_COLUMN + day, 7498);
        }
        sheet.setColumnWidth(PERIOD_COLUMN, 2918);
    }

    /** Trả về dòng ngay sau khối vừa ghi. */
    private int writeBlock(XSSFWorkbook workbook, Sheet sheet, TimetableTemplate template, int block, int firstRow) {
        CellStyle blockStyle = createStyle(workbook, TimetableTemplate.BLOCK_COLORS[block], true, 10, 0, true);
        CellStyle timeStyle = createStyle(workbook, 0xFFFFFF, false, 10, 0, false);
        CellStyle periodStyle = createStyle(workbook, 0xFFFFFF, true, 18, 0, false);
        CellStyle empty = createStyle(workbook, 0xFFFFFF, false, 10, 0, false);

        int[] slotRows = new int[TimeSlots.SLOTS_PER_DAY + 1];
        slotRows[0] = firstRow;
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            slotRows[slot + 1] = slotRows[slot] + template.getRowCount(block, slot);
        }
        int lastRow = slotRows[TimeSlots.SLOTS_PER_DAY] - 1;

        // tạo đủ ô có viền trước rồi mới gộp, để ô gộp không mất viền
        for (int r = firstRow; r <= lastRow; r++) {
            Row row = sheet.createRow(r);
            row.setHeightInPoints(ROW_HEIGHT_POINTS);
            setText(row, 0, "", blockStyle);
            setText(row, 1, "", blockStyle);
            setText(row, 2, "", timeStyle);
            for (int day = 0; day < TimetableTemplate.DAY_NAMES.length; day++) {
                setText(row, FIRST_DAY_COLUMN + day, "", empty);
            }
            setText(row, PERIOD_COLUMN, "", periodStyle);
        }
        sheet.getRow(firstRow).getCell(0).setCellValue(TimetableTemplate.BLOCK_NAMES[block]);
        sheet.addMergedRegion(new CellRangeAddress(firstRow, lastRow, 0, 0));
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            int top = slotRows[slot];
            int bottom = slotRows[slot + 1] - 1;
            sheet.getRow(top).getCell(2).setCellValue(TimeSlots.slotTime(slot));
            sheet.getRow(top).getCell(PERIOD_COLUMN).setCellValue(TimetableTemplate.startPeriod(slot));
            if (bottom > top) {
                sheet.addMergedRegion(new CellRangeAddress(top, bottom, 2, 2));
                sheet.addMergedRegion(new CellRangeAddress(top, bottom, PERIOD_COLUMN, PERIOD_COLUMN));
            }
            if (slot % 2 == 0) {
                sheet.getRow(top).getCell(1).setCellValue(TimetableTemplate.partOfDay(slot));
                sheet.addMergedRegion(new CellRangeAddress(top, slotRows[slot + 2] - 1, 1, 1));
            }
        }

        for (TimetableTemplate.Cell cell : template.getCells()) {
            if (cell.getBlock() != block) {
                continue;
            }
            PlanSession session = cell.getSession();
            Row row = sheet.getRow(slotRows[cell.getSlot()] + cell.getRow());
            int column = FIRST_DAY_COLUMN + cell.getDay() - TimeSlots.FIRST_DAY;
            int textColor = TimetableTemplate.isMme(session) ? TimetableTemplate.MME_TEXT_COLOR : 0;
            CellStyle style = sessionStyle(workbook, template.fillColor(session.getCohort()), TimetableTemplate.isBold(session),
                    textColor);
            setText(row, column, cell.getTitle() + "\n" + cell.getTeacherCode(), style);
        }
        return lastRow + 1;
    }

    private void writeColorCodeRow(XSSFWorkbook workbook, Sheet sheet, TimetableTemplate template, int rowIndex) {
        Row row = sheet.createRow(rowIndex);
        row.setHeightInPoints(ROW_HEIGHT_POINTS);
        setText(row, 2, "Color code:", createStyle(workbook, 0xFFFFFF, false, 10, 0, false));
        List<String> cohorts = template.getColoredCohorts();
        for (int k = 0; k < cohorts.size(); k++) {
            setText(row, FIRST_DAY_COLUMN + k, cohorts.get(k), sessionStyle(workbook, TimetableTemplate.COHORT_COLORS[k], false, 0));
        }
        int column = FIRST_DAY_COLUMN + cohorts.size();
        setText(row, column, "Black: IT", sessionStyle(workbook, 0xFFFFFF, false, 0));
        // TKB CLC / Tiên tiến không có môn MME
        if (template.getTimetable() == TimetableTemplate.REGULAR) {
            setText(row, column + 1, "Blue: MME", sessionStyle(workbook, 0xFFFFFF, false, 0));
        }
    }

    /** Dùng lại kiểu ô đã tạo vì Excel giới hạn số kiểu ô trong một file. */
    private CellStyle sessionStyle(XSSFWorkbook workbook, int fill, boolean bold, int textColor) {
        String key = fill + "-" + bold + "-" + textColor;
        CellStyle style = sessionStyles.get(key);
        if (style == null) {
            style = createStyle(workbook, fill, bold, 10, textColor, false);
            sessionStyles.put(key, style);
        }
        return style;
    }

    /** Kiểu ô giống mẫu; fill = -1 là không tô nền, không kẻ viền. */
    private CellStyle createStyle(XSSFWorkbook workbook, int fill, boolean bold, int size, int textColor,
                                  boolean vertical) {
        XSSFFont font = workbook.createFont();
        font.setFontName("Times New Roman");
        font.setFontHeightInPoints((short) size);
        font.setBold(bold);
        font.setColor(new XSSFColor(toBytes(textColor), null));
        XSSFCellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        if (vertical) {
            style.setRotation((short) 255);
        }
        if (fill >= 0) {
            style.setFillForegroundColor(new XSSFColor(toBytes(fill), null));
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            style.setBorderTop(BorderStyle.THIN);
            style.setBorderBottom(BorderStyle.THIN);
            style.setBorderLeft(BorderStyle.THIN);
            style.setBorderRight(BorderStyle.THIN);
        }
        return style;
    }

    /** Tách màu 0xRRGGBB thành 3 byte R, G, B. */
    private static byte[] toBytes(int rgb) {
        return new byte[] {(byte) (rgb >> 16), (byte) (rgb >> 8), (byte) rgb};
    }

    private static void setText(Row row, int column, String text, CellStyle style) {
        row.createCell(column).setCellValue(text);
        row.getCell(column).setCellStyle(style);
    }

    private void writeList(Sheet sheet, Workspace workspace, List<Assignment> assignments, CellStyle bold) {
        String[] titles = {"Mã buổi", "Mã môn", "Tên môn", "Chương trình", "Khóa", "Nhóm", "Loại",
            "Số SV", "Giảng viên", "Thứ", "Ca bắt đầu", "Số ca", "Thời gian", "Cố định"};
        Row header = sheet.createRow(0);
        for (int c = 0; c < titles.length; c++) {
            header.createCell(c).setCellValue(titles[c]);
            header.getCell(c).setCellStyle(bold);
        }
        int r = 1;
        for (Assignment assignment : assignments) {
            PlanSession session = workspace.findSession(assignment.getSessionId());
            if (session == null) {
                continue;
            }
            Row row = sheet.createRow(r);
            r++;
            row.createCell(0).setCellValue(session.getId());
            row.createCell(1).setCellValue(session.getCourseCode());
            row.createCell(2).setCellValue(session.getCourseName());
            row.createCell(3).setCellValue(session.getProgram().getDisplayName());
            row.createCell(4).setCellValue(session.getCohort());
            row.createCell(5).setCellValue(session.getGroup());
            row.createCell(6).setCellValue(session.getKind().getLabel());
            row.createCell(7).setCellValue(session.getStudentCount());
            row.createCell(8).setCellValue(assignment.getTeacherCode());
            row.createCell(9).setCellValue(assignment.getDay());
            row.createCell(10).setCellValue(assignment.getStartSlot() + 1);
            row.createCell(11).setCellValue(session.getSlotCount());
            String time = TimeSlots.describe(assignment.getDay(), assignment.getStartSlot(), session.getSlotCount());
            row.createCell(12).setCellValue(time);
            row.createCell(13).setCellValue(assignment.isLocked() ? "x" : "");
        }
        for (int c = 0; c < titles.length; c++) {
            sheet.setColumnWidth(c, 16 * 256);
        }
    }

    private void writeReport(Sheet sheet, TimetableMetrics metrics, CellStyle bold) {
        int r = 0;
        for (String line : metrics.toReport().split("\n")) {
            Row row = sheet.createRow(r);
            r++;
            row.createCell(0).setCellValue(line);
            if (line.startsWith("===")) {
                row.getCell(0).setCellStyle(bold);
            }
        }
        r++;
        Row header = sheet.createRow(r);
        String[] titles = {"Giảng viên", "Số ca/tuần", "Số ngày lên trường", "Ca trống", "Ngày chỉ 1 ca", "Vượt tối đa/ngày", "Vượt tối đa/tuần"};
        for (int c = 0; c < titles.length; c++) {
            header.createCell(c).setCellValue(titles[c]);
            header.getCell(c).setCellStyle(bold);
        }
        for (TimetableMetrics.TeacherStats stats : metrics.getTeacherStats()) {
            r++;
            Row row = sheet.createRow(r);
            row.createCell(0).setCellValue(stats.getTeacherCode());
            row.createCell(1).setCellValue(stats.getSlots());
            row.createCell(2).setCellValue(stats.getTeachingDays());
            row.createCell(3).setCellValue(stats.getGaps());
            row.createCell(4).setCellValue(stats.getSingleSlotDays());
            row.createCell(5).setCellValue(stats.getSlotsOverDayLimit());
            row.createCell(6).setCellValue(stats.getSlotsOverWeekLimit());
        }
        sheet.setColumnWidth(0, 20 * 256);
    }

    private CellStyle createBoldStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        return style;
    }
}
