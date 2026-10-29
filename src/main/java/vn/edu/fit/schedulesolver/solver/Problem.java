package vn.edu.fit.schedulesolver.solver;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/**
 * Dữ liệu đầu vào của bộ giải, đổi sẵn ra mảng cho chấm điểm nhanh.
 * Tạo xong không đổi nữa nên các luồng đọc chung không cần khóa.
 */
public class Problem {
    // mức trùng lịch của sinh viên khi hai buổi trùng giờ
    public static final byte NO_CONFLICT = 0;
    public static final byte SOFT_CONFLICT = 1;
    public static final byte HARD_CONFLICT = 2;

    private final List<PlanSession> sessions;
    private final List<Teacher> teachers;
    private final Map<String, Integer> teacherIndex = new HashMap<>();
    private final int[][] candidates;
    private final int[] slotCount;
    private final int[][] busyMask;
    private final byte[][] studentConflict;
    private final int[] lockedTeacher;
    private final int[] lockedDay;
    private final int[] lockedSlot;
    private final int[] movableSessions;

    public Problem(List<PlanSession> sessions, List<Teacher> teachers, Map<String, List<String>> candidateCodes,
                   List<BusySlot> busySlots, List<Assignment> lockedAssignments) {
        this.sessions = new ArrayList<>(sessions);
        this.teachers = new ArrayList<>(teachers);
        for (int t = 0; t < teachers.size(); t++) {
            teacherIndex.put(teachers.get(t).getCode().toUpperCase(), t);
        }
        int n = sessions.size();
        candidates = new int[n][];
        slotCount = new int[n];
        for (int i = 0; i < n; i++) {
            PlanSession session = sessions.get(i);
            slotCount[i] = session.getSlotCount();
            candidates[i] = toTeacherIndexes(candidateCodes.get(session.getId()));
        }
        busyMask = buildBusyMask(busySlots);
        studentConflict = buildStudentConflicts();

        // lockedDay = 0 là buổi không bị khóa
        lockedTeacher = new int[n];
        lockedDay = new int[n];
        lockedSlot = new int[n];
        applyLockedAssignments(lockedAssignments);

        List<Integer> movable = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if (!isLocked(i)) {
                movable.add(i);
            }
        }
        movableSessions = new int[movable.size()];
        for (int k = 0; k < movable.size(); k++) {
            movableSessions[k] = movable.get(k);
        }
    }

    // mã GV lạ thì bỏ qua, Convention.checkPlan đã báo lỗi này
    private int[] toTeacherIndexes(List<String> codes) {
        List<Integer> found = new ArrayList<>();
        if (codes != null) {
            for (String code : codes) {
                Integer index = teacherIndex.get(code.toUpperCase());
                if (index != null && !found.contains(index)) {
                    found.add(index);
                }
            }
        }
        int[] result = new int[found.size()];
        for (int k = 0; k < found.size(); k++) {
            result[k] = found.get(k);
        }
        return result;
    }

    private int[][] buildBusyMask(List<BusySlot> busySlots) {
        int[][] mask = new int[teachers.size()][TimeSlots.LAST_DAY + 1];
        for (BusySlot busy : busySlots) {
            Integer t = teacherIndex.get(busy.getTeacherCode().toUpperCase());
            if (t != null) {
                mask[t][busy.getDay()] = mask[t][busy.getDay()] | busy.getMask();
            }
        }
        return mask;
    }

    private byte[][] buildStudentConflicts() {
        int n = sessions.size();
        byte[][] result = new byte[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                byte type = studentConflictType(sessions.get(i), sessions.get(j));
                result[i][j] = type;
                result[j][i] = type;
            }
        }
        return result;
    }

    private void applyLockedAssignments(List<Assignment> lockedAssignments) {
        Map<String, Integer> sessionIndex = new HashMap<>();
        for (int i = 0; i < sessions.size(); i++) {
            sessionIndex.put(sessions.get(i).getId(), i);
        }
        for (Assignment assignment : lockedAssignments) {
            Integer i = sessionIndex.get(assignment.getSessionId());
            Integer t = teacherIndex.get(assignment.getTeacherCode().toUpperCase());
            if (i == null || t == null) {
                continue;
            }
            if (!TimeSlots.isValidStart(assignment.getStartSlot(), slotCount[i])) {
                continue;
            }
            lockedTeacher[i] = t;
            lockedDay[i] = assignment.getDay();
            lockedSlot[i] = assignment.getStartSlot();
        }
    }

    /** Hai buổi trùng giờ thì sinh viên có bị trùng lịch không (theo sheet Verify). */
    public static byte studentConflictType(PlanSession a, PlanSession b) {
        if (a.getProgram() != b.getProgram() || !a.getCohort().equals(b.getCohort())) {
            return NO_CONFLICT;
        }
        if (a.getProgram().isLecTutTogether()) {
            // lớp CLC học chung mọi môn, nhóm TT chia theo môn nên không tính
            if (a.getProgram().hasFixedClasses() && a.getGroup().equals(b.getGroup())) {
                return HARD_CONFLICT;
            }
            return NO_CONFLICT;
        }
        boolean aLecture = a.getKind() == SessionKind.LECTURE;
        boolean bLecture = b.getKind() == SessionKind.LECTURE;
        boolean aTutorial = a.getKind() == SessionKind.TUTORIAL;
        boolean bTutorial = b.getKind() == SessionKind.TUTORIAL;
        if (a.getCourseCode().equals(b.getCourseCode())) {
            // Verify 2: Lec trùng Tut của chính lớp Lec đó
            if (aLecture && bTutorial && sectionLetter(a).equals(sectionLetter(b))) {
                return HARD_CONFLICT;
            }
            if (aTutorial && bLecture && sectionLetter(a).equals(sectionLetter(b))) {
                return HARD_CONFLICT;
            }
            return NO_CONFLICT;
        }
        // Verify 3: Lec trùng môn khác cùng khóa, chỉ cần cố tránh nên là lỗi mềm
        if (aLecture || bLecture) {
            return SOFT_CONFLICT;
        }
        return NO_CONFLICT;
    }

    /** Nhóm "B01" thuộc lớp Lec B, không có chữ cái thì coi là lớp A. */
    static String sectionLetter(PlanSession session) {
        String group = session.getGroup();
        if (!group.isEmpty() && Character.isLetter(group.charAt(0))) {
            return group.substring(0, 1);
        }
        return "A";
    }

    public int getSessionCount() {
        return sessions.size();
    }

    public int getTeacherCount() {
        return teachers.size();
    }

    public PlanSession getSession(int i) {
        return sessions.get(i);
    }

    public List<PlanSession> getSessions() {
        return sessions;
    }

    public Teacher getTeacher(int t) {
        return teachers.get(t);
    }

    public int findTeacher(String code) {
        Integer index = teacherIndex.get(code.toUpperCase());
        if (index == null) {
            return -1;
        }
        return index;
    }

    public int[] getCandidates(int i) {
        return candidates[i];
    }

    public boolean isCandidate(int i, int teacher) {
        for (int candidate : candidates[i]) {
            if (candidate == teacher) {
                return true;
            }
        }
        return false;
    }

    public int getSlotCount(int i) {
        return slotCount[i];
    }

    public int getBusyMask(int teacher, int day) {
        return busyMask[teacher][day];
    }

    public byte getStudentConflict(int i, int j) {
        return studentConflict[i][j];
    }

    public boolean isLocked(int i) {
        return lockedDay[i] != 0;
    }

    public int getLockedTeacher(int i) {
        return lockedTeacher[i];
    }

    public int getLockedDay(int i) {
        return lockedDay[i];
    }

    public int getLockedSlot(int i) {
        return lockedSlot[i];
    }

    /** Các buổi không bị khóa. */
    public int[] getMovableSessions() {
        return movableSessions;
    }
}
