package vn.edu.fit.schedulesolver.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/** Toàn bộ dữ liệu xếp lịch, lưu bằng Serialization. Chỉ sửa trên EDT, bộ giải dùng bản sao. */
public class Workspace implements Serializable {
    private static final long serialVersionUID = 1L;

    private final List<Teacher> teachers = new ArrayList<>();
    private final List<TeachingRule> rules = new ArrayList<>();
    private final List<PlanSession> plan = new ArrayList<>();
    private final List<BusySlot> busySlots = new ArrayList<>();
    private final List<Assignment> draft = new ArrayList<>();
    private final List<Assignment> published = new ArrayList<>();
    // Trưởng khoa đã gửi kế hoạch cho giáo vụ chưa
    private boolean planSent;

    public List<Teacher> getTeachers() {
        return teachers;
    }

    public List<TeachingRule> getRules() {
        return rules;
    }

    public List<PlanSession> getPlan() {
        return plan;
    }

    public List<BusySlot> getBusySlots() {
        return busySlots;
    }

    public List<Assignment> getDraft() {
        return draft;
    }

    public List<Assignment> getPublished() {
        return published;
    }

    public boolean isPlanSent() {
        return planSent;
    }

    public void setPlanSent(boolean planSent) {
        this.planSent = planSent;
    }

    public Teacher findTeacher(String code) {
        for (Teacher teacher : teachers) {
            if (teacher.getCode().equalsIgnoreCase(code)) {
                return teacher;
            }
        }
        return null;
    }

    public PlanSession findSession(String id) {
        for (PlanSession session : plan) {
            if (session.getId().equals(id)) {
                return session;
            }
        }
        return null;
    }

    public List<BusySlot> getBusySlotsOf(String teacherCode) {
        List<BusySlot> result = new ArrayList<>();
        for (BusySlot slot : busySlots) {
            if (slot.getTeacherCode().equalsIgnoreCase(teacherCode)) {
                result.add(slot);
            }
        }
        return result;
    }

    /** Nháp cũ không còn đúng nên xóa, bản công bố vẫn giữ. */
    public void replacePlan(List<PlanSession> newPlan) {
        plan.clear();
        plan.addAll(newPlan);
        draft.clear();
        planSent = false;
    }

    /** Chép sang list riêng để sửa nháp sau đó không đổi bản công bố. */
    public void publishDraft() {
        published.clear();
        published.addAll(draft);
    }
}
