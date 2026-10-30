package vn.edu.fit.schedulesolver.experiment;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.io.GridExcelReader;
import vn.edu.fit.schedulesolver.io.PlanExcelReader;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.ExternalSession;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.service.BusySlotGenerator;
import vn.edu.fit.schedulesolver.service.Convention;
import vn.edu.fit.schedulesolver.service.GridTimetable;
import vn.edu.fit.schedulesolver.service.GridTimetableConverter;
import vn.edu.fit.schedulesolver.service.PlanBuilder;
import vn.edu.fit.schedulesolver.service.ScheduleService;
import vn.edu.fit.schedulesolver.solver.Algorithm;
import vn.edu.fit.schedulesolver.solver.GreedyBuilder;
import vn.edu.fit.schedulesolver.solver.ParallelSolver;
import vn.edu.fit.schedulesolver.solver.Problem;
import vn.edu.fit.schedulesolver.solver.Score;
import vn.edu.fit.schedulesolver.solver.ScoreCalculator;
import vn.edu.fit.schedulesolver.solver.Solution;
import vn.edu.fit.schedulesolver.solver.SolverConfig;
import vn.edu.fit.schedulesolver.solver.SolverResult;
import vn.edu.fit.schedulesolver.solver.TimetableMetrics;
import vn.edu.fit.schedulesolver.solver.Verifier;
import vn.edu.fit.schedulesolver.solver.Violation;

/**
 * Bộ kiểm thử và đánh giá mô hình giải thuật (Algorithmic Benchmarking Suite)
 * Đánh giá tính ổn định, độ trễ, đường cong hội tụ theo thời gian và so sánh giữa các thuật toán
 * dựa trên các kịch bản trích xuất từ bảng tính thực tế FIT Time table Fall2026 V5.2.xlsx.
 */
public class AlgorithmBenchmarkRunner {

    private static final File GOLDEN_TEST_DIR = new File("docs/golden-tests");
    private static final File RESULTS_DIR = new File("docs/results");
    private static final long BUSY_SEED = 2026;
    private static final double BUSY_RATIO = 0.3;

    private List<Teacher> teachers;
    private List<TeachingRule> rules;
    private GridTimetable grid;
    private List<PlanSession> fullPlan;
    private List<ExternalSession> externalSessions;

    public static void main(String[] args) throws Exception {
        AlgorithmBenchmarkRunner runner = new AlgorithmBenchmarkRunner();
        runner.loadData();
        runner.warmUp();

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        root.put("system_environment", runner.getSystemInfo());

        List<Map<String, Object>> scenariosJson = new ArrayList<>();
        root.put("scenarios", scenariosJson);

        System.out.println("================================================================================");
        System.out.println("  BẮT ĐẦU CHẠY ĐÁNH GIÁ MÔ HÌNH GIẢI THUẬT (ALGORITHMIC BENCHMARK SUITE)       ");
        System.out.println("================================================================================");

        // 1. SCN-REAL-01: Kế hoạch mở lớp toàn diện (Động lực học thời gian 1p & Tính ổn định)
        Map<String, Object> scn01 = runner.runScenario01FullPlan();
        scenariosJson.add(scn01);

        // 2. SCN-REAL-02: Tái cấu trúc TKB lịch sử 190 buổi (Đối sánh baseline thực tế)
        Map<String, Object> scn02 = runner.runScenario02HistoricalBaseline();
        scenariosJson.add(scn02);

        // Xuất file JSON duy nhất vào results
        String jsonOutput = toJson(root);
        RESULTS_DIR.mkdirs();
        saveFile(new File(RESULTS_DIR, "algorithm_benchmark_results.json"), jsonOutput);

        System.out.println("\n================================================================================");
        System.out.println("  HOÀN TẤT ĐÁNH GIÁ VÀ XUẤT FILE JSON THÀNH CÔNG                                ");
        System.out.println("  File: docs/results/algorithm_benchmark_results.json                           ");
        System.out.println("================================================================================");
    }

