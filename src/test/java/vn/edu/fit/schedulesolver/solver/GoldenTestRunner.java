package vn.edu.fit.schedulesolver.solver;

import java.util.*;
import java.util.concurrent.*;
import java.io.*;
import vn.edu.fit.schedulesolver.model.*;

public class GoldenTestRunner {

    public static void main(String[] args) {
        List<Map<String, Object>> results = new ArrayList<>();

        results.add(runGtcNorm01());
        results.add(runGtcNorm02());
        results.add(runGtcEdge01());
        results.add(runGtcEdge02());
        results.add(runGtcEdge03());
        results.add(runGtcCnst01());
        results.add(runGtcCnst02());
        results.add(runGtcCnst03());
        results.add(runGtcCnst04());
        results.add(runGtcCnfl01());
        results.add(runGtcCnfl02());
        results.add(runGtcCnfl03());
        results.add(runGtcInfeas01());
        results.add(runGtcInfeas02());
        results.add(runGtcExcp01());
        results.add(runGtcConcur01());
        results.add(runGtcExcp02());

        // Print JSON array
        System.out.println(toJson(results));
    }

    private static Map<String, Object> runGtcNorm01() {
        Map<String, Object> res = baseResult("GTC-NORM-01", "Bài toán cơ sở quy mô nhỏ hội tụ khả thi (Baseline Feasibility & Convergence)", "normal",
                "Xác minh bộ giải tìm được lịch học khả thi (H=0) trên tập dữ liệu chuẩn mực, không mâu thuẫn cấu trúc.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(
                    new Teacher("GV0", "Nguyen Van A", 4, 12),
                    new Teacher("GV1", "Tran Thi B", 4, 12),
                    new Teacher("GV2", "Le Van C", 4, 12)
            );
            List<PlanSession> sessions = List.of(
                    new PlanSession("61FIT3DBS-LEC", "61FIT3DBS", "CSDL", "K24", "", SessionKind.LECTURE, 60),
                    new PlanSession("61FIT3DBS-TUT-01", "61FIT3DBS", "CSDL", "K24", "01", SessionKind.TUTORIAL, 30),
                    new PlanSession("61FIT3DBS-TUT-02", "61FIT3DBS", "CSDL", "K24", "02", SessionKind.TUTORIAL, 30),
                    new PlanSession("62FIT3SAD-CLC01", "62FIT3SAD", "PTHT", "K24", "CLC01", SessionKind.LEC_TUT, 30),
                    new PlanSession("61FIT3AAA-TUT-01", "61FIT3AAA", "Toan RR", "K24", "01", SessionKind.TUTORIAL, 30),
                    new PlanSession("61FIT3AAA-TUT-02", "61FIT3AAA", "Toan RR", "K24", "02", SessionKind.TUTORIAL, 30)
            );
            Map<String, List<String>> cands = new HashMap<>();
            cands.put("61FIT3DBS-LEC", List.of("GV0", "GV1"));
            cands.put("61FIT3DBS-TUT-01", List.of("GV0", "GV1", "GV2"));
            cands.put("61FIT3DBS-TUT-02", List.of("GV1", "GV2"));
            cands.put("62FIT3SAD-CLC01", List.of("GV0", "GV2"));
            cands.put("61FIT3AAA-TUT-01", List.of("GV0", "GV1"));
            cands.put("61FIT3AAA-TUT-02", List.of("GV1", "GV2"));

            Problem problem = new Problem(sessions, teachers, cands, List.of(), List.of());
            SolverConfig config = new SolverConfig(Algorithm.SIMULATED_ANNEALING, 2, 0, 5000, 42);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Solution sol = result.getBestSolution();
            Score score = result.getBestScore();
            Verifier verifier = new Verifier(problem);
            List<Violation> violations = verifier.verify(sol);

            boolean placedAll = true;
            boolean validStarts = true;
            for (int i = 0; i < problem.getSessionCount(); i++) {
                if (!sol.isPlaced(i)) placedAll = false;
                if (!TimeSlots.isValidStart(sol.getSlot(i), problem.getSlotCount(i))) validStarts = false;
            }

            boolean c1 = score.getHard() == 0;
            boolean c2 = violations.isEmpty();
            boolean c3 = placedAll;
            boolean c4 = validStarts;
            boolean pass = c1 && c2 && c3 && c4;

            fillExecution(res, pass ? "PASSED" : "FAILED", "SIMULATED_ANNEALING", elapsed, result.getTotalIterations(), 2);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), violations);
            addCriterion(res, "Điểm vi phạm cứng bằng 0 (H == 0)", "0", String.valueOf(score.getHard()), c1);
            addCriterion(res, "Danh sách vi phạm Verifier rỗng", "0", String.valueOf(violations.size()), c2);
            addCriterion(res, "100% buổi học được xếp vị trí", "true", String.valueOf(placedAll), c3);
            addCriterion(res, "Khung giờ bắt đầu hợp lệ (slot chẵn cho buổi 2 ca)", "true", String.valueOf(validStarts), c4);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcNorm02() {
        Map<String, Object> res = baseResult("GTC-NORM-02", "Xếp lịch nhiều khóa học độc lập song song (Mixed Cohorts Regular Scheduling)", "normal",
                "Đánh giá khả năng tối ưu hóa khi có nhiều khóa sinh viên chia sẻ tài nguyên GV mà không gây xung đột chéo.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = TestProblems.teachers(5);
            List<PlanSession> sessions = new ArrayList<>();
            Map<String, List<String>> cands = new HashMap<>();

            String[] cohorts = {"K23", "K24", "K25"};
            for (int c = 0; c < 3; c++) {
                String ch = cohorts[c];
                String m1 = "61FIT" + (c + 1) + "AAA";
                String m2 = "61FIT" + (c + 1) + "BBB";
                sessions.add(TestProblems.session(m1 + "-LEC", m1, ch, "", SessionKind.LECTURE));
                sessions.add(TestProblems.session(m1 + "-TUT-01", m1, ch, "01", SessionKind.TUTORIAL));
                sessions.add(TestProblems.session(m1 + "-TUT-02", m1, ch, "02", SessionKind.TUTORIAL));
                sessions.add(TestProblems.session(m2 + "-LEC", m2, ch, "", SessionKind.LECTURE));
                sessions.add(TestProblems.session(m2 + "-TUT-01", m2, ch, "01", SessionKind.TUTORIAL));
                sessions.add(TestProblems.session(m2 + "-TUT-02", m2, ch, "02", SessionKind.TUTORIAL));
            }

            for (PlanSession s : sessions) {
                cands.put(s.getId(), List.of("GV0", "GV1", "GV2", "GV3", "GV4"));
            }

            Problem problem = new Problem(sessions, teachers, cands, List.of(), List.of());
            SolverConfig config = new SolverConfig(Algorithm.SIMULATED_ANNEALING, 2, 0, 10000, 123);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Score initial = result.getInitialScore();
            Score best = result.getBestScore();
            boolean hZero = best.getHard() == 0;
            boolean improved = best.getSoft() < initial.getSoft();
            double reductionPct = initial.getSoft() > 0 ? ((initial.getSoft() - best.getSoft()) * 100.0 / initial.getSoft()) : 0.0;
            boolean pass = hZero && improved;

            fillExecution(res, pass ? "PASSED" : "FAILED", "SIMULATED_ANNEALING", elapsed, result.getTotalIterations(), 2);
            fillScores(res, best.isFeasible(), best.getHard(), best.getSoft(), best.toCost(), new Verifier(problem).verify(result.getBestSolution()));
            addCriterion(res, "Điểm vi phạm cứng bằng 0 (H == 0)", "0", String.valueOf(best.getHard()), hZero);
            addCriterion(res, "Giảm điểm phạt mềm sau tối ưu cục bộ", "< " + initial.getSoft(), best.getSoft() + " (Giảm " + String.format("%.1f", reductionPct) + "%)", improved);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcEdge01() {
        Map<String, Object> res = baseResult("GTC-EDGE-01", "Bài toán đơn nhất biên cực tiểu (Minimal Non-Trivial Problem)", "edge",
                "Kiểm chứng thuật toán hoạt động chính xác ở điều kiện biên 1 buổi, 1 GV.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(new Teacher("GV0", "Nguyen Van A", 4, 12));
            List<PlanSession> sessions = List.of(new PlanSession("61FIT3PROG-TUT-01", "61FIT3PROG", "Lập trình", "K25", "01", SessionKind.TUTORIAL, 30));
            Map<String, List<String>> cands = Map.of("61FIT3PROG-TUT-01", List.of("GV0"));

            Problem problem = new Problem(sessions, teachers, cands, List.of(), List.of());
            ScoreCalculator calc = new ScoreCalculator(problem);
            Solution sol = new GreedyBuilder(problem, calc).build();
            Score score = calc.calculate(sol);
            long elapsed = System.currentTimeMillis() - start;

            boolean c1 = score.getHard() == 0;
            boolean c2 = score.getSoft() == 20; // 5 (teaching day) + 15 (single slot day)
            boolean pass = c1 && c2;

            fillExecution(res, pass ? "PASSED" : "FAILED", "GREEDY", elapsed, 1, 1);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), new Verifier(problem).verify(sol));
            addCriterion(res, "Lỗi cứng H = 0", "0", String.valueOf(score.getHard()), c1);
            addCriterion(res, "Điểm phạt mềm lý thuyết S = 20", "20", String.valueOf(score.getSoft()), c2);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcEdge02() {
        Map<String, Object> res = baseResult("GTC-EDGE-02", "Ràng buộc ca biên và tính toàn vẹn của buổi 2 ca (Two-Slot Boundary & Slot Alignment)", "edge",
                "Xác minh bộ giải không xếp buổi 2 ca ở các ca lẻ hoặc vắt qua ca cuối ngày.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(new Teacher("GV0", "Nguyen Van A", 4, 12));
            List<PlanSession> sessions = List.of(
                    new PlanSession("SESSION_2S_A", "62FIT3DBS", "CSDL", "K24", "CLC01", SessionKind.COMBINED, 30),
                    new PlanSession("SESSION_2S_B", "62FIT3SAD", "PTHT", "K24", "CLC02", SessionKind.COMBINED, 30),
                    new PlanSession("SESSION_2S_C", "62FIT3WEB", "Web", "K24", "CLC03", SessionKind.COMBINED, 30)
            );
            Map<String, List<String>> cands = new HashMap<>();
            for (PlanSession s : sessions) cands.put(s.getId(), List.of("GV0"));

            List<BusySlot> busy = new ArrayList<>();
            // Thứ 2: bận slot 0, 1, 2, 3 -> mask = 15. Chỉ rảnh slot 4 (ca 5, 6)
            busy.add(new BusySlot("GV0", 2, 0, 3, "Bận", ""));
            // Thứ 4..7: bận toàn bộ slot 0..5
            for (int d = 4; d <= 7; d++) {
                busy.add(new BusySlot("GV0", d, 0, 5, "Bận", ""));
            }
            // Thứ 3: rảnh toàn bộ

            Problem problem = new Problem(sessions, teachers, cands, busy, List.of());
            SolverConfig config = new SolverConfig(Algorithm.HILL_CLIMBING, 1, 0, 2000, 1);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Solution sol = result.getBestSolution();
            Score score = result.getBestScore();

            boolean allValidStarts = true;
            boolean day2Correct = false;
            for (int i = 0; i < 3; i++) {
                int slot = sol.getSlot(i);
                if (slot % 2 != 0 || slot + 2 > 6) allValidStarts = false;
                if (sol.getDay(i) == 2 && slot == 4) day2Correct = true;
            }

            boolean c1 = score.getHard() == 0;
            boolean c2 = allValidStarts;
            boolean c3 = day2Correct;
            boolean pass = c1 && c2 && c3;

            fillExecution(res, pass ? "PASSED" : "FAILED", "HILL_CLIMBING", elapsed, result.getTotalIterations(), 1);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), new Verifier(problem).verify(sol));
            addCriterion(res, "Lỗi cứng H = 0", "0", String.valueOf(score.getHard()), c1);
            addCriterion(res, "Mọi buổi 2 ca bắt đầu ở slot chẵn {0, 2, 4}", "true", String.valueOf(allValidStarts), c2);
            addCriterion(res, "Thứ 2 chỉ có thể nhận buổi ở slot 4 (ca 5-6)", "true", String.valueOf(day2Correct), c3);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcEdge03() {
        Map<String, Object> res = baseResult("GTC-EDGE-03", "Giới hạn bão hòa công suất ngày của Giảng viên (Full Day Saturation & Boundary Limits)", "edge",
                "Kiểm chứng thuật toán tính điểm và giải thuật khi 1 GV dạy kín cả 6 ca trong 1 ngày.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(new Teacher("GV0", "Nguyen Van A", 4, 12));
            List<PlanSession> sessions = new ArrayList<>();
            Map<String, List<String>> cands = new HashMap<>();
            for (int i = 0; i < 6; i++) {
                String id = "61FIT3S" + i + "-TUT";
                sessions.add(new PlanSession(id, "61FIT3S" + i, "Mon " + i, "K2" + (3 + i % 3), "01", SessionKind.TUTORIAL, 30));
                cands.put(id, List.of("GV0"));
            }

            List<BusySlot> busy = new ArrayList<>();
            for (int d = 3; d <= 7; d++) {
                busy.add(new BusySlot("GV0", d, 0, 5, "Bận", ""));
            }

            Problem problem = new Problem(sessions, teachers, cands, busy, List.of());
            SolverConfig config = new SolverConfig(Algorithm.HILL_CLIMBING, 1, 0, 2000, 1);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Solution sol = result.getBestSolution();
            Score score = result.getBestScore();

            int day2Mask = 0;
            for (int i = 0; i < 6; i++) {
                if (sol.getDay(i) == 2) {
                    day2Mask |= (1 << sol.getSlot(i));
                }
            }

            boolean c1 = score.getHard() == 0;
            boolean c2 = score.getSoft() == 45; // 5 (1 day) + 40 (2 over-day slots * 20)
            boolean c3 = DayMask.countSlots(day2Mask) == 6;
            boolean c4 = DayMask.countGaps(day2Mask) == 0;
            boolean pass = c1 && c2 && c3 && c4;

            fillExecution(res, pass ? "PASSED" : "FAILED", "HILL_CLIMBING", elapsed, result.getTotalIterations(), 1);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), new Verifier(problem).verify(sol));
            addCriterion(res, "Lỗi cứng H = 0", "0", String.valueOf(score.getHard()), c1);
            addCriterion(res, "Điểm mềm lý thuyết S = 45 (1 day + 2 over slots * 20)", "45", String.valueOf(score.getSoft()), c2);
            addCriterion(res, "Thứ 2 có đủ 6 ca dạy", "6", String.valueOf(DayMask.countSlots(day2Mask)), c3);
            addCriterion(res, "Không có ca trống kẹp giữa (gaps = 0)", "0", String.valueOf(DayMask.countGaps(day2Mask)), c4);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcCnst01() {
        Map<String, Object> res = baseResult("GTC-CNST-01", "Cưỡng chế nghiêm ngặt giờ bận cố định của Giảng viên (Hard Busy Slot Enforcement - H3)", "constraint",
                "Xác minh bộ giải không bao giờ xếp lịch trùng vào khung giờ bận trường ngoài của GV.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(
                    new Teacher("GV0", "Nguyen Van A", 4, 12),
                    new Teacher("GV1", "Tran Van B", 4, 12)
            );
            List<PlanSession> sessions = new ArrayList<>();
            Map<String, List<String>> cands = new HashMap<>();
            for (int i = 0; i < 8; i++) {
                String id = "SESS-BUSY-" + i;
                sessions.add(TestProblems.session(id, "61FIT3A" + i, "K24", "01", SessionKind.TUTORIAL));
                cands.put(id, List.of("GV0")); // chỉ có GV0 dạy
            }

            List<BusySlot> busy = List.of(
                    new BusySlot("GV0", 2, 0, 1, "Truong A", ""),
                    new BusySlot("GV0", 4, 2, 3, "Truong B", ""),
                    new BusySlot("GV0", 6, 4, 5, "Truong C", "")
            );

            Problem problem = new Problem(sessions, teachers, cands, busy, List.of());
            SolverConfig config = new SolverConfig(Algorithm.PORTFOLIO, 2, 0, 5000, 10);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Solution sol = result.getBestSolution();
            Score score = result.getBestScore();
            ScoreCalculator calc = new ScoreCalculator(problem);

            long totalBusyCost = 0;
            for (int i = 0; i < 8; i++) {
                totalBusyCost += calc.busyCost(sol, i);
            }

            boolean c1 = score.getHard() == 0;
            boolean c2 = totalBusyCost == 0;
            boolean pass = c1 && c2;

            fillExecution(res, pass ? "PASSED" : "FAILED", "PORTFOLIO", elapsed, result.getTotalIterations(), 2);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), new Verifier(problem).verify(sol));
            addCriterion(res, "Lỗi cứng H = 0", "0", String.valueOf(score.getHard()), c1);
            addCriterion(res, "Tổng chi phí trùng giờ bận (busyCost) = 0", "0", String.valueOf(totalBusyCost), c2);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcCnst02() {
        Map<String, Object> res = baseResult("GTC-CNST-02", "Kiểm chứng tính tuân thủ quy ước phân công giảng viên (Convention Enforcement)", "constraint",
                "Đảm bảo bộ giải không vi phạm quy ước phân công (GV chỉ dạy đúng loại Lec/Tut được phép).");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(
                    new Teacher("GV_LEC", "Giang vien Lecture", 4, 12),
                    new Teacher("GV_TUT", "Giang vien Tutorial", 4, 12)
            );
            List<PlanSession> sessions = List.of(
                    TestProblems.session("61FIT3OOP-LEC", "61FIT3OOP", "K24", "", SessionKind.LECTURE),
                    TestProblems.session("61FIT3OOP-TUT-01", "61FIT3OOP", "K24", "01", SessionKind.TUTORIAL)
            );
            Map<String, List<String>> cands = Map.of(
                    "61FIT3OOP-LEC", List.of("GV_LEC"),
                    "61FIT3OOP-TUT-01", List.of("GV_TUT")
            );

            Problem problem = new Problem(sessions, teachers, cands, List.of(), List.of());
            SolverConfig config = new SolverConfig(Algorithm.SIMULATED_ANNEALING, 1, 0, 5000, 77);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Solution sol = result.getBestSolution();
            Score score = result.getBestScore();

            String lecTeacher = problem.getTeacher(sol.getTeacher(0)).getCode();
            String tutTeacher = problem.getTeacher(sol.getTeacher(1)).getCode();

            boolean c1 = "GV_LEC".equals(lecTeacher);
            boolean c2 = "GV_TUT".equals(tutTeacher);
            boolean c3 = score.getHard() == 0;
            boolean pass = c1 && c2 && c3;

            fillExecution(res, pass ? "PASSED" : "FAILED", "SIMULATED_ANNEALING", elapsed, result.getTotalIterations(), 1);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), new Verifier(problem).verify(sol));
            addCriterion(res, "LEC được phân công đúng cho GV_LEC", "GV_LEC", lecTeacher, c1);
            addCriterion(res, "TUT được phân công đúng cho GV_TUT", "GV_TUT", tutTeacher, c2);
            addCriterion(res, "Lỗi cứng H = 0", "0", String.valueOf(score.getHard()), c3);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcCnst03() {
        Map<String, Object> res = baseResult("GTC-CNST-03", "Toàn vẹn cấu trúc đào tạo Lec - Tut cùng môn & Lớp CLC cố định (Curricular Integrity - H2)", "constraint",
                "Kiểm chứng phân loại xung đột sinh viên giữa Lec-Tut, CLC và Tiên tiến.");
        long start = System.currentTimeMillis();
        try {
            PlanSession s0 = TestProblems.session("61MME4ADC-LEC-A", "61MME4ADC", "K23", "A", SessionKind.LECTURE);
            PlanSession s1 = TestProblems.session("61MME4ADC-TUT-A01", "61MME4ADC", "K23", "A01", SessionKind.TUTORIAL);
            PlanSession s2 = TestProblems.session("61MME4ADC-TUT-B01", "61MME4ADC", "K23", "B01", SessionKind.TUTORIAL);
            PlanSession s3 = new PlanSession("62FIT3DBS-CLC01", "62FIT3DBS", "CSDL", "K24", "CLC01", SessionKind.LEC_TUT, 30);
            PlanSession s4 = new PlanSession("62FIT3SAD-CLC01", "62FIT3SAD", "PTHT", "K24", "CLC01", SessionKind.LEC_TUT, 30);
            PlanSession s5 = new PlanSession("66FIT2POP-TT01", "66FIT2POP", "POP", "K25", "TT01", SessionKind.LEC_TUT, 30);
            PlanSession s6 = new PlanSession("66FIT2DMA-TT01", "66FIT2DMA", "DMA", "K25", "TT01", SessionKind.LEC_TUT, 30);

            byte conf01 = Problem.studentConflictType(s0, s1);
            byte conf02 = Problem.studentConflictType(s0, s2);
            byte conf34 = Problem.studentConflictType(s3, s4);
            byte conf56 = Problem.studentConflictType(s5, s6);

            boolean c1 = conf01 == Problem.HARD_CONFLICT;
            boolean c2 = conf02 == Problem.NO_CONFLICT;
            boolean c3 = conf34 == Problem.HARD_CONFLICT;
            boolean c4 = conf56 == Problem.NO_CONFLICT;

            List<PlanSession> sessions = List.of(s0, s1, s2, s3, s4, s5, s6);
            List<Teacher> teachers = TestProblems.teachers(7);
            Map<String, List<String>> cands = new HashMap<>();
            for (int i = 0; i < 7; i++) {
                cands.put(sessions.get(i).getId(), List.of("GV" + i));
            }
            Problem problem = new Problem(sessions, teachers, cands, List.of(), List.of());
            SolverResult result = new ParallelSolver().solve(problem, new SolverConfig(Algorithm.PORTFOLIO, 2, 0, 5000, 1));
            long elapsed = System.currentTimeMillis() - start;

            boolean c5 = result.getBestScore().getHard() == 0;
            boolean pass = c1 && c2 && c3 && c4 && c5;

            fillExecution(res, pass ? "PASSED" : "FAILED", "PORTFOLIO", elapsed, result.getTotalIterations(), 2);
            fillScores(res, result.getBestScore().isFeasible(), result.getBestScore().getHard(), result.getBestScore().getSoft(), result.getBestScore().toCost(), new Verifier(problem).verify(result.getBestSolution()));
            addCriterion(res, "Lec A và Tut A01 cùng môn xung đột cứng (HARD_CONFLICT)", "2", String.valueOf(conf01), c1);
            addCriterion(res, "Lec A và Tut B01 khác lớp không xung đột (NO_CONFLICT)", "0", String.valueOf(conf02), c2);
            addCriterion(res, "Hai môn cùng lớp CLC01 xung đột cứng (HARD_CONFLICT)", "2", String.valueOf(conf34), c3);
            addCriterion(res, "Hai môn cùng mã TT01 không xung đột cứng (NO_CONFLICT)", "0", String.valueOf(conf56), c4);
            addCriterion(res, "Lịch xếp đạt tính khả thi H = 0", "0", String.valueOf(result.getBestScore().getHard()), c5);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcCnst04() {
        Map<String, Object> res = baseResult("GTC-CNST-04", "Bất biến đối với các buổi học bị khóa bởi Giáo vụ (Locked Assignments Invariance)", "constraint",
                "Xác minh các buổi học bị khóa không bao giờ bị thay đổi thời gian hoặc giảng viên.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = TestProblems.teachers(3);
            List<PlanSession> sessions = new ArrayList<>();
            Map<String, List<String>> cands = new HashMap<>();
            for (int i = 0; i < 8; i++) {
                String id = "SESSION_TEST_" + i;
                sessions.add(TestProblems.session(id, "61FIT3M" + i, "K24", "01", SessionKind.TUTORIAL));
                cands.put(id, List.of("GV0", "GV1", "GV2"));
            }

            // Khóa buổi 0 tại GV1, Thứ 3, Slot 0
            List<Assignment> locked = List.of(new Assignment("SESSION_TEST_0", "GV1", 3, 0, true));

            Problem problem = new Problem(sessions, teachers, cands, List.of(), locked);
            SolverConfig config = new SolverConfig(Algorithm.SIMULATED_ANNEALING, 2, 0, 15000, 999);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Solution sol = result.getBestSolution();
            int lockedTeacherIdx = sol.getTeacher(0);
            String teacherCode = problem.getTeacher(lockedTeacherIdx).getCode();
            int day = sol.getDay(0);
            int slot = sol.getSlot(0);

            boolean c1 = "GV1".equals(teacherCode);
            boolean c2 = day == 3;
            boolean c3 = slot == 0;
            boolean c4 = result.getBestScore().getHard() == 0;
            boolean pass = c1 && c2 && c3 && c4;

            fillExecution(res, pass ? "PASSED" : "FAILED", "SIMULATED_ANNEALING", elapsed, result.getTotalIterations(), 2);
            fillScores(res, result.getBestScore().isFeasible(), result.getBestScore().getHard(), result.getBestScore().getSoft(), result.getBestScore().toCost(), new Verifier(problem).verify(sol));
            addCriterion(res, "Buổi khóa giữ đúng GV1", "GV1", teacherCode, c1);
            addCriterion(res, "Buổi khóa giữ đúng Thứ 3", "3", String.valueOf(day), c2);
            addCriterion(res, "Buổi khóa giữ đúng Ca 1 (slot 0)", "0", String.valueOf(slot), c3);
            addCriterion(res, "Lỗi cứng toàn cục H = 0", "0", String.valueOf(result.getBestScore().getHard()), c4);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcCnfl01() {
        Map<String, Object> res = baseResult("GTC-CNFL-01", "Nút thắt Giảng viên độc quyền duy nhất (Exclusive Teacher Bottleneck)", "conflict",
                "Kiểm chứng giải quyết tranh chấp tài nguyên khi 1 GV duy nhất phụ trách 12 buổi học.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(new Teacher("GV_EXPERT", "Chuyen Gia", 4, 12));
            List<PlanSession> sessions = new ArrayList<>();
            Map<String, List<String>> cands = new HashMap<>();
            for (int i = 0; i < 12; i++) {
                String id = "SPEC_SESSION_" + i;
                sessions.add(TestProblems.session(id, "61FIT3S" + i, "K2" + (3 + i % 3), "01", SessionKind.TUTORIAL));
                cands.put(id, List.of("GV_EXPERT"));
            }

            Problem problem = new Problem(sessions, teachers, cands, List.of(), List.of());
            SolverConfig config = new SolverConfig(Algorithm.SIMULATED_ANNEALING, 2, 0, 10000, 55);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Solution sol = result.getBestSolution();
            Score score = result.getBestScore();

            boolean noOverlaps = true;
            for (int i = 0; i < 12; i++) {
                for (int j = i + 1; j < 12; j++) {
                    if (TimeSlots.overlaps(sol.getDay(i), sol.getSlot(i), 1, sol.getDay(j), sol.getSlot(j), 1)) {
                        noOverlaps = false;
                    }
                }
            }

            boolean c1 = score.getHard() == 0;
            boolean c2 = noOverlaps;
            boolean pass = c1 && c2;

            fillExecution(res, pass ? "PASSED" : "FAILED", "SIMULATED_ANNEALING", elapsed, result.getTotalIterations(), 2);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), new Verifier(problem).verify(sol));
            addCriterion(res, "Lỗi cứng H = 0", "0", String.valueOf(score.getHard()), c1);
            addCriterion(res, "Không có cặp buổi nào bị trùng giờ", "true", String.valueOf(noOverlaps), c2);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcCnfl02() {
        Map<String, Object> res = baseResult("GTC-CNFL-02", "Cân bằng giữa dồn lịch giảng viên và vượt trần tải (Compactness vs Overload Trade-off)", "normal",
                "Đánh giá khả năng phân bổ đều tải để tránh phạt vượt trần ngày/tuần (S4, S5).");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(
                    new Teacher("GV_A", "Giang vien A", 3, 6),
                    new Teacher("GV_B", "Giang vien B", 3, 6)
            );
            List<PlanSession> sessions = new ArrayList<>();
            Map<String, List<String>> cands = new HashMap<>();
            for (int i = 0; i < 10; i++) {
                String id = "LOAD_SESS_" + i;
                sessions.add(TestProblems.session(id, "61FIT3C" + i, "K2" + (3 + i % 3), "01", SessionKind.TUTORIAL));
                cands.put(id, List.of("GV_A", "GV_B"));
            }

            Problem problem = new Problem(sessions, teachers, cands, List.of(), List.of());
            SolverConfig config = new SolverConfig(Algorithm.PORTFOLIO, 2, 0, 15000, 33);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Solution sol = result.getBestSolution();
            Score score = result.getBestScore();

            int countA = 0, countB = 0;
            int[] daySlotsA = new int[8];
            int[] daySlotsB = new int[8];
            for (int i = 0; i < 10; i++) {
                int t = sol.getTeacher(i);
                int d = sol.getDay(i);
                if (t == 0) { countA++; daySlotsA[d]++; }
                else { countB++; daySlotsB[d]++; }
            }

            boolean maxDayAOk = Arrays.stream(daySlotsA).max().orElse(0) <= 3;
            boolean maxDayBOk = Arrays.stream(daySlotsB).max().orElse(0) <= 3;
            boolean maxWeekAOk = countA <= 6;
            boolean maxWeekBOk = countB <= 6;

            boolean c1 = score.getHard() == 0;
            boolean c2 = maxWeekAOk && maxWeekBOk;
            boolean c3 = maxDayAOk && maxDayBOk;
            boolean pass = c1 && c2 && c3;

            fillExecution(res, pass ? "PASSED" : "FAILED", "PORTFOLIO", elapsed, result.getTotalIterations(), 2);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), new Verifier(problem).verify(sol));
            addCriterion(res, "Lỗi cứng H = 0", "0", String.valueOf(score.getHard()), c1);
            addCriterion(res, "Tải tuần của GV_A và GV_B <= 6 ca", "true", "GV_A: " + countA + ", GV_B: " + countB, c2);
            addCriterion(res, "Tải ngày của từng GV <= 3 ca", "true", "Max Day A: " + Arrays.stream(daySlotsA).max().orElse(0) + ", Max Day B: " + Arrays.stream(daySlotsB).max().orElse(0), c3);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcCnfl03() {
        Map<String, Object> res = baseResult("GTC-CNFL-03", "Tối ưu hóa tránh trùng chéo môn cùng khóa Verify 3 (Soft Curricular Clash S6)", "constraint",
                "Đảm bảo bộ giải chủ động tách 2 Lecture khác môn cùng khóa để giảm phạt mềm S6 (trọng số 20).");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(
                    new Teacher("GV1", "Giang vien 1", 4, 12),
                    new Teacher("GV2", "Giang vien 2", 4, 12)
            );
            List<PlanSession> sessions = List.of(
                    TestProblems.session("61FIT3DBS-LEC", "61FIT3DBS", "K24", "", SessionKind.LECTURE),
                    TestProblems.session("61FIT3SAD-LEC", "61FIT3SAD", "K24", "", SessionKind.LECTURE)
            );
            Map<String, List<String>> cands = Map.of(
                    "61FIT3DBS-LEC", List.of("GV1"),
                    "61FIT3SAD-LEC", List.of("GV2")
            );

            Problem problem = new Problem(sessions, teachers, cands, List.of(), List.of());
            byte conflict = problem.getStudentConflict(0, 1);

            SolverConfig config = new SolverConfig(Algorithm.SIMULATED_ANNEALING, 1, 0, 5000, 1);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Solution sol = result.getBestSolution();
            Score score = result.getBestScore();
            boolean overlap = TimeSlots.overlaps(sol.getDay(0), sol.getSlot(0), 1, sol.getDay(1), sol.getSlot(1), 1);

            boolean c1 = conflict == Problem.SOFT_CONFLICT;
            boolean c2 = !overlap;
            boolean c3 = score.getHard() == 0;
            boolean pass = c1 && c2 && c3;

            fillExecution(res, pass ? "PASSED" : "FAILED", "SIMULATED_ANNEALING", elapsed, result.getTotalIterations(), 1);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), new Verifier(problem).verify(sol));
            addCriterion(res, "Hai Lecture cùng khóa K24 là xung đột mềm (SOFT_CONFLICT)", "1", String.valueOf(conflict), c1);
            addCriterion(res, "Hai môn được xếp vào thời gian không trùng nhau", "false", String.valueOf(overlap), c2);
            addCriterion(res, "Lỗi cứng H = 0", "0", String.valueOf(score.getHard()), c3);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcInfeas01() {
        Map<String, Object> res = baseResult("GTC-INFEAS-01", "Bất khả thi do nguyên lý Dirichlet/Pigeonhole vượt trần không gian (Pigeonhole Over-Demand Infeasibility)", "infeasible",
                "Kiểm chứng hành vi khi số ca yêu cầu (35) vượt quá slot khả dụng (31).");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(new Teacher("GV0", "Nguyen Van A", 4, 12));
            List<PlanSession> sessions = new ArrayList<>();
            Map<String, List<String>> cands = new HashMap<>();
            for (int i = 0; i < 35; i++) {
                String id = "OVERFLOW_" + i;
                sessions.add(TestProblems.session(id, "61FIT3O" + i, "K2" + (3 + i % 3), "01", SessionKind.TUTORIAL));
                cands.put(id, List.of("GV0"));
            }

            // Bận 5 slot ở Thứ 2: slot 0, 1, 2, 3, 4 -> Còn 31 slot trống trong tuần
            List<BusySlot> busy = List.of(new BusySlot("GV0", 2, 0, 4, "Truong Khac", ""));

            Problem problem = new Problem(sessions, teachers, cands, busy, List.of());
            SolverConfig config = new SolverConfig(Algorithm.HILL_CLIMBING, 1, 0, 1000, 1);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Score score = result.getBestScore();
            Verifier verifier = new Verifier(problem);
            List<Violation> violations = verifier.verify(result.getBestSolution());

            boolean c1 = !score.isFeasible();
            boolean c2 = score.getHard() >= 4;
            boolean pass = c1 && c2;

            fillExecution(res, pass ? "PASSED" : "FAILED", "GREEDY", elapsed, result.getTotalIterations(), 1);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), violations);
            addCriterion(res, "Lịch học xác định bất khả thi (isFeasible == false)", "false", String.valueOf(score.isFeasible()), c1);
            addCriterion(res, "Số lỗi cứng phát hiện tối thiểu >= 4 (35 buổi - 31 slot)", ">= 4", String.valueOf(score.getHard()), c2);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcInfeas02() {
        Map<String, Object> res = baseResult("GTC-INFEAS-02", "Bất khả thi do mâu thuẫn phân công cố định (Contradictory Locked Assignments)", "infeasible",
                "Xác minh bộ giải xử lý an toàn khi 2 buổi bị khóa trùng nhau về GV và thời gian.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(new Teacher("GV0", "Nguyen Van A", 4, 12));
            List<PlanSession> sessions = List.of(
                    TestProblems.session("LOCKED_A", "61FIT3AAA", "K24", "01", SessionKind.TUTORIAL),
                    TestProblems.session("LOCKED_B", "61FIT3BBB", "K24", "01", SessionKind.TUTORIAL)
            );
            Map<String, List<String>> cands = Map.of(
                    "LOCKED_A", List.of("GV0"),
                    "LOCKED_B", List.of("GV0")
            );

            List<Assignment> locked = List.of(
                    new Assignment("LOCKED_A", "GV0", 2, 0, true),
                    new Assignment("LOCKED_B", "GV0", 2, 0, true)
            );

            Problem problem = new Problem(sessions, teachers, cands, List.of(), locked);
            SolverConfig config = new SolverConfig(Algorithm.SIMULATED_ANNEALING, 1, 0, 2000, 1);
            SolverResult result = new ParallelSolver().solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            Score score = result.getBestScore();
            Verifier verifier = new Verifier(problem);
            List<Violation> violations = verifier.verify(result.getBestSolution());

            boolean hasClash = false;
            for (Violation v : violations) {
                if (Verifier.RULE_TEACHER_CLASH.equals(v.getRule())) {
                    hasClash = true;
                    break;
                }
            }

            boolean c1 = !score.isFeasible();
            boolean c2 = score.getHard() >= 1;
            boolean c3 = hasClash;
            boolean pass = c1 && c2 && c3;

            fillExecution(res, pass ? "PASSED" : "FAILED", "SIMULATED_ANNEALING", elapsed, result.getTotalIterations(), 1);
            fillScores(res, score.isFeasible(), score.getHard(), score.getSoft(), score.toCost(), violations);
            addCriterion(res, "Bài toán xác định bất khả thi (isFeasible == false)", "false", String.valueOf(score.isFeasible()), c1);
            addCriterion(res, "Ghi nhận ít nhất 1 lỗi cứng H >= 1", ">= 1", String.valueOf(score.getHard()), c2);
            addCriterion(res, "Verifier phát hiện đúng RULE_TEACHER_CLASH giữa 2 buổi khóa", "true", String.valueOf(hasClash), c3);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcExcp01() {
        Map<String, Object> res = baseResult("GTC-EXCP-01", "Ngoại lệ buổi học không có ứng viên theo quy ước (Zero Candidate Empty Rule Exception)", "exceptional",
                "Kiểm chứng phản ứng phòng vệ khi tồn tại buổi học không có bất kỳ GV ứng viên nào.");
        long start = System.currentTimeMillis();
        try {
            List<Teacher> teachers = List.of(new Teacher("GV0", "Nguyen Van A", 4, 12));
            List<PlanSession> sessions = List.of(TestProblems.session("61FIT3SPECIAL-LEC", "61FIT3SPECIAL", "K24", "", SessionKind.LECTURE));
            Map<String, List<String>> cands = new HashMap<>();
            cands.put("61FIT3SPECIAL-LEC", Collections.emptyList()); // không có ứng viên

            Problem problem = new Problem(sessions, teachers, cands, List.of(), List.of());
            ScoreCalculator calc = new ScoreCalculator(problem);

            boolean threwExpected = false;
            String message = "";
            try {
                new GreedyBuilder(problem, calc).build();
            } catch (IllegalStateException e) {
                threwExpected = true;
                message = e.getMessage();
            }
            long elapsed = System.currentTimeMillis() - start;

            boolean c1 = threwExpected;
            boolean c2 = message != null && message.contains("61FIT3SPECIAL-LEC");
            boolean pass = c1 && c2;

            fillExecution(res, pass ? "PASSED" : "FAILED", "GREEDY", elapsed, 0, 1);
            res.put("evaluation_result", Map.of(
                    "exception_thrown", "IllegalStateException",
                    "exception_message", message != null ? message : ""
            ));
            addCriterion(res, "Ném ngoại lệ IllegalStateException", "true", String.valueOf(threwExpected), c1);
            addCriterion(res, "Thông điệp ngoại lệ chỉ rõ mã buổi học", "chứa 61FIT3SPECIAL-LEC", message, c2);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcConcur01() {
        Map<String, Object> res = baseResult("GTC-CONCUR-01", "Tính tất định và khả năng tái lập đa luồng (Deterministic Parallel Reproducibility)", "edge",
                "Xác minh bộ giải đa luồng cho kết quả đồng nhất tuyệt đối giữa các lần chạy khi cố định seed và ngân sách vòng lặp.");
        long start = System.currentTimeMillis();
        try {
            Problem problem = TestProblems.randomProblem(42);
            SolverConfig config = new SolverConfig(Algorithm.PORTFOLIO, 4, 0, 10000, 999);

            ParallelSolver solver = new ParallelSolver();
            SolverResult r1 = solver.solve(problem, config);
            SolverResult r2 = solver.solve(problem, config);
            long elapsed = System.currentTimeMillis() - start;

            boolean scoresEqual = r1.getBestScore().equals(r2.getBestScore());
            boolean solutionsEqual = r1.getBestSolution().sameAs(r2.getBestSolution());

            boolean c1 = scoresEqual;
            boolean c2 = solutionsEqual;
            boolean pass = c1 && c2;

            fillExecution(res, pass ? "PASSED" : "FAILED", "PORTFOLIO", elapsed, r1.getTotalIterations() + r2.getTotalIterations(), 4);
            fillScores(res, r1.getBestScore().isFeasible(), r1.getBestScore().getHard(), r1.getBestScore().getSoft(), r1.getBestScore().toCost(), new Verifier(problem).verify(r1.getBestSolution()));
            addCriterion(res, "Điểm số 2 lần chạy đa luồng bằng nhau tuyệt đối", "true", String.valueOf(scoresEqual), c1);
            addCriterion(res, "Ma trận phân bổ lịch 2 lần chạy trùng khớp 100%", "true", String.valueOf(solutionsEqual), c2);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> runGtcExcp02() {
        Map<String, Object> res = baseResult("GTC-EXCP-02", "Dừng sớm an toàn không hủy hoại trạng thái giải (Graceful Cancellation & Safe State Retrieval)", "exceptional",
                "Xác minh khi kích hoạt cờ requestStop(), các worker dừng nhanh và trả về best-so-far toàn vẹn.");
        long start = System.currentTimeMillis();
        try {
            Problem problem = TestProblems.randomProblem(100);
            ParallelSolver solver = new ParallelSolver();
            SolverConfig config = new SolverConfig(Algorithm.SIMULATED_ANNEALING, 4, 60000, 0, 77);

            final SolverResult[] holder = new SolverResult[1];
            Thread runner = new Thread(() -> {
                try {
                    holder[0] = solver.solve(problem, config);
                } catch (InterruptedException ignored) {}
            });
            runner.start();

            // Chờ 200ms rồi yêu cầu dừng
            Thread.sleep(200);
            long stopCalledAt = System.currentTimeMillis();
            solver.requestStop();
            runner.join(3000); // Chờ tối đa 3 giây
            long elapsedSinceStop = System.currentTimeMillis() - stopCalledAt;
            long totalElapsed = System.currentTimeMillis() - start;

            SolverResult result = holder[0];
            boolean stoppedQuickly = !runner.isAlive() && elapsedSinceStop < 1500;
            boolean hasResult = result != null && result.getBestSolution() != null;
            boolean isStopped = result != null && result.isStoppedByUser();

            Score recalculated = result != null ? new ScoreCalculator(problem).calculate(result.getBestSolution()) : null;
            boolean scoreConsistent = result != null && recalculated.equals(result.getBestScore());

            boolean c1 = stoppedQuickly;
            boolean c2 = hasResult;
            boolean c3 = isStopped;
            boolean c4 = scoreConsistent;
            boolean pass = c1 && c2 && c3 && c4;

            fillExecution(res, pass ? "PASSED" : "FAILED", "SIMULATED_ANNEALING", totalElapsed, result != null ? result.getTotalIterations() : 0, 4);
            if (result != null) {
                fillScores(res, result.getBestScore().isFeasible(), result.getBestScore().getHard(), result.getBestScore().getSoft(), result.getBestScore().toCost(), new Verifier(problem).verify(result.getBestSolution()));
            }
            addCriterion(res, "Dừng các luồng nhanh chóng (< 1500 ms)", "< 1500 ms", elapsedSinceStop + " ms", c1);
            addCriterion(res, "Thu hồi thành công best-solution-so-far", "true", String.valueOf(hasResult), c2);
            addCriterion(res, "Cờ isStopped() mang giá trị true", "true", String.valueOf(isStopped), c3);
            addCriterion(res, "Điểm số lưu trữ khớp với chấm lại độc lập", "true", String.valueOf(scoreConsistent), c4);
        } catch (Exception e) {
            markError(res, e);
        }
        return res;
    }

    private static Map<String, Object> baseResult(String id, String name, String category, String objective) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("test_case_id", id);
        map.put("scenario_name", name);
        map.put("category", category);
        map.put("objective", objective);
        map.put("status", "UNKNOWN");
        map.put("execution_metrics", new LinkedHashMap<String, Object>());
        map.put("evaluation_result", new LinkedHashMap<String, Object>());
        map.put("validation_criteria", new ArrayList<Map<String, Object>>());
        return map;
    }

    private static void fillExecution(Map<String, Object> res, String status, String algo, long timeMs, long iters, int threads) {
        res.put("status", status);
        @SuppressWarnings("unchecked")
        Map<String, Object> exec = (Map<String, Object>) res.get("execution_metrics");
        exec.put("solver_algorithm", algo);
        exec.put("time_elapsed_ms", timeMs);
        exec.put("iterations_evaluated", iters);
        exec.put("threads", threads);
    }

    private static void fillScores(Map<String, Object> res, boolean feasible, int hard, int soft, long cost, List<Violation> violations) {
        @SuppressWarnings("unchecked")
        Map<String, Object> eval = (Map<String, Object>) res.get("evaluation_result");
        eval.put("is_feasible", feasible);
        eval.put("hard_score", hard);
        eval.put("soft_score", soft);
        eval.put("total_cost", cost);
        eval.put("total_violations_count", violations.size());
        List<String> violSummary = new ArrayList<>();
        for (Violation v : violations) {
            violSummary.add("[" + v.getRule() + "] " + v.getMessage());
        }
        eval.put("violation_details", violSummary);
    }

    private static void addCriterion(Map<String, Object> res, String criterion, String expected, String actual, boolean passed) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> list = (List<Map<String, Object>>) res.get("validation_criteria");
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("criterion", criterion);
        c.put("expected", expected);
        c.put("actual", actual);
        c.put("passed", passed);
        list.add(c);
    }

    private static void markError(Map<String, Object> res, Exception e) {
        res.put("status", "ERROR");
        @SuppressWarnings("unchecked")
        Map<String, Object> eval = (Map<String, Object>) res.get("evaluation_result");
        eval.put("error", e.getClass().getName() + ": " + e.getMessage());
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        eval.put("stacktrace", sw.toString());
    }

    // Simple JSON serializer for primitives, maps, and lists
    private static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\"" + escapeJson((String) obj) + "\"";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof Map) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) obj).entrySet()) {
                if (!first) sb.append(", ");
                sb.append("\"").append(escapeJson(entry.getKey().toString())).append("\": ");
                sb.append(toJson(entry.getValue()));
                first = false;
            }
            sb.append("}");
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
