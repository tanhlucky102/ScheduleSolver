package src.main.Backend.Util;

import org.mindrot.jbcrypt.BCrypt;

// Hash password để bảo vệ thông tin trc khi lưu
public final class PasswordHashing {
    private PasswordHashing() {
    }

    public static String hashPassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException(
                    "Password cannot be empty");
        }

        return BCrypt.hashpw(
                password,
                BCrypt.gensalt(12));
    }

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
