package src.main.Backend.Model.TeacherTeachingSchedule;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import src.main.Backend.Model.ClassSection.ClassSection;

// Lịch dạy của gv
public class TeacherTeachingSchedule {
    private int teacherId;
    private List<ClassSection> teachingSchedule = new ArrayList<>();

    public TeacherTeachingSchedule(int teacherId, List<ClassSection> teachingSchedule) {
        this.teacherId = teacherId;
        setTeachingSchedule(teachingSchedule);
    }

    public void setTeacherId(int teacherId) {
        this.teacherId = teacherId;
    }

    public void setTeachingSchedule(List<ClassSection> teachingSchedule) {
        this.teachingSchedule = new ArrayList<>(Objects.requireNonNull(teachingSchedule, "teachingSchedule"));
    }

    public int getTeacherId() {
        return teacherId;
    }

    public List<ClassSection> getTeachingSchedule() {
        return teachingSchedule;
    }
}
