package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import java.util.ArrayList;
import java.util.List;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Hộp thoại để giáo vụ chỉnh tay một buổi: đổi giảng viên, ngày, ca và cố định buổi đó. */
public class AssignmentDialog extends JDialog {
    private final PlanSession session;
    private final JComboBox<String> teacherBox = new JComboBox<>();
    private final JComboBox<String> dayBox = new JComboBox<>();
    private final JComboBox<String> slotBox = new JComboBox<>();
    private final JCheckBox lockedBox = new JCheckBox("Cố định (lần xếp sau giữ nguyên)");
    private final List<Integer> slotValues = new ArrayList<>();
    private Assignment result;

    public AssignmentDialog(JFrame owner, PlanSession session, Assignment current, List<String> candidates) {
        super(owner, "Sửa buổi " + session.getId(), true);
        this.session = session;

        for (String teacher : candidates) {
            teacherBox.addItem(teacher);
        }
        if (!candidates.contains(current.getTeacherCode())) {
            teacherBox.addItem(current.getTeacherCode());
        }
        teacherBox.setSelectedItem(current.getTeacherCode());

        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            dayBox.addItem(TimeSlots.dayName(day));
        }
        dayBox.setSelectedIndex(current.getDay() - TimeSlots.FIRST_DAY);

        // buổi 2 ca chỉ được bắt đầu ở ca 1, 3, 5
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            if (TimeSlots.isValidStart(slot, session.getSlotCount())) {
                slotValues.add(slot);
                // chỉ hiện ca và giờ, bỏ tên ngày ở đầu chuỗi
                slotBox.addItem(TimeSlots.describe(current.getDay(), slot, session.getSlotCount())
                        .replace(TimeSlots.dayName(current.getDay()) + ", ", ""));
            }
        }
        slotBox.setSelectedIndex(Math.max(0, slotValues.indexOf(current.getStartSlot())));
        lockedBox.setSelected(current.isLocked());

        JPanel form = new JPanel(new GridLayout(0, 2, 6, 6));
        form.setBorder(BorderFactory.createEmptyBorder(12, 14, 12, 14));
        form.add(new JLabel("Buổi học:"));
        form.add(new JLabel(session.getShortLabel() + " - " + session.getCohort()));
        form.add(new JLabel("Giảng viên (theo quy ước):"));
        form.add(teacherBox);
        form.add(new JLabel("Ngày:"));
        form.add(dayBox);
        form.add(new JLabel("Ca bắt đầu:"));
        form.add(slotBox);
        form.add(new JLabel(""));
        form.add(lockedBox);

        JButton okButton = Theme.button("Lưu", Theme.SUCCESS);
        JButton cancelButton = Theme.button("Hủy", Theme.NEUTRAL);
        okButton.addActionListener(e -> save());
        cancelButton.addActionListener(e -> dispose());
        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        buttons.add(okButton);
        buttons.add(cancelButton);

        setLayout(new BorderLayout());
        add(form, BorderLayout.CENTER);
        add(buttons, BorderLayout.SOUTH);
        pack();
        setLocationRelativeTo(owner);
    }

    private void save() {
        String teacher = (String) teacherBox.getSelectedItem();
        int day = TimeSlots.FIRST_DAY + dayBox.getSelectedIndex();
        int slot = slotValues.get(slotBox.getSelectedIndex());
        result = new Assignment(session.getId(), teacher, day, slot, lockedBox.isSelected());
        dispose();
    }

    /** Trả về null nếu bấm Hủy. */
    public Assignment showDialog() {
        setVisible(true);
        return result;
    }
}
