"use client";
import { ActionButton, EmptyState, Icon } from "../shared/ui";
import type { Department, ClassSession } from "./ui-types";

export function Workflow({
  departments,
  sessions,
  draftCount,
  published,
  navigate,
}: {
  departments: Department[];
  sessions: ClassSession[];
  draftCount: number;
  published: boolean;
  navigate: (tab: string) => void;
}) {
  const submitted = departments.length > 0 && departments.every((d) => d.status === "SUBMITTED");
  const steps = [
    { title: "Kế hoạch mở lớp", owner: "Giáo vụ", done: sessions.length > 0, target: "setup" },
    { title: "Phân công giảng viên", owner: "Giáo vụ & Trưởng bộ môn", done: submitted, target: "assign" },
    { title: "Xếp & kiểm tra lịch", owner: "Giáo vụ", done: draftCount > 0, target: "draft" },
    { title: "Công bố & theo dõi", owner: "Giáo vụ - Giảng viên", done: published, target: "draft" },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <section className="card workflow">
      <div className="section-heading">
        <div>
          <h2>Phối hợp trong học kỳ</h2>
          <p>Trạng thái bàn giao từ kế hoạch mở lớp đến thời khóa biểu chính thức.</p>
        </div>
        <span className="badge neutral">4 bước nghiệp vụ</span>
      </div>
      <ol className="workflow-steps">
        {steps.map((s, i) => (
          <li key={s.title} className={s.done ? "complete" : current === i ? "current" : ""}>
            <button type="button" onClick={() => navigate(s.target)}>
              <span className="step-number">
                {s.done ? <Icon name="check" size={14} /> : "0" + (i + 1)}
              </span>
              <span>
                <b>{s.title}</b>
                <small>{s.owner}</small>
                <em>
                  {s.done ? "Đã có dữ liệu" : current === i ? "Cần thực hiện" : "Chưa hoàn tất"}
                </em>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {published && (
        <p className="inline-help">
          Lịch đã công bố được giữ riêng. Phân công mới cần được kiểm tra lại trước lần công bố tiếp theo.
        </p>
      )}
    </section>
  );
}

export function DepartmentProgress({
  departments,
  sessions,
  staff,
  busy,
  navigate,
}: {
  departments: Department[];
  sessions: ClassSession[];
  staff: boolean;
  busy?: boolean;
  navigate: (tab: string) => void;
  onCommand?: (action: string, payload: unknown) => Promise<void>;
}) {
  const submittedCount = departments.filter((d) => d.status === "SUBMITTED").length;
  return (
    <section className="card" id="department-progress" tabIndex={-1}>
      <div className="section-heading" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2>Tiến độ phân công theo bộ môn</h2>
          <p>
            {staff
              ? "Tổng quan kết quả gán lớp của các bộ môn. Gửi kế hoạch hoặc mở khóa điều chỉnh tại mục Phân công."
              : "Theo dõi tỷ lệ lớp đã gán giảng viên của bộ môn trước khi nộp cho Giáo vụ."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge neutral">
            {submittedCount}/{departments.length} bộ môn đã nộp
          </span>
          <ActionButton
            type="button"
            variant="primary"
            icon="arrow-right"
            disabled={busy}
            onClick={() => navigate("assign")}
            style={{ minHeight: "32px", padding: "5px 12px", fontSize: "12px" }}
          >
            Điều phối tại mục Phân công
          </ActionButton>
        </div>
      </div>

      {!departments.length ? (
        <EmptyState title="Chưa có bộ môn">
          Nhập danh mục bộ môn và kế hoạch mở lớp tại mục Kế hoạch &amp; Khung giờ để bắt đầu.
        </EmptyState>
      ) : (
        <div className="department-list">
          {departments.map((d) => {
            const classes = sessions.filter((s) => s.department === d.id);
            const assigned = classes.filter((s) => s.teacher).length;
            const pct = classes.length ? Math.round((assigned / classes.length) * 100) : 0;
            return (
              <article className="department-row" key={d.id}>
                <div className="department-main">
                  <span className="department-avatar">
                    <Icon name="assign" />
                  </span>
                  <div>
                    <h3>{d.name || d.id}</h3>
                    <small>
                      {d.id} · Đã gán {assigned}/{classes.length} lớp ({pct}%)
                    </small>
                  </div>
                  <span
                    className={
                      "badge " +
                      (d.status === "SUBMITTED"
                        ? "success"
                        : d.status === "SENT"
                        ? "warning"
                        : "neutral")
                    }
                  >
                    {d.status === "SUBMITTED"
                      ? "Đã nộp"
                      : d.status === "SENT"
                      ? d.note
                        ? "Cần điều chỉnh"
                        : "Đang phân công"
                      : "Chưa gửi"}
                  </span>
                </div>
                <div
                  className="progress-track"
                  aria-label={`${assigned}/${classes.length} lớp có giảng viên`}
                >
                  <span style={{ width: pct + "%" }} />
                </div>
                {d.note && (
                  <p className="feedback" style={{ marginBottom: 0, marginTop: "10px" }}>
                    <b>Phản hồi Giáo vụ:</b> {d.note}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
