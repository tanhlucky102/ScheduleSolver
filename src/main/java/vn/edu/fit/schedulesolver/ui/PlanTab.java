package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.TreeSet;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTabbedPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.RowFilter;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableRowSorter;
import vn.edu.fit.schedulesolver.io.PlanExcelReader;
import vn.edu.fit.schedulesolver.io.PlanRow;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.service.Convention;
import vn.edu.fit.schedulesolver.service.PlanBuilder;

/** Tab 3 của trưởng khoa: nhập kế hoạch mở lớp từ Excel, kiểm tra với quy ước và gửi cho giáo vụ. */
public class PlanTab extends BasePanel {
    private static final String ALL_FILTER_VALUES = "Tất cả";

    private final DefaultTableModel planModel = readOnlyModel("Mã buổi", "Mã môn", "Tên môn", "Chương trình",
            "Khóa", "Nhóm", "Loại", "Số SV", "Số ca", "GV phụ trách");
    private final JTable planTable = createTable(planModel);
    private final JTextField planCourseCodeSearch = new JTextField(12);
    private final JTextField planCourseNameSearch = new JTextField(12);
    private final JTextField planTeacherSearch = new JTextField(12);
    private final JComboBox<String> planProgramFilter = new JComboBox<>();
    private final JComboBox<String> planCohortFilter = new JComboBox<>();
    private final JComboBox<String> planKindFilter = new JComboBox<>();
    private final TableRowSorter<DefaultTableModel> planSorter = new TableRowSorter<>(planModel);
    private boolean updatingPlanFilters;
    private final JLabel planStatus = new JLabel();
    private final JTextArea checkArea = new JTextArea(5, 60);
    private final JTabbedPane planInfoTabs = new JTabbedPane();

