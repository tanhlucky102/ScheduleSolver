"use client";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Metrics, Icon, ActionButton, Spinner } from "../shared/ui";
import { clock } from "../shared/time";
import { DraftRow } from "./draft-row";
import { buildDraftEvents } from "./term-calendar-model";
import type { SolverProgress, Workspace } from "../workspace/types";

export function DraftSchedule({
  workspace,
  busy,
  ready,
  isEvaluating,
  solverProgress = {},
  solverRunning = false,
  perform,
  command,
  download,
  onAssignClick,
  onOpenTermDraft,
  draftLimit,
  setDraftLimit,
  draftQuery,
  setDraftQuery,
}: {
  workspace: Workspace;
  busy: boolean;
  ready: boolean;
  isEvaluating: boolean;
  solverProgress?: Record<string, SolverProgress>;
  solverRunning?: boolean;
  perform: (action: () => Promise<void>) => Promise<void>;
  command: (action: string, payload?: unknown) => Promise<void>;
  download: (source: string) => Promise<void>;
  onAssignClick: () => void;
  onOpenTermDraft?: () => void;
  draftLimit: number;
  setDraftLimit: Dispatch<SetStateAction<number>>;
  draftQuery: string;
  setDraftQuery: (value: string) => void;
}) {
  const state = workspace.state;
  const sessions = state.sessions ?? [];
  const draftMap = useMemo(() => new Map((state.draft ?? []).map((p) => [p.session, p])), [state.draft]);
  const draftEvents = useMemo(() => buildDraftEvents(state), [state]);

  const [showSolverDetails, setShowSolverDetails] = useState(false);
  const [downloadingSource, setDownloadingSource] = useState<"draft" | "published" | null>(null);

  const [algorithm, setAlgorithm] = useState<"PORTFOLIO" | "SA" | "TABU" | "HC">("PORTFOLIO");
  const [threads, setThreads] = useState<number>(4);
  const [iterations, setIterations] = useState<number>(600);
  const [seed, setSeed] = useState<number>(42);

  const slotOptions = useMemo(
    () =>
      state.config?.slots?.map((slot, i) => (
        <option value={i} key={i}>
          {slot.day === 8 ? "Chủ Nhật" : "Thứ " + slot.day} · bắt đầu {clock(slot.start)} (khung đến {clock(slot.end)})
        </option>
      )),
    [state.config?.slots]
  );

  const roomOptions = useMemo(
    () =>
      state.rooms?.map((room) => (
        <option key={room.id} value={room.id}>
          {room.id} · {room.capacity} chỗ ({room.room_type})
        </option>
      )),
    [state.rooms]
  );

  const filteredDraftSessions = useMemo(() => {
    if (!draftQuery) return sessions;
    const q = draftQuery.toLowerCase();
    return sessions.filter((session) =>
      (session.id + " " + session.course + " " + (session.teacher || "")).toLowerCase().includes(q)
    );
  }, [sessions, draftQuery]);

  const visibleDraftSessions = draftQuery
    ? filteredDraftSessions
    : filteredDraftSessions.slice(0, draftLimit);

  const handleDownload = (source: "draft" | "published") => {
    setDownloadingSource(source);
    void perform(async () => {
      try {
        await download(source);
      } finally {
        setDownloadingSource(null);
      }
    });
  };

  const hardCount = workspace.evaluation?.hard ?? 0;
  const softTotal = workspace.evaluation?.soft_total ?? 0;
  const scheduleQualityLabel =
    hardCount > 0
      ? `Cần điều chỉnh (${hardCount})`
      : softTotal <= 5000
      ? "Tối ưu tốt"
      : "Hợp lệ";

  return (
    <>
      {isEvaluating && (
        <div className="evaluating-indicator" role="status">
          <Spinner size={16} />
          <span>Đang chuẩn bị dữ liệu và thẩm định các lớp học phần...</span>
        </div>
      )}

      <section className="card">
        {/* Compact Readiness & Secondary Actions Toolbar */}
        <div className="solver-primary-bar">
          <div className="readiness" style={{ margin: 0 }}>
            <span
              className={"badge " + (ready ? "success" : "warning")}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <Icon name={ready ? "check" : "clock"} size={13} />
              {ready ? "Các bộ môn đã nộp" : "Chờ bộ môn hoàn tất phân công"}
            </span>
            <span className={"badge " + (state?.rooms?.length ? "success" : "warning")}>
              {state?.rooms?.length ?? 0} phòng học
            </span>
            <span className={"badge " + (state?.config?.slots.length ? "success" : "warning")}>
              {state?.config?.slots.length ?? 0} khung giờ
            </span>
          </div>

          <div className="solver-cta-right">
            {!!draftEvents.length && onOpenTermDraft && (
              <ActionButton
                type="button"
                icon="calendar"
                onClick={onOpenTermDraft}
                style={{
                  background: "#eff6ff",
                  borderColor: "#93c5fd",
                  color: "#1d4ed8",
                  fontWeight: 600,
                  fontSize: "12.5px",
                }}
              >
                Xem trên Lịch học kỳ
              </ActionButton>
            )}
            <ActionButton
              type="button"
              icon="download"
              loading={downloadingSource === "draft"}
              loadingLabel="Đang xuất nháp..."
              disabled={busy || !state?.draft?.length}
              onClick={() => handleDownload("draft")}
              style={{ fontSize: "12.5px" }}
            >
              Xuất Excel nháp
            </ActionButton>
            <ActionButton
              type="button"
              icon="download"
              loading={downloadingSource === "published"}
              loadingLabel="Đang xuất..."
              disabled={busy || !state?.published.length}
              onClick={() => handleDownload("published")}
              style={{ fontSize: "12.5px" }}
            >
              Xuất Excel chính thức
            </ActionButton>
          </div>
        </div>

        {/* Primary CTA Row (Front-and-center for Giáo vụ) */}
        <div className="solver-cta-row">
          <div className="solver-cta-left">
            <ActionButton
              type="button"
              variant="primary"
              icon="play"
              loading={solverRunning}
              loadingLabel="Đang xếp lịch học kỳ..."
              disabled={busy || !ready || !state?.rooms?.length || !state?.config?.slots.length}
              onClick={() => perform(() => command("solve", { algorithm, threads, iterations, seed }))}
            >
              Tự động xếp lịch học kỳ
            </ActionButton>

            <ActionButton
              type="button"
              variant="primary"
              icon="check"
              className="btn-publish-success"
              disabled={busy || workspace.evaluation?.hard !== 0 || !state?.draft?.length}
              onClick={() => perform(() => command("publish"))}
            >
              Công bố lịch chính thức
            </ActionButton>

            <button
              type="button"
              aria-expanded={showSolverDetails}
              onClick={() => setShowSolverDetails((prev) => !prev)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "38px",
                padding: "6px 12px",
                fontSize: "12.5px",
                fontWeight: 600,
                background: showSolverDetails ? "#e2e8f0" : "#f8fafc",
                borderColor: showSolverDetails ? "#94a3b8" : "#cbd5e1",
                color: "#0f172a",
              }}
            >
              <Icon name="sliders" size={15} />
              <span>Chi tiết bộ giải</span>
              <span
                style={{
                  display: "inline-flex",
                  transition: "transform 0.18s ease",
                  transform: showSolverDetails ? "rotate(180deg)" : "none",
                }}
              >
                <Icon name="chevron-down" size={14} />
              </span>
            </button>
          </div>

          <small style={{ color: "var(--muted)", fontSize: "12px" }}>
            Tự động kiểm tra phòng học, thiết bị, sức chứa và lịch bận giảng viên trước khi công bố.
          </small>
        </div>

        {!ready && (
          <p className="inline-help" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <Icon name="alert" size={15} />
            <span>Hoàn tất phân công và nộp từ tất cả bộ môn trước khi xếp lịch.</span>
            <ActionButton
              type="button"
              icon="arrow-right"
              onClick={() => onAssignClick()}
              style={{ minHeight: "28px", padding: "2px 10px", fontSize: "12px" }}
            >
              Xem phân công
            </ActionButton>
          </p>
        )}

        {/* Live Progress Banner while Solver is actively running */}
        {solverRunning && Object.keys(solverProgress).length > 0 && (
          <section className="solver-progress" aria-live="polite" style={{ marginBottom: "14px" }}>
            <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0369a1" }}>
              <Spinner size={14} />
              Đang tối ưu thời khóa biểu trên các luồng song song...
            </strong>
            {Object.values(solverProgress).map((progress) => {
              const percent = Math.min(100, Math.round((progress.step / Math.max(progress.iterations, 1)) * 100));
              return (
                <div className="solver-progress-row" key={progress.algorithm}>
                  <div className="solver-progress-heading">
                    <span style={{ fontWeight: 700 }}>{progress.algorithm}</span>
                    <span>
                      {percent}% · Xung đột cứng: {progress.hard}
                      {showSolverDetails ? ` · Điểm phạt mềm: ${progress.soft}` : ""}
                    </span>
                  </div>
                  <div
                    className="solver-progress-track"
                    role="progressbar"
                    aria-label={`Tiến độ ${progress.algorithm}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                  >
                    <div className="solver-progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Collapsible Advanced Solver Panel */}
        {showSolverDetails && (
          <div className="solver-advanced-panel">
            <div className="solver-advanced-header">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Icon name="sliders" size={15} />
                Cấu hình kỹ thuật Bộ giải đa luồng (Solver Engine)
              </span>
              <small style={{ fontWeight: 500, color: "var(--muted)" }}>
                Dành cho tinh chỉnh chuyên sâu thuật toán &amp; tái lập kết quả
              </small>
            </div>

            <div className="editor-row" style={{ flexWrap: "wrap", alignItems: "flex-end", gap: "12px", marginBottom: 0 }}>
              <label style={{ flex: 2, minWidth: "240px" }}>
                <span>Thuật toán tối ưu</span>
                <select
                  value={algorithm}
                  disabled={busy}
                  onChange={(e) => setAlgorithm(e.target.value as "PORTFOLIO" | "SA" | "TABU" | "HC")}
                >
                  <option value="PORTFOLIO">Kết hợp cả 3 thuật toán (Portfolio: SA + Tabu + Leo đồi)</option>
                  <option value="SA">Simulated Annealing (Tôi thép)</option>
                  <option value="TABU">Tabu Search</option>
                  <option value="HC">Local Search (Leo đồi)</option>
                </select>
              </label>
              <label style={{ flex: 1, minWidth: "130px" }}>
                <span>Số luồng song song</span>
                <select
                  value={threads}
                  disabled={busy}
                  onChange={(e) => setThreads(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 6, 8, 12, 16].map((n) => (
                    <option key={n} value={n}>
                      {n} luồng
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ flex: 1, minWidth: "140px" }}>
                <span>Số bước thử / luồng</span>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  step={50}
                  disabled={busy}
                  value={iterations}
                  onChange={(e) => setIterations(Math.max(1, Math.min(5000, Number(e.target.value) || 500)))}
                />
              </label>
              <label style={{ flex: 1, minWidth: "110px" }}>
                <span>Seed tái lập</span>
                <input
                  type="number"
                  disabled={busy}
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value) || 42)}
                />
              </label>
            </div>

            {!solverRunning && Object.keys(solverProgress).length > 0 && (
              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Kết quả từng nhánh thuật toán lần chạy gần nhất
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {Object.values(solverProgress).map((progress) => (
                    <div
                      key={progress.algorithm}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #dbe3ef",
                        borderRadius: "8px",
                        padding: "9px 12px",
                        display: "grid",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>{progress.algorithm}</strong>
                        <span className={"badge " + (progress.hard === 0 ? "success" : "warning")}>
                          {progress.hard === 0 ? "Hợp lệ" : `${progress.hard} xung đột`}
                        </span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#475569", display: "flex", justifyContent: "space-between" }}>
                        <span>Xung đột cứng: <b>{progress.hard}</b></span>
                        <span>Điểm phạt mềm: <b>{progress.soft}</b></span>
                      </div>
                      <div className="solver-progress-track" aria-hidden="true">
                        <div className="solver-progress-fill" style={{ width: "100%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workspace.evaluation && (
              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Chi tiết điểm phạt mềm kỹ thuật (Tổng điểm phạt mềm: {workspace.evaluation.soft_total})
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "8px",
                  }}
                >
                  {Object.entries(workspace.evaluation.soft).map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "7px",
                        padding: "8px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ color: "#475569" }}>
                        {({
                          restricted: "Thứ bảy / buổi tối",
                          single_class: "Ngày chỉ có một lớp",
                          overload: "Số tiết vượt trần ngày",
                          gaps_minutes: "Phút trống giữa buổi",
                        } as Record<string, string>)[key] ?? key}
                      </span>
                      <strong style={{ color: "#0f172a", fontSize: "13px" }}>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calm, Human-Friendly Summary Metrics */}
        {!!state?.draft?.length && workspace.evaluation && (
          <>
            <Metrics
              items={[
                {
                  label: "Xung đột cứng",
                  value: workspace.evaluation.hard,
                  detail:
                    workspace.evaluation.hard === 0
                      ? "Đạt điều kiện công bố"
                      : "Cần xử lý trước khi công bố",
                  tone: workspace.evaluation.hard ? "text-warning" : "text-success",
                },
                {
                  label: "Lớp đã xếp lịch",
                  value: `${state.draft.length}/${sessions.length}`,
                  detail:
                    state.draft.length >= sessions.length
                      ? "Đã gán đủ phòng & khung giờ"
                      : "Một số lớp chưa có khung giờ",
                },
                {
                  label: "Đánh giá lịch xếp",
                  value: scheduleQualityLabel,
                  detail: showSolverDetails
                    ? `Điểm phạt mềm kỹ thuật: ${workspace.evaluation.soft_total}`
                    : 'Bấm "Chi tiết bộ giải" để xem thông số kỹ thuật',
                  tone: workspace.evaluation.hard === 0 ? "text-success" : "text-warning",
                },
              ]}
            />

            {workspace.evaluation.hard > 0 && (
              <details open style={{ marginTop: "10px" }}>
                <summary style={{ fontWeight: 600, color: "#b45309", cursor: "pointer" }}>
                  Danh sách xung đột cứng cần xử lý ({workspace.evaluation.violations.length})
                </summary>
                <p className="text-warning" style={{ marginTop: "6px" }}>
                  Đối chiếu lớp và phòng bên dưới để điều chỉnh khung giờ hoặc phòng học phù hợp.
                </p>
                <ul className="violation-list">
                  {workspace.evaluation.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>

      <section className="card">
        <div className="section-heading" style={{ flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <div>
            <h2>Hiệu chỉnh từng lớp trong bản nháp</h2>
            <p>Chọn khung bắt đầu và phòng học; kết quả thẩm định cập nhật tức thì sau mỗi thay đổi.</p>
          </div>
          <div style={{ minWidth: "260px", flex: "0 1 320px" }}>
            <input
              type="search"
              aria-label="Tìm lớp trong bản nháp"
              placeholder="Tìm mã môn, mã lớp, giảng viên..."
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap table-scroll" style={{ maxHeight: "500px" }}>
          <table>
            <thead>
              <tr>
                <th>Lớp học phần</th>
                <th>Thứ &amp; giờ bắt đầu</th>
                <th>Phòng học</th>
              </tr>
            </thead>
            <tbody>
              {visibleDraftSessions.map((s) => (
                <DraftRow
                  key={s.id}
                  session={s}
                  placement={draftMap.get(s.id)}
                  slotOptions={slotOptions}
                  roomOptions={roomOptions}
                  busy={busy}
                  hasRooms={!!state?.rooms?.length}
                  hasSlots={!!state?.config?.slots.length}
                  firstRoomId={state?.rooms?.[0]?.id}
                  onSlotChange={(sessionId, slot, roomId) =>
                    perform(() =>
                      command("placement", {
                        session: sessionId,
                        slot,
                        room_id: roomId,
                      })
                    )
                  }
                  onRoomChange={(sessionId, slot, roomId) =>
                    perform(() =>
                      command("placement", {
                        session: sessionId,
                        slot,
                        room_id: roomId,
                      })
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        </div>

        {!draftQuery && filteredDraftSessions.length > draftLimit && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              background: "#f8fafc",
              borderTop: "1px solid var(--line)",
              fontSize: "12px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span style={{ color: "var(--muted)" }}>
              Đang hiển thị {visibleDraftSessions.length}/{filteredDraftSessions.length} lớp học phần
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11.5px" }}
                onClick={() => setDraftLimit((prev) => prev + 60)}
              >
                Xem thêm 60 lớp
              </button>
              <button
                type="button"
                className="primary"
                style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11.5px" }}
                onClick={() => setDraftLimit(filteredDraftSessions.length)}
              >
                Hiển thị toàn bộ ({filteredDraftSessions.length} lớp)
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
