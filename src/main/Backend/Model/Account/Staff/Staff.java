package src.main.Backend.Model.Account.Staff;

import src.main.Backend.Model.Account.Account;

public class Staff extends Account {
    private final String role = "Staff";

    public Staff(int accountId, String name, String password, String email) {
        this.setAccountId(accountId);
        this.setEmail(email);
        this.setName(name);
        this.setPassword(password);
    }

    public String getRole() {
        return role;
    }
}
