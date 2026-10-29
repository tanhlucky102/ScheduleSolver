package vn.edu.fit.schedulesolver.ui;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.FlowLayout;
import java.awt.event.ActionListener;
import java.io.File;
import java.util.regex.Pattern;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.JTable;
import javax.swing.RowFilter;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableModel;
import javax.swing.table.TableRowSorter;
import vn.edu.fit.schedulesolver.model.Workspace;
import vn.edu.fit.schedulesolver.service.Sorting;

/**
 * Lớp cha của màn hình 3 vai trò, MainFrame chỉ cần gọi refresh() cho từng màn
 * hình (đa hình).
 */
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

    protected static JPanel createSearchPanel(String label, JTextField field) {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        panel.add(new JLabel(label));
        panel.add(field);
        return panel;
    }

    protected static void addTableSearch(JTextField field, JTable table) {
        TableRowSorter<TableModel> sorter = new TableRowSorter<>(table.getModel());
        table.setRowSorter(sorter);
        field.getDocument().addDocumentListener(new DocumentListener() {
            private void updateFilter() {
                String query = field.getText().trim();
                sorter.setRowFilter(query.isEmpty()
                        ? null
                        : RowFilter.regexFilter("(?iu)" + Pattern.quote(query)));
            }

            @Override
            public void insertUpdate(DocumentEvent event) {
                updateFilter();
            }

            @Override
            public void removeUpdate(DocumentEvent event) {
                updateFilter();
            }

            @Override
            public void changedUpdate(DocumentEvent event) {
                updateFilter();
            }
        });
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
