package vn.edu.fit.schedulesolver.model;

/** Khung giờ của khoa: ngày đánh số 2..7 (Thứ 2 đến Thứ 7), mỗi ngày 6 ca đánh số 0..5. */
public final class TimeSlots {
    public static final int FIRST_DAY = 2;
    public static final int LAST_DAY = 7;
    public static final int SLOTS_PER_DAY = 6;

    private static final String[] SLOT_TIMES = {
        "07:10 - 09:15", "09:30 - 11:35", "12:20 - 14:25",
        "14:40 - 16:45", "16:55 - 18:45", "18:55 - 21:00"
    };

    private TimeSlots() {
    }

    public static String dayName(int day) {
        return "Thứ " + day;
    }

    public static String slotName(int slot) {
        return "Ca " + (slot + 1);
    }

    public static String slotTime(int slot) {
        return SLOT_TIMES[slot];
    }

    public static boolean isValidDay(int day) {
        return day >= FIRST_DAY && day <= LAST_DAY;
    }

    /** Buổi 2 ca không được vắt qua hai buổi nên chỉ bắt đầu ở ca 0, 2, 4. */
    public static boolean isValidStart(int slot, int slotCount) {
        if (slot < 0 || slot + slotCount > SLOTS_PER_DAY) {
            return false;
        }
        return slotCount == 1 || slot % 2 == 0;
    }

    /** Bit i = 1 là ca i có học. */
    public static int mask(int startSlot, int slotCount) {
        int mask = 0;
        for (int i = 0; i < slotCount; i++) {
            mask = mask | (1 << (startSlot + i));
        }
        return mask;
    }

    public static boolean overlaps(int day1, int slot1, int count1, int day2, int slot2, int count2) {
        if (day1 != day2) {
            return false;
        }
        return (mask(slot1, count1) & mask(slot2, count2)) != 0;
    }

    public static String describe(int day, int startSlot, int slotCount) {
        int endSlot = startSlot + slotCount - 1;
        String start = SLOT_TIMES[startSlot].substring(0, 5);
        String end = SLOT_TIMES[endSlot].substring(8);
        String slots = slotCount == 1 ? slotName(startSlot) : "Ca " + (startSlot + 1) + "-" + (endSlot + 1);
        return dayName(day) + ", " + slots + " (" + start + " - " + end + ")";
    }
}
