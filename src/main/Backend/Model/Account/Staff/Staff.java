package src.main.Backend.Model.Account.Staff;

import src.main.Backend.Model.Account.Account;

// Giáo vụ
public class Staff extends Account {
    public Staff(int accountId, String fullName, String password, String email) {
        super(accountId, fullName, password, email, Role.STAFF);
    }
}
