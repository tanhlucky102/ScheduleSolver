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

    /** "7:05" hoặc "07:05" đổi ra số phút tính từ 0 giờ (07:05 = 425); sai định dạng thì báo lỗi. */
    public static int parseTime(String text) {
        String[] parts = text == null ? new String[0] : text.trim().split(":");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Giờ phải có dạng gg:pp, ví dụ 07:00.");
        }
        int hour;
        int minute;
        try {
            hour = Integer.parseInt(parts[0].trim());
            minute = Integer.parseInt(parts[1].trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Giờ phải có dạng gg:pp, ví dụ 07:00.");
        }
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            throw new IllegalArgumentException("Giờ không hợp lệ: " + text.trim());
        }
        return hour * 60 + minute;
    }

    public static String formatTime(int minute) {
        return String.format("%02d:%02d", minute / 60, minute % 60);
    }

    /** Giờ bắt đầu của ca tính bằng phút, ví dụ Ca 1 (07:10) là 430. */
    public static int startMinute(int slot) {
        return parseTime(SLOT_TIMES[slot].substring(0, 5));
    }

    public static int endMinute(int slot) {
        return parseTime(SLOT_TIMES[slot].substring(8));
    }

    /** Các ca của khoa bị khoảng giờ [start, end) chồng lên, bit i = 1 là ca i. Chỉ chạm nhau thì không tính. */
    public static int maskOfTime(int start, int end) {
        int result = 0;
        for (int slot = 0; slot < SLOTS_PER_DAY; slot++) {
            if (start < endMinute(slot) && startMinute(slot) < end) {
                result = result | (1 << slot);
            }
        }
        return result;
    }

    /** Ví dụ ca 0 và ca 1 thì ra "Ca 1, 2"; không có ca nào thì ra "không ca nào". */
    public static String describeMask(int mask) {
        String text = "";
        for (int slot = 0; slot < SLOTS_PER_DAY; slot++) {
            if ((mask & (1 << slot)) != 0) {
                text = text.isEmpty() ? "Ca " + (slot + 1) : text + ", " + (slot + 1);
            }
        }
        return text.isEmpty() ? "không ca nào" : text;
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
