package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.TreeSet;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.table.AbstractTableModel;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.io.GridExcelReader;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.service.ConventionBuilder;
import vn.edu.fit.schedulesolver.service.GridTimetable;
import vn.edu.fit.schedulesolver.service.GridTimetableConverter;

/** Tab 2 của trưởng khoa: quy ước môn nào do giảng viên nào phụ trách, dạy Lec hay Tut. */
public class RuleTab extends BasePanel {
    private static final String ALL_PROGRAMS = "Tất cả chương trình";

    private final JComboBox<String> programFilter = new JComboBox<>();
    private final JTextField courseSearchField = new JTextField(12);
    private final JTextField ruleCourseNameSearchField = new JTextField(12);
    private final JTextField ruleTeacherSearchField = new JTextField(12);
    private final RuleTableModel ruleModel = new RuleTableModel();
    private final JTable ruleTable = createTable(ruleModel);
    private final JComboBox<String> ruleCourseBox = new JComboBox<>();
    private final JComboBox<String> ruleTeacherBox = new JComboBox<>();
    private final JCheckBox ruleLectureBox = new JCheckBox("Dạy Lec", true);
    private final JCheckBox ruleTutorialBox = new JCheckBox("Dạy Tut", true);
    private final JLabel ruleCount = new JLabel();