    private void loadData() throws IOException {
        teachers = DataFiles.readTeachers(DataSetup.TEACHER_FILE);
        rules = DataFiles.readRules(DataSetup.RULE_FILE);
        grid = new GridTimetableConverter().convert(new GridExcelReader().read(DataSetup.WORKBOOK), teachers);
        fullPlan = new PlanBuilder().build(new PlanExcelReader().read(DataSetup.WORKBOOK));
        externalSessions = DataFiles.readExternalSessions(DataSetup.EXTERNAL_FILE);
    }

    private Map<String, Object> getSystemInfo() {
        Map<String, Object> info = new LinkedHashMap<>();
        Runtime rt = Runtime.getRuntime();
        info.put("os_name", System.getProperty("os.name"));
        info.put("os_arch", System.getProperty("os.arch"));
        info.put("java_version", System.getProperty("java.version"));
        info.put("available_cpu_cores", rt.availableProcessors());
        info.put("max_jvm_memory_mb", rt.maxMemory() / 1024 / 1024);
        info.put("full_plan_session_count", fullPlan.size());
        info.put("historical_grid_session_count", grid.getSessions().size());
        info.put("teacher_count", teachers.size());
        info.put("teaching_rules_count", rules.size());
        info.put("external_sessions_count", externalSessions.size());
        return info;
    }

    private void warmUp() throws InterruptedException {
        System.out.println("-> Khởi động JVM JIT compiler (3 giây)...");
        Problem p = fullPlanProblem(true);
        new ParallelSolver().solve(p, new SolverConfig(Algorithm.SIMULATED_ANNEALING, 4, 3000, 0, 999));
        System.out.println("-> Đã khởi động xong.\n");
    }

    private Problem fullPlanProblem(boolean withSimulatedBusy) {
        List<BusySlot> busy = withSimulatedBusy
                ? new BusySlotGenerator().generate(teachers, BUSY_RATIO, BUSY_SEED)
                : new ArrayList<>();
        return new Problem(fullPlan, teachers, new Convention(rules).candidateMap(fullPlan), busy, new ArrayList<>());
    }

    private Problem fullPlanWithRealExternalBusyProblem() {
        List<BusySlot> busy = new ArrayList<>();
        for (ExternalSession es : externalSessions) {
            BusySlot bs = es.toBusySlot();
            if (bs != null) {
                busy.add(bs);
            }
        }
        return new Problem(fullPlan, teachers, new Convention(rules).candidateMap(fullPlan), busy, new ArrayList<>());
    }

    private Problem gridProblem(boolean keepTeachers) {
        Map<String, List<String>> candidates;
        if (keepTeachers) {
            candidates = new LinkedHashMap<>();
            for (Assignment a : grid.getAssignments()) {
                List<String> list = new ArrayList<>();
                list.add(a.getTeacherCode());
                candidates.put(a.getSessionId(), list);
            }
        } else {
            candidates = new Convention(rules).candidateMap(grid.getSessions());
        }
        return new Problem(grid.getSessions(), teachers, candidates, new ArrayList<>(), new ArrayList<>());
    }

    private Problem clcCohortProblem() {
        List<PlanSession> clcSessions = new ArrayList<>();
        for (PlanSession s : fullPlan) {
            Program prog = Program.fromCourseCode(s.getCourseCode());
            if (prog == Program.CLC) {
                clcSessions.add(s);
            }
        }
        return new Problem(clcSessions, teachers, new Convention(rules).candidateMap(clcSessions), new ArrayList<>(), new ArrayList<>());
    }

