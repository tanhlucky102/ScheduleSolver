package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridLayout;
import java.io.File;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTabbedPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;
import javax.swing.SwingUtilities;
import javax.swing.Timer;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.table.DefaultTableModel;
import vn.edu.fit.schedulesolver.io.ExcelExporter;
import vn.edu.fit.schedulesolver.io.TimetableTemplate;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.io.CsvFile;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.service.BusySlotGenerator;
import vn.edu.fit.schedulesolver.service.Convention;
import vn.edu.fit.schedulesolver.service.ScheduleService;
import vn.edu.fit.schedulesolver.solver.Algorithm;
import vn.edu.fit.schedulesolver.solver.ParallelSolver;
import vn.edu.fit.schedulesolver.solver.Problem;
import vn.edu.fit.schedulesolver.solver.Score;
import vn.edu.fit.schedulesolver.solver.SolverConfig;
import vn.edu.fit.schedulesolver.solver.SolverResult;
import vn.edu.fit.schedulesolver.solver.TimetableMetrics;
import vn.edu.fit.schedulesolver.solver.Violation;

/** Màn hình Giáo vụ: xếp lịch bằng bộ giải song song, xem và sửa TKB nháp, công bố và xuất Excel. */
public class StaffPanel extends BasePanel {
    private static final String ALL = "Tất cả";

    private final ScheduleService service = new ScheduleService();

    private final JComboBox<Algorithm> algorithmBox = new JComboBox<>(Algorithm.values());
    // mặc định 8 luồng, máy ít nhân hơn thì lấy theo số nhân
    private final JSpinner threadSpinner = new JSpinner(new SpinnerNumberModel(
            Math.min(8, Runtime.getRuntime().availableProcessors()), 1, 32, 1));
    private final JSpinner secondSpinner = new JSpinner(new SpinnerNumberModel(10, 1, 600, 1));
    private final JTextField seedField = new JTextField("42", 6);
    private final JButton solveButton = createButton("Xếp lịch", e -> startSolving());
    private final JButton stopButton = createButton("Dừng", Theme.DANGER, e -> stopSolving());
    private final JButton publishButton = createButton("Công bố cho giảng viên", Theme.SUCCESS, e -> publish());
    private final JButton exportButton = createButton("Xuất Excel...", Theme.NEUTRAL, e -> exportExcel());
    private final JButton busyButton = createButton("Tạo lịch bận giả lập", Theme.WARNING, e -> generateBusySlots());
    private final JProgressBar progressBar = new JProgressBar(0, 100);
    private final JLabel progressLabel = new JLabel("Chưa chạy.");
    private final Timer progressTimer = new Timer(300, e -> updateProgress());

    // 2 lưới riêng: hệ thường (IT, MME) và hệ CLC, Tiên tiến
    private final TemplateGridPanel regularGrid = new TemplateGridPanel();
    private final TemplateGridPanel advancedGrid = new TemplateGridPanel();
    private final JComboBox<String> programFilter = new JComboBox<>();
    private final JComboBox<String> cohortFilter = new JComboBox<>();
    private final JComboBox<String> teacherFilter = new JComboBox<>();
    // tránh vẽ lại lưới nhiều lần khi đang nạp lại ô lọc
    private boolean updatingFilters;

    private final DefaultTableModel draftModel = readOnlyModel("Mã buổi", "Mã môn", "Tên môn", "Loại",
            "Chương trình", "Khóa", "Nhóm", "Giảng viên", "Thời gian", "Cố định");
    private final JTable draftTable = createTable(draftModel);
    private final JTextArea reportArea = new JTextArea();
    private final DefaultTableModel busyModel = readOnlyModel("Giảng viên", "Thứ", "Ca", "Nơi bận");

    // tab Kế hoạch từ trưởng khoa
    private final DefaultTableModel receivedPlanModel = readOnlyModel("Mã buổi", "Mã môn", "Tên môn",
            "Chương trình", "Khóa", "Nhóm", "Loại", "Số SV", "Số ca", "GV phụ trách");
    private final DefaultTableModel receivedTeacherModel = readOnlyModel("Mã GV", "Họ tên",
            "Tối đa ca/ngày", "Tối đa ca/tuần");
    private final DefaultTableModel receivedRuleModel = readOnlyModel("Chương trình", "Mã môn",
            "Tên môn", "GV phụ trách", "Dạy Lec", "Dạy Tut");
    private final JLabel receivedStatusLabel = new JLabel();
    private final JLabel receivedValidationLabel = new JLabel();
    private final JComboBox<String> receivedProgramFilter = new JComboBox<>();
    private final JComboBox<String> receivedCohortFilter = new JComboBox<>();
    private final JComboBox<String> receivedKindFilter = new JComboBox<>();
    private final JLabel receivedPlanCountLabel = new JLabel();
    private final JComboBox<String> receivedRuleProgramFilter = new JComboBox<>();
    private final JLabel receivedRuleCountLabel = new JLabel();
    private boolean updatingReceivedFilters;
    private final JTabbedPane receivedSubTabs = new JTabbedPane();
    private final JButton loadSamplePlanButton = createButton("Nạp kế hoạch mẫu Fall2026 (236 buổi)", Theme.SUCCESS, e -> loadSamplePlan());

