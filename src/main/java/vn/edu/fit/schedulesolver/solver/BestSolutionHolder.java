package vn.edu.fit.schedulesolver.solver;

import java.util.ArrayList;
import java.util.List;

/** Lời giải tốt nhất dùng chung giữa các luồng, các hàm đều synchronized để hai luồng không ghi đè lên nhau. */
public class BestSolutionHolder {

    /** Mốc ghi nhận điểm cải thiện theo thời gian. */
    public static class Milestone {
        private final long elapsedMillis;
        private final long cost;
        private final String foundBy;

        public Milestone(long elapsedMillis, long cost, String foundBy) {
            this.elapsedMillis = elapsedMillis;
            this.cost = cost;
            this.foundBy = foundBy;
        }

        public long getElapsedMillis() {
            return elapsedMillis;
        }

        public long getCost() {
            return cost;
        }

        public Score getScore() {
            return Score.fromCost(cost);
        }

        public String getFoundBy() {
            return foundBy;
        }
    }

    private Solution bestSolution;
    private long bestCost = Long.MAX_VALUE;
    private String foundBy = "";
    private final long startMillis;
    private final List<Milestone> milestones = new ArrayList<>();

    public BestSolutionHolder() {
        this(System.currentTimeMillis());
    }

    public BestSolutionHolder(long startMillis) {
        this.startMillis = startMillis;
    }

    /** Chỉ thay khi lời giải mới tốt hơn hẳn, trả về true nếu đã thay. */
    public synchronized boolean offer(Solution candidate, long cost, String workerName) {
        if (cost >= bestCost) {
            return false;
        }
        // lưu bản sao vì luồng giải vẫn tiếp tục sửa lời giải của nó
        bestSolution = candidate.copy();
        bestCost = cost;
        foundBy = workerName;
        milestones.add(new Milestone(Math.max(0, System.currentTimeMillis() - startMillis), cost, workerName));
        return true;
    }

    public synchronized List<Milestone> getMilestones() {
        return new ArrayList<>(milestones);
    }

    public synchronized Solution getBestSolution() {
        if (bestSolution == null) {
            return null;
        }
        return bestSolution.copy();
    }

    public synchronized long getBestCost() {
        return bestCost;
    }

    public synchronized Score getBestScore() {
        if (bestSolution == null) {
            return null;
        }
        return Score.fromCost(bestCost);
    }

    public synchronized String getFoundBy() {
        return foundBy;
    }
}
