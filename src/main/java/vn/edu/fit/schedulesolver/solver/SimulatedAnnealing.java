package vn.edu.fit.schedulesolver.solver;

/**
 * Simulated Annealing: thỉnh thoảng nhận cả bước tệ hơn với xác suất exp(-delta / T), T giảm dần.
 * Khi T quá nhỏ thì đặt lại T ban đầu để thoát cực trị địa phương.
 */
public class SimulatedAnnealing extends LocalSearch {
    private static final double START_TEMPERATURE = 10.0;
    private static final double MIN_TEMPERATURE = 0.2;
    private static final double COOLING_RATE = 0.99999;

    private double temperature = START_TEMPERATURE;

    public SimulatedAnnealing(Problem problem, long seed) {
        super(problem, seed);
    }

    @Override
    public String getName() {
        return "Simulated Annealing";
    }

    @Override
    protected void doStep() {
        Move move = randomMove();
        if (move == null) {
            return;
        }
        long delta = applyAndGetDelta(move);
        if (delta <= 0 || random.nextDouble() < Math.exp(-delta / temperature)) {
            currentCost += delta;
        } else {
            move.undo(current);
        }
        temperature = temperature * COOLING_RATE;
        if (temperature < MIN_TEMPERATURE) {
            temperature = START_TEMPERATURE;
        }
    }
}
