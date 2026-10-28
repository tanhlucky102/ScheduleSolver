package vn.edu.fit.schedulesolver.solver;

import java.util.Random;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/**
 * Lớp cha của 3 thuật toán tìm kiếm cục bộ, lớp con chỉ cần viết doStep().
 * Mỗi đối tượng chỉ một luồng dùng (lời giải, Random riêng) nên không cần synchronized.
 */
public abstract class LocalSearch {
    protected final Problem problem;
    protected final ScoreCalculator calculator;
    protected final Random random;

    protected Solution current;
    protected long currentCost;

    private Solution best;
    private long bestCost;
    private long iterations;

    protected LocalSearch(Problem problem, long seed) {
        this.problem = problem;
        this.calculator = new ScoreCalculator(problem);
        this.random = new Random(seed);
    }

    public abstract String getName();

    /** Lớp con nhớ cập nhật current và currentCost. */
    protected abstract void doStep();

    public void start(Solution initial) {
        current = initial.copy();
        currentCost = calculator.calculate(current).toCost();
        best = current.copy();
        bestCost = currentCost;
        iterations = 0;
    }

    public final void step() {
        doStep();
        iterations++;
        if (currentCost < bestCost) {
            bestCost = currentCost;
            best = current.copy();
        }
    }

    /** Trả về null nếu buổi nào cũng bị cố định. */
    protected Move randomMove() {
        int[] movable = problem.getMovableSessions();
        if (movable.length == 0) {
            return null;
        }
        int session = movable[random.nextInt(movable.length)];
        int type = random.nextInt(10);

        // 20%: đổi giảng viên
        int[] candidates = problem.getCandidates(session);
        if (type < 2 && candidates.length > 1) {
            int teacher = candidates[random.nextInt(candidates.length)];
            if (teacher != current.getTeacher(session)) {
                return new ChangeTeacherMove(session, teacher);
            }
        }
        // 30%: đổi giờ với một buổi khác cùng số ca
        if (type < 5 && movable.length > 1) {
            int other = movable[random.nextInt(movable.length)];
            if (other != session && problem.getSlotCount(other) == problem.getSlotCount(session)) {
                return new SwapTimeMove(session, other);
            }
        }
        // còn lại: chuyển sang ngày, ca ngẫu nhiên
        int day = TimeSlots.FIRST_DAY + random.nextInt(TimeSlots.LAST_DAY - TimeSlots.FIRST_DAY + 1);
        int slot = randomStartSlot(problem.getSlotCount(session));
        return new ChangeTimeMove(session, day, slot);
    }

    private int randomStartSlot(int slotCount) {
        if (slotCount == 1) {
            return random.nextInt(TimeSlots.SLOTS_PER_DAY);
        }
        // buổi 2 ca chỉ bắt đầu ở ca 0, 2, 4 (đầu buổi sáng, chiều, tối)
        return 2 * random.nextInt(TimeSlots.SLOTS_PER_DAY / 2);
    }

    /** Áp dụng bước đi, trả về điểm chênh lệch (âm là tốt hơn), chỉ tính lại phần bị ảnh hưởng. */
    protected long applyAndGetDelta(Move move) {
        int[] sessions = move.getSessionIds();
        int[] teachers = move.getAffectedTeachers(current);
        long before = calculator.localCost(current, sessions, teachers);
        move.apply(current);
        long after = calculator.localCost(current, sessions, teachers);
        return after - before;
    }

    public Solution getBestSolution() {
        return best;
    }

    public long getBestCost() {
        return bestCost;
    }

    public long getCurrentCost() {
        return currentCost;
    }

    public Solution getCurrentSolution() {
        return current;
    }

    public long getIterations() {
        return iterations;
    }
}
