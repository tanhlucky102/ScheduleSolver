package src.main.Backend.Model.ClassSection;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import src.main.Backend.Model.ClassPeriod.ClassPeriod;

// Các lớp của 1 môn
public class ClassSection { // Các lớp học của 1 môn
    private int classId;
    private List<ClassPeriod> classTime = new ArrayList<>();
    private int studentCount;

    public static enum InnerClass {
        LEC,
        TUT
    }

    private InnerClass classType; // Lớp lec hay tut

    public static enum Location {
        COMPUTER_LAB, LECTURE_HALL
    }

    private Location classLocationType; // Học phòng máy hay giảng đường

    public ClassSection(int classId, List<ClassPeriod> classTime, InnerClass classType, Location classLocationType,
            int studentCount) {
        this.classId = classId;
        setClassTime(classTime);
        setClassType(classType);
        setClassLocationType(classLocationType);
        setStudentCount(studentCount);
    }

    public int getClassId() {
        return classId;
    }

    public void setClassId(int classId) {
        this.classId = classId;
    }

    public InnerClass getClassType() {
        return classType;
    }

    public void setClassType(InnerClass classType) {
        this.classType = Objects.requireNonNull(classType, "classType");
    }

    public List<ClassPeriod> getClassTime() {
        return classTime;
    }

    public void setClassTime(List<ClassPeriod> classTime) {
        this.classTime = new ArrayList<>(Objects.requireNonNull(classTime, "classTime"));
    }

    public Location getClassLocationType() {
        return classLocationType;
    }

    public void setClassLocationType(Location classLocationType) {
        this.classLocationType = Objects.requireNonNull(classLocationType, "classLocationType");
    }

    public int getStudentCount() {
        return studentCount;
    }

    public void setStudentCount(int studentCount) {
        if (studentCount < 0) {
            throw new IllegalArgumentException("studentCount cannot be negative");
        }
        this.studentCount = studentCount;
    }
}
