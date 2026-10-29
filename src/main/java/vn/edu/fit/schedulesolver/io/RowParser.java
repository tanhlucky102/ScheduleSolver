package vn.edu.fit.schedulesolver.io;

/** Đổi một dòng CSV (đã tách cột) thành đối tượng; dòng sai thì ném IllegalArgumentException. */
public interface RowParser<T> {
    T parse(String[] row);
}
