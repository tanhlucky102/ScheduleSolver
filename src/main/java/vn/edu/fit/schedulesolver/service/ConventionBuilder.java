package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Đề xuất quy ước phân công từ TKB cũ: ai đã dạy môn nào, dạy Lec hay Tut. */
public class ConventionBuilder {

    /** Lấy từ TKB cũ rồi bổ sung các môn trong kế hoạch còn thiếu người dạy. */
    public List<TeachingRule> buildDefault(GridTimetable grid, List<PlanSession> plan) {
        List<TeachingRule> rules = fromTimetable(grid);
        fillMissingCourses(rules, plan);
        return rules;
    }

    /** Giảng viên có trên TKB cũ nhưng chưa có trong danh sách. */
    public List<Teacher> newTeachers(GridTimetable grid, List<Teacher> known) {
        List<Teacher> result = new ArrayList<>();
        for (String code : grid.getTeacherCodes()) {
            boolean exists = false;
            for (Teacher teacher : known) {
                if (teacher.getCode().equalsIgnoreCase(code)) {
                    exists = true;
                }
            }
            if (!exists) {
                result.add(new Teacher(code));
            }
        }
        return result;
    }

    public List<TeachingRule> fromTimetable(GridTimetable grid) {
        Map<String, TeachingRule> rules = new LinkedHashMap<>();
        for (int k = 0; k < grid.getSessions().size(); k++) {
            PlanSession session = grid.getSessions().get(k);
            Assignment assignment = grid.getAssignments().get(k);
            String key = session.getCourseCode() + "|" + assignment.getTeacherCode();
            SessionKind kind = session.getKind();
            TeachingRule rule = rules.get(key);
            if (rule == null) {
                rules.put(key, new TeachingRule(session.getCourseCode(), "", assignment.getTeacherCode(),
                        kind.needsLecture(), kind.needsTutorial()));
            } else {
                rule.setCanLecture(rule.isCanLecture() || kind.needsLecture());
                rule.setCanTutorial(rule.isCanTutorial() || kind.needsTutorial());
            }
        }
        return new ArrayList<>(rules.values());
    }

    /** Buổi chưa có ai dạy thì lấy giảng viên cùng học phần ở chương trình khác. */
    public int fillMissingCourses(List<TeachingRule> rules, List<PlanSession> plan) {
        int changed = 0;
        for (PlanSession session : plan) {
            if (!new Convention(rules).candidatesFor(session).isEmpty()) {
                continue;
            }
            SessionKind kind = session.getKind();
            for (TeachingRule source : findSameSubject(rules, session.getCourseCode())) {
                TeachingRule target = findRule(rules, session.getCourseCode(), source.getTeacherCode());
                if (target == null) {
                    rules.add(new TeachingRule(session.getCourseCode(), session.getCourseName(),
                            source.getTeacherCode(), kind.needsLecture(), kind.needsTutorial()));
                } else {
                    target.setCanLecture(target.isCanLecture() || kind.needsLecture());
                    target.setCanTutorial(target.isCanTutorial() || kind.needsTutorial());
                }
                changed++;
            }
        }
        fillCourseNames(rules, plan);
        return changed;
    }

    /** Môn nào TKB cũ không ghi giảng viên thì giữ lại quy ước đang có của môn đó, trả về số dòng giữ lại. */
    public int keepCurrentRules(List<TeachingRule> suggested, List<TeachingRule> current, List<PlanSession> plan) {
        int kept = 0;
        for (PlanSession session : plan) {
            if (!new Convention(suggested).candidatesFor(session).isEmpty()) {
                continue;
            }
            for (TeachingRule old : current) {
                if (!old.getCourseCode().equalsIgnoreCase(session.getCourseCode()) || !old.allows(session.getKind())) {
                    continue;
                }
                TeachingRule target = findRule(suggested, old.getCourseCode(), old.getTeacherCode());
                if (target == null) {
                    suggested.add(new TeachingRule(old.getCourseCode(), old.getCourseName(), old.getTeacherCode(),
                            old.isCanLecture(), old.isCanTutorial()));
                } else {
                    target.setCanLecture(target.isCanLecture() || old.isCanLecture());
                    target.setCanTutorial(target.isCanTutorial() || old.isCanTutorial());
                }
                kept++;
            }
        }
        return kept;
    }

    private void fillCourseNames(List<TeachingRule> rules, List<PlanSession> plan) {
        for (TeachingRule rule : rules) {
            if (!rule.getCourseName().isEmpty()) {
                continue;
            }
            for (PlanSession session : plan) {
                if (session.getCourseCode().equals(rule.getCourseCode()) && !session.getCourseName().isEmpty()) {
                    rule.setCourseName(session.getCourseName());
                    break;
                }
            }
        }
    }

    /** Bỏ phần khóa và chương trình (61FIT3DBS thành "3DBS") để nhận ra cùng một học phần. */
    static String subjectOf(String courseCode) {
        int end = Math.min(courseCode.length(), 9);
        return courseCode.substring(5, end);
    }

    private List<TeachingRule> findSameSubject(List<TeachingRule> rules, String course) {
        List<TeachingRule> result = new ArrayList<>();
        for (TeachingRule rule : rules) {
            if (!rule.getCourseCode().equals(course) && subjectOf(rule.getCourseCode()).equals(subjectOf(course))) {
                result.add(rule);
            }
        }
        return result;
    }

    /**
     * Mức mặc định 4 ca/ngày, 12 ca/tuần thấp hơn tải thật của vài GV trên TKB của khoa.
     * Nâng giới hạn của các GV đó lên bằng tải thật để bộ giải không coi tải thật là vi phạm.
     * Trả về mô tả các GV đã được nâng.
     */
    public List<String> applyRealLoad(List<Teacher> teachers, GridTimetable grid) {
        List<String> changed = new ArrayList<>();
        for (Teacher teacher : teachers) {
            int[] perDay = new int[TimeSlots.LAST_DAY + 1];
            for (int k = 0; k < grid.getAssignments().size(); k++) {
                Assignment assignment = grid.getAssignments().get(k);
                if (assignment.getTeacherCode().equalsIgnoreCase(teacher.getCode())) {
                    perDay[assignment.getDay()] += grid.getSessions().get(k).getSlotCount();
                }
            }
            int week = 0;
            int maxDay = 0;
            for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
                week += perDay[day];
                maxDay = Math.max(maxDay, perDay[day]);
            }
            if (maxDay > teacher.getMaxSlotsPerDay() || week > teacher.getMaxSlotsPerWeek()) {
                teacher.setMaxSlotsPerDay(Math.max(teacher.getMaxSlotsPerDay(), maxDay));
                teacher.setMaxSlotsPerWeek(Math.max(teacher.getMaxSlotsPerWeek(), week));
                changed.add(teacher.getCode() + ": TKB của khoa có " + week + " ca/tuần, nhiều nhất "
                        + maxDay + " ca/ngày");
            }
        }
        return changed;
    }

    /** Dòng quy ước của cặp môn và giảng viên, chưa có thì trả về null. */
    public static TeachingRule findRule(List<TeachingRule> rules, String course, String teacher) {
        for (TeachingRule rule : rules) {
            if (rule.getCourseCode().equalsIgnoreCase(course) && rule.getTeacherCode().equalsIgnoreCase(teacher)) {
                return rule;
            }
        }
        return null;
    }
}
