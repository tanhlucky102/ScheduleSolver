package vn.edu.fit.schedulesolver.solver;

import java.util.ArrayList;
import java.util.List;

/** Kết quả một lần chạy bộ giải và thông tin từng luồng. */
public class SolverResult {

    /** Tóm tắt kết quả của một luồng. */
    public static class WorkerInfo {
        private final String label;
        private final String threadName;
        private final long iterations;
        private final Score bestScore;

        public WorkerInfo(String label, String threadName, long iterations, Score bestScore) {
            this.label = label;
            this.threadName = threadName;
            this.iterations = iterations;
            this.bestScore = bestScore;
        }

        public String getLabel() {
            return label;
        }

        public String getThreadName() {
            return threadName;
        }

        public long getIterations() {
            return iterations;
        }

        public Score getBestScore() {
            return bestScore;
        }
    }

    private final SolverConfig config;
    private final Solution bestSolution;
    private final Score bestScore;
    private final Score initialScore;
    private final long elapsedMillis;
    private final boolean stoppedByUser;
    private final String bestFoundBy;
    private final List<WorkerInfo> workers = new ArrayList<>();

    public SolverResult(SolverConfig config, Solution bestSolution, Score bestScore, Score initialScore,
                        long elapsedMillis, boolean stoppedByUser, String bestFoundBy, List<WorkerInfo> workers) {
        this.config = config;
        this.bestSolution = bestSolution;
        this.bestScore = bestScore;
        this.initialScore = initialScore;
        this.elapsedMillis = elapsedMillis;
        this.stoppedByUser = stoppedByUser;
        this.bestFoundBy = bestFoundBy;
        this.workers.addAll(workers);
    }

    public Solution getBestSolution() {
        return bestSolution;
    }

    public Score getBestScore() {
        return bestScore;
    }

    public Score getInitialScore() {
        return initialScore;
    }

    public long getElapsedMillis() {
        return elapsedMillis;
    }

    public boolean isStoppedByUser() {
        return stoppedByUser;
    }

    /** Mã kiểm tra lời giải tốt nhất, chạy tái lập lại phải ra đúng mã này. */
    public String getFingerprint() {
        return bestSolution.fingerprint();
    }

    public List<WorkerInfo> getWorkers() {
        return workers;
    }

    public long getTotalIterations() {
        long total = 0;
        for (WorkerInfo worker : workers) {
            total += worker.getIterations();
        }
        return total;
    }

    /** Đoạn mô tả để hiện ở tab Đánh giá. */
    public String describe() {
        StringBuilder text = new StringBuilder();
        text.append("Cấu hình: ").append(config).append('\n');
        if (!config.isDeterministic()) {
            text.append("Chế độ: theo thời gian (số vòng phụ thuộc tốc độ máy, chạy lại có thể ra kết quả khác)\n");
        } else if (stoppedByUser) {
            text.append("Chế độ: tái lập, nhưng bị bấm Dừng giữa chừng nên chạy lại sẽ không ra đúng kết quả này\n");
        } else {
            text.append("Chế độ: tái lập (cùng seed, số luồng, số vòng thì luôn ra cùng kết quả)\n");
        }
        text.append("Mã kiểm tra kết quả: ").append(getFingerprint()).append('\n');
        text.append("Điểm ban đầu (tham lam): ").append(initialScore).append('\n');
        text.append("Điểm tốt nhất: ").append(bestScore).append("  - tìm bởi: ").append(bestFoundBy).append('\n');
        text.append("Thời gian chạy: ").append(elapsedMillis).append(" ms");
        if (stoppedByUser) {
            text.append(" (người dùng bấm Dừng)");
        }
        text.append('\n');
        text.append("Tổng số vòng lặp: ").append(getTotalIterations()).append('\n');
        for (WorkerInfo worker : workers) {
            text.append("  - ").append(worker.getLabel()).append(" [").append(worker.getThreadName()).append("]: ")
                    .append(worker.getIterations()).append(" vòng, tốt nhất ").append(worker.getBestScore()).append('\n');
        }
        return text.toString();
    }
}
