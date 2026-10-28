package vn.edu.fit.schedulesolver.solver;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;

/** Tạo dữ liệu nhỏ dùng chung cho các test của bộ giải. */
final class TestProblems {

    private TestProblems() {
    }

    static List<Teacher> teachers(int count) {
        List<Teacher> list = new ArrayList<>();
        for (int t = 0; t < count; t++) {
            list.add(new Teacher("GV" + t, "", 4, 12));
        }
        return list;
    }

    static PlanSession session(String id, String course, String cohort, String group, SessionKind kind) {
        return new PlanSession(id, course, "", cohort, group, kind, 30);
    }

    /** Mọi buổi dùng chung các giảng viên truyền vào. */
    static Problem problem(List<PlanSession> sessions, List<Teacher> teachers, List<BusySlot> busy, String... teacherCodes) {
        Map<String, List<String>> candidates = new HashMap<>();
        for (PlanSession session : sessions) {
            List<String> codes = new ArrayList<>();
            for (String code : teacherCodes) {
                codes.add(code);
            }
            candidates.put(session.getId(), codes);
        }
        return new Problem(sessions, teachers, candidates, busy, new ArrayList<Assignment>());
    }

    /** Khoảng 50 buổi đủ loại, mỗi buổi 2-3 GV, có vài lịch bận. */
    static Problem randomProblem(long seed) {
        Random random = new Random(seed);
        List<Teacher> teachers = teachers(8);
        List<PlanSession> sessions = new ArrayList<>();
        for (int c = 0; c < 8; c++) {
            String course = "61FIT" + (2 + c % 3) + "C" + c + "X";
            String cohort = "K2" + (3 + c % 3);
            sessions.add(session(course + "-LEC", course, cohort, "", SessionKind.LECTURE));
            for (int g = 1; g <= 3; g++) {
                sessions.add(session(course + "-TUT-0" + g, course, cohort, "0" + g, SessionKind.TUTORIAL));
            }
        }
        for (int c = 0; c < 4; c++) {
            String course = "62FIT3C" + c + "Y";
            sessions.add(session(course + "-CLC01", course, "K24", "CLC01", SessionKind.LEC_TUT));
            sessions.add(session(course + "-CLC02", course, "K24", "CLC02", SessionKind.LEC_TUT));
        }
        sessions.add(session("61FIT3SS1-4T-01", "61FIT3SS1", "K24", "01", SessionKind.COMBINED));
        sessions.add(session("61FIT3SS1-4T-02", "61FIT3SS1", "K24", "02", SessionKind.COMBINED));

        Map<String, List<String>> candidates = new HashMap<>();
        for (PlanSession s : sessions) {
            List<String> codes = new ArrayList<>();
            int count = 2 + random.nextInt(2);
            while (codes.size() < count) {
                String code = "GV" + random.nextInt(teachers.size());
                if (!codes.contains(code)) {
                    codes.add(code);
                }
            }
            candidates.put(s.getId(), codes);
        }
        List<BusySlot> busy = new ArrayList<>();
        busy.add(new BusySlot("GV0", 2, 0, 1, "Trường khác", ""));
        busy.add(new BusySlot("GV3", 5, 2, 3, "Trường khác", ""));
        return new Problem(sessions, teachers, candidates, busy, new ArrayList<Assignment>());
    }
}
