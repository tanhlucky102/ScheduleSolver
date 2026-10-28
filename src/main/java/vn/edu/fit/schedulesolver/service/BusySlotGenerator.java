package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Sinh lịch bận giả lập vì khoa chưa có lịch bận thật, cùng seed thì ra cùng dữ liệu. */
public class BusySlotGenerator {
    private static final String[] PLACES = {
        "ĐH Bách khoa Hà Nội", "ĐH Kinh tế Quốc dân", "Học viện Bưu chính Viễn thông",
        "ĐH Thủy lợi", "Họp bộ môn", "Công tác nghiên cứu"
    };

    /** ratio là tỉ lệ giảng viên có lịch bận, từ 0 đến 1. */
    public List<BusySlot> generate(List<Teacher> teachers, double ratio, long seed) {
        Random random = new Random(seed);
        List<BusySlot> result = new ArrayList<>();
        for (Teacher teacher : teachers) {
            if (random.nextDouble() >= ratio) {
                continue;
            }
            int blocks = 1 + random.nextInt(2);
            for (int k = 0; k < blocks; k++) {
                int day = TimeSlots.FIRST_DAY + random.nextInt(6);
                // bận nguyên buổi sáng, chiều hoặc tối (2 ca liền)
                int from = 2 * random.nextInt(3);
                String place = PLACES[random.nextInt(PLACES.length)];
                result.add(new BusySlot(teacher.getCode(), day, from, from + 1, place,
                        "[Giả lập, seed " + seed + "]"));
            }
        }
        return result;
    }
}
