"use client";
import { useMemo, useState } from "react";
import { eligible } from "./eligibility";
import { ActionButton, EmptyState, Icon, Metrics } from "../shared/ui";
import type { Department, ClassSession, Teacher } from "../workspace/ui-types";
import type { OfferingItem } from "../workspace/types";

export function AssignmentPanel({
  sessions,
  teachers,
  departments,
  offerings = [],
  head,
  busy,
  onCommand,
  onOpenPersonnel,
}: {
  sessions: ClassSession[];
  teachers: Teacher[];
  departments: Department[];
  offerings?: OfferingItem[];
  head: boolean;
  busy: boolean;
  onCommand: (action: string, payload: unknown) => Promise<void>;
  onOpenPersonnel?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [teacherQuery, setTeacherQuery] = useState("");
  const [coordCollapsed, setCoordCollapsed] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [returnModal, setReturnModal] = useState<{ open: boolean; deptId: string; deptName: string; note: string }>({
    open: false,
    deptId: "",
    deptName: "",
    note: "",
  });

  const editable = head && departments[0]?.status === "SENT";
  const invalid = (s: ClassSession) => !teachers.some((t) => t.id === s.teacher && eligible(s, t));
  const pending = sessions.filter(invalid).length;

  const courseNameMap = useMemo(() => {
    const m = new Map<string, string>();
    offerings.forEach((o) => {
      if (o.course && o.name && !m.has(o.course)) m.set(o.course, o.name);
    });
    return m;
  }, [offerings]);

  const unsentDepts = useMemo(
    () => departments.filter((d) => d.status === "UNSENT"),
    [departments]
  );
  const unsentWithClasses = useMemo(
    () => unsentDepts.filter((d) => sessions.some((s) => s.department === d.id)),
    [unsentDepts, sessions]
  );
  const submittedCount = useMemo(
    () => departments.filter((d) => d.status === "SUBMITTED").length,
    [departments]
  );

  const filtered = sessions.filter(
    (s) =>
      (!department || s.department === department) &&
      (status === "all" ||
        (status === "pending"
          ? !s.teacher
          : status === "invalid"
          ? !!s.teacher && invalid(s)
          : !!s.teacher && !invalid(s))) &&
      [
        s.id,
        s.course,
        courseNameMap.get(s.course) ?? "",
        teachers.find((t) => t.id === s.teacher)?.name ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi"))
  );

  const load = (id: string) =>
    sessions.filter((s) => s.teacher === id).reduce((n, s) => n + (s.periods ?? 0), 0);

  const filteredTeachers = teachers.filter(
    (t) =>
      !teacherQuery ||
      t.id.toLowerCase().includes(teacherQuery.toLowerCase()) ||
      (t.name || "").toLowerCase().includes(teacherQuery.toLowerCase())
  );

  const runAction = async (key: string, action: string, payload: unknown) => {
    setPendingKey(key);
    try {
      await onCommand(action, payload);
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <>
      <Metrics
        items={[
          {
            label: "Lớp trong kế hoạch",
            value: sessions.length,
            detail: head ? "Thuộc phạm vi bộ môn" : "Toàn bộ lớp học phần",
          },
          {
            label: "Phân công hợp lệ",
            value: sessions.length - pending,
            detail: "Đúng bộ môn, đang dạy & đủ năng lực",
            tone: "text-success",
          },
          {
            label: "Cần hoàn tất",
            value: pending,
            detail: "Chưa gán GV hoặc cần điều chỉnh",
            tone: pending ? "text-warning" : "",
          },
          head
            ? {
                label: "Nhân sự đang dạy",
                value: teachers.filter((t) => t.active !== false).length,
                detail: `Trên tổng ${teachers.length} nhân sự bộ môn`,
              }
            : {
                label: "Bộ môn đã nộp",
                value: `${submittedCount}/${departments.length}`,
                detail: "Hoàn tất bàn giao phân công",
                tone: submittedCount === departments.length && departments.length > 0 ? "text-success" : "",
              },
        ]}
      />

      {/* Điều phối Kế hoạch Phân công theo Bộ môn (chỉ Giáo vụ) */}
      {!head && departments.length > 0 && (
        <section className="coord-strip" aria-label="Điều phối kế hoạch phân công theo bộ môn">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <Icon name="send" size={16} />
              <b style={{ fontSize: "13.5px", color: "var(--ink)" }}>
                Điều phối Kế hoạch Phân công theo Bộ môn
              </b>
              <span className="badge neutral">
                {submittedCount}/{departments.length} đã nộp
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {unsentDepts.length > 0 && (
                <ActionButton
                  type="button"
                  variant="primary"
                  icon="send"
                  loading={pendingKey === "send-all"}
                  loadingLabel="Đang gửi..."
                  disabled={busy || unsentWithClasses.length === 0}
                  onClick={() => void runAction("send-all", "send-all", {})}
                  style={{ minHeight: "32px", padding: "4px 12px", fontSize: "12px" }}
                >
                  Gửi kế hoạch đồng loạt ({unsentWithClasses.length || unsentDepts.length} bộ môn)
                </ActionButton>
              )}
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setCoordCollapsed((prev) => !prev)}
                style={{
                  minHeight: "30px",
                  padding: "3px 9px",
                  fontSize: "11.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Icon name={coordCollapsed ? "chevron-right" : "chevron-down"} size={14} />
                <span>{coordCollapsed ? "Mở rộng" : "Thu gọn"}</span>
              </button>
            </div>
          </div>

          {!coordCollapsed && (
            <div className="coord-grid">
              {departments.map((d) => {
                const classes = sessions.filter((s) => s.department === d.id);
                const assigned = classes.filter((s) => s.teacher).length;
                const pct = classes.length ? Math.round((assigned / classes.length) * 100) : 0;
                const statusLabel =
                  d.status === "SUBMITTED"
                    ? "Đã nộp"
                    : d.status === "SENT"
                    ? "Đang phân công"
                    : "Chưa gửi";
                const statusTone =
                  d.status === "SUBMITTED"
                    ? "success"
                    : d.status === "SENT"
                    ? "warning"
                    : "neutral";

                return (
                  <div className="coord-dept-card" key={d.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <b style={{ fontSize: "12.5px", display: "block" }}>{d.name || d.id}</b>
                        <small style={{ color: "var(--muted)" }}>
                          {d.id} · Đã gán {assigned}/{classes.length} lớp
                        </small>
                      </div>
                      <span className={"badge " + statusTone}>{statusLabel}</span>
                    </div>

                    <div className="progress-track" style={{ marginTop: 0 }}>
                      <span style={{ width: `${pct}%` }} />
                    </div>

                    {d.note && (
                      <small
                        style={{
                          background: "#fffbeb",
                          border: "1px solid #fde68a",
                          color: "#92400e",
                          padding: "4px 7px",
                          borderRadius: "5px",
                        }}
                      >
                        Lý do trả lại: {d.note}
                      </small>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        marginTop: "auto",
                        paddingTop: "2px",
                      }}
                    >
                      {d.status === "UNSENT" ? (
                        <ActionButton
                          type="button"
                          icon="send"
                          loading={pendingKey === `send-${d.id}`}
                          disabled={busy || !classes.length}
                          onClick={() =>
                            void runAction(`send-${d.id}`, "send", { department: d.id })
                          }
                          style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11.5px" }}
                        >
                          Gửi kế hoạch
                        </ActionButton>
                      ) : d.status === "SUBMITTED" ? (
                        <ActionButton
                          type="button"
                          icon="undo"
                          disabled={busy}
                          onClick={() =>
                            setReturnModal({
                              open: true,
                              deptId: d.id,
                              deptName: d.name || d.id,
                              note: "",
                            })
                          }
                          style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11.5px" }}
                        >
                          Mở khóa / Trả lại
                        </ActionButton>
                      ) : (
                        <small style={{ color: "var(--muted)" }}>Chờ Trưởng bộ môn nộp</small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {head && (
        <div className={"context-banner " + (editable ? "" : "subtle")}>
          <Icon name="assign" />
          <div>
            <b>
              {editable
                ? "Bộ môn đang tiếp nhận phân công"
                : departments[0]?.status === "SUBMITTED"
                ? "Đã nộp phân công cho Giáo vụ"
                : "Chờ Giáo vụ gửi kế hoạch"}
            </b>
            <p>
              {editable
                ? "Chọn giảng viên đủ năng lực LEC / TUT cho từng lớp học phần, kiểm tra cân đối tải rồi nộp."
                : "Để bổ sung môn phụ trách (LEC / TUT) của từng giảng viên, hãy chuyển sang mục Nhân Sự."}
            </p>
            {departments[0]?.note && (
              <p style={{ color: "#92400e", fontWeight: 500 }}>
                <b>Yêu cầu điều chỉnh từ Giáo vụ:</b> {departments[0].note}
              </p>
            )}
          </div>
          {onOpenPersonnel && (
            <ActionButton type="button" icon="personnel" onClick={onOpenPersonnel}>
              Mở mục Nhân Sự
            </ActionButton>
          )}
        </div>
      )}

      <div className="assignment-layout">
        <section className="card assignment-table">
          <div className="section-heading" style={{ marginBottom: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon name="list" size={17} />
              <h2 style={{ margin: 0 }}>
                Danh sách lớp học phần ({filtered.length}/{sessions.length})
              </h2>
            </div>
          </div>

          <div className="filters assignment-filters">
            <label className="search-field">
              Tìm lớp, môn hoặc giảng viên
              <input
                type="search"
                placeholder="Mã lớp, mã/tên môn hoặc tên giảng viên..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="mobile-filter-toggle"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              aria-expanded={showMobileFilters}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Icon name="filter" size={14} />
                <span>Bộ lọc</span>
              </span>
              {(status !== "all" || department) && <span className="filter-badge">Đang lọc</span>}
            </button>
            <div className={`filter-group ${showMobileFilters ? "open" : ""}`}>
              <label>
                Trạng thái
                <select aria-label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chưa phân công</option>
                  <option value="assigned">Đã phân công hợp lệ</option>
                  <option value="invalid">Cần điều chỉnh</option>
                </select>
              </label>
              {!head && (
                <label>
                  Bộ môn
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">Tất cả bộ môn</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || d.id}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          <div className="table-wrap table-scroll" style={{ maxHeight: "540px" }}>
            <table role="table">
              <caption className="sr-only">Phân công lớp học phần, {filtered.length} kết quả</caption>
              <thead>
                <tr>
                  <th scope="col">Lớp / Môn học</th>
                  <th scope="col">Loại buổi</th>
                  <th scope="col">Quy mô</th>
                  <th scope="col">Giảng viên phụ trách</th>
                  <th scope="col">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const candidates = teachers.filter((t) => eligible(s, t));
                  const cName = courseNameMap.get(s.course);
                  return (
                    <tr key={s.id}>
                      <td>
                        <b>
                          {s.course}
                          {cName ? ` — ${cName}` : ""}
                        </b>
                        <small>{s.id} · Bộ môn {s.department}</small>
                      </td>
                      <td>
                        <span className="badge neutral">
                          {(
                            {
                              LEC: "Lý thuyết (LEC)",
                              TUT: "Thực hành (TUT)",
                              COMBINED: "LT + TH",
                            } as Record<string, string>
                          )[s.kind] ?? s.kind}
                        </span>
                      </td>
                      <td>
                        {s.students} SV
                        <small>{s.periods ?? "—"} tiết/tuần</small>
                      </td>
                      <td data-label="Giảng viên phụ trách">
                        {head ? (
                          <>
                            <select
                              aria-label={"Giảng viên cho " + s.id}
                              disabled={busy || !editable || !candidates.length}
                              value={s.teacher ?? ""}
                              onChange={(e) =>
                                void runAction(`assign-${s.id}`, "assign", {
                                  department: s.department,
                                  session: s.id,
                                  teacher: e.target.value,
                                })
                              }
                            >
                              <option value="" disabled>
                                Chọn giảng viên ({s.kind})
                              </option>
                              {s.teacher && !candidates.some((t) => t.id === s.teacher) && (
                                <option value={s.teacher}>
                                  Cần điều chỉnh:{" "}
                                  {teachers.find((t) => t.id === s.teacher)?.name || s.teacher}
                                </option>
                              )}
                              {candidates.map((t) => (
                                <option value={t.id} key={t.id}>
                                  {t.name && t.name !== t.id ? `${t.name} (${t.id})` : t.id} ·{" "}
                                  {load(t.id)} tiết
                                </option>
                              ))}
                            </select>
                            {!candidates.length && (
                              <small className="text-warning" style={{ display: "block", marginTop: "4px" }}>
                                Chưa có GV đủ năng lực {s.kind}.{" "}
                                {onOpenPersonnel ? (
                                  <button
                                    type="button"
                                    onClick={onOpenPersonnel}
                                    style={{
                                      minHeight: "auto",
                                      padding: "0 4px",
                                      border: "none",
                                      background: "transparent",
                                      color: "#1d4ed8",
                                      textDecoration: "underline",
                                      fontSize: "11.5px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Mở Nhân Sự để tích môn
                                  </button>
                                ) : (
                                  "Hãy bổ sung tại mục Nhân Sự."
                                )}
                              </small>
                            )}
                          </>
                        ) : (
                          (() => {
                            const assignedTeacher = teachers.find((t) => t.id === s.teacher);
                            if (!s.teacher) {
                              return <span style={{ color: "var(--muted)" }}>Chưa phân công</span>;
                            }
                            return (
                              <span>
                                <b>{assignedTeacher?.id || s.teacher}</b>
                                {assignedTeacher?.name && assignedTeacher.name !== assignedTeacher.id
                                  ? ` — ${assignedTeacher.name}`
                                  : ""}
                              </span>
                            );
                          })()
                        )}
                      </td>
                      <td>
                        <span className={"badge " + (invalid(s) ? "warning" : "success")}>
                          {!s.teacher
                            ? "Chưa phân công"
                            : invalid(s)
                            ? "Cần điều chỉnh"
                            : "Đã phân công"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!filtered.length && (
            <EmptyState
              title={sessions.length ? "Không tìm thấy lớp phù hợp" : "Chưa có lớp trong kế hoạch"}
            >
              {sessions.length
                ? "Thử từ khóa khác hoặc chọn tất cả trạng thái."
                : "Lớp sẽ xuất hiện sau khi Giáo vụ nhập kế hoạch mở lớp."}
            </EmptyState>
          )}

          <div className="table-footer">
            <small>
              Hiển thị {filtered.length}/{sessions.length} lớp học phần
            </small>
            <small>Thay đổi được lưu ngay sau khi chọn giảng viên.</small>
          </div>

          {head && (
            <div className="assignment-submit">
              <p>
                <b>{pending ? pending + " lớp cần hoàn tất" : "Phân công đã sẵn sàng"}</b>
                <small>Trùng giờ sẽ được kiểm tra tự động ở bước Giáo vụ xếp lịch.</small>
              </p>
              <div className="actions">
                <ActionButton
                  type="button"
                  icon="sliders"
                  loading={pendingKey === "balance"}
                  disabled={busy || !editable || !sessions.some((s) => !s.teacher)}
                  onClick={() =>
                    void runAction("balance", "balance", { department: departments[0]?.id })
                  }
                >
                  Chia đều lớp còn trống
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="primary"
                  icon="send"
                  loading={pendingKey === "submit"}
                  loadingLabel="Đang nộp..."
                  disabled={busy || !editable || !sessions.length || pending > 0}
                  onClick={() =>
                    void runAction("submit", "submit", { department: departments[0]?.id })
                  }
                >
                  Nộp cho Giáo vụ
                </ActionButton>
              </div>
            </div>
          )}
        </section>

        <section className="card workload">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <h2 style={{ margin: 0 }}>Khối lượng giảng dạy</h2>
            <span className="badge neutral">
              {filteredTeachers.length}/{teachers.length} GV
            </span>
          </div>
          <p style={{ margin: "0 0 10px 0" }}>Tổng tiết/tuần theo phân công hiện tại.</p>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="search"
              value={teacherQuery}
              onChange={(e) => setTeacherQuery(e.target.value)}
              placeholder="Lọc theo mã hoặc tên GV..."
              style={{
                width: "100%",
                height: "34px",
                minHeight: "34px",
                fontSize: "12px",
                padding: "0 10px",
              }}
            />
          </div>
          <div
            className="workload-list"
            style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "10px" }}
          >
            {!filteredTeachers.length && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  padding: "16px 0",
                  textAlign: "center",
                }}
              >
                Không tìm thấy giảng viên.
              </p>
            )}
            {filteredTeachers.map((t) => (
              <div
                className="teacher-load"
                key={t.id}
                style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <div>
                    <b style={{ color: "var(--accent)" }}>{t.id}</b>
                    {t.name && t.name !== t.id && (
                      <span style={{ marginLeft: "6px", fontSize: "12px", color: "var(--muted)" }}>
                        {t.name}
                      </span>
                    )}
                  </div>
                  <strong style={{ whiteSpace: "nowrap", marginLeft: "8px" }}>
                    {load(t.id)} <small>tiết</small>
                  </strong>
                </div>
                <small style={{ display: "block", color: "var(--muted)", marginTop: "2px" }}>
                  {sessions.filter((s) => s.teacher === t.id).length} lớp ·{" "}
                  {t.assistant ? "Trợ giảng" : "Giảng viên"}
                  {t.active === false ? " · (Tạm nghỉ)" : ""}
                </small>
                <div className="progress-track" style={{ marginTop: "4px" }}>
                  <span
                    style={{
                      width:
                        (load(t.id) / Math.max(1, ...teachers.map((x) => load(x.id)))) * 100 +
                        "%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="inline-help" style={{ marginTop: "10px" }}>
            Thanh so sánh tương đối giữa các giảng viên.
          </p>
        </section>
      </div>

      {/* Modal Mở khóa / Trả lại phân công cho Bộ môn */}
      {returnModal.open && (
        <div
          className="modal-overlay"
          onClick={() => pendingKey !== "return-modal" && setReturnModal({ ...returnModal, open: false })}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mở khóa &amp; trả lại phân công — {returnModal.deptName}</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Đóng"
                disabled={pendingKey === "return-modal"}
                onClick={() => setReturnModal({ ...returnModal, open: false })}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!returnModal.note.trim()) return;
                void runAction("return-modal", "return", {
                  department: returnModal.deptId,
                  note: returnModal.note.trim(),
                }).then(() => {
                  setReturnModal({ open: false, deptId: "", deptName: "", note: "" });
                });
              }}
            >
              <label>
                Nội dung phản hồi / Lý do cần điều chỉnh
                <textarea
                  required
                  maxLength={1000}
                  value={returnModal.note}
                  onChange={(e) => setReturnModal({ ...returnModal, note: e.target.value })}
                  placeholder="Nêu rõ lớp học phần hoặc giảng viên cần Trưởng bộ môn rà soát lại..."
                />
              </label>
              <div className="actions" style={{ justifyContent: "flex-end", marginTop: "14px" }}>
                <button
                  type="button"
                  disabled={pendingKey === "return-modal"}
                  onClick={() => setReturnModal({ ...returnModal, open: false })}
                >
                  Hủy
                </button>
                <ActionButton
                  type="submit"
                  variant="primary"
                  icon="send"
                  loading={pendingKey === "return-modal"}
                  loadingLabel="Đang gửi..."
                  disabled={!returnModal.note.trim()}
                >
                  Xác nhận mở khóa &amp; gửi phản hồi
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
