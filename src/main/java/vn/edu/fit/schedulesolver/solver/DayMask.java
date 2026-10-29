package vn.edu.fit.schedulesolver.solver;

import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Đếm ca dạy và ca trống trong một ngày, bit i của mask là ca i (0b001011: 3 ca, 1 trống). */
public final class DayMask {

    private DayMask() {
    }

    public static int countSlots(int mask) {
        int count = 0;
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            if ((mask & (1 << slot)) != 0) {
                count++;
            }
        }
        return count;
    }

    /** Số ca trống kẹp giữa ca dạy đầu và cuối. */
    public static int countGaps(int mask) {
        if (mask == 0) {
            return 0;
        }
        int first = -1;
        int last = -1;
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            if ((mask & (1 << slot)) != 0) {
                if (first == -1) {
                    first = slot;
                }
                last = slot;
            }
        }
        return (last - first + 1) - countSlots(mask);
    }
}
