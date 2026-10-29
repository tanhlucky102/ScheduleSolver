package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.util.ArrayList;
import java.util.List;
import javax.swing.JTabbedPane;

/** Màn hình của trưởng khoa gồm 3 tab: giảng viên, quy ước phân công và kế hoạch mở lớp. Mỗi tab là một lớp riêng. */
public class DeanPanel extends BasePanel {
    private final List<BasePanel> tabs = new ArrayList<>();

    public DeanPanel(MainFrame frame) {
        super(frame);
        JTabbedPane pane = new JTabbedPane();
        addTab(pane, "1. Giảng viên", new TeacherListTab(frame));
        addTab(pane, "2. Quy ước phân công", new RuleTab(frame));
        addTab(pane, "3. Kế hoạch mở lớp", new PlanTab(frame));
        add(pane, BorderLayout.CENTER);
    }

    private void addTab(JTabbedPane pane, String title, BasePanel tab) {
        tabs.add(tab);
        pane.addTab(title, tab);
    }

    @Override
    public void refresh() {
        for (BasePanel tab : tabs) {
            tab.refresh();
        }
    }
}
