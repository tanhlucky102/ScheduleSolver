package vn.edu.fit.schedulesolver.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import vn.edu.fit.schedulesolver.model.ExternalSession;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/**
 * Khoa chưa có TKB thật của các trường khác nên sinh TKB giả định để demo.
 * Mỗi trường có khung giờ riêng lệch với các ca của khoa (khung giờ này cũng là giả định).
 * Cùng seed thì ra cùng dữ liệu.
 */
public class ExternalScheduleGenerator {
    private static final String[] SCHOOLS = {"ĐH Thủy lợi", "ĐH Kinh tế Quốc dân", "Học viện Bưu chính Viễn thông"};
    // giờ các buổi học của từng trường, dạng {bắt đầu, kết thúc}
    private static final String[][][] SCHOOL_TIMES = {
        {{"07:00", "09:30"}, {"09:40", "12:10"}, {"13:00", "15:30"}, {"15:40", "18:10"}},
        {{"07:00", "09:00"}, {"09:15", "11:15"}, {"12:30", "14:30"}, {"14:45", "16:45"}},
        {{"07:30", "10:00"}, {"10:10", "12:40"}, {"13:30", "16:00"}, {"18:00", "20:30"}}
    };
    private static final String[] COURSES = {
        "Cơ sở dữ liệu", "Lập trình Java", "Mạng máy tính", "Toán rời rạc", "Hệ điều hành", "Kỹ thuật phần mềm"
    };
    private static final String[] CLASSES = {"64HT1", "65CNTT2", "K66-IT3", "D22CN05"};

    /** TKB giả định của một giảng viên: 2 hoặc 3 buổi/tuần ở một trường, mỗi buổi một ngày khác nhau. */
    public List<ExternalSession> generate(String teacherCode, long seed) {
        Random random = new Random(seed);
        int school = random.nextInt(SCHOOLS.length);
        String course = COURSES[random.nextInt(COURSES.length)];
        String className = CLASSES[random.nextInt(CLASSES.length)];
        int count = 2 + random.nextInt(2);
        List<Integer> usedDays = new ArrayList<>();
        List<ExternalSession> result = new ArrayList<>();
        while (result.size() < count) {
            int day = TimeSlots.FIRST_DAY + random.nextInt(6);
            if (usedDays.contains(day)) {
                continue;
            }
            usedDays.add(day);
            String[] time = SCHOOL_TIMES[school][random.nextInt(SCHOOL_TIMES[school].length)];
            result.add(new ExternalSession(teacherCode, SCHOOLS[school], course, className, day,
                    TimeSlots.parseTime(time[0]), TimeSlots.parseTime(time[1]), "", true));
        }
        return result;
    }

    /** ratio là tỉ lệ giảng viên có dạy ở trường khác, từ 0 đến 1. */
    public List<ExternalSession> generate(List<Teacher> teachers, double ratio, long seed) {
        Random random = new Random(seed);
        List<ExternalSession> result = new ArrayList<>();
        for (Teacher teacher : teachers) {
            if (random.nextDouble() < ratio) {
                result.addAll(generate(teacher.getCode(), random.nextLong()));
            }
        }
        return result;
    }
}
