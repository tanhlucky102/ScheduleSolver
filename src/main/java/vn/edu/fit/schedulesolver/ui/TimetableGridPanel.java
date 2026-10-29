package vn.edu.fit.schedulesolver.ui;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.List;
import javax.swing.JPanel;
import javax.swing.JViewport;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/**
 * Lịch cá nhân tự vẽ bằng paintComponent theo giờ thật: trục dọc là thời gian, ô cao bằng thời lượng buổi học.
 * Vì vậy buổi 07:00 ở trường khác nằm cao hơn Ca 1 của khoa (07:10), không bị xếp ngang hàng.
 * Rê chuột lên ô để xem chi tiết.
 */
public class TimetableGridPanel extends JPanel {
    private static final int HEADER_HEIGHT = 32;
    private static final int HOUR_WIDTH = 48;
    private static final int SLOT_WIDTH = 96;
    private static final int LEFT_WIDTH = HOUR_WIDTH + SLOT_WIDTH;
    private static final int MIN_DAY_WIDTH = 150;
    // ít nhất 0,8 điểm ảnh cho 1 phút (lệch 10 phút = 8 điểm ảnh), khung cao hơn thì giãn ra cho vừa
    private static final double MIN_PIXELS_PER_MINUTE = 0.8;
    private static final int FIRST_MINUTE = 7 * 60;
    private static final int LAST_MINUTE = 21 * 60;
    private static final int GAP = 3;
    private static final Color LEFT_COLUMN = new Color(226, 232, 240);
    private static final Color GRID_LINE = new Color(203, 213, 225);
    private static final Color HOUR_LINE = new Color(226, 232, 240);
    private static final Color SLOT_BAND = new Color(241, 245, 249);

    private List<GridItem> items = new ArrayList<>();
    // các ô đã vẽ, dùng để biết chuột đang trỏ vào buổi nào
    private final List<Rectangle> boxes = new ArrayList<>();
    private final List<GridItem> boxItems = new ArrayList<>();
    private String emptyMessage = "";
    // khoảng giờ đang vẽ, nới ra nếu có buổi trước 7h hoặc sau 21h
    private int firstMinute = FIRST_MINUTE;
    private int lastMinute = LAST_MINUTE;

    public TimetableGridPanel() {
        setBackground(Color.WHITE);
        // bật tooltip, nội dung lấy ở getToolTipText(MouseEvent)
        setToolTipText("");
    }

    public void setItems(List<GridItem> newItems, String messageWhenEmpty) {
        items = new ArrayList<>(newItems);
        emptyMessage = messageWhenEmpty;
        firstMinute = FIRST_MINUTE;
        lastMinute = LAST_MINUTE;
        for (GridItem item : items) {
            // làm tròn ra giờ chẵn cho trục giờ dễ đọc
            firstMinute = Math.min(firstMinute, item.getStartMinute() / 60 * 60);
            lastMinute = Math.max(lastMinute, (item.getEndMinute() + 59) / 60 * 60);
        }
        revalidate();
        repaint();
    }

    private double pixelsPerMinute() {
        double scale = MIN_PIXELS_PER_MINUTE;
        if (getParent() instanceof JViewport) {
            int available = getParent().getHeight() - HEADER_HEIGHT - 1;
            scale = Math.max(scale, available / (double) (lastMinute - firstMinute));
        }
        return scale;
    }

    /** Tọa độ y của một mốc giờ (số phút từ 0 giờ). */
    int yOf(int minute) {
        return HEADER_HEIGHT + (int) Math.round((minute - firstMinute) * pixelsPerMinute());
    }

    @Override
    public Dimension getPreferredSize() {
        int width = LEFT_WIDTH + MIN_DAY_WIDTH * 6;
        // giãn cho vừa bề ngang khung cuộn, cửa sổ quá hẹp mới phải cuộn ngang
        if (getParent() instanceof JViewport) {
            width = Math.max(width, getParent().getWidth() - 1);
        }
        return new Dimension(width + 1, yOf(lastMinute) + 1);
    }

