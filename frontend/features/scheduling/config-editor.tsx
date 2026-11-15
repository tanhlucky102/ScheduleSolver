"use client";
import { useState } from "react";
import { Icon, ActionButton } from "../shared/ui";
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
  afternoon_start?: number;
  evening_start?: number;
  inter_shift_gap?: number;
  active_days?: number[];
  shift_rules?: ShiftRule[];
  color_rules?: ColorRule[];
  max_periods: number;
  rooms: Record<string, number>;
  slots: { day: number; start: number; end: number; evening: boolean }[];
};

const checkIsEvening = (startMin: number, explicitEvening?: boolean, eveningBase = 1030) =>
  Boolean(explicitEvening) || startMin >= Math.min(1020, eveningBase);

function sessionBucket(s: ShiftRule, afternoonBase = 740, eveningBase = 1030): "M" | "A" | "E" {
  if (s.id.startsWith("E") || checkIsEvening(s.start, s.evening, eveningBase)) return "E";
  if (s.id.startsWith("A") || s.start >= Math.min(720, afternoonBase)) return "A";
  return "M";
}

function buildSlotsFromShifts(
  shifts: ShiftRule[],
  activeDays: number[],
  afternoonBase = 740,
  eveningBase = 1030
) {
  const days = [...activeDays].sort((a, b) => a - b);
  const ordered = [...shifts].filter((s) => s.start < s.end).sort((a, b) => a.start - b.start);
  const seen = new Set<string>();
  const slots: { day: number; start: number; end: number; evening: boolean }[] = [];
  for (const day of days) {
    for (let i = 0; i < ordered.length; i++) {
      const s = ordered[i];
      let blockEnd = s.end;
      const bucket = sessionBucket(s, afternoonBase, eveningBase);
      for (let j = i + 1; j < ordered.length; j++) {
        const nxt = ordered[j];
        if (sessionBucket(nxt, afternoonBase, eveningBase) !== bucket || nxt.start - blockEnd > 30) break;
        blockEnd = Math.max(blockEnd, nxt.end);
      }
      const key = `${day}-${s.start}-${blockEnd}`;
      if (seen.has(key)) continue;
      seen.add(key);
      slots.push({
        day,
        start: s.start,
        end: blockEnd,
        evening: checkIsEvening(s.start, s.evening, eveningBase),
      });
    }
  }
  return slots;
}

