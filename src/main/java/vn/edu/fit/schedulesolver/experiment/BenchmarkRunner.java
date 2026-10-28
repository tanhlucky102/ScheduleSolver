package vn.edu.fit.schedulesolver.experiment;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.io.GridExcelReader;
import vn.edu.fit.schedulesolver.io.PlanExcelReader;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.service.BusySlotGenerator;
import vn.edu.fit.schedulesolver.service.Convention;
import vn.edu.fit.schedulesolver.service.GridTimetable;
import vn.edu.fit.schedulesolver.service.GridTimetableConverter;
import vn.edu.fit.schedulesolver.service.PlanBuilder;
import vn.edu.fit.schedulesolver.service.ScheduleService;
import vn.edu.fit.schedulesolver.solver.Algorithm;
import vn.edu.fit.schedulesolver.solver.ChangeTimeMove;
import vn.edu.fit.schedulesolver.solver.GreedyBuilder;
import vn.edu.fit.schedulesolver.solver.ParallelSolver;
import vn.edu.fit.schedulesolver.solver.Problem;
import vn.edu.fit.schedulesolver.solver.ScoreCalculator;
import vn.edu.fit.schedulesolver.solver.Solution;
import vn.edu.fit.schedulesolver.solver.SolverConfig;
import vn.edu.fit.schedulesolver.solver.SolverResult;
import vn.edu.fit.schedulesolver.solver.TimetableMetrics;
import vn.edu.fit.schedulesolver.solver.Verifier;

/**
 * Chạy đo bộ giải với nhiều cấu hình trên dữ liệu của khoa rồi ghi số liệu ra file CSV.
 * Tham số dòng lệnh: số giây mỗi lần chạy, số seed, phần cần chạy (bỏ trống thì chạy hết).
 */
public class BenchmarkRunner {
    private static final File RESULT_DIR = new File("docs/results");
    private static final long BUSY_SEED = 2026;
    private static final double BUSY_RATIO = 0.3;
    private static final String RUN_COLUMNS =
            "seed,diem_cung,diem_mem,diem_ban_dau_mem,tong_vong_lap,vong_lap_moi_giay,thoi_gian_ms";

    private final long millisPerRun;
    private final int seedCount;
    private List<Teacher> teachers;
    private List<TeachingRule> rules;
    private GridTimetable grid;
    private List<PlanSession> plan;

    public BenchmarkRunner(long millisPerRun, int seedCount) {
        this.millisPerRun = millisPerRun;
        this.seedCount = seedCount;
    }

    public static void main(String[] args) throws Exception {
        long seconds = args.length > 0 ? Long.parseLong(args[0]) : 10;
        int seeds = args.length > 1 ? Integer.parseInt(args[1]) : 5;
        String selected = args.length > 2 ? args[2].toUpperCase() : "E1,E2,E3,E4";
        BenchmarkRunner runner = new BenchmarkRunner(seconds * 1000, seeds);
        runner.loadData();
        runner.printMachine();
        runner.warmUp();
        RESULT_DIR.mkdirs();
        if (selected.contains("E1")) {
            runner.runE1();
        }
        if (selected.contains("E2")) {
            runner.runE2();
        }
        if (selected.contains("E3")) {
            runner.runE3();
        }
        if (selected.contains("E4")) {
            runner.runE4();
        }
    }

    private void loadData() throws IOException {
        teachers = DataFiles.readTeachers(DataSetup.TEACHER_FILE);
        rules = DataFiles.readRules(DataSetup.RULE_FILE);
        grid = new GridTimetableConverter().convert(new GridExcelReader().read(DataSetup.WORKBOOK), teachers);
        plan = new PlanBuilder().build(new PlanExcelReader().read(DataSetup.WORKBOOK));
    }

    private void printMachine() {
        Runtime runtime = Runtime.getRuntime();
        System.out.println("Máy: " + System.getProperty("os.name") + ", " + runtime.availableProcessors()
                + " luồng CPU, Java " + System.getProperty("java.version")
                + ", RAM tối đa cho JVM " + (runtime.maxMemory() / 1024 / 1024) + " MB");
        System.out.println("Dữ liệu: kế hoạch " + plan.size() + " buổi, TKB cũ " + grid.getSessions().size()
                + " buổi, " + teachers.size() + " giảng viên");
        System.out.println("Mỗi lần chạy " + millisPerRun + " ms, " + seedCount + " seed\n");
    }

