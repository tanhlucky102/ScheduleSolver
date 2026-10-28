package vn.edu.fit.schedulesolver.solver;

/** Chuyển một buổi sang ngày, ca khác, giữ nguyên giảng viên. */
public class ChangeTimeMove implements Move {
    private final int session;
    private final int newDay;
    private final int newSlot;
    private int oldDay;
    private int oldSlot;

    public ChangeTimeMove(int session, int newDay, int newSlot) {
        this.session = session;
        this.newDay = newDay;
        this.newSlot = newSlot;
    }

    @Override
    public int[] getSessionIds() {
        return new int[] {session};
    }

    @Override
    public int[] getAffectedTeachers(Solution solution) {
        return new int[] {solution.getTeacher(session)};
    }

    @Override
    public void apply(Solution solution) {
        oldDay = solution.getDay(session);
        oldSlot = solution.getSlot(session);
        solution.setTime(session, newDay, newSlot);
    }

    @Override
    public void undo(Solution solution) {
        solution.setTime(session, oldDay, oldSlot);
    }
}
