package vn.edu.fit.schedulesolver.solver;

import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/**
 * Kiểm tra TKB theo tiêu chí Verify của khoa, chỉ rõ buổi nào sai.
 * Viết riêng để test đối chiếu với ScoreCalculator.
 */
public class Verifier {
    public static final String RULE_TEACHER_CLASH = "Verify 1 - Trùng giờ giảng viên";
    public static final String RULE_LEC_TUT_CLASH = "Verify 2 - Lec trùng Tut cùng môn";
    public static final String RULE_CLASS_CLASH = "Lớp CLC trùng lịch";
    public static final String RULE_CROSS_COURSE = "Verify 3 - Lec trùng môn khác cùng khóa";
    public static final String RULE_MISSING = "Verify 4 - Thiếu buổi";
    public static final String RULE_BUSY = "Trùng lịch bận của giảng viên";
    public static final String RULE_NOT_ALLOWED = "Sai quy ước phân công";

    private final Problem problem;

    public Verifier(Problem problem) {
        this.problem = problem;
    }

    public List<Violation> verify(Solution solution) {
        List<Violation> result = new ArrayList<>();
        int n = problem.getSessionCount();
        for (int i = 0; i < n; i++) {
            checkSession(solution, i, result);
        }
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                checkPair(solution, i, j, result);
            }
        }
        return result;
    }

    private void checkSession(Solution solution, int i, List<Violation> result) {
        PlanSession session = problem.getSession(i);
        if (!solution.isPlaced(i)) {
            result.add(new Violation(RULE_MISSING, true, "Buổi " + session.getId() + " chưa được xếp.", session.getId()));
            return;
        }
        int teacher = solution.getTeacher(i);
        String teacherCode = problem.getTeacher(teacher).getCode();
        if (!problem.isCandidate(i, teacher) && !problem.isLocked(i)) {
            result.add(new Violation(RULE_NOT_ALLOWED, true, teacherCode + " không có trong quy ước phân công của "
                    + session.getCourseCode() + " (" + session.getKind().getLabel() + ").", session.getId()));
        }
        int busy = problem.getBusyMask(teacher, solution.getDay(i));
        if ((busy & TimeSlots.mask(solution.getSlot(i), problem.getSlotCount(i))) != 0) {
            result.add(new Violation(RULE_BUSY, true, teacherCode + " có lịch bận cố định lúc "
                    + timeOf(solution, i) + " nhưng được xếp dạy " + session.getId() + ".", session.getId()));
        }
    }

    private void checkPair(Solution solution, int i, int j, List<Violation> result) {
        if (!solution.isPlaced(i) || !solution.isPlaced(j)) {
            return;
        }
        boolean overlap = TimeSlots.overlaps(solution.getDay(i), solution.getSlot(i), problem.getSlotCount(i),
                solution.getDay(j), solution.getSlot(j), problem.getSlotCount(j));
        if (!overlap) {
            return;
        }
        PlanSession a = problem.getSession(i);
        PlanSession b = problem.getSession(j);
        String pair = a.getId() + " và " + b.getId() + " (" + timeOf(solution, i) + ")";
        if (solution.getTeacher(i) == solution.getTeacher(j)) {
            String teacherCode = problem.getTeacher(solution.getTeacher(i)).getCode();
            result.add(new Violation(RULE_TEACHER_CLASH, true, teacherCode + " dạy trùng giờ: " + pair, a.getId(), b.getId()));
        }
        byte conflict = problem.getStudentConflict(i, j);
        if (conflict == Problem.HARD_CONFLICT) {
            String rule = a.getProgram().hasFixedClasses() ? RULE_CLASS_CLASH : RULE_LEC_TUT_CLASH;
            result.add(new Violation(rule, true, "Sinh viên trùng lịch: " + pair, a.getId(), b.getId()));
        } else if (conflict == Problem.SOFT_CONFLICT) {
            result.add(new Violation(RULE_CROSS_COURSE, false,
                    "Khóa " + a.getCohort() + " có thể trùng lịch: " + pair, a.getId(), b.getId()));
        }
    }

    private String timeOf(Solution solution, int i) {
        return TimeSlots.describe(solution.getDay(i), solution.getSlot(i), problem.getSlotCount(i));
    }

    public static int countHard(List<Violation> violations) {
        int count = 0;
        for (Violation violation : violations) {
            if (violation.isHard()) {
                count++;
            }
        }
        return count;
    }
}
