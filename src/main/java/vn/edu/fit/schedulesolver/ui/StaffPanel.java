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
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import javax.swing.Box;
import javax.swing.BoxLayout;
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
import javax.swing.JSplitPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.RowFilter;
import javax.swing.SpinnerNumberModel;
import javax.swing.SwingUtilities;
import javax.swing.Timer;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableRowSorter;
import vn.edu.fit.schedulesolver.io.ExcelExporter;
import vn.edu.fit.schedulesolver.io.TimetableTemplate;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
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

/**
 * Màn hình Giáo vụ: xếp lịch bằng bộ giải song song, xem và sửa TKB nháp, công
 * bố và xuất Excel.
 */
public class StaffPanel extends BasePanel {
    private static final String ALL = "Tất cả";
    private static final int CONFIG_PANEL_MAX_WIDTH = 320;
    private static final int TAB_CONTENT_MIN_WIDTH = 100;

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
    private final JTextField draftCourseCodeSearch = new JTextField(12);
    private final JTextField draftCourseNameSearch = new JTextField(12);
    private final JTextField draftTeacherSearch = new JTextField(12);
    private final JComboBox<String> draftKindFilter = new JComboBox<>();
    private final JComboBox<String> draftProgramFilter = new JComboBox<>();
    private final JComboBox<String> draftCohortFilter = new JComboBox<>();
    private final TableRowSorter<DefaultTableModel> draftSorter = new TableRowSorter<>(draftModel);
    private boolean updatingDraftFilters;
    private final JTextArea reportArea = new JTextArea();
    private final DefaultTableModel busyModel = readOnlyModel("Giảng viên", "Thứ", "Ca", "Nơi bận");
    private final JTable busyTable = createTable(busyModel);
    private final JTextField busyTeacherSearchField = new JTextField(14);
    private final JComboBox<String> busyDayFilter = new JComboBox<>();
    private final JComboBox<String> busySlotFilter = new JComboBox<>();
    private final TableRowSorter<DefaultTableModel> busySorter = new TableRowSorter<>(busyModel);
    private final List<BusySlot> shownBusySlots = new ArrayList<>();
    private boolean updatingBusyFilters;

    private final PlanViewTab planViewTab;

    private ParallelSolver runningSolver;
    private long runningLimitMillis;
    private String lastRunText = "";
    private TimetableMetrics lastMetrics;