    // =========================================================================
    // SCENARIO 01: FULL PLAN - TIME SCALING, STABILITY, CONVERGENCE
    // =========================================================================
    private Map<String, Object> runScenario01FullPlan() throws InterruptedException {
        System.out.println("\n[SCN-REAL-01] Kế hoạch mở lớp toàn diện (236 buổi, 35 GV, lịch bận 30%)");
        System.out.println("-> Đánh giá đường cong hội tụ theo thời gian (1 phút/lần chạy, 5 mốc: 1s, 5s, 15s, 30s, 60s)...");

        Map<String, Object> scn = new LinkedHashMap<>();
        scn.put("scenario_id", "SCN-REAL-01");
        scn.put("name", "Kế hoạch mở lớp toàn diện (Full-Scale Production Plan)");
        scn.put("description", "Đánh giá động lực học thời gian (1 phút) và tính ổn định trên 3 giải thuật độc lập (bỏ Portfolio).");
        scn.put("session_count", fullPlan.size());
        scn.put("teacher_count", teachers.size());

        Problem problem = fullPlanProblem(true);
        Score initialScore = new ScoreCalculator(problem).calculate(new GreedyBuilder(problem, new ScoreCalculator(problem)).build());
        scn.put("initial_greedy_score", Map.of("hard", initialScore.getHard(), "soft", initialScore.getSoft(), "cost", initialScore.toCost()));

        long durationMillis = 60000;
        long[] timeCheckpoints = {1000, 5000, 15000, 30000, 60000};
        int seedCount = 3;
        int threads = 4;

        Algorithm[] algorithms = {Algorithm.HILL_CLIMBING, Algorithm.SIMULATED_ANNEALING, Algorithm.TABU_SEARCH};
        Map<String, Object> algoEvals = new LinkedHashMap<>();

        for (Algorithm algo : algorithms) {
            System.out.println("\n  --- Đang đánh giá: " + algo.name() + " (" + algo.getDisplayName() + ") ---");
            List<Map<String, Object>> seedRuns = new ArrayList<>();
            List<Double> softAt1s = new ArrayList<>();
            List<Double> softAt5s = new ArrayList<>();
            List<Double> softAt15s = new ArrayList<>();
            List<Double> softAt30s = new ArrayList<>();
            List<Double> softAt60s = new ArrayList<>();
            List<Long> itersList = new ArrayList<>();
            List<Long> timeToFeas = new ArrayList<>();

            for (int seed = 1; seed <= seedCount; seed++) {
                SolverConfig config = new SolverConfig(algo, threads, durationMillis, 0, seed);
                SolverResult res = new ParallelSolver().solve(problem, config);

                Map<String, Object> runData = new LinkedHashMap<>();
                runData.put("seed", seed);
                runData.put("final_hard", res.getBestScore().getHard());
                runData.put("final_soft", res.getBestScore().getSoft());
                runData.put("total_iterations", res.getTotalIterations());
                long itersPerSec = res.getTotalIterations() * 1000 / Math.max(1, res.getElapsedMillis());
                runData.put("iterations_per_sec", itersPerSec);
                long tFeas = res.getTimeToFeasible();
                runData.put("time_to_feasible_ms", tFeas);

                // Trajectory qua các mốc thời gian
                Map<String, Object> trajectory = new LinkedHashMap<>();
                for (long t : timeCheckpoints) {
                    Score sAtT = res.getScoreAtTime(t);
                    trajectory.put(t + "ms", Map.of("hard", sAtT.getHard(), "soft", sAtT.getSoft()));
                }
                runData.put("convergence_trajectory", trajectory);
                seedRuns.add(runData);

                softAt1s.add((double) res.getScoreAtTime(1000).getSoft());
                softAt5s.add((double) res.getScoreAtTime(5000).getSoft());
                softAt15s.add((double) res.getScoreAtTime(15000).getSoft());
                softAt30s.add((double) res.getScoreAtTime(30000).getSoft());
                softAt60s.add((double) res.getBestScore().getSoft());
                itersList.add(itersPerSec);
                timeToFeas.add(tFeas);

                System.out.printf("    Seed %d: H=%d, S=%d (1s: %d, 5s: %d, 15s: %d, 30s: %d, 60s: %d) | %d iters/s%n",
                        seed, res.getBestScore().getHard(), res.getBestScore().getSoft(),
                        res.getScoreAtTime(1000).getSoft(), res.getScoreAtTime(5000).getSoft(),
                        res.getScoreAtTime(15000).getSoft(), res.getScoreAtTime(30000).getSoft(),
                        res.getBestScore().getSoft(), itersPerSec);
            }

            Map<String, Object> algoSummary = new LinkedHashMap<>();
            algoSummary.put("runs", seedRuns);
            algoSummary.put("stats_1s", computeStats(softAt1s));
            algoSummary.put("stats_5s", computeStats(softAt5s));
            algoSummary.put("stats_15s", computeStats(softAt15s));
            algoSummary.put("stats_30s", computeStats(softAt30s));
            algoSummary.put("stats_60s_final", computeStats(softAt60s));
            algoSummary.put("avg_iterations_per_sec", itersList.stream().mapToDouble(Long::doubleValue).average().orElse(0));
            algoSummary.put("avg_time_to_feasible_ms", timeToFeas.stream().mapToDouble(Long::doubleValue).average().orElse(0));

            algoEvals.put(algo.name(), algoSummary);
        }

        scn.put("algorithms", algoEvals);
        return scn;
    }

