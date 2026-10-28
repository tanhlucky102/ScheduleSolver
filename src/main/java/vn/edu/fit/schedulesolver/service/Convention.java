package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;

/** Tìm giảng viên được dạy từng buổi theo quy ước, buổi Lec+Tut cần người dạy được cả hai. */
public class Convention {
    private final List<TeachingRule> rules;

    public Convention(List<TeachingRule> rules) {
        this.rules = new ArrayList<>(rules);
    }

    /** Xếp A-Z để kết quả không phụ thuộc thứ tự dòng quy ước. */
    public List<String> candidatesFor(PlanSession session) {
        List<String> result = new ArrayList<>();
        for (TeachingRule rule : rules) {
            if (rule.getCourseCode().equals(session.getCourseCode()) && rule.allows(session.getKind())
                    && !result.contains(rule.getTeacherCode())) {
                result.add(rule.getTeacherCode());
            }
        }
        result.sort((a, b) -> a.compareToIgnoreCase(b));
        return result;
    }

    /** Dùng khi tạo Problem. */
    public Map<String, List<String>> candidateMap(List<PlanSession> plan) {
        Map<String, List<String>> map = new HashMap<>();
        for (PlanSession session : plan) {
            map.put(session.getId(), candidatesFor(session));
        }
        return map;
    }

    /** Trả về danh sách rỗng là kế hoạch xếp được. */
    public List<String> checkPlan(List<PlanSession> plan, List<Teacher> teachers) {
        List<String> problems = new ArrayList<>();
        if (plan.isEmpty()) {
            problems.add("Kế hoạch mở lớp đang trống.");
        }
        // gom theo môn và loại buổi để thông báo gọn
        Map<String, Integer> missing = new LinkedHashMap<>();
        for (PlanSession session : plan) {
            if (candidatesFor(session).isEmpty()) {
                String key = session.getCourseCode() + " (" + session.getKind().getLabel() + ")";
                missing.put(key, missing.getOrDefault(key, 0) + 1);
            }
        }
        for (Map.Entry<String, Integer> entry : missing.entrySet()) {
            problems.add("Môn " + entry.getKey() + " chưa có giảng viên phụ trách trong quy ước: "
                    + entry.getValue() + " buổi không xếp được.");
        }
        for (TeachingRule rule : rules) {
            if (!hasTeacher(teachers, rule.getTeacherCode())) {
                problems.add("Giảng viên " + rule.getTeacherCode() + " (quy ước môn " + rule.getCourseCode()
                        + ") chưa có trong danh sách giảng viên.");
            }
        }
        return problems;
    }

    private static boolean hasTeacher(List<Teacher> teachers, String code) {
        for (Teacher teacher : teachers) {
            if (teacher.getCode().equalsIgnoreCase(code)) {
                return true;
            }
        }
        return false;
    }
}
