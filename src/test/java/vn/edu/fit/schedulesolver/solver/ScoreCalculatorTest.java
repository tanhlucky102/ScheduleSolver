package vn.edu.fit.schedulesolver.solver;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.junit.jupiter.api.Test;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;

/** Test ScoreCalculator trên ví dụ nhỏ tính tay được. */
class ScoreCalculatorTest {

    @Test
    void dayMaskCountsSlotsAndGaps() {
        // ca 0, 1, 3: 3 ca, 1 ca trống
        int mask = 0b001011;
        assertEquals(3, DayMask.countSlots(mask));
        assertEquals(1, DayMask.countGaps(mask));
        assertEquals(0, DayMask.countGaps(0));
        assertEquals(0, DayMask.countGaps(0b000100));
    }

    @Test
    void sameTeacherAtSameTimeIsOneHardViolation() {
        List<PlanSession> sessions = new ArrayList<>();
        sessions.add(TestProblems.session("A", "61FIT3AAA", "K24", "01", SessionKind.TUTORIAL));
        sessions.add(TestProblems.session("B", "61FIT3BBB", "K23", "01", SessionKind.TUTORIAL));
        Problem problem = TestProblems.problem(sessions, TestProblems.teachers(1), new ArrayList<>(), "GV0");
        Solution solution = new Solution(2);
        solution.place(0, 0, 2, 0);
        solution.place(1, 0, 2, 0);
        assertEquals(1, new ScoreCalculator(problem).calculate(solution).getHard());
    }

    @Test
    void lectureClashWithOwnTutorialIsHardButOtherCourseIsSoft() {
        List<PlanSession> sessions = new ArrayList<>();
        sessions.add(TestProblems.session("LEC", "61FIT3DBS", "K24", "", SessionKind.LECTURE));
        sessions.add(TestProblems.session("TUT", "61FIT3DBS", "K24", "01", SessionKind.TUTORIAL));
        sessions.add(TestProblems.session("OTHER", "61FIT3SAD", "K24", "01", SessionKind.TUTORIAL));
        sessions.add(TestProblems.session("OLD", "61FIT4MLA", "K23", "01", SessionKind.TUTORIAL));
        Problem problem = TestProblems.problem(sessions, TestProblems.teachers(4), new ArrayList<>(), "GV0");
        assertEquals(Problem.HARD_CONFLICT, problem.getStudentConflict(0, 1));
        assertEquals(Problem.SOFT_CONFLICT, problem.getStudentConflict(0, 2));
        assertEquals(Problem.NO_CONFLICT, problem.getStudentConflict(0, 3));
        assertEquals(Problem.NO_CONFLICT, problem.getStudentConflict(1, 2));
    }

    @Test
    void tutorialBelongsToItsOwnLectureSection() {
        PlanSession lectureA = TestProblems.session("A", "61MME4ADC", "K23", "A", SessionKind.LECTURE);
        PlanSession lectureB = TestProblems.session("B", "61MME4ADC", "K23", "B", SessionKind.LECTURE);
        PlanSession tutorialB = TestProblems.session("B01", "61MME4ADC", "K23", "B01", SessionKind.TUTORIAL);
        assertEquals(Problem.NO_CONFLICT, Problem.studentConflictType(lectureA, tutorialB));
        assertEquals(Problem.HARD_CONFLICT, Problem.studentConflictType(lectureB, tutorialB));
    }

    @Test
    void clcClassIsFixedButTtGroupIsNot() {
        PlanSession clcA = TestProblems.session("C1", "62FIT3DBS", "K24", "CLC01", SessionKind.LEC_TUT);
        PlanSession clcB = TestProblems.session("C2", "62FIT3SAD", "K24", "CLC01", SessionKind.LEC_TUT);
        PlanSession ttA = TestProblems.session("T1", "66FIT2POP", "K25", "TT01", SessionKind.LEC_TUT);
        PlanSession ttB = TestProblems.session("T2", "66FIT2DMA", "K25", "TT01", SessionKind.LEC_TUT);
        assertEquals(Problem.HARD_CONFLICT, Problem.studentConflictType(clcA, clcB));
        assertEquals(Problem.NO_CONFLICT, Problem.studentConflictType(ttA, ttB));
    }

