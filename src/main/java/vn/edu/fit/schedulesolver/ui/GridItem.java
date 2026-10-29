package vn.edu.fit.schedulesolver.ui;

import java.awt.Color;

/** Một ô chữ nhật vẽ trên lưới thời khóa biểu (một buổi dạy hoặc một lịch bận). */
public class GridItem {
    private final int day;
    private final int startSlot;
    private final int slotCount;
    private final String title;
    private final String subtitle;
    private final String detail;
    private final Color fill;
    private final Color accent;

    public GridItem(int day, int startSlot, int slotCount, String title, String subtitle, String detail,
                    Color fill, Color accent) {
        this.day = day;
        this.startSlot = startSlot;
        this.slotCount = slotCount;
        this.title = title;
        this.subtitle = subtitle;
        this.detail = detail;
        this.fill = fill;
        this.accent = accent;
    }

    public int getDay() {
        return day;
    }

    public int getStartSlot() {
        return startSlot;
    }

    public String getTitle() {
        return title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    /** Nội dung tooltip khi rê chuột lên ô. */
    public String getDetail() {
        return detail;
    }

    public Color getFill() {
        return fill;
    }

    /** Màu vạch bên trái của ô. */
    public Color getAccent() {
        return accent;
    }

    public boolean covers(int otherDay, int slot) {
        return day == otherDay && slot >= startSlot && slot < startSlot + slotCount;
    }
}
