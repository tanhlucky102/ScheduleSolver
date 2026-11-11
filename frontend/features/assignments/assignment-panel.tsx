"use client";
import { useState } from "react";
import { eligible } from "./eligibility";
import { Icon, EmptyState, Metrics } from "../shared/ui";
import type { Department, ClassSession, Teacher } from "../workspace/ui-types";

export function AssignmentPanel({
  sessions,
  teachers,
  departments,
  head,
  busy,
  onCommand,
  onOpenPersonnel,
}: {
  sessions: ClassSession[];
  teachers: Teacher[];
  departments: Department[];
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

  const editable = head && departments[0]?.status === "SENT";
  const invalid = (s: ClassSession) => !teachers.some((t) => t.id === s.teacher && eligible(s, t));
  const pending = sessions.filter(invalid).length;

  const filtered = sessions.filter(
    (s) =>
      (!department || s.department === department) &&
      (status === "all" ||
        (status === "pending"
          ? !s.teacher
          : status === "invalid"
          ? !!s.teacher && invalid(s)
          : !!s.teacher && !invalid(s))) &&
      [s.id, s.course, teachers.find((t) => t.id === s.teacher)?.name ?? ""]
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

  return (
    <>
      <Metrics
        items={[
          { label: "Lớp trong kế hoạch", value: sessions.length, detail: "Phạm vi bộ môn được phép xem" },
          {
            label: "Phân công hợp lệ",
            value: sessions.length - pending,
            detail: "Đúng bộ môn, đang hoạt động và đủ năng lực",
            tone: "text-success",
          },
          {
            label: "Cần hoàn tất",
            value: pending,
            detail: "Chưa phân công hoặc cần điều chỉnh",
            tone: pending ? "text-warning" : "",
          },
        ]}
      />

      {head && (
        <div className={"context-banner " + (editable ? "" : "subtle")}>
          <Icon name="assign" />
          <div>
            <b>
              {editable
                ? "Bộ môn đang tiếp nhận phân công"
                : departments[0]?.status === "SUBMITTED"
                ? "Đã nộp phân công cho giáo vụ"
                : "Chờ giáo vụ gửi kế hoạch"}
            </b>
            <p>
              {editable
                ? "Chọn giảng viên đủ năng lực LEC / TUT cho từng lớp, kiểm tra khối lượng rồi nộp."
                : "Để chỉnh sửa môn phụ trách (LEC / TUT) của từng giảng viên, hãy chuyển sang mục Nhân Sự."}
            </p>
            {departments[0]?.note && (
              <p>
                <b>Yêu cầu điều chỉnh từ Giáo vụ:</b> {departments[0].note}
              </p>
            )}
          </div>
          {onOpenPersonnel && (
            <button type="button" onClick={onOpenPersonnel}>
              Mở mục Nhân Sự →
            </button>
          )}
        </div>
      )}

      <div className="assignment-layout">
        <section className="card assignment-table">
          <div className="section-heading">
            <div>
              <h2>Phân công lớp học phần (Ai dạy LEC / Ai dạy TUT)</h2>
              <p>
                {head
                  ? "Danh sách lọc tự động các giảng viên đang hoạt động tại khoa và có năng lực đúng loại buổi LEC / TUT."
                  : "Theo dõi tiến độ phân công do các Trưởng bộ môn thực hiện."}
              </p>
            </div>
          </div>

          <div className="filters assignment-filters">
            <label className="search-field">
              Tìm lớp, môn hoặc giảng viên
              <input
                type="search"
                placeholder="Mã lớp, môn hoặc tên giảng viên…"
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
              <span>Bộ lọc ⚙️</span>
              {(status !== "all" || department) && <span className="filter-badge">● Đang lọc</span>}
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

          <div className="table-wrap table-scroll" style={{ maxHeight: "560px" }}>
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
                  return (
                    <tr key={s.id}>
                      <td>
                        <b>{s.course}</b>
                        <small>{s.id}</small>
                      </td>
                      <td>
                        <span className="badge neutral">
                          {({ LEC: "Lý thuyết (LEC)", TUT: "Thực hành (TUT)", COMBINED: "LT + TH" } as Record<string, string>)[s.kind] ?? s.kind}
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
                                onCommand("assign", {
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
                                  Cần điều chỉnh: {teachers.find((t) => t.id === s.teacher)?.name || s.teacher}
                                </option>
                              )}
                              {candidates.map((t) => (
                                <option value={t.id} key={t.id}>
                                  {t.name} ({t.id}) · {load(t.id)} tiết
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
                                    Mở Nhân Sự để tích môn →
                                  </button>
                                ) : (
                                  "Hãy bổ sung tại mục Nhân Sự."
                                )}
                              </small>
                            )}
                          </>
                        ) : (
                          teachers.find((t) => t.id === s.teacher)?.name || s.teacher || "Chưa phân công"
                        )}
                      </td>
                      <td>
                        <span className={"badge " + (invalid(s) ? "warning" : "success")}>
                          {!s.teacher ? "Chưa phân công" : invalid(s) ? "Cần điều chỉnh" : "Đã phân công"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!filtered.length && (
            <EmptyState title={sessions.length ? "Không tìm thấy lớp phù hợp" : "Chưa có lớp trong kế hoạch"}>
              {sessions.length ? "Thử từ khóa khác hoặc chọn tất cả trạng thái." : "Lớp sẽ xuất hiện sau khi giáo vụ nhập kế hoạch."}
            </EmptyState>
          )}

          <div className="table-footer">
            <small>Hiển thị {filtered.length}/{sessions.length} lớp</small>
            <small>Thay đổi được lưu ngay sau khi chọn giảng viên.</small>
          </div>

          {head && (
            <div className="assignment-submit">
              <p>
                <b>{pending ? pending + " lớp cần hoàn tất" : "Phân công đã sẵn sàng"}</b>
                <small>Trùng giờ sẽ được kiểm tra tự động ở bước Giáo vụ xếp lịch.</small>
              </p>
              <div className="actions">
                <button
                  disabled={busy || !editable || !sessions.some((s) => !s.teacher)}
                  onClick={() => onCommand("balance", { department: departments[0]?.id })}
                >
                  Chia đều lớp còn trống
                </button>
                <button
                  className="primary"
                  disabled={busy || !editable || !sessions.length || pending > 0}
                  onClick={() => onCommand("submit", { department: departments[0]?.id })}
                >
                  Nộp cho giáo vụ →
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="card workload">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
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
              placeholder="🔍 Lọc theo mã GV (vd: KhoaTN, AnhNP)..."
              style={{ width: "100%", height: "34px", minHeight: "34px", fontSize: "12px", padding: "0 10px" }}
            />
          </div>
          <div className="workload-list" style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "14px" }}>
            {!filteredTeachers.length && (
              <p style={{ fontSize: "13px", color: "var(--muted)", padding: "16px 0", textAlign: "center" }}>
                Không tìm thấy giảng viên.
              </p>
            )}
            {filteredTeachers.map((t) => (
              <div className="teacher-load" key={t.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <b style={{ color: "var(--primary)" }}>{t.id}</b>
                    {t.name && t.name !== t.id && (
                      <span style={{ marginLeft: "6px", fontSize: "12px", color: "var(--muted)" }}>{t.name}</span>
                    )}
                  </div>
                  <strong style={{ whiteSpace: "nowrap", marginLeft: "8px" }}>
                    {load(t.id)} <small>tiết</small>
                  </strong>
                </div>
                <small style={{ display: "block", color: "var(--muted)", marginTop: "2px" }}>
                  {sessions.filter((s) => s.teacher === t.id).length} lớp · {t.assistant ? "Trợ giảng" : "Giảng viên"}
                  {t.active === false ? " · (Tạm nghỉ)" : ""}
                </small>
                <div className="progress-track" style={{ marginTop: "4px" }}>
                  <span style={{ width: (load(t.id) / Math.max(1, ...teachers.map((x) => load(x.id)))) * 100 + "%" }} />
                </div>
              </div>
            ))}
          </div>
          <p className="inline-help" style={{ marginTop: "10px" }}>
            Thanh so sánh tương đối giữa các giảng viên trong bộ môn.
          </p>
        </section>
      </div>
    </>
  );
}
