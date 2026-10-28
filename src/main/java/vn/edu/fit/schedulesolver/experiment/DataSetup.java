package vn.edu.fit.schedulesolver.experiment;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.io.GridCell;
import vn.edu.fit.schedulesolver.io.GridExcelReader;
import vn.edu.fit.schedulesolver.io.PlanExcelReader;
import vn.edu.fit.schedulesolver.io.PlanRow;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.service.AuthService;
import vn.edu.fit.schedulesolver.service.Convention;
import vn.edu.fit.schedulesolver.service.ConventionBuilder;
import vn.edu.fit.schedulesolver.service.GridTimetable;
import vn.edu.fit.schedulesolver.service.GridTimetableConverter;
import vn.edu.fit.schedulesolver.service.PlanBuilder;
import vn.edu.fit.schedulesolver.service.Sorting;

/** Tạo các file CSV mặc định trong resources từ file Excel của khoa. */
public class DataSetup {
    public static final File RESOURCES = new File("resources");
    public static final File WORKBOOK = new File(RESOURCES, "FIT Time table Fall2026 V5.2.xlsx");
    public static final File TEACHER_FILE = new File(RESOURCES, "giang_vien.csv");
    public static final File RULE_FILE = new File(RESOURCES, "quy_uoc_phan_cong.csv");
    public static final File ACCOUNT_FILE = new File(RESOURCES, "tai_khoan.csv");

    // tên khác của cùng một giảng viên trên TKB cũ, dạng {mã, bí danh}
    private static final String[][] KNOWN_ALIASES = {
        {"ThaoDTP", "Thảo"}, {"KhoaTN", "Khoa"}, {"VanHT", "VânHT"}
    };

    // TKB cũ không ghi ai dạy các môn này nên tạm đề xuất, dạng {môn, GV, Lec, Tut}
    private static final String[][] ASSUMED_RULES = {
        {"61FIT3JSD", "QuyenNV", "x", "x"},
        {"61FIT3JSD", "AnhVQ", "", "x"},
        {"61MME2PRE", "PhuongTM", "x", "x"},
        {"61MME2PRE", "KhoaTN", "", "x"},
        {"61MME4CCMA", "ChauNTB", "x", "x"}
    };

    public static void main(String[] args) throws IOException {
        List<Teacher> teachers = new ArrayList<>();
        for (String[] alias : KNOWN_ALIASES) {
            Teacher teacher = new Teacher(alias[0]);
            teacher.addAlias(alias[1]);
            teachers.add(teacher);
        }

        GridExcelReader gridReader = new GridExcelReader();
        List<GridCell> cells = gridReader.read(WORKBOOK);
        GridTimetable grid = new GridTimetableConverter().convert(cells, teachers);
        System.out.println("Ô môn học trên lưới: " + cells.size() + ", chuyển được " + grid.getSessions().size() + " buổi");
        printAll(gridReader.getWarnings());
        printAll(grid.getWarnings());

        PlanExcelReader planReader = new PlanExcelReader();
        List<PlanRow> rows = planReader.read(WORKBOOK);
        List<PlanSession> plan = new PlanBuilder().build(rows);
        System.out.println("Dòng kế hoạch: " + rows.size() + ", buổi cần xếp: " + plan.size());
        printAll(planReader.getWarnings());

        ConventionBuilder builder = new ConventionBuilder();
        teachers.addAll(builder.newTeachers(grid, teachers));
        List<TeachingRule> rules = builder.buildDefault(grid, plan);
        for (String[] assumed : ASSUMED_RULES) {
            if (ConventionBuilder.findRule(rules, assumed[0], assumed[1]) == null) {
                rules.add(new TeachingRule(assumed[0], "", assumed[1], !assumed[2].isEmpty(), !assumed[3].isEmpty()));
            }
        }
        builder.fillMissingCourses(rules, plan);
        System.out.println("Giảng viên: " + teachers.size() + ", dòng quy ước: " + rules.size());
        printAll(new Convention(rules).checkPlan(plan, teachers));

        Sorting.sortTeachers(teachers);
        Sorting.sortRules(rules);
        DataFiles.writeTeachers(TEACHER_FILE, teachers);
        DataFiles.writeRules(RULE_FILE, rules);
        // tài khoản demo, mật khẩu 123456
        new AuthService(ACCOUNT_FILE).ensureDefaultAccounts(teachers);
        System.out.println("Đã ghi " + TEACHER_FILE + ", " + RULE_FILE + " và " + ACCOUNT_FILE);
    }

    private static void printAll(List<String> lines) {
        for (String line : lines) {
            System.out.println("  ! " + line);
        }
    }
}
