package vn.edu.fit.schedulesolver.model;

/** Loại buổi học cần xếp. */
public enum SessionKind {
    LECTURE("Lec", 1),
    TUTORIAL("Tut", 1),
    // CLC/TT: Lec rồi Tut liền nhau, cùng giảng viên
    LEC_TUT("Lec+Tut", 2),
    // môn 4 tiết như SS1, chiếm 2 ca liền
    COMBINED("4 tiết", 2);

    private final String label;
    private final int slotCount;

    SessionKind(String label, int slotCount) {
        this.label = label;
        this.slotCount = slotCount;
    }

    public String getLabel() {
        return label;
    }

    public int getSlotCount() {
        return slotCount;
    }

    // Lec+Tut và 4 tiết cần được dạy cả Lec lẫn Tut
    public boolean needsLecture() {
        return this != TUTORIAL;
    }

    public boolean needsTutorial() {
        return this != LECTURE;
    }

    @Override
    public String toString() {
        return label;
    }
}
