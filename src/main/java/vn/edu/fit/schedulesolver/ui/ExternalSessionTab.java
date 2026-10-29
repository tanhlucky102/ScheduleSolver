package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.table.DefaultTableModel;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.model.ExternalSession;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.service.ExternalScheduleGenerator;

/** Tab TKB ở trường khác: giảng viên nhập buổi dạy theo giờ thật của trường đó. */
public class ExternalSessionTab extends TeacherTab {
    private final JTextField schoolField = new JTextField(16);
    private final JTextField courseField = new JTextField(14);
    private final JTextField classField = new JTextField(8);
    private final JTextField roomField = new JTextField(6);
    private final JComboBox<String> dayBox = new JComboBox<>();
    private final JTextField startField = new JTextField("07:00", 5);
    private final JTextField endField = new JTextField("09:30", 5);
    private final DefaultTableModel externalModel = readOnlyModel("Thứ", "Bắt đầu", "Kết thúc", "Trường", "Môn",
            "Lớp", "Phòng", "Ca của khoa bị chặn", "Nguồn");
    private final JTable externalTable = createTable(externalModel);
    private final List<ExternalSession> shownExternal = new ArrayList<>();

    public ExternalSessionTab(MainFrame frame) {
        super(frame);
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            dayBox.addItem(TimeSlots.dayName(day));
        }
        JLabel explain = new JLabel("<html>Nhập đúng giờ của trường kia (ví dụ 07:00 - 09:30), không cần khớp ca của khoa. "
                + "Lịch cá nhân vẽ theo giờ thật nên thấy rõ chỗ lệch giờ (Ca 1 của khoa bắt đầu 07:10).<br>"
                + "Giáo vụ chỉ thấy tên trường, thứ và khung giờ; bộ giải tránh mọi ca của khoa bị chồng giờ. "
                + "Chưa có TKB thật thì bấm \"Tạo TKB giả định\".</html>");
        JPanel info = new JPanel(new BorderLayout());
        Theme.card(info);
        info.add(explain, BorderLayout.CENTER);

