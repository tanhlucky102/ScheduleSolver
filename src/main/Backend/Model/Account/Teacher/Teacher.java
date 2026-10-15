package src.main.Backend.Model.Account.Teacher;

import java.util.List;

import src.main.Backend.Model.Account.Account;
import src.main.Backend.Model.Class.Class;

public class Teacher extends Account {
    private final String role = "Teacher";
    private List<Class> classTaught;

    public List<Class> getClassTaught() {
        return classTaught;
    }

    public void setClassTaught(List<Class> classTaught) {
        this.classTaught = classTaught;
    }

    public Teacher(int accountId, String name, String password, String email) {
        this.setAccountId(accountId);
        this.setEmail(email);
        this.setName(name);
        this.setPassword(password);
    }

    public String getRole() {
        return role;
    }
}
