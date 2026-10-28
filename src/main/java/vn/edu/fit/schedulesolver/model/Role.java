package vn.edu.fit.schedulesolver.model;

/** Ba vai trò người dùng. */
public enum Role {
    TRUONG_KHOA("Trưởng khoa"),
    GIAO_VU("Giáo vụ"),
    GIANG_VIEN("Giảng viên");

    private final String displayName;

    Role(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
