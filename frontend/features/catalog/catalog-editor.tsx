"use client";
import { useState } from "react";
import { ActionButton, Icon } from "../shared/ui";
import { CatalogImport } from "./catalog-import";
import type { Dept, Teacher } from "./types";

export function CatalogEditor({
  disabled,
  initialDepartments,
  initialTeachers,
  onSaveCatalog,
  onSaveDept,
  onDeleteDept,
}: {
  disabled: boolean;
  initialDepartments: Dept[];
  initialTeachers: Teacher[];
  onlineTeacherIds?: string[];
  realtimeConnected?: boolean;
  onSaveCatalog: (data: { departments: Dept[]; teachers: Teacher[] }) => Promise<void>;
  onSaveDept?: (data: { id: string; name: string }) => Promise<void>;
  onDeleteDept?: (id: string) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"depts" | "import">("depts");
  const [deptSearch, setDeptSearch] = useState("");
  const [savingDept, setSavingDept] = useState(false);

  const [deptModal, setDeptModal] = useState<{ open: boolean; isEdit: boolean; id: string; name: string }>({
    open: false,
    isEdit: false,
    id: "",
    name: "",
  });

  const filteredDepts = initialDepartments.filter(
    (d) =>
      d.id.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.name.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const handleSaveDept = async () => {
    if (!deptModal.id.trim()) return;
    setSavingDept(true);
    try {
      if (onSaveDept) {
        await onSaveDept({ id: deptModal.id.trim(), name: deptModal.name.trim() });
      } else {
        const updated = deptModal.isEdit
          ? initialDepartments.map((d) =>
              d.id === deptModal.id ? { ...d, name: deptModal.name.trim() } : d
            )
          : [
              ...initialDepartments,
              { id: deptModal.id.trim(), name: deptModal.name.trim(), status: "UNSENT", note: "" },
            ];
        await onSaveCatalog({ departments: updated, teachers: initialTeachers });
      }
      setDeptModal({ open: false, isEdit: false, id: "", name: "" });
    } finally {
      setSavingDept(false);
    }
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

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Danh mục Bộ môn chuyên môn</h2>
          <p>
            Thêm, sửa, xóa và nhập danh sách các Bộ môn. Quản lý giảng viên &amp; hồ sơ năng lực được đặt tập trung tại mục Nhân Sự.
          </p>
        </div>
      </div>

      <div className="sub-tabs" role="tablist">
        <button
          type="button"
          className={"sub-tab-btn " + (activeTab === "depts" ? "active" : "")}
          onClick={() => setActiveTab("depts")}
        >
          Danh mục Bộ môn ({initialDepartments.length})
        </button>
        <button
          type="button"
          className={"sub-tab-btn " + (activeTab === "import" ? "active" : "")}
          onClick={() => setActiveTab("import")}
        >
          Nhập Bộ môn từ tệp
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
            <ActionButton
              type="button"
              variant="primary"
              icon="plus"
              disabled={disabled}
              onClick={() => setDeptModal({ open: true, isEdit: false, id: "", name: "" })}
            >
              Thêm bộ môn mới
            </ActionButton>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "140px" }}>Mã bộ môn</th>
                  <th>Tên bộ môn</th>
                  <th style={{ width: "130px" }}>Nhân sự</th>
                  <th style={{ width: "170px", textAlign: "right" }}>Thao tác</th>
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
                          <ActionButton
                            type="button"
                            icon="edit"
                            disabled={disabled}
                            style={{ marginRight: "6px", minHeight: "30px", padding: "3px 9px", fontSize: "11.5px" }}
                            onClick={() => setDeptModal({ open: true, isEdit: true, id: d.id, name: d.name })}
                          >
                            Sửa
                          </ActionButton>
                          <ActionButton
                            type="button"
                            variant="danger"
                            icon="trash"
                            disabled={disabled}
                            style={{ minHeight: "30px", padding: "3px 9px", fontSize: "11.5px" }}
                            onClick={() => void handleDeleteDept(d.id)}
                          >
                            Xóa
                          </ActionButton>
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

      {activeTab === "import" && (
        <CatalogImport
          disabled={disabled}
          initialDepartments={initialDepartments}
          initialTeachers={initialTeachers}
          onSaveCatalog={onSaveCatalog}
        />
      )}

      {deptModal.open && (
        <div className="modal-overlay" onClick={() => setDeptModal({ ...deptModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{deptModal.isEdit ? "Chỉnh sửa Bộ môn" : "Thêm Bộ môn mới"}</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Đóng"
                onClick={() => setDeptModal({ ...deptModal, open: false })}
              >
                <Icon name="x" size={16} />
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
                <ActionButton variant="primary" type="submit" loading={savingDept} loadingLabel="Đang lưu...">
                  {deptModal.isEdit ? "Cập nhật" : "Thêm bộ môn"}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
