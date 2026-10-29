package vn.edu.fit.schedulesolver.solver;

/**
 * Tabu Search: mỗi vòng thử nhiều bước rồi chọn bước tốt nhất kể cả khi tệ hơn.
 * Buổi vừa di chuyển bị cấm vài vòng cho khỏi quay lại chỗ cũ, trừ khi bước đó cho điểm tốt nhất từ trước tới giờ.
 */
public class TabuSearch extends LocalSearch {
    static final int CANDIDATES_PER_STEP = 50;
    private static final int TABU_TENURE = 10;

    // tabuUntil[i]: buổi i bị cấm di chuyển cho tới vòng này
    private final long[] tabuUntil;

    public TabuSearch(Problem problem, long seed) {
        super(problem, seed);
        tabuUntil = new long[problem.getSessionCount()];
    }

    @Override
    public String getName() {
        return "Tabu Search";
    }

    @Override
    public int getMovesPerStep() {
        return CANDIDATES_PER_STEP;
    }

    @Override
    protected void doStep() {
        Move chosen = null;
        long chosenDelta = Long.MAX_VALUE;
        for (int k = 0; k < CANDIDATES_PER_STEP; k++) {
            Move move = randomMove();
            if (move == null) {
                return;
            }
            long delta = applyAndGetDelta(move);
            move.undo(current);
            boolean aspiration = currentCost + delta < getBestCost();
            if ((!isTabu(move) || aspiration) && delta < chosenDelta) {
                chosen = move;
                chosenDelta = delta;
            }
        }
        if (chosen == null) {
            return;
        }
        chosen.apply(current);
        currentCost += chosenDelta;
        for (int session : chosen.getSessionIds()) {
            tabuUntil[session] = getIterations() + TABU_TENURE;
        }
    }

    private boolean isTabu(Move move) {
        for (int session : move.getSessionIds()) {
            if (tabuUntil[session] > getIterations()) {
                return true;
            }
        }
        return false;
    }
}
