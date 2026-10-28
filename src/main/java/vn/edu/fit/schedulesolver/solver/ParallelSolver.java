package vn.edu.fit.schedulesolver.solver;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/** Chạy nhiều thuật toán tìm kiếm song song trên thread pool rồi lấy lời giải tốt nhất. */
public class ParallelSolver {
    // volatile để các luồng giải thấy ngay khi người dùng bấm Dừng
    private volatile boolean stopRequested;

    // giao diện đọc mấy biến này để hiện tiến độ khi solve() đang chạy
    private volatile BestSolutionHolder holder;
    private volatile List<SolverWorker> workers = new ArrayList<>();
    private volatile long startMillis;

    /** Chạy bộ giải, chờ tới khi xong nên phải gọi trên luồng riêng (không gọi trên luồng giao diện). */
    public SolverResult solve(Problem problem, SolverConfig config) throws InterruptedException {
        stopRequested = false;
        startMillis = System.currentTimeMillis();

        ScoreCalculator calculator = new ScoreCalculator(problem);
        Solution initial = new GreedyBuilder(problem, calculator).build();
        Score initialScore = calculator.calculate(initial);
        BestSolutionHolder sharedBest = new BestSolutionHolder();
        sharedBest.offer(initial, initialScore.toCost(), "Tham lam (khởi tạo)");
        holder = sharedBest;

        long deadline = 0;
        if (config.getTimeLimitMillis() > 0) {
            deadline = startMillis + config.getTimeLimitMillis();
        }
        List<SolverWorker> newWorkers = new ArrayList<>();
        for (int i = 0; i < config.getThreadCount(); i++) {
            LocalSearch search = config.getAlgorithm().createSearch(problem, config.getSeed() + i, i);
            newWorkers.add(new SolverWorker(i, search, initial, this, sharedBest, config.getMaxIterations(), deadline));
        }
        workers = newWorkers;

        ExecutorService pool = Executors.newFixedThreadPool(config.getThreadCount());
        for (SolverWorker worker : newWorkers) {
            pool.execute(worker);
        }
        // không nhận việc mới, chờ các luồng xong
        pool.shutdown();
        try {
            while (!pool.awaitTermination(100, TimeUnit.MILLISECONDS)) {
                // chưa xong thì chờ tiếp
            }
        } catch (InterruptedException e) {
            stopRequested = true;
            pool.shutdownNow();
            throw e;
        }
        return collectResult(config, initial, initialScore, newWorkers);
    }

    private SolverResult collectResult(SolverConfig config, Solution initial, Score initialScore,
                                       List<SolverWorker> finished) {
        Solution best = initial;
        long bestCost = initialScore.toCost();
        String foundBy = "Tham lam (khởi tạo)";
        List<SolverResult.WorkerInfo> infos = new ArrayList<>();
        for (SolverWorker worker : finished) {
            long cost = worker.getResultCost();
            infos.add(new SolverResult.WorkerInfo(worker.getLabel(), worker.getThreadName(),
                    worker.getIterations(), Score.fromCost(cost)));
            // dùng < để hòa điểm thì giữ luồng số nhỏ hơn, không phụ thuộc luồng nào xong trước
            if (worker.getResultSolution() != null && cost < bestCost) {
                best = worker.getResultSolution();
                bestCost = cost;
                foundBy = worker.getLabel();
            }
        }
        long elapsed = System.currentTimeMillis() - startMillis;
        return new SolverResult(config, best.copy(), Score.fromCost(bestCost), initialScore,
                elapsed, stopRequested, foundBy, infos);
    }

    public void requestStop() {
        stopRequested = true;
    }

    public boolean isStopRequested() {
        return stopRequested;
    }

    /** null nếu chưa có lời giải ban đầu. */
    public Score getCurrentBestScore() {
        BestSolutionHolder current = holder;
        if (current == null) {
            return null;
        }
        return current.getBestScore();
    }

    public String getCurrentBestFoundBy() {
        BestSolutionHolder current = holder;
        if (current == null) {
            return "";
        }
        return current.getFoundBy();
    }

    public long getTotalIterations() {
        long total = 0;
        for (SolverWorker worker : workers) {
            total += worker.getIterations();
        }
        return total;
    }

    public long getElapsedMillis() {
        return System.currentTimeMillis() - startMillis;
    }
}
