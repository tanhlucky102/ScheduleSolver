package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.FlowLayout;
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
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.service.PersonalSchedule;

/**
 * Màn hình Giảng viên: xem lịch cá nhân gộp và khai báo lịch bận cố định.
 * Ghi chú riêng của lịch bận chỉ hiện ở đây, giáo vụ không thấy.
 */
public class TeacherPanel extends BasePanel {
    private String teacherCode = "";
    private final TimetableGridPanel gridPanel = new TimetableGridPanel();
    private final JLabel summaryLabel = new JLabel();
    private final JTextArea conflictArea = new JTextArea(3, 60);

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
        tabs.addTab("Lịch cá nhân (gộp nhiều nơi)", createScheduleTab());
        tabs.addTab("Lịch bận cố định", createBusyTab());
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
        legend.add(Theme.legend("Lịch bận ở nơi khác", Theme.BUSY_FILL, Theme.BUSY_ACCENT));
        legend.add(Theme.legend("Bị trùng lịch", Theme.CONFLICT_FILL, Theme.CONFLICT_ACCENT));

        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.add(legend, BorderLayout.NORTH);
        panel.add(new JScrollPane(gridPanel), BorderLayout.CENTER);
        conflictArea.setEditable(false);
        conflictArea.setForeground(Theme.DANGER);
        conflictArea.setFont(Theme.BOLD);
        panel.add(new JScrollPane(conflictArea), BorderLayout.SOUTH);
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
        JPanel form = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 6));
        form.setBorder(Theme.titled("Thêm lịch bận (áp dụng cố định cho cả học kỳ, không chọn tuần)"));
        form.add(new JLabel("Thứ:"));
        form.add(dayBox);
        form.add(new JLabel("Từ:"));
        form.add(fromBox);
        form.add(new JLabel("Đến:"));
        form.add(toBox);
        form.add(new JLabel("Nơi bận:"));
        form.add(placeField);
        form.add(new JLabel("Ghi chú riêng:"));
        form.add(noteField);
        form.add(createButton("Thêm", Theme.SUCCESS, e -> addBusySlot()));
        form.add(createButton("Xóa dòng chọn", Theme.DANGER, e -> removeBusySlot()));
        form.add(createButton("Nạp từ CSV...", Theme.NEUTRAL, e -> importBusyCsv()));
        form.add(createButton("Lưu ra CSV...", Theme.NEUTRAL, e -> exportBusyCsv()));

        JLabel example = new JLabel("  Ví dụ: Thứ 3, Ca 1 đến Ca 2, nơi bận \"ĐH Thủy lợi\", ghi chú \"Dạy CSDL lớp 64HT\".");
        example.setForeground(Theme.MUTED_TEXT);

        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.add(example, BorderLayout.NORTH);
        panel.add(new JScrollPane(busyTable), BorderLayout.CENTER);
        panel.add(form, BorderLayout.SOUTH);
        return panel;
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
        if (teacherCode.isEmpty()) {
            gridPanel.setItems(new ArrayList<>(), "Chưa đăng nhập bằng tài khoản giảng viên.");
            return;
        }
        PersonalSchedule schedule = new PersonalSchedule(workspace(), teacherCode);
        List<String> conflicts = schedule.findConflicts();
        List<GridItem> items = new ArrayList<>();
        for (Assignment assignment : schedule.getTeaching()) {
            items.add(teachingItem(assignment, schedule.slotCountOf(assignment), conflicts));
        }
        for (BusySlot slot : schedule.getBusySlots()) {
            items.add(new GridItem(slot.getDay(), slot.getFromSlot(), slot.getSlotCount(), slot.getPlace(),
                    slot.getPrivateNote(), slot.getPlace() + "\n" + slot.getPrivateNote(), Theme.BUSY_FILL, Theme.BUSY_ACCENT));
            shownBusy.add(slot);
            busyModel.addRow(new Object[] {TimeSlots.dayName(slot.getDay()), slot.getFromSlot() + 1,
                slot.getToSlot() + 1, slot.getPlace(), slot.getPrivateNote()});
        }
        String empty = workspace().getPublished().isEmpty() ? "Giáo vụ chưa công bố thời khóa biểu." : "";
        gridPanel.setItems(items, empty);
        summaryLabel.setText(schedule.summary());
        if (conflicts.isEmpty()) {
            conflictArea.setForeground(Theme.SUCCESS);
            conflictArea.setText("Không có buổi dạy nào trùng lịch bận.");
        } else {
            conflictArea.setForeground(Theme.DANGER);
            conflictArea.setText("Cần báo giáo vụ xếp lại:\n" + String.join("\n", conflicts));
        }
    }

    private GridItem teachingItem(Assignment assignment, int count, List<String> conflicts) {
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
        String detail = title + "\n" + name + "\n" + TimeSlots.describe(assignment.getDay(), assignment.getStartSlot(), count);
        return new GridItem(assignment.getDay(), assignment.getStartSlot(), count, title, name, detail, fill, accent);
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
