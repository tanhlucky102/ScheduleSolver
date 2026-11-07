"use client";
import { useState, type ChangeEvent } from "react";

export type Dept = { id: string; name: string; status: string; note: string };
export type Teacher = {
  id: string;
  name: string;
  department: string;
  assistant: boolean;
  capabilities: Record<string, string[]>;
};
export type Config = {
  soft_weights?: Record<string, number>;
  period_minutes: number;
  break_minutes: number;
  max_periods: number;
  rooms: Record<string, number>;
  slots: { day: number; start: number; end: number; evening: boolean }[];
};

const time = (m: number) =>
  String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const minutes = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

// Helper to parse simple CSV
function parseCSV(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = parts[idx] ?? "";
    });
    return row;
  });
}

export function CatalogEditor({
  disabled,
  initialDepartments,
  initialTeachers,
  onSaveCatalog,
  onSaveDept,
  onDeleteDept,
  onSaveTeacher,
  onDeleteTeacher,
}: {
  disabled: boolean;
  initialDepartments: Dept[];
  initialTeachers: Teacher[];
  onSaveCatalog: (data: { departments: Dept[]; teachers: Teacher[] }) => Promise<void>;
  onSaveDept?: (data: { id: string; name: string }) => Promise<void>;
  onDeleteDept?: (id: string) => Promise<void>;
  onSaveTeacher?: (teacher: Teacher) => Promise<void>;
  onDeleteTeacher?: (id: string) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"depts" | "teachers" | "import">("depts");
  const [deptSearch, setDeptSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherDeptFilter, setTeacherDeptFilter] = useState("");

  // Department Modal / Form State
  const [deptModal, setDeptModal] = useState<{ open: boolean; isEdit: boolean; id: string; name: string }>({
    open: false,
    isEdit: false,
    id: "",
    name: "",
  });

  // Teacher Modal / Form State
  const [teacherModal, setTeacherModal] = useState<{
    open: boolean;
    isEdit: boolean;
    id: string;
    name: string;
    department: string;
    assistant: boolean;
  }>({
    open: false,
    isEdit: false,
    id: "",
    name: "",
    department: initialDepartments[0]?.id || "",
    assistant: false,
  });

  // Import State
  const [importMode, setImportMode] = useState<"dept" | "teacher">("dept");
  const [importPreview, setImportPreview] = useState<{
    valid: unknown[];
    errors: string[];
    summary: string;
  } | null>(null);

  const filteredDepts = initialDepartments.filter(
    (d) =>
      d.id.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.name.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const filteredTeachers = initialTeachers.filter((t) => {
    const matchDept = !teacherDeptFilter || t.department === teacherDeptFilter;
    const matchQuery =
      t.id.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.name.toLowerCase().includes(teacherSearch.toLowerCase());
    return matchDept && matchQuery;
  });

  // Handlers for Department CRUD
  const handleSaveDept = async () => {
    if (!deptModal.id.trim()) return;
    if (onSaveDept) {
      await onSaveDept({ id: deptModal.id.trim(), name: deptModal.name.trim() });
    } else {
      const updated = deptModal.isEdit
        ? initialDepartments.map((d) =>
            d.id === deptModal.id ? { ...d, name: deptModal.name.trim() } : d
          )
        : [...initialDepartments, { id: deptModal.id.trim(), name: deptModal.name.trim(), status: "UNSENT", note: "" }];
      await onSaveCatalog({ departments: updated, teachers: initialTeachers });
    }
    setDeptModal({ open: false, isEdit: false, id: "", name: "" });
  };

  const handleDeleteDept = async (id: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bộ môn ${id}?`)) return;
    if (onDeleteDept) {
      await onDeleteDept(id);
    } else {
      const updated = initialDepartments.filter((d) => d.id !== id);
      await onSaveCatalog({ departments: updated, teachers: initialTeachers });
    }
  };

  // Handlers for Teacher CRUD
  const handleSaveTeacher = async () => {
    if (!teacherModal.id.trim() || !teacherModal.department) return;
    const existing = initialTeachers.find((t) => t.id === teacherModal.id);
    const item: Teacher = {
      id: teacherModal.id.trim(),
      name: teacherModal.name.trim() || teacherModal.id.trim(),
      department: teacherModal.department,
      assistant: teacherModal.assistant,
      capabilities: existing?.capabilities || {},
    };
    if (onSaveTeacher) {
      await onSaveTeacher(item);
    } else {
      const updated = teacherModal.isEdit
        ? initialTeachers.map((t) => (t.id === item.id ? item : t))
        : [...initialTeachers, item];
      await onSaveCatalog({ departments: initialDepartments, teachers: updated });
    }
    setTeacherModal({ open: false, isEdit: false, id: "", name: "", department: initialDepartments[0]?.id || "", assistant: false });
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa giảng viên ${id}?`)) return;
    if (onDeleteTeacher) {
      await onDeleteTeacher(id);
    } else {
      const updated = initialTeachers.filter((t) => t.id !== id);
      await onSaveCatalog({ departments: initialDepartments, teachers: updated });
    }
  };

  // Handlers for Import
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportPreview(null);
    const text = await file.text();

    if (importMode === "dept") {
      let rawList: Record<string, string>[] = [];
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          rawList = Array.isArray(parsed) ? parsed : parsed.departments || [];
        } catch {
          setImportPreview({ valid: [], errors: ["Định dạng JSON không hợp lệ"], summary: "" });
          return;
        }
      } else {
        rawList = parseCSV(text);
      }

      const valid: Dept[] = [];
      const errors: string[] = [];
      rawList.forEach((row, idx) => {
        const id = (row.id || row.ma_bm || row.mabm || "").trim();
        const name = (row.name || row.ten_bm || row.tenbm || id).trim();
        if (!id) {
          errors.push(`Dòng ${idx + 2}: Thiếu mã bộ môn (id/ma_bm)`);
        } else if (valid.some((d) => d.id === id)) {
          errors.push(`Dòng ${idx + 2}: Trùng mã bộ môn '${id}' trong file`);
        } else {
          valid.push({ id, name, status: "UNSENT", note: "" });
        }
      });
      setImportPreview({
        valid,
        errors,
        summary: `Tìm thấy ${valid.length} bộ môn hợp lệ, ${errors.length} dòng lỗi.`,
      });
    } else {
      let rawList: Record<string, string>[] = [];
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          rawList = Array.isArray(parsed) ? parsed : parsed.teachers || [];
        } catch {
          setImportPreview({ valid: [], errors: ["Định dạng JSON không hợp lệ"], summary: "" });
          return;
        }
      } else {
        rawList = parseCSV(text);
      }

      const valid: Teacher[] = [];
      const errors: string[] = [];
      const knownDeptIds = new Set(initialDepartments.map((d) => d.id));

      rawList.forEach((row, idx) => {
        const id = (row.id || row.ma_gv || row.magv || "").trim();
        const name = (row.name || row.ho_ten || row.hoten || id).trim();
        const dept = (row.department || row.bo_mon || row.bomon || "").trim();
        const assistant = Boolean(row.assistant || row.tro_giang === "x" || row.tro_giang === "true");

        if (!id) {
          errors.push(`Dòng ${idx + 2}: Thiếu mã giảng viên (id/ma_gv)`);
        } else if (!dept) {
          errors.push(`Dòng ${idx + 2}: Giảng viên '${id}' thiếu thông tin bộ môn`);
        } else if (!knownDeptIds.has(dept)) {
          errors.push(`Dòng ${idx + 2}: Bộ môn '${dept}' của GV '${id}' chưa có trong danh mục`);
        } else if (valid.some((t) => t.id === id)) {
          errors.push(`Dòng ${idx + 2}: Trùng mã giảng viên '${id}' trong file`);
        } else {
          const existing = initialTeachers.find((t) => t.id === id);
          let caps = existing?.capabilities || {};
          if (row.capabilities && typeof row.capabilities === "object") {
            caps = row.capabilities as unknown as Record<string, ("LEC" | "TUT" | "COMBINED")[]>;
          }
          valid.push({ id, name, department: dept, assistant, capabilities: caps });
        }
      });
      setImportPreview({
        valid,
        errors,
        summary: `Tìm thấy ${valid.length} giảng viên hợp lệ, ${errors.length} dòng lỗi.`,
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !importPreview.valid.length) return;
    if (importMode === "dept") {
      const newDepts = importPreview.valid as Dept[];
      const mergedMap = new Map<string, Dept>();
      initialDepartments.forEach((d) => mergedMap.set(d.id, d));
      newDepts.forEach((d) => mergedMap.set(d.id, d));
      await onSaveCatalog({ departments: Array.from(mergedMap.values()), teachers: initialTeachers });
    } else {
      const newTeachers = importPreview.valid as Teacher[];
      const mergedMap = new Map<string, Teacher>();
      initialTeachers.forEach((t) => mergedMap.set(t.id, t));
      newTeachers.forEach((t) => mergedMap.set(t.id, t));
      await onSaveCatalog({ departments: initialDepartments, teachers: Array.from(mergedMap.values()) });
    }
    setImportPreview(null);
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Quản lý danh mục Bộ môn & Giảng viên</h2>
          <p>Xem, thêm, sửa, xóa và import danh mục độc lập. Cập nhật đồng bộ với cơ sở dữ liệu.</p>
        </div>
      </div>

      <div className="sub-tabs" role="tablist">
        <button
          className={"sub-tab-btn " + (activeTab === "depts" ? "active" : "")}
          onClick={() => setActiveTab("depts")}
        >
          Danh mục Bộ môn ({initialDepartments.length})
        </button>
        <button
          className={"sub-tab-btn " + (activeTab === "teachers" ? "active" : "")}
          onClick={() => setActiveTab("teachers")}
        >
          Danh mục Giảng viên ({initialTeachers.length})
        </button>
        <button
          className={"sub-tab-btn " + (activeTab === "import" ? "active" : "")}
          onClick={() => setActiveTab("import")}
        >
          Import dữ liệu từ file
        </button>
      </div>

      {activeTab === "depts" && (
        <>
          <div className="toolbar" style={{ marginTop: 0 }}>
            <div style={{ display: "flex", gap: "10px", flex: 1, maxWidth: "400px" }}>
              <input
                type="search"
                placeholder="Tìm mã hoặc tên bộ môn..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                style={{ minHeight: "36px", height: "36px" }}
              />
            </div>
            <button
              className="primary"
              disabled={disabled}
              onClick={() => setDeptModal({ open: true, isEdit: false, id: "", name: "" })}
            >
              + Thêm bộ môn mới
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "140px" }}>Mã bộ môn</th>
                  <th>Tên bộ môn</th>
                  <th style={{ width: "120px" }}>Số GV</th>
                  <th style={{ width: "160px", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                      Không tìm thấy bộ môn nào.
                    </td>
                  </tr>
                ) : (
                  filteredDepts.map((d) => {
                    const count = initialTeachers.filter((t) => t.department === d.id).length;
                    return (
                      <tr key={d.id}>
                        <td>
                          <b>{d.id}</b>
                        </td>
                        <td>{d.name}</td>
                        <td>
                          <span className="badge neutral">{count} giảng viên</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            disabled={disabled}
                            style={{ marginRight: "6px", minHeight: "32px", padding: "4px 10px" }}
                            onClick={() => setDeptModal({ open: true, isEdit: true, id: d.id, name: d.name })}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn-remove"
                            disabled={disabled}
                            style={{ minHeight: "32px", padding: "4px 10px" }}
                            onClick={() => handleDeleteDept(d.id)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "teachers" && (
        <>
          <div className="toolbar" style={{ marginTop: 0, gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px" }}>
              <input
                type="search"
                placeholder="Tìm mã hoặc tên giảng viên..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                style={{ minHeight: "36px", height: "36px", flex: 2 }}
              />
              <select
                value={teacherDeptFilter}
                onChange={(e) => setTeacherDeptFilter(e.target.value)}
                style={{ minHeight: "36px", height: "36px", flex: 1 }}
              >
                <option value="">Tất cả bộ môn</option>
                {initialDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="primary"
              disabled={disabled || !initialDepartments.length}
              onClick={() =>
                setTeacherModal({
                  open: true,
                  isEdit: false,
                  id: "",
                  name: "",
                  department: initialDepartments[0]?.id || "",
                  assistant: false,
                })
              }
            >
              + Thêm giảng viên mới
            </button>
          </div>

          <div className="table-wrap table-scroll" style={{ maxHeight: "460px" }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Mã GV</th>
                  <th>Họ và tên</th>
                  <th style={{ width: "120px" }}>Bộ môn</th>
                  <th style={{ width: "120px" }}>Vai trò</th>
                  <th style={{ width: "150px", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                      Không tìm thấy giảng viên nào.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <b>{t.id}</b>
                      </td>
                      <td>{t.name}</td>
                      <td>
                        <span className="badge neutral">{t.department}</span>
                      </td>
                      <td>
                        <span className={"badge " + (t.assistant ? "warning" : "success")}>
                          {t.assistant ? "Trợ giảng" : "Giảng viên"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          disabled={disabled}
                          style={{ marginRight: "6px", minHeight: "32px", padding: "4px 10px" }}
                          onClick={() =>
                            setTeacherModal({
                              open: true,
                              isEdit: true,
                              id: t.id,
                              name: t.name,
                              department: t.department,
                              assistant: t.assistant,
                            })
                          }
                        >
                          Sửa
                        </button>
                        <button
                          className="btn-remove"
                          disabled={disabled}
                          style={{ minHeight: "32px", padding: "4px 10px" }}
                          onClick={() => handleDeleteTeacher(t.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "import" && (
        <div style={{ padding: "8px 0" }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="radio"
                name="importMode"
                checked={importMode === "dept"}
                onChange={() => {
                  setImportMode("dept");
                  setImportPreview(null);
                }}
              />
              <b>1. Nhập Bộ môn (CSV/JSON)</b>
            </label>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="radio"
                name="importMode"
                checked={importMode === "teacher"}
                onChange={() => {
                  setImportMode("teacher");
                  setImportPreview(null);
                }}
              />
              <b>2. Nhập Giảng viên (CSV/JSON)</b>
            </label>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid var(--line)", borderRadius: "8px", padding: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--muted)" }}>
              {importMode === "dept"
                ? "Hỗ trợ file .json hoặc file .csv chứa các cột (ma_bm, ten_bm, truong_bo_mon). Dữ liệu nhập mới sẽ bổ sung hoặc cập nhật bộ môn cùng mã."
                : "Hỗ trợ file .json hoặc file .csv chứa các cột (ma_gv, ho_ten, bo_mon, tro_giang). Cần đảm bảo bộ môn đã tồn tại trước khi import giảng viên."}
            </p>
            <label style={{ margin: 0 }}>
              <input
                key={importMode}
                type="file"
                accept=".json,.csv"
                disabled={disabled}
                onChange={handleFileChange}
              />
            </label>
          </div>

          {importPreview && (
            <div style={{ marginTop: "16px", borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <b>{importPreview.summary}</b>
                <button
                  className="primary"
                  disabled={disabled || !importPreview.valid.length}
                  onClick={handleConfirmImport}
                >
                  Xác nhận lưu vào danh mục
                </button>
              </div>
              {importPreview.errors.length > 0 && (
                <div className="notice error" style={{ margin: "8px 0" }}>
                  <b>Các dòng cần lưu ý:</b>
                  {importPreview.errors.slice(0, 5).map((err, i) => (
                    <span key={i}>• {err}</span>
                  ))}
                  {importPreview.errors.length > 5 && <span>... và {importPreview.errors.length - 5} lỗi khác</span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal / Form thêm & sửa Bộ môn */}
      {deptModal.open && (
        <div className="modal-overlay" onClick={() => setDeptModal({ ...deptModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{deptModal.isEdit ? "Chỉnh sửa Bộ môn" : "Thêm Bộ môn mới"}</h3>
              <button
                className="modal-close"
                onClick={() => setDeptModal({ ...deptModal, open: false })}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveDept();
              }}
            >
              <label>
                Mã bộ môn (VD: KHMT, CNPM)
                <input
                  required
                  disabled={deptModal.isEdit}
                  value={deptModal.id}
                  onChange={(e) => setDeptModal({ ...deptModal, id: e.target.value.toUpperCase() })}
                  placeholder="Mã bộ môn viết tắt"
                />
              </label>
              <label>
                Tên đầy đủ của bộ môn
                <input
                  required
                  value={deptModal.name}
                  onChange={(e) => setDeptModal({ ...deptModal, name: e.target.value })}
                  placeholder="VD: Bộ môn Khoa học máy tính"
                />
              </label>
              <div className="actions" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setDeptModal({ ...deptModal, open: false })}>
                  Hủy
                </button>
                <button className="primary" type="submit">
                  {deptModal.isEdit ? "Cập nhật" : "Thêm bộ môn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Form thêm & sửa Giảng viên */}
      {teacherModal.open && (
        <div className="modal-overlay" onClick={() => setTeacherModal({ ...teacherModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{teacherModal.isEdit ? "Chỉnh sửa Giảng viên" : "Thêm Giảng viên mới"}</h3>
              <button
                className="modal-close"
                onClick={() => setTeacherModal({ ...teacherModal, open: false })}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveTeacher();
              }}
            >
              <label>
                Mã giảng viên (VD: ThaoDTP, KhoaTN)
                <input
                  required
                  disabled={teacherModal.isEdit}
                  value={teacherModal.id}
                  onChange={(e) => setTeacherModal({ ...teacherModal, id: e.target.value })}
                  placeholder="Mã định danh giảng viên"
                />
              </label>
              <label>
                Họ và tên giảng viên
                <input
                  required
                  value={teacherModal.name}
                  onChange={(e) => setTeacherModal({ ...teacherModal, name: e.target.value })}
                  placeholder="Họ và tên đầy đủ"
                />
              </label>
              <label>
                Thuộc bộ môn
                <select
                  required
                  value={teacherModal.department}
                  onChange={(e) => setTeacherModal({ ...teacherModal, department: e.target.value })}
                >
                  {initialDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} - {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "14px 0" }}>
                <input
                  type="checkbox"
                  checked={teacherModal.assistant}
                  onChange={(e) => setTeacherModal({ ...teacherModal, assistant: e.target.checked })}
                />
                <span>Trợ giảng (chỉ được phân công tiết thực hành/tutorial)</span>
              </label>
              <div className="actions" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setTeacherModal({ ...teacherModal, open: false })}>
                  Hủy
                </button>
                <button className="primary" type="submit">
                  {teacherModal.isEdit ? "Cập nhật" : "Thêm giảng viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export function ConfigEditor({
  value,
  onChange,
  onSave,
  disabled,
  hasPublished,
}: {
  value: string;
  onChange: (s: string) => void;
  onSave: (data: unknown) => void;
  disabled: boolean;
  hasPublished?: boolean;
}) {
  const config: Config = value
    ? JSON.parse(value)
    : {
        period_minutes: 50,
        break_minutes: 10,
        max_periods: 8,
        rooms: { PROJECTOR: 10, COMPUTER: 5 },
        slots: [],
      };
  const update = (c: Config) => onChange(JSON.stringify(c));

  // Generate 66 standard slots (07:00-12:00, 13:00-22:00 Monday-Saturday)
  const generateFitStandardSlots = () => {
    const slots = [];
    for (let day = 2; day <= 7; day++) {
      // Morning slots: 07:00, 08:00, 09:00, 10:00 to 12:00
      for (const h of [7, 8, 9, 10]) {
        slots.push({ day, start: h * 60, end: 12 * 60, evening: false });
      }
      // Afternoon slots: 13:00, 14:00, 15:00, 16:00, 17:00 to 22:00
      for (const h of [13, 14, 15, 16, 17]) {
        slots.push({ day, start: h * 60, end: 22 * 60, evening: false });
      }
      // Evening slots: 18:00, 19:00 to 22:00
      for (const h of [18, 19]) {
        slots.push({ day, start: h * 60, end: 22 * 60, evening: true });
      }
    }
    return slots;
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Khung giờ & quy định học kỳ</h2>
          <p>Thiết lập thời lượng mỗi tiết, thời gian nghỉ, trần tiết/ngày và các khung giờ bắt đầu khả dụng.</p>
        </div>
      </div>

      {hasPublished && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#166534" }}>
          <b>💡 Lưu ý vận hành:</b> Học kỳ hiện đã có lịch công bố. Bạn vẫn có thể tự do điều chỉnh thời lượng tiết, trần tiết và khung giờ. Sau khi nhấn <b>"Lưu cấu hình khung giờ"</b>, hệ thống sẽ lưu cấu hình mới và bạn có thể chuyển sang mục Xếp lịch để chạy lại bộ giải khi cần.
        </div>
      )}

      <fieldset disabled={disabled}>
        <legend>Thời lượng & giới hạn tiết học</legend>
        <div className="editor-row">
          {(["period_minutes", "break_minutes", "max_periods"] as const).map((key, i) => (
            <label key={key}>
              <span>{["Phút mỗi tiết", "Phút nghỉ giữa tiết", "Trần tiết tối đa/ngày"][i]}</span>
              <input
                type="number"
                min={key === "break_minutes" ? 0 : 1}
                max={key === "max_periods" ? 8 : 120}
                value={config[key]}
                onChange={(e) => update({ ...config, [key]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--muted)" }}>
          Phòng học thực tế và điều kiện sử dụng được quản lý tại mục Phòng học. Trần tiết/ngày là ưu tiên mềm giúp phân bố tải đều.
        </p>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend>Khung giờ có thể xếp lớp ({config.slots.length} khung)</legend>
        <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--muted)" }}>
          Mỗi khung xác định ngày và giờ bắt đầu khả dụng cho các lớp học phần trong tuần.
        </p>

        <div style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "6px" }}>
          {config.slots.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "13px", padding: "12px 0" }}>
              Chưa có khung giờ nào. Hãy bấm "+ Thêm khung mới" hoặc "Nạp 66 khung chuẩn FIT" bên dưới.
            </p>
          ) : (
            config.slots.map((slot, i) => (
              <div className="editor-row" key={i}>
                <label style={{ flex: 1.2 }}>
                  <span>Thứ</span>
                  <select
                    value={slot.day}
                    onChange={(e) =>
                      update({
                        ...config,
                        slots: config.slots.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)),
                      })
                    }
                  >
                    {Array.from({length: 7}, (_, j) => j + 2).map((d) => (
                      <option key={d} value={d}>
                        {d === 8 ? "Chủ nhật" : "Thứ " + d}
                      </option>
                    ))}
                  </select>
                </label>
                {(["start", "end"] as const).map((k) => (
                  <label key={k}>
                    <span>{k === "start" ? "Bắt đầu" : "Kết thúc"}</span>
                    <input
                      type="time"
                      value={time(slot[k])}
                      onChange={(e) =>
                        update({
                          ...config,
                          slots: config.slots.map((x, j) =>
                            j === i ? { ...x, [k]: minutes(e.target.value) } : x
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <label style={{ flex: 0.8, minWidth: "100px", paddingBottom: "10px" }}>
                  <input
                    type="checkbox"
                    checked={slot.evening}
                    onChange={(e) =>
                      update({
                        ...config,
                        slots: config.slots.map((x, j) =>
                          j === i ? { ...x, evening: e.target.checked } : x
                        ),
                      })
                    }
                  />
                  <span style={{ display: "inline", textTransform: "none", fontSize: "12px" }}>Buổi tối</span>
                </label>
                <button
                  className="btn-remove"
                  type="button"
                  onClick={() => update({ ...config, slots: config.slots.filter((_, j) => j !== i) })}
                >
                  Bỏ
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() =>
              update({
                ...config,
                slots: [...config.slots, { day: 2, start: 420, end: 720, evening: false }],
              })
            }
          >
            + Thêm khung mới
          </button>
          <button
            type="button"
            onClick={() => update({ ...config, slots: generateFitStandardSlots() })}
            style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
          >
            ⚡ Nạp 66 khung chuẩn FIT
          </button>
          <button
            type="button"
            onClick={() =>
              update({
                ...config,
                slots: Array.from({ length: 6 }, (_, i) => [
                  { day: i + 2, start: 420, end: 720, evening: false },
                  { day: i + 2, start: 780, end: 1080, evening: false },
                ]).flat(),
              })
            }
          >
            Điền khung mẫu (Sáng & Chiều T2–T7)
          </button>
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend>Trọng số tối ưu hóa lịch (Soft constraints)</legend>
        <div className="editor-row">
          {(["restricted", "single_class", "overload", "gaps_minutes"] as const).map((key, i) => (
            <label key={key}>
              <span>{["Thứ 7 / Buổi tối", "Ngày chỉ có 1 lớp", "Vượt trần tiết/ngày", "Phút trống giữa buổi"][i]}</span>
              <input
                type="number"
                min={0}
                max={1000}
                value={config.soft_weights?.[key] ?? 1}
                onChange={(e) =>
                  update({
                    ...config,
                    soft_weights: {
                      restricted: 1,
                      single_class: 1,
                      overload: 1,
                      gaps_minutes: 1,
                      ...config.soft_weights,
                      [key]: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      </fieldset>

      <button className="primary" disabled={disabled || !config.slots.length} onClick={() => onSave(config)}>
        Lưu cấu hình khung giờ ({config.slots.length} khung)
      </button>
    </section>
  );
}

export function CapabilitiesEditor({
  value,
  onChange,
  courses,
}: {
  value: string;
  onChange: (s: string) => void;
  courses: string[];
}) {
  const data: Record<string, string[]> = JSON.parse(value || "{}");
  return (
    <fieldset>
      <legend>Năng lực giảng dạy theo học phần</legend>
      <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "8px", padding: "12px", background: "white" }}>
        {courses.map((course) => (
          <div
            className="editor-row"
            key={course}
            style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginBottom: "8px" }}
          >
            <b style={{ minWidth: "140px", fontSize: "12px" }}>{course}</b>
            {(["LEC", "TUT"] as const).map((kind) => (
              <label key={kind} style={{ flex: "none", minWidth: "120px" }}>
                <input
                  type="checkbox"
                  checked={data[course]?.includes(kind) ?? false}
                  onChange={(e) => {
                    const values = new Set(data[course] ?? []);
                    if (e.target.checked) values.add(kind);
                    else values.delete(kind);
                    onChange(JSON.stringify({ ...data, [course]: Array.from(values) }));
                  }}
                />
                <span style={{ display: "inline", textTransform: "none", fontSize: "12px" }}>
                  {kind === "LEC" ? "Lý thuyết (LEC)" : "Thực hành (TUT)"}
                </span>
              </label>
            ))}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
        Buổi gộp (LT + TH) cần cả hai năng lực. Trợ giảng chỉ được phân công tiết Thực hành.
      </p>
    </fieldset>
  );
}
