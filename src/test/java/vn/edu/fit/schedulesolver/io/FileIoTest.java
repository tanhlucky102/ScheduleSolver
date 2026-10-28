package vn.edu.fit.schedulesolver.io;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.Workspace;

/** Test đọc/ghi CSV và lưu/mở dự án bằng Serialization. */
class FileIoTest {
    @TempDir
    File folder;

    @Test
    void teachersRulesAndBusySlotsRoundTripThroughCsv() throws IOException {
        List<Teacher> teachers = new ArrayList<>();
        Teacher thao = new Teacher("ThaoDTP", "Đào Thị Phương Thảo", 4, 10);
        thao.addAlias("Thảo");
        teachers.add(thao);
        File teacherFile = new File(folder, "gv.csv");
        DataFiles.writeTeachers(teacherFile, teachers);
        Teacher loaded = DataFiles.readTeachers(teacherFile).get(0);
        assertEquals("Đào Thị Phương Thảo", loaded.getFullName());
        assertEquals(10, loaded.getMaxSlotsPerWeek());
        assertTrue(loaded.matchesName("thảo"));

        List<TeachingRule> rules = new ArrayList<>();
        rules.add(new TeachingRule("61FIT3DBS", "Cơ sở dữ liệu", "NgaNT", false, true));
        File ruleFile = new File(folder, "qu.csv");
        DataFiles.writeRules(ruleFile, rules);
        TeachingRule rule = DataFiles.readRules(ruleFile).get(0);
        assertEquals(false, rule.isCanLecture());
        assertEquals(true, rule.isCanTutorial());

        List<BusySlot> busy = new ArrayList<>();
        busy.add(new BusySlot("NgaNT", 3, 0, 1, "ĐH Thủy lợi", "Dạy CSDL, lớp 64HT"));
        File busyFile = new File(folder, "ban.csv");
        DataFiles.writeBusySlots(busyFile, busy);
        BusySlot slot = DataFiles.readBusySlots(busyFile).get(0);
        assertEquals(3, slot.getDay());
        assertEquals(1, slot.getToSlot());
        assertEquals("Dạy CSDL; lớp 64HT", slot.getPrivateNote(), "dấu phẩy được đổi để không vỡ cột");
    }

    @Test
    void badCsvLineReportsLineNumber() throws IOException {
        File file = new File(folder, "loi.csv");
        Files.writeString(file.toPath(), DataFiles.BUSY_HEADER + "\nNgaNT,9,1,2,Nơi khác,\n", StandardCharsets.UTF_8);
        IOException error = assertThrows(IOException.class, () -> DataFiles.readBusySlots(file));
        assertTrue(error.getMessage().contains("dòng 2"));
    }

    @Test
    void workspaceRoundTripsThroughSerialization() throws IOException {
        Workspace workspace = new Workspace();
        workspace.getTeachers().add(new Teacher("NgaNT"));
        workspace.getPlan().add(new PlanSession("DBS-T1", "61FIT3DBS", "CSDL", "K24", "01", SessionKind.TUTORIAL, 30));
        workspace.getDraft().add(new Assignment("DBS-T1", "NgaNT", 3, 2, true));
        workspace.publishDraft();
        workspace.setPlanSent(true);
        File file = new File(folder, "duan" + WorkspaceFile.EXTENSION);
        WorkspaceFile.save(file, workspace);

        Workspace loaded = WorkspaceFile.load(file);
        assertTrue(loaded.isPlanSent());
        assertEquals(1, loaded.getPublished().size());
        assertTrue(loaded.getDraft().get(0).isLocked());
        assertEquals("CSDL", loaded.findSession("DBS-T1").getCourseName());
    }

    @Test
    void gridCellIsParsedFromFacultyText() {
        GridCell clc = new GridCell(10, 7, 0, true, "62FIT2PR1-CLC 01- Lec\nQuanDD - 402 C");
        assertEquals("62FIT2PR1", clc.getCourseCode());
        assertEquals("CLC01", clc.getGroup());
        assertEquals(SessionKind.LECTURE, clc.getKind());
        assertEquals("QuanDD - 402 C", clc.getTeacherText());

        GridCell tutorial = new GridCell(11, 2, 1, true, "61FIT3MUL - A03 (IT)\nVanHT - 205 D1");
        assertEquals("A03", tutorial.getGroup());
        assertEquals(SessionKind.TUTORIAL, tutorial.getKind());

        GridCell lecture = new GridCell(12, 5, 1, false, "61FIT4EIS -B\nNgocTB - 802 C");
        assertEquals("B", lecture.getGroup());
        assertEquals(SessionKind.LECTURE, lecture.getKind());
    }
}
