"use client";
import { useState } from "react";
import { CatalogImport } from "./catalog-import";
import type { Dept, Teacher } from "./types";

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
        <CatalogImport disabled={disabled} initialDepartments={initialDepartments}
          initialTeachers={initialTeachers} onSaveCatalog={onSaveCatalog} />
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
