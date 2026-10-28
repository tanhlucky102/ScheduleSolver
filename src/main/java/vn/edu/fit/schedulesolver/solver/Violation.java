package vn.edu.fit.schedulesolver.solver;

import java.util.ArrayList;
import java.util.List;

/** Một vi phạm kèm câu giải thích cho giáo vụ. */
public class Violation {
    private final String rule;
    private final boolean hard;
    private final String message;
    private final List<String> sessionIds = new ArrayList<>();

    public Violation(String rule, boolean hard, String message, String... sessionIds) {
        this.rule = rule;
        this.hard = hard;
        this.message = message;
        for (String id : sessionIds) {
            this.sessionIds.add(id);
        }
    }

    public String getRule() {
        return rule;
    }

    public boolean isHard() {
        return hard;
    }

    public String getMessage() {
        return message;
    }

    /** Để tô màu trên lưới. */
    public List<String> getSessionIds() {
        return sessionIds;
    }

    @Override
    public String toString() {
        return (hard ? "LỖI" : "CẢNH BÁO") + " [" + rule + "] " + message;
    }
}
