package vn.edu.fit.schedulesolver.model;

import java.io.Serializable;

/** Kết quả xếp một buổi học. locked = true là giáo vụ đã chốt, lần xếp sau giữ nguyên. */
public class Assignment implements Serializable {
    private static final long serialVersionUID = 1L;

    private final String sessionId;
    private final String teacherCode;
    private final int day;
    private final int startSlot;
    private final boolean locked;

    public Assignment(String sessionId, String teacherCode, int day, int startSlot, boolean locked) {
        if (sessionId == null || teacherCode == null) {
            throw new IllegalArgumentException("Thiếu mã buổi hoặc mã giảng viên.");
        }
        if (!TimeSlots.isValidDay(day) || startSlot < 0 || startSlot >= TimeSlots.SLOTS_PER_DAY) {
            throw new IllegalArgumentException("Ngày hoặc ca không hợp lệ.");
        }
        this.sessionId = sessionId;
        this.teacherCode = teacherCode;
        this.day = day;
        this.startSlot = startSlot;
        this.locked = locked;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getTeacherCode() {
        return teacherCode;
    }

    public int getDay() {
        return day;
    }

    public int getStartSlot() {
        return startSlot;
    }

    public boolean isLocked() {
        return locked;
    }

    public Assignment withLocked(boolean newLocked) {
        return new Assignment(sessionId, teacherCode, day, startSlot, newLocked);
    }
}
