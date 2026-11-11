"use client";
import { useMemo, useState, type ChangeEvent } from "react";
import { Metrics, EmptyState } from "../shared/ui";
import type { Department, ClassSession, Teacher } from "../workspace/ui-types";
import type { OfferingItem } from "../workspace/types";

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

function parseCapabilitiesField(raw: unknown): Record<string, string[]> {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, string[]>;
  }
  const str = String(raw).trim();
  if (!str) return {};
  const result: Record<string, string[]> = {};
  for (const part of str.split(";")) {
    const [courseRaw, kindsRaw] = part.split(":");
    const course = (courseRaw || "").trim().toUpperCase();
    if (!course) continue;
    const kinds = (kindsRaw || "LEC|TUT")
      .split("|")
      .map((k) => k.trim().toUpperCase())
      .filter((k) => k === "LEC" || k === "TUT" || k === "COMBINED");
    if (kinds.length) result[course] = kinds;
  }
  return result;
}

export function PersonnelMatrix({
  teachers,
  departments,
  sessions,
  offerings = [],
  onlineTeachers = [],
  currentTeacher,
  role,
  busy,
  onCommand,
}: {
  teachers: Teacher[];
  departments: Department[];
  sessions: ClassSession[];
  offerings?: OfferingItem[];
  onlineTeachers?: string[];
  currentTeacher?: string | null;
  role: "STAFF" | "HEAD" | "TEACHER";
  busy: boolean;
  onCommand: (action: string, payload: unknown) => Promise<void>;
}) {
  const isHead = role === "HEAD";
  const isStaff = role === "STAFF";
  const headDept = departments[0]?.id || "";

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [draftCoursesByTeacher, setDraftCoursesByTeacher] = useState<Record<string, string[]>>({});

  // Staff CRUD & Import states (gộp duy nhất tại mục Nhân Sự, không lặp ở Danh mục)
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    valid: Teacher[];
    errors: string[];
    summary: string;
  } | null>(null);
  const [teacherModal, setTeacherModal] = useState<{
    open: boolean;
    isEdit: boolean;
    id: string;
    name: string;
    department: string;
    assistant: boolean;
    active: boolean;
  }>({
    open: false,
    isEdit: false,
    id: "",
    name: "",
    department: departments[0]?.id || "",
    assistant: false,
    active: true,
  });

  const onlineSet = useMemo(() => {
    const s = new Set(onlineTeachers);
    if (currentTeacher) s.add(currentTeacher);
    return s;
  }, [onlineTeachers, currentTeacher]);

  const allCourses = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (!deptFilter || s.department === deptFilter) set.add(s.course);
    });
    offerings.forEach((o) => {
      if (!deptFilter || o.department === deptFilter) set.add(o.course);
    });
    teachers.forEach((t) => {
      if (!deptFilter || t.department === deptFilter) {
        Object.keys(t.capabilities || {}).forEach((c) => set.add(c));
      }
    });
    return Array.from(set).sort();
  }, [sessions, offerings, teachers, deptFilter]);

  const courseNames = useMemo(() => {
    const map = new Map<string, string>();
    offerings.forEach((o) => {
      if (o.name) map.set(o.course, o.name);
    });
    return map;
  }, [offerings]);

  const filteredTeachers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teachers.filter((t) => {
      const isAct = t.active !== false;
      if (deptFilter && t.department !== deptFilter) return false;
      if (activeFilter === "active" && !isAct) return false;
      if (activeFilter === "inactive" && isAct) return false;
      if (courseFilter && !(t.capabilities?.[courseFilter]?.length)) return false;
      if (!q) return true;
      const capStr = Object.keys(t.capabilities || {}).join(" ").toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        (t.name || "").toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        capStr.includes(q)
      );
    });
  }, [teachers, deptFilter, activeFilter, courseFilter, query]);

  const activeCount = teachers.filter((t) => t.active !== false).length;
  const onlineCount = teachers.filter((t) => onlineSet.has(t.id)).length;
  const capableCount = teachers.filter((t) => Object.values(t.capabilities || {}).some((v) => v.length > 0)).length;

  const teacherLoad = (id: string) =>
    sessions.filter((s) => s.teacher === id).reduce((sum, s) => sum + (s.periods ?? 0), 0);

  const toggleCapability = async (t: Teacher, course: string, kind: "LEC" | "TUT") => {
    if (!isHead) return;
    const current = new Set(t.capabilities?.[course] ?? []);
    if (current.has(kind)) current.delete(kind);
    else current.add(kind);

    const nextCaps: Record<string, string[]> = { ...(t.capabilities || {}) };
    if (current.size === 0) {
      delete nextCaps[course];
      // Giữ chip tạm trên dòng để TBM có thể tick lại sang TUT/LEC mà không bị nhảy mất ô
      setDraftCoursesByTeacher((prev) => ({
        ...prev,
        [t.id]: Array.from(new Set([...(prev[t.id] ?? []), course])),
      }));
    } else {
      nextCaps[course] = Array.from(current);
    }

    await onCommand("teacher", {
      department: headDept || t.department,
      teacher: t.id,
      assistant: t.assistant,
      active: t.active !== false,
      capabilities: nextCaps,
    });
  };

  const addCourseToTeacher = async (t: Teacher, rawCourse: string) => {
    if (!isHead || !rawCourse) return;
    let course = rawCourse;
    if (rawCourse === "__CUSTOM__") {
      const entered = window.prompt("Nhập mã học phần muốn gán cho giảng viên (VD: 61FIT3AI1):");
      if (!entered || !entered.trim()) return;
      course = entered.trim().toUpperCase();
    }
    const defaultKinds = t.assistant ? ["TUT"] : ["LEC", "TUT"];
    const nextCaps: Record<string, string[]> = {
      ...(t.capabilities || {}),
      [course]: t.capabilities?.[course]?.length ? t.capabilities[course] : defaultKinds,
    };
    setDraftCoursesByTeacher((prev) => ({
      ...prev,
      [t.id]: Array.from(new Set([...(prev[t.id] ?? []), course])),
    }));
    await onCommand("teacher", {
      department: headDept || t.department,
      teacher: t.id,
      assistant: t.assistant,
      active: t.active !== false,
      capabilities: nextCaps,
    });
  };

  const removeCourseFromTeacher = async (t: Teacher, course: string) => {
    if (!isHead) return;
    const nextCaps: Record<string, string[]> = { ...(t.capabilities || {}) };
    delete nextCaps[course];
    setDraftCoursesByTeacher((prev) => ({
      ...prev,
      [t.id]: (prev[t.id] ?? []).filter((c) => c !== course),
    }));
    if (t.capabilities?.[course]) {
      await onCommand("teacher", {
        department: headDept || t.department,
        teacher: t.id,
        assistant: t.assistant,
        active: t.active !== false,
        capabilities: nextCaps,
      });
    }
  };

  const toggleActive = async (t: Teacher) => {
    const nextActive = !(t.active !== false);
    if (isHead) {
      await onCommand("teacher", {
        department: headDept || t.department,
        teacher: t.id,
        assistant: t.assistant,
        active: nextActive,
        capabilities: t.capabilities || {},
      });
    } else if (isStaff) {
      await onCommand("teacher-save", {
        id: t.id,
        name: t.name,
        department: t.department,
        assistant: t.assistant,
        active: nextActive,
        capabilities: t.capabilities || {},
      });
    }
  };

  const toggleAssistant = async (t: Teacher) => {
    const nextAssistant = !t.assistant;
    if (isHead) {
      await onCommand("teacher", {
        department: headDept || t.department,
        teacher: t.id,
        assistant: nextAssistant,
        active: t.active !== false,
        capabilities: t.capabilities || {},
      });
    } else if (isStaff) {
      await onCommand("teacher-save", {
        id: t.id,
        name: t.name,
        department: t.department,
        assistant: nextAssistant,
        active: t.active !== false,
        capabilities: t.capabilities || {},
      });
    }
  };

  const handleSaveTeacherModal = async () => {
    if (!teacherModal.id.trim() || !teacherModal.department) return;
    const existing = teachers.find((t) => t.id === teacherModal.id.trim());
    await onCommand("teacher-save", {
      id: teacherModal.id.trim(),
      name: teacherModal.name.trim() || teacherModal.id.trim(),
      department: teacherModal.department,
      assistant: teacherModal.assistant,
      active: teacherModal.active,
      capabilities: existing?.capabilities || {},
    });
    setTeacherModal({
      open: false,
      isEdit: false,
      id: "",
      name: "",
      department: departments[0]?.id || "",
      assistant: false,
      active: true,
    });
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhân sự ${id}?`)) return;
    await onCommand("teacher-delete", { id });
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportPreview(null);
    const text = await file.text();
    let rawList: Record<string, unknown>[] = [];
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
    const knownDeptIds = new Set(departments.map((d) => d.id));

    rawList.forEach((row, idx) => {
      const id = String(row.id || row.ma_gv || row.magv || "").trim();
      const name = String(row.name || row.ho_ten || row.hoten || id).trim();
      const dept = String(row.department || row.bo_mon || row.bomon || "").trim();
      const astStr = String(row.assistant ?? row.tro_giang ?? "").toLowerCase();
      const assistant = astStr === "true" || astStr === "x" || astStr === "1";
      const actStr = String(row.active ?? row.trang_thai ?? "true").toLowerCase();
      const active = !(actStr === "false" || actStr === "0" || actStr === "off" || actStr === "nghi");

      if (!id) {
        errors.push(`Dòng ${idx + 2}: Thiếu mã nhân sự (id/ma_gv)`);
      } else if (!dept) {
        errors.push(`Dòng ${idx + 2}: Nhân sự '${id}' thiếu thông tin bộ môn`);
      } else if (!knownDeptIds.has(dept)) {
        errors.push(`Dòng ${idx + 2}: Bộ môn '${dept}' của '${id}' chưa có trong danh mục Bộ môn`);
      } else if (valid.some((t) => t.id === id)) {
        errors.push(`Dòng ${idx + 2}: Trùng mã nhân sự '${id}' trong file`);
      } else {
        const existing = teachers.find((t) => t.id === id);
        const parsedCaps = parseCapabilitiesField(row.capabilities);
        const caps = Object.keys(parsedCaps).length > 0 ? parsedCaps : existing?.capabilities || {};
        valid.push({ id, name, department: dept, assistant, active, capabilities: caps });
      }
    });

    setImportPreview({
      valid,
      errors,
      summary: `Tìm thấy ${valid.length} nhân sự hợp lệ, ${errors.length} dòng lỗi.`,
    });
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !importPreview.valid.length) return;
    const mergedMap = new Map<string, Teacher>();
    teachers.forEach((t) => mergedMap.set(t.id, t));
    importPreview.valid.forEach((t) => mergedMap.set(t.id, t));
    await onCommand("catalog", {
      departments,
      teachers: Array.from(mergedMap.values()),
    });
    setImportPreview(null);
    setShowImportPanel(false);
  };

  return (
    <section className="card">
      <div className="section-heading" style={{ flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Nhân Sự & Hồ sơ Năng lực Giảng viên (LEC / TUT)</h2>
          <p>
            {isHead
              ? "Mỗi giảng viên chỉ hiển thị đúng các học phần phụ trách. Trưởng bộ môn bấm LEC / TUT để chọn loại buổi dạy hoặc '+ Thêm môn' nếu muốn bổ sung."
              : "Quản lý tập trung toàn bộ danh sách giảng viên, trạng thái hoạt động tại khoa, trực tuyến và hồ sơ năng lực LEC/TUT."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onCommand(
                "capabilities-preset",
                isHead ? { department: headDept } : deptFilter ? { department: deptFilter } : {}
              )
            }
            style={{
              background: "#eff6ff",
              borderColor: "#bfdbfe",
              color: "#1d4ed8",
              fontSize: "12px",
              fontWeight: 600,
              minHeight: "34px",
              padding: "0 12px",
            }}
          >
            ⚡ Đồng bộ năng lực từ TKB gốc
          </button>
          {isStaff && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowImportPanel((prev) => !prev);
                  setImportPreview(null);
                }}
                style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}
              >
                {showImportPanel ? "Đóng Import CSV" : "📂 Import Nhân sự (.csv)"}
              </button>
              <button
                type="button"
                className="primary"
                disabled={busy || !departments.length}
                onClick={() =>
                  setTeacherModal({
                    open: true,
                    isEdit: false,
                    id: "",
                    name: "",
                    department: deptFilter || departments[0]?.id || "",
                    assistant: false,
                    active: true,
                  })
                }
                style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}
              >
                + Thêm nhân sự
              </button>
            </>
          )}
        </div>
      </div>

      {isStaff && showImportPanel && (
        <div
          style={{
            marginBottom: "16px",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
            <div>
              <b style={{ fontSize: "13px" }}>Import danh sách Nhân sự & Năng lực từ CSV / JSON</b>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Cột chuẩn: <code>id, name, department, assistant, active, capabilities</code> (VD: <code>61FIT3SS1:LEC|TUT;61FIT3SE1:LEC</code>).
              </p>
            </div>
            <a
              href="/templates/nhan-su-mau.csv"
              download="Mau_Nhan_Su_Giang_Vien.csv"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "#eff6ff",
                border: "1px solid #93c5fd",
                color: "#1d4ed8",
                fontSize: "12px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              📥 Tải File Mẫu Nhân sự (.csv)
            </a>
          </div>
          <input type="file" accept=".csv,.json" disabled={busy} onChange={handleImportFile} />
          {importPreview && (
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <b style={{ fontSize: "12.5px" }}>{importPreview.summary}</b>
                <button
                  type="button"
                  className="primary"
                  disabled={busy || !importPreview.valid.length}
                  onClick={handleConfirmImport}
                  style={{ minHeight: "32px", padding: "0 12px", fontSize: "12px" }}
                >
                  Lưu vào danh sách Nhân sự
                </button>
              </div>
              {importPreview.errors.length > 0 && (
                <div className="notice error" style={{ marginTop: "8px" }}>
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

      <Metrics
        items={[
          { label: "Tổng nhân sự hiển thị", value: `${filteredTeachers.length}/${teachers.length}`, detail: "Danh sách giảng viên & trợ giảng" },
          { label: "Đang hoạt động tại khoa", value: activeCount, detail: `${teachers.length - activeCount} nhân sự đang tạm nghỉ`, tone: "text-success" },
          { label: "Trạng thái trực tuyến", value: `${onlineCount} Online`, detail: "Đang có phiên làm việc trên hệ thống", tone: "text-primary" },
          { label: "Đã khai báo năng lực", value: `${capableCount}/${teachers.length}`, detail: "Có ít nhất 1 học phần LEC hoặc TUT" },
        ]}
      />

      {/* Bộ lọc danh sách Nhân Sự */}
      <div className="filters" style={{ flexWrap: "wrap", gap: "10px", marginBottom: "14px", alignItems: "flex-end" }}>
        <label style={{ flex: 2, minWidth: "220px" }}>
          Tìm mã GV, họ tên hoặc mã môn
          <input
            type="search"
            placeholder="VD: KhoaTN, Nguyễn Văn A, 61FIT3SS1..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {!isHead && (
          <label style={{ flex: 1, minWidth: "160px" }}>
            Bộ môn
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">Tất cả bộ môn ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} - {d.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label style={{ flex: 1, minWidth: "160px" }}>
          Trạng thái tại Khoa
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động tại khoa</option>
            <option value="inactive">Tạm nghỉ / Ngưng xếp lớp</option>
          </select>
        </label>
        <label style={{ flex: 1, minWidth: "180px" }}>
          Lọc theo môn phụ trách
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="">Tất cả học phần ({allCourses.length})</option>
            {allCourses.map((c) => (
              <option key={c} value={c}>
                {c} {courseNames.get(c) ? `- ${courseNames.get(c)}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!filteredTeachers.length ? (
        <EmptyState title="Không tìm thấy nhân sự phù hợp">
          Thử xóa bộ lọc tìm kiếm hoặc bấm &quot;+ Thêm nhân sự&quot;.
        </EmptyState>
      ) : (
        <div className="table-wrap table-scroll" style={{ maxHeight: "640px" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "175px" }}>Nhân sự (Mã & Họ tên)</th>
                <th style={{ width: "175px" }}>Bộ môn & Vai trò</th>
                <th style={{ width: "205px" }}>Trạng thái Khoa & Online</th>
                <th style={{ width: "105px" }}>Khối lượng</th>
                <th>Môn phụ trách & Năng lực (LEC / TUT)</th>
                {isStaff && <th style={{ width: "110px", textAlign: "right" }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((t) => {
                const isAct = t.active !== false;
                const isOnline = onlineSet.has(t.id);
                const load = teacherLoad(t.id);
                const classCount = sessions.filter((s) => s.teacher === t.id).length;

                // CHỈ hiển thị những môn mà giảng viên này thực sự phụ trách (gọn gàng, không liệt kê cả 27 môn của khoa)
                const assignedCourses = Array.from(
                  new Set([
                    ...Object.keys(t.capabilities || {}).filter((c) => (t.capabilities?.[c]?.length ?? 0) > 0),
                    ...(isHead ? draftCoursesByTeacher[t.id] ?? [] : []),
                  ])
                ).sort();

                const remainingCourses = allCourses.filter((c) => !assignedCourses.includes(c));

                return (
                  <tr
                    key={t.id}
                    style={{
                      opacity: isAct ? 1 : 0.65,
                      background: isAct ? undefined : "#f8fafc",
                    }}
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          title={isOnline ? "Đang trực tuyến" : "Ngoại tuyến"}
                          style={{
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: isOnline ? "#22c55e" : "#cbd5e1",
                            boxShadow: isOnline ? "0 0 0 3px rgba(34,197,94,0.18)" : undefined,
                          }}
                        />
                        <b>{t.id}</b>
                      </div>
                      <small style={{ display: "block", marginTop: "2px", fontWeight: 500, color: "#475569" }}>
                        {t.name || t.id}
                      </small>
                    </td>

                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "26px",
                            padding: "0 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            color: "#334155",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.department}
                        </span>
                        {isHead || isStaff ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void toggleAssistant(t)}
                            title={
                              t.assistant
                                ? "Trợ giảng (chỉ dạy TUT) — Bấm để đổi sang Giảng viên"
                                : "Giảng viên (dạy LEC + TUT) — Bấm để đổi sang Trợ giảng"
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: "26px",
                              height: "26px",
                              padding: "0 10px",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              lineHeight: 1,
                              whiteSpace: "nowrap",
                              borderRadius: "6px",
                              background: t.assistant ? "#fffbeb" : "#f8fafc",
                              borderColor: t.assistant ? "#fde68a" : "#cbd5e1",
                              color: t.assistant ? "#b45309" : "#0f172a",
                            }}
                          >
                            {t.assistant ? "Trợ giảng" : "Giảng viên"}
                          </button>
                        ) : (
                          <span style={{ fontSize: "11.5px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                            {t.assistant ? "Trợ giảng" : "Giảng viên"}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                        <button
                          type="button"
                          disabled={busy || (!isHead && !isStaff)}
                          onClick={() => void toggleActive(t)}
                          title={
                            isAct
                              ? "Đang hoạt động tại khoa — Bấm để chuyển sang Tạm nghỉ"
                              : "Đang tạm nghỉ tại khoa — Bấm để kích hoạt lại"
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                            minHeight: "26px",
                            height: "26px",
                            padding: "0 10px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                            borderRadius: "6px",
                            background: isAct ? "#ecfdf5" : "#fef2f2",
                            borderColor: isAct ? "#a7f3d0" : "#fecaca",
                            color: isAct ? "#047857" : "#b91c1c",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: isAct ? "#10b981" : "#ef4444",
                            }}
                          />
                          {isAct ? "Hoạt động" : "Tạm nghỉ"}
                        </button>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                            height: "26px",
                            padding: "0 9px",
                            fontSize: "11.5px",
                            fontWeight: 500,
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                            borderRadius: "6px",
                            background: isOnline ? "#f0fdf4" : "#f8fafc",
                            border: `1px solid ${isOnline ? "#bbf7d0" : "#e2e8f0"}`,
                            color: isOnline ? "#15803d" : "#64748b",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: isOnline ? "#22c55e" : "#94a3b8",
                            }}
                          />
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <b>{load}</b> <small>tiết/tuần</small>
                      <small style={{ display: "block", color: "var(--muted)" }}>{classCount} lớp phụ trách</small>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "7px" }}>
                        {assignedCourses.length === 0 && !isHead && (
                          <small style={{ color: "#94a3b8", fontStyle: "italic" }}>
                            Chưa khai báo học phần phụ trách
                          </small>
                        )}

                        {assignedCourses.map((course) => {
                          const kinds = t.capabilities?.[course] ?? [];
                          const hasLec = kinds.includes("LEC");
                          const hasTut = kinds.includes("TUT");
                          const isHighlighted = courseFilter === course;

                          return (
                            <div
                              key={course}
                              title={courseNames.get(course) ? `${course} — ${courseNames.get(course)}` : course}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "3px 8px",
                                borderRadius: "8px",
                                border: `1px solid ${isHighlighted ? "#60a5fa" : "#dbe3ef"}`,
                                background: isHighlighted ? "#f8fbff" : "#ffffff",
                                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                                fontSize: "11.5px",
                              }}
                            >
                              <span style={{ fontWeight: 600, color: "#1e293b", marginRight: "2px" }}>{course}</span>

                              {isHead ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={busy || t.assistant}
                                    onClick={() => void toggleCapability(t, course, "LEC")}
                                    title={t.assistant ? "Trợ giảng không phụ trách LEC" : `Tick chọn dạy Lý thuyết (LEC) môn ${course}`}
                                    style={{
                                      minHeight: "22px",
                                      height: "22px",
                                      padding: "0 7px",
                                      fontSize: "10.5px",
                                      fontWeight: 600,
                                      lineHeight: 1,
                                      borderRadius: "5px",
                                      background: hasLec ? "#eff6ff" : "#f8fafc",
                                      color: hasLec ? "#1d4ed8" : "#94a3b8",
                                      borderColor: hasLec ? "#93c5fd" : "#e2e8f0",
                                    }}
                                  >
                                    {hasLec ? "✓ LEC" : "LEC"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void toggleCapability(t, course, "TUT")}
                                    title={`Tick chọn dạy Thực hành (TUT) môn ${course}`}
                                    style={{
                                      minHeight: "22px",
                                      height: "22px",
                                      padding: "0 7px",
                                      fontSize: "10.5px",
                                      fontWeight: 600,
                                      lineHeight: 1,
                                      borderRadius: "5px",
                                      background: hasTut ? "#ecfdf5" : "#f8fafc",
                                      color: hasTut ? "#047857" : "#94a3b8",
                                      borderColor: hasTut ? "#6ee7b7" : "#e2e8f0",
                                    }}
                                  >
                                    {hasTut ? "✓ TUT" : "TUT"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void removeCourseFromTeacher(t, course)}
                                    title={`Gỡ môn ${course} khỏi giảng viên ${t.id}`}
                                    aria-label={`Gỡ môn ${course}`}
                                    style={{
                                      minHeight: "20px",
                                      height: "20px",
                                      width: "20px",
                                      padding: 0,
                                      marginLeft: "1px",
                                      fontSize: "13px",
                                      lineHeight: 1,
                                      borderRadius: "4px",
                                      border: "none",
                                      background: "transparent",
                                      color: "#94a3b8",
                                    }}
                                  >
                                    ×
                                  </button>
                                </>
                              ) : (
                                <>
                                  {hasLec && (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        height: "20px",
                                        padding: "0 6px",
                                        borderRadius: "5px",
                                        fontSize: "10.5px",
                                        fontWeight: 600,
                                        background: "#eff6ff",
                                        border: "1px solid #bfdbfe",
                                        color: "#1d4ed8",
                                      }}
                                    >
                                      LEC
                                    </span>
                                  )}
                                  {hasTut && (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        height: "20px",
                                        padding: "0 6px",
                                        borderRadius: "5px",
                                        fontSize: "10.5px",
                                        fontWeight: 600,
                                        background: "#ecfdf5",
                                        border: "1px solid #a7f3d0",
                                        color: "#047857",
                                      }}
                                    >
                                      TUT
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}

                        {isHead && (
                          <select
                            aria-label={`Thêm môn phụ trách cho ${t.id}`}
                            disabled={busy}
                            value=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) void addCourseToTeacher(t, val);
                            }}
                            style={{
                              minHeight: "28px",
                              height: "28px",
                              width: "auto",
                              maxWidth: "185px",
                              padding: "0 24px 0 9px",
                              fontSize: "11.5px",
                              fontWeight: 500,
                              borderRadius: "7px",
                              border: "1px dashed #cbd5e1",
                              background: "#f8fafc",
                              color: "#475569",
                              cursor: "pointer",
                            }}
                          >
                            <option value="">
                              {assignedCourses.length === 0 ? "+ Chọn môn phụ trách…" : "+ Thêm môn…"}
                            </option>
                            {remainingCourses.map((c) => (
                              <option key={c} value={c}>
                                {c} {courseNames.get(c) ? `· ${courseNames.get(c)}` : ""}
                              </option>
                            ))}
                            <option value="__CUSTOM__">+ Nhập mã môn khác…</option>
                          </select>
                        )}
                      </div>
                    </td>

                    {isStaff && (
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setTeacherModal({
                              open: true,
                              isEdit: true,
                              id: t.id,
                              name: t.name || t.id,
                              department: t.department,
                              assistant: t.assistant,
                              active: t.active !== false,
                            })
                          }
                          style={{
                            minHeight: "26px",
                            height: "26px",
                            padding: "0 8px",
                            fontSize: "11.5px",
                            marginRight: "5px",
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn-remove"
                          disabled={busy}
                          onClick={() => void handleDeleteTeacher(t.id)}
                          style={{
                            minHeight: "26px",
                            height: "26px",
                            padding: "0 8px",
                            fontSize: "11.5px",
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {teacherModal.open && isStaff && (
        <div className="modal-overlay" onClick={() => setTeacherModal({ ...teacherModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{teacherModal.isEdit ? "Chỉnh sửa Nhân sự" : "Thêm Nhân sự mới"}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setTeacherModal({ ...teacherModal, open: false })}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveTeacherModal();
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
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} - {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  checked={teacherModal.assistant}
                  onChange={(e) => setTeacherModal({ ...teacherModal, assistant: e.target.checked })}
                />
                <span>Trợ giảng (chỉ phụ trách tiết thực hành TUT)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  checked={teacherModal.active}
                  onChange={(e) => setTeacherModal({ ...teacherModal, active: e.target.checked })}
                />
                <span>Đang hoạt động giảng dạy tại khoa</span>
              </label>
              <div className="actions" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setTeacherModal({ ...teacherModal, open: false })}>
                  Hủy
                </button>
                <button className="primary" type="submit">
                  {teacherModal.isEdit ? "Cập nhật" : "Thêm nhân sự"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
