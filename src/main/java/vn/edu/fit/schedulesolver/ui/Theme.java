package vn.edu.fit.schedulesolver.ui;

import java.awt.Color;
import java.awt.Component;
import java.awt.Cursor;
import java.awt.Font;
import java.awt.FontMetrics;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JTable;
import javax.swing.RowSorter;
import javax.swing.SortOrder;
import javax.swing.UIManager;
import javax.swing.border.Border;
import javax.swing.border.TitledBorder;
import javax.swing.table.DefaultTableCellRenderer;
import vn.edu.fit.schedulesolver.model.Program;

/** Màu, font và các hàm trang trí dùng chung cho mọi màn hình. */
public final class Theme {
    // màu chính
    public static final Color PRIMARY = new Color(37, 99, 235);
    public static final Color PRIMARY_DARK = new Color(30, 58, 138);
    public static final Color SUCCESS = new Color(22, 163, 74);
    public static final Color DANGER = new Color(220, 38, 38);
    public static final Color WARNING = new Color(217, 119, 6);
    public static final Color NEUTRAL = new Color(71, 85, 105);

    // màu nền và chữ
    public static final Color BACKGROUND = new Color(241, 245, 249);
    public static final Color CARD = Color.WHITE;
    public static final Color STRIPE = new Color(248, 250, 252);
    public static final Color BORDER = new Color(203, 213, 225);
    public static final Color SELECTION = new Color(191, 219, 254);
    public static final Color TEXT = new Color(15, 23, 42);
    public static final Color MUTED_TEXT = new Color(100, 116, 139);

    // màu ô trên lưới TKB
    public static final Color BUSY_FILL = new Color(254, 243, 199);
    public static final Color BUSY_ACCENT = new Color(217, 119, 6);
    public static final Color CONFLICT_FILL = new Color(254, 202, 202);
    public static final Color EXTERNAL_FILL = new Color(204, 251, 241);
    public static final Color EXTERNAL_ACCENT = new Color(13, 148, 136);
    public static final Color CONFLICT_ACCENT = new Color(220, 38, 38);

    public static final Font NORMAL = new Font("Segoe UI", Font.PLAIN, 13);
    public static final Font BOLD = new Font("Segoe UI", Font.BOLD, 13);
    public static final Font TITLE = new Font("Segoe UI", Font.BOLD, 20);
    public static final Font SMALL = new Font("Segoe UI", Font.PLAIN, 11);

    private Theme() {
    }

    /** Đặt font, màu mặc định cho Swing, gọi một lần trước khi tạo cửa sổ. */
    public static void install() {
        String[] fontKeys = {
            "Label.font", "Button.font", "ComboBox.font", "TextField.font", "PasswordField.font",
            "Table.font", "TabbedPane.font", "CheckBox.font", "Spinner.font", "TextArea.font",
            "List.font", "Menu.font", "MenuItem.font", "MenuBar.font", "ToolTip.font",
            "OptionPane.messageFont", "OptionPane.buttonFont", "ProgressBar.font", "FormattedTextField.font"
        };
        for (String key : fontKeys) {
            UIManager.put(key, NORMAL);
        }
        UIManager.put("TableHeader.font", BOLD);
        UIManager.put("TitledBorder.font", BOLD);
        UIManager.put("Panel.background", BACKGROUND);
        UIManager.put("OptionPane.background", BACKGROUND);
        UIManager.put("TabbedPane.selected", CARD);
        UIManager.put("ProgressBar.foreground", SUCCESS);
        UIManager.put("Table.selectionBackground", SELECTION);
        UIManager.put("Table.selectionForeground", TEXT);
    }

    public static JButton button(String text, Color color) {
        JButton button = new JButton(text);
        button.setBackground(color);
        button.setForeground(Color.WHITE);
        button.setFont(BOLD);
        button.setFocusPainted(false);
        button.setBorder(BorderFactory.createEmptyBorder(7, 14, 7, 14));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        return button;
    }

