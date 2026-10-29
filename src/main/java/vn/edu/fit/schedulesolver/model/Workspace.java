package vn.edu.fit.schedulesolver.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Toàn bộ dữ liệu xếp lịch, lưu bằng Serialization. Chỉ sửa trên EDT, bộ giải dùng bản sao.
 * Các lớp được lưu đều giữ serialVersionUID = 1L: đổi số này thì file cũ không mở được nữa.
 * Thêm trường mới vào lớp được lưu thì tăng CURRENT_VERSION và điền giá trị mặc định trong upgradeAfterLoad().
 */
public class Workspace implements Serializable {
    private static final long serialVersionUID = 1L;

    // 1: bản 28/10 (chưa có trường dataVersion), 2: thêm dataVersion
    public static final int CURRENT_VERSION = 2;

    private final List<Teacher> teachers = new ArrayList<>();
    private final List<TeachingRule> rules = new ArrayList<>();
    private final List<PlanSession> plan = new ArrayList<>();
    private final List<BusySlot> busySlots = new ArrayList<>();
    private final List<Assignment> draft = new ArrayList<>();
    private final List<Assignment> published = new ArrayList<>();
    // Trưởng khoa đã gửi kế hoạch cho giáo vụ chưa
    private boolean planSent;
    // file lưu từ bản 28/10 không có trường này nên đọc vào sẽ bằng 0
    private int dataVersion = CURRENT_VERSION;

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

    public int getDataVersion() {
        return dataVersion;
    }

    /**
     * Gọi ngay sau khi đọc file. Khi đọc file cũ, Serialization không chạy constructor
     * và các lệnh gán ban đầu, nên trường mới thêm sẽ là null hoặc 0; điền lại ở đây.
     */
    public void upgradeAfterLoad() {
        if (dataVersion > CURRENT_VERSION) {
            throw new IllegalStateException("File được lưu bằng phiên bản mới hơn của chương trình (dữ liệu phiên bản "
                    + dataVersion + "). Hãy cập nhật chương trình rồi mở lại.");
        }
        dataVersion = CURRENT_VERSION;
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
