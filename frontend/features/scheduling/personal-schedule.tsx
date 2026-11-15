"use client";
import { useState } from "react";
import { Icon, ActionButton } from "../shared/ui";
import { PersonalCalendar } from "./personal-calendar";
import { ColorPaletteManager } from "./color-palette-manager";
import { previewExternalFile } from "../workspace/api-client";
import { clock, minutes } from "../shared/time";
import { DEFAULT_HANU_HOLIDAYS, evaluateWeekOccurrence, formatDateVN } from "../shared/weeks";
import type { Workspace } from "../workspace/types";
import type { ColorRule, HolidayRule, ShiftRule } from "../catalog/types";
import type { PeriodConfigInput } from "./term-calendar-types";

export type ExternalDraft = {
  institution: string;
  course: string;
  class_name: string;
  room: string;
  day: number;
  start: string;
  end: string;
  activity_type?: string;
  color?: string;
  note?: string;
  start_date?: string;
  end_date?: string;
};

type ExternalPreviewItem = {
  day: number;
  start: number;
  end: number;
  course: string;
  class_name: string;
  room: string;
  institution: string;
  activity_type: string;
  color: string;
  note: string;
  start_date?: string;
  end_date?: string;
};

const ACTIVITY_LABELS: Record<string, string> = {
  EXTERNAL_TEACHING: "Dạy trường ngoài",
  STUDYING: "Lịch đi học / NCS",
  MAKEUP: "Lịch dạy bù",
  PERSONAL_BUSY: "Lịch bận khác",
};

type Props = {
  apiUrl?: string;
  token?: string | null;
  state: Workspace["state"];
  colorRules?: ColorRule[];
  shiftRules?: ShiftRule[];
  periodConfig?: PeriodConfigInput;
  termConfig?: { term_name?: string; term_start_date?: string; term_end_date?: string; holidays?: HolidayRule[] };
  hasPublication: boolean;
  busy: boolean;
  perform: (action: () => Promise<void>) => Promise<void>;
  command: (action: string, payload?: unknown) => Promise<void>;
  external: ExternalDraft;
  setExternal: (value: ExternalDraft) => void;
};

