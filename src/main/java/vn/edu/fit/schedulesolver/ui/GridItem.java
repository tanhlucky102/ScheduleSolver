package vn.edu.fit.schedulesolver.ui;

import java.awt.Color;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Một ô chữ nhật trên lịch cá nhân, vị trí tính theo giờ thật (số phút từ 0 giờ). */
public class GridItem {
    private final int day;
    private final int startMinute;
    private final int endMinute;
    private final String title;
    private final String subtitle;
    private final String detail;
    private final Color fill;
    private final Color accent;

    public GridItem(int day, int startMinute, int endMinute, String title, String subtitle, String detail,
                    Color fill, Color accent) {
        this.day = day;
        this.startMinute = startMinute;
        this.endMinute = endMinute;
        this.title = title;
        this.subtitle = subtitle;
        this.detail = detail;
        this.fill = fill;
        this.accent = accent;
    }

    public int getDay() {
        return day;
    }

    public int getStartMinute() {
        return startMinute;
    }

    public int getEndMinute() {
        return endMinute;
    }

    public String getTimeText() {
        return TimeSlots.formatTime(startMinute) + " - " + TimeSlots.formatTime(endMinute);
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
}
