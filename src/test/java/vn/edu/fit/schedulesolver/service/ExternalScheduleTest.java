package vn.edu.fit.schedulesolver.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.ExternalSession;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.TimeSlots;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.solver.Problem;

/** TKB ở trường khác lưu theo giờ thật, lệch với các ca của khoa. */
class ExternalScheduleTest {
    @TempDir
    File folder;

    private static ExternalSession external(int day, String start, String end) {
        return new ExternalSession("NgaNT", "ĐH Thủy lợi", "Cơ sở dữ liệu", "64HT1", day,
                TimeSlots.parseTime(start), TimeSlots.parseTime(end), "", false);
    }

    @Test
    void clockTimesAreMappedToOverlappingFacultySlots() {
        assertEquals(425, TimeSlots.parseTime("7:05"));
        assertEquals("07:05", TimeSlots.formatTime(425));
        assertEquals(430, TimeSlots.startMinute(0), "Ca 1 bắt đầu 07:10");
        // 07:00 - 09:30 chỉ chồng Ca 1 (07:10 - 09:15), chạm đúng 09:30 của Ca 2 thì không tính
        assertEquals(0b1, external(3, "07:00", "09:30").getMask());
        assertEquals(0b11, external(3, "09:00", "10:00").getMask());
        // giờ nghỉ trưa giữa Ca 2 và Ca 3
        ExternalSession lunch = external(3, "11:40", "12:15");
        assertEquals(0, lunch.getMask());
        assertNull(lunch.toBusySlot(), "không chồng ca nào thì bộ giải không cần tránh");
        assertThrows(IllegalArgumentException.class, () -> TimeSlots.parseTime("7h30"));
        assertThrows(IllegalArgumentException.class, () -> external(3, "10:00", "09:00"));
    }

    @Test
    void solverAvoidsSlotsBlockedByTeachingAtAnotherSchool() {
        Workspace workspace = new Workspace();
        workspace.getTeachers().add(new Teacher("NgaNT"));
        workspace.getRules().add(new TeachingRule("61FIT3DBS", "CSDL", "NgaNT", true, true));
        workspace.getPlan().add(new PlanSession("DBS-T1", "61FIT3DBS", "CSDL", "K24", "01", SessionKind.TUTORIAL, 30));
        workspace.getExternalSessions().add(external(3, "09:00", "10:00"));

        Problem problem = new ScheduleService().buildProblem(workspace, new ArrayList<>());
        int teacher = problem.findTeacher("NgaNT");
        assertEquals(0b11, problem.getBusyMask(teacher, 3), "Ca 1 và Ca 2 Thứ 3 bị chặn");
        assertEquals(0, problem.getBusyMask(teacher, 4));
    }

    @Test
    void personalScheduleComparesRealClockTimes() {
        Workspace workspace = new Workspace();
        workspace.getPlan().add(new PlanSession("DBS-T1", "61FIT3DBS", "CSDL", "K24", "01", SessionKind.TUTORIAL, 30));
        workspace.getPlan().add(new PlanSession("DBS-T2", "61FIT3DBS", "CSDL", "K24", "02", SessionKind.TUTORIAL, 30));
        // Thứ 3 Ca 2 ở khoa (09:30 - 11:35), Thứ 5 Ca 1 (07:10 - 09:15)
        workspace.getPublished().add(new Assignment("DBS-T1", "NgaNT", 3, 1, false));
        workspace.getPublished().add(new Assignment("DBS-T2", "NgaNT", 5, 0, false));
        ExternalSession touching = external(3, "07:00", "09:30");
        ExternalSession overlapping = external(5, "09:00", "10:00");
        workspace.getExternalSessions().add(touching);
        workspace.getExternalSessions().add(overlapping);

        PersonalSchedule schedule = new PersonalSchedule(workspace, "NgaNT");
        List<String> conflicts = schedule.findConflicts();
        assertEquals(1, conflicts.size(), "09:00 - 10:00 chồng 15 phút cuối của Ca 1");
        assertTrue(conflicts.get(0).startsWith("DBS-T2"));
        assertTrue(schedule.isInConflict(overlapping));
        assertTrue(!schedule.isInConflict(touching), "kết thúc 09:30 đúng lúc Ca 2 bắt đầu thì không trùng");
        List<String> warnings = schedule.findTravelWarnings();
        assertEquals(1, warnings.size());
        assertTrue(warnings.get(0).contains("0 phút"), "không có thời gian di chuyển giữa hai trường");
    }

    @Test
    void assumedTimetableIsRepeatableAndMarked() {
        ExternalScheduleGenerator generator = new ExternalScheduleGenerator();
        List<ExternalSession> first = generator.generate("NgaNT", 7);
        List<ExternalSession> again = generator.generate("NgaNT", 7);
        assertTrue(first.size() == 2 || first.size() == 3);
        assertEquals(first.size(), again.size());
        for (int k = 0; k < first.size(); k++) {
            assertEquals(first.get(k).getDay(), again.get(k).getDay());
            assertEquals(first.get(k).getStartMinute(), again.get(k).getStartMinute());
            assertTrue(first.get(k).isAssumed());
            for (int j = 0; j < k; j++) {
                assertNotEquals(first.get(j).getDay(), first.get(k).getDay(), "mỗi buổi một ngày");
            }
        }
    }

    @Test
    void externalSessionsRoundTripThroughCsv() throws IOException {
        List<ExternalSession> sessions = new ArrayList<>();
        sessions.add(new ExternalSession("NgaNT", "ĐH Thủy lợi", "Cơ sở dữ liệu", "64HT1", 3,
                TimeSlots.parseTime("07:00"), TimeSlots.parseTime("09:30"), "A2-301", true));
        File file = new File(folder, "truong_khac.csv");
        DataFiles.writeExternalSessions(file, sessions);
        ExternalSession loaded = DataFiles.readExternalSessions(file).get(0);
        assertEquals("07:00 - 09:30", loaded.getTimeText());
        assertEquals("A2-301", loaded.getRoom());
        assertTrue(loaded.isAssumed());
    }
}
