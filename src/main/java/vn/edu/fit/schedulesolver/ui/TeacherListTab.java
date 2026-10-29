package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;
import javax.swing.table.DefaultTableModel;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;

/** Tab 1 của trưởng khoa: danh sách giảng viên, giới hạn tải và các môn mỗi người phụ trách. */
public class TeacherListTab extends BasePanel {
    private final DefaultTableModel teacherModel = readOnlyModel("Mã GV", "Họ tên", "Tối đa ca/ngày",
            "Tối đa ca/tuần", "Số môn", "Môn phụ trách (theo quy ước)");
    private final JTable teacherTable = createTable(teacherModel);
    private final JTextField teacherSearchField = new JTextField(18);
    private final JLabel teacherCheck = new JLabel();
    private final JTextField codeField = new JTextField(8);
    private final JTextField nameField = new JTextField(16);
    private final JSpinner maxDaySpinner = new JSpinner(new SpinnerNumberModel(4, 1, 6, 1));
    private final JSpinner maxWeekSpinner = new JSpinner(new SpinnerNumberModel(12, 1, 36, 1));

    public TeacherListTab(MainFrame frame) {
        super(frame);
        useTabLayout();
        JLabel explain = new JLabel("<html>Mã GV là tên viết tắt ghi trên TKB của khoa (ví dụ NgaNT), Họ tên không bắt buộc. "
                + "\"Dung\" (dạy truyền thông MME) và DungVT là hai người khác nhau.<br>"
                + "Giới hạn mặc định 4 ca/ngày, 12 ca/tuần. GV nào trên TKB của khoa đã dạy nhiều hơn "
                + "thì lấy theo tải thật (ví dụ ThaoDTP 18 ca/tuần), để bộ giải không báo vi phạm sai.</html>");
        JPanel top = new JPanel(new BorderLayout(4, 4));
        Theme.card(top);
        top.add(explain, BorderLayout.CENTER);
        teacherCheck.setFont(Theme.BOLD);
        top.add(teacherCheck, BorderLayout.SOUTH);
        add(top, BorderLayout.NORTH);
        setColumnWidths(teacherTable, 90, 200, 100, 100, 60, 420);
        JPanel tablePanel = new JPanel(new BorderLayout(4, 4));
        tablePanel.add(createSearchPanel("Tìm giảng viên:", teacherSearchField), BorderLayout.NORTH);
        tablePanel.add(new JScrollPane(teacherTable), BorderLayout.CENTER);
        add(tablePanel, BorderLayout.CENTER);
        addTableSearch(teacherSearchField, teacherTable);
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
        add(form, BorderLayout.SOUTH);
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

    @Override
    public void refresh() {
        teacherModel.setRowCount(0);
        int noCourse = 0;
        for (Teacher teacher : workspace().getTeachers()) {
            List<String> courses = coursesOf(teacher.getCode());
            teacherModel.addRow(new Object[] {teacher.getCode(), teacher.getFullName(), teacher.getMaxSlotsPerDay(),
                teacher.getMaxSlotsPerWeek(), courses.size(), String.join(", ", courses)});
            if (courses.isEmpty()) {
                noCourse++;
            }
        }
        teacherCheck.setForeground(noCourse == 0 ? Theme.SUCCESS : Theme.WARNING);
        teacherCheck.setText("Kiểm tra: " + workspace().getTeachers().size() + " giảng viên, "
                + noCourse + " GV chưa phụ trách môn nào.");
    }

    /** Các mã môn mà GV được phân công trong quy ước, không lặp. */
    private List<String> coursesOf(String teacherCode) {
        List<String> courses = new ArrayList<>();
        for (TeachingRule rule : workspace().getRules()) {
            if (rule.getTeacherCode().equalsIgnoreCase(teacherCode) && !courses.contains(rule.getCourseCode())) {
                courses.add(rule.getCourseCode());
            }
        }
        return courses;
    }
}
