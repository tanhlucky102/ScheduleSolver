package vn.edu.fit.schedulesolver.io;

import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.model.Workspace;

/** Tính vị trí các ô trên lưới TKB theo mẫu của khoa, dùng cho cả màn hình và file Excel. */
public class TimetableTemplate {
    // 2 TKB riêng, nhưng bộ giải vẫn xếp chung vì nhiều giảng viên dạy cả hai hệ
    public static final int REGULAR = 0;
    public static final int ADVANCED = 1;
    public static final String[] TIMETABLE_NAMES = {"IT + MME", "IT CLC / TIÊN TIẾN"};

    public static final int LECTURE = 0;
    public static final int TUTORIAL = 1;
    public static final int CLASSES = 2;
    public static final String[] BLOCK_NAMES = {"LECTURE", "TUTORIAL", "CLC / TIÊN TIẾN"};
    public static final String[] DAY_NAMES = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
    // màu cột tên khối, 2 màu đầu lấy theo file mẫu
    public static final int[] BLOCK_COLORS = {0xDDD9C4, 0xF2DCDB, 0xDCE6F1};
    // màu nền theo khóa, khóa mới nhất trước (K25, K24, K23)
    public static final int[] COHORT_COLORS = {0xFDE9D9, 0xDAEEF3, 0x92CDDC};
    public static final int MME_TEXT_COLOR = 0x0000FF;
    public static final String PERIOD_TITLE = "Tiết BĐ";

    private static final int DAYS = TimeSlots.LAST_DAY - TimeSlots.FIRST_DAY + 1;

    private final int timetable;
    private final List<Cell> cells = new ArrayList<>();
    // số dòng của một ca = số buổi nhiều nhất của một ngày trong ca đó
    private final int[][] rowCounts = new int[BLOCK_NAMES.length][TimeSlots.SLOTS_PER_DAY];
    // các khóa có trong kế hoạch, khóa mới nhất đứng đầu
    private final List<String> cohorts = new ArrayList<>();

    /** Chỉ lấy các buổi thuộc TKB timetable (REGULAR hoặc ADVANCED). */
    public TimetableTemplate(Workspace workspace, List<Assignment> assignments, int timetable) {
        this.timetable = timetable;
        // lấy khóa từ cả kế hoạch để màu của một khóa không đổi khi lọc
        for (PlanSession session : workspace.getPlan()) {
            if (!session.getCohort().isEmpty() && !cohorts.contains(session.getCohort())) {
                cohorts.add(session.getCohort());
            }
        }
        cohorts.sort((a, b) -> b.compareTo(a));

        List<Cell> unordered = new ArrayList<>();
        for (Assignment assignment : assignments) {
            PlanSession session = workspace.findSession(assignment.getSessionId());
            if (session == null || session.getProgram().isAdvanced() != (timetable == ADVANCED)) {
                continue;
            }
            for (int part = 0; part < session.getSlotCount(); part++) {
                unordered.add(new Cell(session, assignment, part));
            }
        }
        unordered.sort((a, b) -> compareCells(a, b));

        // các ô cùng ngày, cùng ca lần lượt vào dòng 0, 1, 2...
        int[][][] used = new int[BLOCK_NAMES.length][DAYS][TimeSlots.SLOTS_PER_DAY];
        for (Cell cell : unordered) {
            int day = cell.getDay() - TimeSlots.FIRST_DAY;
            cell.row = used[cell.block][day][cell.slot];
            used[cell.block][day][cell.slot]++;
            rowCounts[cell.block][cell.slot] = Math.max(rowCounts[cell.block][cell.slot], cell.row + 1);
            cells.add(cell);
        }
    }

    /** Buổi 2 ca xếp trước rồi mới theo mã buổi, nhờ vậy nửa Lec và nửa Tut của lớp CLC nằm cùng một dòng. */
    private static int compareCells(Cell a, Cell b) {
        if (a.block != b.block) {
            return a.block - b.block;
        }
        if (a.getDay() != b.getDay()) {
            return a.getDay() - b.getDay();
        }
        if (a.slot != b.slot) {
            return a.slot - b.slot;
        }
        if (a.session.getSlotCount() != b.session.getSlotCount()) {
            return b.session.getSlotCount() - a.session.getSlotCount();
        }
        return a.session.getId().compareTo(b.session.getId());
    }

