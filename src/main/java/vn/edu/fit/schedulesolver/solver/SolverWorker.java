package vn.edu.fit.schedulesolver.solver;

/** Việc của một luồng giải: chạy một thuật toán tới khi hết giờ, đủ số vòng hoặc bị Dừng. */
public class SolverWorker implements Runnable {
    // 128 vòng mới xem đồng hồ một lần cho đỡ tốn
    private static final int CHECK_INTERVAL = 128;

    private final int index;
    private final LocalSearch search;
    private final Solution initial;
    private final ParallelSolver owner;
    private final BestSolutionHolder sharedBest;
    private final long maxIterations;
    private final long deadlineMillis;

    // volatile vì luồng giao diện đọc để hiện tiến độ
    private volatile long iterations;

    // luồng giải ghi, luồng khác đọc nên đi qua hàm synchronized
    private Solution resultSolution;
    private long resultCost = Long.MAX_VALUE;
    private String threadName = "";

    public SolverWorker(int index, LocalSearch search, Solution initial, ParallelSolver owner,
                        BestSolutionHolder sharedBest, long maxIterations, long deadlineMillis) {
        this.index = index;
        this.search = search;
        this.initial = initial;
        this.owner = owner;
        this.sharedBest = sharedBest;
        this.maxIterations = maxIterations;
        this.deadlineMillis = deadlineMillis;
    }

    @Override
    public void run() {
        String name = Thread.currentThread().getName();
        search.start(initial);
        long lastShared = search.getBestCost();
        while (!shouldStop()) {
            search.step();
            if (search.getIterations() % CHECK_INTERVAL == 0) {
                iterations = search.getIterations();
            }
            if (search.getBestCost() < lastShared) {
                lastShared = search.getBestCost();
                sharedBest.offer(search.getBestSolution(), lastShared, getLabel());
            }
        }
        iterations = search.getIterations();
        saveResult(search.getBestSolution(), search.getBestCost(), name);
    }

    private boolean shouldStop() {
        if (owner.isStopRequested()) {
            return true;
        }
        if (maxIterations > 0 && search.getIterations() >= maxIterations) {
            return true;
        }
        if (deadlineMillis > 0 && search.getIterations() % CHECK_INTERVAL == 0) {
            return System.currentTimeMillis() >= deadlineMillis;
        }
        return false;
    }

    private synchronized void saveResult(Solution solution, long cost, String name) {
        resultSolution = solution;
        resultCost = cost;
        threadName = name;
    }

    public synchronized Solution getResultSolution() {
        return resultSolution;
    }

    public synchronized long getResultCost() {
        return resultCost;
    }

    public synchronized String getThreadName() {
        return threadName;
    }

    public long getIterations() {
        return iterations;
    }

    public String getLabel() {
        return "Luồng " + (index + 1) + " (" + search.getName() + ")";
    }
}
