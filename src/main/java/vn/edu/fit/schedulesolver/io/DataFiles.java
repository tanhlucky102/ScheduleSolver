package vn.edu.fit.schedulesolver.io;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import vn.edu.fit.schedulesolver.model.Account;
import vn.edu.fit.schedulesolver.model.BusySlot;
import vn.edu.fit.schedulesolver.model.ExternalSession;
import vn.edu.fit.schedulesolver.model.Role;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.TeachingRule;
import vn.edu.fit.schedulesolver.model.TimeSlots;

/** Đọc/ghi các file CSV: giảng viên, quy ước phân công, lịch bận, TKB trường khác và tài khoản. */
public final class DataFiles {
    public static final String TEACHER_HEADER = "ma_gv,ho_ten,toi_da_ca_ngay,toi_da_ca_tuan,bi_danh";
    public static final String RULE_HEADER = "ma_mon,ten_mon,ma_gv,day_lec,day_tut";
    public static final String BUSY_HEADER = "ma_gv,thu,tu_ca,den_ca,noi_ban,ghi_chu";
    public static final String ACCOUNT_HEADER = "ten_dang_nhap,mat_khau_sha256,vai_tro,ma_gv";
    public static final String EXTERNAL_HEADER = "ma_gv,truong,mon,lop,thu,bat_dau,ket_thuc,phong,gia_dinh";

    private DataFiles() {
    }

    public static List<Teacher> readTeachers(File file) throws IOException {
        List<Teacher> teachers = new ArrayList<>();
        int lineNumber = 1;
        for (String[] row : CsvFile.read(file)) {
            lineNumber++;
            try {
                int maxDay = parseInt(CsvFile.get(row, 2), Teacher.DEFAULT_MAX_SLOTS_PER_DAY);
                int maxWeek = parseInt(CsvFile.get(row, 3), Teacher.DEFAULT_MAX_SLOTS_PER_WEEK);
                Teacher teacher = new Teacher(CsvFile.get(row, 0), CsvFile.get(row, 1), maxDay, maxWeek);
                for (String alias : CsvFile.get(row, 4).split("\\|")) {
                    teacher.addAlias(alias);
                }
                teachers.add(teacher);
            } catch (IllegalArgumentException e) {
                throw new IOException(file.getName() + " dòng " + lineNumber + ": " + e.getMessage(), e);
            }
        }
        return teachers;
    }

    public static void writeTeachers(File file, List<Teacher> teachers) throws IOException {
        List<String[]> rows = new ArrayList<>();
        for (Teacher teacher : teachers) {
            rows.add(new String[] {
                teacher.getCode(), teacher.getFullName(),
                String.valueOf(teacher.getMaxSlotsPerDay()), String.valueOf(teacher.getMaxSlotsPerWeek()),
                String.join("|", teacher.getAliases())
            });
        }
        CsvFile.write(file, TEACHER_HEADER, rows);
    }

    public static List<TeachingRule> readRules(File file) throws IOException {
        List<TeachingRule> rules = new ArrayList<>();
        int lineNumber = 1;
        for (String[] row : CsvFile.read(file)) {
            lineNumber++;
            try {
                boolean lecture = isMarked(CsvFile.get(row, 3));
                boolean tutorial = isMarked(CsvFile.get(row, 4));
                rules.add(new TeachingRule(CsvFile.get(row, 0), CsvFile.get(row, 1), CsvFile.get(row, 2), lecture, tutorial));
            } catch (IllegalArgumentException e) {
                throw new IOException(file.getName() + " dòng " + lineNumber + ": " + e.getMessage(), e);
            }
        }
        return rules;
    }

    public static void writeRules(File file, List<TeachingRule> rules) throws IOException {
        List<String[]> rows = new ArrayList<>();
        for (TeachingRule rule : rules) {
            rows.add(new String[] {
                rule.getCourseCode(), rule.getCourseName(), rule.getTeacherCode(),
                rule.isCanLecture() ? "x" : "", rule.isCanTutorial() ? "x" : ""
            });
        }
        CsvFile.write(file, RULE_HEADER, rows);
    }

