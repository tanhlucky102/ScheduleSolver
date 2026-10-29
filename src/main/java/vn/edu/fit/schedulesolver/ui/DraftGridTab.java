package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTabbedPane;
import vn.edu.fit.schedulesolver.io.TimetableTemplate;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Program;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.solver.TimetableMetrics;
import vn.edu.fit.schedulesolver.solver.Violation;

/** Tab lưới TKB nháp của giáo vụ: lọc theo chương trình, khóa, giảng viên rồi vẽ 2 lưới theo mẫu của khoa. */
public class DraftGridTab extends BasePanel {
    private static final String ALL = "Tất cả";

    // 2 lưới riêng: hệ thường (IT, MME) và hệ CLC, Tiên tiến
    private final TemplateGridPanel regularGrid = new TemplateGridPanel();
    private final TemplateGridPanel advancedGrid = new TemplateGridPanel();
    private final JComboBox<String> programFilter = new JComboBox<>();
    private final JComboBox<String> cohortFilter = new JComboBox<>();
    private final JComboBox<String> teacherFilter = new JComboBox<>();
    // tránh vẽ lại lưới nhiều lần khi đang nạp lại ô lọc
    private boolean updatingFilters;
    // buổi đang vi phạm cứng theo lần đánh giá gần nhất, tô viền đỏ
    private final Set<String> badSessions = new HashSet<>();

    public DraftGridTab(MainFrame frame) {
        super(frame);
        useTabLayout();
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

        // tách 2 dòng để cửa sổ hẹp không che mất phần chú thích
        JLabel template = new JLabel("  Theo mẫu TKB của khoa: màu nền theo khóa, chữ xanh là MME, chữ đậm là CLC / Tiên tiến.");
        template.setForeground(Theme.MUTED_TEXT);
        JPanel legend = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 2));
        legend.add(new JLabel("Đánh dấu thêm:"));
        legend.add(Theme.legend("Viền đỏ: buổi đang vi phạm", Color.WHITE, Theme.CONFLICT_ACCENT));
        legend.add(Theme.legend("Nền vàng: giờ bận của GV đang lọc", Theme.BUSY_FILL, Theme.BUSY_ACCENT));

        JPanel top = new JPanel(new GridLayout(3, 1));
        top.add(filters);
        top.add(template);
        top.add(legend);

        // xếp chung hai hệ để GV dạy cả hai không bị trùng giờ, chỉ tách lúc hiển thị
        JTabbedPane grids = new JTabbedPane();
        grids.addTab("TKB IT + MME (hệ thường)", new JScrollPane(regularGrid));
        grids.addTab("TKB CLC / Tiên tiến", new JScrollPane(advancedGrid));

        add(top, BorderLayout.NORTH);
        add(grids, BorderLayout.CENTER);
    }

    /** Lấy các buổi vi phạm cứng từ lần đánh giá mới nhất; null là chưa đánh giá. */
    public void setMetrics(TimetableMetrics metrics) {
        badSessions.clear();
        if (metrics == null) {
            return;
        }
        for (Violation violation : metrics.getViolations()) {
            if (violation.isHard()) {
                badSessions.addAll(violation.getSessionIds());
            }
        }
    }

    @Override
    public void refresh() {
        refreshFilters();
        refreshGrid();
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
        List<Assignment> shown = new ArrayList<>();
        for (Assignment assignment : workspace().getDraft()) {
            PlanSession session = workspace().findSession(assignment.getSessionId());
            if (session != null && matches(session, assignment, program, cohort, teacher)) {
                shown.add(assignment);
            }
        }
        List<BusySlot> busy = new ArrayList<>();
        if (teacher != null && !teacher.equals(ALL)) {
            busy = workspace().getAllBusySlotsOf(teacher);
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
}
