package vn.edu.fit.schedulesolver.model;

import java.io.Serializable;

/** Lịch bận cố định cả học kỳ của giảng viên. Ghi chú là riêng tư, giáo vụ không xem được. */
public class BusySlot implements Serializable {
    private static final long serialVersionUID = 1L;

    private final String teacherCode;
    private final int day;
    private final int fromSlot;
    private final int toSlot;
    private final String place;
    private final String privateNote;

    public BusySlot(String teacherCode, int day, int fromSlot, int toSlot, String place, String privateNote) {
        if (teacherCode == null || teacherCode.isBlank()) {
            throw new IllegalArgumentException("Thiếu mã giảng viên.");
        }
        if (!TimeSlots.isValidDay(day)) {
            throw new IllegalArgumentException("Ngày phải từ Thứ 2 đến Thứ 7.");
        }
        if (fromSlot < 0 || toSlot >= TimeSlots.SLOTS_PER_DAY || fromSlot > toSlot) {
            throw new IllegalArgumentException("Ca bận không hợp lệ: ca bắt đầu phải nhỏ hơn hoặc bằng ca kết thúc.");
        }
        if (place == null || place.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập nơi bận (ví dụ tên trường khác).");
        }
        this.teacherCode = teacherCode.trim();
        this.day = day;
        this.fromSlot = fromSlot;
        this.toSlot = toSlot;
        this.place = place.trim();
        this.privateNote = privateNote == null ? "" : privateNote.trim();
    }

    public String getTeacherCode() {
        return teacherCode;
    }

    public int getDay() {
        return day;
    }

    public int getFromSlot() {
        return fromSlot;
    }

    public int getToSlot() {
        return toSlot;
    }

    public int getSlotCount() {
        return toSlot - fromSlot + 1;
    }

    public String getPlace() {
        return place;
    }

    public String getPrivateNote() {
        return privateNote;
    }

    public int getMask() {
        return TimeSlots.mask(fromSlot, getSlotCount());
    }

    public boolean overlaps(int otherDay, int startSlot, int slotCount) {
        return TimeSlots.overlaps(day, fromSlot, getSlotCount(), otherDay, startSlot, slotCount);
    }
}
