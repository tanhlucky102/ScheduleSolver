import { clock } from "../shared/time";
import type {
  Event,
  ColorRule,
  ShiftRule,
  PeriodConfigInput,
  PeriodRow,
  MappedPeriodRange,
  PeriodCluster,
} from "./term-calendar-types";
import type { Workspace } from "../workspace/types";

export function calcShiftDuration(
  periods: number,
  periodMinutes: number,
  breakMinutes: number = 0,
  includeBreak: boolean = false
): number {
  const base = Math.round(periods * periodMinutes);
  if (!includeBreak) return base;
  return base + Math.max(0, Math.floor(periods) - 1) * breakMinutes;
}

// Official HANU 6-shift standard (Tiết 1–2 là khung sớm trước 07:10; học phần chính khóa từ Tiết 3 = 07:10)
export const DEFAULT_HANU_SHIFTS: ShiftRule[] = [
  { id: "M1", label: "Ca 1 (Sáng)", periods_label: "Tiết 3 – 4", start: 430, periods: 2.5, include_break: false, break_minutes: 0, end: 555, evening: false },
  { id: "M2", label: "Ca 2 (Sáng)", periods_label: "Tiết 5 – 6", start: 570, periods: 2.5, include_break: false, break_minutes: 0, end: 695, evening: false },
  { id: "A1", label: "Ca 3 (Chiều)", periods_label: "Tiết 7 – 8", start: 740, periods: 2.5, include_break: false, break_minutes: 0, end: 865, evening: false },
  { id: "A2", label: "Ca 4 (Chiều)", periods_label: "Tiết 9 – 10", start: 880, periods: 2.5, include_break: false, break_minutes: 0, end: 1005, evening: false },
  { id: "E1", label: "Ca 5 (Tối)", periods_label: "Tiết 11 – 12", start: 1030, periods: 2.5, include_break: false, break_minutes: 0, end: 1155, evening: true },
  { id: "E2", label: "Ca 6 (Tối)", periods_label: "Tiết 13 – 14", start: 1170, periods: 2.5, include_break: false, break_minutes: 0, end: 1295, evening: true },
];

export const TIME_SLOTS = [
  { id: "M1", session: "Sáng", label: "Ca 1 (Tiết 3 – 4)", time: "07:10 – 09:15", start: 430, end: 555 },
  { id: "M2", session: "Sáng", label: "Ca 2 (Tiết 5 – 6)", time: "09:30 – 11:35", start: 570, end: 695 },
  { id: "A1", session: "Chiều", label: "Ca 3 (Tiết 7 – 8)", time: "12:20 – 14:25", start: 740, end: 865 },
  { id: "A2", session: "Chiều", label: "Ca 4 (Tiết 9 – 10)", time: "14:40 – 16:45", start: 880, end: 1005 },
  { id: "E1", session: "Tối", label: "Ca 5 (Tiết 11 – 12)", time: "17:10 – 19:15", start: 1030, end: 1155 },
  { id: "E2", session: "Tối", label: "Ca 6 (Tiết 13 – 14)", time: "19:30 – 21:35", start: 1170, end: 1295 },
];

export function buildTimeSlots(shiftRules?: ShiftRule[]) {
  if (!shiftRules || !shiftRules.length) return TIME_SLOTS;
  return shiftRules.map((s) => ({
    id: s.id,
    session: s.evening || s.start >= 1010 ? "Tối" : s.start < 720 ? "Sáng" : "Chiều",
    label: s.periods_label ? `${s.label} (${s.periods_label})` : `${s.label} (${s.periods} tiết)`,
    time: `${clock(s.start)} – ${clock(s.end)}`,
    start: s.start,
    end: s.end,
  }));
}

function parsePeriodRangeFromLabel(label?: string): [number, number] | null {
  if (!label) return null;
  const m = label.match(/tiết\s*(\d{1,2})(?:\s*[-–—~]\s*(\d{1,2}))?/i);
  if (!m) return null;
  const p1 = Number(m[1]);
  const p2 = m[2] ? Number(m[2]) : p1;
  if (!Number.isFinite(p1) || p1 < 1 || p1 > 15) return null;
  const clampedEnd = Math.max(p1, Math.min(15, Number.isFinite(p2) ? p2 : p1));
  return [p1, clampedEnd];
}

