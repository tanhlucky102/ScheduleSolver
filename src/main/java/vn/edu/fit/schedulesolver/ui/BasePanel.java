package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.event.ActionListener;
import java.io.File;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JTable;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableModel;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.service.Sorting;

/** Lớp cha của màn hình 3 vai trò, MainFrame chỉ cần gọi refresh() cho từng màn hình (đa hình). */
public abstract class BasePanel extends JPanel {
    protected final MainFrame frame;

    protected BasePanel(MainFrame frame) {
        super(new BorderLayout(8, 8));
        this.frame = frame;
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
    }

    /** Nạp lại dữ liệu từ Workspace lên màn hình. */
    public abstract void refresh();

    protected Workspace workspace() {
        return frame.getWorkspace();
    }

    /** Gọi sau khi sửa dữ liệu: xếp lại A-Z, đánh dấu chưa lưu rồi vẽ lại. */
    protected void dataChanged() {
        Sorting.sortWorkspace(workspace());
        frame.markChanged();
        refresh();
    }

    protected JButton createButton(String text, ActionListener listener) {
        return createButton(text, Theme.PRIMARY, listener);
    }

    protected JButton createButton(String text, Color color, ActionListener listener) {
        JButton button = Theme.button(text, color);
        button.addActionListener(listener);
        return button;
    }

    protected static JTable createTable(TableModel model) {
        JTable table = new JTable(model);
        Theme.styleTable(table);
        return table;
    }

    /** Đổi về chỉ số trong model vì bảng có thể đã được sắp xếp lại. */
    protected static int selectedModelRow(JTable table) {
        int row = table.getSelectedRow();
        if (row < 0) {
            return -1;
        }
        return table.convertRowIndexToModel(row);
    }

    protected static DefaultTableModel readOnlyModel(String... columns) {
        return new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }

            // để cột số được sắp xếp theo số chứ không theo chữ
            @Override
            public Class<?> getColumnClass(int column) {
                if (getRowCount() > 0 && getValueAt(0, column) != null) {
                    return getValueAt(0, column).getClass();
                }
                return Object.class;
            }
        };
    }

    /** Trả về null nếu bấm Hủy. */
    protected File chooseCsv(boolean save, String defaultName) {
        JFileChooser chooser = new JFileChooser(MainFrame.RESOURCES);
        chooser.setFileFilter(new FileNameExtensionFilter("File CSV (*.csv)", "csv"));
        chooser.setSelectedFile(new File(MainFrame.RESOURCES, defaultName));
        int result = save ? chooser.showSaveDialog(this) : chooser.showOpenDialog(this);
        if (result != JFileChooser.APPROVE_OPTION) {
            return null;
        }
        return chooser.getSelectedFile();
    }

    protected void showError(String message) {
        JOptionPane.showMessageDialog(this, message, "Lỗi", JOptionPane.ERROR_MESSAGE);
    }

    protected void showInfo(String message) {
        JOptionPane.showMessageDialog(this, message, "Thông báo", JOptionPane.INFORMATION_MESSAGE);
    }
}