    private ParallelSolver runningSolver;
    private long runningLimitMillis;
    private String lastRunText = "";
    private TimetableMetrics lastMetrics;

    public StaffPanel(MainFrame frame) {
        super(frame);
        add(createConfigPanel(), BorderLayout.WEST);

        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("Kế hoạch từ trưởng khoa", createReceivedPlanTab());
        tabs.addTab("Lưới TKB nháp", createGridTab());
        tabs.addTab("Danh sách buổi", createListTab());
        reportArea.setEditable(false);
        reportArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        tabs.addTab("Đánh giá (Verify + metrics)", new JScrollPane(reportArea));
        tabs.addTab("Lịch bận giảng viên chia sẻ", new JScrollPane(createTable(busyModel)));
        add(tabs, BorderLayout.CENTER);
        stopButton.setEnabled(false);
    }

    private JPanel createConfigPanel() {
        JPanel fields = new JPanel(new GridLayout(0, 2, 6, 6));
        fields.add(new JLabel("Thuật toán:"));
        fields.add(algorithmBox);
        fields.add(new JLabel("Số luồng (1 = tuần tự):"));
        fields.add(threadSpinner);
        fields.add(new JLabel("Thời gian (giây):"));
        fields.add(secondSpinner);
        fields.add(new JLabel("Seed:"));
        fields.add(seedField);
        algorithmBox.setSelectedItem(Algorithm.PORTFOLIO);
        algorithmBox.setToolTipText("<html>Leo đồi, Simulated Annealing, Tabu Search: 3 thuật toán thầy đề xuất, chọn riêng để so sánh.<br>"
                + "Kết hợp cả 3 (mặc định): mỗi luồng chạy một thuật toán, cuối cùng lấy lời giải tốt nhất.</html>");
        threadSpinner.setToolTipText("<html>Số luồng chạy song song, nên bằng số nhân CPU (tối đa 8 là đủ).<br>"
                + "Để 1 là chạy tuần tự, dùng khi muốn so sánh tuần tự với song song.</html>");
        secondSpinner.setToolTipText("Thời gian tìm kiếm: 10 giây là đủ cho kế hoạch khoảng 236 buổi, muốn kỹ hơn thì để 30 giây.");
        seedField.setToolTipText("<html>Số khởi đầu cho phần ngẫu nhiên của thuật toán. Giữ nguyên seed thì kết quả gần như lặp lại;<br>"
                + "đổi seed để thử thêm một phương án khác rồi chọn phương án tốt hơn.</html>");

        JPanel run = new JPanel(new GridLayout(0, 1, 6, 6));
        JPanel runButtons = new JPanel(new GridLayout(1, 2, 6, 6));
        runButtons.add(solveButton);
        runButtons.add(stopButton);
        run.add(runButtons);
        progressBar.setStringPainted(true);
        run.add(progressBar);

        JPanel form = new JPanel(new BorderLayout(6, 8));
        form.setBorder(Theme.titled("Cấu hình bộ giải"));
        form.add(fields, BorderLayout.CENTER);
        form.add(run, BorderLayout.SOUTH);

        JPanel actions = new JPanel(new GridLayout(0, 1, 6, 6));
        actions.setBorder(Theme.titled("Bản nháp"));
        actions.add(createButton("Đánh giá lại bản nháp", Theme.PRIMARY, e -> evaluateDraft()));
        actions.add(publishButton);
        actions.add(exportButton);
        actions.add(busyButton);

        JPanel status = new JPanel(new BorderLayout());
        status.setBorder(Theme.titled("Trạng thái"));
        progressLabel.setVerticalAlignment(JLabel.TOP);
        status.add(progressLabel, BorderLayout.CENTER);
        // đặt width để chữ tự xuống dòng trong cột 320 px
        JLabel scoreHelp = new JLabel("<html><div style='width:200px'><b>Điểm cứng</b> = số lỗi bắt buộc phải sửa "
                + "(trùng giờ GV, trùng lớp, trùng lịch bận); phải bằng 0 mới công bố được.<br><b>Điểm mềm</b> = mức "
                + "bất tiện cho GV (ca trống, ngày chỉ dạy 1 ca, số ngày lên trường...); càng nhỏ càng tốt.</div></html>");
        scoreHelp.setFont(Theme.SMALL);
        scoreHelp.setForeground(Theme.MUTED_TEXT);
        status.add(scoreHelp, BorderLayout.SOUTH);

        JPanel column = new JPanel(new BorderLayout(6, 6));
        column.add(form, BorderLayout.NORTH);
        column.add(status, BorderLayout.CENTER);
        column.add(actions, BorderLayout.SOUTH);
        column.setPreferredSize(new Dimension(320, 600));
        return column;
    }

