package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTabbedPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.table.AbstractTableModel;
import javax.swing.table.DefaultTableModel;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.io.GridExcelReader;
import vn.edu.fit.schedulesolver.io.PlanExcelReader;
import vn.edu.fit.schedulesolver.io.PlanRow;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.service.Convention;
import vn.edu.fit.schedulesolver.service.ConventionBuilder;
import vn.edu.fit.schedulesolver.service.GridTimetable;
import vn.edu.fit.schedulesolver.service.GridTimetableConverter;
import vn.edu.fit.schedulesolver.service.PlanBuilder;

/** Màn hình của trưởng khoa: giảng viên, quy ước phân công và kế hoạch mở lớp. */
public class DeanPanel extends BasePanel {
    private static final String ALL_PROGRAMS = "Tất cả chương trình";

    // tab Giảng viên
    private final DefaultTableModel teacherModel =
            readOnlyModel("Mã GV", "Họ tên", "Tối đa ca/ngày", "Tối đa ca/tuần");
    private final JTable teacherTable = createTable(teacherModel);
    private final JTextField codeField = new JTextField(8);
    private final JTextField nameField = new JTextField(16);
    private final JSpinner maxDaySpinner = new JSpinner(new SpinnerNumberModel(4, 1, 6, 1));
    private final JSpinner maxWeekSpinner = new JSpinner(new SpinnerNumberModel(12, 1, 36, 1));

    // tab Quy ước phân công
    private final JComboBox<String> programFilter = new JComboBox<>();
    private final RuleTableModel ruleModel = new RuleTableModel();
    private final JTable ruleTable = createTable(ruleModel);
    private final JComboBox<String> ruleCourseBox = new JComboBox<>();
    private final JComboBox<String> ruleTeacherBox = new JComboBox<>();
    private final JCheckBox ruleLectureBox = new JCheckBox("Dạy Lec", true);
    private final JCheckBox ruleTutorialBox = new JCheckBox("Dạy Tut", true);
    private final JLabel ruleCount = new JLabel();

    // tab Kế hoạch mở lớp
    private final DefaultTableModel planModel = readOnlyModel("Mã buổi", "Mã môn", "Tên môn", "Chương trình",
            "Khóa", "Nhóm", "Loại", "Số SV", "Số ca", "GV phụ trách");
    private final JLabel planStatus = new JLabel();
    private final JTextArea checkArea = new JTextArea(5, 60);

    public DeanPanel(MainFrame frame) {
        super(frame);
        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("1. Giảng viên", createTeacherTab());
        tabs.addTab("2. Quy ước phân công", createRuleTab());
        tabs.addTab("3. Kế hoạch mở lớp", createPlanTab());
        add(tabs, BorderLayout.CENTER);
    }