export function PersonalSchedule({
  apiUrl = "http://localhost:8000",
  token = null,
  state,
  colorRules = [],
  shiftRules,
  periodConfig,
  termConfig,
  hasPublication,
  busy,
  perform,
  command,
  external,
  setExternal,
}: Props) {
  const [activeTab, setActiveTab] = useState<"timetable" | "external" | "palette">("timetable");
  const [importPreview, setImportPreview] = useState<{
    items: ExternalPreviewItem[];
    errors: { row: number; message: string }[];
    can_import: boolean;
  } | null>(null);
  const [showSampleSchema, setShowSampleSchema] = useState(false);

  const termStartIso = termConfig?.term_start_date || state?.config?.term_start_date || "2026-08-03";
  const termEndIso = termConfig?.term_end_date || state?.config?.term_end_date || "2027-01-03";
  const holidays = termConfig?.holidays ?? state?.config?.holidays ?? DEFAULT_HANU_HOLIDAYS;

  const conflictCount = (state?.external ?? []).filter((r) =>
    (state?.published ?? []).some((p) => p.day === r.day && p.start < r.end && r.start < p.end)
  ).length;

  return (
    <>
      {/* Clean Sub-tabs so QLDT Timetable is immediately above-the-fold */}
      <div className="qldt-subtabs" role="tablist" aria-label="Phân mục lịch cá nhân">
        <button
          type="button"
          role="tab"
          className="qldt-subtab-btn"
          aria-selected={activeTab === "timetable"}
          onClick={() => setActiveTab("timetable")}
        >
          <Icon name="personal" size={16} />
          <span>Thời khóa biểu cá nhân</span>
          <span className="qldt-subtab-count">
            {(state?.published?.length ?? 0) + (state?.external?.length ?? 0)}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          className="qldt-subtab-btn"
          aria-selected={activeTab === "external"}
          onClick={() => setActiveTab("external")}
        >
          <Icon name="upload" size={16} />
          <span>Khai báo lịch ngoài khoa</span>
          <span className="qldt-subtab-count">{state?.external?.length ?? 0}</span>
          {conflictCount > 0 && (
            <span
              className="badge warning"
              style={{ fontSize: "10.5px", padding: "1px 6px" }}
            >
              {conflictCount} trùng
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          className="qldt-subtab-btn"
          aria-selected={activeTab === "palette"}
          onClick={() => setActiveTab("palette")}
        >
          <Icon name="palette" size={16} />
          <span>Bảng màu cá nhân</span>
          <span className="qldt-subtab-count">{colorRules.length}</span>
        </button>
      </div>

      {activeTab === "timetable" && (
        <PersonalCalendar
          published={state?.published ?? []}
          external={state?.external ?? []}
          colorRules={colorRules}
          shiftRules={shiftRules ?? state?.config?.shift_rules}
          periodConfig={periodConfig ?? state?.config}
          termConfig={termConfig}
          apiUrl={apiUrl}
          token={token}
          busy={busy}
          onOpenExternalTab={() => setActiveTab("external")}
        />
      )}

      {activeTab === "external" && (
        <>
          {/* 1. Thêm nhanh từng buổi (Dạy ngoài / Đi học / Dạy bù / Lịch khác) */}
          <section className="card">
            <div className="section-heading" style={{ flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2>Khai báo lịch ngoài trường, lịch đi học &amp; lịch bận cá nhân</h2>
                <p>
                  {hasPublication
                    ? "Lịch khoa đã công bố — hệ thống kiểm tra tức thì để cảnh báo nếu đụng giờ giảng dạy tại khoa."
                    : "Khai báo ngay từ đầu học kỳ để bộ giải tự động tránh xếp trùng giờ bận và giờ đi học của bạn."}
                </p>
              </div>
            </div>

            <form
              className="external-form"
              onSubmit={(e) => {
                e.preventDefault();
                perform(async () => {
                  if (external.end <= external.start) throw new Error("Giờ kết thúc phải sau giờ bắt đầu.");
                  await command("external", {
                    institution: external.institution,
                    course: external.course,
                    class_name: external.class_name,
                    room: external.room,
                    day: external.day,
                    start: minutes(external.start),
                    end: minutes(external.end),
                    activity_type: external.activity_type || "EXTERNAL_TEACHING",
                    color: external.color || "",
                    note: external.note || "",
                    start_date: external.start_date || "",
                    end_date: external.end_date || "",
                  });
                });
              }}
            >
              <label>
                Phân loại lịch
                <select
                  value={external.activity_type || "EXTERNAL_TEACHING"}
                  onChange={(e) => setExternal({ ...external, activity_type: e.target.value })}
                >
                  <option value="EXTERNAL_TEACHING">Dạy trường ngoài</option>
                  <option value="STUDYING">Lịch đi học / NCS / Cao học</option>
                  <option value="MAKEUP">Lịch dạy bù</option>
                  <option value="PERSONAL_BUSY">Lịch công tác / Bận khác</option>
                </select>
              </label>
              {(["institution", "course", "class_name", "room"] as const).map((key, i) => (
                <label key={key}>
                  {["Trường / Đơn vị", "Môn học / Hoạt động", "Lớp / Nhóm", "Phòng (tùy chọn)"][i]}
                  <input
                    required={key !== "room"}
                    value={external[key]}
                    placeholder={
                      [
                        "VD: Trường A, ĐHQG...",
                        "VD: INT1306 hoặc Nghiên cứu sinh",
                        "VD: Nhóm 02",
                        "VD: 502-NT",
                      ][i]
                    }
                    onChange={(e) => setExternal({ ...external, [key]: e.target.value })}
                  />
                </label>
              ))}
              <label>
                Thứ
                <select value={external.day} onChange={(e) => setExternal({ ...external, day: Number(e.target.value) })}>
                  {Array.from({ length: 7 }, (_, i) => i + 2).map((d) => (
                    <option key={d} value={d}>
                      {d === 8 ? "Chủ Nhật" : "Thứ " + d}
                    </option>
                  ))}
                </select>
              </label>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  margin: "4px 0 8px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
                  Chọn nhanh 6 ca HANU:
                </span>
                {[
                  ["Ca 1 · T3–4 (07:10–09:15)", "07:10", "09:15"],
                  ["Ca 2 · T5–6 (09:30–11:35)", "09:30", "11:35"],
                  ["Ca 3 · T7–8 (12:20–14:25)", "12:20", "14:25"],
                  ["Ca 4 · T9–10 (14:40–16:45)", "14:40", "16:45"],
                  ["Ca 5 · T11–12 (17:10–19:15)", "17:10", "19:15"],
                  ["Ca 6 · T13–14 (19:30–21:35)", "19:30", "21:35"],
                ].map(([lbl, st, en]) => (
                  <button
                    key={lbl}
                    type="button"
                    style={{
                      minHeight: "28px",
                      padding: "3px 10px",
                      fontSize: "11px",
                      background: "#f1f5f9",
                      border: "1px solid var(--line)",
                      borderRadius: "6px",
                    }}
                    onClick={() => setExternal({ ...external, start: st, end: en })}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {(["start", "end"] as const).map((k) => (
                <label key={k}>
                  {k === "start" ? "Bắt đầu" : "Kết thúc"}
                  <input
                    type="time"
                    min="05:30"
                    max="22:00"
                    required
                    value={external[k]}
                    onChange={(e) => setExternal({ ...external, [k]: e.target.value })}
                  />
                </label>
              ))}

              <label>
                Từ ngày (tùy chọn)
                <input
                  type="date"
                  value={external.start_date || ""}
                  onChange={(e) => setExternal({ ...external, start_date: e.target.value })}
                />
              </label>

              <label>
                Đến ngày (tùy chọn)
                <input
                  type="date"
                  value={external.end_date || ""}
                  onChange={(e) => setExternal({ ...external, end_date: e.target.value })}
                />
              </label>

              <label>
                Màu đánh dấu riêng
                <input
                  type="color"
                  value={external.color && external.color.startsWith("#") ? external.color : "#fef3c7"}
                  onChange={(e) => setExternal({ ...external, color: e.target.value })}
                  style={{ height: "38px", padding: "2px" }}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                Ghi chú riêng (Note)
                <input
                  value={external.note || ""}
                  placeholder="VD: Mang máy tính cá nhân / học trực tuyến..."
                  onChange={(e) => setExternal({ ...external, note: e.target.value })}
                />
              </label>

              <ActionButton
                type="submit"
                variant="primary"
                icon="plus"
                disabled={busy || external.end <= external.start}
              >
                Lưu vào lịch cá nhân
              </ActionButton>
            </form>

            {/* Declared External List */}
            <div
              className="external-list"
              style={{ marginTop: "20px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ fontSize: "14px", margin: 0, fontWeight: 600 }}>
                  Danh sách lịch ngoài khoa đã khai báo ({state?.external?.length ?? 0})
                </h3>
                {state?.external && state.external.length > 0 && (
                  <small style={{ color: "var(--muted)" }}>Lịch khoa được ưu tiên khi xếp lịch</small>
                )}
              </div>

              {!state?.external || state.external.length === 0 ? (
                <p style={{ fontSize: "12.5px", color: "var(--muted)", margin: "8px 0" }}>
                  Chưa có buổi học hoặc lịch ngoài trường nào được khai báo.
                </p>
              ) : (
                state.external.map((r) => {
                  const hasConflict = state?.published.some(
                    (p) => p.day === r.day && p.start < r.end && r.start < p.end
                  );
                  const occ = evaluateWeekOccurrence(r, "all", holidays, { termStartIso, termEndIso });

                  return (
                    <article
                      className="dept"
                      key={r.id}
                      style={{
                        padding: "10px 12px",
                        background: hasConflict ? "#fff7ed" : r.color || "#f8fafc",
                        borderRadius: "6px",
                        border: `1px solid ${hasConflict ? "#fdba74" : "var(--line)"}`,
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span className="badge neutral" style={{ fontSize: "10.5px" }}>
                            {ACTIVITY_LABELS[r.activity_type || "EXTERNAL_TEACHING"] || "Lịch ngoài"}
                          </span>
                          <b style={{ fontSize: "13px" }}>{r.institution}</b>
                          <span style={{ color: "var(--muted)" }}>·</span>
                          <span style={{ fontSize: "12.5px", fontWeight: 500 }}>{r.course}</span>
                          {r.class_name && (
                            <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>({r.class_name})</span>
                          )}
                          {hasConflict && (
                            <span
                              className="badge warning"
                              style={{ fontSize: "10.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <Icon name="alert" size={12} />
                              Trùng lịch khoa
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "11.5px",
                            color: hasConflict ? "#c2410c" : "var(--muted)",
                          }}
                        >
                          {r.day === 8 ? "Chủ Nhật" : `Thứ ${r.day}`} · {clock(r.start)} – {clock(r.end)}
                          {r.room ? ` · Phòng ${r.room}` : ""}
                          {` · ${formatDateVN(occ.effectiveStartDate)} → ${formatDateVN(occ.effectiveEndDate)}`}
                          {r.note ? ` · Ghi chú: ${r.note}` : ""}
                          {hasConflict && " — Trùng với lịch khoa chính thức, vui lòng điều chỉnh khung giờ."}
                        </p>
                      </div>
                      <ActionButton
                        type="button"
                        variant="danger"
                        icon="trash"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("Xóa buổi " + r.course + " tại " + r.institution + "?")) {
                            void perform(() => command("external-delete", { id: r.id }));
                          }
                        }}
                      >
                        Xóa buổi
                      </ActionButton>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* 2. Import Lịch ngoài trường / Lịch đi học từ File Excel / CSV */}
          <section className="card" style={{ border: "1px solid #bfdbfe" }}>
            <div className="section-heading" style={{ flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Icon name="upload" size={18} />
                  <span>Import hàng loạt từ tệp Excel / CSV</span>
                </h2>
                <p>
                  Tải tệp mẫu chuẩn (hoặc dùng trực tiếp tệp Excel xuất từ trường ngoài có cột <b>Tiết bắt đầu + Số tiết</b>) để nạp nhanh lịch dạy ngoài, lịch đi học cao học/NCS hoặc lịch dạy bù.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <a
                  href={`${apiUrl}/api/templates/external`}
                  download="Mau_Lich_Ngoai_Va_Di_Hoc.xlsx"
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
                  <Icon name="download" size={14} />
                  <span>Tải Mẫu Excel (.xlsx)</span>
                </a>
                <a
                  href="/templates/lich-ngoai-di-hoc-mau.csv"
                  download="Mau_Lich_Ngoai_Va_Di_Hoc.csv"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: "#f8fafc",
                    border: "1px solid var(--line)",
                    color: "#0f172a",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <Icon name="download" size={14} />
                  <span>Tải Mẫu CSV (.csv)</span>
                </a>
                <ActionButton
                  type="button"
                  icon="eye"
                  onClick={() => setShowSampleSchema((prev) => !prev)}
                  style={{ fontSize: "12px", minHeight: "32px", padding: "4px 10px" }}
                >
                  {showSampleSchema ? "Ẩn cột mẫu" : "Xem cấu trúc tệp mẫu"}
                </ActionButton>
              </div>
            </div>

            {showSampleSchema && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "10px 12px",
                  background: "#f8fafc",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                }}
              >
                <b style={{ display: "block", marginBottom: "6px" }}>
                  Cấu trúc 12 cột trong tệp mẫu (nhập Giờ bắt đầu/kết thúc HOẶC Tiết bắt đầu + Số tiết):
                </b>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Loại lịch</th>
                        <th>Trường / Đơn vị</th>
                        <th>Mã môn / Hoạt động</th>
                        <th>Lớp / Nhóm</th>
                        <th>Thứ</th>
                        <th>Giờ bắt đầu</th>
                        <th>Giờ kết thúc</th>
                        <th>Tiết bắt đầu</th>
                        <th>Số tiết</th>
                        <th>Phòng</th>
                        <th>Mã màu</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>EXTERNAL_TEACHING</td>
                        <td>Trường A</td>
                        <td>INT1306 - CTDL &amp; GT</td>
                        <td>Nhóm 02</td>
                        <td>5</td>
                        <td>18:00</td>
                        <td>20:30</td>
                        <td>12</td>
                        <td>3</td>
                        <td>502-NT</td>
                        <td>#fef3c7</td>
                        <td>Dạy tối T5 tại Trường A</td>
                      </tr>
                      <tr>
                        <td>STUDYING</td>
                        <td>ĐH Quốc Gia</td>
                        <td>ENG801 - Đi học NCS</td>
                        <td>NCS-K42</td>
                        <td>7</td>
                        <td>07:10</td>
                        <td>09:15</td>
                        <td>3</td>
                        <td>2</td>
                        <td>B1-302</td>
                        <td>#dcfce7</td>
                        <td>Đi học sáng T7 (Tiết 3–4)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <label>
              Chọn tệp lịch ngoài / lịch đi học (.xlsx hoặc .csv)
              <input
                type="file"
                accept=".xlsx,.csv"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImportPreview(null);
                  void perform(async () => {
                    const res = await previewExternalFile<{
                      items: ExternalPreviewItem[];
                      errors: { row: number; message: string }[];
                      can_import: boolean;
                    }>(apiUrl, token, file);
                    setImportPreview(res);
                  });
                  e.target.value = "";
                }}
              />
            </label>

            {importPreview && (
              <div style={{ marginTop: "14px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <p>
                  Đọc được <b>{importPreview.items.length}</b> buổi định kỳ hợp lệ;{" "}
                  <b>{importPreview.errors.length}</b> dòng lỗi.
                </p>
                {importPreview.errors.map((err) => (
                  <p key={err.row} className="text-warning">
                    Dòng {err.row}: {err.message}
                  </p>
                ))}
                {importPreview.items.length > 0 && (
                  <div className="table-wrap" style={{ maxHeight: "220px", overflowY: "auto", marginBottom: "10px" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Loại</th>
                          <th>Đơn vị</th>
                          <th>Môn / Hoạt động</th>
                          <th>Thứ &amp; Giờ</th>
                          <th>Phòng &amp; Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.items.map((it, idx) => (
                          <tr key={idx}>
                            <td>{ACTIVITY_LABELS[it.activity_type] || it.activity_type}</td>
                            <td>
                              <b>{it.institution}</b>
                            </td>
                            <td>
                              {it.course} ({it.class_name})
                            </td>
                            <td>
                              {it.day === 8 ? "Chủ Nhật" : `Thứ ${it.day}`} · {clock(it.start)}–{clock(it.end)}
                            </td>
                            <td>
                              {it.room} {it.note ? `· ${it.note}` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px" }}>
                  <ActionButton
                    type="button"
                    variant="primary"
                    icon="check"
                    disabled={busy || !importPreview.can_import}
                    onClick={() =>
                      void perform(async () => {
                        await command("external-import", { items: importPreview.items });
                        setImportPreview(null);
                        setActiveTab("timetable");
                      })
                    }
                  >
                    Xác nhận Import ({importPreview.items.length} buổi)
                  </ActionButton>
                  <button type="button" onClick={() => setImportPreview(null)}>
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === "palette" && (
        <ColorPaletteManager
          customRules={colorRules}
          busy={busy}
          onCommand={(action, payload) => perform(() => command(action, payload))}
        />
      )}
    </>
  );
}