    // =========================================================================
    // SCENARIO 02: HISTORICAL TIMETABLE BASELINE
    // =========================================================================
    private Map<String, Object> runScenario02HistoricalBaseline() throws Exception {
        System.out.println("\n[SCN-REAL-02] Tái cấu trúc TKB lịch sử (186 buổi từ sheet Timetable Spring 2026)");
        System.out.println("-> So sánh Baseline thủ công vs Chỉ tham lam vs Giữ GV vs Đổi GV (10 giây/run)...");

        Map<String, Object> scn = new LinkedHashMap<>();
        scn.put("scenario_id", "SCN-REAL-02");
        scn.put("name", "Tái cấu trúc TKB lịch sử (Manual Baseline Reconstruction)");
        scn.put("session_count", grid.getSessions().size());

        Problem fixedProblem = gridProblem(true);
        Solution baselineSol = new ScheduleService().toSolution(fixedProblem, grid.getAssignments());
        TimetableMetrics baselineMetrics = new TimetableMetrics(fixedProblem, baselineSol);
        scn.put("manual_baseline", metricsToMap(baselineMetrics, 0, 0));

        Problem freeProblem = gridProblem(false);
        Solution greedySol = new GreedyBuilder(freeProblem, new ScoreCalculator(freeProblem)).build();
        TimetableMetrics greedyMetrics = new TimetableMetrics(freeProblem, greedySol);
        scn.put("greedy_only", metricsToMap(greedyMetrics, 0, 0));

        int seeds = 3;
        List<Map<String, Object>> fixedRuns = new ArrayList<>();
        List<Double> fixedSoft = new ArrayList<>();
        for (int seed = 1; seed <= seeds; seed++) {
            SolverResult res = new ParallelSolver().solve(fixedProblem, new SolverConfig(Algorithm.SIMULATED_ANNEALING, 4, 10000, 0, seed));
            TimetableMetrics m = new TimetableMetrics(fixedProblem, res.getBestSolution());
            fixedRuns.add(metricsToMap(m, res.getTotalIterations(), res.getElapsedMillis()));
            fixedSoft.add((double) m.getScore().getSoft());
        }
        scn.put("fixed_teachers_sa_10s", Map.of("runs", fixedRuns, "stats", computeStats(fixedSoft)));

        List<Map<String, Object>> freeRuns = new ArrayList<>();
        List<Double> freeSoft = new ArrayList<>();
        for (int seed = 1; seed <= seeds; seed++) {
            SolverResult res = new ParallelSolver().solve(freeProblem, new SolverConfig(Algorithm.SIMULATED_ANNEALING, 4, 10000, 0, seed));
            TimetableMetrics m = new TimetableMetrics(freeProblem, res.getBestSolution());
            freeRuns.add(metricsToMap(m, res.getTotalIterations(), res.getElapsedMillis()));
            freeSoft.add((double) m.getScore().getSoft());
        }
        scn.put("free_teachers_sa_10s", Map.of("runs", freeRuns, "stats", computeStats(freeSoft)));

        System.out.printf("  Manual: H=%d, S=%d, Gaps=%d, SingleDay=%d, TeachDays=%d%n",
                baselineMetrics.getScore().getHard(), baselineMetrics.getScore().getSoft(),
                baselineMetrics.getTotalGaps(), baselineMetrics.getTotalSingleSlotDays(), baselineMetrics.getTotalTeachingDays());
        System.out.printf("  Fixed GV: H=0, S_mean=%.1f%n", computeStats(fixedSoft).get("mean"));
        System.out.printf("  Free GV:  H=0, S_mean=%.1f%n", computeStats(freeSoft).get("mean"));

        return scn;
    }

