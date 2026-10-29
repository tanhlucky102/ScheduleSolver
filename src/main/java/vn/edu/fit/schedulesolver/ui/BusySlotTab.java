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
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Tab lịch bận khác (họp, việc riêng) theo ca của khoa, cố định cả học kỳ. Ghi chú riêng chỉ giảng viên thấy. */
public class BusySlotTab extends TeacherTab {
    private final JComboBox<String> dayBox = new JComboBox<>();
    private final JComboBox<String> fromBox = new JComboBox<>();
    private final JComboBox<String> toBox = new JComboBox<>();
    private final JTextField placeField = new JTextField(16);
    private final JTextField noteField = new JTextField(16);
    private final DefaultTableModel busyModel =
            readOnlyModel("Thứ", "Từ ca", "Đến ca", "Nơi bận (giáo vụ thấy)", "Ghi chú riêng (chỉ bạn thấy)");
    private final JTable busyTable = createTable(busyModel);
    private final List<BusySlot> shownBusy = new ArrayList<>();

    public BusySlotTab(MainFrame frame) {
        super(frame);
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

        add(example, BorderLayout.NORTH);
        add(new JScrollPane(busyTable), BorderLayout.CENTER);
        add(form, BorderLayout.SOUTH);
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
        for (BusySlot slot : workspace().getBusySlotsOf(teacherCode)) {
            shownBusy.add(slot);
            busyModel.addRow(new Object[] {TimeSlots.dayName(slot.getDay()), slot.getFromSlot() + 1,
                slot.getToSlot() + 1, slot.getPlace(), slot.getPrivateNote()});
        }
    }
}