export function buildPeriodRows(
  shiftRules?: ShiftRule[],
  periodConfig?: PeriodConfigInput
): PeriodRow[] {
  const pMin = Math.max(15, Math.round(periodConfig?.period_minutes ?? 50));
  const gap = Math.max(0, Math.round(periodConfig?.inter_shift_gap ?? 15));
  const shiftDur = calcShiftDuration(2.5, pMin, 0, false);

  const sortedShifts = shiftRules && shiftRules.length > 0
    ? [...shiftRules].sort((a, b) => a.start - b.start)
    : [];

  const morningShifts = sortedShifts.filter((s) => !s.evening && s.start < 720);
  const afternoonShifts = sortedShifts.filter((s) => !s.evening && s.start >= 720 && s.start < 1010);
  const eveningShifts = sortedShifts.filter((s) => Boolean(s.evening) || s.start >= 1010);

  // Anchor Morning (Tiết 3–6), Afternoon (Tiết 7–10), Evening (Tiết 11–15) to canonical HANU QLĐT slots
  const p3Start = morningShifts[0]?.start ?? periodConfig?.first_period_start ?? 430; // 07:10
  const p4Start = p3Start + pMin; // 08:00
  const p4End = morningShifts[0]?.end && morningShifts[0].end > p4Start ? morningShifts[0].end : p3Start + shiftDur; // 09:15

  const defaultM2Start = p4End + gap; // 09:30
  const p5Start =
    morningShifts[1] && morningShifts[1].start >= p4Start + 30
      ? morningShifts[1].start
      : defaultM2Start;
  const p6Start = p5Start + pMin; // 10:20
  const p6End = morningShifts[1]?.end && morningShifts[1].end > p6Start ? morningShifts[1].end : p5Start + shiftDur; // 11:35

  const aftAnchor = periodConfig?.afternoon_start ?? 740; // 12:20
  const p7Start = afternoonShifts[0]?.start ?? Math.max(aftAnchor, p6End + gap);
  const p8Start = p7Start + pMin; // 13:10
  const p8End = afternoonShifts[0]?.end && afternoonShifts[0].end > p8Start ? afternoonShifts[0].end : p7Start + shiftDur; // 14:25

  const defaultA2Start = p8End + gap; // 14:40
  const p9Start =
    afternoonShifts[1] && afternoonShifts[1].start >= p8Start + 30
      ? afternoonShifts[1].start
      : defaultA2Start;
  const p10Start = p9Start + pMin; // 15:30
  const p10End = afternoonShifts[1]?.end && afternoonShifts[1].end > p10Start ? afternoonShifts[1].end : p9Start + shiftDur; // 16:45

  const eveAnchor = periodConfig?.evening_start ?? 1030; // 17:10
  const p11Start = eveningShifts[0]?.start ?? Math.max(eveAnchor, p10End + gap);
  const p12Start = p11Start + pMin; // 18:00
  const p12End = eveningShifts[0]?.end && eveningShifts[0].end > p12Start ? eveningShifts[0].end : p11Start + shiftDur; // 19:15

  const defaultE2Start = p12End + gap; // 19:30
  const p13Start =
    eveningShifts[1] && eveningShifts[1].start >= p12Start + 30
      ? eveningShifts[1].start
      : defaultE2Start;
  const p14Start = p13Start + pMin; // 20:20
  const p14End = Math.min(
    1440,
    eveningShifts[1]?.end && eveningShifts[1].end > p14Start ? eveningShifts[1].end : p13Start + shiftDur
  );
  const p15Start = Math.min(1410, p14Start + pMin); // 21:10
  const p15End = Math.min(1440, p15Start + pMin);

  const p2Start = Math.max(0, p3Start - pMin); // 06:20
  const p1Start = Math.max(0, p2Start - pMin); // 05:30

  const schedule: [number, number, boolean][] = [
    [p1Start, p2Start, false],
    [p2Start, p3Start, false],
    [p3Start, p4Start, false],
    [p4Start, p4End, false],
    [p5Start, p6Start, false],
    [p6Start, p6End, false],
    [p7Start, p8Start, false],
    [p8Start, p8End, false],
    [p9Start, p10Start, false],
    [p10Start, p10End, false],
    [p11Start, p12Start, true],
    [p12Start, p12End, true],
    [p13Start, p14Start, true],
    [p14Start, p14End, true],
    [p15Start, p15End, true],
  ];

  // Respect explicit "Tiết X – Y" overrides if configured by staff
  const explicitCovered = new Set<number>();
  for (const sh of sortedShifts) {
    const explicit = parsePeriodRangeFromLabel(sh.periods_label) || parsePeriodRangeFromLabel(sh.label);
    if (!explicit) continue;
    const [sP, eP] = explicit;
    const count = eP - sP + 1;
    const totalDur = Math.max(20, sh.end - sh.start);
    const step = sh.start + (count - 1) * pMin < sh.end ? pMin : Math.max(15, Math.floor(totalDur / count));
    for (let k = 0; k < count; k++) {
      const idx = sP + k - 1;
      if (idx < 0 || idx >= 15) continue;
      const st = sh.start + k * step;
      const en = k === count - 1 ? Math.max(st + 15, sh.end) : Math.min(sh.end, st + step);
      schedule[idx] = [st, en, Boolean(sh.evening) || idx >= 10];
      explicitCovered.add(idx);
    }
  }

  // Keep Tiết 1–2 and Tiết 15 dynamically anchored if not explicitly overridden by a shift
  if (!explicitCovered.has(1)) {
    const t3Start = schedule[2][0];
    schedule[1] = [Math.max(0, t3Start - pMin), t3Start, false];
  }
  if (!explicitCovered.has(0)) {
    const t2Start = schedule[1][0];
    schedule[0] = [Math.max(0, t2Start - pMin), t2Start, false];
  }
  if (!explicitCovered.has(14)) {
    const t14End = schedule[13][1];
    const t15St = Math.min(1410, Math.max(t14End, schedule[13][0] + pMin));
    schedule[14] = [t15St, Math.min(1440, t15St + pMin), true];
  }

  return schedule.map(([st, en, eve], idx) => ({
    period: idx + 1,
    label: `Tiết ${idx + 1}`,
    start: st,
    end: Math.max(st + 15, en),
    clockLabel: clock(st),
    evening: eve,
  }));
}

