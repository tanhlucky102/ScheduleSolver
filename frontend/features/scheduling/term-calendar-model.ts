import { clock } from "../shared/time";
import type { Event, ColorRule, ShiftRule } from "./term-calendar-types";
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
  { id: "prog-clc", category: "PROGRAM", key: "CLC", label: "Hệ Chất lượng cao (CLC)", bg_color: "#dbeafe", border_color: "#93c5fd", text_color: "#1e3a8a", note: "Ưu tiên phòng máy lạnh, sĩ số chuẩn" },
  { id: "prog-tt", category: "PROGRAM", key: "TT", label: "Hệ Tiên tiến (TT / 66FIT)", bg_color: "#d1fae5", border_color: "#6ee7b7", text_color: "#065f46", note: "Giảng dạy 100% tiếng Anh" },
  { id: "prog-mme", category: "PROGRAM", key: "MME", label: "Truyền thông ĐPT (MME)", bg_color: "#ffedd5", border_color: "#fed7aa", text_color: "#7c2d12", note: "Cần phòng đồ họa cấu hình cao" },
  { id: "prog-std", category: "PROGRAM", key: "STANDARD", label: "Hệ Đại trà tiêu chuẩn", bg_color: "#ffffff", border_color: "#cbd5e1", text_color: "#0f172a", note: "Chương trình chuẩn Khoa CNTT" },
  { id: "kind-lec", category: "KIND", key: "LEC", label: "Buổi Lý thuyết (LEC)", bg_color: "#e0e7ff", border_color: "#a5b4fc", text_color: "#3730a3", note: "Phòng máy chiếu sức chứa lớn" },
  { id: "kind-tut", category: "KIND", key: "TUT", label: "Buổi Thực hành (TUT)", bg_color: "#fce7f3", border_color: "#f9a8d4", text_color: "#9d174d", note: "Phòng máy tính chia nhóm nhỏ" },
  { id: "kind-comb", category: "KIND", key: "COMBINED", label: "Buổi Gộp LT + TH", bg_color: "#ede9fe", border_color: "#c4b5fd", text_color: "#5b21b6", note: "Học liền mạch Lý thuyết & Thực hành" },
  { id: "st-evening", category: "STATUS", key: "EVENING", label: "Thời khóa biểu tối", bg_color: "#e0f2fe", border_color: "#38bdf8", text_color: "#0369a1", note: "Ca học từ sau 16:55" },
  { id: "st-makeup", category: "STATUS", key: "MAKEUP", label: "Lịch Dạy bù", bg_color: "#f3e8ff", border_color: "#c084fc", text_color: "#6b21a8", note: "Buổi dạy bù nghỉ lễ / công tác" },
  { id: "st-study", category: "STATUS", key: "STUDYING", label: "Lịch Đi học / NCS", bg_color: "#dcfce7", border_color: "#86efac", text_color: "#166534", note: "Giảng viên đi học cao học / NCS / bồi dưỡng" },
  { id: "st-conflict", category: "STATUS", key: "CONFLICT", label: "Cảnh báo Trùng lịch", bg_color: "#fef3c7", border_color: "#f59e0b", text_color: "#92400e", note: "Cần điều chỉnh ngay để tránh đụng giờ" },
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
      bg_color: "#ffffff",
      border_color: "#cbd5e1",
      text_color: "#0f172a",
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
  const result: Event[] = [];

  for (const p of state.draft) {
    const s = sessionMap.get(p.session);
    const slot = cfg.slots[p.slot];
    if (!s || !slot) continue;
    const off = s.offering ? offeringMap.get(s.offering) : undefined;
    const dur = calcShiftDuration(
      s.periods ?? 2,
      cfg.period_minutes ?? 50,
      cfg.break_minutes ?? 10,
      cfg.include_break ?? true
    );
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
      end: slot.start + dur,
      evening: slot.evening,
      start_date: s.start_date || off?.start_date || "",
      end_date: s.end_date || off?.end_date || "",
    });
  }
  return result;
}
