package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import vn.edu.fit.schedulesolver.model.Account;
import vn.edu.fit.schedulesolver.service.AuthService;

/** Hộp thoại đăng nhập, bấm Enter cũng là đăng nhập. */
public class LoginDialog extends JDialog {
    private final AuthService auth;
    private final JTextField usernameField = new JTextField(18);
    private final JPasswordField passwordField = new JPasswordField(18);
    private final JLabel messageLabel = new JLabel(" ");
    private Account result;

    public LoginDialog(JFrame owner, AuthService auth) {
        super(owner, "Đăng nhập - ScheduleSolver", true);
        this.auth = auth;

        JPanel banner = new JPanel(new GridLayout(2, 1));
        banner.setBackground(Theme.PRIMARY_DARK);
        banner.setBorder(BorderFactory.createEmptyBorder(16, 20, 16, 20));
        JLabel title = new JLabel("ScheduleSolver");
        title.setFont(Theme.TITLE);
        title.setForeground(Color.WHITE);
        JLabel subtitle = new JLabel("Xếp thời khóa biểu - Khoa CNTT, Đại học Hà Nội");
        subtitle.setForeground(new Color(191, 219, 254));
        banner.add(title);
        banner.add(subtitle);

        JPanel form = new JPanel(new GridLayout(0, 1, 4, 4));
        form.setBackground(Theme.CARD);
        form.setBorder(BorderFactory.createEmptyBorder(16, 20, 8, 20));
        form.add(new JLabel("Tên đăng nhập"));
        form.add(usernameField);
        form.add(new JLabel("Mật khẩu"));
        form.add(passwordField);
        messageLabel.setForeground(Theme.DANGER);
        form.add(messageLabel);

        JLabel hint = new JLabel("<html>Tài khoản demo, mật khẩu <b>" + AuthService.DEFAULT_PASSWORD + "</b>:<br>"
                + AuthService.DEAN_USERNAME + " (Trưởng khoa) · " + AuthService.STAFF_USERNAME + " (Giáo vụ)<br>"
                + "Giảng viên: mã GV viết thường, ví dụ ngant</html>");
        hint.setFont(Theme.SMALL);
        hint.setForeground(Theme.MUTED_TEXT);

        JButton loginButton = Theme.button("Đăng nhập", Theme.PRIMARY);
        JButton exitButton = Theme.button("Thoát", Theme.NEUTRAL);
        loginButton.addActionListener(e -> tryLogin());
        exitButton.addActionListener(e -> dispose());
        getRootPane().setDefaultButton(loginButton);

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        buttons.setBackground(Theme.CARD);
        buttons.add(exitButton);
        buttons.add(loginButton);

        JPanel bottom = new JPanel(new BorderLayout());
        bottom.setBackground(Theme.CARD);
        bottom.setBorder(BorderFactory.createEmptyBorder(0, 20, 12, 12));
        bottom.add(hint, BorderLayout.CENTER);
        bottom.add(buttons, BorderLayout.SOUTH);

        setLayout(new BorderLayout());
        add(banner, BorderLayout.NORTH);
        add(form, BorderLayout.CENTER);
        add(bottom, BorderLayout.SOUTH);
        setDefaultCloseOperation(JDialog.DISPOSE_ON_CLOSE);
        pack();
        setResizable(false);
        setLocationRelativeTo(owner);
    }

    private void tryLogin() {
        String password = new String(passwordField.getPassword());
        Account account = auth.login(usernameField.getText(), password);
        if (account == null) {
            messageLabel.setText("Sai tên đăng nhập hoặc mật khẩu.");
            passwordField.setText("");
            passwordField.requestFocusInWindow();
            return;
        }
        result = account;
        dispose();
    }

    /** Hộp thoại modal nên setVisible chờ tới khi đóng; trả về null nếu bấm Thoát. */
    public Account showDialog() {
        setVisible(true);
        return result;
    }
}
