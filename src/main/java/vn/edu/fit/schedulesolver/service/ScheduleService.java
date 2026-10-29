package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.solver.Problem;
import vn.edu.fit.schedulesolver.solver.Solution;
import vn.edu.fit.schedulesolver.solver.TimetableMetrics;
import vn.edu.fit.schedulesolver.solver.Verifier;
import vn.edu.fit.schedulesolver.solver.Violation;

/** Nghiệp vụ của giáo vụ, tách khỏi giao diện để test riêng được. */
public class ScheduleService {

    /** Kế hoạch chưa gửi hoặc quy ước còn thiếu thì báo lỗi. */
    public Problem buildProblemForSolving(Workspace workspace) {
        if (!workspace.isPlanSent()) {
            throw new IllegalStateException("Trưởng khoa chưa gửi kế hoạch mở lớp cho giáo vụ.");
        }
        Convention convention = new Convention(workspace.getRules());
        List<String> problems = convention.checkPlan(workspace.getPlan(), workspace.getTeachers());
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Chưa thể xếp lịch:\n" + String.join("\n", problems));
        }
        return buildProblem(workspace, workspace.getDraft());
    }

    /** Buổi nào đã khóa trong danh sách thì giữ nguyên. */
    public Problem buildProblem(Workspace workspace, List<Assignment> assignments) {
        Convention convention = new Convention(workspace.getRules());
        return new Problem(workspace.getPlan(), workspace.getTeachers(), convention.candidateMap(workspace.getPlan()),
                workspace.getAllBusySlots(), lockedOf(assignments));
    }

    public List<Assignment> toAssignments(Problem problem, Solution solution) {
        List<Assignment> result = new ArrayList<>();
        for (int i = 0; i < problem.getSessionCount(); i++) {
            if (solution.isPlaced(i)) {
                String teacher = problem.getTeacher(solution.getTeacher(i)).getCode();
                result.add(new Assignment(problem.getSession(i).getId(), teacher,
                        solution.getDay(i), solution.getSlot(i), problem.isLocked(i)));
            }
        }
        return result;
    }

    /** Buổi không có phân công hợp lệ thì để chưa xếp. */
    public Solution toSolution(Problem problem, List<Assignment> assignments) {
        Map<String, Assignment> byId = new HashMap<>();
        for (Assignment assignment : assignments) {
            byId.put(assignment.getSessionId(), assignment);
        }
        Solution solution = new Solution(problem.getSessionCount());
        for (int i = 0; i < problem.getSessionCount(); i++) {
            Assignment assignment = byId.get(problem.getSession(i).getId());
            if (assignment == null) {
                continue;
            }
            int teacher = problem.findTeacher(assignment.getTeacherCode());
            if (teacher >= 0) {
                solution.place(i, teacher, assignment.getDay(), assignment.getStartSlot());
            }
        }
        return solution;
    }

    public TimetableMetrics evaluate(Workspace workspace, List<Assignment> assignments) {
        Problem problem = buildProblem(workspace, assignments);
        return new TimetableMetrics(problem, toSolution(problem, assignments));
    }

    /** Hết vi phạm cứng mới cho công bố, bản công bố là bản sao của nháp. */
    public void publish(Workspace workspace) {
        if (workspace.getDraft().isEmpty()) {
            throw new IllegalStateException("Chưa có bản nháp để công bố.");
        }
        TimetableMetrics metrics = evaluate(workspace, workspace.getDraft());
        int hard = Verifier.countHard(metrics.getViolations());
        if (hard > 0) {
            StringBuilder message = new StringBuilder("Còn " + hard + " vi phạm cứng, chưa thể công bố:\n");
            int shown = 0;
            for (Violation violation : metrics.getViolations()) {
                if (violation.isHard() && shown < 5) {
                    message.append("- ").append(violation.getMessage()).append('\n');
                    shown++;
                }
            }
            throw new IllegalStateException(message.toString());
        }
        workspace.publishDraft();
    }

    /** Dùng khi giáo vụ sửa tay một buổi trong bản nháp. */
    public void replaceInDraft(Workspace workspace, Assignment updated) {
        List<Assignment> draft = workspace.getDraft();
        for (int k = 0; k < draft.size(); k++) {
            if (draft.get(k).getSessionId().equals(updated.getSessionId())) {
                draft.set(k, updated);
                return;
            }
        }
        draft.add(updated);
    }

    private static List<Assignment> lockedOf(List<Assignment> assignments) {
        List<Assignment> locked = new ArrayList<>();
        for (Assignment assignment : assignments) {
            if (assignment.isLocked()) {
                locked.add(assignment);
            }
        }
        return locked;
    }
}
