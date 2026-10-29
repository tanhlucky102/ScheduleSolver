package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import java.util.ArrayList;
import java.util.List;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.ExternalSession;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.service.PersonalSchedule;

/** Tab lịch cá nhân: buổi dạy ở khoa, ở trường khác và lịch bận khác, vẽ theo giờ thật; báo trùng lịch. */
public class PersonalScheduleTab extends TeacherTab {
    private final TimetableGridPanel gridPanel = new TimetableGridPanel();
    private final JTextArea conflictArea = new JTextArea(3, 60);

    public PersonalScheduleTab(MainFrame frame) {
        super(frame);
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

        add(top, BorderLayout.NORTH);
        add(new JScrollPane(gridPanel), BorderLayout.CENTER);
        conflictArea.setEditable(false);
        conflictArea.setFont(Theme.BOLD);
        add(new JScrollPane(conflictArea), BorderLayout.SOUTH);
    }

    @Override
    public void refresh() {
        if (teacherCode.isEmpty()) {
            gridPanel.setItems(new ArrayList<>(), "Chưa đăng nhập bằng tài khoản giảng viên.");
            return;
        }
        PersonalSchedule schedule = new PersonalSchedule(workspace(), teacherCode);
        List<String> conflicts = schedule.findConflicts();
        List<GridItem> items = new ArrayList<>();
        for (Assignment assignment : schedule.getTeaching()) {
            items.add(teachingItem(schedule, assignment, conflicts));
        }
        for (ExternalSession session : schedule.getExternalSessions()) {
            items.add(externalItem(session, schedule.isInConflict(session)));
        }
        for (BusySlot slot : schedule.getBusySlots()) {
            int start = TimeSlots.startMinute(slot.getFromSlot());
            int end = TimeSlots.endMinute(slot.getToSlot());
            items.add(new GridItem(slot.getDay(), start, end, slot.getPlace(), slot.getPrivateNote(),
                    slot.getPlace() + "\n" + slot.getPrivateNote(), Theme.BUSY_FILL, Theme.BUSY_ACCENT));
        }
        String empty = workspace().getPublished().isEmpty() ? "Giáo vụ chưa công bố thời khóa biểu." : "";
        gridPanel.setItems(items, empty);
        showConflicts(conflicts, schedule.findTravelWarnings());
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