    // =========================================================================
    // SCENARIO 03: CLC BLOCK COHORT
    // =========================================================================
    private Map<String, Object> runScenario03ClcBlock() throws InterruptedException {
        System.out.println("\n[SCN-REAL-03] Khối lớp Chất lượng cao (CLC Block Cohort, 2 ca liền, slot chẵn)");
        Map<String, Object> scn = new LinkedHashMap<>();
        scn.put("scenario_id", "SCN-REAL-03");
        scn.put("name", "Khối lớp Chất lượng cao (CLC Block Cohort)");

        Problem problem = clcCohortProblem();
        scn.put("session_count", problem.getSessionCount());

        Map<String, Object> runs = new LinkedHashMap<>();
        Algorithm[] algorithms = {Algorithm.HILL_CLIMBING, Algorithm.SIMULATED_ANNEALING, Algorithm.TABU_SEARCH, Algorithm.PORTFOLIO};
        for (Algorithm algo : algorithms) {
            SolverResult res = new ParallelSolver().solve(problem, new SolverConfig(algo, 4, 8000, 0, 42));
            Verifier verifier = new Verifier(problem);
            List<Violation> violations = verifier.verify(res.getBestSolution());
            runs.put(algo.name(), Map.of(
                    "hard", res.getBestScore().getHard(),
                    "soft", res.getBestScore().getSoft(),
                    "violations_count", violations.size(),
                    "iterations_per_sec", res.getTotalIterations() * 1000 / Math.max(1, res.getElapsedMillis())
            ));
            System.out.printf("  CLC %s: H=%d, S=%d, Violations=%d%n", algo.name(), res.getBestScore().getHard(), res.getBestScore().getSoft(), violations.size());
        }
        scn.put("results", runs);
        return scn;
    }

    // =========================================================================
    // SCENARIO 05: REAL EXTERNAL BUSY SCHEDULE
    // =========================================================================
    private Map<String, Object> runScenario05ExternalBusy() throws InterruptedException {
        System.out.println("\n[SCN-STRESS-05] Căng thẳng Lịch bận trường ngoài thực tế (lich_truong_khac.csv)");
        Map<String, Object> scn = new LinkedHashMap<>();
        scn.put("scenario_id", "SCN-STRESS-05");
        scn.put("name", "Căng thẳng Lịch bận trường ngoài thực tế (External Busy Contention)");
        scn.put("external_slots_count", externalSessions.size());

        Problem problem = fullPlanWithRealExternalBusyProblem();
        Map<String, Object> runs = new LinkedHashMap<>();

        Algorithm[] algorithms = {Algorithm.PORTFOLIO, Algorithm.SIMULATED_ANNEALING};
        for (Algorithm algo : algorithms) {
            SolverResult res = new ParallelSolver().solve(problem, new SolverConfig(algo, 4, 10000, 0, 2026));
            Verifier verifier = new Verifier(problem);
            List<Violation> violations = verifier.verify(res.getBestSolution());
            long busyClashes = violations.stream().filter(v -> Verifier.RULE_BUSY.equals(v.getRule())).count();
            runs.put(algo.name(), Map.of(
                    "hard", res.getBestScore().getHard(),
                    "soft", res.getBestScore().getSoft(),
                    "busy_clashes_count", busyClashes,
                    "violations_total", violations.size()
            ));
            System.out.printf("  ExternalBusy %s: H=%d, S=%d, BusyClashes=%d%n", algo.name(), res.getBestScore().getHard(), res.getBestScore().getSoft(), busyClashes);
        }
        scn.put("results", runs);
        return scn;
    }