    public static Border titled(String title) {
        TitledBorder titled = BorderFactory.createTitledBorder(BorderFactory.createLineBorder(BORDER), title);
        titled.setTitleColor(PRIMARY_DARK);
        titled.setTitleFont(BOLD);
        return BorderFactory.createCompoundBorder(titled, BorderFactory.createEmptyBorder(4, 6, 6, 6));
    }

    public static void card(JComponent component) {
        component.setBackground(CARD);
        component.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(BORDER), BorderFactory.createEmptyBorder(8, 8, 8, 8)));
    }

    public static JLabel legend(String text, Color fill, Color accent) {
        JLabel label = new JLabel(" " + text + " ");
        label.setOpaque(true);
        label.setBackground(fill);
        label.setForeground(TEXT);
        label.setFont(SMALL);
        label.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(0, 4, 0, 0, accent), BorderFactory.createEmptyBorder(2, 4, 2, 4)));
        return label;
    }

    /** Cắt bớt chữ cho vừa ô, thêm "..." ở cuối. */
    public static String fit(String text, FontMetrics metrics, int maxWidth) {
        if (metrics.stringWidth(text) <= maxWidth) {
            return text;
        }
        String result = text;
        while (result.length() > 1 && metrics.stringWidth(result + "...") > maxWidth) {
            result = result.substring(0, result.length() - 1);
        }
        return result + "...";
    }

    public static Color programFill(Program program) {
        switch (program) {
            case DAI_TRA:
                return new Color(219, 234, 254);
            case MME:
                return new Color(237, 233, 254);
            case CLC:
                return new Color(255, 237, 213);
            default:
                return new Color(209, 250, 229);
        }
    }

    /** Màu vạch bên trái ô, đậm hơn màu nền. */
    public static Color programAccent(Program program) {
        switch (program) {
            case DAI_TRA:
                return PRIMARY;
            case MME:
                return new Color(124, 58, 237);
            case CLC:
                return new Color(234, 88, 12);
            default:
                return new Color(5, 150, 105);
        }
    }

    /** Trang trí bảng và cho bấm tiêu đề cột để sắp xếp. */
    public static void styleTable(JTable table) {
        table.setRowHeight(26);
        table.setShowVerticalLines(false);
        table.setGridColor(BORDER);
        table.setFillsViewportHeight(true);
        table.setAutoCreateRowSorter(true);
        table.setDefaultRenderer(Object.class, new StripedRenderer());
        table.setDefaultRenderer(Number.class, new StripedRenderer());
        table.getTableHeader().setDefaultRenderer(new HeaderRenderer());
        table.getTableHeader().setReorderingAllowed(false);
    }

    private static class StripedRenderer extends DefaultTableCellRenderer {
        @Override
        public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                       boolean hasFocus, int row, int column) {
            super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
            if (!isSelected) {
                setBackground(row % 2 == 0 ? CARD : STRIPE);
                setForeground(TEXT);
            }
            // ô hẹp bị cắt chữ thì rê chuột vào vẫn đọc được đủ
            setToolTipText(value == null || value.toString().isEmpty() ? null : value.toString());
            setBorder(BorderFactory.createEmptyBorder(0, 8, 0, 8));
            return this;
        }
    }

    /** Tiêu đề cột, thêm mũi tên ở cột đang sắp xếp. */
    private static class HeaderRenderer extends DefaultTableCellRenderer {
        @Override
        public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                       boolean hasFocus, int row, int column) {
            String text = value == null ? "" : value.toString();
            if (table != null && table.getRowSorter() != null) {
                for (RowSorter.SortKey key : table.getRowSorter().getSortKeys()) {
                    if (key.getColumn() == table.convertColumnIndexToModel(column)) {
                        text = text + (key.getSortOrder() == SortOrder.ASCENDING ? "  ▲" : "  ▼");
                    }
                }
            }
            super.getTableCellRendererComponent(table, text, isSelected, hasFocus, row, column);
            setBackground(PRIMARY_DARK);
            setForeground(Color.WHITE);
            setFont(BOLD);
            setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createMatteBorder(0, 0, 0, 1, PRIMARY), BorderFactory.createEmptyBorder(6, 8, 6, 8)));
            return this;
        }
    }
}