    public StaffPanel(MainFrame frame) {
        super(frame);
        this.planViewTab = new PlanViewTab(frame);
        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("Kế hoạch từ trưởng khoa", planViewTab);
        tabs.addTab("Lưới TKB nháp", createGridTab());
        tabs.addTab("Danh sách buổi", createListTab());
        reportArea.setEditable(false);
        reportArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        tabs.addTab("Đánh giá (Verify + metrics)", new JScrollPane(reportArea));
        tabs.addTab("Lịch bận giảng viên chia sẻ", createBusyTab());
        tabs.setMinimumSize(new Dimension(TAB_CONTENT_MIN_WIDTH, 0));
        JSplitPane content = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, createConfigPanel(), tabs);
        content.setResizeWeight(0.0);
        content.setContinuousLayout(true);
        content.setOneTouchExpandable(false);
        content.setDividerSize(10);
        content.getLeftComponent().setMinimumSize(new Dimension(10, 0));
        content.getRightComponent().setMinimumSize(new Dimension(TAB_CONTENT_MIN_WIDTH, 0));
        content.addPropertyChangeListener(JSplitPane.DIVIDER_LOCATION_PROPERTY, event -> {
            int location = (Integer) event.getNewValue();
            if (location > CONFIG_PANEL_MAX_WIDTH) {
                content.setDividerLocation(CONFIG_PANEL_MAX_WIDTH);
            }
        });
        content.setDividerLocation(CONFIG_PANEL_MAX_WIDTH);
        add(content, BorderLayout.CENTER);
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
        algorithmBox.setToolTipText(
                "<html>Leo đồi, Simulated Annealing, Tabu Search: 3 thuật toán thầy đề xuất, chọn riêng để so sánh.<br>"
                        + "Kết hợp cả 3 (mặc định): mỗi luồng chạy một thuật toán, cuối cùng lấy lời giải tốt nhất.</html>");
        threadSpinner.setToolTipText("<html>Số luồng chạy song song, nên bằng số nhân CPU (tối đa 8 là đủ).<br>"
                + "Để 1 là chạy tuần tự, dùng khi muốn so sánh tuần tự với song song.</html>");
        secondSpinner.setToolTipText(
                "Thời gian tìm kiếm: 10 giây là đủ cho kế hoạch khoảng 236 buổi, muốn kỹ hơn thì để 30 giây.");
        seedField.setToolTipText(
                "<html>Số khởi đầu cho phần ngẫu nhiên của thuật toán. Giữ nguyên seed thì kết quả gần như lặp lại;<br>"
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
        legend.add(new JLabel(
                "Theo mẫu TKB của khoa (màu nền theo khóa, chữ xanh: MME, chữ đậm: CLC / Tiên tiến). Đánh dấu thêm:"));
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
        JPanel filters = new JPanel();
        filters.setLayout(new BoxLayout(filters, BoxLayout.X_AXIS));
        addDraftFilter(filters, "Mã môn:", draftCourseCodeSearch, 130);
        addDraftFilter(filters, "Tên môn:", draftCourseNameSearch, 140);
        addDraftFilter(filters, "Giảng viên:", draftTeacherSearch, 130);
        addDraftFilter(filters, "Loại:", draftKindFilter, 95);
        addDraftFilter(filters, "Chương trình:", draftProgramFilter, 150);
        addDraftFilter(filters, "Khóa:", draftCohortFilter, 85);
        draftTable.setRowSorter(draftSorter);
        addDraftSearchListener(draftCourseCodeSearch);
        addDraftSearchListener(draftCourseNameSearch);
        addDraftSearchListener(draftTeacherSearch);
        draftKindFilter.addActionListener(e -> refreshDraftFilter());
        draftProgramFilter.addActionListener(e -> refreshDraftFilter());
        draftCohortFilter.addActionListener(e -> refreshDraftFilter());
        JScrollPane filterScroll = new JScrollPane(filters, JScrollPane.VERTICAL_SCROLLBAR_NEVER,
                JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);
        filterScroll.setPreferredSize(new Dimension(0, 48));
        panel.add(filterScroll, BorderLayout.NORTH);
        panel.add(new JScrollPane(draftTable), BorderLayout.CENTER);
        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        buttons.add(createButton("Sửa buổi đã chọn...", e -> editSelected()));
        buttons.add(createButton("Cố định / bỏ cố định", Theme.NEUTRAL, e -> toggleLock()));
        panel.add(buttons, BorderLayout.SOUTH);
        return panel;
    }

    private void addDraftFilter(JPanel panel, String label, JTextField field, int width) {
        addDraftFilterLabel(panel, label);
        field.setPreferredSize(new Dimension(width, field.getPreferredSize().height));
        panel.add(field);
        panel.add(Box.createHorizontalStrut(8));
    }

    private void addDraftFilter(JPanel panel, String label, JComboBox<String> filter, int width) {
        addDraftFilterLabel(panel, label);
        filter.setPreferredSize(new Dimension(width, filter.getPreferredSize().height));
        panel.add(filter);
        panel.add(Box.createHorizontalStrut(8));
    }

    private void addDraftFilterLabel(JPanel panel, String label) {
        panel.add(new JLabel(label));
        panel.add(Box.createHorizontalStrut(4));
    }

    private void addDraftSearchListener(JTextField field) {
        field.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent event) {
                refreshDraftFilter();
            }

            @Override
            public void removeUpdate(DocumentEvent event) {
                refreshDraftFilter();
            }

