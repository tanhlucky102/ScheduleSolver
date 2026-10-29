package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GridLayout;
import java.awt.Insets;
import java.io.File;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JSplitPane;
import javax.swing.JTabbedPane;
import javax.swing.JTextArea;
import javax.swing.SwingUtilities;
import javax.swing.Timer;
import javax.swing.filechooser.FileNameExtensionFilter;
import vn.edu.fit.schedulesolver.io.ExcelExporter;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.service.BusySlotGenerator;
import vn.edu.fit.schedulesolver.service.ScheduleService;
import vn.edu.fit.schedulesolver.solver.ParallelSolver;
import vn.edu.fit.schedulesolver.solver.Problem;
import vn.edu.fit.schedulesolver.solver.Score;
import vn.edu.fit.schedulesolver.solver.SolverConfig;
import vn.edu.fit.schedulesolver.solver.SolverResult;
import vn.edu.fit.schedulesolver.solver.TimetableMetrics;

/**
 * Màn hình Giáo vụ: xếp lịch bằng bộ giải song song, xem và sửa TKB nháp, công bố và xuất Excel.
 * Bên trái là cột cấu hình, bên phải 5 tab, mỗi tab là một lớp riêng.
 */
public class StaffPanel extends BasePanel {
    private static final int CONFIG_WIDTH = 330;
    private static final int TAB_CONTENT_MIN_WIDTH = 100;

    private final ScheduleService service = new ScheduleService();

    private final SolverSettingsPanel settings = new SolverSettingsPanel();
    private final JButton solveButton = createButton("Xếp lịch", e -> startSolving());
    private final JButton stopButton = createButton("Dừng", Theme.DANGER, e -> stopSolving());
    private final JButton publishButton = createButton("Công bố cho giảng viên", Theme.SUCCESS, e -> publish());
    private final JButton exportButton = createButton("Xuất Excel...", Theme.NEUTRAL, e -> exportExcel());
    private final JButton busyButton = createButton("Tạo lịch bận giả lập", Theme.WARNING, e -> generateBusySlots());
    private final JProgressBar progressBar = new JProgressBar(0, 100);
    private final JLabel progressLabel = new JLabel("Chưa chạy.");
    private final Timer progressTimer = new Timer(300, e -> updateProgress());

    private final PlanViewTab planViewTab;
    private final DraftGridTab gridTab;
    private final DraftListTab listTab;
    private final JTextArea reportArea = new JTextArea();
    private final SharedBusyTab busyTab;

    private ParallelSolver runningSolver;
    private SolverConfig runningConfig;
    private String lastRunText = "";
    private TimetableMetrics lastMetrics;

    public StaffPanel(MainFrame frame) {
        super(frame);
        // cột cấu hình đặt trong khung cuộn: cửa sổ thấp thì cuộn xuống chứ không bị đè chữ
        JScrollPane config = new JScrollPane(createConfigPanel(), JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED,
                JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        config.setBorder(null);
        config.getVerticalScrollBar().setUnitIncrement(16);
        int configWidth = CONFIG_WIDTH + config.getVerticalScrollBar().getPreferredSize().width;
        config.setPreferredSize(new Dimension(configWidth, 10));

        planViewTab = new PlanViewTab(frame);
        gridTab = new DraftGridTab(frame);
        listTab = new DraftListTab(frame, this::evaluateDraft);
        busyTab = new SharedBusyTab(frame);
        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("Kế hoạch từ trưởng khoa", planViewTab);
        tabs.addTab("Lưới TKB nháp", gridTab);
        tabs.addTab("Danh sách buổi", listTab);
        reportArea.setEditable(false);
        reportArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        reportArea.setMargin(new Insets(8, 10, 8, 10));
        tabs.addTab("Đánh giá (Verify + metrics)", new JScrollPane(reportArea));
        tabs.addTab("Lịch bận GV chia sẻ (gồm giờ dạy trường khác)", busyTab);
        tabs.setMinimumSize(new Dimension(TAB_CONTENT_MIN_WIDTH, 0));
        // kéo vạch chia để thu hẹp cột cấu hình, nhưng không cho rộng hơn chỗ cột cần
        JSplitPane content = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, config, tabs);
        content.setResizeWeight(0.0);
        content.setContinuousLayout(true);
        content.setOneTouchExpandable(false);
        content.setDividerSize(10);
        content.getLeftComponent().setMinimumSize(new Dimension(10, 0));
        content.getRightComponent().setMinimumSize(new Dimension(TAB_CONTENT_MIN_WIDTH, 0));
        content.addPropertyChangeListener(JSplitPane.DIVIDER_LOCATION_PROPERTY, event -> {
            int location = (Integer) event.getNewValue();
            if (location > configWidth) {
                content.setDividerLocation(configWidth);
            }
        });
        content.setDividerLocation(configWidth);
        add(content, BorderLayout.CENTER);
        stopButton.setEnabled(false);
    }

