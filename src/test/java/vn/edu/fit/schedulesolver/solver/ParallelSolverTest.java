package vn.edu.fit.schedulesolver.solver;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

/** Test phần đa luồng của bộ giải. */
class ParallelSolverTest {

    @Test
    void workersRunOnDifferentThreadsAndBestIsTheMinimum() throws InterruptedException {
        Problem problem = TestProblems.randomProblem(21);
        SolverResult result = new ParallelSolver().solve(problem,
                new SolverConfig(Algorithm.PORTFOLIO, 4, 0, 20_000, 1));

        Set<String> threadNames = new HashSet<>();
        for (SolverResult.WorkerInfo worker : result.getWorkers()) {
            threadNames.add(worker.getThreadName());
            assertEquals(20_000, worker.getIterations());
            // kết quả chung không được tệ hơn luồng nào
            assertTrue(result.getBestScore().compareTo(worker.getBestScore()) <= 0);
        }
        assertEquals(4, threadNames.size(), "4 luồng phải chạy trên 4 thread khác nhau");
        assertTrue(result.getBestScore().compareTo(result.getInitialScore()) <= 0);
        Score recalculated = new ScoreCalculator(problem).calculate(result.getBestSolution());
        assertEquals(recalculated, result.getBestScore());
    }

    @Test
    void sameSeedAndIterationBudgetGiveSameResult() throws InterruptedException {
        Problem problem = TestProblems.randomProblem(22);
        for (int threads : new int[] {1, 4}) {
            SolverConfig config = new SolverConfig(Algorithm.PORTFOLIO, threads, 0, 15_000, 99);
            SolverResult first = new ParallelSolver().solve(problem, config);
            for (int run = 0; run < 2; run++) {
                SolverResult again = new ParallelSolver().solve(problem, config);
                assertEquals(first.getBestScore(), again.getBestScore());
                assertTrue(first.getBestSolution().sameAs(again.getBestSolution()), threads + " luồng, lần " + run);
            }
        }
    }

    @Test
    void stopRequestEndsAllWorkersQuickly() throws InterruptedException {
        Problem problem = TestProblems.randomProblem(23);
        ParallelSolver solver = new ParallelSolver();
        List<SolverResult> holder = new ArrayList<>();
        Thread runner = new Thread(() -> {
            try {
                SolverResult result = solver.solve(problem, new SolverConfig(Algorithm.SIMULATED_ANNEALING, 4, 60_000, 0, 1));
                synchronized (holder) {
                    holder.add(result);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        // cho chạy 60 giây nhưng sau 0,5 giây thì bấm Dừng
        long start = System.currentTimeMillis();
        runner.start();
        Thread.sleep(500);
        solver.requestStop();
        runner.join(5000);
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 5000, "phải dừng trong vài giây, mất " + elapsed + " ms");
        synchronized (holder) {
            assertEquals(1, holder.size());
            assertTrue(holder.get(0).isStoppedByUser());
        }
    }

    // 8 luồng cùng gọi offer(), cuối cùng holder phải giữ đúng điểm nhỏ nhất
    @Test
    void bestSolutionHolderKeepsMinimumUnderConcurrentOffers() throws InterruptedException {
        BestSolutionHolder holder = new BestSolutionHolder();
        Solution dummy = new Solution(1);
        int threadCount = 8;
        int offersPerThread = 1000;
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        for (int t = 0; t < threadCount; t++) {
            final int index = t;
            pool.execute(() -> {
                Random random = new Random(index);
                for (int k = 0; k < offersPerThread; k++) {
                    holder.offer(dummy, 1000 + random.nextInt(1_000_000), "luồng " + index);
                }
            });
        }
        pool.shutdown();
        assertTrue(pool.awaitTermination(10, TimeUnit.SECONDS));
        // sinh lại dãy số cùng seed để tính giá trị nhỏ nhất mong đợi
        long expected = Long.MAX_VALUE;
        for (int t = 0; t < threadCount; t++) {
            Random random = new Random(t);
            for (int k = 0; k < offersPerThread; k++) {
                expected = Math.min(expected, 1000 + random.nextInt(1_000_000));
            }
        }
        assertEquals(expected, holder.getBestCost());
    }
}