    public PlanTab(MainFrame frame) {
        super(frame);
        useTabLayout();
        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 6));
        Theme.card(buttons);
        buttons.add(createButton("Nhập kế hoạch từ Excel...", e -> importPlan()));
        buttons.add(createButton("Kiểm tra với quy ước", Theme.WARNING, e -> checkPlan()));
        buttons.add(createButton("Gửi cho giáo vụ", Theme.SUCCESS, e -> sendPlan()));
        planStatus.setFont(Theme.BOLD);
        buttons.add(planStatus);

        JLabel explain = new JLabel("<html><b>Cột \"Loại\"</b> (mỗi dòng là một buổi học hằng tuần):<br>"
                + "• <b>Lec</b>: lớp lý thuyết Đại trà/MME, cả khóa học chung 1 lớp/tuần (ví dụ 61FIT2PR1: 200 SV). "
                + "Môn quá đông thì kế hoạch của khoa mở 2 lớp Lec A, B (ví dụ 61FIT3SAD K24).<br>"
                + "• <b>Tut</b>: nhóm thực hành khoảng 30 SV, chia nhiều nhóm; mỗi nhóm có thể do một GV phụ trách khác (61FIT2PR1 có 5 nhóm).<br>"
                + "• <b>4 tiết</b>: môn như SS1, mỗi nhóm học 1 buổi/tuần, Lec và Tut liền nhau (2 ca), 1 GV.<br>"
                + "• <b>Lec+Tut</b>: lớp CLC/TT học Lec rồi Tut liền nhau (2 ca), 1 GV; giống 4 tiết nhưng kế hoạch của khoa ghi thành 2 dòng.<br>"
                + "Cột \"GV phụ trách\": các GV có thể dạy buổi đó theo quy ước; bộ giải của giáo vụ sẽ chọn 1 người.</html>");
        JPanel explainCard = new JPanel(new BorderLayout());
        Theme.card(explainCard);
        explainCard.add(explain, BorderLayout.NORTH);

        JPanel filters = new JPanel();
        filters.setLayout(new BoxLayout(filters, BoxLayout.X_AXIS));
        addPlanFilter(filters, "Mã môn:", planCourseCodeSearch, 100);
        addPlanFilter(filters, "Tên môn:", planCourseNameSearch, 110);
        addPlanFilter(filters, "GV phụ trách:", planTeacherSearch, 110);
        addPlanFilter(filters, "Chương trình:", planProgramFilter, 150);
        addPlanFilter(filters, "Khóa:", planCohortFilter, 85);
        addPlanFilter(filters, "Loại:", planKindFilter, 95);
        planTable.setRowSorter(planSorter);
        setColumnWidths(planTable, 160, 90, 190, 110, 50, 55, 60, 55, 50, 220);
        addPlanSearchListener(planCourseCodeSearch);
        addPlanSearchListener(planCourseNameSearch);
        addPlanSearchListener(planTeacherSearch);
        planProgramFilter.addActionListener(e -> refreshPlanFilter());
        planCohortFilter.addActionListener(e -> refreshPlanFilter());
        planKindFilter.addActionListener(e -> refreshPlanFilter());
        JPanel controls = new JPanel(new BorderLayout(6, 4));
        controls.add(buttons, BorderLayout.NORTH);
        controls.add(new JScrollPane(filters, JScrollPane.VERTICAL_SCROLLBAR_NEVER,
                JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED), BorderLayout.CENTER);
        checkArea.setEditable(false);
        // giải thích và kết quả kiểm tra chung một khung có tab ở dưới, bảng kế hoạch được phần lớn chiều cao
        planInfoTabs.addTab("Giải thích các cột", new JScrollPane(explainCard));
        planInfoTabs.addTab("Kết quả kiểm tra", new JScrollPane(checkArea));
        planInfoTabs.setPreferredSize(new Dimension(10, 170));

        add(controls, BorderLayout.NORTH);
        add(new JScrollPane(planTable), BorderLayout.CENTER);
        add(planInfoTabs, BorderLayout.SOUTH);
    }

    private void addPlanFilter(JPanel panel, String label, JTextField field, int width) {
        addPlanFilterLabel(panel, label);
        field.setPreferredSize(new Dimension(width, field.getPreferredSize().height));
        panel.add(field);
        panel.add(Box.createHorizontalStrut(8));
    }

    private void addPlanFilter(JPanel panel, String label, JComboBox<String> filter, int width) {
        addPlanFilterLabel(panel, label);
        filter.setPreferredSize(new Dimension(width, filter.getPreferredSize().height));
        panel.add(filter);
        panel.add(Box.createHorizontalStrut(8));
    }

    private void addPlanFilterLabel(JPanel panel, String label) {
        panel.add(new JLabel(label));
        panel.add(Box.createHorizontalStrut(4));
    }

    private void addPlanSearchListener(JTextField field) {
        field.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent event) {
                refreshPlanFilter();
            }

            @Override
            public void removeUpdate(DocumentEvent event) {
                refreshPlanFilter();
            }

            @Override
            public void changedUpdate(DocumentEvent event) {
                refreshPlanFilter();
            }
        });
    }

    private void refreshPlanFilter() {
        if (updatingPlanFilters) {
            return;
        }
        String courseCode = planCourseCodeSearch.getText().trim().toLowerCase(Locale.ROOT);
        String courseName = planCourseNameSearch.getText().trim().toLowerCase(Locale.ROOT);
        String teacher = planTeacherSearch.getText().trim().toLowerCase(Locale.ROOT);
        String program = (String) planProgramFilter.getSelectedItem();
        String cohort = (String) planCohortFilter.getSelectedItem();
        String kind = (String) planKindFilter.getSelectedItem();
        planSorter.setRowFilter(new RowFilter<DefaultTableModel, Integer>() {
            @Override
            public boolean include(Entry<? extends DefaultTableModel, ? extends Integer> entry) {
                return contains(entry.getStringValue(1), courseCode)
                        && contains(entry.getStringValue(2), courseName)
                        && contains(entry.getStringValue(9), teacher)
                        && (program == null || program.equals(ALL_FILTER_VALUES)
                                || program.equals(entry.getStringValue(3)))
                        && (cohort == null || cohort.equals(ALL_FILTER_VALUES)
                                || cohort.equals(entry.getStringValue(4)))
                        && (kind == null || kind.equals(ALL_FILTER_VALUES)
                                || kind.equals(entry.getStringValue(6)));
            }
        });
    }

    private boolean contains(String value, String query) {
        return value.toLowerCase(Locale.ROOT).contains(query);
    }

    private void refreshPlanDropdowns() {
        String selectedProgram = (String) planProgramFilter.getSelectedItem();
        String selectedCohort = (String) planCohortFilter.getSelectedItem();
        String selectedKind = (String) planKindFilter.getSelectedItem();
        updatingPlanFilters = true;
        planProgramFilter.removeAllItems();
        planCohortFilter.removeAllItems();
        planKindFilter.removeAllItems();
        planProgramFilter.addItem(ALL_FILTER_VALUES);
        for (Program program : Program.values()) {
            planProgramFilter.addItem(program.getDisplayName());
        }
        planCohortFilter.addItem(ALL_FILTER_VALUES);
        TreeSet<String> cohorts = new TreeSet<>();
        for (PlanSession session : workspace().getPlan()) {
            cohorts.add(session.getCohort());
        }
        for (String cohort : cohorts) {
            planCohortFilter.addItem(cohort);
        }
        planKindFilter.addItem(ALL_FILTER_VALUES);
        for (SessionKind kind : SessionKind.values()) {
            planKindFilter.addItem(kind.getLabel());
        }
        planProgramFilter.setSelectedItem(selectedProgram == null ? ALL_FILTER_VALUES : selectedProgram);
        planCohortFilter.setSelectedItem(
                selectedCohort != null && cohorts.contains(selectedCohort) ? selectedCohort : ALL_FILTER_VALUES);
        planKindFilter.setSelectedItem(selectedKind == null ? ALL_FILTER_VALUES : selectedKind);
        updatingPlanFilters = false;
        refreshPlanFilter();
    }

    private void importPlan() {
        File file = chooseWorkbook();
        if (file == null) {
            return;
        }
        frame.runInBackground("Đọc kế hoạch mở lớp", () -> {
            PlanExcelReader reader = new PlanExcelReader();
            List<PlanRow> rows = reader.read(file);
            PlanBuilder builder = new PlanBuilder();
            PlanImport result = new PlanImport();
            result.sessions = builder.build(rows);
            result.messages.add("Đọc " + rows.size() + " dòng kế hoạch, tạo " + result.sessions.size() + " buổi cần xếp.");
            result.messages.addAll(reader.getWarnings());
            result.messages.addAll(builder.getWarnings());
            return result;
        }, result -> {
            if (!workspace().getDraft().isEmpty()) {
                int answer = JOptionPane.showConfirmDialog(this,
                        "Thay kế hoạch sẽ xóa bản nháp TKB hiện tại (bản đã công bố vẫn giữ). Tiếp tục?",
                        "Thay kế hoạch", JOptionPane.YES_NO_OPTION);
                if (answer != JOptionPane.YES_OPTION) {
                    return;
                }
            }
            workspace().replacePlan(result.sessions);
            dataChanged();
            checkArea.setText(String.join("\n", result.messages));
            planInfoTabs.setSelectedIndex(1);
        });
    }

    /** Kết quả đọc kế hoạch trả về từ luồng nền. */
    private static class PlanImport {
        List<PlanSession> sessions;
        final List<String> messages = new ArrayList<>();
    }

    private List<String> runCheck() {
        return new Convention(workspace().getRules()).checkPlan(workspace().getPlan(), workspace().getTeachers());
    }

    private void checkPlan() {
        List<String> problems = runCheck();
        if (problems.isEmpty()) {
            checkArea.setText("Kế hoạch hợp lệ: mọi buổi đều có giảng viên phụ trách theo quy ước.");
            planInfoTabs.setSelectedIndex(1);
        } else {
            checkArea.setText(String.join("\n", problems));
        }
    }

    private void sendPlan() {
        List<String> problems = runCheck();
        if (!problems.isEmpty()) {
            checkArea.setText(String.join("\n", problems));
            showError("Kế hoạch còn " + problems.size() + " vấn đề, xem chi tiết bên dưới.");
            return;
        }
        workspace().setPlanSent(true);
        dataChanged();
        showInfo("Đã gửi kế hoạch " + workspace().getPlan().size() + " buổi cho giáo vụ.");
    }

    @Override
    public void refresh() {
        Convention convention = new Convention(workspace().getRules());
        planModel.setRowCount(0);
        for (PlanSession session : workspace().getPlan()) {
            planModel.addRow(new Object[] {session.getId(), session.getCourseCode(), session.getCourseName(),
                session.getProgram().getDisplayName(), session.getCohort(), session.getGroup(),
                session.getKind().getLabel(), session.getStudentCount(), session.getSlotCount(),
                String.join(", ", convention.candidatesFor(session))});
        }
        refreshPlanDropdowns();
        String sent = workspace().isPlanSent() ? "ĐÃ GỬI cho giáo vụ" : "chưa gửi";
        planStatus.setForeground(workspace().isPlanSent() ? Theme.SUCCESS : Theme.WARNING);
        planStatus.setText("   Kế hoạch: " + workspace().getPlan().size() + " buổi - " + sent);
    }
}
