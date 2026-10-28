package vn.edu.fit.schedulesolver.solver;

/** Điểm cứng và điểm mềm của TKB, càng nhỏ càng tốt, so điểm cứng trước. */
public class Score implements Comparable<Score> {
    // nhân 1 triệu để 1 lỗi cứng luôn nặng hơn cả tổng điểm mềm
    public static final long HARD_WEIGHT = 1_000_000L;

    private final int hard;
    private final int soft;

    public Score(int hard, int soft) {
        this.hard = hard;
        this.soft = soft;
    }

    /** Tách cost ngược lại thành hai điểm. */
    public static Score fromCost(long cost) {
        int hard = (int) (cost / HARD_WEIGHT);
        int soft = (int) (cost % HARD_WEIGHT);
        return new Score(hard, soft);
    }

    public int getHard() {
        return hard;
    }

    public int getSoft() {
        return soft;
    }

    /** Gộp hai điểm thành một số long để so sánh cho nhanh. */
    public long toCost() {
        return hard * HARD_WEIGHT + soft;
    }

    public boolean isFeasible() {
        return hard == 0;
    }

    @Override
    public int compareTo(Score other) {
        if (hard != other.hard) {
            return Integer.compare(hard, other.hard);
        }
        return Integer.compare(soft, other.soft);
    }

    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof Score)) {
            return false;
        }
        Score other = (Score) obj;
        return hard == other.hard && soft == other.soft;
    }

    @Override
    public int hashCode() {
        return hard * 31 + soft;
    }

    @Override
    public String toString() {
        return "cứng = " + hard + ", mềm = " + soft;
    }
}
