package vn.edu.fit.schedulesolver.solver;

/** Các thuật toán cho giáo vụ chọn khi xếp lịch. */
public enum Algorithm {
    HILL_CLIMBING("Local Search (leo đồi)"),
    SIMULATED_ANNEALING("Simulated Annealing"),
    TABU_SEARCH("Tabu Search"),
    PORTFOLIO("Kết hợp cả 3 thuật toán");

    private final String displayName;

    Algorithm(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /** Tạo thuật toán cho luồng thứ workerIndex; chế độ kết hợp thì chia lần lượt SA, Tabu, leo đồi. */
    public LocalSearch createSearch(Problem problem, long seed, int workerIndex) {
        switch (this) {
            case HILL_CLIMBING:
                return new HillClimbing(problem, seed);
            case SIMULATED_ANNEALING:
                return new SimulatedAnnealing(problem, seed);
            case TABU_SEARCH:
                return new TabuSearch(problem, seed);
            default:
                Algorithm[] basic = {SIMULATED_ANNEALING, TABU_SEARCH, HILL_CLIMBING};
                return basic[workerIndex % basic.length].createSearch(problem, seed, workerIndex);
        }
    }

    @Override
    public String toString() {
        return displayName;
    }
}
