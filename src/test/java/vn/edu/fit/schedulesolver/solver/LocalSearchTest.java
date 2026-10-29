package vn.edu.fit.schedulesolver.solver;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.junit.jupiter.api.Test;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Test tính điểm cục bộ, tham lam và ba thuật toán tìm kiếm. */
class LocalSearchTest {

    // nhận hoặc undo ngẫu nhiên từng bước, điểm cộng dồn delta phải luôn bằng điểm chấm lại toàn bộ
    @Test
    void deltaScoreAlwaysMatchesFullRecalculation() {
        Problem problem = TestProblems.randomProblem(11);
        ScoreCalculator calculator = new ScoreCalculator(problem);
        HillClimbing search = new HillClimbing(problem, 5);
        search.start(new GreedyBuilder(problem, calculator).build());
        long trackedCost = search.getCurrentCost();
        Random random = new Random(9);
        for (int step = 0; step < 10_000; step++) {
            Move move = search.randomMove();
            long delta = search.applyAndGetDelta(move);
            if (random.nextBoolean()) {
                trackedCost += delta;
            } else {
                move.undo(search.getCurrentSolution());
            }
            long fullCost = calculator.calculate(search.getCurrentSolution()).toCost();
            assertEquals(fullCost, trackedCost, "Sai lệch ở bước " + step);
        }
    }

    @Test
    void greedyPlacesEverySessionAtAValidStart() {
        Problem problem = TestProblems.randomProblem(2);
        Solution solution = new GreedyBuilder(problem, new ScoreCalculator(problem)).build();
        for (int i = 0; i < problem.getSessionCount(); i++) {
            assertTrue(solution.isPlaced(i));
            assertTrue(problem.isCandidate(i, solution.getTeacher(i)));
            assertTrue(TimeSlots.isValidStart(solution.getSlot(i), problem.getSlotCount(i)));
        }
    }

    @Test
    void everyAlgorithmKeepsBestScoreConsistentAndNeverWorse() {
        Problem problem = TestProblems.randomProblem(4);
        ScoreCalculator calculator = new ScoreCalculator(problem);
        Solution initial = new GreedyBuilder(problem, calculator).build();
        long initialCost = calculator.calculate(initial).toCost();
        LocalSearch[] searches = {
            new HillClimbing(problem, 1), new SimulatedAnnealing(problem, 1), new TabuSearch(problem, 1)
        };
        for (LocalSearch search : searches) {
            search.start(initial);
            for (int step = 0; step < 20_000; step++) {
                search.step();
            }
            assertTrue(search.getBestCost() <= initialCost, search.getName());
            assertEquals(calculator.calculate(search.getBestSolution()).toCost(), search.getBestCost(), search.getName());
            assertEquals(calculator.calculate(search.getCurrentSolution()).toCost(), search.getCurrentCost(), search.getName());
        }
    }

    @Test
    void searchFindsFeasibleTimetableForSmallProblem() {
        Problem problem = TestProblems.randomProblem(8);
        SimulatedAnnealing search = new SimulatedAnnealing(problem, 3);
        search.start(new GreedyBuilder(problem, new ScoreCalculator(problem)).build());
        for (int step = 0; step < 50_000; step++) {
            search.step();
        }
        assertNotNull(search.getBestSolution());
        assertEquals(0, Score.fromCost(search.getBestCost()).getHard());
    }

    @Test
    void lockedSessionsAreNeverMoved() {
        Problem free = TestProblems.randomProblem(5);
        Map<String, List<String>> candidates = new HashMap<>();
        for (int i = 0; i < free.getSessionCount(); i++) {
            List<String> codes = new ArrayList<>();
            for (int t : free.getCandidates(i)) {
                codes.add(free.getTeacher(t).getCode());
            }
            candidates.put(free.getSession(i).getId(), codes);
        }
        List<Teacher> teachers = new ArrayList<>();
        for (int t = 0; t < free.getTeacherCount(); t++) {
            teachers.add(free.getTeacher(t));
        }
        String lockedTeacher = candidates.get(free.getSession(0).getId()).get(0);
        // cố định buổi 0 vào ca cuối thứ 7, chạy xong phải vẫn nằm nguyên chỗ đó
        List<Assignment> locked = new ArrayList<>();
        locked.add(new Assignment(free.getSession(0).getId(), lockedTeacher, 7, 5, true));
        Problem problem = new Problem(free.getSessions(), teachers, candidates, new ArrayList<>(), locked);

        TabuSearch search = new TabuSearch(problem, 1);
        search.start(new GreedyBuilder(problem, new ScoreCalculator(problem)).build());
        for (int step = 0; step < 5_000; step++) {
            search.step();
        }
        Solution best = search.getBestSolution();
        assertEquals(7, best.getDay(0));
        assertEquals(5, best.getSlot(0));
        assertEquals(lockedTeacher, problem.getTeacher(best.getTeacher(0)).getCode());
    }
}
