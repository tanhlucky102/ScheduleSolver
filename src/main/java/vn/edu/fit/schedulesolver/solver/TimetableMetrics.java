package vn.edu.fit.schedulesolver.solver;

import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Chỉ số độ gọn lịch giảng viên, đo được cả TKB khoa xếp tay lẫn TKB bộ giải tạo ra. */
public class TimetableMetrics {

    /** Số liệu một tuần của một giảng viên. */
    public static class TeacherStats {
        private final String teacherCode;
        private int slots;
        private int teachingDays;
        private int gaps;
        private int singleSlotDays;
        private int slotsOverDayLimit;
        private int slotsOverWeekLimit;

        public TeacherStats(String teacherCode) {
            this.teacherCode = teacherCode;
        }

        public String getTeacherCode() {
            return teacherCode;
        }

        public int getSlots() {
            return slots;
        }

        public int getTeachingDays() {
            return teachingDays;
        }

        public int getGaps() {
            return gaps;
        }

        public int getSingleSlotDays() {
            return singleSlotDays;
        }

        public int getSlotsOverDayLimit() {
            return slotsOverDayLimit;
        }

        public int getSlotsOverWeekLimit() {
            return slotsOverWeekLimit;
        }
    }

    private final List<TeacherStats> teacherStats = new ArrayList<>();
    private final List<Violation> violations;
    private final Score score;
    private int totalSlots;
    private int totalTeachingDays;
    private int totalGaps;
    private int totalSingleSlotDays;
    private int totalOverDay;
    private int totalOverWeek;
    private int maxSlotsOfOneTeacher;
    private int peakSessionsInOneSlot;

    public TimetableMetrics(Problem problem, Solution solution) {
        ScoreCalculator calculator = new ScoreCalculator(problem);
        score = calculator.calculate(solution);
        violations = new Verifier(problem).verify(solution);
        for (int t = 0; t < problem.getTeacherCount(); t++) {
            TeacherStats stats = buildStats(problem, calculator.dayMasks(solution, t), t);
            if (stats.slots > 0) {
                teacherStats.add(stats);
                addToTotals(stats);
            }
        }
        peakSessionsInOneSlot = countPeak(problem, solution);
    }

    /** Số buổi cùng ca nhiều nhất, để ước lượng số phòng cần. */
    private int countPeak(Problem problem, Solution solution) {
        int[][] count = new int[TimeSlots.LAST_DAY + 1][TimeSlots.SLOTS_PER_DAY];
        int peak = 0;
        for (int i = 0; i < problem.getSessionCount(); i++) {
            if (!solution.isPlaced(i)) {
                continue;
            }
            for (int k = 0; k < problem.getSlotCount(i); k++) {
                int day = solution.getDay(i);
                int slot = solution.getSlot(i) + k;
                count[day][slot]++;
                peak = Math.max(peak, count[day][slot]);
            }
        }
        return peak;
    }

