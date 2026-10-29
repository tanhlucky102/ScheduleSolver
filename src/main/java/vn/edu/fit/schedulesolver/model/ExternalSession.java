package vn.edu.fit.schedulesolver.model;

import java.io.Serializable;

/**
 * Một buổi giảng viên dạy ở trường khác, lặp lại hằng tuần. Lưu theo giờ thật của trường đó
 * (ví dụ 07:00 - 09:30), không theo ca của khoa. Môn, lớp, phòng chỉ giảng viên xem;
 * giáo vụ chỉ thấy tên trường, thứ và khung giờ.
 */
public class ExternalSession implements Serializable {
    private static final long serialVersionUID = 1L;

    // chỉ nhận giờ trong khoảng 06:00 - 22:00
    public static final int EARLIEST_MINUTE = 6 * 60;
    public static final int LATEST_MINUTE = 22 * 60;

    private final String teacherCode;
    private final String school;
    private final String courseName;
    private final String className;
    private final int day;
    private final int startMinute;
    private final int endMinute;
    private final String room;
    // true: tự giả định vì chưa có TKB thật của trường kia
    private final boolean assumed;

    public ExternalSession(String teacherCode, String school, String courseName, String className, int day,
                           int startMinute, int endMinute, String room, boolean assumed) {
        if (teacherCode == null || teacherCode.isBlank()) {
            throw new IllegalArgumentException("Thiếu mã giảng viên.");
        }
        if (school == null || school.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập tên trường.");
        }
        if (courseName == null || courseName.isBlank() || className == null || className.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập môn và lớp dạy ở trường đó.");
        }
        if (!TimeSlots.isValidDay(day)) {
            throw new IllegalArgumentException("Ngày phải từ Thứ 2 đến Thứ 7.");
        }
        if (startMinute < EARLIEST_MINUTE || endMinute > LATEST_MINUTE) {
            throw new IllegalArgumentException("Giờ dạy phải nằm trong khoảng 06:00 - 22:00.");
        }
        if (startMinute >= endMinute) {
            throw new IllegalArgumentException("Giờ bắt đầu phải trước giờ kết thúc.");
        }
        this.teacherCode = teacherCode.trim();
        this.school = school.trim();
        this.courseName = courseName.trim();
        this.className = className.trim();
        this.day = day;
        this.startMinute = startMinute;
        this.endMinute = endMinute;
        this.room = room == null ? "" : room.trim();
        this.assumed = assumed;
    }

    public String getTeacherCode() {
        return teacherCode;
    }

    public String getSchool() {
        return school;
    }

    public String getCourseName() {
        return courseName;
    }

    public String getClassName() {
        return className;
    }

    public int getDay() {
        return day;
    }

    public int getStartMinute() {
        return startMinute;
    }

    public int getEndMinute() {
        return endMinute;
    }

    public String getRoom() {
        return room;
    }

    public boolean isAssumed() {
        return assumed;
    }

    public String getTimeText() {
        return TimeSlots.formatTime(startMinute) + " - " + TimeSlots.formatTime(endMinute);
    }

    /** Các ca của khoa bị buổi này chồng giờ. */
    public int getMask() {
        return TimeSlots.maskOfTime(startMinute, endMinute);
    }

    public boolean overlaps(int otherDay, int otherStart, int otherEnd) {
        return day == otherDay && startMinute < otherEnd && otherStart < endMinute;
    }

    /** Đổi ra lịch bận theo ca cho bộ giải; không chồng ca nào của khoa thì trả về null. */
    public BusySlot toBusySlot() {
        int mask = getMask();
        if (mask == 0) {
            return null;
        }
        int from = 0;
        while ((mask & (1 << from)) == 0) {
            from++;
        }
        int to = from;
        while (to + 1 < TimeSlots.SLOTS_PER_DAY && (mask & (1 << (to + 1))) != 0) {
            to++;
        }
        return new BusySlot(teacherCode, day, from, to, school, courseName + " - " + className);
    }
}
