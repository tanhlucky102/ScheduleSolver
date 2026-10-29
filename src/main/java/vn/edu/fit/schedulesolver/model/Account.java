package vn.edu.fit.schedulesolver.model;

/** Tài khoản đăng nhập, mật khẩu chỉ lưu mã băm SHA-256. Tài khoản giảng viên có thêm mã GV. */
public class Account {
    private final String username;
    private final String passwordHash;
    private final Role role;
    private final String teacherCode;

    public Account(String username, String passwordHash, Role role, String teacherCode) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Tên đăng nhập không được để trống.");
        }
        if (role == null) {
            throw new IllegalArgumentException("Tài khoản phải có vai trò.");
        }
        if (role == Role.GIANG_VIEN && (teacherCode == null || teacherCode.isBlank())) {
            throw new IllegalArgumentException("Tài khoản giảng viên phải có mã giảng viên.");
        }
        this.username = username.trim().toLowerCase();
        this.passwordHash = passwordHash;
        this.role = role;
        this.teacherCode = teacherCode == null ? "" : teacherCode.trim();
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public String getTeacherCode() {
        return teacherCode;
    }
}
