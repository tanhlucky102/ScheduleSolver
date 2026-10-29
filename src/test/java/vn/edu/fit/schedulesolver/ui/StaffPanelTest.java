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

/** Kiểm thử tab Kế hoạch từ trưởng khoa (PlanViewTab) trong StaffPanel (giao diện giáo vụ). */
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

        // Trước khi thêm buổi, gọi frame.refreshAll() (giống lúc vừa đăng nhập)
        frame.refreshAll();
        assertFalse(ws.isPlanSent(), "Sau khi refreshAll ban đầu, kế hoạch vẫn chưa được gửi");
        assertTrue(ws.getPlan().isEmpty(), "Sau khi refreshAll ban đầu, danh sách buổi kế hoạch phải rỗng");

        // Kiểm tra PlanViewTab khi trưởng khoa chưa gửi
        PlanViewTab tab = new PlanViewTab(frame);
        tab.refresh();
        assertEquals(3, tab.getSubTabs().getTabCount(), "Phải có đúng 3 sub-tab");
        assertTrue(tab.getStatusLabel().getText().contains("Trưởng khoa chưa gửi"),
                "Thông báo phải là: Trưởng khoa chưa gửi kế hoạch mở lớp.");
        assertEquals(0, tab.getPlanModel().getRowCount(), "Khi chưa gửi, bảng danh sách buổi phải có 0 dòng");

        // Thêm các buổi học vào kế hoạch
        ws.getPlan().add(new PlanSession("S01", "61FIT3DBS", "Database", "K24", "01", SessionKind.LECTURE, 150));
        ws.getPlan().add(new PlanSession("S02", "61FIT3DBS", "Database", "K24", "01", SessionKind.TUTORIAL, 30));
        ws.getPlan().add(new PlanSession("S03", "62FIT2PR1", "Programming 1", "K25", "CLC01", SessionKind.LEC_TUT, 30));

        // Chưa gửi kế hoạch
        frame.refreshAll();
        tab.refresh();
        assertFalse(ws.isPlanSent());
        assertEquals(0, tab.getPlanModel().getRowCount(), "Khi Trưởng khoa chưa bấm gửi, giáo vụ vẫn chưa thấy dữ liệu");

        // Giả lập Trưởng khoa gửi kế hoạch cho Giáo vụ
        ws.setPlanSent(true);
        frame.refreshAll();
        tab.refresh();
        assertTrue(ws.isPlanSent(), "Kế hoạch đã được đánh dấu là gửi");
        assertTrue(tab.getStatusLabel().getText().contains("Kế hoạch đã được Trưởng khoa gửi"));
        assertEquals(3, tab.getPlanModel().getRowCount(), "Bảng danh sách buổi phải hiển thị đúng 3 buổi đã gửi");

        frame.dispose();
    }
}