    public static List<BusySlot> readBusySlots(File file) throws IOException {
        List<BusySlot> slots = new ArrayList<>();
        int lineNumber = 1;
        for (String[] row : CsvFile.read(file)) {
            lineNumber++;
            try {
                int day = Integer.parseInt(CsvFile.get(row, 1));
                // trong file ca đếm từ 1 cho dễ đọc, trong code đếm từ 0
                int from = Integer.parseInt(CsvFile.get(row, 2)) - 1;
                int to = Integer.parseInt(CsvFile.get(row, 3)) - 1;
                slots.add(new BusySlot(CsvFile.get(row, 0), day, from, to, CsvFile.get(row, 4), CsvFile.get(row, 5)));
            } catch (IllegalArgumentException e) {
                throw new IOException(file.getName() + " dòng " + lineNumber + ": " + e.getMessage(), e);
            }
        }
        return slots;
    }

    public static void writeBusySlots(File file, List<BusySlot> slots) throws IOException {
        List<String[]> rows = new ArrayList<>();
        for (BusySlot slot : slots) {
            rows.add(new String[] {
                slot.getTeacherCode(), String.valueOf(slot.getDay()),
                String.valueOf(slot.getFromSlot() + 1), String.valueOf(slot.getToSlot() + 1),
                slot.getPlace(), slot.getPrivateNote()
            });
        }
        CsvFile.write(file, BUSY_HEADER, rows);
    }

    /** Giờ ghi dạng gg:pp, cột gia_dinh = x là TKB tự giả định. */
    public static List<ExternalSession> readExternalSessions(File file) throws IOException {
        List<ExternalSession> sessions = new ArrayList<>();
        int lineNumber = 1;
        for (String[] row : CsvFile.read(file)) {
            lineNumber++;
            try {
                int day = Integer.parseInt(CsvFile.get(row, 4).trim());
                sessions.add(new ExternalSession(CsvFile.get(row, 0), CsvFile.get(row, 1), CsvFile.get(row, 2),
                        CsvFile.get(row, 3), day, TimeSlots.parseTime(CsvFile.get(row, 5)),
                        TimeSlots.parseTime(CsvFile.get(row, 6)), CsvFile.get(row, 7), isMarked(CsvFile.get(row, 8))));
            } catch (IllegalArgumentException e) {
                throw new IOException(file.getName() + " dòng " + lineNumber + ": " + e.getMessage(), e);
            }
        }
        return sessions;
    }

    public static void writeExternalSessions(File file, List<ExternalSession> sessions) throws IOException {
        List<String[]> rows = new ArrayList<>();
        for (ExternalSession session : sessions) {
            rows.add(new String[] {
                session.getTeacherCode(), session.getSchool(), session.getCourseName(), session.getClassName(),
                String.valueOf(session.getDay()), TimeSlots.formatTime(session.getStartMinute()),
                TimeSlots.formatTime(session.getEndMinute()), session.getRoom(), session.isAssumed() ? "x" : ""
            });
        }
        CsvFile.write(file, EXTERNAL_HEADER, rows);
    }

    public static List<Account> readAccounts(File file) throws IOException {
        List<Account> accounts = new ArrayList<>();
        int lineNumber = 1;
        for (String[] row : CsvFile.read(file)) {
            lineNumber++;
            try {
                Role role = Role.valueOf(CsvFile.get(row, 2));
                accounts.add(new Account(CsvFile.get(row, 0), CsvFile.get(row, 1), role, CsvFile.get(row, 3)));
            } catch (IllegalArgumentException e) {
                throw new IOException(file.getName() + " dòng " + lineNumber + ": " + e.getMessage(), e);
            }
        }
        return accounts;
    }

    public static void writeAccounts(File file, List<Account> accounts) throws IOException {
        List<String[]> rows = new ArrayList<>();
        for (Account account : accounts) {
            rows.add(new String[] {
                account.getUsername(), account.getPasswordHash(), account.getRole().name(), account.getTeacherCode()
            });
        }
        CsvFile.write(file, ACCOUNT_HEADER, rows);
    }

    private static boolean isMarked(String value) {
        String text = value.trim().toLowerCase();
        return text.equals("x") || text.equals("1") || text.equals("true");
    }

    private static int parseInt(String value, int defaultValue) {
        if (value.isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(value.trim());
    }
}
