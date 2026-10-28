package vn.edu.fit.schedulesolver.model;

import java.io.Serializable;

/** Một buổi học hằng tuần cần xếp, ví dụ Tut nhóm 03 môn 61FIT3DBS. */
public class PlanSession implements Serializable {
    private static final long serialVersionUID = 1L;

    private final String id;
    private final String courseCode;
    private final String courseName;
    private final Program program;
    private final String cohort;
    private final String group;
    private final SessionKind kind;
    private final int studentCount;

    public PlanSession(String id, String courseCode, String courseName, String cohort,
                       String group, SessionKind kind, int studentCount) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Mã buổi học không được để trống.");
        }
        Program detected = Program.fromCourseCode(courseCode);
        if (detected == null) {
            throw new IllegalArgumentException("Không nhận ra chương trình của mã môn: " + courseCode);
        }
        if (kind == null) {
            throw new IllegalArgumentException("Thiếu loại buổi học.");
        }
        this.id = id.trim();
        this.courseCode = courseCode.trim().toUpperCase();
        this.courseName = courseName == null ? "" : courseName.trim();
        this.program = detected;
        this.cohort = cohort == null ? "" : cohort.trim();
        this.group = group == null ? "" : group.trim();
        this.kind = kind;
        this.studentCount = studentCount;
    }

    public String getId() {
        return id;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public String getCourseName() {
        return courseName;
    }

    public Program getProgram() {
        return program;
    }

    public String getCohort() {
        return cohort;
    }

    public String getGroup() {
        return group;
    }

    public SessionKind getKind() {
        return kind;
    }

    public int getStudentCount() {
        return studentCount;
    }

    public int getSlotCount() {
        return kind.getSlotCount();
    }

    public String getShortLabel() {
        String text = courseCode;
        if (!group.isEmpty()) {
            text = text + " - " + group;
        }
        return text + " (" + kind.getLabel() + ")";
    }

    @Override
    public String toString() {
        return id;
    }
}
