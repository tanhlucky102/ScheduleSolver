package vn.edu.fit.schedulesolver.solver;

import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Tạo lời giải ban đầu bằng tham lam: xếp buổi khó trước, mỗi buổi đặt vào chỗ làm tăng điểm ít nhất. */
public class GreedyBuilder {
    private final Problem problem;
    private final ScoreCalculator calculator;

    public GreedyBuilder(Problem problem, ScoreCalculator calculator) {
        this.problem = problem;
        this.calculator = calculator;
    }

    public Solution build() {
        Solution solution = new Solution(problem.getSessionCount());

        // buổi giáo vụ đã cố định thì giữ nguyên
        List<Integer> order = new ArrayList<>();
        for (int i = 0; i < problem.getSessionCount(); i++) {
            if (problem.isLocked(i)) {
                solution.place(i, problem.getLockedTeacher(i), problem.getLockedDay(i), problem.getLockedSlot(i));
            } else {
                order.add(i);
            }
        }

        order.sort((a, b) -> compareDifficulty(a, b));

        for (int i : order) {
            placeBest(solution, i);
        }
        return solution;
    }

    // buổi khó đứng trước: 2 ca, ít GV dạy được, đông sinh viên
    private int compareDifficulty(int a, int b) {
        if (problem.getSlotCount(a) != problem.getSlotCount(b)) {
            return problem.getSlotCount(b) - problem.getSlotCount(a);
        }
        if (problem.getCandidates(a).length != problem.getCandidates(b).length) {
            return problem.getCandidates(a).length - problem.getCandidates(b).length;
        }
        int studentsA = problem.getSession(a).getStudentCount();
        int studentsB = problem.getSession(b).getStudentCount();
        if (studentsA != studentsB) {
            return studentsB - studentsA;
        }
        return problem.getSession(a).getId().compareTo(problem.getSession(b).getId());
    }

    private void placeBest(Solution solution, int i) {
        if (problem.getCandidates(i).length == 0) {
            throw new IllegalStateException("Buổi " + problem.getSession(i).getId() + " chưa có giảng viên được phép dạy.");
        }
        int count = problem.getSlotCount(i);
        long bestCost = Long.MAX_VALUE;
        int bestTeacher = -1;
        int bestDay = -1;
        int bestSlot = -1;
        for (int teacher : problem.getCandidates(i)) {
            long teacherBefore = calculator.teacherCost(solution, teacher);
            for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
                for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
                    if (!TimeSlots.isValidStart(slot, count)) {
                        continue;
                    }
                    // đặt thử, tính điểm rồi gỡ ra
                    solution.place(i, teacher, day, slot);
                    long added = calculator.sessionCost(solution, i, -1)
                            + calculator.teacherCost(solution, teacher) - teacherBefore;
                    solution.unplace(i);
                    if (added < bestCost) {
                        bestCost = added;
                        bestTeacher = teacher;
                        bestDay = day;
                        bestSlot = slot;
                    }
                }
            }
        }
        solution.place(i, bestTeacher, bestDay, bestSlot);
    }
}
