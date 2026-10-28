package vn.edu.fit.schedulesolver.model;

/** Chương trình đào tạo, nhận theo tiền tố mã môn. 62FIT là CLC, từ K25 đổi tên thành 66FIT (Tiên tiến). */
public enum Program {
    // xếp theo A-Z của tiền tố vì ô chọn hiện theo thứ tự này
    DAI_TRA("61FIT", "Đại trà CNTT", false, false),
    MME("61MME", "Ngành MME", false, false),
    CLC("62FIT", "Chất lượng cao", true, true),
    TT("66FIT", "Tiên tiến", true, false);

    private final String codePrefix;
    private final String displayName;
    // true: Lec và Tut liền nhau, cùng giảng viên
    private final boolean lecTutTogether;
    // true: lớp CLC01, CLC02... cố định, cùng sinh viên học mọi môn
    private final boolean fixedClasses;

    Program(String codePrefix, String displayName, boolean lecTutTogether, boolean fixedClasses) {
        this.codePrefix = codePrefix;
        this.displayName = displayName;
        this.lecTutTogether = lecTutTogether;
        this.fixedClasses = fixedClasses;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getLabel() {
        return displayName + " (" + codePrefix + ")";
    }

    public boolean isLecTutTogether() {
        return lecTutTogether;
    }

    /** CLC và TT có TKB riêng, tách khỏi hệ thường. */
    public boolean isAdvanced() {
        return lecTutTogether;
    }

    public boolean hasFixedClasses() {
        return fixedClasses;
    }

    /** Trả về null nếu không khớp tiền tố nào. */
    public static Program fromCourseCode(String courseCode) {
        if (courseCode == null) {
            return null;
        }
        String code = courseCode.trim().toUpperCase();
        for (Program program : values()) {
            if (code.startsWith(program.codePrefix)) {
                return program;
            }
        }
        return null;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
