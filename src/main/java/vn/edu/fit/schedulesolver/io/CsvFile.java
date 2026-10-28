package vn.edu.fit.schedulesolver.io;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Đọc/ghi CSV UTF-8, khi ghi thì dấu phẩy trong giá trị đổi thành dấu chấm phẩy. */
public final class CsvFile {
    private static final String SEPARATOR = ",";

    private CsvFile() {
    }

    public static List<String[]> read(File file) throws IOException {
        List<String[]> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8))) {
            String line = reader.readLine();
            if (line == null) {
                return rows;
            }
            // bỏ dòng tiêu đề
            line = reader.readLine();
            while (line != null) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty() && !trimmed.startsWith("#")) {
                    String[] values = line.split(SEPARATOR, -1);
                    for (int i = 0; i < values.length; i++) {
                        values[i] = values[i].trim();
                    }
                    rows.add(values);
                }
                line = reader.readLine();
            }
        }
        return rows;
    }

    public static void write(File file, String header, List<String[]> rows) throws IOException {
        try (PrintWriter writer = new PrintWriter(
                new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            writer.println(header);
            for (String[] row : rows) {
                StringBuilder line = new StringBuilder();
                for (int i = 0; i < row.length; i++) {
                    if (i > 0) {
                        line.append(SEPARATOR);
                    }
                    line.append(clean(row[i]));
                }
                writer.println(line);
            }
        }
    }

    /** Dòng thiếu cột thì trả về chuỗi rỗng. */
    public static String get(String[] row, int index) {
        if (index < row.length) {
            return row[index];
        }
        return "";
    }

    private static String clean(String value) {
        if (value == null) {
            return "";
        }
        return value.replace(",", ";").replace("\n", " ").replace("\r", " ").trim();
    }
}