export function mapEventToPeriods(
  event: { start: number; end: number; periods?: number },
  periodRows: PeriodRow[]
): MappedPeriodRange {
  const rows = periodRows.length ? periodRows : buildPeriodRows();

  // Find the canonical starting period whose start time best matches or contains event.start
  let bestIdx = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const dist = Math.abs(event.start - r.start);
    // Slight preference if event.start falls inside [r.start - 5, r.end - 10]
    const insideBonus = event.start >= r.start - 5 && event.start < r.end - 10 ? -8 : 0;
    const score = dist + insideBonus;
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  const startPeriod = rows[bestIdx].period;

  // If explicit academic period count is known (e.g., 2 tiết for LEC/TUT, 3 tiết for COMBINED),
  // use it directly so standard 2-period shifts map cleanly to Tiết 3–4, 5–6, 7–8, 9–10, 11–12.
  if (event.periods && Number.isFinite(event.periods) && event.periods >= 1) {
    const span = Math.max(1, Math.min(15 - startPeriod + 1, Math.round(event.periods)));
    return {
      startPeriod,
      endPeriod: startPeriod + span - 1,
      spanPeriods: span,
    };
  }

  const overlapping = rows.filter(
    (r) => r.period >= startPeriod && Math.min(event.end, r.end) - Math.max(event.start, r.start) >= 15
  );
  if (overlapping.length > 0) {
    const endPeriod = overlapping[overlapping.length - 1].period;
    return {
      startPeriod,
      endPeriod,
      spanPeriods: Math.max(1, endPeriod - startPeriod + 1),
    };
  }

  const estSpan = Math.max(
    1,
    Math.min(15 - startPeriod + 1, Math.round((event.end - event.start) / 55) || 2)
  );
  return {
    startPeriod,
    endPeriod: startPeriod + estSpan - 1,
    spanPeriods: estSpan,
  };
}

