package vn.edu.fit.schedulesolver.solver;

/** Leo đồi: chỉ nhận bước đi không làm điểm tệ hơn, nhận cả bước đi ngang để thoát vùng bằng phẳng. */
public class HillClimbing extends LocalSearch {

    public HillClimbing(Problem problem, long seed) {
        super(problem, seed);
    }

    @Override
    public String getName() {
        return "Hill Climbing";
    }

    @Override
    protected void doStep() {
        Move move = randomMove();
        if (move == null) {
            return;
        }
        long delta = applyAndGetDelta(move);
        if (delta <= 0) {
            currentCost += delta;
        } else {
            move.undo(current);
        }
    }
}
