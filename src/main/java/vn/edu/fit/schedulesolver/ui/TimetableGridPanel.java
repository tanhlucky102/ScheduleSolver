package vn.edu.fit.schedulesolver.ui;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.List;
import javax.swing.JPanel;
import javax.swing.JViewport;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Lưới TKB cá nhân tự vẽ bằng paintComponent, rê chuột lên buổi để xem chi tiết. */
public class TimetableGridPanel extends JPanel {
    private static final int HEADER_HEIGHT = 32;
    private static final int TIME_COLUMN_WIDTH = 110;
    private static final int MIN_DAY_WIDTH = 150;
    private static final int ITEM_HEIGHT = 38;
    private static final int GAP = 4;
    private static final Color TIME_COLUMN = new Color(226, 232, 240);
    private static final Color GRID_LINE = new Color(203, 213, 225);
    private static final Color AFTERNOON = new Color(250, 251, 253);

    private List<GridItem> items = new ArrayList<>();
    // các ô đã vẽ, dùng để biết chuột đang trỏ vào buổi nào
    private final List<Rectangle> boxes = new ArrayList<>();
    private final List<GridItem> boxItems = new ArrayList<>();
    private String emptyMessage = "";

    public TimetableGridPanel() {
        setBackground(Color.WHITE);
        // bật tooltip, nội dung lấy ở getToolTipText(MouseEvent)
        setToolTipText("");
    }

    public void setItems(List<GridItem> newItems, String messageWhenEmpty) {
        items = new ArrayList<>(newItems);
        emptyMessage = messageWhenEmpty;
        revalidate();
        repaint();
    }

    @Override
    public Dimension getPreferredSize() {
        int height = HEADER_HEIGHT;
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            height += rowHeight(slot);
        }
        int width = TIME_COLUMN_WIDTH + MIN_DAY_WIDTH * 6;
        // giãn cho vừa bề ngang khung cuộn, cửa sổ quá hẹp mới phải cuộn ngang
        if (getParent() instanceof JViewport) {
            width = Math.max(width, getParent().getWidth() - 1);
        }
        return new Dimension(width + 1, height + 1);
    }

    private int dayWidth() {
        return Math.max(MIN_DAY_WIDTH, (getWidth() - TIME_COLUMN_WIDTH - 1) / 6);
    }

    private int countItems(int day, int slot) {
        int count = 0;
        for (GridItem item : items) {
            if (item.covers(day, slot)) {
                count++;
            }
        }
        return count;
    }

    /** Ca nào có nhiều buổi cùng giờ thì dòng cao hơn để xếp chồng các ô. */
    private int rowHeight(int slot) {
        int max = 1;
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            max = Math.max(max, countItems(day, slot));
        }
        return max * (ITEM_HEIGHT + GAP) + GAP;
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
        int width = TIME_COLUMN_WIDTH + dayWidth * 6;

        g.setColor(Theme.PRIMARY_DARK);
        g.fillRect(0, 0, width, HEADER_HEIGHT);
        g.setColor(Color.WHITE);
        g.setFont(Theme.BOLD);
        g.drawString("Ca / Giờ", 10, 21);
        for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
            int x = TIME_COLUMN_WIDTH + (day - TimeSlots.FIRST_DAY) * dayWidth;
            g.drawString(TimeSlots.dayName(day), x + 10, 21);
        }

        int y = HEADER_HEIGHT;
        for (int slot = 0; slot < TimeSlots.SLOTS_PER_DAY; slot++) {
            int height = rowHeight(slot);
            // tô nền khác cho ca chiều
            if (slot == 2 || slot == 3) {
                g.setColor(AFTERNOON);
                g.fillRect(TIME_COLUMN_WIDTH, y, width - TIME_COLUMN_WIDTH, height);
            }
            g.setColor(TIME_COLUMN);
            g.fillRect(0, y, TIME_COLUMN_WIDTH, height);
            g.setColor(Theme.PRIMARY_DARK);
            g.setFont(Theme.BOLD);
            g.drawString(TimeSlots.slotName(slot), 10, y + 18);
            g.setColor(Theme.MUTED_TEXT);
            g.setFont(Theme.SMALL);
            g.drawString(TimeSlots.slotTime(slot), 10, y + 34);
            for (int day = TimeSlots.FIRST_DAY; day <= TimeSlots.LAST_DAY; day++) {
                int x = TIME_COLUMN_WIDTH + (day - TimeSlots.FIRST_DAY) * dayWidth;
                drawCell(g, day, slot, x, y, dayWidth);
            }
            g.setColor(GRID_LINE);
            g.drawLine(0, y, width, y);
            y += height;
        }
        g.setColor(GRID_LINE);
        g.drawLine(0, y, width, y);
        for (int column = 0; column <= 6; column++) {
            int x = TIME_COLUMN_WIDTH + column * dayWidth;
            g.drawLine(x, HEADER_HEIGHT, x, y);
        }
        if (items.isEmpty() && !emptyMessage.isEmpty()) {
            g.setColor(Theme.MUTED_TEXT);
            g.setFont(Theme.BOLD);
            g.drawString(emptyMessage, TIME_COLUMN_WIDTH + 14, HEADER_HEIGHT + 26);
        }
    }

    private void drawCell(Graphics2D g, int day, int slot, int x, int y, int dayWidth) {
        int itemY = y + GAP;
        for (GridItem item : items) {
            if (!item.covers(day, slot)) {
                continue;
            }
            Rectangle box = new Rectangle(x + GAP, itemY, dayWidth - 2 * GAP, ITEM_HEIGHT);
            g.setColor(item.getFill());
            g.fillRoundRect(box.x, box.y, box.width, box.height, 10, 10);
            g.setColor(item.getAccent());
            g.fillRoundRect(box.x, box.y, 5, box.height, 4, 4);
            g.drawRoundRect(box.x, box.y, box.width, box.height, 10, 10);

            String title = item.getTitle();
            // buổi 2 ca vẽ ở cả hai ca, ca sau ghi thêm "(tiếp)"
            if (slot > item.getStartSlot()) {
                title = title + " (tiếp)";
            }
            g.setColor(Theme.TEXT);
            g.setFont(Theme.BOLD.deriveFont(12f));
            g.drawString(Theme.fit(title, g.getFontMetrics(), box.width - 14), box.x + 10, box.y + 16);
            g.setColor(Theme.NEUTRAL);
            g.setFont(Theme.SMALL);
            g.drawString(Theme.fit(item.getSubtitle(), g.getFontMetrics(), box.width - 14), box.x + 10, box.y + 31);
            boxes.add(box);
            boxItems.add(item);
            itemY += ITEM_HEIGHT + GAP;
        }
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
