"use client";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Metrics } from "../shared/ui";
import { clock } from "../shared/time";
import { DraftRow } from "./draft-row";
import { buildDraftEvents } from "./term-calendar-model";
import type { Workspace } from "../workspace/types";

export function DraftSchedule({
  workspace,
  busy,
  ready,
  isEvaluating,
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

  const [algorithm, setAlgorithm] = useState<"PORTFOLIO" | "SA" | "TABU" | "HC">("PORTFOLIO");
  const [threads, setThreads] = useState<number>(4);
  const [iterations, setIterations] = useState<number>(600);
  const [seed, setSeed] = useState<number>(42);

  const slotOptions = useMemo(
    () =>
      state.config?.slots?.map((slot, i) => (
        <option value={i} key={i}>
          {slot.day === 8 ? "Chủ nhật" : "Thứ " + slot.day} · bắt đầu {clock(slot.start)} (khung đến {clock(slot.end)})
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
    return sessions.filter((session) => (session.id + " " + session.course).toLowerCase().includes(q));
  }, [sessions, draftQuery]);

  const visibleDraftSessions = draftQuery
    ? filteredDraftSessions
    : filteredDraftSessions.slice(0, draftLimit);

  return (
    <>
      {isEvaluating && (
        <div className="evaluating-indicator" role="status">
          <div className="spinner-border" />
          <span>Đang chuẩn bị dữ liệu và thẩm định các lớp học phần...</span>
        </div>
      )}

      <section className="card">
        <h2>Thẩm định & xếp lịch học kỳ</h2>
        <div className="readiness">
          <span className={"badge " + (ready ? "success" : "warning")}>
            {ready ? "✓ Các bộ môn đã nộp" : "Chờ bộ môn hoàn tất phân công"}
          </span>
          <span className={"badge " + (state?.rooms?.length ? "success" : "warning")}>
            {state?.rooms?.length ?? 0} phòng đã khai báo
          </span>
          <span className={"badge " + (state?.config?.slots.length ? "success" : "warning")}>
            {state?.config?.slots.length ?? 0} khung giờ
          </span>
        </div>

        <div className="actions" style={{ flexWrap: "wrap" }}>
          <button disabled={busy || !state?.draft?.length} onClick={() => perform(() => download("draft"))}>
            📥 Xuất Excel nháp
          </button>
          <button disabled={busy || !state?.published.length} onClick={() => perform(() => download("published"))}>
            📥 Xuất Excel đã công bố
          </button>
          {!!draftEvents.length && onOpenTermDraft && (
            <button
              type="button"
              onClick={onOpenTermDraft}
              style={{ background: "#eff6ff", borderColor: "#93c5fd", color: "#1d4ed8", fontWeight: 600 }}
            >
              📅 Xem TKB Cả Tuần & Danh sách Môn vừa xếp →
            </button>
          )}
        </div>

        <p>
          Kiểm tra phân công, sức chứa, thiết bị, lịch ngoài trường/lịch đi học của giảng viên, toàn bộ khung khả dụng và lịch chiếm dụng trước khi công bố.
        </p>

        {/* Cấu hình Bộ giải song song (Đồng bộ với SolverConfig trên Git) */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "14px",
          }}
        >
          <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
            ⚙️ Cấu hình Bộ giải & Đa luồng (Solver Engine)
          </div>
          <div className="editor-row" style={{ flexWrap: "wrap", alignItems: "flex-end", gap: "12px" }}>
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
        </div>

        <div className="actions">
          <button
            className="primary"
            disabled={busy || !ready || !state?.rooms?.length || !state?.config?.slots.length}
            onClick={() => perform(() => command("solve", { algorithm, threads, iterations, seed }))}
          >
            ⚡ Thẩm định & chạy bộ giải ({threads} luồng)
          </button>
          <button
            className="primary"
            disabled={busy || workspace.evaluation?.hard !== 0 || !state?.draft?.length}
            onClick={() => perform(() => command("publish"))}
          >
            ✅ Công bố lịch chính thức
          </button>
        </div>

        {!ready && (
          <p className="inline-help">
            Hoàn tất phân công và nộp từ tất cả bộ môn trước khi xếp lịch.{" "}
            <button onClick={() => onAssignClick()}>Xem phân công →</button>
          </p>
        )}

        {!!state?.draft?.length && workspace.evaluation && (
          <>
            <Metrics
              items={[
                {
                  label: "Lỗi bắt buộc",
                  value: workspace.evaluation.hard,
                  detail: "Phải xử lý hết trước khi công bố",
                  tone: workspace.evaluation.hard ? "text-warning" : "text-success",
                },
                {
                  label: "Điểm ưu tiên mềm",
                  value: workspace.evaluation.soft_total,
                  detail: "Điểm càng thấp, lịch càng thuận tiện",
                },
                {
                  label: "Lớp đã xếp",
                  value: state?.draft.length + "/" + sessions.length,
                  detail: "Xem ma trận cả tuần tại mục Lịch học kỳ",
                },
              ]}
            />
            <details open={workspace.evaluation.hard > 0}>
              <summary>Báo cáo thẩm định chi tiết</summary>
              {workspace.evaluation.hard > 0 ? (
                <>
                  <p className="text-warning">
                    Đối chiếu lớp và phòng bên dưới để điều chỉnh, hoặc kiểm tra lại phân công.
                  </p>
                  <ul className="violation-list">
                    {workspace.evaluation.violations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-success">Không có lỗi bắt buộc trong bản nháp hiện tại.</p>
              )}
              <dl className="evaluation-details">
                {Object.entries(workspace.evaluation.soft).map(([key, value]) => (
                  <div key={key}>
                    <dt>
                      {({
                        restricted: "Thứ bảy / buổi tối",
                        single_class: "Ngày chỉ có một lớp",
                        overload: "Số tiết vượt trần ngày",
                        gaps_minutes: "Phút trống giữa buổi",
                      } as Record<string, string>)[key] ?? key}
                    </dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </>
        )}
      </section>

      <section className="card">
        <h2>Hiệu chỉnh từng lớp trong bản nháp</h2>
        <p>Chọn khung bắt đầu và phòng; kết quả kiểm tra được cập nhật ngay sau mỗi lần lưu.</p>
        <label>
          Tìm lớp trong bản nháp
          <input
            type="search"
            placeholder="Nhập mã lớp hoặc mã môn…"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
          />
        </label>
        <div className="table-wrap table-scroll" style={{ maxHeight: "500px" }}>
          <table>
            <thead>
              <tr>
                <th>Lớp học phần</th>
                <th>Thứ & giờ bắt đầu</th>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderTop: "1px solid var(--line)", fontSize: "12px", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ color: "var(--muted)" }}>
              Đang hiển thị {visibleDraftSessions.length}/{filteredDraftSessions.length} lớp học phần
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px" }}
                onClick={() => setDraftLimit((prev) => prev + 60)}
              >
                Xem thêm 60 lớp
              </button>
              <button
                type="button"
                className="primary"
                style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px" }}
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
