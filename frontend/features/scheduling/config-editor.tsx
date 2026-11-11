"use client";
import { useState } from "react";
import { clock as time, minutes } from "../shared/time";
import { DEFAULT_HANU_HOLIDAYS } from "../shared/weeks";
import type { ShiftRule, ColorRule, HolidayRule } from "../catalog/types";
import { DEFAULT_HANU_SHIFTS, calcShiftDuration } from "./term-calendar-model";

export type Config = {
  term_name?: string;
  term_start_date?: string;
  term_end_date?: string;
  holidays?: HolidayRule[];
  soft_weights?: Record<string, number>;
  period_minutes: number;
  break_minutes: number;
  include_break?: boolean;
  first_period_start?: number;
  active_days?: number[];
  shift_rules?: ShiftRule[];
  color_rules?: ColorRule[];
  max_periods: number;
  rooms: Record<string, number>;
  slots: { day: number; start: number; end: number; evening: boolean }[];
};

const isEveningStart = (startMin: number) => startMin >= 1020; // >= 17:00 (Ca 5, Ca 6)

function sessionBucket(s: ShiftRule): "M" | "A" | "E" {
  if (s.evening || isEveningStart(s.start)) return "E";
  return s.start < 720 ? "M" : "A";
}

function buildSlotsFromShifts(shifts: ShiftRule[], activeDays: number[]) {
  const days = [...activeDays].sort((a, b) => a - b);
  const ordered = [...shifts].filter((s) => s.start < s.end).sort((a, b) => a.start - b.start);
  const seen = new Set<string>();
  const slots: { day: number; start: number; end: number; evening: boolean }[] = [];
  for (const day of days) {
    for (let i = 0; i < ordered.length; i++) {
      const s = ordered[i];
      let blockEnd = s.end;
      const bucket = sessionBucket(s);
      for (let j = i + 1; j < ordered.length; j++) {
        const nxt = ordered[j];
        if (sessionBucket(nxt) !== bucket || nxt.start - blockEnd > 30) break;
        blockEnd = Math.max(blockEnd, nxt.end);
      }
      const key = `${day}-${s.start}-${blockEnd}`;
      if (seen.has(key)) continue;
      seen.add(key);
      slots.push({ day, start: s.start, end: blockEnd, evening: isEveningStart(s.start) });
    }
  }
  return slots;
}

