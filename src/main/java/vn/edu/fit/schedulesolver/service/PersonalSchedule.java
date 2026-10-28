package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.solver.DayMask;

/** Lịch của một giảng viên: buổi dạy đã công bố và lịch bận ở nơi khác. */
public class PersonalSchedule {
    private final Workspace workspace;
    private final String teacherCode;
    private final List<Assignment> teaching = new ArrayList<>();
    private final List<BusySlot> busySlots;

    public PersonalSchedule(Workspace workspace, String teacherCode) {
        this.workspace = workspace;
        this.teacherCode = teacherCode;
        for (Assignment assignment : workspace.getPublished()) {
            if (assignment.getTeacherCode().equalsIgnoreCase(teacherCode)) {
                teaching.add(assignment);
            }
        }
        busySlots = workspace.getBusySlotsOf(teacherCode);
    }

    public List<Assignment> getTeaching() {
        return teaching;
    }

    public List<BusySlot> getBusySlots() {
        return busySlots;
    }

    public int slotCountOf(Assignment assignment) {
        PlanSession session = workspace.findSession(assignment.getSessionId());
        if (session == null) {
            return 1;
        }
        return session.getSlotCount();
    }

    /** Có thể trùng khi giảng viên khai bận sau khi lịch đã công bố. */
    public List<String> findConflicts() {
        List<String> conflicts = new ArrayList<>();
        for (Assignment assignment : teaching) {
            for (BusySlot busy : busySlots) {
                if (busy.overlaps(assignment.getDay(), assignment.getStartSlot(), slotCountOf(assignment))) {
                    conflicts.add(assignment.getSessionId() + " trùng lịch bận tại " + busy.getPlace() + " ("
                            + TimeSlots.describe(busy.getDay(), busy.getFromSlot(), busy.getSlotCount()) + ")");
                }
            }
        }
        return conflicts;
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
                + gaps + " ca trống, " + singleDays + " ngày chỉ dạy 1 ca, "
                + busySlots.size() + " lịch bận ở nơi khác.";
    }
}
