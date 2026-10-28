package vn.edu.fit.schedulesolver.solver;

/**
 * Lời giải: với buổi i lưu chỉ số giảng viên, ngày và ca bắt đầu.
 * Mỗi luồng dùng bản sao riêng nên không cần đồng bộ.
 */
public class Solution {
    // day = 0 là buổi chưa xếp
    private static final int NOT_PLACED = 0;

    private final int[] teacher;
    private final int[] day;
    private final int[] slot;

    public Solution(int sessionCount) {
        teacher = new int[sessionCount];
        day = new int[sessionCount];
        slot = new int[sessionCount];
    }

    private Solution(Solution other) {
        teacher = other.teacher.clone();
        day = other.day.clone();
        slot = other.slot.clone();
    }

    public Solution copy() {
        return new Solution(this);
    }

    public int size() {
        return teacher.length;
    }

    public void place(int session, int teacherIndex, int newDay, int newSlot) {
        teacher[session] = teacherIndex;
        day[session] = newDay;
        slot[session] = newSlot;
    }

    public void unplace(int session) {
        day[session] = NOT_PLACED;
    }

    public boolean isPlaced(int session) {
        return day[session] != NOT_PLACED;
    }

    public int getTeacher(int session) {
        return teacher[session];
    }

    public void setTeacher(int session, int teacherIndex) {
        teacher[session] = teacherIndex;
    }

    public int getDay(int session) {
        return day[session];
    }

    public int getSlot(int session) {
        return slot[session];
    }

    public void setTime(int session, int newDay, int newSlot) {
        day[session] = newDay;
        slot[session] = newSlot;
    }

    /** Dùng trong test chạy lại cùng seed. */
    public boolean sameAs(Solution other) {
        if (teacher.length != other.teacher.length) {
            return false;
        }
        for (int i = 0; i < teacher.length; i++) {
            if (teacher[i] != other.teacher[i] || day[i] != other.day[i] || slot[i] != other.slot[i]) {
                return false;
            }
        }
        return true;
    }
}