export function ConfigEditor({
  value,
  onChange,
  onSave,
  disabled,
  hasPublished,
}: {
  value: string;
  onChange: (s: string) => void;
  onSave: (data: unknown) => void;
  disabled: boolean;
  hasPublished?: boolean;
}) {
  const [interShiftGap, setInterShiftGap] = useState(15);
  const [lunchStart, setLunchStart] = useState("12:20");
  const [defaultShiftPeriods, setDefaultShiftPeriods] = useState(2.5);

  const rawParsed = value
    ? (JSON.parse(value) as Config & { external_travel_buffer?: number })
    : {
        period_minutes: 50,
        break_minutes: 0,
        include_break: false,
        first_period_start: 430,
        active_days: [2, 3, 4, 5, 6, 7],
        shift_rules: DEFAULT_HANU_SHIFTS,
        max_periods: 8,
        rooms: { PROJECTOR: 10, COMPUTER: 5 },
        slots: [],
      };

  const { external_travel_buffer: _unusedBuffer, ...parsed } = rawParsed;
  void _unusedBuffer;

  const config: Config = {
    first_period_start: 430,
    active_days: [2, 3, 4, 5, 6, 7],
    shift_rules: [],
    holidays: DEFAULT_HANU_HOLIDAYS,
    ...parsed,
    include_break: false,
    break_minutes: 0,
  };

  const hasSavedShifts = Boolean(config.shift_rules && config.shift_rules.length > 0);
  const shifts = hasSavedShifts ? config.shift_rules! : DEFAULT_HANU_SHIFTS;
  const activeDays = config.active_days && config.active_days.length > 0 ? config.active_days : [2, 3, 4, 5, 6, 7];
  const firstStart = config.first_period_start ?? 430;

  const update = (c: Config) => onChange(JSON.stringify({ ...c, include_break: false, break_minutes: 0 }));

  const applyShiftsAndDays = (nextShifts: ShiftRule[], nextDays: number[], extra?: Partial<Config>) => {
    const normalizedShifts = nextShifts.map((sh) => ({
      ...sh,
      include_break: false,
      break_minutes: 0,
      evening: isEveningStart(sh.start),
    }));
    const merged: Config = {
      ...config,
      ...extra,
      include_break: false,
      break_minutes: 0,
      shift_rules: normalizedShifts,
      active_days: nextDays,
      slots: buildSlotsFromShifts(normalizedShifts, nextDays),
    };
    update(merged);
  };

  // Đồng bộ 6 ca theo công thức thuần: Ca = Số tiết × Phút mỗi tiết, cách nhau bằng Nghỉ chuyển ca (15p)
  const recalculateShiftsFromPeriod1 = (
    p1Start: number,
    pMinutes: number,
    shiftPeriods: number
  ) => {
    const dur = calcShiftDuration(shiftPeriods, pMinutes, 0, false);
    const aftBase = Math.max(minutes(lunchStart), p1Start + dur * 2 + interShiftGap + 30);

    const m1Start = p1Start;
    const m1End = m1Start + dur;
    const m2Start = m1End + interShiftGap;
    const m2End = m2Start + dur;

    const a1Start = aftBase;
    const a1End = a1Start + dur;
    const a2Start = a1End + interShiftGap;
    const a2End = a2Start + dur;

    const e1Start = Math.max(1030, a2End + 25); // 17:10 chuẩn HANU Ca 5
    const e1End = Math.min(1439, e1Start + dur);
    const e2Start = Math.min(1400, e1End + interShiftGap); // 19:30 chuẩn HANU Ca 6
    const e2End = Math.min(1440, e2Start + dur);

    const isHanuMode = p1Start === 430 && dur === 125;
    const synced: ShiftRule[] = [
      { id: "M1", label: "Ca 1 (Sáng)", periods_label: isHanuMode ? "Tiết 3 – 4" : `Ca 1 (${shiftPeriods} tiết)`, start: m1Start, periods: shiftPeriods, include_break: false, break_minutes: 0, end: m1End, evening: false },
      { id: "M2", label: "Ca 2 (Sáng)", periods_label: isHanuMode ? "Tiết 5 – 6" : `Ca 2 (${shiftPeriods} tiết)`, start: m2Start, periods: shiftPeriods, include_break: false, break_minutes: 0, end: m2End, evening: false },
      { id: "A1", label: "Ca 3 (Chiều)", periods_label: isHanuMode ? "Tiết 7 – 8" : `Ca 3 (${shiftPeriods} tiết)`, start: a1Start, periods: shiftPeriods, include_break: false, break_minutes: 0, end: a1End, evening: false },
      { id: "A2", label: "Ca 4 (Chiều)", periods_label: isHanuMode ? "Tiết 9 – 10" : `Ca 4 (${shiftPeriods} tiết)`, start: a2Start, periods: shiftPeriods, include_break: false, break_minutes: 0, end: a2End, evening: false },
      { id: "E1", label: "Ca 5 (Tối)", periods_label: isHanuMode ? "Tiết 11 – 12" : `Ca 5 (${shiftPeriods} tiết)`, start: e1Start, periods: shiftPeriods, include_break: false, break_minutes: 0, end: e1End, evening: true },
      { id: "E2", label: "Ca 6 (Tối)", periods_label: isHanuMode ? "Tiết 13 – 14" : `Ca 6 (${shiftPeriods} tiết)`, start: e2Start, periods: shiftPeriods, include_break: false, break_minutes: 0, end: e2End, evening: true },
    ];
    applyShiftsAndDays(synced, activeDays, {
      first_period_start: p1Start,
      period_minutes: pMinutes,
    });
  };

  const sampleShiftDuration = calcShiftDuration(
    defaultShiftPeriods,
    config.period_minutes,
    0,
    false
  );

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Khung giờ, Thời gian Học kỳ & Quy chuẩn Ca (Thứ 2 → Thứ 7)</h2>
          <p>
            Thiết lập mốc tuần học kỳ và quy chuẩn Ca học chung cho toàn khoa. Trên cổng TKB HANU có <b>Tiết 1 – 14</b> (trong đó <b>Tiết 1 – 2</b> là khung sớm trước 07:10; học phần chính khóa bắt đầu từ <b>Tiết 3 lúc 07:10</b>, mỗi ca chuẩn kéo dài <b>125 phút</b> và cách nhau <b>15 phút nghỉ chuyển ca</b>).
          </p>
        </div>
      </div>

      {hasPublished && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#166534" }}>
          <b>💡 Lưu ý vận hành:</b> Học kỳ hiện đã có lịch công bố. Sau khi điều chỉnh và nhấn <b>&quot;Lưu quy chuẩn khung giờ&quot;</b>, bạn có thể sang mục Xếp lịch để chạy lại bộ giải khi cần.
        </div>
      )}

      {/* 0. Thời gian Học kỳ & Lịch Nghỉ Lễ (sinh tự động TKB dạng tuần + học bù tuần kế tiếp) */}
      <fieldset disabled={disabled}>
        <legend>1. Thời gian Học kỳ &amp; Lịch Nghỉ Lễ (Chuẩn HANU)</legend>
        <div className="editor-row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ flex: 2, minWidth: "240px" }}>
            <span>Tên học kỳ hiển thị</span>
            <input
              type="text"
              value={config.term_name ?? "Học kỳ 1 - Năm học 2026 - 2027"}
              onChange={(e) => update({ ...config, term_name: e.target.value })}
              placeholder="VD: Học kỳ 1 - Năm học 2026 - 2027"
            />
          </label>
          <label style={{ flex: 1, minWidth: "170px" }}>
            <span>Thứ 2 của Tuần 1 năm học (TKBT1)</span>
            <input
              type="date"
              value={config.term_start_date || "2026-08-03"}
              onChange={(e) => update({ ...config, term_start_date: e.target.value })}
            />
          </label>
          <label style={{ flex: 1, minWidth: "170px" }}>
            <span>Ngày kết thúc học kỳ</span>
            <input
              type="date"
              value={config.term_end_date || "2027-01-03"}
              onChange={(e) => update({ ...config, term_end_date: e.target.value })}
            />
          </label>
        </div>

        <div
          style={{
            marginTop: "14px",
            padding: "12px 14px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div>
              <b style={{ fontSize: "13px", color: "#92400e" }}>
                🎌 Lịch nghỉ lễ &amp; Tự động đẩy lịch học bù tuần kế tiếp ({(config.holidays || []).length})
              </b>
              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#78350f" }}>
                Môn nào có buổi học trùng ngày nghỉ lễ sẽ tự động nghỉ ngày đó và đẩy lịch học bù sang đúng Thứ &amp; Ca đó của tuần kế tiếp (tự động lùi ngày kết thúc môn tương ứng để đủ 12/15 tuần thực học chuẩn HANU).
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => update({ ...config, holidays: DEFAULT_HANU_HOLIDAYS })}
                style={{
                  minHeight: "30px",
                  padding: "4px 10px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  background: "#fef3c7",
                  borderColor: "#f59e0b",
                  color: "#92400e",
                }}
              >
                🎌 Nạp lịch lễ HANU HK1 2026–2027
              </button>
              <button
                type="button"
                onClick={() => {
                  const list = config.holidays || [];
                  const nextId = `HOL-${Date.now().toString().slice(-5)}`;
                  update({
                    ...config,
                    holidays: [
                      ...list,
                      {
                        id: nextId,
                        name: "Nghỉ lễ / Sự kiện trường",
                        start_date: "2026-09-02",
                        end_date: "2026-09-02",
                      },
                    ],
                  });
                }}
                style={{
                  minHeight: "30px",
                  padding: "4px 10px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                }}
              >
                + Thêm kỳ nghỉ lễ
              </button>
            </div>
          </div>

          {(config.holidays || []).length === 0 ? (
            <small style={{ color: "#92400e" }}>
              Chưa khai báo ngày nghỉ lễ. Nhấn &quot;🎌 Nạp lịch lễ HANU HK1 2026–2027&quot; (Quốc khánh 31/08–02/09, 20/11, Văn hóa VN 24/11, Tết Dương lịch 01/01) hoặc thêm kỳ nghỉ tùy chỉnh.
            </small>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {(config.holidays || []).map((hol, idx) => (
                <div
                  key={hol.id || idx}
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    background: "#ffffff",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #fde68a",
                  }}
                >
                  <label style={{ flex: "2 1 220px", margin: 0 }}>
                    <span style={{ fontSize: "11px" }}>Tên ngày lễ / sự kiện nghỉ</span>
                    <input
                      type="text"
                      value={hol.name}
                      onChange={(e) => {
                        const next = [...(config.holidays || [])];
                        next[idx] = { ...hol, name: e.target.value };
                        update({ ...config, holidays: next });
                      }}
                    />
                  </label>
                  <label style={{ flex: "1 1 145px", margin: 0 }}>
                    <span style={{ fontSize: "11px" }}>Từ ngày</span>
                    <input
                      type="date"
                      value={hol.start_date}
                      onChange={(e) => {
                        const nextStart = e.target.value;
                        const next = [...(config.holidays || [])];
                        next[idx] = {
                          ...hol,
                          start_date: nextStart,
                          end_date: hol.end_date < nextStart ? nextStart : hol.end_date,
                        };
                        update({ ...config, holidays: next });
                      }}
                    />
                  </label>
                  <label style={{ flex: "1 1 145px", margin: 0 }}>
                    <span style={{ fontSize: "11px" }}>Đến ngày</span>
                    <input
                      type="date"
                      value={hol.end_date}
                      min={hol.start_date}
                      onChange={(e) => {
                        const next = [...(config.holidays || [])];
                        next[idx] = { ...hol, end_date: e.target.value };
                        update({ ...config, holidays: next });
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    aria-label={`Xóa kỳ nghỉ ${hol.name}`}
                    onClick={() => {
                      const next = (config.holidays || []).filter((_, i) => i !== idx);
                      update({ ...config, holidays: next });
                    }}
                    style={{
                      minHeight: "34px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      color: "#b91c1c",
                      borderColor: "#fecaca",
                      background: "#fef2f2",
                    }}
                  >
                    × Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      {/* 1. Công thức Ca = #tiết * phút mỗi tiết + Nghỉ chuyển ca */}
      <fieldset disabled={disabled}>
        <legend>2. Đồng bộ Tiết ↔ Ca học & Nghỉ chuyển ca</legend>
        <div className="editor-row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
          <label>
            <span>Giờ vào Ca 1 (Tiết 3 = 07:10)</span>
            <input
              type="time"
              value={time(firstStart)}
              onChange={(e) => {
                const nextStart = minutes(e.target.value);
                update({ ...config, first_period_start: nextStart });
              }}
            />
          </label>
          <label>
            <span>Số tiết chuẩn / 1 Ca</span>
            <input
              type="number"
              step="0.5"
              min={1}
              max={6}
              value={defaultShiftPeriods}
              onChange={(e) => setDefaultShiftPeriods(Number(e.target.value) || 2.5)}
            />
          </label>
          <label>
            <span>Phút mỗi tiết chuẩn</span>
            <input
              type="number"
              step="0.5"
              min={1}
              max={120}
              value={config.period_minutes}
              onChange={(e) => update({ ...config, period_minutes: Number(e.target.value) })}
            />
          </label>
          <label>
            <span>Nghỉ chuyển ca (phút)</span>
            <input
              type="number"
              min={0}
              max={60}
              value={interShiftGap}
              onChange={(e) => setInterShiftGap(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Giờ vào Ca chiều (Tiết 7)</span>
            <input
              type="time"
              value={lunchStart}
              onChange={(e) => setLunchStart(e.target.value)}
            />
          </label>
          <label>
            <span>Trần tiết tối đa / ngày</span>
            <input
              type="number"
              step="0.5"
              min={1}
              max={12}
              value={config.max_periods}
              onChange={(e) => update({ ...config, max_periods: Number(e.target.value) })}
            />
          </label>
        </div>

        <div style={{ marginTop: "12px", padding: "10px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "12.5px", color: "#1e3a8a", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <b>📐 Công thức ca chuẩn:</b>{" "}
            <code>
              1 Ca = {defaultShiftPeriods} tiết × {config.period_minutes}p = <b>{sampleShiftDuration} phút</b>
            </code>{" "}
            (nghỉ chuyển ca <b>{interShiftGap}p</b>) → Ca 1:{" "}
            <b>
              {time(firstStart)} → {time(firstStart + sampleShiftDuration)}
            </b>
            , Ca 2:{" "}
            <b>
              {time(firstStart + sampleShiftDuration + interShiftGap)} →{" "}
              {time(firstStart + sampleShiftDuration * 2 + interShiftGap)}
            </b>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setDefaultShiftPeriods(2.5);
                setInterShiftGap(15);
                setLunchStart("12:20");
                applyShiftsAndDays(DEFAULT_HANU_SHIFTS, [2, 3, 4, 5, 6, 7], {
                  first_period_start: 430,
                  period_minutes: 50,
                });
              }}
              style={{ background: "#0284c7", color: "#ffffff", borderColor: "#0284c7", fontWeight: 600, minHeight: "32px", padding: "4px 12px", fontSize: "12px" }}
            >
              ⚡ Nạp chuẩn 6 Ca HANU (Tiết 3–14 · 07:10 → 21:35, T2–T7)
            </button>
            <button
              type="button"
              onClick={() =>
                recalculateShiftsFromPeriod1(
                  firstStart,
                  config.period_minutes,
                  defaultShiftPeriods
                )
              }
              style={{ background: "#ffffff", borderColor: "#93c5fd", color: "#1d4ed8", fontWeight: 600, minHeight: "32px", padding: "4px 12px", fontSize: "12px" }}
            >
              🔄 Đồng bộ lại 6 Ca từ Giờ bắt đầu ({time(firstStart)})
            </button>
          </div>
        </div>
      </fieldset>

      {/* 3. Quy chuẩn Ca áp dụng thống nhất Thứ 2 -> Thứ 7 */}
      <fieldset disabled={disabled}>
        <legend>3. Bảng Quy chuẩn Ca học trong ngày (Áp dụng đồng nhất các Thứ đã chọn)</legend>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>Áp dụng cho các ngày:</span>
          {[2, 3, 4, 5, 6, 7, 8].map((d) => {
            const checked = activeDays.includes(d);
            return (
              <label key={d} style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", cursor: "pointer", padding: "4px 8px", borderRadius: "6px", background: checked ? "#e0f2fe" : "#f8fafc", border: `1px solid ${checked ? "#7dd3fc" : "var(--line)"}` }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const nextDays = e.target.checked
                      ? Array.from(new Set([...activeDays, d])).sort((a, b) => a - b)
                      : activeDays.filter((x) => x !== d);
                    applyShiftsAndDays(shifts, nextDays);
                  }}
                />
                <b>{d === 8 ? "Chủ nhật" : `Thứ ${d}`}</b>
              </label>
            );
          })}
          <small style={{ color: "var(--muted)", marginLeft: "auto" }}>
            * Các ca từ <b>17:00 trở đi</b> (Ca 5, Ca 6) được hệ thống tự động nhận diện là <b>Ca tối</b>.
          </small>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Mã Ca</th>
                <th>Tên Ca & Tiết trên cổng TKB</th>
                <th style={{ width: "120px" }}>Số tiết (50p)</th>
                <th style={{ width: "145px" }}>Bắt đầu</th>
                <th style={{ width: "145px" }}>Kết thúc</th>
                <th style={{ width: "80px" }}>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((sh, idx) => (
                <tr key={sh.id + "-" + idx}>
                  <td>
                    <b>{sh.id}</b>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        value={sh.label}
                        onChange={(e) => {
                          const next = shifts.map((x, j) => (j === idx ? { ...x, label: e.target.value } : x));
                          applyShiftsAndDays(next, activeDays);
                        }}
                        placeholder="Tên ca"
                        style={{ minHeight: "32px", height: "32px", fontSize: "12px" }}
                      />
                      <input
                        value={sh.periods_label || ""}
                        onChange={(e) => {
                          const next = shifts.map((x, j) => (j === idx ? { ...x, periods_label: e.target.value } : x));
                          applyShiftsAndDays(next, activeDays);
                        }}
                        placeholder="VD: Tiết 3 – 4"
                        style={{ minHeight: "32px", height: "32px", fontSize: "12px" }}
                      />
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.5"
                      min={0.5}
                      max={8}
                      value={sh.periods}
                      onChange={(e) => {
                        const p = Number(e.target.value) || 2.5;
                        const dur = calcShiftDuration(p, config.period_minutes, 0, false);
                        const next = shifts.map((x, j) =>
                          j === idx ? { ...x, periods: p, end: Math.min(1440, x.start + dur) } : x
                        );
                        applyShiftsAndDays(next, activeDays);
                      }}
                      style={{ minHeight: "32px", height: "32px", fontSize: "12px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={time(sh.start)}
                      onChange={(e) => {
                        const st = minutes(e.target.value);
                        const dur = calcShiftDuration(sh.periods, config.period_minutes, 0, false);
                        const next = shifts.map((x, j) =>
                          j === idx ? { ...x, start: st, end: Math.min(1440, st + dur), evening: isEveningStart(st) } : x
                        );
                        applyShiftsAndDays(next, activeDays);
                      }}
                      style={{ minHeight: "32px", height: "32px", fontSize: "12px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={time(sh.end)}
                      onChange={(e) => {
                        const en = minutes(e.target.value);
                        const next = shifts.map((x, j) => (j === idx ? { ...x, end: en } : x));
                        applyShiftsAndDays(next, activeDays);
                      }}
                      style={{ minHeight: "32px", height: "32px", fontSize: "12px" }}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-remove"
                      style={{ minHeight: "28px", padding: "2px 8px", fontSize: "11px" }}
                      onClick={() => {
                        const next = shifts.filter((_, j) => j !== idx);
                        applyShiftsAndDays(next, activeDays);
                      }}
                    >
                      Bỏ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                const nextId = `C${shifts.length + 1}`;
                const lastEnd = shifts.length ? shifts[shifts.length - 1].end : 430;
                const start = Math.min(1300, lastEnd + interShiftGap);
                const dur = calcShiftDuration(defaultShiftPeriods, config.period_minutes, 0, false);
                const next = [
                  ...shifts,
                  {
                    id: nextId,
                    label: `Ca ${shifts.length + 1}`,
                    periods_label: `${defaultShiftPeriods} tiết`,
                    start,
                    periods: defaultShiftPeriods,
                    include_break: false,
                    break_minutes: 0,
                    end: Math.min(1440, start + dur),
                    evening: isEveningStart(start),
                  },
                ];
                applyShiftsAndDays(next, activeDays);
              }}
            >
              + Thêm Ca chuẩn mới
            </button>
            {!shifts.some((s) => s.start < 430) && (
              <button
                type="button"
                onClick={() => {
                  const early: ShiftRule = {
                    id: "M0",
                    label: "Ca sớm (Tiết 1–2)",
                    periods_label: "Tiết 1 – 2",
                    start: 360,
                    periods: 1,
                    include_break: false,
                    break_minutes: 0,
                    end: 420,
                    evening: false,
                  };
                  applyShiftsAndDays([early, ...shifts], activeDays);
                }}
                style={{ fontSize: "12px" }}
              >
                + Bật thêm khung sớm Tiết 1–2 (trước 07:10)
              </button>
            )}
          </div>
          <small style={{ color: "var(--muted)" }}>
            Đang tự động đồng bộ <b>{shifts.length} ca chuẩn</b> × <b>{activeDays.length} ngày</b> ={" "}
            <b>{config.slots.length} khung giờ khả dụng</b> trong tuần.
          </small>
        </div>

        <details style={{ marginTop: "12px" }}>
          <summary style={{ cursor: "pointer", fontSize: "12px", color: "var(--muted)" }}>
            Xem / Tinh chỉnh chi tiết từng khung giờ theo ngày ({config.slots.length} khung đang nạp)
          </summary>
          <div style={{ maxHeight: "280px", overflowY: "auto", marginTop: "10px", paddingRight: "6px" }}>
            {config.slots.map((slot, i) => (
              <div className="editor-row" key={i}>
                <label style={{ flex: 1 }}>
                  <span>Thứ</span>
                  <select
                    value={slot.day}
                    onChange={(e) =>
                      update({
                        ...config,
                        slots: config.slots.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)),
                      })
                    }
                  >
                    {Array.from({ length: 7 }, (_, j) => j + 2).map((d) => (
                      <option key={d} value={d}>
                        {d === 8 ? "Chủ nhật" : "Thứ " + d}
                      </option>
                    ))}
                  </select>
                </label>
                {(["start", "end"] as const).map((k) => (
                  <label key={k}>
                    <span>{k === "start" ? "Bắt đầu" : "Kết thúc"}</span>
                    <input
                      type="time"
                      value={time(slot[k])}
                      onChange={(e) =>
                        update({
                          ...config,
                          slots: config.slots.map((x, j) =>
                            j === i ? { ...x, [k]: minutes(e.target.value) } : x
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <button
                  className="btn-remove"
                  type="button"
                  onClick={() => update({ ...config, slots: config.slots.filter((_, j) => j !== i) })}
                >
                  Bỏ
                </button>
              </div>
            ))}
          </div>
        </details>
      </fieldset>

      <button
        className="primary"
        disabled={disabled}
        onClick={() => {
          const finalSlots = hasSavedShifts && config.slots.length > 0
            ? config.slots
            : buildSlotsFromShifts(shifts, activeDays);
          onSave({
            ...config,
            term_name: config.term_name || "Học kỳ 1 - Năm học 2026 - 2027",
            term_start_date: config.term_start_date || "2026-08-03",
            term_end_date: config.term_end_date || "2027-01-03",
            soft_weights: config.soft_weights ?? { restricted: 1, single_class: 1, overload: 1, gaps_minutes: 1 },
            include_break: false,
            break_minutes: 0,
            shift_rules: shifts.map((s) => ({
              ...s,
              include_break: false,
              break_minutes: 0,
              evening: isEveningStart(s.start),
            })),
            active_days: activeDays,
            slots: finalSlots,
          });
        }}
      >
        Lưu quy chuẩn khung giờ ({config.slots.length || shifts.length * activeDays.length} khung)
      </button>
    </section>
  );
}