    /** Chạy thử 5 giây cho JVM biên dịch JIT xong, để lần đo đầu không bị chậm. */
    private void warmUp() throws InterruptedException {
        new ParallelSolver().solve(planProblem(), new SolverConfig(Algorithm.PORTFOLIO, 4, 5000, 0, 1));
    }

    private Problem planProblem() {
        List<BusySlot> busy = new BusySlotGenerator().generate(teachers, BUSY_RATIO, BUSY_SEED);
        return new Problem(plan, teachers, new Convention(rules).candidateMap(plan), busy, new ArrayList<>());
    }

    private Problem gridProblem(boolean keepTeachers) {
        Map<String, List<String>> candidates;
        if (keepTeachers) {
            candidates = new HashMap<>();
            for (Assignment assignment : grid.getAssignments()) {
                List<String> only = new ArrayList<>();
                only.add(assignment.getTeacherCode());
                candidates.put(assignment.getSessionId(), only);
            }
        } else {
            candidates = new Convention(rules).candidateMap(grid.getSessions());
        }
        return new Problem(grid.getSessions(), teachers, candidates, new ArrayList<>(), new ArrayList<>());
    }

    private void runE1() throws Exception {
        System.out.println("=== E1: TKB lập tay của khoa so với bộ giải (cùng " + grid.getSessions().size() + " buổi) ===");
        List<String[]> rows = new ArrayList<>();
        Problem fixedTeachers = gridProblem(true);
        Solution baseline = new ScheduleService().toSolution(fixedTeachers, grid.getAssignments());
        rows.add(metricRow("TKB lập tay (baseline)", "-", new TimetableMetrics(fixedTeachers, baseline), 0));

        Problem free = gridProblem(false);
        Solution greedy = new GreedyBuilder(free, new ScoreCalculator(free)).build();
        rows.add(metricRow("Chỉ tham lam", "-", new TimetableMetrics(free, greedy), 0));

        for (int seed = 1; seed <= seedCount; seed++) {
            SolverResult result = new ParallelSolver().solve(fixedTeachers,
                    new SolverConfig(Algorithm.PORTFOLIO, 4, millisPerRun, 0, seed));
            rows.add(metricRow("Giữ GV - chỉ đổi giờ (4 luồng)", String.valueOf(seed),
                    new TimetableMetrics(fixedTeachers, result.getBestSolution()), result.getElapsedMillis()));
        }
        for (int seed = 1; seed <= seedCount; seed++) {
            SolverResult result = new ParallelSolver().solve(free,
                    new SolverConfig(Algorithm.PORTFOLIO, 4, millisPerRun, 0, seed));
            rows.add(metricRow("Đổi cả GV theo quy ước (4 luồng)", String.valueOf(seed),
                    new TimetableMetrics(free, result.getBestSolution()), result.getElapsedMillis()));
        }
        String header = "phuong_an,seed,diem_cung,diem_mem,ca_trong,ngay_1_ca,ngay_len_truong,vuot_ngay,vuot_tuan,"
                + "ca_max_1_gv,lec_trung_mon_khac,buoi_cung_luc_max,thoi_gian_ms";
        writeCsv("e1_baseline.csv", header, rows);
    }

    private String[] metricRow(String name, String seed, TimetableMetrics m, long millis) {
        String[] row = {
            name, seed, String.valueOf(m.getScore().getHard()), String.valueOf(m.getScore().getSoft()),
            String.valueOf(m.getTotalGaps()), String.valueOf(m.getTotalSingleSlotDays()),
            String.valueOf(m.getTotalTeachingDays()), String.valueOf(m.getTotalOverDay()),
            String.valueOf(m.getTotalOverWeek()), String.valueOf(m.getMaxSlotsOfOneTeacher()),
            String.valueOf(m.countViolations(Verifier.RULE_CROSS_COURSE)),
            String.valueOf(m.getPeakSessionsInOneSlot()), String.valueOf(millis)
        };
        System.out.println(String.join(" | ", row));
        return row;
    }

