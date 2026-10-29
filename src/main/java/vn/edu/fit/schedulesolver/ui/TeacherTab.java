package vn.edu.fit.schedulesolver.ui;

/** Lớp cha của các tab trên màn hình Giảng viên: tab nào cũng chỉ hiện dữ liệu của giảng viên đang đăng nhập. */
public abstract class TeacherTab extends BasePanel {
    protected String teacherCode = "";

    protected TeacherTab(MainFrame frame) {
        super(frame);
        useTabLayout();
    }

    public void setTeacher(String code) {
        teacherCode = code;
    }
}
