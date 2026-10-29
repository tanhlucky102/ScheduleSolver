package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.CardLayout;
import java.awt.Color;
import java.awt.Cursor;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.function.Consumer;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JToolBar;
import javax.swing.SwingUtilities;
import javax.swing.filechooser.FileNameExtensionFilter;
import vn.edu.fit.schedulesolver.io.DataFiles;
import vn.edu.fit.schedulesolver.io.WorkspaceFile;
import vn.edu.fit.schedulesolver.model.Account;
import vn.edu.fit.schedulesolver.model.Role;
import vn.edu.fit.schedulesolver.model.Teacher;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.service.AuthService;
import vn.edu.fit.schedulesolver.service.Sorting;

/**
 * Cửa sổ chính, mỗi vai trò chỉ thấy màn hình của mình (CardLayout).
 * Đăng xuất vẫn giữ Workspace trong bộ nhớ nên demo được cả 3 vai trò trên một máy.
 */
public class MainFrame extends JFrame {
    public static final File RESOURCES = new File("resources");
    public static final File DEFAULT_WORKBOOK = new File(RESOURCES, "FIT Time table Fall2026 V5.2.xlsx");
    public static final File ACCOUNT_FILE = new File(RESOURCES, "tai_khoan.csv");

    private Workspace workspace = new Workspace();
    private File projectFile;
    private boolean changed;
    private final AuthService auth;

    private final CardLayout cards = new CardLayout();
    private final JPanel center = new JPanel(cards);
    private final List<BasePanel> panels = new ArrayList<>();
    private final TeacherPanel teacherPanel;
    private final JLabel statusLabel = new JLabel("Sẵn sàng.");
    private final JLabel userLabel = new JLabel();
    private final JLabel roleLabel = new JLabel();

