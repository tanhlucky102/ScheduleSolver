package vn.edu.fit.schedulesolver.io;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Workspace;

/** Kiểm tra bố cục lưới TKB theo mẫu Excel của khoa. */
class TimetableTemplateTest {

    private static Workspace workspaceWith(PlanSession... sessions) {
        Workspace workspace = new Workspace();
        for (PlanSession session : sessions) {
            workspace.getPlan().add(session);
        }
        return workspace;
    }

    private static TimetableTemplate.Cell find(TimetableTemplate template, String title, int slot) {
        for (TimetableTemplate.Cell cell : template.getCells()) {
            if (cell.getTitle().equals(title) && cell.getSlot() == slot) {
                return cell;
            }
        }
        throw new AssertionError("Không thấy ô " + title + " ở ca " + (slot + 1));
    }

    @Test
    void regularAndAdvancedProgramsGoToSeparateTimetables() {
        PlanSession lecture = new PlanSession("61FIT3DBS-LEC", "61FIT3DBS", "CSDL", "K24", "", SessionKind.LECTURE, 120);
        PlanSession tutorial = new PlanSession("61FIT3DBS-TUT-03", "61FIT3DBS", "CSDL", "K24", "03", SessionKind.TUTORIAL, 30);
        PlanSession clc = new PlanSession("62FIT3DBS-CLC01", "62FIT3DBS", "CSDL", "K24", "CLC01", SessionKind.LEC_TUT, 35);
        PlanSession fourPeriods = new PlanSession("61FIT3SS1-4T-05", "61FIT3SS1", "Kỹ năng", "K24", "05", SessionKind.COMBINED, 30);
        PlanSession advanced = new PlanSession("66FIT2POP-TT02", "66FIT2POP", "Lập trình", "K25", "TT02", SessionKind.LEC_TUT, 30);
        Workspace workspace = workspaceWith(lecture, tutorial, clc, fourPeriods, advanced);
        List<Assignment> assignments = new ArrayList<>();
        assignments.add(new Assignment(lecture.getId(), "NguyetDTM", 2, 0, false));
        assignments.add(new Assignment(tutorial.getId(), "NgaNT", 3, 1, false));
        assignments.add(new Assignment(clc.getId(), "NgaNT", 2, 0, false));
        assignments.add(new Assignment(fourPeriods.getId(), "TuanVM", 4, 4, false));
        assignments.add(new Assignment(advanced.getId(), "ThaoDTP", 5, 2, false));

        // TKB IT + MME: Lec ở khối LECTURE, Tut và môn 4 tiết ở khối TUTORIAL
        TimetableTemplate regular = new TimetableTemplate(workspace, assignments, TimetableTemplate.REGULAR);
        assertEquals(TimetableTemplate.LECTURE, find(regular, "61FIT3DBS", 0).getBlock());
        assertEquals(TimetableTemplate.TUTORIAL, find(regular, "61FIT3DBS - 03", 1).getBlock());
        assertEquals("TuanVM", find(regular, "61FIT3SS1 - 05", 4).getTeacherCode());
        assertEquals("TuanVM", find(regular, "61FIT3SS1 - 05", 5).getTeacherCode());
        assertEquals(4, regular.getCells().size());

        // TKB CLC: ô Lec và ô Tut của cùng một lớp phải nằm cùng dòng
        TimetableTemplate clcTable = new TimetableTemplate(workspace, assignments, TimetableTemplate.ADVANCED);
        TimetableTemplate.Cell lec = find(clcTable, "62FIT3DBS - CLC01 - Lec", 0);
        TimetableTemplate.Cell tut = find(clcTable, "62FIT3DBS - CLC01 - Tut", 1);
        assertEquals(TimetableTemplate.CLASSES, lec.getBlock());
        assertEquals(lec.getRow(), tut.getRow());
        assertEquals(TimetableTemplate.CLASSES, find(clcTable, "66FIT2POP - TT02 - Lec", 2).getBlock());
        assertEquals(4, clcTable.getCells().size());
    }

    @Test
    void rowCountFollowsBusiestDayAndColorsFollowCohorts() {
        PlanSession a = new PlanSession("61FIT2CAL-TUT-01", "61FIT2CAL", "Giải tích", "K25", "01", SessionKind.TUTORIAL, 30);
        PlanSession b = new PlanSession("61FIT2CAL-TUT-02", "61FIT2CAL", "Giải tích", "K25", "02", SessionKind.TUTORIAL, 30);
        PlanSession c = new PlanSession("61MME3MUL-TUT-01", "61MME3MUL", "Đa phương tiện", "K24", "01", SessionKind.TUTORIAL, 30);
        PlanSession d = new PlanSession("61FIT4ATI-TUT-01", "61FIT4ATI", "ATTT", "K23", "01", SessionKind.TUTORIAL, 30);
        Workspace workspace = workspaceWith(a, b, c, d);
        List<Assignment> assignments = new ArrayList<>();
        // 3 buổi cùng Thứ 2 ca 3 nên ca 3 của khối TUTORIAL có 3 dòng
        assignments.add(new Assignment(a.getId(), "SonNTK", 2, 2, false));
        assignments.add(new Assignment(b.getId(), "TungVNS", 2, 2, false));
        assignments.add(new Assignment(c.getId(), "AnhNQ", 2, 2, false));
        assignments.add(new Assignment(d.getId(), "DucBM", 3, 2, false));

        TimetableTemplate template = new TimetableTemplate(workspace, assignments, TimetableTemplate.REGULAR);

        assertEquals(3, template.getRowCount(TimetableTemplate.TUTORIAL, 2));
        assertEquals(1, template.getRowCount(TimetableTemplate.TUTORIAL, 0));
        assertEquals(1, template.getRowCount(TimetableTemplate.LECTURE, 2));
        // khóa mới nhất lấy màu đầu tiên
        assertEquals(List.of("K25", "K24", "K23"), template.getColoredCohorts());
        assertEquals(0xFDE9D9, template.fillColor("K25"));
        assertEquals(0xDAEEF3, template.fillColor("K24"));
        assertEquals(0x92CDDC, template.fillColor("K23"));
        assertTrue(TimetableTemplate.isMme(c));
    }
}
