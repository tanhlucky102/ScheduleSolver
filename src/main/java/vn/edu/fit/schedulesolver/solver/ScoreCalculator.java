package vn.edu.fit.schedulesolver.solver;

import vn.edu.fit.schedulesolver.model.TimeSlots;

/**
 * Chấm điểm TKB: lỗi cứng H1-H3 mỗi lỗi 1 điểm cứng, lỗi mềm S1-S6 cộng theo trọng số.
 * Không giữ trạng thái nên các luồng dùng chung được.
 */
public class ScoreCalculator {
    // S1: mỗi ca trống kẹp giữa
    public static final int WEIGHT_GAP = 10;
    // S2: ngày chỉ dạy 1 ca
    public static final int WEIGHT_SINGLE_SLOT_DAY = 15;
    // S3: mỗi ngày phải lên trường
    public static final int WEIGHT_TEACHING_DAY = 5;
    // S4, S5: mỗi ca vượt tối đa/ngày, tối đa/tuần
    public static final int WEIGHT_OVER_DAY = 20;
    public static final int WEIGHT_OVER_WEEK = 6;
    // S6: Lec trùng môn khác cùng khóa
    public static final int WEIGHT_CROSS_COURSE = 20;

    private final Problem problem;

    public ScoreCalculator(Problem problem) {
        this.problem = problem;
    }

    /** Chấm lại từ đầu, chỉ dùng lúc bắt đầu và khi kiểm tra. */
    public Score calculate(Solution solution) {
        long cost = 0;
        int n = problem.getSessionCount();
        for (int i = 0; i < n; i++) {
            cost += busyCost(solution, i);
            for (int j = i + 1; j < n; j++) {
                cost += pairCost(solution, i, j);
            }
        }
        for (int t = 0; t < problem.getTeacherCount(); t++) {
            cost += teacherCost(solution, t);
        }
        return Score.fromCost(cost);
    }

    /** Hai buổi trùng giờ: H1 cùng giảng viên, H2 sinh viên trùng lịch, S6. */
    public long pairCost(Solution solution, int i, int j) {
        if (!solution.isPlaced(i) || !solution.isPlaced(j)) {
            return 0;
        }
        boolean overlap = TimeSlots.overlaps(solution.getDay(i), solution.getSlot(i), problem.getSlotCount(i),
                solution.getDay(j), solution.getSlot(j), problem.getSlotCount(j));
        if (!overlap) {
            return 0;
        }
        long cost = 0;
        if (solution.getTeacher(i) == solution.getTeacher(j)) {
            cost += Score.HARD_WEIGHT;
        }
        byte conflict = problem.getStudentConflict(i, j);
        if (conflict == Problem.HARD_CONFLICT) {
            cost += Score.HARD_WEIGHT;
        } else if (conflict == Problem.SOFT_CONFLICT) {
            cost += WEIGHT_CROSS_COURSE;
        }
        return cost;
    }

    /** H3: buổi học rơi vào giờ bận của giảng viên. */
    public long busyCost(Solution solution, int i) {
        if (!solution.isPlaced(i)) {
            return 0;
        }
        int busy = problem.getBusyMask(solution.getTeacher(i), solution.getDay(i));
        int used = TimeSlots.mask(solution.getSlot(i), problem.getSlotCount(i));
        if ((busy & used) != 0) {
            return Score.HARD_WEIGHT;
        }
        return 0;
    }

    /** Mask ca dạy của giảng viên t, chỉ số mảng là ngày 2..7. */
    public int[] dayMasks(Solution solution, int t) {
        int[] masks = new int[TimeSlots.LAST_DAY + 1];
        for (int i = 0; i < problem.getSessionCount(); i++) {
            if (solution.isPlaced(i) && solution.getTeacher(i) == t) {
                int day = solution.getDay(i);
                masks[day] = masks[day] | TimeSlots.mask(solution.getSlot(i), problem.getSlotCount(i));
            }
        }
        return masks;
    }

    /** S1-S5 của một giảng viên. */
    public long teacherCost(Solution solution, int t) {
        int[] masks = dayMasks(solution, t);
        int maxPerDay = problem.getTeacher(t).getMaxSlotsPerDay();
        int maxPerWeek = problem.getTeacher(t).getMaxSlotsPerWeek();
        long cost = 0;
        int weekSlots = 0;
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            int mask = masks[day];
            if (mask == 0) {
                continue;
            }
            int slots = DayMask.countSlots(mask);
            weekSlots += slots;
            cost += WEIGHT_TEACHING_DAY;
            cost += WEIGHT_GAP * DayMask.countGaps(mask);
            if (slots == 1) {
                cost += WEIGHT_SINGLE_SLOT_DAY;
            }
            if (slots > maxPerDay) {
                cost += WEIGHT_OVER_DAY * (slots - maxPerDay);
            }
        }
        if (weekSlots > maxPerWeek) {
            cost += WEIGHT_OVER_WEEK * (weekSlots - maxPerWeek);
        }
        return cost;
    }

    /** Buổi i gây thêm bao nhiêu lỗi (bỏ qua buổi skip), dùng khi xếp tham lam. */
    public long sessionCost(Solution solution, int i, int skip) {
        long cost = busyCost(solution, i);
        for (int j = 0; j < problem.getSessionCount(); j++) {
            if (j != i && j != skip) {
                cost += pairCost(solution, i, j);
            }
        }
        return cost;
    }

    /**
     * Chỉ tính điểm của các buổi và giảng viên bị bước đi đụng tới.
     * Sau trừ trước là ra độ thay đổi tổng điểm, khỏi chấm lại cả TKB.
     */
    public long localCost(Solution solution, int[] sessionIds, int[] teacherIds) {
        long cost = 0;
        for (int k = 0; k < sessionIds.length; k++) {
            int i = sessionIds[k];
            cost += busyCost(solution, i);
            for (int j = 0; j < problem.getSessionCount(); j++) {
                if (!contains(sessionIds, j)) {
                    cost += pairCost(solution, i, j);
                }
            }
            // cặp nằm trong nhóm chỉ tính một lần
            for (int l = k + 1; l < sessionIds.length; l++) {
                cost += pairCost(solution, i, sessionIds[l]);
            }
        }
        for (int k = 0; k < teacherIds.length; k++) {
            if (!containsBefore(teacherIds, k)) {
                cost += teacherCost(solution, teacherIds[k]);
            }
        }
        return cost;
    }

    private static boolean contains(int[] values, int value) {
        for (int v : values) {
            if (v == value) {
                return true;
            }
        }
        return false;
    }

    // tránh tính một giảng viên hai lần
    private static boolean containsBefore(int[] values, int k) {
        for (int i = 0; i < k; i++) {
            if (values[i] == values[k]) {
                return true;
            }
        }
        return false;
    }
}
