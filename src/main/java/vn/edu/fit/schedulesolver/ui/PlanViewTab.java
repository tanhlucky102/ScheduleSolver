package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTabbedPane;
import javax.swing.JTable;
import javax.swing.table.DefaultTableModel;
import vn.edu.fit.schedulesolver.io.CsvFile;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.service.Convention;

/**
 * Tab cho Giáo vụ xem kế hoạch đào tạo, danh sách giảng viên và quy ước phân công
 * do Trưởng khoa gửi (chế độ chỉ đọc).
 */
public class PlanViewTab extends JPanel {
    private static final String ALL = "Tất cả";

    private final MainFrame frame;

    private final DefaultTableModel planModel = readOnlyModel("Mã buổi", "Mã môn", "Tên môn",
            "Chương trình", "Khóa", "Nhóm", "Loại", "Số SV", "Số ca", "GV phụ trách");
    private final DefaultTableModel teacherModel = readOnlyModel("Mã GV", "Họ tên",
            "Tối đa ca/ngày", "Tối đa ca/tuần");
    private final DefaultTableModel ruleModel = readOnlyModel("Chương trình", "Mã môn",
            "Tên môn", "GV phụ trách", "Dạy Lec", "Dạy Tut");

    private final JLabel statusLabel = new JLabel();
    private final JLabel validationLabel = new JLabel();

    private final JComboBox<String> programFilter = new JComboBox<>();
    private final JComboBox<String> cohortFilter = new JComboBox<>();
    private final JComboBox<String> kindFilter = new JComboBox<>();
    private final JLabel planCountLabel = new JLabel();

    private final JComboBox<String> ruleProgramFilter = new JComboBox<>();
    private final JLabel ruleCountLabel = new JLabel();

    private final JTabbedPane subTabs = new JTabbedPane();
    private final JButton loadSamplePlanButton;

    private boolean updatingFilters;

    public PlanViewTab(MainFrame frame) {
        super(new BorderLayout(6, 6));
        this.frame = frame;
        this.loadSamplePlanButton = Theme.button("Nạp kế hoạch mẫu Fall2026 (236 buổi)", Theme.SUCCESS);
        this.loadSamplePlanButton.addActionListener(e -> loadSamplePlan());

        initUi();
    }

