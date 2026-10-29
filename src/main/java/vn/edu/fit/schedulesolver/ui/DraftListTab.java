package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import javax.swing.Box;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.RowFilter;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableRowSorter;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.service.Convention;
import vn.edu.fit.schedulesolver.service.ScheduleService;

/** Tab danh sách buổi của bản nháp: lọc ngay khi gõ, sửa giờ hoặc giảng viên của một buổi, cố định buổi. */
public class DraftListTab extends BasePanel {
    private static final String ALL = "Tất cả";

    private final ScheduleService service = new ScheduleService();
    // sửa xong một buổi thì màn hình giáo vụ đánh giá lại cả bản nháp
    private final Runnable afterEdit;

    private final DefaultTableModel draftModel = readOnlyModel("Mã buổi", "Mã môn", "Tên môn", "Loại",
            "Chương trình", "Khóa", "Nhóm", "Giảng viên", "Thời gian", "Cố định");
    private final JTable draftTable = createTable(draftModel);
    private final JTextField draftCourseCodeSearch = new JTextField(12);
    private final JTextField draftCourseNameSearch = new JTextField(12);
    private final JTextField draftTeacherSearch = new JTextField(12);
    private final JComboBox<String> draftKindFilter = new JComboBox<>();
    private final JComboBox<String> draftProgramFilter = new JComboBox<>();
    private final JComboBox<String> draftCohortFilter = new JComboBox<>();
    private final TableRowSorter<DefaultTableModel> draftSorter = new TableRowSorter<>(draftModel);
    private boolean updatingDraftFilters;

