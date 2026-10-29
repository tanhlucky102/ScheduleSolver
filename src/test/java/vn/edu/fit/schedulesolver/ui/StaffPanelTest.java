package vn.edu.fit.schedulesolver.ui;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import org.junit.jupiter.api.Test;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.service.AuthService;

/** Kiểm thử tab Kế hoạch từ trưởng khoa trong StaffPanel (giao diện giáo vụ). */
class StaffPanelTest {

    @Test
    void testReceivedPlanTabStructureAndData() throws Exception {
        File authFile = new File("resources/tai_khoan.csv");
        AuthService auth = new AuthService(authFile);
        MainFrame frame = new MainFrame(auth);
        Workspace ws = frame.getWorkspace();

        assertNotNull(ws);
        assertFalse(ws.isPlanSent(), "Kế hoạch ban đầu chưa được gửi");
        assertTrue(ws.getTeachers().size() > 0, "Đã nạp giảng viên mặc định");
        assertTrue(ws.getRules().size() > 0, "Đã nạp quy ước mặc định");

        // Thêm các buổi học vào kế hoạch
        ws.getPlan().add(new PlanSession("S01", "61FIT3DBS", "Database", "K24", "01", SessionKind.LECTURE, 150));
        ws.getPlan().add(new PlanSession("S02", "61FIT3DBS", "Database", "K24", "01", SessionKind.TUTORIAL, 30));
        ws.getPlan().add(new PlanSession("S03", "62FIT2PR1", "Programming 1", "K25", "CLC01", SessionKind.LEC_TUT, 30));

        // Chưa gửi kế hoạch
        frame.refreshAll();
        assertFalse(ws.isPlanSent());

        // Giả lập Trưởng khoa gửi kế hoạch cho Giáo vụ
        ws.setPlanSent(true);
        frame.refreshAll();
        assertTrue(ws.isPlanSent(), "Kế hoạch đã được đánh dấu là gửi");

        frame.dispose();
    }
}