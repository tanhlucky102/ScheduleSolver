package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;

/** TKB cũ của khoa sau khi đọc vào, dùng để so sánh và tạo quy ước mặc định. */
public class GridTimetable {
    private final List<PlanSession> sessions = new ArrayList<>();
    private final List<Assignment> assignments = new ArrayList<>();
    private final List<String> teacherCodes = new ArrayList<>();
    private final List<String> warnings = new ArrayList<>();

    public List<PlanSession> getSessions() {
        return sessions;
    }

    public List<Assignment> getAssignments() {
        return assignments;
    }

    /** Theo thứ tự gặp lần đầu trên lưới. */
    public List<String> getTeacherCodes() {
        return teacherCodes;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    void add(PlanSession session, Assignment assignment) {
        sessions.add(session);
        assignments.add(assignment);
        if (!teacherCodes.contains(assignment.getTeacherCode())) {
            teacherCodes.add(assignment.getTeacherCode());
        }
    }
}