    public DraftListTab(MainFrame frame, Runnable afterEdit) {
        super(frame);
        useTabLayout();
        this.afterEdit = afterEdit;
        // cột mã buổi và thời gian dài hơn các cột khác
        setColumnWidths(draftTable, 140, 90, 116, 50, 105, 52, 55, 88, 185, 66);
        // 2 dòng lọc: cửa sổ hẹp vẫn thấy đủ ô lọc, không phải kéo thanh cuộn ngang
        JPanel searchRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 4, 2));
        addDraftFilter(searchRow, "Mã môn:", draftCourseCodeSearch, 130);
        addDraftFilter(searchRow, "Tên môn:", draftCourseNameSearch, 140);
        addDraftFilter(searchRow, "Giảng viên:", draftTeacherSearch, 130);
        JPanel choiceRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 4, 2));
        addDraftFilter(choiceRow, "Loại:", draftKindFilter, 95);
        addDraftFilter(choiceRow, "Chương trình:", draftProgramFilter, 150);
        addDraftFilter(choiceRow, "Khóa:", draftCohortFilter, 85);
        JPanel filters = new JPanel(new GridLayout(2, 1));
        filters.add(searchRow);
        filters.add(choiceRow);
        draftTable.setRowSorter(draftSorter);
        addDraftSearchListener(draftCourseCodeSearch);
        addDraftSearchListener(draftCourseNameSearch);
        addDraftSearchListener(draftTeacherSearch);
        draftKindFilter.addActionListener(e -> refreshDraftFilter());
        draftProgramFilter.addActionListener(e -> refreshDraftFilter());
        draftCohortFilter.addActionListener(e -> refreshDraftFilter());
        add(filters, BorderLayout.NORTH);
        add(new JScrollPane(draftTable), BorderLayout.CENTER);
        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        buttons.add(createButton("Sửa buổi đã chọn...", e -> editSelected()));
        buttons.add(createButton("Cố định / bỏ cố định", Theme.NEUTRAL, e -> toggleLock()));
        add(buttons, BorderLayout.SOUTH);
    }

    /** Bộ giải đang chạy thì khóa bảng, không cho sửa bản nháp. */
    public void setTableEnabled(boolean enabled) {
        draftTable.setEnabled(enabled);
    }

    private void addDraftFilter(JPanel panel, String label, JTextField field, int width) {
        addDraftFilterLabel(panel, label);
        field.setPreferredSize(new Dimension(width, field.getPreferredSize().height));
        panel.add(field);
        panel.add(Box.createHorizontalStrut(8));
    }

    private void addDraftFilter(JPanel panel, String label, JComboBox<String> filter, int width) {
        addDraftFilterLabel(panel, label);
        filter.setPreferredSize(new Dimension(width, filter.getPreferredSize().height));
        panel.add(filter);
        panel.add(Box.createHorizontalStrut(8));
    }

    private void addDraftFilterLabel(JPanel panel, String label) {
        panel.add(new JLabel(label));
        panel.add(Box.createHorizontalStrut(4));
    }

    private void addDraftSearchListener(JTextField field) {
        field.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent event) {
                refreshDraftFilter();
            }

            @Override
            public void removeUpdate(DocumentEvent event) {
                refreshDraftFilter();
            }

            @Override
            public void changedUpdate(DocumentEvent event) {
                refreshDraftFilter();
            }
        });
    }

    private Assignment selectedAssignment() {
        int row = selectedModelRow(draftTable);
        if (row < 0) {
            showError("Chọn một buổi trong bảng trước.");
            return null;
        }
        return workspace().getDraft().get(row);
    }

    private void editSelected() {
        Assignment current = selectedAssignment();
        if (current == null) {
            return;
        }
        PlanSession session = workspace().findSession(current.getSessionId());
        List<String> candidates = new Convention(workspace().getRules()).candidatesFor(session);
        AssignmentDialog dialog = new AssignmentDialog(frame, session, current, candidates);
        Assignment updated = dialog.showDialog();
        if (updated != null) {
            service.replaceInDraft(workspace(), updated);
            frame.markChanged();
            afterEdit.run();
        }
    }

    private void toggleLock() {
        Assignment current = selectedAssignment();
        if (current == null) {
            return;
        }
        service.replaceInDraft(workspace(), current.withLocked(!current.isLocked()));
        dataChanged();
    }

    private void refreshDraftDropdowns() {
        String selectedKind = (String) draftKindFilter.getSelectedItem();
        String selectedProgram = (String) draftProgramFilter.getSelectedItem();
        String selectedCohort = (String) draftCohortFilter.getSelectedItem();
        updatingDraftFilters = true;
        draftKindFilter.removeAllItems();
        draftProgramFilter.removeAllItems();
        draftCohortFilter.removeAllItems();
        draftKindFilter.addItem(ALL);
        for (SessionKind kind : SessionKind.values()) {
            draftKindFilter.addItem(kind.getLabel());
        }
        draftProgramFilter.addItem(ALL);
        for (Program program : Program.values()) {
            draftProgramFilter.addItem(program.getDisplayName());
        }
        draftCohortFilter.addItem(ALL);
        Set<String> cohorts = new TreeSet<>();
        for (PlanSession session : workspace().getPlan()) {
            cohorts.add(session.getCohort());
        }
        for (String cohort : cohorts) {
            draftCohortFilter.addItem(cohort);
        }
        draftKindFilter.setSelectedItem(selectedKind == null ? ALL : selectedKind);
        draftProgramFilter.setSelectedItem(selectedProgram == null ? ALL : selectedProgram);
        draftCohortFilter.setSelectedItem(
                selectedCohort != null && cohorts.contains(selectedCohort) ? selectedCohort : ALL);
        updatingDraftFilters = false;
        refreshDraftFilter();
    }

    private void refreshDraftFilter() {
        if (updatingDraftFilters) {
            return;
        }
        String courseCode = draftCourseCodeSearch.getText().trim().toLowerCase(Locale.ROOT);
        String courseName = draftCourseNameSearch.getText().trim().toLowerCase(Locale.ROOT);
        String teacherQuery = draftTeacherSearch.getText().trim().toLowerCase(Locale.ROOT);
        String kind = (String) draftKindFilter.getSelectedItem();
        String program = (String) draftProgramFilter.getSelectedItem();
        String cohort = (String) draftCohortFilter.getSelectedItem();
        draftSorter.setRowFilter(new RowFilter<DefaultTableModel, Integer>() {
            @Override
            public boolean include(Entry<? extends DefaultTableModel, ? extends Integer> entry) {
                String teacherCode = entry.getStringValue(7);
                Teacher teacher = workspace().findTeacher(teacherCode);
                boolean matchesTeacher = teacherCode.toLowerCase(Locale.ROOT).contains(teacherQuery)
                        || (teacher != null
                                && teacher.getFullName().toLowerCase(Locale.ROOT).contains(teacherQuery));
                return entry.getStringValue(1).toLowerCase(Locale.ROOT).contains(courseCode)
                        && entry.getStringValue(2).toLowerCase(Locale.ROOT).contains(courseName)
                        && matchesTeacher
                        && (kind == null || kind.equals(ALL) || kind.equals(entry.getStringValue(3)))
                        && (program == null || program.equals(ALL) || program.equals(entry.getStringValue(4)))
                        && (cohort == null || cohort.equals(ALL) || cohort.equals(entry.getStringValue(5)));
            }
        });
    }

    @Override
    public void refresh() {
        draftModel.setRowCount(0);
        for (Assignment assignment : workspace().getDraft()) {
            PlanSession session = workspace().findSession(assignment.getSessionId());
            if (session == null) {
                // vẫn thêm dòng để dòng i của bảng ứng với phần tử i của bản nháp
                draftModel.addRow(new Object[] {assignment.getSessionId(), "?", "", "", "", "", "",
                    assignment.getTeacherCode(), "", ""});
                continue;
            }
            draftModel.addRow(new Object[] {session.getId(), session.getCourseCode(), session.getCourseName(),
                session.getKind().getLabel(), session.getProgram().getDisplayName(), session.getCohort(),
                session.getGroup(), assignment.getTeacherCode(),
                TimeSlots.describe(assignment.getDay(), assignment.getStartSlot(), session.getSlotCount()),
                assignment.isLocked() ? "Có" : ""});
        }
        refreshDraftDropdowns();
    }
}
