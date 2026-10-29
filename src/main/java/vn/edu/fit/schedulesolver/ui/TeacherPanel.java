package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Color;
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
import javax.swing.JTabbedPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.table.DefaultTableModel;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.ExternalSession;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.service.ExternalScheduleGenerator;
import vn.edu.fit.schedulesolver.service.PersonalSchedule;

/**
 * Màn hình Giảng viên: lịch cá nhân gộp nhiều trường (vẽ theo giờ thật), TKB ở trường khác và lịch bận khác.
 * Môn, lớp, phòng ở trường khác và ghi chú riêng chỉ hiện ở đây, giáo vụ không thấy.
 */
public class TeacherPanel extends BasePanel {
    private String teacherCode = "";
    private final TimetableGridPanel gridPanel = new TimetableGridPanel();
    private final JLabel summaryLabel = new JLabel();
    private final JTextArea conflictArea = new JTextArea(3, 60);

    // tab TKB ở trường khác
    private final JTextField schoolField = new JTextField(16);
    private final JTextField courseField = new JTextField(14);
    private final JTextField classField = new JTextField(8);
    private final JTextField roomField = new JTextField(6);
    private final JComboBox<String> externalDayBox = new JComboBox<>();
    private final JTextField startField = new JTextField("07:00", 5);
    private final JTextField endField = new JTextField("09:30", 5);
    private final DefaultTableModel externalModel = readOnlyModel("Thứ", "Bắt đầu", "Kết thúc", "Trường", "Môn",
            "Lớp", "Phòng", "Ca của khoa bị chặn", "Nguồn");
    private final JTable externalTable = createTable(externalModel);
    private final List<ExternalSession> shownExternal = new ArrayList<>();

    // tab lịch bận khác
    private final JComboBox<String> dayBox = new JComboBox<>();
    private final JComboBox<String> fromBox = new JComboBox<>();
    private final JComboBox<String> toBox = new JComboBox<>();
    private final JTextField placeField = new JTextField(16);
    private final JTextField noteField = new JTextField(16);
    private final DefaultTableModel busyModel =
            readOnlyModel("Thứ", "Từ ca", "Đến ca", "Nơi bận (giáo vụ thấy)", "Ghi chú riêng (chỉ bạn thấy)");
    private final JTable busyTable = createTable(busyModel);
    private final List<BusySlot> shownBusy = new ArrayList<>();

    public TeacherPanel(MainFrame frame) {
        super(frame);
        summaryLabel.setFont(Theme.BOLD);
        summaryLabel.setForeground(Theme.PRIMARY_DARK);
        JPanel top = new JPanel(new BorderLayout());
        Theme.card(top);
        top.add(summaryLabel, BorderLayout.CENTER);
        add(top, BorderLayout.NORTH);

        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("Lịch cá nhân (gộp nhiều trường)", createScheduleTab());
        tabs.addTab("TKB ở trường khác", createExternalTab());
        tabs.addTab("Lịch bận khác", createBusyTab());
        add(tabs, BorderLayout.CENTER);
    }

    /** Gọi lúc đăng nhập để màn hình chỉ hiện dữ liệu của giảng viên này. */
    public void setTeacher(String code) {
        teacherCode = code;
    }

