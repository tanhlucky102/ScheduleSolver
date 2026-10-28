package vn.edu.fit.schedulesolver.model;

import java.io.Serializable;

/** Một dòng quy ước phân công: giảng viên được dạy môn nào, dạy Lec hay Tut. */
public class TeachingRule implements Serializable {
    private static final long serialVersionUID = 1L;

    private final String courseCode;
    private String courseName;
    private final String teacherCode;
    private boolean canLecture;
    private boolean canTutorial;

    public TeachingRule(String courseCode, String courseName, String teacherCode,
                        boolean canLecture, boolean canTutorial) {
        if (courseCode == null || courseCode.isBlank() || teacherCode == null || teacherCode.isBlank()) {
            throw new IllegalArgumentException("Quy ước cần có mã môn và mã giảng viên.");
        }
        if (!canLecture && !canTutorial) {
            throw new IllegalArgumentException("Giảng viên phải được dạy ít nhất Lecture hoặc Tutorial.");
        }
        this.courseCode = courseCode.trim().toUpperCase();
        this.courseName = courseName == null ? "" : courseName.trim();
        this.teacherCode = teacherCode.trim();
        this.canLecture = canLecture;
        this.canTutorial = canTutorial;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName == null ? "" : courseName.trim();
    }

    public String getTeacherCode() {
        return teacherCode;
    }

    public boolean isCanLecture() {
        return canLecture;
    }

    public void setCanLecture(boolean canLecture) {
        this.canLecture = canLecture;
    }

    public boolean isCanTutorial() {
        return canTutorial;
    }

    public void setCanTutorial(boolean canTutorial) {
        this.canTutorial = canTutorial;
    }

    public Program getProgram() {
        return Program.fromCourseCode(courseCode);
    }

    public boolean allows(SessionKind kind) {
        if (kind.needsLecture() && !canLecture) {
            return false;
        }
        if (kind.needsTutorial() && !canTutorial) {
            return false;
        }
        return true;
    }
}
