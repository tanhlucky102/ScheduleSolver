package src.main.Backend.Model.Account.HeadOfDepartment;

import src.main.Backend.Model.Account.Account;

// Trưởng khoa
public class HeadOfDepartment extends Account {
    public HeadOfDepartment(int accountId, String fullName, String password, String email) {
        super(accountId, fullName, password, email, Role.HEAD_OF_DEPARTMENT);
    }
}
