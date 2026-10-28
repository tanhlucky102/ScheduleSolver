package vn.edu.fit.schedulesolver.service;

import java.util.List;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.Workspace;

/**
 * Xếp dữ liệu A-Z để các màn hình hiển thị giống nhau. Mã môn bắt đầu bằng tiền tố chương trình
 * nên xếp theo mã môn thì các môn cùng chương trình nằm cạnh nhau.
 */
public final class Sorting {

    private Sorting() {
    }

    public static void sortWorkspace(Workspace workspace) {
        sortTeachers(workspace.getTeachers());
        sortRules(workspace.getRules());
        sortSessions(workspace.getPlan());
        sortAssignments(workspace.getDraft());
        sortAssignments(workspace.getPublished());
        sortBusySlots(workspace.getBusySlots());
    }

    public static void sortTeachers(List<Teacher> teachers) {
        teachers.sort((a, b) -> a.getCode().compareToIgnoreCase(b.getCode()));
    }

    public static void sortRules(List<TeachingRule> rules) {
        rules.sort((a, b) -> {
            int byCourse = a.getCourseCode().compareTo(b.getCourseCode());
            if (byCourse != 0) {
                return byCourse;
            }
            return a.getTeacherCode().compareToIgnoreCase(b.getTeacherCode());
        });
    }

    public static void sortSessions(List<PlanSession> sessions) {
        sessions.sort((a, b) -> a.getId().compareTo(b.getId()));
    }

    public static void sortAssignments(List<Assignment> assignments) {
        assignments.sort((a, b) -> a.getSessionId().compareTo(b.getSessionId()));
    }

    public static void sortBusySlots(List<BusySlot> slots) {
        slots.sort((a, b) -> {
            int byTeacher = a.getTeacherCode().compareToIgnoreCase(b.getTeacherCode());
            if (byTeacher != 0) {
                return byTeacher;
            }
            if (a.getDay() != b.getDay()) {
                return a.getDay() - b.getDay();
            }
            return a.getFromSlot() - b.getFromSlot();
        });
    }
}