export function buildDayPeriodClusters<T extends { start: number; end: number; periods?: number; id: string }>(
  dayEvents: T[],
  periodRows: PeriodRow[],
  maxPeriod: number
): Map<number, { type: "cluster"; cluster: PeriodCluster<T> } | { type: "covered" }> {
  const mapped = dayEvents
    .map((ev) => {
      const range = mapEventToPeriods(ev, periodRows);
      return {
        ev,
        startPeriod: Math.max(1, range.startPeriod),
        endPeriod: Math.min(maxPeriod, range.endPeriod),
      };
    })
    .filter((item) => item.startPeriod <= maxPeriod && item.startPeriod <= item.endPeriod)
    .sort(
      (a, b) =>
        a.startPeriod - b.startPeriod ||
        b.endPeriod - a.endPeriod ||
        a.ev.start - b.ev.start ||
        a.ev.id.localeCompare(b.ev.id)
    );

  const clusters: PeriodCluster<T>[] = [];
  for (const item of mapped) {
    const last = clusters[clusters.length - 1];
    if (last && item.startPeriod <= last.endPeriod) {
      last.endPeriod = Math.max(last.endPeriod, item.endPeriod);
      last.rowSpan = last.endPeriod - last.startPeriod + 1;
      last.events.push(item.ev);
    } else {
      clusters.push({
        startPeriod: item.startPeriod,
        endPeriod: item.endPeriod,
        rowSpan: item.endPeriod - item.startPeriod + 1,
        events: [item.ev],
      });
    }
  }

  const cellMap = new Map<number, { type: "cluster"; cluster: PeriodCluster<T> } | { type: "covered" }>();
  for (const c of clusters) {
    cellMap.set(c.startPeriod, { type: "cluster", cluster: c });
    for (let p = c.startPeriod + 1; p <= c.endPeriod; p++) {
      cellMap.set(p, { type: "covered" });
    }
  }
  return cellMap;
}

export function getQldtBlockPalette(
  e: Event,
  colorRules?: ColorRule[]
): { bg: string; border: string; text: string; accent: string; note: string } {
  const rules = colorRules ?? [];
  const courseUp = (e.course || "").toUpperCase();
  const idUp = (e.id || "").toUpperCase();
  const kindUp = (e.kind || "").toUpperCase();
  const pType = getProgramType(e);
  const occ = e._occ;
  const isMakeup =
    occ?.status === "SHIFTED_NEXT_WEEK" ||
    occ?.status === "MAKEUP_EXTENSION" ||
    e.activity_type === "MAKEUP";

  const matched =
    rules.find(
      (r) =>
        r.category === "CUSTOM" &&
        r.key &&
        (courseUp.includes(r.key.toUpperCase()) || idUp.includes(r.key.toUpperCase()))
    ) ||
    (isMakeup
      ? rules.find((r) => r.category === "STATUS" && r.key.toUpperCase() === "MAKEUP")
      : undefined) ||
    rules.find((r) => r.category === "PROGRAM" && r.key.toUpperCase() === pType) ||
    (kindUp
      ? rules.find((r) => r.category === "KIND" && r.key.toUpperCase() === kindUp)
      : undefined);

  if (matched) {
    const bdr = matched.border_color || "#64748b";
    return {
      bg: matched.bg_color,
      border: bdr,
      text: matched.text_color,
      accent: bdr,
      note: matched.note || "",
    };
  }

  // Mặc định chuẩn: Xanh dương = Lý thuyết (LEC), Đỏ = Thực hành (TUT)
  if (kindUp === "TUT" || idUp.includes("-TUT-")) {
    return { bg: "#fce8ea", border: "#c53030", text: "#3b0d11", accent: "#c53030", note: "" };
  }
  return { bg: "#dceefb", border: "#2b6cb0", text: "#0f2942", accent: "#2b6cb0", note: "" };
}

