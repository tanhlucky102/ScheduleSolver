package src.main.Backend.Model.Account.Teacher;

import src.main.Backend.Model.Account.Account;
import src.main.Backend.Model.TeacherTeachingSchedule.TeacherTeachingSchedule;

// Giáo viên
public class Teacher extends Account {
    private TeacherTeachingSchedule teachingSchedule;

    public Teacher(int accountId, String fullName, String password, String email,
            TeacherTeachingSchedule teachingSchedule) {
        super(accountId, fullName, password, email, Role.TEACHER);
        this.teachingSchedule = teachingSchedule;
    }

    public TeacherTeachingSchedule getTeachingSchedule() {
        return teachingSchedule;
    }

    public void setTeachingSchedule(TeacherTeachingSchedule teachingSchedule) {
        this.teachingSchedule = teachingSchedule;
    }
}
