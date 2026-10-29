package vn.edu.fit.schedulesolver.solver;

/**
 * Cấu hình một lần chạy. Chế độ tái lập: chỉ giới hạn theo số bước thử (không theo giờ) thì cùng seed,
 * số luồng, số bước thử sẽ ra cùng kết quả. Chạy theo giờ thì máy nhanh chậm khác nhau nên kết quả có thể khác.
 */
public class SolverConfig {
    private final Algorithm algorithm;
    private final int threadCount;
    private final long timeLimitMillis;
    private final long maxIterations;
    private final long seed;

    public SolverConfig(Algorithm algorithm, int threadCount, long timeLimitMillis, long maxIterations, long seed) {
        if (algorithm == null) {
            throw new IllegalArgumentException("Chưa chọn thuật toán.");
        }
        if (threadCount < 1 || threadCount > 64) {
            throw new IllegalArgumentException("Số luồng phải từ 1 đến 64.");
        }
        if (timeLimitMillis <= 0 && maxIterations <= 0) {
            throw new IllegalArgumentException("Cần giới hạn thời gian hoặc số vòng lặp.");
        }
        this.algorithm = algorithm;
        this.threadCount = threadCount;
        this.timeLimitMillis = timeLimitMillis;
        this.maxIterations = maxIterations;
        this.seed = seed;
    }

    public Algorithm getAlgorithm() {
        return algorithm;
    }

    public int getThreadCount() {
        return threadCount;
    }

    public long getTimeLimitMillis() {
        return timeLimitMillis;
    }

    public long getMaxIterations() {
        return maxIterations;
    }

    public long getSeed() {
        return seed;
    }

    /**
     * true nếu chỉ dừng theo số bước thử: mỗi luồng có Random riêng theo seed và không đọc lời giải của luồng khác,
     * nên kết quả không phụ thuộc tốc độ máy hay luồng nào chạy trước.
     */
    public boolean isDeterministic() {
        return maxIterations > 0 && timeLimitMillis <= 0;
    }

    @Override
    public String toString() {
        String limit = maxIterations > 0 ? maxIterations + " bước thử/luồng" : (timeLimitMillis / 1000.0) + " giây";
        return algorithm.getDisplayName() + ", " + threadCount + " luồng, " + limit + ", seed " + seed;
    }
}
