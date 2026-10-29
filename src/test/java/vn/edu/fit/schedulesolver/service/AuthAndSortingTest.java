package vn.edu.fit.schedulesolver.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import vn.edu.fit.schedulesolver.model.Account;
import vn.edu.fit.schedulesolver.model.Assignment;
import vn.edu.fit.schedulesolver.model.PlanSession;
import vn.edu.fit.schedulesolver.model.Role;
import vn.edu.fit.schedulesolver.model.SessionKind;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.Workspace;

/** Test đăng nhập 3 vai trò và sắp xếp A-Z. */
class AuthAndSortingTest {
    @TempDir
    File folder;

    private List<Teacher> teachers() {
        List<Teacher> teachers = new ArrayList<>();
        teachers.add(new Teacher("NgaNT"));
        teachers.add(new Teacher("BachNG"));
        return teachers;
    }

    @Test
    void defaultAccountsAreCreatedForThreeRoles() throws IOException {
        File file = new File(folder, "tai_khoan.csv");
        AuthService auth = new AuthService(file);
        auth.ensureDefaultAccounts(teachers());
        assertEquals(4, auth.getAccounts().size());

        Account dean = auth.login("truongkhoa", AuthService.DEFAULT_PASSWORD);
        assertNotNull(dean);
        assertEquals(Role.TRUONG_KHOA, dean.getRole());
        assertEquals(Role.GIAO_VU, auth.login("GiaoVu", "123456").getRole());
        Account teacher = auth.login("ngant", "123456");
        assertEquals(Role.GIANG_VIEN, teacher.getRole());
        assertEquals("NgaNT", teacher.getTeacherCode());
    }

    @Test
    void wrongPasswordOrUnknownUserIsRejected() throws IOException {
        AuthService auth = new AuthService(new File(folder, "tai_khoan.csv"));
        auth.ensureDefaultAccounts(teachers());
        assertNull(auth.login("ngant", "sai-mat-khau"));
        assertNull(auth.login("khongco", "123456"));
        assertNull(auth.login(null, null));
    }

    @Test
    void passwordIsStoredAsHashNotPlainText() throws IOException {
        File file = new File(folder, "tai_khoan.csv");
        new AuthService(file).ensureDefaultAccounts(teachers());
        String content = Files.readString(file.toPath(), StandardCharsets.UTF_8);
        assertFalse(content.contains(",123456,"), "file không được chứa mật khẩu gốc");
        assertEquals(64, AuthService.hash("123456").length());
        assertEquals(AuthService.hash("abc"), AuthService.hash("abc"));

        // mở lại file vẫn đăng nhập được, không bị tạo trùng tài khoản
        AuthService again = new AuthService(file);
        again.ensureDefaultAccounts(teachers());
        assertEquals(4, again.getAccounts().size());
        assertNotNull(again.login("bachng", "123456"));
    }

    @Test
    void workspaceIsSortedFromAToZ() {
        Workspace workspace = new Workspace();
        workspace.getTeachers().add(new Teacher("TuanVM"));
        workspace.getTeachers().add(new Teacher("anhNP"));
        workspace.getTeachers().add(new Teacher("BachNG"));
        workspace.getRules().add(new TeachingRule("66FIT2PR1", "", "QuyenNV", true, true));
        workspace.getRules().add(new TeachingRule("61FIT3DBS", "", "NguyetDTM", true, true));
        workspace.getRules().add(new TeachingRule("61FIT3DBS", "", "NgaNT", false, true));
        workspace.getPlan().add(new PlanSession("62FIT3DBS-CLC01", "62FIT3DBS", "", "K24", "CLC01", SessionKind.LEC_TUT, 30));
        workspace.getPlan().add(new PlanSession("61FIT3DBS-TUT-01", "61FIT3DBS", "", "K24", "01", SessionKind.TUTORIAL, 30));
        workspace.getPlan().add(new PlanSession("61FIT3DBS-LEC", "61FIT3DBS", "", "K24", "", SessionKind.LECTURE, 200));
        workspace.getDraft().add(new Assignment("62FIT3DBS-CLC01", "NgaNT", 2, 0, false));
        workspace.getDraft().add(new Assignment("61FIT3DBS-LEC", "NguyetDTM", 3, 0, false));

        Sorting.sortWorkspace(workspace);

        assertEquals("anhNP", workspace.getTeachers().get(0).getCode());
        assertEquals("TuanVM", workspace.getTeachers().get(2).getCode());
        assertEquals("NgaNT", workspace.getRules().get(0).getTeacherCode());
        assertEquals("66FIT2PR1", workspace.getRules().get(2).getCourseCode());
        assertEquals("61FIT3DBS-LEC", workspace.getPlan().get(0).getId());
        assertEquals("62FIT3DBS-CLC01", workspace.getPlan().get(2).getId());
        assertEquals("61FIT3DBS-LEC", workspace.getDraft().get(0).getSessionId());
        assertTrue(workspace.getRules().get(0).getCourseCode().startsWith("61FIT"));
    }
}
