package src.main.Backend.Model.TeacherAvailability;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import src.main.Backend.Model.ClassPeriod.ClassPeriod;

// Lịch rảnh của gv (function cho trưởng khoa)
public class TeacherAvailability {
    private int teacherId;
    private List<ClassPeriod> availability = new ArrayList<>();

    public TeacherAvailability(int teacherId, List<ClassPeriod> availability) {
        this.teacherId = teacherId;
        setAvailability(availability);
    }

    public void setTeacherId(int teacherId) {
        this.teacherId = teacherId;
    }

    public void setAvailability(List<ClassPeriod> availability) {
        this.availability = new ArrayList<>(Objects.requireNonNull(availability, "availability"));
    }

    public int getTeacherId() {
        return teacherId;
    }

    public List<ClassPeriod> getAvailability() {
        return availability;
    }
}