    // =========================================================================
    // HELPER METHODS: STATS, SERIALIZATION, FILE SAVING
    // =========================================================================
    private static Map<String, Object> computeStats(List<Double> values) {
        Map<String, Object> stats = new LinkedHashMap<>();
        if (values.isEmpty()) return stats;
        double sum = 0;
        double min = Double.MAX_VALUE;
        double max = -Double.MAX_VALUE;
        for (double v : values) {
            sum += v;
            if (v < min) min = v;
            if (v > max) max = v;
        }
        double mean = sum / values.size();
        double varianceSum = 0;
        for (double v : values) {
            varianceSum += (v - mean) * (v - mean);
        }
        double stdDev = values.size() > 1 ? Math.sqrt(varianceSum / (values.size() - 1)) : 0.0;
        double cv = mean > 0 ? (stdDev / mean) * 100.0 : 0.0;

        stats.put("mean", Math.round(mean * 10.0) / 10.0);
        stats.put("std_dev", Math.round(stdDev * 100.0) / 100.0);
        stats.put("min", min);
        stats.put("max", max);
        stats.put("range", max - min);
        stats.put("coefficient_of_variation_pct", Math.round(cv * 100.0) / 100.0);
        return stats;
    }

    private static Map<String, Object> metricsToMap(TimetableMetrics m, long iters, long elapsed) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("hard", m.getScore().getHard());
        map.put("soft", m.getScore().getSoft());
        map.put("gaps_S1", m.getTotalGaps());
        map.put("single_slot_days_S2", m.getTotalSingleSlotDays());
        map.put("teaching_days_S3", m.getTotalTeachingDays());
        map.put("over_day_S4", m.getTotalOverDay());
        map.put("over_week_S5", m.getTotalOverWeek());
        map.put("max_slots_1_teacher", m.getMaxSlotsOfOneTeacher());
        map.put("cross_course_clashes_S6", m.countViolations(Verifier.RULE_CROSS_COURSE));
        map.put("peak_sessions_in_slot", m.getPeakSessionsInOneSlot());
        map.put("iterations", iters);
        map.put("elapsed_ms", elapsed);
        return map;
    }

    private static void saveFile(File file, String content) throws IOException {
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            writer.write(content);
        }
    }

    private static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\"" + escapeJson((String) obj) + "\"";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof Map) {
            StringBuilder sb = new StringBuilder("{\n");
            boolean first = true;
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) obj).entrySet()) {
                if (!first) sb.append(",\n");
                sb.append("  \"").append(escapeJson(entry.getKey().toString())).append("\": ");
                String valStr = toJson(entry.getValue());
                sb.append(valStr.replace("\n", "\n  "));
                first = false;
            }
            sb.append("\n}");
            return sb.toString();
        }
        if (obj instanceof List) {
            StringBuilder sb = new StringBuilder("[\n");
            boolean first = true;
            for (Object item : (List<?>) obj) {
                if (!first) sb.append(",\n");
                sb.append("  ").append(toJson(item).replace("\n", "\n  "));
                first = false;
            }
            sb.append("\n]");
            return sb.toString();
        }
        return "\"" + escapeJson(obj.toString()) + "\"";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
