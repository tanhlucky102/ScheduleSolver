package vn.edu.fit.schedulesolver.solver;

/** Đổi giảng viên của một buổi (trong số người được phép dạy), giữ nguyên giờ. */
public class ChangeTeacherMove implements Move {
    private final int session;
    private final int newTeacher;
    private int oldTeacher;

    public ChangeTeacherMove(int session, int newTeacher) {
        this.session = session;
        this.newTeacher = newTeacher;
    }

    @Override
    public int[] getSessionIds() {
        return new int[] {session};
    }

    @Override
    public int[] getAffectedTeachers(Solution solution) {
        return new int[] {solution.getTeacher(session), newTeacher};
    }

    @Override
    public void apply(Solution solution) {
        oldTeacher = solution.getTeacher(session);
        solution.setTeacher(session, newTeacher);
    }

    @Override
    public void undo(Solution solution) {
        solution.setTeacher(session, oldTeacher);
    }
}