    private JPanel createGridTab() {
        JPanel filters = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        filters.add(new JLabel("Chương trình:"));
        filters.add(programFilter);
        filters.add(new JLabel("Khóa:"));
        filters.add(cohortFilter);
        filters.add(new JLabel("Giảng viên:"));
        filters.add(teacherFilter);
        programFilter.addActionListener(e -> refreshGrid());
        cohortFilter.addActionListener(e -> refreshGrid());
        teacherFilter.addActionListener(e -> refreshGrid());

        JPanel legend = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 2));
        legend.add(new JLabel("Theo mẫu TKB của khoa (màu nền theo khóa, chữ xanh: MME, chữ đậm: CLC / Tiên tiến). Đánh dấu thêm:"));
        legend.add(Theme.legend("Viền đỏ: buổi đang vi phạm", Color.WHITE, Theme.CONFLICT_ACCENT));
        legend.add(Theme.legend("Nền vàng: giờ bận của GV đang lọc", Theme.BUSY_FILL, Theme.BUSY_ACCENT));

        JPanel top = new JPanel(new GridLayout(2, 1));
        top.add(filters);
        top.add(legend);

        // xếp chung hai hệ để GV dạy cả hai không bị trùng giờ, chỉ tách lúc hiển thị
        JTabbedPane grids = new JTabbedPane();
        grids.addTab("TKB IT + MME (hệ thường)", new JScrollPane(regularGrid));
        grids.addTab("TKB CLC / Tiên tiến", new JScrollPane(advancedGrid));

        JPanel panel = new JPanel(new BorderLayout());
        panel.add(top, BorderLayout.NORTH);
        panel.add(grids, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createListTab() {
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.add(new JScrollPane(draftTable), BorderLayout.CENTER);
        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        buttons.add(createButton("Sửa buổi đã chọn...", e -> editSelected()));
        buttons.add(createButton("Cố định / bỏ cố định", Theme.NEUTRAL, e -> toggleLock()));
        panel.add(buttons, BorderLayout.SOUTH);
        return panel;
    }

    private void startSolving() {
        Problem problem;
        SolverConfig config;
        try {
            problem = service.buildProblemForSolving(workspace());
            long seed = Long.parseLong(seedField.getText().trim());
            config = new SolverConfig((Algorithm) algorithmBox.getSelectedItem(), (Integer) threadSpinner.getValue(),
                    (Integer) secondSpinner.getValue() * 1000L, 0, seed);
        } catch (NumberFormatException e) {
            showError("Seed phải là số nguyên.");
            return;
        } catch (IllegalStateException | IllegalArgumentException e) {
            showError(e.getMessage());
            return;
        }
        ParallelSolver solver = new ParallelSolver();
        runningSolver = solver;
        runningLimitMillis = config.getTimeLimitMillis();
        setRunning(true);
        progressTimer.start();
        frame.setStatus("Đang xếp lịch: " + config);

        // giải trên luồng riêng cho giao diện khỏi đơ, xong thì invokeLater về luồng giao diện
        Thread coordinator = new Thread(() -> {
            try {
                SolverResult result = solver.solve(problem, config);
                SwingUtilities.invokeLater(() -> finishSolving(problem, result));
            } catch (InterruptedException | RuntimeException e) {
                SwingUtilities.invokeLater(() -> {
                    progressTimer.stop();
                    runningSolver = null;
                    setRunning(false);
                    showError("Lỗi khi xếp lịch: " + e.getMessage());
                });
            }
        }, "solver-coordinator");
        coordinator.start();
    }

    private void stopSolving() {
        if (runningSolver != null) {
            runningSolver.requestStop();
            progressLabel.setText("<html>Đang dừng các luồng...</html>");
        }
    }

    /** Timer gọi mỗi 0,3 giây, chạy trên luồng giao diện. */
    private void updateProgress() {
        if (runningSolver == null) {
            return;
        }
        long elapsed = runningSolver.getElapsedMillis();
        progressBar.setValue((int) Math.min(100, elapsed * 100 / Math.max(1, runningLimitMillis)));
        Score best = runningSolver.getCurrentBestScore();
        String bestText = best == null ? "đang tạo lời giải ban đầu..." : best.toString();
        progressLabel.setText("<html>Đã chạy: <b>" + (elapsed / 100) / 10.0 + " giây</b><br>"
                + "Tổng vòng lặp: " + runningSolver.getTotalIterations() + "<br>"
                + "Tốt nhất: <b>" + bestText + "</b><br>"
                + "Tìm bởi: " + runningSolver.getCurrentBestFoundBy() + "</html>");
    }

    private void finishSolving(Problem problem, SolverResult result) {
        progressTimer.stop();
        updateProgress();
        progressBar.setValue(100);
        runningSolver = null;
        setRunning(false);
        workspace().getDraft().clear();
        workspace().getDraft().addAll(service.toAssignments(problem, result.getBestSolution()));
        lastRunText = "=== LẦN CHẠY GẦN NHẤT ===\n" + result.describe() + "\n";
        frame.markChanged();
        evaluateDraft();
        frame.setStatus("Xếp lịch xong: " + result.getBestScore() + " trong " + result.getElapsedMillis() + " ms.");
    }

    private void setRunning(boolean running) {
        solveButton.setEnabled(!running);
        stopButton.setEnabled(running);
        publishButton.setEnabled(!running);
        exportButton.setEnabled(!running);
        busyButton.setEnabled(!running);
        draftTable.setEnabled(!running);
    }

    private void evaluateDraft() {
        if (workspace().getDraft().isEmpty()) {
            lastMetrics = null;
            reportArea.setText(lastRunText + "Chưa có bản nháp. Bấm \"Xếp lịch\" để tạo.");
        } else {
            lastMetrics = service.evaluate(workspace(), workspace().getDraft());
            reportArea.setText(lastRunText + lastMetrics.toReport());
            reportArea.setCaretPosition(0);
        }
        refresh();
    }

    private Assignment selectedAssignment() {
        int row = selectedModelRow(draftTable);
        if (row < 0) {
            showError("Chọn một buổi trong bảng trước.");
            return null;
        }
        return workspace().getDraft().get(row);
    }

    private void editSelected() {
        Assignment current = selectedAssignment();
        if (current == null) {
            return;
        }
        PlanSession session = workspace().findSession(current.getSessionId());
        List<String> candidates = new Convention(workspace().getRules()).candidatesFor(session);
        AssignmentDialog dialog = new AssignmentDialog(frame, session, current, candidates);
        Assignment updated = dialog.showDialog();
        if (updated != null) {
            service.replaceInDraft(workspace(), updated);
            frame.markChanged();
            evaluateDraft();
        }
    }

    private void toggleLock() {
        Assignment current = selectedAssignment();
        if (current == null) {
            return;
        }
        service.replaceInDraft(workspace(), current.withLocked(!current.isLocked()));
        dataChanged();
    }

    private void publish() {
        try {
            service.publish(workspace());
            dataChanged();
            showInfo("Đã công bố " + workspace().getPublished().size() + " buổi. Giảng viên đăng nhập để xem lịch.");
        } catch (IllegalStateException e) {
            showError(e.getMessage());
        }
    }

    private void exportExcel() {
        if (workspace().getDraft().isEmpty()) {
            showError("Chưa có bản nháp để xuất.");
            return;
        }
        if (lastMetrics == null) {
            // chưa đánh giá lần nào (vd vừa mở dự án) thì tính trước khi xuất
            evaluateDraft();
        }
        JFileChooser chooser = new JFileChooser(new File("."));
        chooser.setFileFilter(new FileNameExtensionFilter("File Excel (*.xlsx)", "xlsx"));
        chooser.setSelectedFile(new File("TKB_" + LocalDate.now() + ".xlsx"));
        if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) {
            return;
        }
        File file = chooser.getSelectedFile();
        // chép ra bản riêng để luồng nền không đọc Workspace lúc giao diện đang sửa
        Workspace snapshot = new Workspace();
        snapshot.getPlan().addAll(workspace().getPlan());
        List<Assignment> assignments = new ArrayList<>(workspace().getDraft());
        TimetableMetrics metrics = lastMetrics;
        String title = "Thời khóa biểu khoa CNTT (bản nháp) - xuất ngày " + LocalDate.now();
        frame.runInBackground("Xuất Excel", () -> {
            new ExcelExporter().export(file, snapshot, assignments, metrics, title);
            return file;
        }, saved -> showInfo("Đã xuất " + saved.getName()));
    }

    /** Tạo lại lịch bận giả lập, giữ nguyên lịch bận do giảng viên tự khai. */
    private void generateBusySlots() {
        long seed;
        try {
            seed = Long.parseLong(seedField.getText().trim());
        } catch (NumberFormatException e) {
            showError("Seed phải là số nguyên.");
            return;
        }
        List<BusySlot> all = workspace().getBusySlots();
        all.removeIf(slot -> slot.getPrivateNote().startsWith("[Giả lập"));
        List<BusySlot> generated = new BusySlotGenerator().generate(workspace().getTeachers(), 0.3, seed);
        all.addAll(generated);
        dataChanged();
        showInfo("Đã tạo " + generated.size() + " lịch bận giả lập (seed " + seed + ") cho khoảng 30% giảng viên.");
    }

    @Override
    public void refresh() {
        refreshFilters();
        refreshGrid();
        refreshDraftTable();
        refreshReceivedPlan();
        busyModel.setRowCount(0);
        for (BusySlot slot : workspace().getBusySlots()) {
            // giáo vụ không được xem ghi chú riêng của giảng viên
            busyModel.addRow(new Object[] {slot.getTeacherCode(), TimeSlots.dayName(slot.getDay()),
                "Ca " + (slot.getFromSlot() + 1) + " - " + (slot.getToSlot() + 1), slot.getPlace()});
        }
        if (runningSolver == null) {
            String sent = workspace().isPlanSent() ? "Kế hoạch đã nhận: " : "Chưa nhận kế hoạch từ trưởng khoa. Kế hoạch hiện có: ";
            progressLabel.setText("<html>" + sent + "<b>" + workspace().getPlan().size() + "</b> buổi<br>Bản nháp: <b>"
                    + workspace().getDraft().size() + "</b> buổi<br>Đã công bố: <b>" + workspace().getPublished().size()
                    + "</b> buổi</html>");
        }
    }

    /** Tab cho giáo vụ xem kế hoạch mà trưởng khoa đã gửi (chỉ đọc). */
    private JPanel createReceivedPlanTab() {
        receivedSubTabs.removeAll();

        // Sub-tab 1: Danh sách buổi trong kế hoạch
        JPanel planPanel = new JPanel(new BorderLayout(6, 6));

        JPanel planFilterRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        planFilterRow.add(new JLabel("Chương trình:"));
        planFilterRow.add(receivedProgramFilter);
        planFilterRow.add(new JLabel("Khóa:"));
        planFilterRow.add(receivedCohortFilter);
        planFilterRow.add(new JLabel("Loại buổi:"));
        planFilterRow.add(receivedKindFilter);
        planFilterRow.add(receivedPlanCountLabel);

        receivedProgramFilter.addActionListener(e -> refreshReceivedPlanTable());
        receivedCohortFilter.addActionListener(e -> refreshReceivedPlanTable());
        receivedKindFilter.addActionListener(e -> refreshReceivedPlanTable());

        planPanel.add(planFilterRow, BorderLayout.NORTH);
        planPanel.add(new JScrollPane(createTable(receivedPlanModel)), BorderLayout.CENTER);
        receivedSubTabs.addTab("Danh sách buổi (" + workspace().getPlan().size() + " buổi)", planPanel);

        // Sub-tab 2: Danh sách giảng viên
        JPanel teacherPanel = new JPanel(new BorderLayout(6, 6));
        teacherPanel.add(new JScrollPane(createTable(receivedTeacherModel)), BorderLayout.CENTER);
        receivedSubTabs.addTab("Giảng viên (" + workspace().getTeachers().size() + " GV)", teacherPanel);

        // Sub-tab 3: Quy ước phân công
        JPanel rulePanel = new JPanel(new BorderLayout(6, 6));
        JPanel ruleFilterRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        ruleFilterRow.add(new JLabel("Xem chương trình:"));
        ruleFilterRow.add(receivedRuleProgramFilter);
        ruleFilterRow.add(receivedRuleCountLabel);
        receivedRuleProgramFilter.addActionListener(e -> refreshReceivedRulesTable());

        rulePanel.add(ruleFilterRow, BorderLayout.NORTH);
        rulePanel.add(new JScrollPane(createTable(receivedRuleModel)), BorderLayout.CENTER);
        receivedSubTabs.addTab("Quy ước phân công (" + workspace().getRules().size() + " quy ước)", rulePanel);

        JPanel statusCard = new JPanel(new BorderLayout(8, 4));
        Theme.card(statusCard);

        JPanel textPanel = new JPanel(new GridLayout(2, 1, 4, 4));
        textPanel.setOpaque(false);
        receivedStatusLabel.setFont(Theme.BOLD);
        receivedValidationLabel.setFont(Theme.NORMAL);
        textPanel.add(receivedStatusLabel);
        textPanel.add(receivedValidationLabel);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 4));
        btnPanel.setOpaque(false);
        btnPanel.add(loadSamplePlanButton);

        statusCard.add(textPanel, BorderLayout.CENTER);
        statusCard.add(btnPanel, BorderLayout.EAST);

        JPanel wrapper = new JPanel(new BorderLayout(6, 6));
        wrapper.add(statusCard, BorderLayout.NORTH);
        wrapper.add(receivedSubTabs, BorderLayout.CENTER);
        return wrapper;
    }

    private void loadDefaultPlanSilently() {
        File file = new File(MainFrame.RESOURCES, "ke_hoach_mo_lop.csv");
        if (!file.exists()) {
            return;
        }
        try {
            List<PlanSession> loaded = new ArrayList<>();
            for (String[] row : CsvFile.read(file)) {
                String id = CsvFile.get(row, 0);
                String code = CsvFile.get(row, 1);
                String name = CsvFile.get(row, 2);
                String cohort = CsvFile.get(row, 3);
                String group = CsvFile.get(row, 4);
                SessionKind kind = SessionKind.valueOf(CsvFile.get(row, 5));
                int sv = Integer.parseInt(CsvFile.get(row, 6));
                loaded.add(new PlanSession(id, code, name, cohort, group, kind, sv));
            }
            workspace().replacePlan(loaded);
            workspace().setPlanSent(true);
        } catch (Exception ignored) {
        }
    }

    /** Nạp nhanh kế hoạch mẫu từ file CSV đã chuẩn hóa sẵn. */
    private void loadSamplePlan() {
        File file = new File(MainFrame.RESOURCES, "ke_hoach_mo_lop.csv");
        if (!file.exists()) {
            showError("Không tìm thấy file kế hoạch mẫu: " + file.getName());
            return;
        }
        try {
            List<PlanSession> loaded = new ArrayList<>();
            for (String[] row : CsvFile.read(file)) {
                String id = CsvFile.get(row, 0);
                String code = CsvFile.get(row, 1);
                String name = CsvFile.get(row, 2);
                String cohort = CsvFile.get(row, 3);
                String group = CsvFile.get(row, 4);
                SessionKind kind = SessionKind.valueOf(CsvFile.get(row, 5));
                int sv = Integer.parseInt(CsvFile.get(row, 6));
                loaded.add(new PlanSession(id, code, name, cohort, group, kind, sv));
            }
            workspace().replacePlan(loaded);
            workspace().setPlanSent(true);
            dataChanged();
            showInfo("Đã nạp kế hoạch mẫu " + loaded.size() + " buổi và xác nhận Trưởng khoa đã gửi.");
        } catch (Exception e) {
            showError("Lỗi đọc kế hoạch mẫu: " + e.getMessage());
        }
    }

    /** Nạp lại bảng kế hoạch từ trưởng khoa lên tab xem. */
    private void refreshReceivedPlan() {
        updatingReceivedFilters = true;

        // Cập nhật bộ lọc Sub-tab 1
        Object selProg = receivedProgramFilter.getSelectedItem();
        Object selCohort = receivedCohortFilter.getSelectedItem();
        Object selKind = receivedKindFilter.getSelectedItem();

        receivedProgramFilter.removeAllItems();
        receivedCohortFilter.removeAllItems();
        receivedKindFilter.removeAllItems();

        receivedProgramFilter.addItem(ALL);
        for (Program p : Program.values()) {
            receivedProgramFilter.addItem(p.getLabel());
        }

        receivedCohortFilter.addItem(ALL);
        Set<String> cohorts = new TreeSet<>();
        for (PlanSession session : workspace().getPlan()) {
            cohorts.add(session.getCohort());
        }
        for (String c : cohorts) {
            receivedCohortFilter.addItem(c);
        }

        receivedKindFilter.addItem(ALL);
        receivedKindFilter.addItem("Lec");
        receivedKindFilter.addItem("Tut");
        receivedKindFilter.addItem("4 tiết");
        receivedKindFilter.addItem("Lec+Tut");

        receivedProgramFilter.setSelectedItem(selProg == null ? ALL : selProg);
        receivedCohortFilter.setSelectedItem(selCohort == null ? ALL : selCohort);
        receivedKindFilter.setSelectedItem(selKind == null ? ALL : selKind);

        // Cập nhật bộ lọc Sub-tab 3 (Quy ước)
        Object selRuleProg = receivedRuleProgramFilter.getSelectedItem();
        receivedRuleProgramFilter.removeAllItems();
        receivedRuleProgramFilter.addItem(ALL);
        for (Program p : Program.values()) {
            receivedRuleProgramFilter.addItem(p.getLabel());
        }
        receivedRuleProgramFilter.setSelectedItem(selRuleProg == null ? ALL : selRuleProg);

        updatingReceivedFilters = false;

        // Tự động nạp kế hoạch mẫu nếu kế hoạch đang trống
        if (workspace().getPlan().isEmpty()) {
            loadDefaultPlanSilently();
        }

        // Cập nhật tiêu đề tab con
        if (receivedSubTabs.getTabCount() >= 3) {
            receivedSubTabs.setTitleAt(0, "Danh sách buổi (" + workspace().getPlan().size() + " buổi)");
            receivedSubTabs.setTitleAt(1, "Giảng viên (" + workspace().getTeachers().size() + " GV)");
            receivedSubTabs.setTitleAt(2, "Quy ước phân công (" + workspace().getRules().size() + " quy ước)");
        }
        loadSamplePlanButton.setVisible(!workspace().isPlanSent() || workspace().getPlan().isEmpty());

        // Trạng thái gửi từ trưởng khoa
        if (workspace().isPlanSent()) {
            receivedStatusLabel.setText("✔ Kế hoạch đã được Trưởng khoa gửi: "
                    + workspace().getPlan().size() + " buổi, "
                    + workspace().getTeachers().size() + " giảng viên, "
                    + workspace().getRules().size() + " quy ước phân công.");
            receivedStatusLabel.setForeground(Theme.SUCCESS);
        } else {
            receivedStatusLabel.setText("⏳ Trưởng khoa chưa bấm \"Gửi cho giáo vụ\". Kế hoạch hiện có "
                    + workspace().getPlan().size() + " buổi.");
            receivedStatusLabel.setForeground(Theme.WARNING);
        }

        // Kiểm tra tính hợp lệ với quy ước
        Convention convention = new Convention(workspace().getRules());
        List<String> problems = convention.checkPlan(workspace().getPlan(), workspace().getTeachers());
        if (problems.isEmpty()) {
            receivedValidationLabel.setText("✔ Kế hoạch hợp lệ: Mọi buổi học đều có đủ giảng viên phụ trách theo quy ước.");
            receivedValidationLabel.setForeground(Theme.SUCCESS);
        } else {
            receivedValidationLabel.setText("⚠️ Cảnh báo quy ước: Còn " + problems.size()
                    + " vấn đề (ví dụ buổi học chưa có GV phụ trách hoặc GV chưa có trong danh sách).");
            receivedValidationLabel.setForeground(Theme.DANGER);
        }

        refreshReceivedPlanTable();
        refreshReceivedTeachersTable();
        refreshReceivedRulesTable();
    }

    private void refreshReceivedPlanTable() {
        if (updatingReceivedFilters) {
            return;
        }
        String prog = (String) receivedProgramFilter.getSelectedItem();
        String cohort = (String) receivedCohortFilter.getSelectedItem();
        String kind = (String) receivedKindFilter.getSelectedItem();

        Convention convention = new Convention(workspace().getRules());
        receivedPlanModel.setRowCount(0);
        int count = 0;
        for (PlanSession session : workspace().getPlan()) {
            if (prog != null && !prog.equals(ALL) && !session.getProgram().getLabel().equals(prog)) {
                continue;
            }
            if (cohort != null && !cohort.equals(ALL) && !session.getCohort().equals(cohort)) {
                continue;
            }
            if (kind != null && !kind.equals(ALL) && !session.getKind().getLabel().equals(kind)) {
                continue;
            }
            count++;
            receivedPlanModel.addRow(new Object[]{
                    session.getId(), session.getCourseCode(), session.getCourseName(),
                    session.getProgram().getDisplayName(), session.getCohort(), session.getGroup(),
                    session.getKind().getLabel(), session.getStudentCount(), session.getSlotCount(),
                    String.join(", ", convention.candidatesFor(session))});
        }
        receivedPlanCountLabel.setText("   Hiển thị: " + count + " / " + workspace().getPlan().size() + " buổi");
    }

    private void refreshReceivedTeachersTable() {
        receivedTeacherModel.setRowCount(0);
        for (Teacher teacher : workspace().getTeachers()) {
            receivedTeacherModel.addRow(new Object[]{
                    teacher.getCode(), teacher.getFullName(),
                    teacher.getMaxSlotsPerDay(), teacher.getMaxSlotsPerWeek()});
        }
    }

    private void refreshReceivedRulesTable() {
        if (updatingReceivedFilters) {
            return;
        }
        String selected = (String) receivedRuleProgramFilter.getSelectedItem();
        receivedRuleModel.setRowCount(0);
        int count = 0;
        for (TeachingRule rule : workspace().getRules()) {
            Program program = rule.getProgram();
            boolean match = selected == null || selected.equals(ALL)
                    || (program != null && program.getLabel().equals(selected));
            if (match) {
                count++;
                receivedRuleModel.addRow(new Object[]{
                        rule.getProgram() == null ? "?" : rule.getProgram().getDisplayName(),
                        rule.getCourseCode(), rule.getCourseName(), rule.getTeacherCode(),
                        rule.isCanLecture() ? "✔" : "", rule.isCanTutorial() ? "✔" : ""});
            }
        }
        receivedRuleCountLabel.setText("   Hiển thị: " + count + " / " + workspace().getRules().size() + " dòng");
    }

    private void refreshFilters() {
        updatingFilters = true;
        Object program = programFilter.getSelectedItem();
        Object cohort = cohortFilter.getSelectedItem();
        Object teacher = teacherFilter.getSelectedItem();
        programFilter.removeAllItems();
        cohortFilter.removeAllItems();
        teacherFilter.removeAllItems();
        programFilter.addItem(ALL);
        for (Program p : Program.values()) {
            programFilter.addItem(p.getLabel());
        }
        cohortFilter.addItem(ALL);
        Set<String> cohorts = new TreeSet<>();
        for (PlanSession session : workspace().getPlan()) {
            cohorts.add(session.getCohort());
        }
        for (String c : cohorts) {
            cohortFilter.addItem(c);
        }
        teacherFilter.addItem(ALL);
        for (Teacher t : workspace().getTeachers()) {
            teacherFilter.addItem(t.getCode());
        }
        programFilter.setSelectedItem(program == null ? ALL : program);
        cohortFilter.setSelectedItem(cohort == null ? ALL : cohort);
        teacherFilter.setSelectedItem(teacher == null ? ALL : teacher);
        updatingFilters = false;
    }

    private void refreshGrid() {
        if (updatingFilters) {
            return;
        }
        String program = (String) programFilter.getSelectedItem();
        String cohort = (String) cohortFilter.getSelectedItem();
        String teacher = (String) teacherFilter.getSelectedItem();
        Set<String> badSessions = new HashSet<>();
        if (lastMetrics != null) {
            for (Violation violation : lastMetrics.getViolations()) {
                if (violation.isHard()) {
                    badSessions.addAll(violation.getSessionIds());
                }
            }
        }
        List<Assignment> shown = new ArrayList<>();
        for (Assignment assignment : workspace().getDraft()) {
            PlanSession session = workspace().findSession(assignment.getSessionId());
            if (session != null && matches(session, assignment, program, cohort, teacher)) {
                shown.add(assignment);
            }
        }
        List<BusySlot> busy = new ArrayList<>();
        if (teacher != null && !teacher.equals(ALL)) {
            busy = workspace().getBusySlotsOf(teacher);
        }
        String empty = workspace().getDraft().isEmpty() ? "Chưa có bản nháp. Bấm \"Xếp lịch\" để tạo."
                : "Không có buổi nào khớp bộ lọc.";
        regularGrid.setData(new TimetableTemplate(workspace(), shown, TimetableTemplate.REGULAR), badSessions, busy, empty);
        advancedGrid.setData(new TimetableTemplate(workspace(), shown, TimetableTemplate.ADVANCED), badSessions, busy, empty);
    }

    private boolean matches(PlanSession session, Assignment assignment, String program, String cohort, String teacher) {
        if (program != null && !program.equals(ALL) && !session.getProgram().getLabel().equals(program)) {
            return false;
        }
        if (cohort != null && !cohort.equals(ALL) && !session.getCohort().equals(cohort)) {
            return false;
        }
        return teacher == null || teacher.equals(ALL) || assignment.getTeacherCode().equalsIgnoreCase(teacher);
    }

    private void refreshDraftTable() {
        draftModel.setRowCount(0);
        for (Assignment assignment : workspace().getDraft()) {
            PlanSession session = workspace().findSession(assignment.getSessionId());
            if (session == null) {
                // vẫn thêm dòng để dòng i của bảng ứng với phần tử i của bản nháp
                draftModel.addRow(new Object[] {assignment.getSessionId(), "?", "", "", "", "", "",
                    assignment.getTeacherCode(), "", ""});
                continue;
            }
            draftModel.addRow(new Object[] {session.getId(), session.getCourseCode(), session.getCourseName(),
                session.getKind().getLabel(), session.getProgram().getDisplayName(), session.getCohort(),
                session.getGroup(), assignment.getTeacherCode(),
                TimeSlots.describe(assignment.getDay(), assignment.getStartSlot(), session.getSlotCount()),
                assignment.isLocked() ? "Có" : ""});
        }
    }
}