    // Tab 1: Giảng viên
    private JPanel createTeacherTab() {
        JPanel panel = new JPanel(new BorderLayout(6, 6));
        panel.add(new JScrollPane(teacherTable), BorderLayout.CENTER);
        teacherTable.getSelectionModel().addListSelectionListener(e -> showSelectedTeacher());

        JPanel form = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 6));
        form.setBorder(Theme.titled("Thêm / sửa giảng viên (chọn một dòng để sửa)"));
        form.add(new JLabel("Mã GV:"));
        form.add(codeField);
        form.add(new JLabel("Họ tên:"));
        form.add(nameField);
        form.add(new JLabel("Tối đa ca/ngày:"));
        form.add(maxDaySpinner);
        form.add(new JLabel("Tối đa ca/tuần:"));
        form.add(maxWeekSpinner);
        form.add(createButton("Thêm / Cập nhật", Theme.SUCCESS, e -> saveTeacher()));
        form.add(createButton("Xóa", Theme.DANGER, e -> removeTeacher()));
        form.add(createButton("Nạp CSV...", Theme.NEUTRAL, e -> loadTeachersCsv()));
        form.add(createButton("Lưu CSV...", Theme.NEUTRAL, e -> saveTeachersCsv()));
        panel.add(form, BorderLayout.SOUTH);
        return panel;
    }

    private void showSelectedTeacher() {
        int row = selectedModelRow(teacherTable);
        if (row < 0) {
            return;
        }
        Teacher teacher = workspace().getTeachers().get(row);
        codeField.setText(teacher.getCode());
        nameField.setText(teacher.getFullName());
        maxDaySpinner.setValue(teacher.getMaxSlotsPerDay());
        maxWeekSpinner.setValue(teacher.getMaxSlotsPerWeek());
    }

    private void saveTeacher() {
        try {
            String code = codeField.getText().trim();
            int maxDay = (Integer) maxDaySpinner.getValue();
            int maxWeek = (Integer) maxWeekSpinner.getValue();
            Teacher existing = workspace().findTeacher(code);
            if (existing == null) {
                workspace().getTeachers().add(new Teacher(code, nameField.getText(), maxDay, maxWeek));
            } else {
                existing.setFullName(nameField.getText());
                existing.setMaxSlotsPerDay(maxDay);
                existing.setMaxSlotsPerWeek(maxWeek);
            }
            dataChanged();
        } catch (IllegalArgumentException e) {
            showError(e.getMessage());
        }
    }

    private void removeTeacher() {
        int row = selectedModelRow(teacherTable);
        if (row < 0) {
            showError("Chọn một giảng viên trong bảng trước.");
            return;
        }
        workspace().getTeachers().remove(row);
        dataChanged();
    }

    private void loadTeachersCsv() {
        File file = chooseCsv(false, "giang_vien.csv");
        if (file == null) {
            return;
        }
        try {
            List<Teacher> loaded = DataFiles.readTeachers(file);
            workspace().getTeachers().clear();
            workspace().getTeachers().addAll(loaded);
            dataChanged();
        } catch (IOException e) {
            showError(e.getMessage());
        }
    }

    private void saveTeachersCsv() {
        File file = chooseCsv(true, "giang_vien.csv");
        if (file == null) {
            return;
        }
        try {
            DataFiles.writeTeachers(file, workspace().getTeachers());
            showInfo("Đã lưu " + file.getName());
        } catch (IOException e) {
            showError(e.getMessage());
        }
    }

    // Tab 2: Quy ước phân công
    private JPanel createRuleTab() {
        JPanel panel = new JPanel(new BorderLayout(6, 6));
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
        filterRow.add(ruleCount);
        top.add(filterRow, BorderLayout.SOUTH);
        panel.add(top, BorderLayout.NORTH);

        panel.add(new JScrollPane(ruleTable), BorderLayout.CENTER);

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
        panel.add(form, BorderLayout.SOUTH);
        return panel;
    }

    private void refreshRules() {
        String selected = (String) programFilter.getSelectedItem();
        List<TeachingRule> shown = new ArrayList<>();
        for (TeachingRule rule : workspace().getRules()) {
            Program program = rule.getProgram();
            boolean all = selected == null || selected.equals(ALL_PROGRAMS);
            if (all || (program != null && program.getLabel().equals(selected))) {
                shown.add(rule);
            }
        }
        ruleModel.setRows(shown);
        ruleCount.setText("   " + shown.size() + " dòng");
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

    // Tab 3: Kế hoạch mở lớp
    private JPanel createPlanTab() {
        JPanel panel = new JPanel(new BorderLayout(6, 6));
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
        explainCard.add(explain, BorderLayout.CENTER);
        JPanel top = new JPanel(new BorderLayout(6, 6));
        top.add(buttons, BorderLayout.NORTH);
        top.add(explainCard, BorderLayout.CENTER);
        panel.add(top, BorderLayout.NORTH);
        panel.add(new JScrollPane(createTable(planModel)), BorderLayout.CENTER);
        checkArea.setEditable(false);
        JScrollPane checkScroll = new JScrollPane(checkArea);
        checkScroll.setBorder(Theme.titled("Kết quả kiểm tra"));
        panel.add(checkScroll, BorderLayout.SOUTH);
        return panel;
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

    // Dùng chung
    private File chooseWorkbook() {
        JFileChooser chooser = new JFileChooser(MainFrame.RESOURCES);
        chooser.setFileFilter(new FileNameExtensionFilter("File Excel (*.xlsx)", "xlsx"));
        chooser.setSelectedFile(MainFrame.DEFAULT_WORKBOOK);
        if (chooser.showOpenDialog(this) != JFileChooser.APPROVE_OPTION) {
            return null;
        }
        return chooser.getSelectedFile();
    }

    @Override
    public void refresh() {
        teacherModel.setRowCount(0);
        ruleTeacherBox.removeAllItems();
        for (Teacher teacher : workspace().getTeachers()) {
            teacherModel.addRow(new Object[] {teacher.getCode(), teacher.getFullName(), teacher.getMaxSlotsPerDay(),
                teacher.getMaxSlotsPerWeek()});
            ruleTeacherBox.addItem(teacher.getCode());
        }
        refreshCourseBox();
        refreshRules();

        Convention convention = new Convention(workspace().getRules());
        planModel.setRowCount(0);
        for (PlanSession session : workspace().getPlan()) {
            planModel.addRow(new Object[] {session.getId(), session.getCourseCode(), session.getCourseName(),
                session.getProgram().getDisplayName(), session.getCohort(), session.getGroup(),
                session.getKind().getLabel(), session.getStudentCount(), session.getSlotCount(),
                String.join(", ", convention.candidatesFor(session))});
        }
        String sent = workspace().isPlanSent() ? "ĐÃ GỬI cho giáo vụ" : "chưa gửi";
        planStatus.setForeground(workspace().isPlanSent() ? Theme.SUCCESS : Theme.WARNING);
        planStatus.setText("   Kế hoạch: " + workspace().getPlan().size() + " buổi - " + sent);
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
}
