package vn.edu.fit.schedulesolver.io;

import java.text.Normalizer;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;

/** Các hàm nhỏ dùng chung khi đọc file Excel của khoa. */
final class ExcelUtil {
    private static final DataFormatter FORMATTER = new DataFormatter();

    private ExcelUtil() {
    }

    /** Đọc ô thành chuỗi, đổi cả dấu cách không ngắt (nbsp) thành dấu cách thường. */
    static String text(Row row, int column) {
        if (row == null || column < 0) {
            return "";
        }
        Cell cell = row.getCell(column);
        if (cell == null) {
            return "";
        }
        return FORMATTER.formatCellValue(cell).replace(' ', ' ').trim();
    }

    /** Bỏ dấu, viết hoa, gộp khoảng trắng vì file thật gõ tiêu đề không thống nhất. */
    static String normalize(String value) {
        String text = Normalizer.normalize(value, Normalizer.Form.NFD);
        text = text.replaceAll("\\p{M}", "");
        text = text.replace('đ', 'd').replace('Đ', 'D');
        return text.trim().replaceAll("\\s+", " ").toUpperCase();
    }

    /** So tên đã chuẩn hóa vì tên sheet trong file thật bị thừa dấu cách. */
    static Sheet findSheet(Workbook workbook, String name) {
        for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
            if (normalize(workbook.getSheetName(i)).equals(normalize(name))) {
                return workbook.getSheetAt(i);
            }
        }
        throw new IllegalArgumentException("Không tìm thấy sheet \"" + name + "\" trong file Excel.");
    }

    /** Không thấy cột thì trả về -1. */
    static int findColumn(Row header, String title) {
        for (int column = 0; column < header.getLastCellNum(); column++) {
            if (normalize(text(header, column)).equals(normalize(title))) {
                return column;
            }
        }
        return -1;
    }
}
