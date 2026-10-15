package src.main.Backend.Model.Course;

import java.util.List;

import src.main.Backend.Model.Class.Class;

public class Course {
    private int courseId;
    private String courseName;
    private List<Class> classList;

    public List<Class> getClassList() {
        return classList;
    }

    public void setClassList(List<Class> classList) {
        this.classList = classList;
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
        this.courseName = courseName;
    }
}
