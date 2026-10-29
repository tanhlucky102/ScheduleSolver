package vn.edu.fit.schedulesolver.io;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InvalidClassException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.StreamCorruptedException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import vn.edu.fit.schedulesolver.model.Workspace;

/** Lưu và mở cả dự án ra file .ssp bằng Object Serialization. */
public final class WorkspaceFile {
    public static final String EXTENSION = ".ssp";

    private WorkspaceFile() {
    }

    /** Ghi ra file tạm trước rồi mới thay file cũ, lỗi giữa chừng thì file dự án cũ vẫn còn nguyên. */
    public static void save(File file, Workspace workspace) throws IOException {
        File temp = new File(file.getPath() + ".tmp");
        try (FileOutputStream fileOutput = new FileOutputStream(temp);
             ObjectOutputStream output = new ObjectOutputStream(new BufferedOutputStream(fileOutput))) {
            output.writeObject(workspace);
        }
        Files.move(temp.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING);
    }

    public static Workspace load(File file) throws IOException {
        Object data;
        // mở FileInputStream riêng: nếu file không phải dự án thì ObjectInputStream báo lỗi ngay
        // khi tạo, khai báo riêng thì file vẫn được đóng
        try (FileInputStream fileInput = new FileInputStream(file);
             ObjectInputStream input = new ObjectInputStream(new BufferedInputStream(fileInput))) {
            data = input.readObject();
        } catch (InvalidClassException e) {
            // serialVersionUID không khớp: lớp đã bị đổi theo cách không tương thích
            throw new IOException("File dự án không tương thích với phiên bản này (lớp " + e.classname
                    + " đã thay đổi).", e);
        } catch (StreamCorruptedException e) {
            throw new IOException("File không phải dự án ScheduleSolver hoặc đã bị hỏng.", e);
        } catch (ClassNotFoundException e) {
            throw new IOException("File dự án được tạo bởi phiên bản khác của chương trình.", e);
        }
        if (!(data instanceof Workspace)) {
            throw new IOException("File không phải dự án ScheduleSolver.");
        }
        Workspace workspace = (Workspace) data;
        try {
            workspace.upgradeAfterLoad();
        } catch (IllegalStateException e) {
            throw new IOException(e.getMessage(), e);
        }
        return workspace;
    }
}
