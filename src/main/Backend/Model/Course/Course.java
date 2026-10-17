package src.main.Backend.Model.Course;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import src.main.Backend.Model.ClassSection.ClassSection;

// Môn học
public class Course {
    private int courseId;
    private String courseName;
    private List<ClassSection> classList = new ArrayList<>();
    private int cohortId; // Lớp học thuộc về khóa nào

    public static enum Type {
        STANDARD,
        HIGH_QUALITY
    }

    private Type courseType; // Môn cho sinh viên thường hay chất lượng cao

    public Course(int courseId, String courseName, Type courseType, int cohortId) {
        this.courseId = courseId;
        this.courseName = Objects.requireNonNull(courseName, "courseName");
        this.courseType = Objects.requireNonNull(courseType, "courseType");
        this.cohortId = cohortId;
    }

    public List<ClassSection> getClassList() {
        return classList;
    }

    public Type getCourseType() {
        return courseType;
    }

    public void setCourseType(Type courseType) {
        this.courseType = Objects.requireNonNull(courseType, "courseType");
    }

    public void setClassList(List<ClassSection> classList) {
        this.classList = new ArrayList<>(Objects.requireNonNull(classList, "classList"));
    }

    public int getCourseId() {
        return courseId;
    }

    public void setCourseId(int courseId) {
        this.courseId = courseId;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = Objects.requireNonNull(courseName, "courseName");
    }

    public int getCohortId() {
        return cohortId;
    }

    public void setCohortId(int cohortId) {
        this.cohortId = cohortId;
    }
}
