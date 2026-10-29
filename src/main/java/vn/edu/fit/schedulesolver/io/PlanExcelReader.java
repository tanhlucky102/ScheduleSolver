package vn.edu.fit.schedulesolver.io;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

/**
 * Đọc sheet "Kế hoạch mở lớp". Cột tìm theo tiêu đề nên đổi thứ tự cột vẫn đọc được,
 * dòng nào lỗi thì bỏ qua và ghi vào cảnh báo.
 */
public class PlanExcelReader {
    public static final String SHEET_NAME = "Kế hoạch mở lớp";
    private static final String[] REQUIRED_COLUMNS = {"Mã môn", "Tên học phần", "Sĩ số", "Khóa", "Số lớp mở", "Số tiết"};
    private static final int MAX_HEADER_ROW = 20;

    private final List<String> warnings = new ArrayList<>();

    public List<PlanRow> read(File file) throws IOException {
        warnings.clear();
        try (InputStream input = new FileInputStream(file);
             Workbook workbook = WorkbookFactory.create(input)) {
            Sheet sheet = ExcelUtil.findSheet(workbook, SHEET_NAME);
            Row header = findHeader(sheet);
            int[] columns = new int[REQUIRED_COLUMNS.length];
            for (int k = 0; k < REQUIRED_COLUMNS.length; k++) {
                columns[k] = ExcelUtil.findColumn(header, REQUIRED_COLUMNS[k]);
                if (columns[k] < 0) {
                    throw new IOException("Sheet \"" + SHEET_NAME + "\" thiếu cột \"" + REQUIRED_COLUMNS[k] + "\".");
                }
            }
            return readRows(sheet, header.getRowNum(), columns);
        } catch (IllegalArgumentException e) {
            throw new IOException(e.getMessage(), e);
        }
    }

    private Row findHeader(Sheet sheet) throws IOException {
        for (int r = 0; r <= MAX_HEADER_ROW; r++) {
            Row row = sheet.getRow(r);
            if (row != null && ExcelUtil.findColumn(row, "Mã môn") >= 0) {
                return row;
            }
        }
        throw new IOException("Không tìm thấy dòng tiêu đề có cột \"Mã môn\".");
    }

    private List<PlanRow> readRows(Sheet sheet, int headerRow, int[] columns) {
        List<PlanRow> rows = new ArrayList<>();
        for (int r = headerRow + 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            String code = ExcelUtil.text(row, columns[0]).toUpperCase();
            if (code.isEmpty()) {
                continue;
            }
            try {
                String name = ExcelUtil.text(row, columns[1]);
                int students = Integer.parseInt(ExcelUtil.text(row, columns[2]));
                int year = Integer.parseInt(ExcelUtil.text(row, columns[3]));
                int classCount = Integer.parseInt(ExcelUtil.text(row, columns[4]));
                int periods = Integer.parseInt(ExcelUtil.text(row, columns[5]));
                if (periods != 2 && periods != 4) {
                    throw new IllegalArgumentException("số tiết phải là 2 hoặc 4");
                }
                if (students < 1 || classCount < 1) {
                    throw new IllegalArgumentException("sĩ số và số lớp phải lớn hơn 0");
                }
                rows.add(new PlanRow(r + 1, code, name, students, year, classCount, periods));
            } catch (IllegalArgumentException e) {
                warnings.add("Dòng " + (r + 1) + " (" + code + "): bỏ qua vì " + e.getMessage());
            }
        }
        return rows;
    }

    public List<String> getWarnings() {
        return warnings;
    }
}
