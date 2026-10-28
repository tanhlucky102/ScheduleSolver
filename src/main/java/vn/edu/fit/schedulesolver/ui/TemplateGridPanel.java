package vn.edu.fit.schedulesolver.ui;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.swing.JPanel;
import javax.swing.JViewport;
import vn.edu.fit.schedulesolver.io.TimetableTemplate;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/**
 * Lưới TKB nháp của Giáo vụ, vẽ giống mẫu Excel của khoa (vị trí ô lấy từ TimetableTemplate).
 * Viền đỏ là buổi đang vi phạm, nền vàng là giờ bận của giảng viên đang lọc.
 */
public class TemplateGridPanel extends JPanel {
    private static final int BLOCK_WIDTH = 26;
    private static final int PART_WIDTH = 26;
    private static final int TIME_WIDTH = 92;
    private static final int PERIOD_WIDTH = 36;
    private static final int MIN_DAY_WIDTH = 134;
    private static final float MIN_FONT_SIZE = 9f;
    private static final int TITLE_HEIGHT = 56;
    private static final int ROW_HEIGHT = 40;
    private static final int DAYS = 6;
    // bên trái cột ngày có 3 cột: khối, buổi, giờ
    private static final int DAYS_LEFT = BLOCK_WIDTH + PART_WIDTH + TIME_WIDTH;
    private static final Color LINE = new Color(140, 140, 140);
    private static final Color MME_TEXT = new Color(TimetableTemplate.MME_TEXT_COLOR);

    private TimetableTemplate template;
    private Set<String> badSessions = new HashSet<>();
    private List<BusySlot> busySlots = new ArrayList<>();
    private String emptyMessage = "";
    // các ô đã vẽ, dùng cho tooltip
    private final List<Rectangle> boxes = new ArrayList<>();
    private final List<String> boxDetails = new ArrayList<>();

    public TemplateGridPanel() {
        setBackground(Color.WHITE);
        setToolTipText("");
    }

    public void setData(TimetableTemplate newTemplate, Set<String> newBadSessions, List<BusySlot> newBusySlots,
                        String messageWhenEmpty) {
        template = newTemplate;
        badSessions = new HashSet<>(newBadSessions);
        busySlots = new ArrayList<>(newBusySlots);
        emptyMessage = messageWhenEmpty;
        revalidate();
        repaint();
    }

    @Override
    public Dimension getPreferredSize() {
        int width = DAYS_LEFT + DAYS * MIN_DAY_WIDTH + PERIOD_WIDTH;
        if (getParent() instanceof JViewport) {
            width = Math.max(width, getParent().getWidth() - 1);
        }
        int height = TITLE_HEIGHT + 2 * ROW_HEIGHT;
        if (template != null) {
            for (int block : template.getBlocks()) {
                height += template.getBlockRowCount(block) * ROW_HEIGHT;
            }
        }
        return new Dimension(width + 1, height + 1);
    }

    private int dayWidth() {
        return Math.max(MIN_DAY_WIDTH, (getWidth() - DAYS_LEFT - PERIOD_WIDTH - 1) / DAYS);
    }

    private int dayX(int dayIndex, int dayWidth) {
        return DAYS_LEFT + dayIndex * dayWidth;
    }

    @Override
    protected void paintComponent(Graphics graphics) {
        super.paintComponent(graphics);
        if (template == null) {
            return;
        }
        Graphics2D g = (Graphics2D) graphics;
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        boxes.clear();
        boxDetails.clear();
        int dayWidth = dayWidth();
        int right = dayX(DAYS, dayWidth) + PERIOD_WIDTH;

        g.setColor(Color.BLACK);
        g.setFont(Theme.NORMAL);
        drawCentered(g, "FACULTY OF INFORMATION TECHNOLOGY", dayX(0, dayWidth), 4 * dayWidth, 20);
        g.setFont(Theme.BOLD.deriveFont(17f));
        drawCentered(g, "T I M E T A B L E   -   " + template.getTitle(), dayX(0, dayWidth), 4 * dayWidth, 44);
        g.setColor(Theme.DANGER);
        g.setFont(Theme.BOLD);
        drawCentered(g, "D R A F T   V E R S I O N", dayX(4, dayWidth), right - dayX(4, dayWidth), 44);

        // hàng Color code để trên cùng cho dễ nhìn, dưới nó là tên ngày
        int y = drawColorCodeRow(g, TITLE_HEIGHT, dayWidth);
        g.setFont(Theme.BOLD);
        for (int day = 0; day < DAYS; day++) {
            drawBox(g, dayX(day, dayWidth), y, dayWidth, ROW_HEIGHT, Color.WHITE);
            g.setColor(Color.BLACK);
            drawCentered(g, TimetableTemplate.DAY_NAMES[day], dayX(day, dayWidth), dayWidth, y + 25);
        }
        // cột Tiết BĐ hẹp nên viết tiêu đề thành 2 dòng
        drawBox(g, dayX(DAYS, dayWidth), y, PERIOD_WIDTH, ROW_HEIGHT, Color.WHITE);
        g.setColor(Color.BLACK);
        drawCentered(g, "Tiết", dayX(DAYS, dayWidth), PERIOD_WIDTH, y + 17);
        drawCentered(g, "BĐ", dayX(DAYS, dayWidth), PERIOD_WIDTH, y + 33);
        y += ROW_HEIGHT;
        int firstBlockTop = y;
        for (int block : template.getBlocks()) {
            y = drawBlock(g, block, y, dayWidth);
        }

        if (template.getCells().isEmpty() && !emptyMessage.isEmpty()) {
            g.setColor(Theme.MUTED_TEXT);
            g.setFont(Theme.BOLD);
            g.drawString(emptyMessage, dayX(0, dayWidth) + 12, firstBlockTop + 25);
        }
    }

