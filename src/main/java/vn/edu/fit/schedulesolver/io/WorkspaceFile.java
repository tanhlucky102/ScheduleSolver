package vn.edu.fit.schedulesolver.io;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import vn.edu.fit.schedulesolver.model.Workspace;

/** Lưu và mở cả dự án ra file .ssp bằng Object Serialization. */
public final class WorkspaceFile {
    public static final String EXTENSION = ".ssp";

    private WorkspaceFile() {
    }

    public static void save(File file, Workspace workspace) throws IOException {
        try (ObjectOutputStream output = new ObjectOutputStream(
                new BufferedOutputStream(new FileOutputStream(file)))) {
            output.writeObject(workspace);
        }
    }

    public static Workspace load(File file) throws IOException {
        try (ObjectInputStream input = new ObjectInputStream(
                new BufferedInputStream(new FileInputStream(file)))) {
            Object data = input.readObject();
            if (!(data instanceof Workspace)) {
                throw new IOException("File không phải dự án ScheduleSolver.");
            }
            return (Workspace) data;
        } catch (ClassNotFoundException e) {
            throw new IOException("File dự án được tạo bởi phiên bản khác của chương trình.", e);
        }
    }
}
