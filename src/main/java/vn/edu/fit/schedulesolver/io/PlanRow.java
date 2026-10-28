package vn.edu.fit.schedulesolver.io;

/** Một dòng của sheet "Kế hoạch mở lớp" (chưa chia thành buổi Lec/Tut). */
public class PlanRow {
    private final int excelRow;
    private final String courseCode;
    private final String courseName;
    private final int studentCount;
    private final int intakeYear;
    private final int classCount;
    private final int periods;

    public PlanRow(int excelRow, String courseCode, String courseName, int studentCount,
                   int intakeYear, int classCount, int periods) {
        this.excelRow = excelRow;
        this.courseCode = courseCode;
        this.courseName = courseName;
        this.studentCount = studentCount;
        this.intakeYear = intakeYear;
        this.classCount = classCount;
        this.periods = periods;
    }

    public int getExcelRow() {
        return excelRow;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public String getCourseName() {
        return courseName;
    }

    public int getStudentCount() {
        return studentCount;
    }

    public int getIntakeYear() {
        return intakeYear;
    }

    public int getClassCount() {
        return classCount;
    }

    /** Số tiết một buổi, 2 hoặc 4. */
    public int getPeriods() {
        return periods;
    }
}