        // chia 3 hàng để cửa sổ hẹp không che mất nút
        JPanel row1 = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 2));
        row1.add(new JLabel("Trường:"));
        row1.add(schoolField);
        row1.add(new JLabel("Môn:"));
        row1.add(courseField);
        row1.add(new JLabel("Lớp:"));
        row1.add(classField);
        row1.add(new JLabel("Phòng (nếu biết):"));
        row1.add(roomField);
        JPanel row2 = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 2));
        row2.add(new JLabel("Thứ:"));
        row2.add(dayBox);
        row2.add(new JLabel("Bắt đầu:"));
        row2.add(startField);
        row2.add(new JLabel("Kết thúc:"));
        row2.add(endField);
        JLabel format = new JLabel("(giờ:phút, ví dụ 07:00)");
        format.setForeground(Theme.MUTED_TEXT);
        row2.add(format);
        JPanel row3 = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 2));
        row3.add(createButton("Thêm", Theme.SUCCESS, e -> addExternal()));
        row3.add(createButton("Xóa dòng chọn", Theme.DANGER, e -> removeExternal()));
        row3.add(createButton("Tạo TKB giả định", Theme.WARNING, e -> generateExternal()));
        row3.add(createButton("Nạp từ CSV...", Theme.NEUTRAL, e -> importExternalCsv()));
        row3.add(createButton("Lưu ra CSV...", Theme.NEUTRAL, e -> exportExternalCsv()));
        JPanel form = new JPanel(new GridLayout(0, 1, 0, 2));
        form.setBorder(Theme.titled("Thêm buổi dạy ở trường khác (lặp lại hằng tuần cả học kỳ)"));
        form.add(row1);
        form.add(row2);
        form.add(row3);

        setColumnWidths(externalTable, 60, 70, 70, 210, 160, 90, 70, 140, 80);
        add(info, BorderLayout.NORTH);
        add(new JScrollPane(externalTable), BorderLayout.CENTER);
        add(form, BorderLayout.SOUTH);
    }

    private void addExternal() {
        try {
            int day = TimeSlots.FIRST_DAY + dayBox.getSelectedIndex();
            ExternalSession session = new ExternalSession(teacherCode, schoolField.getText(), courseField.getText(),
                    classField.getText(), day, TimeSlots.parseTime(startField.getText()),
                    TimeSlots.parseTime(endField.getText()), roomField.getText(), false);
            workspace().getExternalSessions().add(session);
            // giữ tên trường vì thường nhập nhiều buổi của cùng một trường
            courseField.setText("");
            classField.setText("");
            roomField.setText("");
            dataChanged();
            showInfo("Đã thêm buổi " + session.getTimeText() + " ở " + session.getSchool() + ".\n"
                    + "Giờ này chặn " + TimeSlots.describeMask(session.getMask()) + " của khoa, lần xếp lịch sau giáo vụ sẽ tránh.\n"
                    + "Nếu trùng lịch đã công bố, cần báo giáo vụ xếp lại.");
        } catch (IllegalArgumentException e) {
            showError(e.getMessage());
        }
    }

    private void removeExternal() {
        int row = selectedModelRow(externalTable);
        if (row < 0) {
            showError("Chọn một buổi trong bảng trước.");
            return;
        }
        workspace().getExternalSessions().remove(shownExternal.get(row));
        dataChanged();
    }

    /** Thay các buổi giả định cũ của giảng viên này, buổi tự nhập giữ nguyên. */
    private void generateExternal() {
        List<ExternalSession> all = workspace().getExternalSessions();
        all.removeIf(session -> session.getTeacherCode().equalsIgnoreCase(teacherCode) && session.isAssumed());
        // seed theo mã GV để mỗi lần bấm ra cùng một TKB
        List<ExternalSession> generated = new ExternalScheduleGenerator().generate(teacherCode, teacherCode.hashCode());
        all.addAll(generated);
        dataChanged();
        showInfo("Đã tạo " + generated.size() + " buổi giả định ở " + generated.get(0).getSchool()
                + ".\nGiờ học của trường này cũng là giả định. Các buổi tự nhập vẫn giữ nguyên.");
    }

    /** Nạp từ CSV, bỏ qua các dòng của giảng viên khác. */
    private void importExternalCsv() {
        File file = chooseCsv(false, "lich_truong_khac_" + teacherCode + ".csv");
        if (file == null) {
            return;
        }
        try {
            int added = 0;
            int skipped = 0;
            for (ExternalSession session : DataFiles.readExternalSessions(file)) {
                if (session.getTeacherCode().equalsIgnoreCase(teacherCode)) {
                    workspace().getExternalSessions().add(session);
                    added++;
                } else {
                    skipped++;
                }
            }
            dataChanged();
            String note = skipped > 0 ? " (bỏ qua " + skipped + " dòng của giảng viên khác)" : "";
            showInfo("Đã nạp " + added + " buổi dạy ở trường khác" + note + ".");
        } catch (IOException e) {
            showError(e.getMessage());
        }
    }

    private void exportExternalCsv() {
        File file = chooseCsv(true, "lich_truong_khac_" + teacherCode + ".csv");
        if (file == null) {
            return;
        }
        try {
            DataFiles.writeExternalSessions(file, shownExternal);
            showInfo("Đã lưu " + shownExternal.size() + " buổi vào " + file.getName());
        } catch (IOException e) {
            showError(e.getMessage());
        }
    }

    @Override
    public void refresh() {
        externalModel.setRowCount(0);
        shownExternal.clear();
        for (ExternalSession session : workspace().getExternalSessionsOf(teacherCode)) {
            shownExternal.add(session);
            externalModel.addRow(new Object[] {TimeSlots.dayName(session.getDay()),
                TimeSlots.formatTime(session.getStartMinute()), TimeSlots.formatTime(session.getEndMinute()),
                session.getSchool(), session.getCourseName(), session.getClassName(), session.getRoom(),
                TimeSlots.describeMask(session.getMask()), session.isAssumed() ? "Giả định" : "Tự nhập"});
        }
    }
}
