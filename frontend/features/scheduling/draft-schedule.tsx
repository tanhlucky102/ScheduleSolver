"use client";
import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Metrics } from "../shared/ui";
import { clock } from "../shared/time";
import { DraftRow } from "./draft-row";
import type { Workspace } from "../workspace/types";

export function DraftSchedule({ workspace, busy, ready, isEvaluating, perform, command, download, onAssignClick, draftLimit, setDraftLimit, draftQuery, setDraftQuery }: {
  workspace: Workspace;
  busy: boolean;
  ready: boolean;
  isEvaluating: boolean;
  perform: (action: () => Promise<void>) => Promise<void>;
  command: (action: string, payload?: unknown) => Promise<void>;
  download: (source: string) => Promise<void>;
  onAssignClick: () => void;
  draftLimit: number;
  setDraftLimit: Dispatch<SetStateAction<number>>;
  draftQuery: string;
  setDraftQuery: (value: string) => void;
}) {
  const state = workspace.state;
  const sessions = state.sessions ?? [];
  const draftMap = useMemo(() => new Map((state.draft ?? []).map((p) => [p.session, p])), [state.draft]);
  const slotOptions = useMemo(() => state.config?.slots?.map((slot, i) => (
    <option value={i} key={i}>
      {slot.day === 8 ? "Chủ nhật" : "Thứ " + slot.day} · bắt đầu {clock(slot.start)} (khung đến {clock(slot.end)})
    </option>
  )), [state.config?.slots]);
  const roomOptions = useMemo(() => state.rooms?.map((room) => (
    <option key={room.id} value={room.id}>{room.id} · {room.capacity} chỗ ({room.room_type})</option>
  )), [state.rooms]);
  const filteredDraftSessions = useMemo(() => {
    if (!draftQuery) return sessions;
    const q = draftQuery.toLowerCase();
    return sessions.filter((session) => (session.id + " " + session.course).toLowerCase().includes(q));
  }, [sessions, draftQuery]);
  const visibleDraftSessions = draftQuery ? filteredDraftSessions : filteredDraftSessions.slice(0, draftLimit);
  return <>

                {isEvaluating && (
                  <div className="evaluating-indicator" role="status">
                    <div className="spinner-border" />
                    <span>Đang chuẩn bị dữ liệu và thẩm định 290 lớp học phần...</span>
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
                  <div className="actions">
                    <button disabled={busy || !state?.draft?.length} onClick={() => perform(() => download("draft"))}>
                      Xuất Excel nháp
                    </button>
                    <button disabled={busy || !state?.published.length} onClick={() => perform(() => download("published"))}>
                      Xuất Excel đã công bố
                    </button>
                  </div>
                  <p>
                    Kiểm tra phân công, sức chứa, thiết bị, điều kiện dùng phòng, toàn bộ khung khả dụng và lịch chiếm dụng. Nếu hết lượt tìm kiếm, hệ thống báo xung đột và giữ nguyên bản nháp; điều đó chưa chứng minh bài toán vô nghiệm.
                  </p>
                  <div className="actions">
                    <button
                      className="primary"
                      disabled={busy || !ready || !state?.rooms?.length || !state?.config?.slots.length}
                      onClick={() => perform(() => command("solve", { iterations: 500, seed: 42 }))}
                    >
                      Thẩm định & chạy bộ giải
                    </button>
                    <button
                      className="primary"
                      disabled={busy || workspace.evaluation?.hard !== 0 || !state?.draft?.length}
                      onClick={() => perform(() => command("publish"))}
                    >
                      Công bố lịch chính thức
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
                            detail: "Bản nháp đang hiệu chỉnh",
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
                  <h2>Hiệu chỉnh bản nháp</h2>
                  <p>Chọn khung bắt đầu và phòng; kết quả kiểm tra được cập nhật sau mỗi lần lưu.</p>
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
  </>;
}