    /** Vẽ một khối (LECTURE, TUTORIAL hoặc CLC), trả về y ngay dưới khối. */
    private int drawBlock(Graphics2D g, int block, int top, int dayWidth) {
        Color blockColor = new Color(TimetableTemplate.BLOCK_COLORS[block]);
        int[] slotTops = new int[TimeSlots.SLOTS_PER_DAY + 1];
        slotTops[0] = top;
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            slotTops[slot + 1] = slotTops[slot] + template.getRowCount(block, slot) * ROW_HEIGHT;
        }
        int bottom = slotTops[TimeSlots.SLOTS_PER_DAY];
        int periodX = dayX(DAYS, dayWidth);

        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            int y = slotTops[slot];
            int height = slotTops[slot + 1] - y;
            // ô trống của ca, tô vàng nếu giảng viên đang lọc bận giờ này
            for (int day = 0; day < DAYS; day++) {
                Color background = isBusy(TimeSlots.FIRST_DAY + day, slot) ? Theme.BUSY_FILL : Color.WHITE;
                for (int row = 0; row < template.getRowCount(block, slot); row++) {
                    drawBox(g, dayX(day, dayWidth), y + row * ROW_HEIGHT, dayWidth, ROW_HEIGHT, background);
                }
            }
            drawBox(g, DAYS_LEFT - TIME_WIDTH, y, TIME_WIDTH, height, Color.WHITE);
            g.setColor(Color.BLACK);
            g.setFont(Theme.NORMAL);
            drawCentered(g, TimeSlots.slotTime(slot), DAYS_LEFT - TIME_WIDTH, TIME_WIDTH, y + height / 2 + 5);
            drawBox(g, periodX, y, PERIOD_WIDTH, height, Color.WHITE);
            g.setColor(Color.BLACK);
            g.setFont(Theme.BOLD.deriveFont(20f));
            drawCentered(g, String.valueOf(TimetableTemplate.startPeriod(slot)), periodX, PERIOD_WIDTH, y + height / 2 + 7);
            // Morning / Afternoon / Evening gộp 2 ca
            if (slot % 2 == 0) {
                int partHeight = slotTops[slot + 2] - y;
                drawBox(g, BLOCK_WIDTH, y, PART_WIDTH, partHeight, blockColor);
                drawVertical(g, TimetableTemplate.partOfDay(slot), BLOCK_WIDTH, y, PART_WIDTH, partHeight);
            }
        }
        drawBox(g, 0, top, BLOCK_WIDTH, bottom - top, blockColor);
        drawVertical(g, TimetableTemplate.BLOCK_NAMES[block], 0, top, BLOCK_WIDTH, bottom - top);

        for (TimetableTemplate.Cell cell : template.getCells()) {
            if (cell.getBlock() == block) {
                int x = dayX(cell.getDay() - TimeSlots.FIRST_DAY, dayWidth);
                drawSession(g, cell, x, slotTops[cell.getSlot()] + cell.getRow() * ROW_HEIGHT, dayWidth);
            }
        }
        return bottom;
    }

    private void drawSession(Graphics2D g, TimetableTemplate.Cell cell, int x, int y, int width) {
        PlanSession session = cell.getSession();
        drawBox(g, x, y, width, ROW_HEIGHT, new Color(template.fillColor(session.getCohort())));
        if (badSessions.contains(session.getId())) {
            g.setColor(Theme.DANGER);
            g.setStroke(new BasicStroke(2.5f));
            g.drawRect(x + 2, y + 2, width - 4, ROW_HEIGHT - 4);
            g.setStroke(new BasicStroke(1f));
        }
        g.setColor(TimetableTemplate.isMme(session) ? MME_TEXT : Color.BLACK);
        g.setFont(TimetableTemplate.isBold(session) ? Theme.BOLD.deriveFont(12f) : Theme.NORMAL.deriveFont(12f));
        drawCentered(g, cell.getTitle(), x, width, y + 17);
        g.setFont(Theme.NORMAL.deriveFont(12f));
        drawCentered(g, cell.getTeacherCode(), x, width, y + 33);

        Assignment assignment = cell.getAssignment();
        String detail = session.getId() + "\n" + session.getCourseName() + "\n" + session.getProgram().getDisplayName()
                + " - " + session.getCohort() + "\nGiảng viên: " + assignment.getTeacherCode() + "\n"
                + TimeSlots.describe(assignment.getDay(), assignment.getStartSlot(), session.getSlotCount())
                + (assignment.isLocked() ? "\nĐã cố định" : "");
        boxes.add(new Rectangle(x, y, width, ROW_HEIGHT));
        boxDetails.add(detail);
    }

    private int drawColorCodeRow(Graphics2D g, int y, int dayWidth) {
        g.setFont(Theme.NORMAL);
        drawBox(g, DAYS_LEFT - TIME_WIDTH, y, TIME_WIDTH, ROW_HEIGHT, Color.WHITE);
        g.setColor(Color.BLACK);
        drawCentered(g, "Color code:", DAYS_LEFT - TIME_WIDTH, TIME_WIDTH, y + 25);
        List<String> cohorts = template.getColoredCohorts();
        for (int k = 0; k < cohorts.size(); k++) {
            drawBox(g, dayX(k, dayWidth), y, dayWidth, ROW_HEIGHT, new Color(TimetableTemplate.COHORT_COLORS[k]));
            g.setColor(Color.BLACK);
            drawCentered(g, cohorts.get(k), dayX(k, dayWidth), dayWidth, y + 25);
        }
        int next = cohorts.size();
        drawBox(g, dayX(next, dayWidth), y, dayWidth, ROW_HEIGHT, Color.WHITE);
        g.setColor(Color.BLACK);
        drawCentered(g, "Black: IT", dayX(next, dayWidth), dayWidth, y + 25);
        // TKB CLC / Tiên tiến không có môn MME
        if (template.getTimetable() == TimetableTemplate.REGULAR) {
            drawBox(g, dayX(next + 1, dayWidth), y, dayWidth, ROW_HEIGHT, Color.WHITE);
            g.setColor(MME_TEXT);
            drawCentered(g, "Blue: MME", dayX(next + 1, dayWidth), dayWidth, y + 25);
        }
        return y + ROW_HEIGHT;
    }

    private boolean isBusy(int day, int slot) {
        for (BusySlot busy : busySlots) {
            if (busy.getDay() == day && slot >= busy.getFromSlot() && slot <= busy.getToSlot()) {
                return true;
            }
        }
        return false;
    }

    private static void drawBox(Graphics2D g, int x, int y, int width, int height, Color fill) {
        g.setColor(fill);
        g.fillRect(x, y, width, height);
        g.setColor(LINE);
        g.drawRect(x, y, width, height);
    }

    /** Viết chữ căn giữa, ô hẹp thì thu nhỏ chữ như "Shrink to fit" của Excel. */
    private static void drawCentered(Graphics2D g, String text, int x, int width, int baseline) {
        Font original = g.getFont();
        while (g.getFontMetrics().stringWidth(text) > width - 6 && g.getFont().getSize2D() > MIN_FONT_SIZE) {
            g.setFont(g.getFont().deriveFont(g.getFont().getSize2D() - 0.5f));
        }
        FontMetrics metrics = g.getFontMetrics();
        String shown = Theme.fit(text, metrics, width - 6);
        g.drawString(shown, x + (width - metrics.stringWidth(shown)) / 2, baseline);
        g.setFont(original);
    }

    /** Viết chữ xoay dọc cho cột hẹp như LECTURE, Morning. */
    private static void drawVertical(Graphics2D g, String text, int x, int y, int width, int height) {
        Graphics2D rotated = (Graphics2D) g.create();
        rotated.setColor(Color.BLACK);
        rotated.setFont(Theme.BOLD.deriveFont(Font.BOLD, 12f));
        rotated.translate(x + width / 2, y + height / 2);
        rotated.rotate(-Math.PI / 2);
        FontMetrics metrics = rotated.getFontMetrics();
        rotated.drawString(text, -metrics.stringWidth(text) / 2, metrics.getAscent() / 2 - 1);
        rotated.dispose();
    }

    @Override
    public String getToolTipText(MouseEvent event) {
        for (int k = 0; k < boxes.size(); k++) {
            if (boxes.get(k).contains(event.getPoint())) {
                return "<html>" + boxDetails.get(k).replace("\n", "<br>") + "</html>";
            }
        }
        return null;
    }
}