    private int dayWidth() {
        return Math.max(MIN_DAY_WIDTH, (getWidth() - LEFT_WIDTH - 1) / 6);
    }

    @Override
    protected void paintComponent(Graphics graphics) {
        super.paintComponent(graphics);
        Graphics2D g = (Graphics2D) graphics;
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        boxes.clear();
        boxItems.clear();
        int dayWidth = dayWidth();
        int width = LEFT_WIDTH + dayWidth * 6;
        int bottom = yOf(lastMinute);

        // dải nền mờ đánh dấu khung giờ các ca của khoa trên mọi cột ngày
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            int top = yOf(TimeSlots.startMinute(slot));
            g.setColor(SLOT_BAND);
            g.fillRect(LEFT_WIDTH, top, width - LEFT_WIDTH, yOf(TimeSlots.endMinute(slot)) - top);
        }
        g.setColor(LEFT_COLUMN);
        g.fillRect(0, HEADER_HEIGHT, LEFT_WIDTH, bottom - HEADER_HEIGHT);
        drawSlotColumn(g);
        drawHourLines(g, width);
        g.setColor(GRID_LINE);
        for (int column = 0; column <= 6; column++) {
            int x = LEFT_WIDTH + column * dayWidth;
            g.drawLine(x, HEADER_HEIGHT, x, bottom);
        }
        g.drawLine(HOUR_WIDTH, HEADER_HEIGHT, HOUR_WIDTH, bottom);
        g.drawLine(0, bottom, width, bottom);

