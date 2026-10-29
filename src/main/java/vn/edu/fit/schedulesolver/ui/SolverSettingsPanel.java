package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.GridLayout;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JSpinner;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;
import vn.edu.fit.schedulesolver.solver.Algorithm;
import vn.edu.fit.schedulesolver.solver.SolverConfig;

/** Các ô cấu hình bộ giải của giáo vụ: thuật toán, số luồng, thời gian, seed và chế độ chạy tái lập. */
public class SolverSettingsPanel extends JPanel {
    private static final int LABEL_WIDTH = 128;

    private final JComboBox<Algorithm> algorithmBox = new JComboBox<>(Algorithm.values());
    // mặc định 8 luồng, máy ít nhân hơn thì lấy theo số nhân
    private final JSpinner threadSpinner = new JSpinner(new SpinnerNumberModel(
            Math.min(8, Runtime.getRuntime().availableProcessors()), 1, 32, 1));
    private final JSpinner secondSpinner = new JSpinner(new SpinnerNumberModel(10, 1, 600, 1));
    private final JTextField seedField = new JTextField("42", 6);
    // chế độ tái lập: dừng theo số bước thử thay vì theo giờ
    private final JCheckBox deterministicBox = new JCheckBox("Chạy tái lập");
    private final JSpinner iterationSpinner = new JSpinner(new SpinnerNumberModel(1_000_000, 10_000, 50_000_000, 100_000));

    public SolverSettingsPanel() {
        super(new GridLayout(0, 1, 6, 6));
        add(row("Thuật toán:", algorithmBox));
        add(row("Số luồng:", threadSpinner));
        add(row("Thời gian (giây):", secondSpinner));
        add(row("Seed:", seedField));
        JLabel same = new JLabel("cùng seed → cùng kết quả");
        same.setFont(Theme.SMALL);
        same.setForeground(Theme.MUTED_TEXT);
        JPanel deterministicRow = new JPanel(new BorderLayout(6, 0));
        deterministicRow.add(deterministicBox, BorderLayout.WEST);
        deterministicRow.add(same, BorderLayout.CENTER);
        add(deterministicRow);
        add(row("Số bước thử/luồng:", iterationSpinner));
        iterationSpinner.setEnabled(false);
        deterministicBox.addActionListener(e -> {
            iterationSpinner.setEnabled(deterministicBox.isSelected());
            secondSpinner.setEnabled(!deterministicBox.isSelected());
        });
        deterministicBox.setToolTipText("<html>Dừng theo số bước thử thay vì theo đồng hồ: cùng seed, số luồng và số bước<br>"
                + "thì kết quả luôn giống hệt, dùng khi cần kiểm tra lại hoặc ghi vào báo cáo.<br>"
                + "Chạy theo thời gian thì máy nhanh, chậm thử được số bước khác nhau nên kết quả có thể khác.</html>");
        iterationSpinner.setToolTipText("<html>Mỗi luồng thử đúng chừng này bước di chuyển (Tabu thử 50 bước mỗi vòng).<br>"
                + "Cùng số bước thì máy nào cũng ra cùng kết quả, chỉ khác thời gian chạy.</html>");
        algorithmBox.setSelectedItem(Algorithm.PORTFOLIO);
        algorithmBox.setToolTipText("<html>Leo đồi, Simulated Annealing, Tabu Search: 3 thuật toán thầy đề xuất, chọn riêng để so sánh.<br>"
                + "Kết hợp cả 3 (mặc định): mỗi luồng chạy một thuật toán, cuối cùng lấy lời giải tốt nhất.</html>");
        threadSpinner.setToolTipText("<html>Số luồng chạy song song, nên bằng số nhân CPU (tối đa 8 là đủ).<br>"
                + "Để 1 là chạy tuần tự, dùng khi muốn so sánh tuần tự với song song.</html>");
        secondSpinner.setToolTipText("Thời gian tìm kiếm: 10 giây là đủ cho kế hoạch khoảng 236 buổi, muốn kỹ hơn thì để 30 giây.");
        seedField.setToolTipText("<html>Số khởi đầu cho phần ngẫu nhiên của thuật toán. Giữ nguyên seed thì kết quả gần như lặp lại;<br>"
                + "đổi seed để thử thêm một phương án khác rồi chọn phương án tốt hơn.</html>");
    }

    /** Một dòng "nhãn: ô nhập", nhãn rộng cố định để ô nhập (nhất là ô chọn thuật toán) không bị cắt chữ. */
    private static JPanel row(String label, JComponent field) {
        JLabel text = new JLabel(label);
        text.setPreferredSize(new Dimension(LABEL_WIDTH, text.getPreferredSize().height));
        JPanel row = new JPanel(new BorderLayout(6, 0));
        row.add(text, BorderLayout.WEST);
        row.add(field, BorderLayout.CENTER);
        return row;
    }

    /** Seed đang nhập; không phải số nguyên thì ném NumberFormatException. */
    public long getSeed() {
        return Long.parseLong(seedField.getText().trim());
    }

    /** Tạo cấu hình từ các ô nhập; chế độ tái lập thì giới hạn theo số bước thử, không theo giờ. */
    public SolverConfig createConfig() {
        long seed = getSeed();
        Algorithm algorithm = (Algorithm) algorithmBox.getSelectedItem();
        int threads = (Integer) threadSpinner.getValue();
        if (deterministicBox.isSelected()) {
            return new SolverConfig(algorithm, threads, 0, (Integer) iterationSpinner.getValue(), seed);
        }
        return new SolverConfig(algorithm, threads, (Integer) secondSpinner.getValue() * 1000L, 0, seed);
    }

    /** Đang giải thì khóa ô chế độ để báo cáo ghi đúng chế độ của lần chạy. */
    public void setRunning(boolean running) {
        deterministicBox.setEnabled(!running);
    }
}
