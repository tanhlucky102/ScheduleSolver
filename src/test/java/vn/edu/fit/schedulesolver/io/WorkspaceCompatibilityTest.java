package vn.edu.fit.schedulesolver.io;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.Workspace;

/** Bản mới phải mở được file dự án lưu từ bản cũ. */
class WorkspaceCompatibilityTest {
    // lưu bằng code bản 28/10 trên nhánh dev, trước khi thêm dataVersion
    private static final File OLD_FILE = new File("src/test/resources/workspace_28-10.ssp");

    @TempDir
    File folder;

    @Test
    void projectSavedByOldVersionStillOpens() throws IOException {
        Workspace workspace = WorkspaceFile.load(OLD_FILE);
        assertEquals(3, workspace.getTeachers().size());
        assertTrue(workspace.findTeacher("ThaoDTP").matchesName("Thảo"));
        assertEquals(14, workspace.findTeacher("QuyenNV").getMaxSlotsPerWeek());
        assertEquals(2, workspace.getRules().size());
        assertEquals(3, workspace.getPlan().size());
        assertEquals("Dạy CSDL lớp 64HT", workspace.getBusySlots().get(0).getPrivateNote());
        assertTrue(workspace.getDraft().get(0).isLocked());
        assertEquals(3, workspace.getPublished().size());
        assertTrue(workspace.isPlanSent());
        assertEquals(Workspace.CURRENT_VERSION, workspace.getDataVersion(), "đọc xong phải được nâng lên phiên bản hiện tại");
    }

    @Test
    void oldProjectCanBeSavedAgainWithNewVersion() throws IOException {
        Workspace workspace = WorkspaceFile.load(OLD_FILE);
        File file = new File(folder, "duan" + WorkspaceFile.EXTENSION);
        WorkspaceFile.save(file, workspace);
        assertFalse(new File(file.getPath() + ".tmp").exists(), "file tạm phải được đổi tên thành file dự án");

        Workspace again = WorkspaceFile.load(file);
        assertEquals(3, again.getDraft().size());
        assertEquals("NgaNT", again.getPublished().get(2).getTeacherCode());
    }

    @Test
    void projectFromNewerVersionIsRejectedWithClearMessage() throws Exception {
        Workspace workspace = new Workspace();
        // giả làm file của bản sau bằng Reflection
        Field version = Workspace.class.getDeclaredField("dataVersion");
        version.setAccessible(true);
        version.setInt(workspace, Workspace.CURRENT_VERSION + 1);
        File file = new File(folder, "moi" + WorkspaceFile.EXTENSION);
        WorkspaceFile.save(file, workspace);

        IOException error = assertThrows(IOException.class, () -> WorkspaceFile.load(file));
        assertTrue(error.getMessage().contains("phiên bản mới hơn"));
    }

    @Test
    void fileThatIsNotAProjectGivesClearMessage() throws IOException {
        File file = new File(folder, "khong_phai" + WorkspaceFile.EXTENSION);
        Files.writeString(file.toPath(), "ma_gv,ho_ten\nNgaNT,\n", StandardCharsets.UTF_8);
        IOException error = assertThrows(IOException.class, () -> WorkspaceFile.load(file));
        assertTrue(error.getMessage().contains("không phải dự án"));
    }

    @Test
    void everySavedClassDeclaresSerialVersionUid() throws Exception {
        Class<?>[] saved = {Workspace.class, Teacher.class, TeachingRule.class, PlanSession.class,
            BusySlot.class, Assignment.class};
        for (Class<?> type : saved) {
            Field field = type.getDeclaredField("serialVersionUID");
            int modifiers = field.getModifiers();
            assertTrue(Modifier.isStatic(modifiers) && Modifier.isFinal(modifiers), type.getSimpleName());
            assertEquals(long.class, field.getType(), type.getSimpleName());
        }
    }
}