    public MainFrame(AuthService auth) {
        super("ScheduleSolver - Xếp thời khóa biểu khoa CNTT");
        this.auth = auth;
        setSize(1380, 860);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                exitApplication();
            }
        });
        setJMenuBar(createMenuBar());

        JPanel top = new JPanel(new BorderLayout());
        top.add(createHeader(), BorderLayout.NORTH);
        top.add(createToolBar(), BorderLayout.SOUTH);
        add(top, BorderLayout.NORTH);

        teacherPanel = new TeacherPanel(this);
        addPanel(Role.TRUONG_KHOA, new DeanPanel(this));
        addPanel(Role.GIAO_VU, new StaffPanel(this));
        addPanel(Role.GIANG_VIEN, teacherPanel);
        add(center, BorderLayout.CENTER);

        statusLabel.setBorder(BorderFactory.createEmptyBorder(5, 10, 5, 10));
        statusLabel.setForeground(Theme.NEUTRAL);
        add(statusLabel, BorderLayout.SOUTH);
        loadDefaultData();
    }

    private void addPanel(Role role, BasePanel panel) {
        panels.add(panel);
        center.add(panel, role.name());
    }

    private JPanel createHeader() {
        JPanel header = new JPanel(new BorderLayout());
        header.setBackground(Theme.PRIMARY_DARK);
        header.setBorder(BorderFactory.createEmptyBorder(10, 16, 10, 16));

        JPanel titles = new JPanel(new GridLayout(2, 1));
        titles.setOpaque(false);
        JLabel title = new JLabel("ScheduleSolver");
        title.setFont(Theme.TITLE);
        title.setForeground(Color.WHITE);
        roleLabel.setForeground(new Color(191, 219, 254));
        titles.add(title);
        titles.add(roleLabel);
        header.add(titles, BorderLayout.WEST);

        JPanel user = new JPanel(new FlowLayout(FlowLayout.RIGHT, 12, 6));
        user.setOpaque(false);
        userLabel.setForeground(Color.WHITE);
        userLabel.setFont(Theme.BOLD);
        JButton logoutButton = Theme.button("Đăng xuất", Theme.DANGER);
        logoutButton.addActionListener(e -> logout());
        user.add(userLabel);
        user.add(logoutButton);
        header.add(user, BorderLayout.EAST);
        return header;
    }

    private JToolBar createToolBar() {
        JToolBar toolBar = new JToolBar();
        toolBar.setFloatable(false);
        toolBar.setBackground(Theme.CARD);
        toolBar.setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, Theme.BORDER));
        JButton openButton = Theme.button("Mở dự án", Theme.NEUTRAL);
        JButton saveButton = Theme.button("Lưu dự án", Theme.SUCCESS);
        JButton saveAsButton = Theme.button("Lưu thành...", Theme.NEUTRAL);
        openButton.addActionListener(e -> openProject());
        saveButton.addActionListener(e -> saveProject(false));
        saveAsButton.addActionListener(e -> saveProject(true));
        toolBar.add(openButton);
        toolBar.addSeparator();
        toolBar.add(saveButton);
        toolBar.addSeparator();
        toolBar.add(saveAsButton);
        return toolBar;
    }

    private JMenuBar createMenuBar() {
        JMenu fileMenu = new JMenu("Tệp");
        JMenuItem newItem = new JMenuItem("Dự án mới");
        JMenuItem openItem = new JMenuItem("Mở dự án...");
        JMenuItem saveItem = new JMenuItem("Lưu dự án");
        JMenuItem saveAsItem = new JMenuItem("Lưu thành...");
        JMenuItem logoutItem = new JMenuItem("Đăng xuất");
        JMenuItem exitItem = new JMenuItem("Thoát");
        newItem.addActionListener(e -> newProject());
        openItem.addActionListener(e -> openProject());
        saveItem.addActionListener(e -> saveProject(false));
        saveAsItem.addActionListener(e -> saveProject(true));
        logoutItem.addActionListener(e -> logout());
        exitItem.addActionListener(e -> exitApplication());
        fileMenu.add(newItem);
        fileMenu.add(openItem);
        fileMenu.add(saveItem);
        fileMenu.add(saveAsItem);
        fileMenu.addSeparator();
        fileMenu.add(logoutItem);
        fileMenu.add(exitItem);

        JMenu helpMenu = new JMenu("Trợ giúp");
        JMenuItem aboutItem = new JMenuItem("Giới thiệu");
        aboutItem.addActionListener(e -> JOptionPane.showMessageDialog(this,
                "ScheduleSolver - Đồ án Java Software Development\n"
                        + "Xếp thời khóa biểu gọn cho giảng viên bằng Local Search, Simulated Annealing,\n"
                        + "Tabu Search chạy song song trên nhiều luồng.",
                "Giới thiệu", JOptionPane.INFORMATION_MESSAGE));
        helpMenu.add(aboutItem);

        JMenuBar bar = new JMenuBar();
        bar.add(fileMenu);
        bar.add(helpMenu);
        return bar;
    }

    private void loadDefaultData() {
        File teacherFile = new File(RESOURCES, "giang_vien.csv");
        File ruleFile = new File(RESOURCES, "quy_uoc_phan_cong.csv");
        File externalFile = new File(RESOURCES, "lich_truong_khac.csv");
        try {
            if (teacherFile.exists()) {
                workspace.getTeachers().addAll(DataFiles.readTeachers(teacherFile));
            }
            if (ruleFile.exists()) {
                workspace.getRules().addAll(DataFiles.readRules(ruleFile));
            }
            if (externalFile.exists()) {
                workspace.getExternalSessions().addAll(DataFiles.readExternalSessions(externalFile));
            }
            Sorting.sortWorkspace(workspace);
            setStatus("Đã nạp " + workspace.getTeachers().size() + " giảng viên, "
                    + workspace.getRules().size() + " dòng quy ước phân công và "
                    + workspace.getExternalSessions().size() + " buổi dạy ở trường khác từ thư mục resources.");
        } catch (IOException e) {
            JOptionPane.showMessageDialog(this, "Không đọc được dữ liệu mặc định: " + e.getMessage(),
                    "Lỗi", JOptionPane.ERROR_MESSAGE);
        }
    }

    /** Trả về false nếu bấm Thoát. */
    public boolean showLogin() {
        try {
            // tạo tài khoản cho giảng viên mới thêm (nếu chưa có)
            auth.ensureDefaultAccounts(workspace.getTeachers());
        } catch (IOException e) {
            JOptionPane.showMessageDialog(this, "Không ghi được file tài khoản: " + e.getMessage(),
                    "Lỗi", JOptionPane.ERROR_MESSAGE);
        }
        Account loggedIn = new LoginDialog(this, auth).showDialog();
        if (loggedIn == null) {
            return false;
        }
        Account account = loggedIn;
        String name = account.getRole().getDisplayName();
        if (account.getRole() == Role.GIANG_VIEN) {
            Teacher teacher = workspace.findTeacher(account.getTeacherCode());
            name = teacher == null || teacher.getFullName().isEmpty() ? account.getTeacherCode() : teacher.getFullName();
            teacherPanel.setTeacher(account.getTeacherCode());
        }
        userLabel.setText("Xin chào, " + name);
        roleLabel.setText("Vai trò: " + account.getRole().getDisplayName());
        cards.show(center, account.getRole().name());
        refreshAll();
        return true;
    }

    /** Đăng xuất nhưng giữ nguyên dữ liệu cho người sau đăng nhập. */
    private void logout() {
        setVisible(false);
        while (!showLogin()) {
            if (confirmDiscard()) {
                dispose();
                System.exit(0);
            }
        }
        setVisible(true);
    }

    public Workspace getWorkspace() {
        return workspace;
    }

    public void markChanged() {
        changed = true;
        updateTitle();
    }

    public void setStatus(String text) {
        statusLabel.setText(text);
    }

    public void refreshAll() {
        Sorting.sortWorkspace(workspace);
        for (BasePanel panel : panels) {
            panel.refresh();
        }
    }

    private void updateTitle() {
        String name = projectFile == null ? "Dự án mới" : projectFile.getName();
        setTitle("ScheduleSolver - " + name + (changed ? " *" : ""));
    }

    /** Chạy việc nặng (đọc/ghi Excel) trên luồng riêng cho giao diện không bị treo, xong thì invokeLater về luồng giao diện. */
    public <T> void runInBackground(String message, Callable<T> work, Consumer<T> onSuccess) {
        setStatus(message + "...");
        setCursor(Cursor.getPredefinedCursor(Cursor.WAIT_CURSOR));
        Thread thread = new Thread(() -> {
            try {
                T result = work.call();
                SwingUtilities.invokeLater(() -> {
                    setCursor(Cursor.getDefaultCursor());
                    setStatus(message + ": xong.");
                    onSuccess.accept(result);
                });
            } catch (Exception e) {
                SwingUtilities.invokeLater(() -> {
                    setCursor(Cursor.getDefaultCursor());
                    setStatus(message + ": lỗi.");
                    JOptionPane.showMessageDialog(this, e.getMessage(), "Lỗi", JOptionPane.ERROR_MESSAGE);
                });
            }
        }, "background-io");
        thread.start();
    }

    private void newProject() {
        if (!confirmDiscard()) {
            return;
        }
        workspace = new Workspace();
        projectFile = null;
        loadDefaultData();
        changed = false;
        updateTitle();
        refreshAll();
    }

    private void openProject() {
        if (!confirmDiscard()) {
            return;
        }
        JFileChooser chooser = projectChooser();
        if (chooser.showOpenDialog(this) != JFileChooser.APPROVE_OPTION) {
            return;
        }
        File file = chooser.getSelectedFile();
        try {
            workspace = WorkspaceFile.load(file);
            projectFile = file;
            changed = false;
            updateTitle();
            refreshAll();
            setStatus("Đã mở " + file.getName());
        } catch (IOException e) {
            JOptionPane.showMessageDialog(this, "Không mở được dự án: " + e.getMessage(), "Lỗi", JOptionPane.ERROR_MESSAGE);
        }
    }

    /** askName = true thì hỏi tên file mới; trả về false nếu hủy hoặc lưu lỗi. */
    private boolean saveProject(boolean askName) {
        File file = projectFile;
        if (askName || file == null) {
            JFileChooser chooser = projectChooser();
            chooser.setSelectedFile(new File("thoikhoabieu" + WorkspaceFile.EXTENSION));
            if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) {
                return false;
            }
            file = chooser.getSelectedFile();
            if (!file.getName().endsWith(WorkspaceFile.EXTENSION)) {
                file = new File(file.getPath() + WorkspaceFile.EXTENSION);
            }
        }
        try {
            WorkspaceFile.save(file, workspace);
            projectFile = file;
            changed = false;
            updateTitle();
            setStatus("Đã lưu " + file.getName());
            return true;
        } catch (IOException e) {
            JOptionPane.showMessageDialog(this, "Không lưu được: " + e.getMessage(), "Lỗi", JOptionPane.ERROR_MESSAGE);
            return false;
        }
    }

    private JFileChooser projectChooser() {
        JFileChooser chooser = new JFileChooser(new File("."));
        chooser.setFileFilter(new FileNameExtensionFilter("Dự án ScheduleSolver (*.ssp)", "ssp"));
        return chooser;
    }

    private boolean confirmDiscard() {
        if (!changed) {
            return true;
        }
        int answer = JOptionPane.showConfirmDialog(this, "Dự án có thay đổi chưa lưu. Lưu trước khi tiếp tục?",
                "Chưa lưu", JOptionPane.YES_NO_CANCEL_OPTION);
        if (answer == JOptionPane.YES_OPTION) {
            return saveProject(false);
        }
        return answer == JOptionPane.NO_OPTION;
    }

    private void exitApplication() {
        if (confirmDiscard()) {
            dispose();
            System.exit(0);
        }
    }
}
