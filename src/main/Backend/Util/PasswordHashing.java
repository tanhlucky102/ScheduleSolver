package src.main.Backend.Util;

import org.mindrot.jbcrypt.BCrypt;

public final class PasswordHashing {

    private PasswordHashing() {
        // Không cho tạo đối tượng PasswordHashing
    }

    // Hash mật khẩu trước khi lưu
    public static String hashPassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException(
                    "Password cannot be empty");
        }

        return BCrypt.hashpw(
                password,
                BCrypt.gensalt(12));
    }

    // Kiểm tra mật khẩu khi đăng nhập
    public static boolean verifyPassword(
            String password,
            String passwordHash) {

        if (password == null || passwordHash == null) {
            return false;
        }

        try {
            return BCrypt.checkpw(password, passwordHash);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