            @Override
            public void changedUpdate(DocumentEvent event) {
                refreshDraftFilter();
            }
        });
    }

    private JPanel createBusyTab() {
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        JPanel filters = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        filters.add(new JLabel("Giảng viên:"));
        filters.add(busyTeacherSearchField);
        filters.add(new JLabel("Thứ:"));
        filters.add(busyDayFilter);
        filters.add(new JLabel("Ca:"));
        filters.add(busySlotFilter);
        busyTable.setRowSorter(busySorter);
        busyTeacherSearchField.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent event) {
                refreshBusyFilter();
            }

            @Override
            public void removeUpdate(DocumentEvent event) {
                refreshBusyFilter();
            }

            @Override
            public void changedUpdate(DocumentEvent event) {
                refreshBusyFilter();
            }
        });
        busyDayFilter.addActionListener(e -> refreshBusyFilter());
        busySlotFilter.addActionListener(e -> refreshBusyFilter());
        panel.add(filters, BorderLayout.NORTH);
        panel.add(new JScrollPane(busyTable), BorderLayout.CENTER);
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

        // giải trên luồng riêng cho giao diện khỏi đơ, xong thì invokeLater về luồng
        // giao diện
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
        refreshDraftDropdowns();
        planViewTab.refresh();
        busyModel.setRowCount(0);
        shownBusySlots.clear();
        for (BusySlot slot : workspace().getBusySlots()) {
            // giáo vụ không được xem ghi chú riêng của giảng viên
            shownBusySlots.add(slot);
            busyModel.addRow(new Object[] { slot.getTeacherCode(), TimeSlots.dayName(slot.getDay()),
                    "Ca " + (slot.getFromSlot() + 1) + " - " + (slot.getToSlot() + 1), slot.getPlace() });
        }
        refreshBusyDropdowns();
        refreshBusyFilter();
        if (runningSolver == null) {
            String sent = workspace().isPlanSent() ? "Kế hoạch đã nhận: "
                    : "Chưa nhận kế hoạch từ trưởng khoa. Kế hoạch hiện có: ";
            progressLabel.setText("<html>" + sent + "<b>" + workspace().getPlan().size() + "</b> buổi<br>Bản nháp: <b>"
                    + workspace().getDraft().size() + "</b> buổi<br>Đã công bố: <b>" + workspace().getPublished().size()
                    + "</b> buổi</html>");
        }
    }

    private void refreshBusyDropdowns() {
        String selectedDay = (String) busyDayFilter.getSelectedItem();
        String selectedSlot = (String) busySlotFilter.getSelectedItem();
        updatingBusyFilters = true;
        busyDayFilter.removeAllItems();
        busySlotFilter.removeAllItems();
        busyDayFilter.addItem(ALL);
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            busyDayFilter.addItem(TimeSlots.dayName(day));
        }
        busySlotFilter.addItem(ALL);
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            busySlotFilter.addItem(TimeSlots.slotName(slot));
        }
        busyDayFilter.setSelectedItem(selectedDay == null ? ALL : selectedDay);
        busySlotFilter.setSelectedItem(selectedSlot == null ? ALL : selectedSlot);
        updatingBusyFilters = false;
    }

    private void refreshBusyFilter() {
        if (updatingBusyFilters) {
            return;
        }
        String teacherQuery = busyTeacherSearchField.getText().trim().toLowerCase(Locale.ROOT);
        String day = (String) busyDayFilter.getSelectedItem();
        int selectedSlot = busySlotFilter.getSelectedIndex() - 1;
        busySorter.setRowFilter(new RowFilter<DefaultTableModel, Integer>() {
            @Override
            public boolean include(Entry<? extends DefaultTableModel, ? extends Integer> entry) {
                BusySlot slot = shownBusySlots.get(entry.getIdentifier());
                Teacher teacher = workspace().findTeacher(slot.getTeacherCode());
                boolean matchesTeacher = slot.getTeacherCode().toLowerCase(Locale.ROOT).contains(teacherQuery)
                        || (teacher != null
                                && teacher.getFullName().toLowerCase(Locale.ROOT).contains(teacherQuery));
                boolean matchesDay = day == null || day.equals(ALL) || day.equals(TimeSlots.dayName(slot.getDay()));
                boolean matchesSlot = selectedSlot < 0
                        || selectedSlot >= slot.getFromSlot() && selectedSlot <= slot.getToSlot();
                return matchesTeacher && matchesDay && matchesSlot;
            }
        });
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
        regularGrid.setData(new TimetableTemplate(workspace(), shown, TimetableTemplate.REGULAR), badSessions, busy,
                empty);
        advancedGrid.setData(new TimetableTemplate(workspace(), shown, TimetableTemplate.ADVANCED), badSessions, busy,
                empty);
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

    private void refreshDraftDropdowns() {
        String selectedKind = (String) draftKindFilter.getSelectedItem();
        String selectedProgram = (String) draftProgramFilter.getSelectedItem();
        String selectedCohort = (String) draftCohortFilter.getSelectedItem();
        updatingDraftFilters = true;
        draftKindFilter.removeAllItems();
        draftProgramFilter.removeAllItems();
        draftCohortFilter.removeAllItems();
        draftKindFilter.addItem(ALL);
        for (SessionKind kind : SessionKind.values()) {
            draftKindFilter.addItem(kind.getLabel());
        }
        draftProgramFilter.addItem(ALL);
        for (Program program : Program.values()) {
            draftProgramFilter.addItem(program.getDisplayName());
        }
        draftCohortFilter.addItem(ALL);
        Set<String> cohorts = new TreeSet<>();
        for (PlanSession session : workspace().getPlan()) {
            cohorts.add(session.getCohort());
        }
        for (String cohort : cohorts) {
            draftCohortFilter.addItem(cohort);
        }
        draftKindFilter.setSelectedItem(selectedKind == null ? ALL : selectedKind);
        draftProgramFilter.setSelectedItem(selectedProgram == null ? ALL : selectedProgram);
        draftCohortFilter.setSelectedItem(
                selectedCohort != null && cohorts.contains(selectedCohort) ? selectedCohort : ALL);
        updatingDraftFilters = false;
        refreshDraftFilter();
    }

    private void refreshDraftFilter() {
        if (updatingDraftFilters) {
            return;
        }
        String courseCode = draftCourseCodeSearch.getText().trim().toLowerCase(Locale.ROOT);
        String courseName = draftCourseNameSearch.getText().trim().toLowerCase(Locale.ROOT);
        String teacherQuery = draftTeacherSearch.getText().trim().toLowerCase(Locale.ROOT);
        String kind = (String) draftKindFilter.getSelectedItem();
        String program = (String) draftProgramFilter.getSelectedItem();
        String cohort = (String) draftCohortFilter.getSelectedItem();
        draftSorter.setRowFilter(new RowFilter<DefaultTableModel, Integer>() {
            @Override
            public boolean include(Entry<? extends DefaultTableModel, ? extends Integer> entry) {
                String teacherCode = entry.getStringValue(7);
                Teacher teacher = workspace().findTeacher(teacherCode);
                boolean matchesTeacher = teacherCode.toLowerCase(Locale.ROOT).contains(teacherQuery)
                        || (teacher != null
                                && teacher.getFullName().toLowerCase(Locale.ROOT).contains(teacherQuery));
                return entry.getStringValue(1).toLowerCase(Locale.ROOT).contains(courseCode)
                        && entry.getStringValue(2).toLowerCase(Locale.ROOT).contains(courseName)
                        && matchesTeacher
                        && (kind == null || kind.equals(ALL) || kind.equals(entry.getStringValue(3)))
                        && (program == null || program.equals(ALL) || program.equals(entry.getStringValue(4)))
                        && (cohort == null || cohort.equals(ALL) || cohort.equals(entry.getStringValue(5)));
            }
        });
    }

    private void refreshDraftTable() {
        draftModel.setRowCount(0);
        for (Assignment assignment : workspace().getDraft()) {
            PlanSession session = workspace().findSession(assignment.getSessionId());
            if (session == null) {
                // vẫn thêm dòng để dòng i của bảng ứng với phần tử i của bản nháp
                draftModel.addRow(new Object[] { assignment.getSessionId(), "?", "", "", "", "", "",
                        assignment.getTeacherCode(), "", "" });
                continue;
            }
            draftModel.addRow(new Object[] { session.getId(), session.getCourseCode(), session.getCourseName(),
                    session.getKind().getLabel(), session.getProgram().getDisplayName(), session.getCohort(),
                    session.getGroup(), assignment.getTeacherCode(),
                    TimeSlots.describe(assignment.getDay(), assignment.getStartSlot(), session.getSlotCount()),
                    assignment.isLocked() ? "Có" : "" });
        }
    }

    public PlanViewTab getPlanViewTab() {
        return planViewTab;
    }
}