    private void initUi() {
        // Sub-tab 1: Danh sách buổi trong kế hoạch
        JPanel planPanel = new JPanel(new BorderLayout(6, 6));

        JPanel planFilterRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        planFilterRow.add(new JLabel("Chương trình:"));
        planFilterRow.add(programFilter);
        planFilterRow.add(new JLabel("Khóa:"));
        planFilterRow.add(cohortFilter);
        planFilterRow.add(new JLabel("Loại buổi:"));
        planFilterRow.add(kindFilter);
        planFilterRow.add(planCountLabel);

        programFilter.addActionListener(e -> refreshPlanTable());
        cohortFilter.addActionListener(e -> refreshPlanTable());
        kindFilter.addActionListener(e -> refreshPlanTable());

        planPanel.add(planFilterRow, BorderLayout.NORTH);
        planPanel.add(new JScrollPane(createTable(planModel)), BorderLayout.CENTER);
        subTabs.addTab("Danh sách buổi", planPanel);

        // Sub-tab 2: Danh sách giảng viên
        JPanel teacherPanel = new JPanel(new BorderLayout(6, 6));
        teacherPanel.add(new JScrollPane(createTable(teacherModel)), BorderLayout.CENTER);
        subTabs.addTab("Giảng viên", teacherPanel);

        // Sub-tab 3: Quy ước phân công
        JPanel rulePanel = new JPanel(new BorderLayout(6, 6));
        JPanel ruleFilterRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        ruleFilterRow.add(new JLabel("Xem chương trình:"));
        ruleFilterRow.add(ruleProgramFilter);
        ruleFilterRow.add(ruleCountLabel);
        ruleProgramFilter.addActionListener(e -> refreshRulesTable());

        rulePanel.add(ruleFilterRow, BorderLayout.NORTH);
        rulePanel.add(new JScrollPane(createTable(ruleModel)), BorderLayout.CENTER);
        subTabs.addTab("Quy ước phân công", rulePanel);

        // Thẻ trạng thái kế hoạch từ trưởng khoa & kiểm tra quy ước
        JPanel statusCard = new JPanel(new BorderLayout(8, 4));
        Theme.card(statusCard);

        JPanel textPanel = new JPanel(new GridLayout(2, 1, 4, 4));
        textPanel.setOpaque(false);
        statusLabel.setFont(Theme.BOLD);
        validationLabel.setFont(Theme.NORMAL);
        textPanel.add(statusLabel);
        textPanel.add(validationLabel);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 4));
        btnPanel.setOpaque(false);
        btnPanel.add(loadSamplePlanButton);

        statusCard.add(textPanel, BorderLayout.CENTER);
        statusCard.add(btnPanel, BorderLayout.EAST);

        add(statusCard, BorderLayout.NORTH);
        add(subTabs, BorderLayout.CENTER);
    }

    private Workspace workspace() {
        return frame.getWorkspace();
    }

    /** Nạp lại toàn bộ dữ liệu kế hoạch, giảng viên, quy ước lên tab xem. */
    public void refresh() {
        updatingFilters = true;

        // Cập nhật bộ lọc Sub-tab 1
        Object selProg = programFilter.getSelectedItem();
        Object selCohort = cohortFilter.getSelectedItem();
        Object selKind = kindFilter.getSelectedItem();

        programFilter.removeAllItems();
        cohortFilter.removeAllItems();
        kindFilter.removeAllItems();

        programFilter.addItem(ALL);
        for (Program p : Program.values()) {
            programFilter.addItem(p.getLabel());
        }

        cohortFilter.addItem(ALL);
        Set<String> cohorts = new TreeSet<>();
        for (PlanSession session : workspace().getPlan()) {
            cohorts.add(session.getCohort());
        }
        for (String c : cohorts) {
            cohortFilter.addItem(c);
        }

        kindFilter.addItem(ALL);
        kindFilter.addItem("Lec");
        kindFilter.addItem("Tut");
        kindFilter.addItem("4 tiết");
        kindFilter.addItem("Lec+Tut");

        programFilter.setSelectedItem(selProg == null ? ALL : selProg);
        cohortFilter.setSelectedItem(selCohort == null ? ALL : selCohort);
        kindFilter.setSelectedItem(selKind == null ? ALL : selKind);

        // Cập nhật bộ lọc Sub-tab 3 (Quy ước)
        Object selRuleProg = ruleProgramFilter.getSelectedItem();
        ruleProgramFilter.removeAllItems();
        ruleProgramFilter.addItem(ALL);
        for (Program p : Program.values()) {
            ruleProgramFilter.addItem(p.getLabel());
        }
        ruleProgramFilter.setSelectedItem(selRuleProg == null ? ALL : selRuleProg);

        updatingFilters = false;

        // Tự động nạp kế hoạch mẫu nếu danh sách buổi đang rỗng
        if (workspace().getPlan().isEmpty()) {
            loadDefaultPlanSilently();
        }

        // Cập nhật tiêu đề tab con kèm số lượng
        if (subTabs.getTabCount() >= 3) {
            subTabs.setTitleAt(0, "Danh sách buổi (" + workspace().getPlan().size() + " buổi)");
            subTabs.setTitleAt(1, "Giảng viên (" + workspace().getTeachers().size() + " GV)");
            subTabs.setTitleAt(2, "Quy ước phân công (" + workspace().getRules().size() + " quy ước)");
        }
        loadSamplePlanButton.setVisible(!workspace().isPlanSent() || workspace().getPlan().isEmpty());

        // Trạng thái gửi kế hoạch từ Trưởng khoa
        if (workspace().isPlanSent()) {
            statusLabel.setText("✔ Kế hoạch đã được Trưởng khoa gửi: "
                    + workspace().getPlan().size() + " buổi, "
                    + workspace().getTeachers().size() + " giảng viên, "
                    + workspace().getRules().size() + " quy ước phân công.");
            statusLabel.setForeground(Theme.SUCCESS);
        } else {
            statusLabel.setText("⏳ Trưởng khoa chưa bấm \"Gửi cho giáo vụ\". Kế hoạch hiện có "
                    + workspace().getPlan().size() + " buổi.");
            statusLabel.setForeground(Theme.WARNING);
        }

        // Kiểm tra tính hợp lệ với quy ước phân công
        Convention convention = new Convention(workspace().getRules());
        List<String> problems = convention.checkPlan(workspace().getPlan(), workspace().getTeachers());
        if (problems.isEmpty()) {
            validationLabel.setText("✔ Kế hoạch hợp lệ: Mọi buổi học đều có đủ giảng viên phụ trách theo quy ước.");
            validationLabel.setForeground(Theme.SUCCESS);
        } else {
            validationLabel.setText("⚠️ Cảnh báo quy ước: Còn " + problems.size()
                    + " vấn đề (ví dụ buổi học chưa có GV phụ trách hoặc GV chưa có trong danh sách).");
            validationLabel.setForeground(Theme.DANGER);
        }

        refreshPlanTable();
        refreshTeachersTable();
        refreshRulesTable();
    }

    private void refreshPlanTable() {
        if (updatingFilters) {
            return;
        }
        String prog = (String) programFilter.getSelectedItem();
        String cohort = (String) cohortFilter.getSelectedItem();
        String kind = (String) kindFilter.getSelectedItem();

        Convention convention = new Convention(workspace().getRules());
        planModel.setRowCount(0);
        int count = 0;
        for (PlanSession session : workspace().getPlan()) {
            if (prog != null && !prog.equals(ALL) && !session.getProgram().getLabel().equals(prog)) {
                continue;
            }
            if (cohort != null && !cohort.equals(ALL) && !session.getCohort().equals(cohort)) {
                continue;
            }
            if (kind != null && !kind.equals(ALL) && !session.getKind().getLabel().equals(kind)) {
                continue;
            }
            count++;
            planModel.addRow(new Object[]{
                    session.getId(), session.getCourseCode(), session.getCourseName(),
                    session.getProgram().getDisplayName(), session.getCohort(), session.getGroup(),
                    session.getKind().getLabel(), session.getStudentCount(), session.getSlotCount(),
                    String.join(", ", convention.candidatesFor(session))});
        }
        planCountLabel.setText("   Hiển thị: " + count + " / " + workspace().getPlan().size() + " buổi");
    }

    private void refreshTeachersTable() {
        teacherModel.setRowCount(0);
        for (Teacher teacher : workspace().getTeachers()) {
            teacherModel.addRow(new Object[]{
                    teacher.getCode(), teacher.getFullName(),
                    teacher.getMaxSlotsPerDay(), teacher.getMaxSlotsPerWeek()});
        }
    }

    private void refreshRulesTable() {
        if (updatingFilters) {
            return;
        }
        String selected = (String) ruleProgramFilter.getSelectedItem();
        ruleModel.setRowCount(0);
        int count = 0;
        for (TeachingRule rule : workspace().getRules()) {
            Program program = rule.getProgram();
            boolean match = selected == null || selected.equals(ALL)
                    || (program != null && program.getLabel().equals(selected));
            if (match) {
                count++;
                ruleModel.addRow(new Object[]{
                        rule.getProgram() == null ? "?" : rule.getProgram().getDisplayName(),
                        rule.getCourseCode(), rule.getCourseName(), rule.getTeacherCode(),
                        rule.isCanLecture() ? "✔" : "", rule.isCanTutorial() ? "✔" : ""});
            }
        }
        ruleCountLabel.setText("   Hiển thị: " + count + " / " + workspace().getRules().size() + " dòng");
    }

    private void loadDefaultPlanSilently() {
        File file = new File(MainFrame.RESOURCES, "ke_hoach_mo_lop.csv");
        if (!file.exists()) {
            return;
        }
        try {
            List<PlanSession> loaded = new ArrayList<>();
            for (String[] row : CsvFile.read(file)) {
                String id = CsvFile.get(row, 0);
                String code = CsvFile.get(row, 1);
                String name = CsvFile.get(row, 2);
                String cohort = CsvFile.get(row, 3);
                String group = CsvFile.get(row, 4);
                SessionKind kind = SessionKind.valueOf(CsvFile.get(row, 5));
                int sv = Integer.parseInt(CsvFile.get(row, 6));
                loaded.add(new PlanSession(id, code, name, cohort, group, kind, sv));
            }
            workspace().replacePlan(loaded);
            workspace().setPlanSent(true);
        } catch (Exception ignored) {
        }
    }

    private void loadSamplePlan() {
        File file = new File(MainFrame.RESOURCES, "ke_hoach_mo_lop.csv");
        if (!file.exists()) {
            JOptionPane.showMessageDialog(this, "Không tìm thấy file kế hoạch mẫu: " + file.getName(),
                    "Lỗi", JOptionPane.ERROR_MESSAGE);
            return;
        }
        try {
            List<PlanSession> loaded = new ArrayList<>();
            for (String[] row : CsvFile.read(file)) {
                String id = CsvFile.get(row, 0);
                String code = CsvFile.get(row, 1);
                String name = CsvFile.get(row, 2);
                String cohort = CsvFile.get(row, 3);
                String group = CsvFile.get(row, 4);
                SessionKind kind = SessionKind.valueOf(CsvFile.get(row, 5));
                int sv = Integer.parseInt(CsvFile.get(row, 6));
                loaded.add(new PlanSession(id, code, name, cohort, group, kind, sv));
            }
            workspace().replacePlan(loaded);
            workspace().setPlanSent(true);
            frame.markChanged();
            frame.refreshAll();
            JOptionPane.showMessageDialog(this,
                    "Đã nạp kế hoạch mẫu " + loaded.size() + " buổi và xác nhận Trưởng khoa đã gửi.",
                    "Thông báo", JOptionPane.INFORMATION_MESSAGE);
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Lỗi đọc kế hoạch mẫu: " + e.getMessage(),
                    "Lỗi", JOptionPane.ERROR_MESSAGE);
        }
    }

    private static DefaultTableModel readOnlyModel(String... columns) {
        return new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }

            @Override
            public Class<?> getColumnClass(int column) {
                if (getRowCount() > 0 && getValueAt(0, column) != null) {
                    return getValueAt(0, column).getClass();
                }
                return Object.class;
            }
        };
    }

    private static JTable createTable(DefaultTableModel model) {
        JTable table = new JTable(model);
        Theme.styleTable(table);
        return table;
    }

    // Getters phục vụ kiểm thử và mở rộng
    public DefaultTableModel getPlanModel() {
        return planModel;
    }

    public DefaultTableModel getTeacherModel() {
        return teacherModel;
    }

    public DefaultTableModel getRuleModel() {
        return ruleModel;
    }

    public JLabel getStatusLabel() {
        return statusLabel;
    }

    public JLabel getValidationLabel() {
        return validationLabel;
    }

    public JTabbedPane getSubTabs() {
        return subTabs;
    }

    public JButton getLoadSamplePlanButton() {
        return loadSamplePlanButton;
    }
}

