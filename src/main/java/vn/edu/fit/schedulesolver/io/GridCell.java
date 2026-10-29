package vn.edu.fit.schedulesolver.io;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import vn.edu.fit.schedulesolver.model.SessionKind;

/** Một ô môn trên lưới TKB cũ: dòng 1 là "mã môn - nhóm - loại", dòng 2 là "giảng viên - phòng". */
public class GridCell {
    private static final Pattern COURSE = Pattern.compile("\\d{2}[A-Z]{3}\\d[A-Za-z0-9]+");

    private final int excelRow;
    private final int day;
    private final int slot;
    private final String courseCode;
    private final String group;
    private final SessionKind kind;
    private final String teacherText;

    public GridCell(int excelRow, int day, int slot, boolean tutorialSection, String rawText) {
        this.excelRow = excelRow;
        this.day = day;
        this.slot = slot;
        String[] lines = rawText.trim().split("\\R", 2);
        String first = lines[0];
        teacherText = lines.length > 1 ? lines[1].trim() : "";

        Matcher matcher = COURSE.matcher(first);
        if (!matcher.find()) {
            throw new IllegalArgumentException("Ô không có mã môn: " + rawText);
        }
        courseCode = matcher.group();
        String rest = first.substring(matcher.end());

        // ô có ghi Lec/Tut thì lấy theo ô, không thì theo phần LECTURE/TUTORIAL của lưới
        String upper = rest.toUpperCase();
        if (upper.contains("LEC")) {
            kind = SessionKind.LECTURE;
        } else if (upper.contains("TUT")) {
            kind = SessionKind.TUTORIAL;
        } else if (tutorialSection) {
            kind = SessionKind.TUTORIAL;
        } else {
            kind = SessionKind.LECTURE;
        }
        // phần còn lại là tên nhóm, ví dụ "CLC 01" thành "CLC01"
        String cleaned = upper.replace("LEC", "").replace("TUT", "").replace("(IT)", "");
        group = cleaned.replace("-", "").replace(" ", "").trim();
    }

    public int getExcelRow() {
        return excelRow;
    }

    public int getDay() {
        return day;
    }

    public int getSlot() {
        return slot;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public String getGroup() {
        return group;
    }

    public SessionKind getKind() {
        return kind;
    }

    /** Dòng 2 của ô (giảng viên và phòng), chưa tách. */
    public String getTeacherText() {
        return teacherText;
    }

    public static boolean containsCourse(String text) {
        return COURSE.matcher(text).find();
    }
}