    @Test
    void busySlotOfTeacherIsHard() {
        List<PlanSession> sessions = new ArrayList<>();
        sessions.add(TestProblems.session("A", "61FIT3AAA", "K24", "01", SessionKind.TUTORIAL));
        List<BusySlot> busy = new ArrayList<>();
        busy.add(new BusySlot("GV0", 3, 1, 2, "ĐH Thủy lợi", "riêng"));
        Problem problem = TestProblems.problem(sessions, TestProblems.teachers(1), busy, "GV0");
        Solution solution = new Solution(1);
        solution.place(0, 0, 3, 2);
        assertEquals(1, new ScoreCalculator(problem).calculate(solution).getHard());
        solution.place(0, 0, 3, 3);
        assertEquals(0, new ScoreCalculator(problem).calculate(solution).getHard());
    }

    @Test
    void softPenaltiesFollowTheWeights() {
        List<PlanSession> sessions = new ArrayList<>();
        sessions.add(TestProblems.session("A", "61FIT3AAA", "K24", "01", SessionKind.TUTORIAL));
        sessions.add(TestProblems.session("B", "61FIT3BBB", "K23", "01", SessionKind.TUTORIAL));
        sessions.add(TestProblems.session("C", "61FIT3CCC", "K25", "01", SessionKind.TUTORIAL));
        Problem problem = TestProblems.problem(sessions, TestProblems.teachers(1), new ArrayList<>(), "GV0");
        Solution solution = new Solution(3);
        // Thứ 2 ca 0 và 2: 1 ngày (5) + 1 ca trống (10)
        solution.place(0, 0, 2, 0);
        solution.place(1, 0, 2, 2);
        // Thứ 4 chỉ 1 ca: 1 ngày (5) + ngày 1 ca (15)
        solution.place(2, 0, 4, 1);
        Score score = new ScoreCalculator(problem).calculate(solution);
        assertEquals(0, score.getHard());
        assertEquals(5 + 10 + 5 + 15, score.getSoft());
    }

    @Test
    void overloadPerDayAndPerWeekArePenalised() {
        List<PlanSession> sessions = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            sessions.add(TestProblems.session("S" + i, "61FIT3A" + i + "A", "K2" + i, "01", SessionKind.TUTORIAL));
        }
        List<Teacher> teachers = new ArrayList<>();
        teachers.add(new Teacher("GV0", "", 4, 5));
        Problem problem = TestProblems.problem(sessions, teachers, new ArrayList<>(), "GV0");
        Solution solution = new Solution(6);
        for (int i = 0; i < 6; i++) {
            solution.place(i, 0, 2, i);
        }
        // 1 ngày (5), dư 2 ca/ngày (2 x 20), dư 1 ca/tuần (6)
        assertEquals(5 + 40 + 6, new ScoreCalculator(problem).calculate(solution).getSoft());
    }

    @Test
    void verifierAgreesWithScoreCalculatorOnRandomSolutions() {
        Problem problem = TestProblems.randomProblem(7);
        ScoreCalculator calculator = new ScoreCalculator(problem);
        Random random = new Random(3);
        // hai cách chấm phải ra cùng số lỗi cứng
        for (int round = 0; round < 50; round++) {
            Solution solution = new Solution(problem.getSessionCount());
            for (int i = 0; i < problem.getSessionCount(); i++) {
                int[] candidates = problem.getCandidates(i);
                int slot = problem.getSlotCount(i) == 1 ? random.nextInt(6) : 2 * random.nextInt(3);
                solution.place(i, candidates[random.nextInt(candidates.length)], 2 + random.nextInt(6), slot);
            }
            int verifierHard = Verifier.countHard(new Verifier(problem).verify(solution));
            assertEquals(calculator.calculate(solution).getHard(), verifierHard, "vòng " + round);
        }
    }
}