    private TeacherStats buildStats(Problem problem, int[] masks, int t) {
        TeacherStats stats = new TeacherStats(problem.getTeacher(t).getCode());
        int maxPerDay = problem.getTeacher(t).getMaxSlotsPerDay();
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            int mask = masks[day];
            if (mask == 0) {
                continue;
            }
            int slots = DayMask.countSlots(mask);
            stats.slots += slots;
            stats.teachingDays++;
            stats.gaps += DayMask.countGaps(mask);
            if (slots == 1) {
                stats.singleSlotDays++;
            }
            if (slots > maxPerDay) {
                stats.slotsOverDayLimit += slots - maxPerDay;
            }
        }
        int maxPerWeek = problem.getTeacher(t).getMaxSlotsPerWeek();
        if (stats.slots > maxPerWeek) {
            stats.slotsOverWeekLimit = stats.slots - maxPerWeek;
        }
        return stats;
    }

    private void addToTotals(TeacherStats stats) {
        totalSlots += stats.slots;
        totalTeachingDays += stats.teachingDays;
        totalGaps += stats.gaps;
        totalSingleSlotDays += stats.singleSlotDays;
        totalOverDay += stats.slotsOverDayLimit;
        totalOverWeek += stats.slotsOverWeekLimit;
        if (stats.slots > maxSlotsOfOneTeacher) {
            maxSlotsOfOneTeacher = stats.slots;
        }
    }

    public int countViolations(String rule) {
        int count = 0;
        for (Violation violation : violations) {
            if (violation.getRule().equals(rule)) {
                count++;
            }
        }
        return count;
    }

    public List<TeacherStats> getTeacherStats() {
        return teacherStats;
    }

    public List<Violation> getViolations() {
        return violations;
    }

    public Score getScore() {
        return score;
    }

    public int getTeacherCount() {
        return teacherStats.size();
    }

    public int getTotalTeachingDays() {
        return totalTeachingDays;
    }

    public int getTotalGaps() {
        return totalGaps;
    }

    public int getTotalSingleSlotDays() {
        return totalSingleSlotDays;
    }

    public int getTotalOverDay() {
        return totalOverDay;
    }

    public int getTotalOverWeek() {
        return totalOverWeek;
    }

    public int getMaxSlotsOfOneTeacher() {
        return maxSlotsOfOneTeacher;
    }

    public int getPeakSessionsInOneSlot() {
        return peakSessionsInOneSlot;
    }

    /** Báo cáo dạng chữ cho tab "Đánh giá" và file Excel. */
    public String toReport() {
        StringBuilder text = new StringBuilder();
        text.append("=== ĐIỂM ===\n");
        text.append("Điểm: ").append(score).append(score.isFeasible() ? "  -> HỢP LỆ" : "  -> CÒN VI PHẠM CỨNG").append("\n\n");
        text.append("=== TIÊU CHÍ VERIFY CỦA KHOA ===\n");
        appendRule(text, Verifier.RULE_TEACHER_CLASH);
        appendRule(text, Verifier.RULE_LEC_TUT_CLASH);
        appendRule(text, Verifier.RULE_CLASS_CLASH);
        appendRule(text, Verifier.RULE_CROSS_COURSE);
        appendRule(text, Verifier.RULE_MISSING);
        appendRule(text, Verifier.RULE_BUSY);
        appendRule(text, Verifier.RULE_NOT_ALLOWED);
        text.append('\n');
        text.append("=== ĐỘ GỌN LỊCH GIẢNG VIÊN (").append(getTeacherCount()).append(" GV, ")
                .append(totalSlots).append(" ca/tuần) ===\n");
        text.append("S1 Tổng ca trống kẹp giữa:     ").append(totalGaps).append('\n');
        text.append("S2 Số ngày chỉ dạy 1 ca:       ").append(totalSingleSlotDays).append('\n');
        text.append("S3 Tổng số ngày lên trường:    ").append(totalTeachingDays).append('\n');
        text.append("S4 Số ca vượt tối đa/ngày:     ").append(totalOverDay).append('\n');
        text.append("S5 Số ca vượt tối đa/tuần:     ").append(totalOverWeek).append('\n');
        text.append("Số ca nhiều nhất của 1 GV:     ").append(maxSlotsOfOneTeacher).append('\n');
        text.append("Số buổi cùng lúc nhiều nhất:   ").append(peakSessionsInOneSlot)
                .append(" (ước lượng số phòng cần giờ cao điểm)\n\n");
        text.append("=== CHI TIẾT VI PHẠM ===\n");
        if (violations.isEmpty()) {
            text.append("Không có vi phạm.\n");
        }
        for (Violation violation : violations) {
            text.append(violation).append('\n');
        }
        return text.toString();
    }

    private void appendRule(StringBuilder text, String rule) {
        text.append(String.format("%-45s %d%n", rule + ":", countViolations(rule)));
    }
}
