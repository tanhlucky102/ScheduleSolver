package vn.edu.fit.schedulesolver.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import vn.edu.fit.schedulesolver.io.PlanRow;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;

/** Test việc chia buổi theo chương trình và quy ước phân công. */
class PlanAndConventionTest {

    private static PlanRow row(String code, int students, int periods) {
        return new PlanRow(1, code, "Môn " + code, students, 2024, 1, periods);
    }

    @Test
    void regularProgramSplitsLectureAndTutorials() {
        List<PlanRow> rows = new ArrayList<>();
        rows.add(row("61FIT3DBS", 200, 2));
        rows.add(row("61FIT3DBS", 30, 2));
        rows.add(row("61FIT3DBS", 30, 2));
        List<PlanSession> sessions = new PlanBuilder().build(rows);
        assertEquals(3, sessions.size());
        assertEquals("61FIT3DBS-LEC", sessions.get(0).getId());
        assertEquals(SessionKind.LECTURE, sessions.get(0).getKind());
        assertEquals("61FIT3DBS-TUT-02", sessions.get(2).getId());
        assertEquals("K24", sessions.get(1).getCohort());
    }

    @Test
    void secondLectureOwnsTheTutorialsAfterIt() {
        List<PlanRow> rows = new ArrayList<>();
        rows.add(row("61FIT3SAD", 100, 2));
        rows.add(row("61FIT3SAD", 30, 2));
        rows.add(row("61FIT3SAD", 70, 2));
        rows.add(row("61FIT3SAD", 30, 2));
        List<PlanSession> sessions = new PlanBuilder().build(rows);
        assertEquals("01", sessions.get(1).getGroup());
        assertEquals("B", sessions.get(2).getGroup());
        assertEquals("B02", sessions.get(3).getGroup());
    }

    @Test
    void clcRowsArePairedIntoLecTutBlocks() {
        List<PlanRow> rows = new ArrayList<>();
        for (int k = 0; k < 4; k++) {
            rows.add(row("62FIT4MLA", 30, 2));
        }
        List<PlanSession> sessions = new PlanBuilder().build(rows);
        assertEquals(2, sessions.size());
        assertEquals(SessionKind.LEC_TUT, sessions.get(0).getKind());
        assertEquals("CLC02", sessions.get(1).getGroup());
        assertEquals(2, sessions.get(1).getSlotCount());
    }

    @Test
    void oddClcRowsAreLecturesAndFourPeriodRowsAreCombined() {
        List<PlanRow> rows = new ArrayList<>();
        rows.add(row("66FIT2RES", 30, 2));
        rows.add(row("66FIT2RES", 30, 2));
        rows.add(row("66FIT2RES", 30, 2));
        rows.add(row("61FIT3SS1", 30, 4));
        rows.add(row("61MME9ZZZ", 30, 2));
        rows.add(row("99ABC1XYZ", 30, 2));
        PlanBuilder builder = new PlanBuilder();
        List<PlanSession> sessions = builder.build(rows);
        assertEquals(SessionKind.LECTURE, sessions.get(0).getKind());
        assertEquals("TT03", sessions.get(2).getGroup());
        assertEquals(SessionKind.COMBINED, sessions.get(3).getKind());
        assertEquals(5, sessions.size());
        assertEquals(1, builder.getWarnings().size(), "mã môn lạ phải được báo, không âm thầm bỏ");
    }

    @Test
    void conventionChoosesTeachersByKind() {
        List<TeachingRule> rules = new ArrayList<>();
        rules.add(new TeachingRule("61FIT3DBS", "", "NguyetDTM", true, true));
        rules.add(new TeachingRule("61FIT3DBS", "", "NgaNT", false, true));
        rules.add(new TeachingRule("62FIT3DBS", "", "NgaNT", true, false));
        Convention convention = new Convention(rules);
        PlanSession lecture = new PlanSession("L", "61FIT3DBS", "", "K24", "", SessionKind.LECTURE, 200);
        PlanSession tutorial = new PlanSession("T", "61FIT3DBS", "", "K24", "01", SessionKind.TUTORIAL, 30);
        PlanSession clc = new PlanSession("C", "62FIT3DBS", "", "K24", "CLC01", SessionKind.LEC_TUT, 30);
        assertEquals(List.of("NguyetDTM"), convention.candidatesFor(lecture));
        // luôn xếp A-Z dù thứ tự dòng quy ước khác
        assertEquals(List.of("NgaNT", "NguyetDTM"), convention.candidatesFor(tutorial));
        // buổi CLC cần GV dạy được cả Lec và Tut, NgaNT chỉ dạy Lec nên không được
        assertTrue(convention.candidatesFor(clc).isEmpty());

        List<Teacher> teachers = new ArrayList<>();
        teachers.add(new Teacher("NguyetDTM"));
        List<PlanSession> plan = List.of(lecture, tutorial, clc);
        List<String> problems = convention.checkPlan(plan, teachers);
        assertTrue(problems.get(0).contains("62FIT3DBS"));
        assertTrue(problems.get(problems.size() - 1).contains("NgaNT"), "GV chưa có trong danh sách phải được báo");
    }

    @Test
    void missingClcCourseGetsTeachersOfTheSameSubject() {
        List<TeachingRule> rules = new ArrayList<>();
        rules.add(new TeachingRule("61FIT4EIS", "", "NgocTB", true, false));
        PlanSession clc = new PlanSession("C", "62FIT4EIS", "Hệ thống thông tin DN", "K23", "CLC01", SessionKind.LEC_TUT, 30);
        new ConventionBuilder().fillMissingCourses(rules, List.of(clc));
        assertEquals(List.of("NgocTB"), new Convention(rules).candidatesFor(clc));
        assertEquals("Hệ thống thông tin DN", rules.get(1).getCourseName());
    }

    @Test
    void suggestionKeepsCurrentRulesWhenOldTimetableHasNoTeacher() {
        // TKB cũ chỉ ghi người dạy Lec của 61FIT3JSD, nhóm Tut không ghi ai
        List<TeachingRule> suggested = new ArrayList<>();
        suggested.add(new TeachingRule("61FIT3JSD", "", "QuyenNV", true, false));
        List<TeachingRule> current = new ArrayList<>();
        current.add(new TeachingRule("61FIT3JSD", "Java", "QuyenNV", true, true));
        current.add(new TeachingRule("61FIT3JSD", "Java", "AnhVQ", false, true));
        PlanSession tutorial = new PlanSession("T", "61FIT3JSD", "Java", "K24", "01", SessionKind.TUTORIAL, 30);

        int kept = new ConventionBuilder().keepCurrentRules(suggested, current, List.of(tutorial));

        assertEquals(2, kept);
        assertEquals(List.of("AnhVQ", "QuyenNV"), new Convention(suggested).candidatesFor(tutorial));
        assertEquals(2, suggested.size());
    }

    @Test
    void teacherIsRecognisedFromGridText() {
        List<Teacher> teachers = new ArrayList<>();
        Teacher thao = new Teacher("ThaoDTP");
        thao.addAlias("Thảo");
        teachers.add(thao);
        assertEquals("TuanVM", GridTimetableConverter.resolveTeacher("TuanVM (NgocTB) - 416 C", teachers));
        assertEquals("ThaoDTP", GridTimetableConverter.resolveTeacher("417C Thảo", teachers));
        assertEquals(null, GridTimetableConverter.resolveTeacher("- 402 C", teachers));
    }
}
