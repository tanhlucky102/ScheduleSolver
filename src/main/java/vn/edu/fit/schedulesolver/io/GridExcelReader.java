package vn.edu.fit.schedulesolver.io;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/**
 * Đọc lưới TKB lập tay của khoa. Dòng có giờ kiểu "07:10 - 09:15" mở đầu một ca,
 * các dòng không ghi giờ bên dưới vẫn thuộc ca đó.
 */
public class GridExcelReader {
    public static final String SHEET_NAME = "Timetable Spring 2026";
    private static final String[] DAY_TITLES = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
    private static final String[] SLOT_STARTS = {"07:10", "09:30", "12:20", "14:40", "16:55", "18:55"};
    // file cũ của khoa ghi ca 5 bắt đầu lúc 16:40 nên vẫn nhận giờ này
    private static final String OLD_SLOT_5_START = "16:40";
    private static final Pattern TIME_BAND = Pattern.compile("(\\d{1,2}:\\d{2})\\s*-\\s*\\d{1,2}:\\d{2}");

    private final List<String> warnings = new ArrayList<>();

    public List<GridCell> read(File file) throws IOException {
        warnings.clear();
        try (InputStream input = new FileInputStream(file);
             Workbook workbook = WorkbookFactory.create(input)) {
            Sheet sheet = ExcelUtil.findSheet(workbook, SHEET_NAME);
            return readGrid(sheet);
        } catch (IllegalArgumentException e) {
            throw new IOException(e.getMessage(), e);
        }
    }

    private List<GridCell> readGrid(Sheet sheet) throws IOException {
        int headerRow = -1;
        int[] dayColumns = new int[DAY_TITLES.length];
        for (int r = 0; r <= 20 && headerRow < 0; r++) {
            Row row = sheet.getRow(r);
            if (row != null && ExcelUtil.findColumn(row, "Monday") >= 0) {
                headerRow = r;
                for (int d = 0; d < DAY_TITLES.length; d++) {
                    dayColumns[d] = ExcelUtil.findColumn(row, DAY_TITLES[d]);
                }
            }
        }
        if (headerRow < 0) {
            throw new IOException("Không tìm thấy dòng tiêu đề Monday..Saturday.");
        }

        List<GridCell> cells = new ArrayList<>();
        boolean tutorialSection = false;
        int currentSlot = -1;
        for (int r = headerRow + 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }
            // các cột trước Monday chứa nhãn LECTURE/TUTORIAL và khung giờ
            for (int c = 0; c < dayColumns[0]; c++) {
                String label = ExcelUtil.text(row, c);
                if (label.equalsIgnoreCase("TUTORIAL")) {
                    tutorialSection = true;
                } else if (label.equalsIgnoreCase("LECTURE")) {
                    tutorialSection = false;
                }
                int slot = slotOf(label);
                if (slot >= 0) {
                    currentSlot = slot;
                }
            }
            for (int d = 0; d < dayColumns.length; d++) {
                String text = ExcelUtil.text(row, dayColumns[d]);
                if (!GridCell.containsCourse(text)) {
                    continue;
                }
                if (currentSlot < 0) {
                    warnings.add("Dòng " + (r + 1) + ": ô môn học nằm ngoài khung giờ, bỏ qua.");
                    continue;
                }
                try {
                    cells.add(new GridCell(r + 1, TimeSlots.FIRST_DAY + d, currentSlot, tutorialSection, text));
                } catch (IllegalArgumentException e) {
                    warnings.add("Dòng " + (r + 1) + ": " + e.getMessage());
                }
            }
        }
        return cells;
    }

    private int slotOf(String label) {
        Matcher matcher = TIME_BAND.matcher(label);
        if (!matcher.find()) {
            return -1;
        }
        String start = matcher.group(1);
        if (start.length() == 4) {
            start = "0" + start;
        }
        if (start.equals(OLD_SLOT_5_START)) {
            return 4;
        }
        for (int slot = 0; slot < SLOT_STARTS.length; slot++) {
            if (SLOT_STARTS[slot].equals(start)) {
                return slot;
            }
        }
        return -1;
    }

    public List<String> getWarnings() {
        return warnings;
    }
}
