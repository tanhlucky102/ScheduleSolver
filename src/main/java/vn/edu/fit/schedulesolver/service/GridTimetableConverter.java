package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import vn.edu.fit.schedulesolver.io.GridCell;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;

/** Đổi ô của lưới TKB cũ thành buổi học, hai ô liền nhau của cùng lớp thì gộp thành buổi 2 ca. */
public class GridTimetableConverter {
    // mã giảng viên kiểu NgaNT, NguyetDTM
    private static final Pattern TEACHER_CODE = Pattern.compile("[A-Z][a-z]+[A-Z]{1,4}");
    // năm nhập học của khóa đang học môn cấp 1
    private static final int INTAKE_YEAR_OF_LEVEL_ONE = 2026;
    // lưới cũ ghi nhầm mã Lec là 61FIT3AIN, kế hoạch ghi 61FIT2AIN
    private static final Map<String, String> COURSE_CORRECTIONS = Map.of("61FIT3AIN", "61FIT2AIN");

    /** Một ô đã nhận ra giảng viên. */
    private static class Item {
        String course;
        String group;
        SessionKind kind;
        String teacher;
        int day;
        int slot;
        boolean used;
    }

    public GridTimetable convert(List<GridCell> cells, List<Teacher> knownTeachers) {
        GridTimetable result = new GridTimetable();
        List<Item> items = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (GridCell cell : cells) {
            Item item = toItem(cell, knownTeachers, result.getWarnings());
            if (item == null) {
                continue;
            }
            String key = item.course + "|" + item.group + "|" + item.kind + "|" + item.day + "|" + item.slot;
            if (!seen.add(key)) {
                result.getWarnings().add("Dòng " + cell.getExcelRow() + ": ô " + item.course + " - " + item.group
                        + " bị lặp lại, bỏ qua.");
                continue;
            }
            items.add(item);
        }
        Set<String> usedIds = new HashSet<>();
        for (Item first : items) {
            if (first.used) {
                continue;
            }
            first.used = true;
            Item second = findPartner(first, items);
            SessionKind kind = first.kind;
            if (second != null) {
                second.used = true;
                if (first.kind == SessionKind.LECTURE && second.kind == SessionKind.TUTORIAL) {
                    kind = SessionKind.LEC_TUT;
                } else {
                    kind = SessionKind.COMBINED;
                }
            }
            String id = uniqueId(first.course, kind, first.group, usedIds);
            PlanSession session = new PlanSession(id, first.course, "", cohortOf(first.course), first.group, kind, 0);
            result.add(session, new Assignment(id, first.teacher, first.day, first.slot, false));
        }
        return result;
    }

    private Item toItem(GridCell cell, List<Teacher> knownTeachers, List<String> warnings) {
        String course = cell.getCourseCode().toUpperCase();
        course = COURSE_CORRECTIONS.getOrDefault(course, course);
        if (Program.fromCourseCode(course) == null) {
            warnings.add("Dòng " + cell.getExcelRow() + ": " + course + " không thuộc chương trình đã biết.");
            return null;
        }
        String teacher = resolveTeacher(cell.getTeacherText(), knownTeachers);
        if (teacher == null) {
            warnings.add("Dòng " + cell.getExcelRow() + ": " + course + " - " + cell.getGroup()
                    + " không rõ giảng viên (\"" + cell.getTeacherText() + "\"), bỏ qua.");
            return null;
        }
        Item item = new Item();
        item.course = course;
        item.group = cell.getGroup();
        item.kind = cell.getKind();
        item.teacher = teacher;
        item.day = cell.getDay();
        item.slot = cell.getSlot();
        return item;
    }

    /** Tìm ô ở ca sau của cùng lớp, cùng giảng viên để gộp. */
    private Item findPartner(Item first, List<Item> items) {
        if (first.slot % 2 != 0) {
            return null;
        }
        boolean together = Program.fromCourseCode(first.course).isLecTutTogether();
        for (Item other : items) {
            boolean sameClass = !other.used && other.course.equals(first.course) && other.group.equals(first.group)
                    && other.teacher.equals(first.teacher) && other.day == first.day && other.slot == first.slot + 1;
            if (!sameClass) {
                continue;
            }
            // CLC/TT có Lec rồi Tut là buổi Lec+Tut, còn hai ô cùng loại là môn 4 tiết
            if (together && first.kind == SessionKind.LECTURE && other.kind == SessionKind.TUTORIAL) {
                return other;
            }
            if (first.kind == other.kind) {
                return other;
            }
        }
        return null;
    }

    /** Lấy mã giảng viên ở dòng 2 của ô, ưu tiên người đã có trong danh sách. */
    static String resolveTeacher(String text, List<Teacher> knownTeachers) {
        String[] tokens = text.split("[\\s\\-/()]+");
        for (String token : tokens) {
            for (Teacher teacher : knownTeachers) {
                if (teacher.matchesName(token)) {
                    return teacher.getCode();
                }
            }
        }
        for (String token : tokens) {
            if (TEACHER_CODE.matcher(token).matches()) {
                return token;
            }
        }
        return null;
    }

    private static String cohortOf(String course) {
        int level = Character.getNumericValue(course.charAt(5));
        int intakeYear = INTAKE_YEAR_OF_LEVEL_ONE - (level - 1);
        return "K" + (intakeYear % 100);
    }

    private static String uniqueId(String course, SessionKind kind, String group, Set<String> usedIds) {
        String id = course;
        if (kind == SessionKind.LECTURE) {
            id = id + "-LEC";
        } else if (kind == SessionKind.TUTORIAL) {
            id = id + "-TUT";
        } else if (kind == SessionKind.COMBINED) {
            id = id + "-4T";
        }
        if (!group.isEmpty()) {
            id = id + "-" + group;
        }
        String result = id;
        int number = 2;
        while (usedIds.contains(result)) {
            result = id + "-" + number;
            number++;
        }
        usedIds.add(result);
        return result;
    }
}
