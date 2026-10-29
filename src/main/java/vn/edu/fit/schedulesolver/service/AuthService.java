package vn.edu.fit.schedulesolver.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.model.Account;
import vn.edu.fit.schedulesolver.model.Role;
import vn.edu.fit.schedulesolver.model.Teacher;

/** Đăng nhập cho 3 vai trò. Mật khẩu lưu dạng SHA-256 để ai mở file CSV cũng không đọc được mật khẩu gốc. */
public class AuthService {
    public static final String DEFAULT_PASSWORD = "123456";
    public static final String DEAN_USERNAME = "truongkhoa";
    public static final String STAFF_USERNAME = "giaovu";

    private final File file;
    private final List<Account> accounts = new ArrayList<>();

    public AuthService(File file) throws IOException {
        this.file = file;
        if (file.exists()) {
            accounts.addAll(DataFiles.readAccounts(file));
        }
    }

    /** Sai tên hoặc mật khẩu thì trả về null. */
    public Account login(String username, String password) {
        if (username == null || password == null) {
            return null;
        }
        Account account = find(username);
        if (account != null && account.getPasswordHash().equals(hash(password))) {
            return account;
        }
        return null;
    }

    /** Tạo tài khoản còn thiếu, có thêm thì ghi lại file. */
    public void ensureDefaultAccounts(List<Teacher> teachers) throws IOException {
        boolean changed = false;
        if (find(DEAN_USERNAME) == null) {
            accounts.add(new Account(DEAN_USERNAME, hash(DEFAULT_PASSWORD), Role.TRUONG_KHOA, ""));
            changed = true;
        }
        if (find(STAFF_USERNAME) == null) {
            accounts.add(new Account(STAFF_USERNAME, hash(DEFAULT_PASSWORD), Role.GIAO_VU, ""));
            changed = true;
        }
        for (Teacher teacher : teachers) {
            String username = teacher.getCode().toLowerCase();
            if (find(username) == null) {
                accounts.add(new Account(username, hash(DEFAULT_PASSWORD), Role.GIANG_VIEN, teacher.getCode()));
                changed = true;
            }
        }
        if (changed) {
            DataFiles.writeAccounts(file, accounts);
        }
    }

    public List<Account> getAccounts() {
        return accounts;
    }

    private Account find(String username) {
        for (Account account : accounts) {
            if (account.getUsername().equalsIgnoreCase(username.trim())) {
                return account;
            }
        }
        return null;
    }

    /** Băm SHA-256 rồi đổi ra chuỗi hex. */
    public static String hash(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            // Java nào cũng có SHA-256 nên gần như không vào đây
            throw new IllegalStateException("Máy không hỗ trợ SHA-256", e);
        }
    }
}
