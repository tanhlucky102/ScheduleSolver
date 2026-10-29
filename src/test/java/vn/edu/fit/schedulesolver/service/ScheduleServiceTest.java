package vn.edu.fit.schedulesolver.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.solver.Algorithm;
import vn.edu.fit.schedulesolver.solver.ParallelSolver;
import vn.edu.fit.schedulesolver.solver.Problem;
import vn.edu.fit.schedulesolver.solver.SolverConfig;
import vn.edu.fit.schedulesolver.solver.SolverResult;
import vn.edu.fit.schedulesolver.solver.TimetableMetrics;

/** Test cả luồng từ kế hoạch, xếp lịch, công bố tới lịch cá nhân. */
class ScheduleServiceTest {

    private static Workspace smallWorkspace() {
        Workspace workspace = new Workspace();
        workspace.getTeachers().add(new Teacher("NgaNT"));
        workspace.getTeachers().add(new Teacher("NguyetDTM"));
        workspace.getRules().add(new TeachingRule("61FIT3DBS", "CSDL", "NguyetDTM", true, true));
        workspace.getRules().add(new TeachingRule("61FIT3DBS", "CSDL", "NgaNT", false, true));
        workspace.getPlan().add(new PlanSession("DBS-LEC", "61FIT3DBS", "CSDL", "K24", "", SessionKind.LECTURE, 200));
        workspace.getPlan().add(new PlanSession("DBS-T1", "61FIT3DBS", "CSDL", "K24", "01", SessionKind.TUTORIAL, 30));
        workspace.getPlan().add(new PlanSession("DBS-T2", "61FIT3DBS", "CSDL", "K24", "02", SessionKind.TUTORIAL, 30));
        return workspace;
    }

    @Test
    void cannotSolveBeforeDeanSendsPlan() {
        ScheduleService service = new ScheduleService();
        assertThrows(IllegalStateException.class, () -> service.buildProblemForSolving(smallWorkspace()));
    }

    @Test
    void solvePublishAndTeacherBusyTimeFlowBack() throws InterruptedException {
        Workspace workspace = smallWorkspace();
        workspace.setPlanSent(true);
        // NgaNT bận cả ngày Thứ 2 ở trường khác
        workspace.getBusySlots().add(new BusySlot("NgaNT", 2, 0, 5, "ĐH Thủy lợi", "Dạy CSDL lớp 64HT"));
        ScheduleService service = new ScheduleService();
        Problem problem = service.buildProblemForSolving(workspace);
        SolverResult result = new ParallelSolver().solve(problem, new SolverConfig(Algorithm.PORTFOLIO, 2, 0, 5000, 1));
        workspace.getDraft().addAll(service.toAssignments(problem, result.getBestSolution()));

        TimetableMetrics metrics = service.evaluate(workspace, workspace.getDraft());
        assertEquals(0, metrics.getScore().getHard());
        for (Assignment assignment : workspace.getDraft()) {
            boolean ngaOnMonday = assignment.getTeacherCode().equals("NgaNT") && assignment.getDay() == 2;
            assertTrue(!ngaOnMonday, "không được xếp vào giờ bận");
        }

        service.publish(workspace);
        assertEquals(3, workspace.getPublished().size());
        // sửa nháp sau khi công bố thì bản đã công bố không đổi
        Assignment first = workspace.getDraft().get(0);
        service.replaceInDraft(workspace, new Assignment(first.getSessionId(), first.getTeacherCode(), 7, 5, true));
        assertEquals(first.getDay(), workspace.getPublished().get(0).getDay());
    }

    @Test
    void publishIsRejectedWhenDraftHasHardViolations() {
        Workspace workspace = smallWorkspace();
        // Lec và Tut cùng khóa trùng giờ, lại cùng một giảng viên
        workspace.getDraft().add(new Assignment("DBS-LEC", "NguyetDTM", 2, 0, false));
        workspace.getDraft().add(new Assignment("DBS-T1", "NguyetDTM", 2, 0, false));
        workspace.getDraft().add(new Assignment("DBS-T2", "NgaNT", 3, 0, false));
        ScheduleService service = new ScheduleService();
        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.publish(workspace));
        assertTrue(error.getMessage().contains("vi phạm cứng"));
        assertTrue(workspace.getPublished().isEmpty());
    }

    @Test
    void missingSessionBlocksPublishing() {
        Workspace workspace = smallWorkspace();
        workspace.getDraft().add(new Assignment("DBS-LEC", "NguyetDTM", 2, 0, false));
        IllegalStateException error = assertThrows(IllegalStateException.class, () -> new ScheduleService().publish(workspace));
        assertTrue(error.getMessage().contains("chưa được xếp"));
    }

    @Test
    void personalScheduleShowsConflictWithLaterBusySlot() {
        Workspace workspace = smallWorkspace();
        workspace.getPublished().add(new Assignment("DBS-T1", "NgaNT", 4, 2, false));
        workspace.getBusySlots().add(new BusySlot("NgaNT", 4, 2, 3, "Học viện Bưu chính", "riêng"));
        PersonalSchedule schedule = new PersonalSchedule(workspace, "NgaNT");
        List<String> conflicts = schedule.findConflicts();
        assertEquals(1, conflicts.size());
        assertTrue(conflicts.get(0).startsWith("DBS-T1"));
        assertTrue(schedule.summary().contains("1 ca/tuần"));
    }
}