    public RuleTab(MainFrame frame) {
        super(frame);
        useTabLayout();
        JLabel explain = new JLabel("<html><b>Quy ước: mỗi môn do những giảng viên nào phụ trách, dạy Lec hay Tut</b>"
                + " (chi tiết: docs/QUY_UOC_PHAN_CONG.md)<br>"
                + "• Đại trà, MME: lớp Lec (cả khóa học chung) và các nhóm Tut (khoảng 30 SV) có thể do các GV khác nhau phụ trách. "
                + "Ví dụ 61FIT2PR1: QuyenNV dạy Lec và Tut, AnhVQ và VinhTT chỉ dạy Tut; bộ giải tự chia 5 nhóm Tut cho 3 GV này.<br>"
                + "• CLC, TT và môn 4 tiết (ví dụ SS1): Lec và Tut học liền nhau trong 1 buổi (2 ca) với 1 GV, "
                + "nên GV phải được đánh dấu cả \"Dạy Lec\" và \"Dạy Tut\".<br>"
                + "• Muốn một nhóm cụ thể do đúng một GV dạy: giáo vụ sửa buổi đó trong \"Danh sách buổi\" và đánh dấu Cố định.</html>");
        JPanel top = new JPanel(new BorderLayout(6, 6));
        Theme.card(top);
        top.add(explain, BorderLayout.CENTER);
        JPanel filterRow = new JPanel(new FlowLayout(FlowLayout.LEFT));
        filterRow.setOpaque(false);
        filterRow.add(new JLabel("Xem chương trình:"));
        programFilter.addItem(ALL_PROGRAMS);
        for (Program program : Program.values()) {
            programFilter.addItem(program.getLabel());
        }
        programFilter.addActionListener(e -> refreshRules());
        filterRow.add(programFilter);
        filterRow.add(new JLabel("Tìm mã môn:"));
        filterRow.add(courseSearchField);
        filterRow.add(new JLabel("Tìm tên môn:"));
        filterRow.add(ruleCourseNameSearchField);
        filterRow.add(new JLabel("Tìm giảng viên:"));
        filterRow.add(ruleTeacherSearchField);
        filterRow.add(ruleCount);
        addRuleSearchListener(courseSearchField);
        addRuleSearchListener(ruleCourseNameSearchField);
        addRuleSearchListener(ruleTeacherSearchField);
        top.add(filterRow, BorderLayout.SOUTH);
        add(top, BorderLayout.NORTH);

        add(new JScrollPane(ruleTable), BorderLayout.CENTER);

        ruleCourseBox.setEditable(true);
        JPanel form = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 6));
        form.setBorder(Theme.titled("Thêm / sửa quy ước (đánh dấu trực tiếp trong bảng để sửa Lec/Tut)"));
        form.add(new JLabel("Mã môn:"));
        form.add(ruleCourseBox);
        form.add(new JLabel("Giảng viên:"));
        form.add(ruleTeacherBox);
        form.add(ruleLectureBox);
        form.add(ruleTutorialBox);
        form.add(createButton("Thêm", Theme.SUCCESS, e -> addRule()));
        form.add(createButton("Xóa dòng chọn", Theme.DANGER, e -> removeRules()));
        form.add(createButton("Đề xuất từ TKB cũ...", Theme.WARNING, e -> suggestFromOldTimetable()));
        form.add(createButton("Nạp CSV...", Theme.NEUTRAL, e -> loadRulesCsv()));
        form.add(createButton("Lưu CSV...", Theme.NEUTRAL, e -> saveRulesCsv()));
        add(form, BorderLayout.SOUTH);
    }

    private void refreshRules() {
        String selected = (String) programFilter.getSelectedItem();
        String courseSearch = courseSearchField.getText().trim().toLowerCase(Locale.ROOT);
        String courseNameSearch = ruleCourseNameSearchField.getText().trim().toLowerCase(Locale.ROOT);
        String teacherSearch = ruleTeacherSearchField.getText().trim().toLowerCase(Locale.ROOT);
        List<TeachingRule> shown = new ArrayList<>();
        for (TeachingRule rule : workspace().getRules()) {
            Program program = rule.getProgram();
            Teacher teacher = workspace().findTeacher(rule.getTeacherCode());
            boolean all = selected == null || selected.equals(ALL_PROGRAMS);
            boolean matchesProgram = all || (program != null && program.getLabel().equals(selected));
            boolean matchesCourse = rule.getCourseCode().toLowerCase(Locale.ROOT).contains(courseSearch);
            boolean matchesCourseName = rule.getCourseName().toLowerCase(Locale.ROOT).contains(courseNameSearch);
            boolean matchesTeacher = rule.getTeacherCode().toLowerCase(Locale.ROOT).contains(teacherSearch)
                    || (teacher != null && teacher.getFullName().toLowerCase(Locale.ROOT).contains(teacherSearch));
            if (matchesProgram && matchesCourse && matchesCourseName && matchesTeacher) {
                shown.add(rule);
            }
        }
        ruleModel.setRows(shown);
        ruleCount.setText("   " + shown.size() + " dòng");
    }

    private void addRuleSearchListener(JTextField field) {
        field.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent event) {
                refreshRules();
            }

            @Override
            public void removeUpdate(DocumentEvent event) {
                refreshRules();
            }

            @Override
            public void changedUpdate(DocumentEvent event) {
                refreshRules();
            }
        });
    }

    private void addRule() {
        Object typed = ruleCourseBox.getEditor().getItem();
        String course = typed == null ? "" : typed.toString().trim().toUpperCase();
        String teacher = (String) ruleTeacherBox.getSelectedItem();
        if (Program.fromCourseCode(course) == null) {
            showError("Mã môn phải bắt đầu bằng 61FIT, 61MME, 62FIT hoặc 66FIT.");
            return;
        }
        if (teacher == null) {
            showError("Chưa có giảng viên nào. Thêm giảng viên ở tab 1 trước.");
            return;
        }
        try {
            TeachingRule existing = ConventionBuilder.findRule(workspace().getRules(), course, teacher);
            if (existing != null) {
                existing.setCanLecture(ruleLectureBox.isSelected());
                existing.setCanTutorial(ruleTutorialBox.isSelected());
            } else {
                workspace().getRules().add(new TeachingRule(course, courseNameOf(course), teacher,
                        ruleLectureBox.isSelected(), ruleTutorialBox.isSelected()));
            }
            dataChanged();
        } catch (IllegalArgumentException e) {
            showError(e.getMessage());
        }
    }

    private String courseNameOf(String course) {
        for (PlanSession session : workspace().getPlan()) {
            if (session.getCourseCode().equals(course)) {
                return session.getCourseName();
            }
        }
        for (TeachingRule rule : workspace().getRules()) {
            if (rule.getCourseCode().equals(course) && !rule.getCourseName().isEmpty()) {
                return rule.getCourseName();
            }
        }
        return "";
    }

    private void removeRules() {
        int[] rows = ruleTable.getSelectedRows();
        if (rows.length == 0) {
            showError("Chọn các dòng quy ước cần xóa.");
            return;
        }
        List<TeachingRule> toRemove = new ArrayList<>();
        for (int row : rows) {
            toRemove.add(ruleModel.getRule(ruleTable.convertRowIndexToModel(row)));
        }
        workspace().getRules().removeAll(toRemove);
        dataChanged();
    }

    /** Đề xuất quy ước từ TKB cũ, phần đọc Excel chạy ở luồng nền. */
    private void suggestFromOldTimetable() {
        File file = chooseWorkbook();
        if (file == null) {
            return;
        }
        // chép ra list mới để luồng nền không đụng vào Workspace
        List<Teacher> teachers = new ArrayList<>(workspace().getTeachers());
        List<PlanSession> plan = new ArrayList<>(workspace().getPlan());
        List<TeachingRule> currentRules = new ArrayList<>(workspace().getRules());
        frame.runInBackground("Đọc TKB cũ", () -> {
            GridTimetable grid = new GridTimetableConverter().convert(new GridExcelReader().read(file), teachers);
            ConventionBuilder builder = new ConventionBuilder();
            Suggestion suggestion = new Suggestion();
            suggestion.newTeachers = builder.newTeachers(grid, teachers);
            suggestion.rules = builder.buildDefault(grid, plan);
            // môn TKB cũ không ghi giảng viên thì giữ quy ước đang có
            suggestion.kept = builder.keepCurrentRules(suggestion.rules, currentRules, plan);
            suggestion.skipped = grid.getWarnings().size();
            return suggestion;
        }, suggestion -> {
            String kept = suggestion.kept == 0 ? ""
                    : "\nGiữ lại " + suggestion.kept + " dòng quy ước hiện tại cho các môn TKB cũ không ghi giảng viên.";
            int answer = JOptionPane.showConfirmDialog(this, "Đề xuất " + suggestion.rules.size() + " dòng quy ước, "
                    + suggestion.newTeachers.size() + " giảng viên mới (" + suggestion.skipped
                    + " ô trên TKB cũ không rõ giảng viên bị bỏ qua)." + kept + "\nThay quy ước hiện tại bằng đề xuất này?",
                    "Đề xuất quy ước", JOptionPane.YES_NO_OPTION);
            if (answer == JOptionPane.YES_OPTION) {
                workspace().getTeachers().addAll(suggestion.newTeachers);
                workspace().getRules().clear();
                workspace().getRules().addAll(suggestion.rules);
                dataChanged();
            }
        });
    }

    /** Kết quả đề xuất trả về từ luồng nền. */
    private static class Suggestion {
        List<Teacher> newTeachers;
        List<TeachingRule> rules;
        int kept;
        int skipped;
    }

    private void loadRulesCsv() {
        File file = chooseCsv(false, "quy_uoc_phan_cong.csv");
        if (file == null) {
            return;
        }
        try {
            List<TeachingRule> loaded = DataFiles.readRules(file);
            workspace().getRules().clear();
            workspace().getRules().addAll(loaded);
            dataChanged();
        } catch (IOException e) {
            showError(e.getMessage());
        }
    }

    private void saveRulesCsv() {
        File file = chooseCsv(true, "quy_uoc_phan_cong.csv");
        if (file == null) {
            return;
        }
        try {
            DataFiles.writeRules(file, workspace().getRules());
            showInfo("Đã lưu " + file.getName());
        } catch (IOException e) {
            showError(e.getMessage());
        }
    }

    @Override
    public void refresh() {
        ruleTeacherBox.removeAllItems();
        for (Teacher teacher : workspace().getTeachers()) {
            ruleTeacherBox.addItem(teacher.getCode());
        }
        refreshCourseBox();
        refreshRules();
    }

    /** Dùng TreeSet để bỏ mã môn trùng và xếp A-Z. */
    private void refreshCourseBox() {
        TreeSet<String> courses = new TreeSet<>();
        for (PlanSession session : workspace().getPlan()) {
            courses.add(session.getCourseCode());
        }
        for (TeachingRule rule : workspace().getRules()) {
            courses.add(rule.getCourseCode());
        }
        ruleCourseBox.removeAllItems();
        for (String course : courses) {
            ruleCourseBox.addItem(course);
        }
    }

    /** Bảng quy ước, 2 cột cuối là ô tick sửa thẳng trên bảng. */
    private class RuleTableModel extends AbstractTableModel {
        private final String[] columns = {"Chương trình", "Mã môn", "Tên môn", "GV phụ trách", "Dạy Lec", "Dạy Tut"};
        private List<TeachingRule> rows = new ArrayList<>();

        void setRows(List<TeachingRule> newRows) {
            rows = newRows;
            fireTableDataChanged();
        }

        TeachingRule getRule(int row) {
            return rows.get(row);
        }

        @Override
        public int getRowCount() {
            return rows.size();
        }

        @Override
        public int getColumnCount() {
            return columns.length;
        }

        @Override
        public String getColumnName(int column) {
            return columns[column];
        }

        @Override
        public Class<?> getColumnClass(int column) {
            return column >= 4 ? Boolean.class : String.class;
        }

        @Override
        public boolean isCellEditable(int row, int column) {
            return column >= 4;
        }

        @Override
        public Object getValueAt(int row, int column) {
            TeachingRule rule = rows.get(row);
            switch (column) {
                case 0:
                    return rule.getProgram() == null ? "?" : rule.getProgram().getDisplayName();
                case 1:
                    return rule.getCourseCode();
                case 2:
                    return rule.getCourseName();
                case 3:
                    return rule.getTeacherCode();
                case 4:
                    return rule.isCanLecture();
                default:
                    return rule.isCanTutorial();
            }
        }

        @Override
        public void setValueAt(Object value, int row, int column) {
            TeachingRule rule = rows.get(row);
            boolean checked = (Boolean) value;
            boolean lecture = column == 4 ? checked : rule.isCanLecture();
            boolean tutorial = column == 5 ? checked : rule.isCanTutorial();
            if (!lecture && !tutorial) {
                showError("Giảng viên phải được dạy ít nhất Lec hoặc Tut. Muốn bỏ hẳn thì xóa dòng.");
                return;
            }
            rule.setCanLecture(lecture);
            rule.setCanTutorial(tutorial);
            frame.markChanged();
            fireTableRowsUpdated(row, row);
        }
    }
}