    private void runE2() throws Exception {
        System.out.println("\n=== E2: số luồng (Simulated Annealing, kế hoạch " + plan.size() + " buổi, lịch bận giả lập) ===");
        List<String[]> rows = new ArrayList<>();
        Problem problem = planProblem();
        int[] threadCounts = {1, 2, 4, 8};
        for (int threads : threadCounts) {
            for (int seed = 1; seed <= seedCount; seed++) {
                SolverResult result = new ParallelSolver().solve(problem,
                        new SolverConfig(Algorithm.SIMULATED_ANNEALING, threads, millisPerRun, 0, seed));
                rows.add(runRow(String.valueOf(threads), seed, result));
            }
        }
        writeCsv("e2_threads.csv", "so_luong," + RUN_COLUMNS, rows);
    }

    private void runE3() throws Exception {
        System.out.println("\n=== E3: so sánh thuật toán (4 luồng, kế hoạch " + plan.size() + " buổi) ===");
        List<String[]> rows = new ArrayList<>();
        Problem problem = planProblem();
        for (Algorithm algorithm : Algorithm.values()) {
            for (int seed = 1; seed <= seedCount; seed++) {
                SolverResult result = new ParallelSolver().solve(problem,
                        new SolverConfig(algorithm, 4, millisPerRun, 0, seed));
                rows.add(runRow(algorithm.name(), seed, result));
            }
        }
        writeCsv("e3_algorithms.csv", "thuat_toan," + RUN_COLUMNS, rows);
    }

    private String[] runRow(String name, int seed, SolverResult result) {
        long perSecond = result.getTotalIterations() * 1000 / Math.max(1, result.getElapsedMillis());
        String[] row = {
            name, String.valueOf(seed), String.valueOf(result.getBestScore().getHard()),
            String.valueOf(result.getBestScore().getSoft()), String.valueOf(result.getInitialScore().getSoft()),
            String.valueOf(result.getTotalIterations()), String.valueOf(perSecond), String.valueOf(result.getElapsedMillis())
        };
        System.out.println(String.join(" | ", row));
        return row;
    }

    private void runE4() throws IOException {
        System.out.println("\n=== E4: tính điểm cục bộ so với chấm lại toàn bộ ===");
        Problem problem = planProblem();
        ScoreCalculator calculator = new ScoreCalculator(problem);
        Solution solution = new GreedyBuilder(problem, calculator).build();
        Random random = new Random(1);
        int[] movable = problem.getMovableSessions();
        long durationMillis = 3000;

        // cộng dồn vào checksum để JVM không bỏ qua phép tính
        long checksum = 0;
        long deltaMoves = 0;
        long end = System.currentTimeMillis() + durationMillis;
        while (System.currentTimeMillis() < end) {
            ChangeTimeMove move = randomTimeMove(problem, movable, random);
            int[] sessions = move.getSessionIds();
            int[] affected = move.getAffectedTeachers(solution);
            long before = calculator.localCost(solution, sessions, affected);
            move.apply(solution);
            long after = calculator.localCost(solution, sessions, affected);
            move.undo(solution);
            checksum += after - before;
            deltaMoves++;
        }
        long fullMoves = 0;
        end = System.currentTimeMillis() + durationMillis;
        while (System.currentTimeMillis() < end) {
            ChangeTimeMove move = randomTimeMove(problem, movable, random);
            move.apply(solution);
            checksum += calculator.calculate(solution).toCost();
            move.undo(solution);
            fullMoves++;
        }
        System.out.println("(checksum " + checksum + ")");
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"Cục bộ (delta)", String.valueOf(deltaMoves * 1000 / durationMillis)});
        rows.add(new String[] {"Chấm lại toàn bộ", String.valueOf(fullMoves * 1000 / durationMillis)});
        for (String[] row : rows) {
            System.out.println(String.join(" | ", row) + " bước/giây");
        }
        writeCsv("e4_delta.csv", "cach_tinh,buoc_moi_giay", rows);
    }

    private ChangeTimeMove randomTimeMove(Problem problem, int[] movable, Random random) {
        int session = movable[random.nextInt(movable.length)];
        int day = TimeSlots.FIRST_DAY + random.nextInt(6);
        int slot = problem.getSlotCount(session) == 1 ? random.nextInt(6) : 2 * random.nextInt(3);
        return new ChangeTimeMove(session, day, slot);
    }

    private void writeCsv(String name, String header, List<String[]> rows) throws IOException {
        File file = new File(RESULT_DIR, name);
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            writer.println(header);
            for (String[] row : rows) {
                writer.println(String.join(",", row));
            }
        }
        System.out.println("-> đã ghi " + file);
    }
}
