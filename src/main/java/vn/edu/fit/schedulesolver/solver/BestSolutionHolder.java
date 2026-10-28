package vn.edu.fit.schedulesolver.solver;

/** Lời giải tốt nhất dùng chung giữa các luồng, các hàm đều synchronized để hai luồng không ghi đè lên nhau. */
public class BestSolutionHolder {
    private Solution bestSolution;
    private long bestCost = Long.MAX_VALUE;
    private String foundBy = "";

    /** Chỉ thay khi lời giải mới tốt hơn hẳn, trả về true nếu đã thay. */
    public synchronized boolean offer(Solution candidate, long cost, String workerName) {
        if (cost >= bestCost) {
            return false;
        }
        // lưu bản sao vì luồng giải vẫn tiếp tục sửa lời giải của nó
        bestSolution = candidate.copy();
        bestCost = cost;
        foundBy = workerName;
        return true;
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
