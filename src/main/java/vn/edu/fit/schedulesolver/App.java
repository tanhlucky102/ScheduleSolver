package vn.edu.fit.schedulesolver;

import java.io.IOException;
import javax.swing.JOptionPane;
import javax.swing.SwingUtilities;
import vn.edu.fit.schedulesolver.service.AuthService;
import vn.edu.fit.schedulesolver.ui.MainFrame;
import vn.edu.fit.schedulesolver.ui.Theme;

/** Hàm main: chạy trên luồng giao diện của Swing, đăng nhập xong mới hiện cửa sổ chính. */
public class App {

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            Theme.install();
            AuthService auth;
            try {
                auth = new AuthService(MainFrame.ACCOUNT_FILE);
            } catch (IOException e) {
                JOptionPane.showMessageDialog(null, "Không đọc được file tài khoản: " + e.getMessage(),
                        "Lỗi", JOptionPane.ERROR_MESSAGE);
                return;
            }
            MainFrame frame = new MainFrame(auth);
            if (frame.showLogin()) {
                frame.setVisible(true);
            } else {
                System.exit(0);
            }
        });
    }
}