    private JPanel createConfigPanel() {
        JPanel run = new JPanel(new GridLayout(0, 1, 6, 6));
        JPanel runButtons = new JPanel(new GridLayout(1, 2, 6, 6));
        runButtons.add(solveButton);
        runButtons.add(stopButton);
        run.add(runButtons);
        progressBar.setStringPainted(true);
        run.add(progressBar);

        JPanel form = new JPanel(new BorderLayout(6, 8));
        form.setBorder(Theme.titled("Cấu hình bộ giải"));
        form.add(settings, BorderLayout.CENTER);
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
        // đặt width để chữ tự xuống dòng trong cột cấu hình
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
        return column;
    }

    private void startSolving() {
        Problem problem;
        SolverConfig config;
        try {
            problem = service.buildProblemForSolving(workspace());
            config = settings.createConfig();
        } catch (NumberFormatException e) {
            showError("Seed phải là số nguyên.");
            return;
        } catch (IllegalStateException | IllegalArgumentException e) {
            showError(e.getMessage());
            return;
        }
        ParallelSolver solver = new ParallelSolver();
        runningSolver = solver;
        runningConfig = config;
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
        if (runningConfig.isDeterministic()) {
            long total = Math.max(1, runningSolver.getIterationBudget());
            progressBar.setValue((int) Math.min(100, runningSolver.getTotalIterations() * 100 / total));
        } else {
            progressBar.setValue((int) Math.min(100, elapsed * 100 / Math.max(1, runningConfig.getTimeLimitMillis())));
        }
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
        frame.setStatus("Xếp lịch xong: " + result.getBestScore() + " trong " + result.getElapsedMillis()
                + " ms. Mã kiểm tra kết quả: " + result.getFingerprint());
    }

    private void setRunning(boolean running) {
        solveButton.setEnabled(!running);
        stopButton.setEnabled(running);
        publishButton.setEnabled(!running);
        exportButton.setEnabled(!running);
        busyButton.setEnabled(!running);
        listTab.setTableEnabled(!running);
        settings.setRunning(running);
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
        gridTab.setMetrics(lastMetrics);
        refresh();
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
            seed = settings.getSeed();
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
        planViewTab.refresh();
        gridTab.refresh();
        listTab.refresh();
        busyTab.refresh();
        if (runningSolver == null) {
            String sent = workspace().isPlanSent() ? "Kế hoạch đã nhận: " : "Chưa nhận kế hoạch từ trưởng khoa. Kế hoạch hiện có: ";
            progressLabel.setText("<html>" + sent + "<b>" + workspace().getPlan().size() + "</b> buổi<br>Bản nháp: <b>"
                    + workspace().getDraft().size() + "</b> buổi<br>Đã công bố: <b>" + workspace().getPublished().size()
                    + "</b> buổi</html>");
        }
    }

    public PlanViewTab getPlanViewTab() {
        return planViewTab;
    }
}
