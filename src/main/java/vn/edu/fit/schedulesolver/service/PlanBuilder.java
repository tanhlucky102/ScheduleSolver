package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import vn.edu.fit.schedulesolver.io.PlanRow;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.SessionKind;

/**
 * Đổi kế hoạch mở lớp thành các buổi cần xếp. Đại trà, MME: dòng trên 40 sinh viên là Lec, còn lại là nhóm Tut.
 * CLC, TT: hai dòng liền nhau ghép thành 1 buổi Lec+Tut do 1 giảng viên dạy, lẻ dòng thì mỗi dòng là 1 buổi Lec.
 */
public class PlanBuilder {
    public static final int LECTURE_MIN_STUDENTS = 41;

    private final List<String> warnings = new ArrayList<>();

    public List<PlanSession> build(List<PlanRow> rows) {
        warnings.clear();
        // gom theo mã môn, giữ thứ tự trong file
        Map<String, List<PlanRow>> byCourse = new LinkedHashMap<>();
        for (PlanRow row : rows) {
            if (Program.fromCourseCode(row.getCourseCode()) == null) {
                warnings.add("Dòng " + row.getExcelRow() + ": mã môn " + row.getCourseCode()
                        + " không thuộc chương trình nào đã biết, bỏ qua.");
                continue;
            }
            for (int k = 0; k < row.getClassCount(); k++) {
                byCourse.computeIfAbsent(row.getCourseCode(), code -> new ArrayList<>()).add(row);
            }
        }
        List<PlanSession> sessions = new ArrayList<>();
        for (List<PlanRow> courseRows : byCourse.values()) {
            buildCourse(courseRows, sessions);
        }
        return sessions;
    }

    private void buildCourse(List<PlanRow> rows, List<PlanSession> sessions) {
        Program program = Program.fromCourseCode(rows.get(0).getCourseCode());
        List<PlanRow> fourPeriodRows = new ArrayList<>();
        List<PlanRow> twoPeriodRows = new ArrayList<>();
        for (PlanRow row : rows) {
            if (row.getPeriods() == 4) {
                fourPeriodRows.add(row);
            } else {
                twoPeriodRows.add(row);
            }
        }
        for (int k = 0; k < fourPeriodRows.size(); k++) {
            PlanRow row = fourPeriodRows.get(k);
            String group = groupName(program, k + 1);
            sessions.add(create(row, "4T-" + group, group, SessionKind.COMBINED));
        }
        if (program.isLecTutTogether()) {
            buildClassBlocks(program, twoPeriodRows, sessions);
        } else {
            buildLectureAndTutorials(twoPeriodRows, sessions);
        }
    }

    private void buildClassBlocks(Program program, List<PlanRow> rows, List<PlanSession> sessions) {
        if (rows.size() % 2 == 0) {
            for (int k = 0; k < rows.size(); k += 2) {
                String group = groupName(program, k / 2 + 1);
                sessions.add(create(rows.get(k), group, group, SessionKind.LEC_TUT));
            }
        } else {
            for (int k = 0; k < rows.size(); k++) {
                String group = groupName(program, k + 1);
                sessions.add(create(rows.get(k), group + "-LEC", group, SessionKind.LECTURE));
            }
        }
    }

    private void buildLectureAndTutorials(List<PlanRow> rows, List<PlanSession> sessions) {
        int lectureNumber = 0;
        int tutorialNumber = 0;
        for (PlanRow row : rows) {
            if (row.getStudentCount() >= LECTURE_MIN_STUDENTS) {
                lectureNumber++;
                String group = lectureNumber == 1 ? "" : String.valueOf((char) ('A' + lectureNumber - 1));
                sessions.add(create(row, "LEC" + (lectureNumber == 1 ? "" : "-" + group), group, SessionKind.LECTURE));
            } else {
                // nhóm Tut nằm sau dòng Lec B thì thuộc lớp B, ví dụ "B04"
                tutorialNumber++;
                String letter = lectureNumber >= 2 ? String.valueOf((char) ('A' + lectureNumber - 1)) : "";
                String group = letter + twoDigits(tutorialNumber);
                sessions.add(create(row, "TUT-" + group, group, SessionKind.TUTORIAL));
            }
        }
    }

    private PlanSession create(PlanRow row, String idSuffix, String group, SessionKind kind) {
        String id = row.getCourseCode() + "-" + idSuffix;
        String cohort = "K" + (row.getIntakeYear() % 100);
        return new PlanSession(id, row.getCourseCode(), row.getCourseName(), cohort, group, kind, row.getStudentCount());
    }

    private String groupName(Program program, int number) {
        if (program == Program.CLC) {
            return "CLC" + twoDigits(number);
        }
        if (program == Program.TT) {
            return "TT" + twoDigits(number);
        }
        return twoDigits(number);
    }

    private static String twoDigits(int number) {
        if (number < 10) {
            return "0" + number;
        }
        return String.valueOf(number);
    }

    public List<String> getWarnings() {
        return warnings;
    }
}