export function getProgramType(e: Event): "CLC" | "TT" | "MME" | "STANDARD" {
  const course = (e.course || "").toUpperCase();
  const id = (e.id || "").toUpperCase();
  const sec = (e.section || "").toUpperCase();
  const prog = (e.program || "").toUpperCase();

  if (prog === "CLC" || course.includes("CLC") || id.includes("CLC") || sec.includes("CLC")) {
    return "CLC";
  }
  if (prog === "TT" || course.startsWith("66FIT") || sec.includes("TT")) {
    return "TT";
  }
  if (course.startsWith("61MME") || id.includes("MME") || e.department === "TTDPT") {
    return "MME";
  }
  return "STANDARD";
}

export const DEFAULT_COLOR_RULES: ColorRule[] = [
  { id: "kind-lec", category: "KIND", key: "LEC", label: "Lý thuyết (LEC)", bg_color: "#dceefb", border_color: "#2b6cb0", text_color: "#0f2942", note: "" },
  { id: "kind-tut", category: "KIND", key: "TUT", label: "Thực hành (TUT)", bg_color: "#fce8ea", border_color: "#c53030", text_color: "#3b0d11", note: "" },
  { id: "st-conflict", category: "STATUS", key: "CONFLICT", label: "Trùng lịch", bg_color: "#fee2e2", border_color: "#dc2626", text_color: "#7f1d1d", note: "" },
];

export function resolveRule(
  category: ColorRule["category"],
  key: string,
  customRules?: ColorRule[]
): ColorRule {
  const k = (key || "").toUpperCase();
  const found = (customRules ?? []).find(
    (r) => r.category === category && r.key.toUpperCase() === k
  );
  if (found) return found;
  const fallback = DEFAULT_COLOR_RULES.find(
    (r) => r.category === category && r.key.toUpperCase() === k
  );
  return (
    fallback ?? {
      id: `fallback-${category}-${k}`,
      category,
      key: k,
      label: key,
      bg_color: k === "TUT" ? "#fce8ea" : "#dceefb",
      border_color: k === "TUT" ? "#c53030" : "#2b6cb0",
      text_color: k === "TUT" ? "#3b0d11" : "#0f2942",
      note: "",
    }
  );
}

export function buildDraftEvents(state?: Workspace["state"]): Event[] {
  if (!state?.draft?.length || !state.sessions?.length || !state.config?.slots?.length) {
    return [];
  }
  const sessionMap = new Map(state.sessions.map((s) => [s.id, s]));
  const offeringMap = new Map(
    (state.offerings ?? []).map((o) => [o.id, o])
  );
  const courseNameMap = new Map(
    (state.offerings ?? []).map((o) => [o.course, o.name])
  );
  const cfg = state.config;
  const orderedShifts = [...(cfg.shift_rules ?? [])]
    .filter((sh) => sh.end > sh.start)
    .sort((a, b) => a.start - b.start);
  const result: Event[] = [];

  for (const p of state.draft) {
    const s = sessionMap.get(p.session);
    const slot = cfg.slots[p.slot];
    if (!s || !slot) continue;
    const off = s.offering ? offeringMap.get(s.offering) : undefined;
    const dur = calcShiftDuration(
      s.periods ?? 2,
      cfg.period_minutes ?? 50,
      cfg.break_minutes ?? 0,
      cfg.include_break ?? false
    );
    let computedEnd = slot.start + dur;
    const shIdx = orderedShifts.findIndex((sh) => sh.start === slot.start);
    if (shIdx >= 0) {
      if (s.kind === "COMBINED") {
        if (shIdx + 1 < orderedShifts.length && orderedShifts[shIdx + 1].end <= slot.end) {
          computedEnd = orderedShifts[shIdx + 1].end;
        }
      } else {
        computedEnd = orderedShifts[shIdx].end;
      }
    }
    result.push({
      id: s.id,
      offering: s.offering,
      course: s.course,
      course_name: off?.name || courseNameMap.get(s.course) || "",
      cohort: s.cohort,
      section: s.section,
      kind: s.kind,
      periods: s.periods,
      program: s.program,
      department: s.department,
      students: s.students,
      teacher: s.teacher ?? undefined,
      room: s.room,
      room_id: p.room_id ?? undefined,
      day: slot.day,
      start: slot.start,
      end: computedEnd,
      evening: slot.evening,
      start_date: s.start_date || off?.start_date || "",
      end_date: s.end_date || off?.end_date || "",
    });
  }
  return result;
}
