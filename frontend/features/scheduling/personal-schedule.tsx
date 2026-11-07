"use client";
import { PersonalCalendar } from "./personal-calendar";
import { clock, minutes } from "../shared/time";
import type { Workspace } from "../workspace/types";

export type ExternalDraft = {
  institution: string; course: string; class_name: string; room: string; day: number; start: string; end: string;
};

type Props = {
  state: Workspace["state"];
  hasPublication: boolean;
  busy: boolean;
  perform: (action: () => Promise<void>) => Promise<void>;
  command: (action: string, payload?: unknown) => Promise<void>;
  external: ExternalDraft;
  setExternal: (value: ExternalDraft) => void;
};

export function PersonalSchedule({ state, hasPublication, busy, perform, command, external, setExternal }: Props) {
  return <>

                <PersonalCalendar published={state?.published ?? []} external={state?.external ?? []} />
                <section className="card">
                  <h2>Khai báo lịch trường ngoài</h2>
                  <p>Thêm buổi giảng dạy ngoài khoa để quản lý lịch cá nhân. Giờ kết thúc phải sau giờ bắt đầu.</p>
                  {!hasPublication && (
                    <p className="feedback">Bạn có thể khai báo lịch ngoài sau khi giáo vụ công bố lịch khoa.</p>
                  )}
                  <form
                    className="external-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      perform(async () => {
                        if (external.end <= external.start) throw new Error("Giờ kết thúc phải sau giờ bắt đầu.");
                        await command("external", {
                          ...external,
                          start: minutes(external.start),
                          end: minutes(external.end),
                        });
                      });
                    }}
                  >
                    {(["institution", "course", "class_name", "room"] as const).map((key, i) => (
                      <label key={key}>
                        {["Trường", "Môn", "Lớp", "Phòng (tùy chọn)"][i]}
                        <input
                          required={key !== "room"}
                          value={external[key]}
                          onChange={(e) => setExternal({ ...external, [key]: e.target.value })}
                        />
                      </label>
                    ))}
                    <label>
                      Thứ
                      <select value={external.day} onChange={(e) => setExternal({ ...external, day: Number(e.target.value) })}>
                        {Array.from({ length: 7 }, (_, i) => i + 2).map((d) => (
                          <option key={d} value={d}>
                            {d === 8 ? "Chủ nhật" : "Thứ " + d}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", margin: "4px 0 8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>Chọn nhanh ca học:</span>
                      <button
                        type="button"
                        style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: "6px" }}
                        onClick={() => setExternal({ ...external, start: "07:00", end: "11:30" })}
                      >
                        Ca sáng (07:00 – 11:30)
                      </button>
                      <button
                        type="button"
                        style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: "6px" }}
                        onClick={() => setExternal({ ...external, start: "12:30", end: "17:00" })}
                      >
                        Ca chiều (12:30 – 17:00)
                      </button>
                      <button
                        type="button"
                        style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: "6px" }}
                        onClick={() => setExternal({ ...external, start: "18:00", end: "20:30" })}
                      >
                        Ca tối (18:00 – 20:30)
                      </button>
                    </div>
                    {(["start", "end"] as const).map((k) => (
                      <label key={k}>
                        {k === "start" ? "Bắt đầu" : "Kết thúc"}
                        <input
                          type="time"
                          min="06:00"
                          max="22:00"
                          required
                          value={external[k]}
                          onChange={(e) => setExternal({ ...external, [k]: e.target.value })}
                        />
                      </label>
                    ))}
                    <button
                      className="primary"
                      disabled={busy || !hasPublication || external.end <= external.start}
                    >
                      Lưu lịch ngoài
                    </button>
                  </form>
                  <div className="external-list" style={{ marginTop: "20px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h3 style={{ fontSize: "14px", margin: 0, fontWeight: 600 }}>
                        Các buổi giảng dạy ngoài khoa đã khai báo ({state?.external?.length ?? 0})
                      </h3>
                      {state?.external && state.external.length > 0 && (
                        <small style={{ color: "var(--muted)" }}>Lịch khoa được ưu tiên khi xếp lịch</small>
                      )}
                    </div>
                    {(!state?.external || state.external.length === 0) ? (
                      <p style={{ fontSize: "12px", color: "var(--muted)", margin: "8px 0" }}>
                        Chưa có buổi học ngoài trường nào được khai báo.
                      </p>
                    ) : (
                      state.external.map((r) => {
                        const isConflict = state?.published.some(
                          (p) => p.day === r.day && p.start < r.end && r.start < p.end
                        );
                        return (
                          <article
                            className="dept"
                            key={r.id}
                            style={{
                              padding: "10px 12px",
                              background: isConflict ? "#fff7ed" : "#f8fafc",
                              borderRadius: "6px",
                              border: `1px solid ${isConflict ? "#fdba74" : "var(--line)"}`,
                              marginBottom: "8px",
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <b style={{ fontSize: "13px" }}>{r.institution}</b>
                                <span style={{ color: "var(--muted)" }}>·</span>
                                <span style={{ fontSize: "12px", fontWeight: 500 }}>{r.course}</span>
                                {r.class_name && <span style={{ fontSize: "11px", color: "var(--muted)" }}>({r.class_name})</span>}
                                {isConflict && (
                                  <span className="badge warning" style={{ fontSize: "10px" }}>
                                    ⚠️ Trùng lịch khoa
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: "4px 0 0", fontSize: "11px", color: isConflict ? "#c2410c" : "var(--muted)" }}>
                                Thứ {r.day === 8 ? "Chủ nhật" : r.day} · {clock(r.start)} – {clock(r.end)} {r.room ? `· Phòng ${r.room}` : ""}
                                {isConflict && " — Trùng với lịch khoa chính thức mới công bố, hãy xóa hoặc sửa lại giờ."}
                              </p>
                            </div>
                            <button
                              className="btn-remove"
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm("Xóa buổi " + r.course + " tại " + r.institution + "?")) {
                                  void perform(() => command("external-delete", { id: r.id }));
                                }
                              }}
                            >
                              Xóa buổi
                            </button>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
  </>;
}
