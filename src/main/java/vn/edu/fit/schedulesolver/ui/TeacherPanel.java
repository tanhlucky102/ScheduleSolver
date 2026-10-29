package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.util.ArrayList;
import java.util.List;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTabbedPane;
import vn.edu.fit.schedulesolver.service.PersonalSchedule;

/**
 * Màn hình Giảng viên: dòng tóm tắt và 3 tab (lịch cá nhân, TKB ở trường khác, lịch bận khác).
 * Môn, lớp, phòng ở trường khác và ghi chú riêng chỉ hiện ở đây, giáo vụ không thấy.
 */
public class TeacherPanel extends BasePanel {
    private String teacherCode = "";
    private final JLabel summaryLabel = new JLabel();
    private final List<TeacherTab> tabs = new ArrayList<>();

    public TeacherPanel(MainFrame frame) {
        super(frame);
        summaryLabel.setFont(Theme.BOLD);
        summaryLabel.setForeground(Theme.PRIMARY_DARK);
        JPanel top = new JPanel(new BorderLayout());
        Theme.card(top);
        top.add(summaryLabel, BorderLayout.CENTER);
        add(top, BorderLayout.NORTH);

        JTabbedPane pane = new JTabbedPane();
        addTab(pane, "Lịch cá nhân (gộp nhiều trường)", new PersonalScheduleTab(frame));
        addTab(pane, "TKB ở trường khác", new ExternalSessionTab(frame));
        addTab(pane, "Lịch bận khác", new BusySlotTab(frame));
        add(pane, BorderLayout.CENTER);
    }

    private void addTab(JTabbedPane pane, String title, TeacherTab tab) {
        tabs.add(tab);
        pane.addTab(title, tab);
    }

    /** Gọi lúc đăng nhập để màn hình chỉ hiện dữ liệu của giảng viên này. */
    public void setTeacher(String code) {
        teacherCode = code;
        for (TeacherTab tab : tabs) {
            tab.setTeacher(code);
        }
    }

    @Override
    public void refresh() {
        summaryLabel.setText(teacherCode.isEmpty() ? "" : new PersonalSchedule(workspace(), teacherCode).summary());
        for (TeacherTab tab : tabs) {
            tab.refresh();
        }
    }
}