    public List<Cell> getCells() {
        return cells;
    }

    public int getTimetable() {
        return timetable;
    }

    public String getTitle() {
        return TIMETABLE_NAMES[timetable];
    }

    public int[] getBlocks() {
        if (timetable == ADVANCED) {
            return new int[] {CLASSES};
        }
        return new int[] {LECTURE, TUTORIAL};
    }

    /** Ca trống vẫn chiếm 1 dòng. */
    public int getRowCount(int block, int slot) {
        return Math.max(1, rowCounts[block][slot]);
    }

    public int getBlockRowCount(int block) {
        int total = 0;
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            total += getRowCount(block, slot);
        }
        return total;
    }

    public List<String> getColoredCohorts() {
        return cohorts.subList(0, Math.min(COHORT_COLORS.length, cohorts.size()));
    }

    /** Màu nền theo khóa (0xRRGGBB), khóa không có màu riêng thì để trắng. */
    public int fillColor(String cohort) {
        int index = cohorts.indexOf(cohort);
        if (index >= 0 && index < COHORT_COLORS.length) {
            return COHORT_COLORS[index];
        }
        return 0xFFFFFF;
    }

    /** CLC / Tiên tiến có khối riêng; hệ thường thì Lec ở LECTURE, Tut và môn 4 tiết ở TUTORIAL. */
    public static int blockOf(PlanSession session) {
        if (session.getProgram().isAdvanced()) {
            return CLASSES;
        }
        if (session.getKind() == SessionKind.LECTURE) {
            return LECTURE;
        }
        return TUTORIAL;
    }

    /** Dòng đầu của ô, ví dụ "62FIT3DBS - CLC01 - Lec"; part = 0 là ca đầu, 1 là ca sau. */
    public static String titleOf(PlanSession session, int part) {
        String text = session.getCourseCode();
        if (!session.getGroup().isEmpty()) {
            text = text + " - " + session.getGroup();
        }
        if (session.getProgram().isLecTutTogether()) {
            if (session.getKind() == SessionKind.LEC_TUT) {
                text = text + (part == 0 ? " - Lec" : " - Tut");
            } else if (session.getKind() == SessionKind.LECTURE) {
                text = text + " - Lec";
            }
        }
        return text;
    }

    public static String partOfDay(int slot) {
        if (slot < 2) {
            return "Morning";
        }
        if (slot < 4) {
            return "Afternoon";
        }
        return "Evening";
    }

    /** Tiết bắt đầu của ca (3, 5, 7, 9, 11, 13), chính là cột "Tiết BĐ" ở cuối lưới. */
    public static int startPeriod(int slot) {
        return 3 + 2 * slot;
    }

    public static boolean isMme(PlanSession session) {
        return session.getProgram() == Program.MME;
    }

    /** Lớp CLC / Tiên tiến ghi chữ đậm như mẫu. */
    public static boolean isBold(PlanSession session) {
        return session.getProgram().isLecTutTogether();
    }

    /** Một ô trên lưới; buổi 2 ca có 2 ô (part = 0 và 1). */
    public static class Cell {
        private final PlanSession session;
        private final Assignment assignment;
        private final int part;
        private final int block;
        private final int slot;
        private int row;

        private Cell(PlanSession session, Assignment assignment, int part) {
            this.session = session;
            this.assignment = assignment;
            this.part = part;
            this.block = blockOf(session);
            this.slot = assignment.getStartSlot() + part;
        }

        public PlanSession getSession() {
            return session;
        }

        public Assignment getAssignment() {
            return assignment;
        }

        public int getBlock() {
            return block;
        }

        public int getDay() {
            return assignment.getDay();
        }

        public int getSlot() {
            return slot;
        }

        public int getRow() {
            return row;
        }

        public String getTitle() {
            return titleOf(session, part);
        }

        public String getTeacherCode() {
            return assignment.getTeacherCode();
        }
    }
}
