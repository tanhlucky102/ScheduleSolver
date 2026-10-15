package src.main.Backend.Model.Account.HeadOfDepartment;

import src.main.Backend.Model.Account.Account;

public class HeadOfDepartment extends Account {
    private final String role = "Head Of Department";

    public HeadOfDepartment(int accountId, String name, String password, String email) {
        this.setAccountId(accountId);
        this.setEmail(email);
        this.setName(name);
        this.setPassword(password);
    }

    public String getRole() {
        return role;
    }
}