        g.setColor(Theme.PRIMARY_DARK);
        g.fillRect(0, 0, width, HEADER_HEIGHT);
        g.setColor(Color.WHITE);
        g.setFont(Theme.BOLD);
        g.drawString("Giờ", 10, 21);
        g.drawString("Ca của khoa", HOUR_WIDTH + 8, 21);
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            g.drawString(TimeSlots.dayName(day), LEFT_WIDTH + (day - TimeSlots.FIRST_DAY) * dayWidth + 10, 21);
        }
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            drawDay(g, day, LEFT_WIDTH + (day - TimeSlots.FIRST_DAY) * dayWidth, dayWidth);
        }
        if (items.isEmpty() && !emptyMessage.isEmpty()) {
            g.setColor(Theme.MUTED_TEXT);
            g.setFont(Theme.BOLD);
            g.drawString(emptyMessage, LEFT_WIDTH + 14, HEADER_HEIGHT + 26);
        }
    }

    /** Cột "Ca của khoa": mỗi ca là một khối đặt đúng giờ bắt đầu, kết thúc. */
    private void drawSlotColumn(Graphics2D g) {
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            int top = yOf(TimeSlots.startMinute(slot));
            int height = yOf(TimeSlots.endMinute(slot)) - top;
            g.setColor(Color.WHITE);
            g.fillRect(HOUR_WIDTH + 4, top, SLOT_WIDTH - 8, height);
            g.setColor(GRID_LINE);
            g.drawRect(HOUR_WIDTH + 4, top, SLOT_WIDTH - 8, height);
            g.setColor(Theme.PRIMARY_DARK);
            g.setFont(Theme.BOLD);
            g.drawString(TimeSlots.slotName(slot), HOUR_WIDTH + 10, top + 15);
            g.setColor(Theme.MUTED_TEXT);
            g.setFont(Theme.SMALL);
            g.drawString(TimeSlots.formatTime(TimeSlots.startMinute(slot)) + " -", HOUR_WIDTH + 10, top + 30);
            g.drawString(TimeSlots.formatTime(TimeSlots.endMinute(slot)), HOUR_WIDTH + 10, top + 43);
        }
    }

    /** Vạch mỗi giờ chẵn, ghi giờ ở cột trái. */
    private void drawHourLines(Graphics2D g, int width) {
        g.setFont(Theme.SMALL);
        for (int minute = firstMinute; minute <= lastMinute; minute += 60) {
            int y = yOf(minute);
            g.setColor(HOUR_LINE);
            g.drawLine(HOUR_WIDTH, y, width, y);
            g.setColor(Theme.NEUTRAL);
            g.drawLine(HOUR_WIDTH - 6, y, HOUR_WIDTH, y);
            g.drawString(TimeSlots.formatTime(minute), 6, Math.max(y + 4, HEADER_HEIGHT + 12));
        }
    }

    /** Vẽ các buổi trong ngày; buổi chồng giờ nhau được chia làn đứng cạnh nhau. */
    private void drawDay(Graphics2D g, int day, int x, int dayWidth) {
        List<GridItem> dayItems = new ArrayList<>();
        for (GridItem item : items) {
            if (item.getDay() == day) {
                dayItems.add(item);
            }
        }
        dayItems.sort((a, b) -> a.getStartMinute() - b.getStartMinute());
        // làn k rảnh từ phút laneEnds.get(k) trở đi
        int[] lane = new int[dayItems.size()];
        List<Integer> laneEnds = new ArrayList<>();
        for (int i = 0; i < dayItems.size(); i++) {
            GridItem item = dayItems.get(i);
            int k = 0;
            while (k < laneEnds.size() && laneEnds.get(k) > item.getStartMinute()) {
                k++;
            }
            if (k == laneEnds.size()) {
                laneEnds.add(item.getEndMinute());
            } else {
                laneEnds.set(k, item.getEndMinute());
            }
            lane[i] = k;
        }
        int laneWidth = (dayWidth - GAP) / Math.max(1, laneEnds.size());
        for (int i = 0; i < dayItems.size(); i++) {
            GridItem item = dayItems.get(i);
            int top = yOf(item.getStartMinute());
            Rectangle box = new Rectangle(x + GAP + lane[i] * laneWidth, top + 1, laneWidth - GAP,
                    yOf(item.getEndMinute()) - top - 2);
            drawItem(g, item, box);
            boxes.add(box);
            boxItems.add(item);
        }
    }

    private void drawItem(Graphics2D g, GridItem item, Rectangle box) {
        g.setColor(item.getFill());
        g.fillRoundRect(box.x, box.y, box.width, box.height, 8, 8);
        g.setColor(item.getAccent());
        g.fillRoundRect(box.x, box.y, 5, box.height, 4, 4);
        g.drawRoundRect(box.x, box.y, box.width, box.height, 8, 8);

        // chữ không được tràn ra ngoài ô, ô thấp thì bớt dòng
        Shape oldClip = g.getClip();
        g.clipRect(box.x, box.y, box.width, box.height);
        int textX = box.x + 10;
        int maxWidth = box.width - 14;
        g.setColor(Theme.TEXT);
        g.setFont(Theme.BOLD.deriveFont(12f));
        g.drawString(Theme.fit(item.getTitle(), g.getFontMetrics(), maxWidth), textX, box.y + 15);
        g.setFont(Theme.SMALL);
        if (box.height >= 34) {
            g.setColor(Theme.NEUTRAL);
            g.drawString(Theme.fit(item.getSubtitle(), g.getFontMetrics(), maxWidth), textX, box.y + 30);
        }
        if (box.height >= 50) {
            g.setColor(Theme.MUTED_TEXT);
            g.drawString(item.getTimeText(), textX, box.y + 45);
        }
        g.setClip(oldClip);
    }

    @Override
    public String getToolTipText(MouseEvent event) {
        for (int k = 0; k < boxes.size(); k++) {
            if (boxes.get(k).contains(event.getPoint())) {
                return "<html>" + boxItems.get(k).getDetail().replace("\n", "<br>") + "</html>";
            }
        }
        return null;
    }
}
