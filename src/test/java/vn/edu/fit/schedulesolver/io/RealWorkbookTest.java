package vn.edu.fit.schedulesolver.io;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.service.Convention;
import vn.edu.fit.schedulesolver.service.GridTimetable;
import vn.edu.fit.schedulesolver.service.GridTimetableConverter;
import vn.edu.fit.schedulesolver.service.PlanBuilder;
import vn.edu.fit.schedulesolver.service.ScheduleService;
import vn.edu.fit.schedulesolver.solver.TimetableMetrics;

/** Test với file Excel thật của khoa và các CSV mặc định. */
class RealWorkbookTest {
    private static final File WORKBOOK = new File("resources/FIT Time table Fall2026 V5.2.xlsx");
    private static final File TEACHERS = new File("resources/giang_vien.csv");
    private static final File RULES = new File("resources/quy_uoc_phan_cong.csv");

    @TempDir
    File folder;

    @Test
    void planSheetBecomesSessionsCoveredByDefaultConvention() throws IOException {
        PlanExcelReader reader = new PlanExcelReader();
        List<PlanRow> rows = reader.read(WORKBOOK);
        assertEquals(290, rows.size());
        assertTrue(reader.getWarnings().isEmpty());

        List<PlanSession> plan = new PlanBuilder().build(rows);
        assertEquals(236, plan.size());

        List<Teacher> teachers = DataFiles.readTeachers(TEACHERS);
        List<TeachingRule> rules = DataFiles.readRules(RULES);
        List<String> problems = new Convention(rules).checkPlan(plan, teachers);
        assertTrue(problems.isEmpty(), "Quy ước mặc định phải phủ hết kế hoạch: " + problems);
    }

    @Test
    void manualGridIsConvertedAndMeasured() throws IOException {
        GridExcelReader reader = new GridExcelReader();
        List<GridCell> cells = reader.read(WORKBOOK);
        assertEquals(246, cells.size());

        List<Teacher> teachers = DataFiles.readTeachers(TEACHERS);
        GridTimetable grid = new GridTimetableConverter().convert(cells, teachers);
        // 186 buổi ghi đủ mã GV + 4 buổi chỉ ghi "Dung"
        assertEquals(190, grid.getSessions().size());
        assertTrue(grid.getTeacherCodes().contains("Dung"));
        assertTrue(grid.getTeacherCodes().contains("DungVT"), "Dung và DungVT là hai người");
        // ô không rõ giảng viên phải có cảnh báo
        assertTrue(grid.getWarnings().size() > 0);

        Workspace workspace = new Workspace();
        workspace.getTeachers().addAll(teachers);
        workspace.getPlan().addAll(grid.getSessions());
        workspace.getRules().addAll(DataFiles.readRules(RULES));
        TimetableMetrics metrics = new ScheduleService().evaluate(workspace, grid.getAssignments());
        assertEquals(190, grid.getAssignments().size());
        // TKB cũ có đúng 1 chỗ trùng lịch, ở lớp CLC01 K25
        assertEquals(1, metrics.getScore().getHard());
        assertEquals(1, metrics.countViolations(vn.edu.fit.schedulesolver.solver.Verifier.RULE_CLASS_CLASH));
    }

    @Test
    void exportedExcelHasTwoTimetableSheetsInFacultyLayout() throws Exception {
        Workspace workspace = new Workspace();
        workspace.getTeachers().addAll(DataFiles.readTeachers(TEACHERS));
        GridTimetable grid = new GridTimetableConverter().convert(new GridExcelReader().read(WORKBOOK), workspace.getTeachers());
        workspace.getPlan().addAll(grid.getSessions());
        List<Assignment> assignments = new ArrayList<>(grid.getAssignments());
        TimetableMetrics metrics = new ScheduleService().evaluate(workspace, assignments);

        File file = new File(folder, "tkb.xlsx");
        new ExcelExporter().export(file, workspace, assignments, metrics, "Thử xuất");
        try (InputStream input = new FileInputStream(file); Workbook book = WorkbookFactory.create(input)) {
            assertEquals(4, book.getNumberOfSheets());
            assertEquals(ExcelExporter.REGULAR_SHEET, book.getSheetName(0));
            assertEquals(ExcelExporter.ADVANCED_SHEET, book.getSheetName(1));
            assertEquals(assignments.size(), book.getSheet("Danh sách").getLastRowNum());

            // sheet IT và MME theo mẫu của khoa, khối LECTURE bắt đầu từ dòng 7
            Sheet regular = book.getSheet(ExcelExporter.REGULAR_SHEET);
            assertEquals("Color code:", regular.getRow(4).getCell(2).getStringCellValue());
            assertEquals("Monday", regular.getRow(5).getCell(3).getStringCellValue());
            assertEquals("Tiết BĐ", regular.getRow(5).getCell(9).getStringCellValue());
            assertEquals("LECTURE", regular.getRow(6).getCell(0).getStringCellValue());
            assertEquals("Morning", regular.getRow(6).getCell(1).getStringCellValue());
            assertEquals("07:10 - 09:15", regular.getRow(6).getCell(2).getStringCellValue());
            assertTrue(hasBlock(regular, "TUTORIAL"));
            // sheet CLC và Tiên tiến chỉ có một khối
            Sheet advanced = book.getSheet(ExcelExporter.ADVANCED_SHEET);
            assertEquals("CLC / TIÊN TIẾN", advanced.getRow(6).getCell(0).getStringCellValue());

            // hai sheet cộng lại phải đủ số ô, buổi 2 ca tính 2 ô
            int expectedCells = 0;
            for (Assignment assignment : assignments) {
                expectedCells += workspace.findSession(assignment.getSessionId()).getSlotCount();
            }
            assertEquals(expectedCells, countSessionCells(regular) + countSessionCells(advanced));
        }
    }

    private static boolean hasBlock(Sheet sheet, String name) {
        for (int r = 6; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row.getCell(0) != null && row.getCell(0).getStringCellValue().equals(name)) {
                return true;
            }
        }
        return false;
    }

    /** Đếm ô có 2 dòng chữ ở các cột Monday..Saturday. */
    private static int countSessionCells(Sheet sheet) {
        int count = 0;
        for (int r = 6; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            for (int c = 3; c <= 8; c++) {
                if (row.getCell(c) != null && row.getCell(c).getStringCellValue().contains("\n")) {
                    count++;
                }
            }
        }
        return count;
    }
}
