package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.ExternalSession;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Tab lịch bận giảng viên chia sẻ cho giáo vụ, gồm cả giờ dạy ở trường khác; lọc theo giảng viên, thứ, ca. */
public class SharedBusyTab extends BasePanel {
    private static final String ALL = "Tất cả";

    private final DefaultTableModel busyModel = readOnlyModel("Giảng viên", "Thứ", "Giờ", "Ca của khoa bị chặn",
            "Nơi bận", "Loại");
    private final JTable busyTable = createTable(busyModel);
    private final JTextField busyTeacherSearchField = new JTextField(14);
    private final JComboBox<String> busyDayFilter = new JComboBox<>();
    private final JComboBox<String> busySlotFilter = new JComboBox<>();
    private final TableRowSorter<DefaultTableModel> busySorter = new TableRowSorter<>(busyModel);
    // dòng i của bảng lịch bận chặn những ca nào của khoa (lịch trường khác có thể lệch giờ nên lưu theo mask)
    private final List<Integer> shownBusyMasks = new ArrayList<>();
    private boolean updatingBusyFilters;

    public SharedBusyTab(MainFrame frame) {
        super(frame);
        useTabLayout();
        setColumnWidths(busyTable, 90, 60, 110, 130, 230, 200);
        JPanel filters = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        filters.add(new JLabel("Giảng viên:"));
        filters.add(busyTeacherSearchField);
        filters.add(new JLabel("Thứ:"));
        filters.add(busyDayFilter);
        filters.add(new JLabel("Ca:"));
        filters.add(busySlotFilter);
        busyTable.setRowSorter(busySorter);
        busyTeacherSearchField.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent event) {
                refreshBusyFilter();
            }

            @Override
            public void removeUpdate(DocumentEvent event) {
                refreshBusyFilter();
            }

            @Override
            public void changedUpdate(DocumentEvent event) {
                refreshBusyFilter();
            }
        });
        busyDayFilter.addActionListener(e -> refreshBusyFilter());
        busySlotFilter.addActionListener(e -> refreshBusyFilter());
        add(filters, BorderLayout.NORTH);
        add(new JScrollPane(busyTable), BorderLayout.CENTER);
    }

    private void refreshBusyDropdowns() {
        String selectedDay = (String) busyDayFilter.getSelectedItem();
        String selectedSlot = (String) busySlotFilter.getSelectedItem();
        updatingBusyFilters = true;
        busyDayFilter.removeAllItems();
        busySlotFilter.removeAllItems();
        busyDayFilter.addItem(ALL);
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            busyDayFilter.addItem(TimeSlots.dayName(day));
        }
        busySlotFilter.addItem(ALL);
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            busySlotFilter.addItem(TimeSlots.slotName(slot));
        }
        busyDayFilter.setSelectedItem(selectedDay == null ? ALL : selectedDay);
        busySlotFilter.setSelectedItem(selectedSlot == null ? ALL : selectedSlot);
        updatingBusyFilters = false;
    }

    private void refreshBusyFilter() {
        if (updatingBusyFilters) {
            return;
        }
        String teacherQuery = busyTeacherSearchField.getText().trim().toLowerCase(Locale.ROOT);
        String day = (String) busyDayFilter.getSelectedItem();
        int selectedSlot = busySlotFilter.getSelectedIndex() - 1;
        busySorter.setRowFilter(new RowFilter<DefaultTableModel, Integer>() {
            @Override
            public boolean include(Entry<? extends DefaultTableModel, ? extends Integer> entry) {
                String teacherCode = entry.getStringValue(0);
                Teacher teacher = workspace().findTeacher(teacherCode);
                boolean matchesTeacher = teacherCode.toLowerCase(Locale.ROOT).contains(teacherQuery)
                        || (teacher != null
                                && teacher.getFullName().toLowerCase(Locale.ROOT).contains(teacherQuery));
                boolean matchesDay = day == null || day.equals(ALL) || day.equals(entry.getStringValue(1));
                // lọc theo ca: dòng nào chặn ca đang chọn thì hiện, kể cả giờ dạy trường khác lệch giờ với khoa
                int mask = shownBusyMasks.get(entry.getIdentifier());
                boolean matchesSlot = selectedSlot < 0 || (mask & (1 << selectedSlot)) != 0;
                return matchesTeacher && matchesDay && matchesSlot;
            }
        });
    }

    @Override
    public void refresh() {
        busyModel.setRowCount(0);
        shownBusyMasks.clear();
        // giáo vụ không được xem ghi chú riêng, môn, lớp của giảng viên ở nơi khác
        for (BusySlot slot : workspace().getBusySlots()) {
            String time = TimeSlots.formatTime(TimeSlots.startMinute(slot.getFromSlot())) + " - "
                    + TimeSlots.formatTime(TimeSlots.endMinute(slot.getToSlot()));
            String kind = slot.getPrivateNote().startsWith("[Giả lập") ? "Lịch bận (giả lập)" : "Lịch bận";
            shownBusyMasks.add(slot.getMask());
            busyModel.addRow(new Object[] {slot.getTeacherCode(), TimeSlots.dayName(slot.getDay()), time,
                TimeSlots.describeMask(slot.getMask()), slot.getPlace(), kind});
        }
        for (ExternalSession session : workspace().getExternalSessions()) {
            String kind = session.isAssumed() ? "Dạy ở trường khác (giả định)" : "Dạy ở trường khác";
            shownBusyMasks.add(session.getMask());
            busyModel.addRow(new Object[] {session.getTeacherCode(), TimeSlots.dayName(session.getDay()),
                session.getTimeText(), TimeSlots.describeMask(session.getMask()), session.getSchool(), kind});
        }
        refreshBusyDropdowns();
        refreshBusyFilter();
    }
}
