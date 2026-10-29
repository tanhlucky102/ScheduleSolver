package vn.edu.fit.schedulesolver.ui;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.Color;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Lịch cá nhân vẽ theo giờ thật: buổi 07:00 phải nằm cao hơn Ca 1 của khoa (07:10). */
class TimetableGridPanelTest {

    @Test
    void sevenOClockIsDrawnAboveFacultySlotOne() {
        TimetableGridPanel panel = new TimetableGridPanel();
        List<GridItem> items = new ArrayList<>();
        items.add(new GridItem(3, 7 * 60, 9 * 60 + 30, "ĐH Thủy lợi", "", "", Color.WHITE, Color.BLACK));
        items.add(new GridItem(3, TimeSlots.startMinute(0), TimeSlots.endMinute(0), "Ca 1", "", "", Color.WHITE, Color.BLACK));
        panel.setItems(items, "");
        int otherSchool = panel.yOf(7 * 60);
        int facultySlot = panel.yOf(TimeSlots.startMinute(0));
        assertTrue(otherSchool < facultySlot);
        // chưa nằm trong khung cuộn nên dùng tỉ lệ nhỏ nhất 0,8 điểm ảnh/phút: lệch 10 phút = 8 điểm ảnh
        assertEquals(8, facultySlot - otherSchool);
    }

    @Test
    void earlySessionExtendsTheTimeAxis() {
        TimetableGridPanel panel = new TimetableGridPanel();
        List<GridItem> items = new ArrayList<>();
        items.add(new GridItem(2, 6 * 60 + 30, 8 * 60, "Sớm", "", "", Color.WHITE, Color.BLACK));
        panel.setItems(items, "");
        assertTrue(panel.yOf(6 * 60 + 30) > panel.yOf(6 * 60), "trục giờ phải bắt đầu từ 06:00");
        assertEquals(panel.yOf(6 * 60), 32, "06:00 nằm ngay dưới dòng tiêu đề");
    }
}
