package src.main.Backend.Model.Account;

import java.util.Objects;

import src.main.Backend.Util.PasswordHashing;

public class Account {
    private int accountId;
    private String passwordHashed;
    private String fullName;
    private String email;

    public enum Role {
        TEACHER,
        STAFF,
        HEAD_OF_DEPARTMENT
    }

    private final Role role;

    protected Account(int accountId, String fullName, String passwordHashed, String email, Role role) {
        this.accountId = accountId;
        this.fullName = Objects.requireNonNull(fullName, "fullName");
        this.passwordHashed = Objects.requireNonNull(passwordHashed, "passwordHashed");
        this.email = Objects.requireNonNull(email, "email");
        this.role = Objects.requireNonNull(role, "role");
    }

    public int getAccountId() {
        return accountId;
    }

    public void setAccountId(int accountId) {
        this.accountId = accountId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = Objects.requireNonNull(fullName, "fullName");
    }

    public void setPassword(String password) {
        this.passwordHashed = PasswordHashing.hashPassword(password);
    }

    public boolean checkPassword(String password) {
        return PasswordHashing.verifyPassword(
                password,
                passwordHashed);
    }

    public String getPasswordHash() {
        return passwordHashed;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = Objects.requireNonNull(email, "email");
    }

    public Role getRole() {
        return role;
    }

}
