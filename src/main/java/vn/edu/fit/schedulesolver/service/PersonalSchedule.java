package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.ExternalSession;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.solver.DayMask;

/** Lịch của một giảng viên: buổi dạy đã công bố ở khoa, buổi dạy ở trường khác và lịch bận khác. */
public class PersonalSchedule {
    // hai nơi khác nhau cách nhau dưới 30 phút thì có thể không kịp di chuyển
    public static final int TRAVEL_MINUTES = 30;

    private final Workspace workspace;
    private final String teacherCode;
    private final List<Assignment> teaching = new ArrayList<>();
    private final List<BusySlot> busySlots;
    private final List<ExternalSession> externalSessions;

    public PersonalSchedule(Workspace workspace, String teacherCode) {
        this.workspace = workspace;
        this.teacherCode = teacherCode;
        for (Assignment assignment : workspace.getPublished()) {
            if (assignment.getTeacherCode().equalsIgnoreCase(teacherCode)) {
                teaching.add(assignment);
            }
        }
        busySlots = workspace.getBusySlotsOf(teacherCode);
        externalSessions = workspace.getExternalSessionsOf(teacherCode);
    }

    public List<Assignment> getTeaching() {
        return teaching;
    }

    public List<BusySlot> getBusySlots() {
        return busySlots;
    }

    public List<ExternalSession> getExternalSessions() {
        return externalSessions;
    }

    /** Giờ bắt đầu thật của buổi dạy ở khoa, tính bằng phút. */
    public int startMinuteOf(Assignment assignment) {
        return TimeSlots.startMinute(assignment.getStartSlot());
    }

    public int endMinuteOf(Assignment assignment) {
        return TimeSlots.endMinute(assignment.getStartSlot() + slotCountOf(assignment) - 1);
    }

    public int slotCountOf(Assignment assignment) {
        PlanSession session = workspace.findSession(assignment.getSessionId());
        if (session == null) {
            return 1;
        }
        return session.getSlotCount();
    }

    /** Có thể trùng khi giảng viên khai bận sau khi lịch đã công bố. Giờ ở trường khác so theo phút thật. */
    public List<String> findConflicts() {
        List<String> conflicts = new ArrayList<>();
        for (Assignment assignment : teaching) {
            for (BusySlot busy : busySlots) {
                if (busy.overlaps(assignment.getDay(), assignment.getStartSlot(), slotCountOf(assignment))) {
                    conflicts.add(assignment.getSessionId() + " trùng lịch bận tại " + busy.getPlace() + " ("
                            + TimeSlots.describe(busy.getDay(), busy.getFromSlot(), busy.getSlotCount()) + ")");
                }
            }
            for (ExternalSession external : externalSessions) {
                if (external.overlaps(assignment.getDay(), startMinuteOf(assignment), endMinuteOf(assignment))) {
                    conflicts.add(assignment.getSessionId() + " trùng giờ dạy ở " + external.getSchool() + " ("
                            + TimeSlots.dayName(external.getDay()) + ", " + external.getTimeText() + ")");
                }
            }
        }
        for (int a = 0; a < externalSessions.size(); a++) {
            for (int b = a + 1; b < externalSessions.size(); b++) {
                ExternalSession first = externalSessions.get(a);
                ExternalSession second = externalSessions.get(b);
                if (first.overlaps(second.getDay(), second.getStartMinute(), second.getEndMinute())) {
                    conflicts.add("Trùng giờ giữa " + first.getSchool() + " (" + first.getTimeText() + ") và "
                            + second.getSchool() + " (" + second.getTimeText() + ") vào " + TimeSlots.dayName(first.getDay()));
                }
            }
        }
        return conflicts;
    }

    /** Buổi ở trường khác có trùng giờ với buổi dạy ở khoa hoặc với buổi ở trường khác không. */
    public boolean isInConflict(ExternalSession external) {
        for (Assignment assignment : teaching) {
            if (external.overlaps(assignment.getDay(), startMinuteOf(assignment), endMinuteOf(assignment))) {
                return true;
            }
        }
        for (ExternalSession other : externalSessions) {
            if (other != external && external.overlaps(other.getDay(), other.getStartMinute(), other.getEndMinute())) {
                return true;
            }
        }
        return false;
    }

    /** Buổi ở khoa và buổi ở trường khác cùng ngày, cách nhau dưới TRAVEL_MINUTES phút. */
    public List<String> findTravelWarnings() {
        List<String> warnings = new ArrayList<>();
        for (Assignment assignment : teaching) {
            int start = startMinuteOf(assignment);
            int end = endMinuteOf(assignment);
            for (ExternalSession external : externalSessions) {
                if (external.getDay() != assignment.getDay()) {
                    continue;
                }
                String day = TimeSlots.dayName(external.getDay()) + ": ";
                if (external.getEndMinute() <= start && start - external.getEndMinute() < TRAVEL_MINUTES) {
                    warnings.add(day + "dạy ở " + external.getSchool() + " đến " + TimeSlots.formatTime(external.getEndMinute())
                            + ", " + (start - external.getEndMinute()) + " phút sau đã vào buổi " + assignment.getSessionId()
                            + " ở khoa (" + TimeSlots.formatTime(start) + ").");
                } else if (end <= external.getStartMinute() && external.getStartMinute() - end < TRAVEL_MINUTES) {
                    warnings.add(day + "hết buổi " + assignment.getSessionId() + " ở khoa lúc " + TimeSlots.formatTime(end)
                            + ", " + (external.getStartMinute() - end) + " phút sau đã dạy ở " + external.getSchool()
                            + " (" + TimeSlots.formatTime(external.getStartMinute()) + ").");
                }
            }
        }
        return warnings;
    }

    /** Tóm tắt lịch dạy ở khoa trong tuần. */
    public String summary() {
        int[] masks = new int[TimeSlots.LAST_DAY + 1];
        for (Assignment assignment : teaching) {
            int day = assignment.getDay();
            masks[day] = masks[day] | TimeSlots.mask(assignment.getStartSlot(), slotCountOf(assignment));
        }
        int slots = 0;
        int days = 0;
        int gaps = 0;
        int singleDays = 0;
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            if (masks[day] == 0) {
                continue;
            }
            int count = DayMask.countSlots(masks[day]);
            slots += count;
            days++;
            gaps += DayMask.countGaps(masks[day]);
            if (count == 1) {
                singleDays++;
            }
        }
        return teacherCode + ": " + slots + " ca/tuần ở khoa, lên trường " + days + " ngày, "
                + gaps + " ca trống, " + singleDays + " ngày chỉ dạy 1 ca; "
                + externalSessions.size() + " buổi dạy ở trường khác, " + busySlots.size() + " lịch bận khác.";
    }
}
