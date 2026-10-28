package vn.edu.fit.schedulesolver.solver;

/** Đổi ngày, ca của hai buổi có cùng số ca cho nhau. */
public class SwapTimeMove implements Move {
    private final int first;
    private final int second;

    public SwapTimeMove(int first, int second) {
        this.first = first;
        this.second = second;
    }

    @Override
    public int[] getSessionIds() {
        return new int[] {first, second};
    }

    @Override
    public int[] getAffectedTeachers(Solution solution) {
        return new int[] {solution.getTeacher(first), solution.getTeacher(second)};
    }

    @Override
    public void apply(Solution solution) {
        swap(solution);
    }

    @Override
    public void undo(Solution solution) {
        // đổi thêm lần nữa là về như cũ
        swap(solution);
    }

    private void swap(Solution solution) {
        int day = solution.getDay(first);
        int slot = solution.getSlot(first);
        solution.setTime(first, solution.getDay(second), solution.getSlot(second));
        solution.setTime(second, day, slot);
    }
}