function computeSixShifts(params: {
  p1Start: number;
  pMinutes: number;
  shiftPeriods: number;
  afternoonStart: number;
  eveningStart: number;
  interShiftGap: number;
}): ShiftRule[] {
  const { p1Start, pMinutes, shiftPeriods, afternoonStart, eveningStart, interShiftGap } = params;
  const dur = calcShiftDuration(shiftPeriods, pMinutes, 0, false);

  const m1Start = p1Start;
  const m1End = Math.min(1440, m1Start + dur);
  const m2Start = Math.min(1440, m1End + interShiftGap);
  const m2End = Math.min(1440, m2Start + dur);

  const a1Start = afternoonStart >= m2End ? afternoonStart : Math.min(1440, m2End + interShiftGap);
  const a1End = Math.min(1440, a1Start + dur);
  const a2Start = Math.min(1440, a1End + interShiftGap);
  const a2End = Math.min(1440, a2Start + dur);

  const e1Start = eveningStart >= a2End ? eveningStart : Math.min(1439, a2End + interShiftGap);
  const e1End = Math.min(1439, e1Start + dur);
  const e2Start = Math.min(1420, e1End + interShiftGap);
  const e2End = Math.min(1440, e2Start + dur);

  const useStandardLabels = shiftPeriods >= 2 && shiftPeriods <= 3;

  return [
    {
      id: "M1",
      label: "Ca 1 (Sáng)",
      periods_label: useStandardLabels ? "Tiết 3 – 4" : `Ca 1 (${shiftPeriods} tiết)`,
      start: m1Start,
      periods: shiftPeriods,
      include_break: false,
      break_minutes: 0,
      end: m1End,
      evening: false,
    },
    {
      id: "M2",
      label: "Ca 2 (Sáng)",
      periods_label: useStandardLabels ? "Tiết 5 – 6" : `Ca 2 (${shiftPeriods} tiết)`,
      start: m2Start,
      periods: shiftPeriods,
      include_break: false,
      break_minutes: 0,
      end: m2End,
      evening: false,
    },
    {
      id: "A1",
      label: "Ca 3 (Chiều)",
      periods_label: useStandardLabels ? "Tiết 7 – 8" : `Ca 3 (${shiftPeriods} tiết)`,
      start: a1Start,
      periods: shiftPeriods,
      include_break: false,
      break_minutes: 0,
      end: a1End,
      evening: false,
    },
    {
      id: "A2",
      label: "Ca 4 (Chiều)",
      periods_label: useStandardLabels ? "Tiết 9 – 10" : `Ca 4 (${shiftPeriods} tiết)`,
      start: a2Start,
      periods: shiftPeriods,
      include_break: false,
      break_minutes: 0,
      end: a2End,
      evening: false,
    },
    {
      id: "E1",
      label: "Ca 5 (Tối)",
      periods_label: useStandardLabels ? "Tiết 11 – 12" : `Ca 5 (${shiftPeriods} tiết)`,
      start: e1Start,
      periods: shiftPeriods,
      include_break: false,
      break_minutes: 0,
      end: e1End,
      evening: true,
    },
    {
      id: "E2",
      label: "Ca 6 (Tối)",
      periods_label: useStandardLabels ? "Tiết 13 – 14" : `Ca 6 (${shiftPeriods} tiết)`,
      start: e2Start,
      periods: shiftPeriods,
      include_break: false,
      break_minutes: 0,
      end: e2End,
      evening: true,
    },
  ];
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
  const [autoSyncShifts, setAutoSyncShifts] = useState(true);
  const [defaultShiftPeriods, setDefaultShiftPeriods] = useState(2.5);
  const [presetApplied, setPresetApplied] = useState(false);

  const rawParsed = value
    ? (JSON.parse(value) as Config & { external_travel_buffer?: number })
    : {
        period_minutes: 50,
        break_minutes: 0,
        include_break: false,
        first_period_start: 430,
        afternoon_start: 740,
        evening_start: 1030,
        inter_shift_gap: 15,
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
    afternoon_start: 740,
    evening_start: 1030,
    inter_shift_gap: 15,
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
  const afternoonStart = config.afternoon_start ?? 740;
  const eveningStart = config.evening_start ?? 1030;
  const interShiftGap = config.inter_shift_gap ?? 15;

  const update = (c: Config) => onChange(JSON.stringify({ ...c, include_break: false, break_minutes: 0 }));

  const applyShiftsAndDays = (nextShifts: ShiftRule[], nextDays: number[], extra?: Partial<Config>) => {
    const nextAft = extra?.afternoon_start ?? afternoonStart;
    const nextEve = extra?.evening_start ?? eveningStart;
    const normalizedShifts = nextShifts.map((sh) => ({
      ...sh,
      include_break: false,
      break_minutes: 0,
      evening: checkIsEvening(sh.start, sh.evening || sh.id.startsWith("E"), nextEve),
    }));
    const merged: Config = {
      ...config,
      ...extra,
      include_break: false,
      break_minutes: 0,
      shift_rules: normalizedShifts,
      active_days: nextDays,
      slots: buildSlotsFromShifts(normalizedShifts, nextDays, nextAft, nextEve),
    };
    update(merged);
  };

  const handleTimingParamChange = (patch: {
    first_period_start?: number;
    period_minutes?: number;
    afternoon_start?: number;
    evening_start?: number;
    inter_shift_gap?: number;
    shiftPeriods?: number;
  }) => {
    setPresetApplied(false);
    const nextP1 = patch.first_period_start ?? firstStart;
    const nextPMin = patch.period_minutes ?? config.period_minutes;
    const nextAft = patch.afternoon_start ?? afternoonStart;
    const nextEve = patch.evening_start ?? eveningStart;
    const nextGap = patch.inter_shift_gap ?? interShiftGap;
    const nextPeriods = patch.shiftPeriods ?? defaultShiftPeriods;

    if (patch.shiftPeriods !== undefined) {
      setDefaultShiftPeriods(nextPeriods);
    }

    const extraConfig: Partial<Config> = {
      first_period_start: nextP1,
      period_minutes: nextPMin,
      afternoon_start: nextAft,
      evening_start: nextEve,
      inter_shift_gap: nextGap,
    };

    if (autoSyncShifts) {
      const synced = computeSixShifts({
        p1Start: nextP1,
        pMinutes: nextPMin,
        shiftPeriods: nextPeriods,
        afternoonStart: nextAft,
        eveningStart: nextEve,
        interShiftGap: nextGap,
      });
      applyShiftsAndDays(synced, activeDays, extraConfig);
    } else {
      update({ ...config, ...extraConfig });
    }
  };

  const handleRestoreHanuPreset = () => {
    setDefaultShiftPeriods(2.5);
    setAutoSyncShifts(true);
    applyShiftsAndDays(DEFAULT_HANU_SHIFTS, [2, 3, 4, 5, 6, 7], {
      first_period_start: 430,
      period_minutes: 50,
      afternoon_start: 740,
      evening_start: 1030,
      inter_shift_gap: 15,
    });
    setPresetApplied(true);
  };

  const sampleShiftDuration = calcShiftDuration(defaultShiftPeriods, config.period_minutes, 0, false);
  const computedLiveSlotsCount = shifts.length > 0
    ? buildSlotsFromShifts(shifts, activeDays, afternoonStart, eveningStart).length
    : config.slots.length;

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Khung giờ, Thời gian Học kỳ &amp; Quy chuẩn Ca (Thứ 2 → Thứ 7)</h2>
          <p>
            Thiết lập mốc tuần học kỳ và quy chuẩn Ca học chung cho toàn khoa. Trên cổng TKB HANU có <b>Tiết 1 – 15</b> (trong đó <b>Tiết 1 – 2</b> là khung sớm trước 07:10; học phần chính khóa bắt đầu từ <b>Tiết 3 lúc 07:10</b>, mỗi ca chuẩn kéo dài <b>125 phút</b> và cách nhau <b>15 phút nghỉ chuyển ca</b>).
          </p>
        </div>
      </div>

      {hasPublished && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "14px",
            fontSize: "12.5px",
            color: "#166534",
          }}
        >
          <Icon name="info" size={16} />
          <span>
            <b>Lưu ý vận hành:</b> Học kỳ hiện đã có lịch công bố. Sau khi điều chỉnh và nhấn <b>&quot;Lưu cấu hình khung giờ&quot;</b>, bạn có thể sang mục Xếp lịch để chạy lại bộ giải khi cần.
          </span>
        </div>
      )}

      {/* 1. Thời gian Học kỳ & Lịch Nghỉ Lễ */}
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
              <b style={{ fontSize: "13px", color: "#92400e", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Icon name="calendar" size={15} />
                Lịch nghỉ lễ &amp; Tự động đẩy lịch học bù tuần kế tiếp ({(config.holidays || []).length})
              </b>
              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#78350f" }}>
                Môn nào có buổi học trùng ngày nghỉ lễ sẽ tự động nghỉ ngày đó và đẩy lịch học bù sang đúng Thứ &amp; Ca đó của tuần kế tiếp (tự động lùi ngày kết thúc môn tương ứng để đủ số tuần thực học).
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <ActionButton
                type="button"
                icon="refresh"
                onClick={() => update({ ...config, holidays: DEFAULT_HANU_HOLIDAYS })}
                style={{
                  minHeight: "32px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  background: "#fef3c7",
                  borderColor: "#f59e0b",
                  color: "#92400e",
                }}
              >
                Nạp lịch lễ HANU HK1 2026–2027
              </ActionButton>
              <ActionButton
                type="button"
                icon="plus"
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
                style={{ minHeight: "32px", padding: "4px 10px", fontSize: "12px" }}
              >
                Thêm kỳ nghỉ lễ
              </ActionButton>
            </div>
          </div>

          {(config.holidays || []).length === 0 ? (
            <small style={{ color: "#92400e" }}>
              Chưa khai báo ngày nghỉ lễ. Nhấn &quot;Nạp lịch lễ HANU HK1 2026–2027&quot; (Quốc khánh 31/08–02/09, 20/11, Văn hóa VN 24/11, Tết Dương lịch 01/01) hoặc thêm kỳ nghỉ tùy chỉnh.
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
                  <ActionButton
                    type="button"
                    variant="danger"
                    icon="trash"
                    aria-label={`Xóa kỳ nghỉ ${hol.name}`}
                    onClick={() => {
                      const next = (config.holidays || []).filter((_, i) => i !== idx);
                      update({ ...config, holidays: next });
                    }}
                    style={{ minHeight: "34px", padding: "4px 10px", fontSize: "12px" }}
                  >
                    Xóa
                  </ActionButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      {/* 2. Đồng bộ động Tiết <-> 6 Ca học */}
      <fieldset disabled={disabled}>
        <legend>2. Khung giờ Tiết &amp; Đồng bộ tự động 6 Ca học</legend>
        <div className="editor-row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
          <label>
            <span>Giờ vào Tiết 1 / Ca 1 (Tiết 3 HANU)</span>
            <input
              type="time"
              value={time(firstStart)}
              onChange={(e) => handleTimingParamChange({ first_period_start: minutes(e.target.value) })}
            />
          </label>
          <label>
            <span>Thời lượng 1 tiết (phút)</span>
            <input
              type="number"
              step="0.5"
              min={15}
              max={120}
              value={config.period_minutes}
              onChange={(e) =>
                handleTimingParamChange({ period_minutes: Math.max(15, Number(e.target.value) || 50) })
              }
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
              onChange={(e) =>
                handleTimingParamChange({ shiftPeriods: Math.max(1, Number(e.target.value) || 2.5) })
              }
            />
          </label>
          <label>
            <span>Nghỉ chuyển ca (phút)</span>
            <input
              type="number"
              min={0}
              max={90}
              value={interShiftGap}
              onChange={(e) =>
                handleTimingParamChange({ inter_shift_gap: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </label>
          <label>
            <span>Giờ vào Ca chiều (Tiết 7)</span>
            <input
              type="time"
              value={time(afternoonStart)}
              onChange={(e) => handleTimingParamChange({ afternoon_start: minutes(e.target.value) })}
            />
          </label>
          <label>
            <span>Giờ vào Ca tối (Tiết 11)</span>
            <input
              type="time"
              value={time(eveningStart)}
              onChange={(e) => handleTimingParamChange({ evening_start: minutes(e.target.value) })}
            />
          </label>
          <label>
            <span>Trần tiết tối đa / ngày</span>
            <input
              type="number"
              step="0.5"
              min={1}
              max={15}
              value={config.max_periods}
              onChange={(e) => update({ ...config, max_periods: Number(e.target.value) || 8 })}
            />
          </label>
        </div>

        <div className="config-sync-bar">
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label className="config-toggle-label">
              <input
                type="checkbox"
                checked={autoSyncShifts}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setAutoSyncShifts(enabled);
                  if (enabled) {
                    const synced = computeSixShifts({
                      p1Start: firstStart,
                      pMinutes: config.period_minutes,
                      shiftPeriods: defaultShiftPeriods,
                      afternoonStart,
                      eveningStart,
                      interShiftGap,
                    });
                    applyShiftsAndDays(synced, activeDays);
                  }
                }}
              />
              <span>Tự động cập nhật 6 Ca học khi đổi giờ tiết</span>
            </label>
            <small style={{ color: "#1e40af" }}>
              1 Ca = {defaultShiftPeriods} tiết × {config.period_minutes}p = <b>{sampleShiftDuration} phút</b> · Nghỉ chuyển ca <b>{interShiftGap} phút</b> · Sáng {time(firstStart)} · Chiều {time(afternoonStart)} · Tối {time(eveningStart)}
            </small>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {presetApplied && (
              <span className="preset-confirm-badge" role="status">
                <Icon name="check" size={14} />
                Đã áp dụng khung chuẩn
              </span>
            )}
            <ActionButton
              type="button"
              icon="undo"
              onClick={handleRestoreHanuPreset}
              style={{ minHeight: "34px", padding: "5px 12px", fontSize: "12px", fontWeight: 600 }}
            >
              Khôi phục khung chuẩn HANU
            </ActionButton>
          </div>
        </div>
      </fieldset>

      {/* 3. Bảng Quy chuẩn Ca áp dụng thống nhất Thứ 2 -> Thứ 7 */}
      <fieldset disabled={disabled}>
        <legend>3. Bảng Quy chuẩn Ca học trong ngày (Áp dụng đồng nhất các Thứ đã chọn)</legend>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>Áp dụng cho các ngày:</span>
          {[2, 3, 4, 5, 6, 7, 8].map((d) => {
            const checked = activeDays.includes(d);
            return (
              <label
                key={d}
                style={{
                  margin: 0,
                  display: "inline-flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: "4px 9px",
                  borderRadius: "6px",
                  background: checked ? "#e0f2fe" : "#f8fafc",
                  border: `1px solid ${checked ? "#7dd3fc" : "var(--line)"}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setPresetApplied(false);
                    const nextDays = e.target.checked
                      ? Array.from(new Set([...activeDays, d])).sort((a, b) => a - b)
                      : activeDays.filter((x) => x !== d);
                    applyShiftsAndDays(shifts, nextDays);
                  }}
                />
                <b>{d === 8 ? "Chủ Nhật" : `Thứ ${d}`}</b>
              </label>
            );
          })}
          <small style={{ color: "var(--muted)", marginLeft: "auto" }}>
            Các ca tối (Ca 5, Ca 6 hoặc từ {time(eveningStart)} trở đi) được đánh dấu là <b>Thời khóa biểu tối</b>.
          </small>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Mã Ca</th>
                <th>Tên Ca &amp; Tiết trên cổng QLĐT</th>
                <th style={{ width: "125px" }}>Số tiết ({config.period_minutes}p)</th>
                <th style={{ width: "145px" }}>Bắt đầu</th>
                <th style={{ width: "145px" }}>Kết thúc</th>
                <th style={{ width: "90px" }}>Xóa</th>
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
                          setPresetApplied(false);
                          const next = shifts.map((x, j) => (j === idx ? { ...x, label: e.target.value } : x));
                          applyShiftsAndDays(next, activeDays);
                        }}
                        placeholder="Tên ca"
                        style={{ minHeight: "32px", height: "32px", fontSize: "12px" }}
                      />
                      <input
                        value={sh.periods_label || ""}
                        onChange={(e) => {
                          setPresetApplied(false);
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
                        setPresetApplied(false);
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
                        setPresetApplied(false);
                        const st = minutes(e.target.value);
                        const dur = calcShiftDuration(sh.periods, config.period_minutes, 0, false);
                        const next = shifts.map((x, j) =>
                          j === idx
                            ? {
                                ...x,
                                start: st,
                                end: Math.min(1440, st + dur),
                                evening: checkIsEvening(st, x.id.startsWith("E"), eveningStart),
                              }
                            : x
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
                        setPresetApplied(false);
                        const en = minutes(e.target.value);
                        const next = shifts.map((x, j) => (j === idx ? { ...x, end: en } : x));
                        applyShiftsAndDays(next, activeDays);
                      }}
                      style={{ minHeight: "32px", height: "32px", fontSize: "12px" }}
                    />
                  </td>
                  <td>
                    <ActionButton
                      type="button"
                      variant="danger"
                      icon="trash"
                      style={{ minHeight: "28px", padding: "2px 8px", fontSize: "11px" }}
                      onClick={() => {
                        setPresetApplied(false);
                        const next = shifts.filter((_, j) => j !== idx);
                        applyShiftsAndDays(next, activeDays);
                      }}
                    >
                      Bỏ
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <ActionButton
              type="button"
              icon="plus"
              onClick={() => {
                setPresetApplied(false);
                const nextId = `C${shifts.length + 1}`;
                const lastEnd = shifts.length ? shifts[shifts.length - 1].end : firstStart;
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
                    evening: checkIsEvening(start, false, eveningStart),
                  },
                ];
                applyShiftsAndDays(next, activeDays);
              }}
              style={{ fontSize: "12px", minHeight: "32px", padding: "4px 10px" }}
            >
              Thêm Ca chuẩn mới
            </ActionButton>
            {!shifts.some((s) => s.start < firstStart) && (
              <ActionButton
                type="button"
                icon="clock"
                onClick={() => {
                  setPresetApplied(false);
                  const earlyStart = Math.max(300, firstStart - 2 * config.period_minutes);
                  const early: ShiftRule = {
                    id: "M0",
                    label: "Ca sớm (Tiết 1–2)",
                    periods_label: "Tiết 1 – 2",
                    start: earlyStart,
                    periods: 2,
                    include_break: false,
                    break_minutes: 0,
                    end: firstStart,
                    evening: false,
                  };
                  applyShiftsAndDays([early, ...shifts], activeDays);
                }}
                style={{ fontSize: "12px", minHeight: "32px", padding: "4px 10px" }}
              >
                Bật thêm khung sớm Tiết 1–2 ({time(Math.max(300, firstStart - 2 * config.period_minutes))} → {time(firstStart)})
              </ActionButton>
            )}
          </div>
          <small style={{ color: "var(--muted)" }}>
            Đang đồng bộ trực tiếp <b>{shifts.length} ca học</b> × <b>{activeDays.length} ngày</b> ={" "}
            <b>{computedLiveSlotsCount} khung giờ khả dụng</b> trong tuần.
          </small>
        </div>

        <details style={{ marginTop: "12px" }}>
          <summary style={{ cursor: "pointer", fontSize: "12px", color: "var(--muted)" }}>
            Xem danh sách khung giờ khả dụng sinh từ bảng Ca ({computedLiveSlotsCount} khung)
          </summary>
          <div style={{ maxHeight: "260px", overflowY: "auto", marginTop: "10px", paddingRight: "6px" }}>
            {(shifts.length > 0
              ? buildSlotsFromShifts(shifts, activeDays, afternoonStart, eveningStart)
              : config.slots
            ).map((slot, i) => (
              <div className="editor-row" key={i} style={{ alignItems: "center" }}>
                <span style={{ minWidth: "90px", fontSize: "12px", fontWeight: 600 }}>
                  {slot.day === 8 ? "Chủ Nhật" : `Thứ ${slot.day}`}
                </span>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {time(slot.start)} → {time(slot.end)} {slot.evening ? "(Ca tối)" : ""}
                </span>
              </div>
            ))}
          </div>
        </details>
      </fieldset>

      <ActionButton
        type="button"
        variant="primary"
        icon="check"
        disabled={disabled}
        onClick={() => {
          const normalizedShifts = shifts.map((s) => ({
            ...s,
            include_break: false,
            break_minutes: 0,
            evening: checkIsEvening(s.start, s.evening || s.id.startsWith("E"), eveningStart),
          }));
          const finalSlots =
            normalizedShifts.length > 0
              ? buildSlotsFromShifts(normalizedShifts, activeDays, afternoonStart, eveningStart)
              : config.slots;
          onSave({
            ...config,
            term_name: config.term_name || "Học kỳ 1 - Năm học 2026 - 2027",
            term_start_date: config.term_start_date || "2026-08-03",
            term_end_date: config.term_end_date || "2027-01-03",
            first_period_start: firstStart,
            afternoon_start: afternoonStart,
            evening_start: eveningStart,
            inter_shift_gap: interShiftGap,
            soft_weights: config.soft_weights ?? { restricted: 1, single_class: 1, overload: 1, gaps_minutes: 1 },
            include_break: false,
            break_minutes: 0,
            shift_rules: normalizedShifts,
            active_days: activeDays,
            slots: finalSlots,
          });
        }}
      >
        Lưu cấu hình khung giờ ({computedLiveSlotsCount} khung)
      </ActionButton>
    </section>
  );
}
