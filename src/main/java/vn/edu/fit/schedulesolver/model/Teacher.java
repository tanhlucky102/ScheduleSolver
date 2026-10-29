package vn.edu.fit.schedulesolver.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/** Giảng viên, mã là tên viết tắt ghi trên TKB như "NgaNT". */
public class Teacher implements Serializable {
    private static final long serialVersionUID = 1L;

    public static final int DEFAULT_MAX_SLOTS_PER_DAY = 4;
    public static final int DEFAULT_MAX_SLOTS_PER_WEEK = 12;

    private final String code;
    private String fullName;
    private int maxSlotsPerDay;
    private int maxSlotsPerWeek;
    // tên khác trong file Excel cũ, ví dụ "Thảo" là ThaoDTP
    private final List<String> aliases = new ArrayList<>();

    public Teacher(String code, String fullName, int maxSlotsPerDay, int maxSlotsPerWeek) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Mã giảng viên không được để trống.");
        }
        if (maxSlotsPerDay < 1 || maxSlotsPerDay > TimeSlots.SLOTS_PER_DAY) {
            throw new IllegalArgumentException("Số ca tối đa/ngày phải từ 1 đến 6.");
        }
        if (maxSlotsPerWeek < 1) {
            throw new IllegalArgumentException("Số ca tối đa/tuần phải lớn hơn 0.");
        }
        this.code = code.trim();
        this.fullName = fullName == null ? "" : fullName.trim();
        this.maxSlotsPerDay = maxSlotsPerDay;
        this.maxSlotsPerWeek = maxSlotsPerWeek;
    }

    public Teacher(String code) {
        this(code, "", DEFAULT_MAX_SLOTS_PER_DAY, DEFAULT_MAX_SLOTS_PER_WEEK);
    }

    public String getCode() {
        return code;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName == null ? "" : fullName.trim();
    }

    public int getMaxSlotsPerDay() {
        return maxSlotsPerDay;
    }

    public void setMaxSlotsPerDay(int maxSlotsPerDay) {
        this.maxSlotsPerDay = maxSlotsPerDay;
    }

    public int getMaxSlotsPerWeek() {
        return maxSlotsPerWeek;
    }

    public void setMaxSlotsPerWeek(int maxSlotsPerWeek) {
        this.maxSlotsPerWeek = maxSlotsPerWeek;
    }

    public List<String> getAliases() {
        return aliases;
    }

    public void addAlias(String alias) {
        if (alias != null && !alias.isBlank() && !aliases.contains(alias.trim())) {
            aliases.add(alias.trim());
        }
    }

    /** So với mã và các tên khác, không phân biệt hoa thường. */
    public boolean matchesName(String name) {
        if (name == null) {
            return false;
        }
        if (code.equalsIgnoreCase(name.trim())) {
            return true;
        }
        for (String alias : aliases) {
            if (alias.equalsIgnoreCase(name.trim())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public String toString() {
        return code;
    }
}
