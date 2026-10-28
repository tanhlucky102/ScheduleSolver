package vn.edu.fit.schedulesolver.solver;

/** Một bước đi nhỏ trên lời giải, phải undo được để thử xong bỏ nếu không nhận. */
public interface Move {

    int[] getSessionIds();

    /** Gọi trước apply, vì apply có thể đổi giảng viên của buổi. */
    int[] getAffectedTeachers(Solution solution);

    void apply(Solution solution);

    void undo(Solution solution);
}