    private JPanel createScheduleTab() {
        JPanel legend = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 4));
        legend.add(new JLabel("Chú thích:"));
        for (Program program : Program.values()) {
            legend.add(Theme.legend(program.getDisplayName(), Theme.programFill(program), Theme.programAccent(program)));
        }
        legend.add(Theme.legend("Dạy ở trường khác", Theme.EXTERNAL_FILL, Theme.EXTERNAL_ACCENT));
        legend.add(Theme.legend("Lịch bận khác", Theme.BUSY_FILL, Theme.BUSY_ACCENT));
        legend.add(Theme.legend("Bị trùng lịch", Theme.CONFLICT_FILL, Theme.CONFLICT_ACCENT));
        JLabel note = new JLabel("Vẽ theo giờ thật: dải nền mờ là khung giờ các ca của khoa, ô ở trường khác đặt đúng giờ của trường đó.");
        note.setFont(Theme.SMALL);
        note.setForeground(Theme.MUTED_TEXT);
        JPanel top = new JPanel(new GridLayout(2, 1));
        top.add(legend);
        top.add(note);

        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.add(top, BorderLayout.NORTH);
        panel.add(new JScrollPane(gridPanel), BorderLayout.CENTER);
        conflictArea.setEditable(false);
        conflictArea.setFont(Theme.BOLD);
        panel.add(new JScrollPane(conflictArea), BorderLayout.SOUTH);
        return panel;
    }

    private JPanel createExternalTab() {
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            externalDayBox.addItem(TimeSlots.dayName(day));
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
        row2.add(externalDayBox);
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
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.add(info, BorderLayout.NORTH);
        panel.add(new JScrollPane(externalTable), BorderLayout.CENTER);
        panel.add(form, BorderLayout.SOUTH);
        return panel;
    }

    private JPanel createBusyTab() {
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            dayBox.addItem(TimeSlots.dayName(day));
        }
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            String text = TimeSlots.slotName(slot) + " (" + TimeSlots.slotTime(slot) + ")";
            fromBox.addItem(text);
            toBox.addItem(text);
        }
        JPanel row1 = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 2));
        row1.add(new JLabel("Thứ:"));
        row1.add(dayBox);
        row1.add(new JLabel("Từ:"));
        row1.add(fromBox);
        row1.add(new JLabel("Đến:"));
        row1.add(toBox);
        row1.add(new JLabel("Nơi bận:"));
        row1.add(placeField);
        row1.add(new JLabel("Ghi chú riêng:"));
        row1.add(noteField);
        JPanel row2 = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 2));
        row2.add(createButton("Thêm", Theme.SUCCESS, e -> addBusySlot()));
        row2.add(createButton("Xóa dòng chọn", Theme.DANGER, e -> removeBusySlot()));
        row2.add(createButton("Nạp từ CSV...", Theme.NEUTRAL, e -> importBusyCsv()));
        row2.add(createButton("Lưu ra CSV...", Theme.NEUTRAL, e -> exportBusyCsv()));
        JPanel form = new JPanel(new GridLayout(0, 1, 0, 2));
        form.setBorder(Theme.titled("Thêm lịch bận khác theo ca của khoa (cố định cả học kỳ, không chọn tuần)"));
        form.add(row1);
        form.add(row2);

        JLabel example = new JLabel("  Ví dụ: Thứ 5, Ca 3 đến Ca 4, nơi bận \"Họp bộ môn\". "
                + "Dạy ở trường khác thì nhập ở tab \"TKB ở trường khác\" để giữ đúng giờ của trường đó.");
        example.setForeground(Theme.MUTED_TEXT);

        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.add(example, BorderLayout.NORTH);
        panel.add(new JScrollPane(busyTable), BorderLayout.CENTER);
        panel.add(form, BorderLayout.SOUTH);
        return panel;
    }

    private void addExternal() {
        try {
            int day = TimeSlots.FIRST_DAY + externalDayBox.getSelectedIndex();
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

    private void addBusySlot() {
        try {
            int day = TimeSlots.FIRST_DAY + dayBox.getSelectedIndex();
            BusySlot slot = new BusySlot(teacherCode, day, fromBox.getSelectedIndex(), toBox.getSelectedIndex(),
                    placeField.getText(), noteField.getText());
            workspace().getBusySlots().add(slot);
            placeField.setText("");
            noteField.setText("");
            dataChanged();
            showInfo("Đã chia sẻ lịch bận với giáo vụ. Lần xếp lịch sau sẽ tránh giờ này.\n"
                    + "Nếu giờ này trùng lịch đã công bố, cần báo giáo vụ xếp lại.");
        } catch (IllegalArgumentException e) {
            showError(e.getMessage());
        }
    }

    private void removeBusySlot() {
        int row = selectedModelRow(busyTable);
        if (row < 0) {
            showError("Chọn một dòng lịch bận trước.");
            return;
        }
        workspace().getBusySlots().remove(shownBusy.get(row));
        dataChanged();
    }

    /** Nạp lịch bận từ CSV, bỏ qua các dòng của giảng viên khác. */
    private void importBusyCsv() {
        File file = chooseCsv(false, "lich_ban_" + teacherCode + ".csv");
        if (file == null) {
            return;
        }
        try {
            int added = 0;
            int skipped = 0;
            for (BusySlot slot : DataFiles.readBusySlots(file)) {
                if (slot.getTeacherCode().equalsIgnoreCase(teacherCode)) {
                    workspace().getBusySlots().add(slot);
                    added++;
                } else {
                    skipped++;
                }
            }
            dataChanged();
            String note = skipped > 0 ? " (bỏ qua " + skipped + " dòng của giảng viên khác)" : "";
            showInfo("Đã nạp " + added + " lịch bận" + note + ".");
        } catch (IOException e) {
            showError(e.getMessage());
        }
    }

    private void exportBusyCsv() {
        File file = chooseCsv(true, "lich_ban_" + teacherCode + ".csv");
        if (file == null) {
            return;
        }
        try {
            DataFiles.writeBusySlots(file, shownBusy);
            showInfo("Đã lưu " + shownBusy.size() + " lịch bận vào " + file.getName());
        } catch (IOException e) {
            showError(e.getMessage());
        }
    }

    @Override
    public void refresh() {
        busyModel.setRowCount(0);
        shownBusy.clear();
        externalModel.setRowCount(0);
        shownExternal.clear();
        if (teacherCode.isEmpty()) {
            gridPanel.setItems(new ArrayList<>(), "Chưa đăng nhập bằng tài khoản giảng viên.");
            return;
        }
        PersonalSchedule schedule = new PersonalSchedule(workspace(), teacherCode);
        List<String> conflicts = schedule.findConflicts();
        List<String> warnings = schedule.findTravelWarnings();
        List<GridItem> items = new ArrayList<>();
        for (Assignment assignment : schedule.getTeaching()) {
            items.add(teachingItem(schedule, assignment, conflicts));
        }
        for (ExternalSession session : schedule.getExternalSessions()) {
            items.add(externalItem(session, schedule.isInConflict(session)));
            shownExternal.add(session);
            externalModel.addRow(new Object[] {TimeSlots.dayName(session.getDay()),
                TimeSlots.formatTime(session.getStartMinute()), TimeSlots.formatTime(session.getEndMinute()),
                session.getSchool(), session.getCourseName(), session.getClassName(), session.getRoom(),
                TimeSlots.describeMask(session.getMask()), session.isAssumed() ? "Giả định" : "Tự nhập"});
        }
        for (BusySlot slot : schedule.getBusySlots()) {
            int start = TimeSlots.startMinute(slot.getFromSlot());
            int end = TimeSlots.endMinute(slot.getToSlot());
            items.add(new GridItem(slot.getDay(), start, end, slot.getPlace(), slot.getPrivateNote(),
                    slot.getPlace() + "\n" + slot.getPrivateNote(), Theme.BUSY_FILL, Theme.BUSY_ACCENT));
            shownBusy.add(slot);
            busyModel.addRow(new Object[] {TimeSlots.dayName(slot.getDay()), slot.getFromSlot() + 1,
                slot.getToSlot() + 1, slot.getPlace(), slot.getPrivateNote()});
        }
        String empty = workspace().getPublished().isEmpty() ? "Giáo vụ chưa công bố thời khóa biểu." : "";
        gridPanel.setItems(items, empty);
        summaryLabel.setText(schedule.summary());
        showConflicts(conflicts, warnings);
    }

    private void showConflicts(List<String> conflicts, List<String> warnings) {
        if (conflicts.isEmpty() && warnings.isEmpty()) {
            conflictArea.setForeground(Theme.SUCCESS);
            conflictArea.setText("Không có buổi nào trùng lịch.");
            return;
        }
        String text = "";
        if (!conflicts.isEmpty()) {
            text = "Cần báo giáo vụ xếp lại:\n" + String.join("\n", conflicts) + "\n";
        }
        if (!warnings.isEmpty()) {
            text = text + "Cảnh báo di chuyển (hai nơi cách nhau dưới " + PersonalSchedule.TRAVEL_MINUTES + " phút):\n"
                    + String.join("\n", warnings);
        }
        conflictArea.setForeground(conflicts.isEmpty() ? Theme.WARNING : Theme.DANGER);
        conflictArea.setText(text.trim());
        conflictArea.setCaretPosition(0);
    }

    private GridItem teachingItem(PersonalSchedule schedule, Assignment assignment, List<String> conflicts) {
        PlanSession session = workspace().findSession(assignment.getSessionId());
        String title = session == null ? assignment.getSessionId() : session.getShortLabel();
        String name = session == null ? "" : session.getCourseName();
        Color fill = Theme.STRIPE;
        Color accent = Theme.NEUTRAL;
        if (session != null) {
            fill = Theme.programFill(session.getProgram());
            accent = Theme.programAccent(session.getProgram());
        }
        if (isInConflict(assignment.getSessionId(), conflicts)) {
            fill = Theme.CONFLICT_FILL;
            accent = Theme.CONFLICT_ACCENT;
        }
        int count = schedule.slotCountOf(assignment);
        String detail = title + "\n" + name + "\nKhoa CNTT - ĐH Hà Nội\n"
                + TimeSlots.describe(assignment.getDay(), assignment.getStartSlot(), count);
        return new GridItem(assignment.getDay(), schedule.startMinuteOf(assignment), schedule.endMinuteOf(assignment),
                title, name, detail, fill, accent);
    }

    private GridItem externalItem(ExternalSession session, boolean conflict) {
        String detail = session.getSchool() + (session.isAssumed() ? " (giả định)" : "") + "\n"
                + session.getCourseName() + " - lớp " + session.getClassName()
                + (session.getRoom().isEmpty() ? "" : " - phòng " + session.getRoom()) + "\n"
                + TimeSlots.dayName(session.getDay()) + ", " + session.getTimeText() + "\n"
                + "Chặn " + TimeSlots.describeMask(session.getMask()) + " của khoa";
        Color fill = conflict ? Theme.CONFLICT_FILL : Theme.EXTERNAL_FILL;
        Color accent = conflict ? Theme.CONFLICT_ACCENT : Theme.EXTERNAL_ACCENT;
        return new GridItem(session.getDay(), session.getStartMinute(), session.getEndMinute(), session.getSchool(),
                session.getCourseName() + " - " + session.getClassName(), detail, fill, accent);
    }

    private static boolean isInConflict(String sessionId, List<String> conflicts) {
        for (String conflict : conflicts) {
            if (conflict.startsWith(sessionId + " ")) {
                return true;
            }
        }
        return false;
    }
}
