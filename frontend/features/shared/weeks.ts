import type { HolidayRule } from "../catalog/types";

export type AcademicWeek = {
  weekNumber: number;
  startIso: string; // YYYY-MM-DD (Monday)
  endIso: string;   // YYYY-MM-DD (Sunday)
  label: string;    // Tuần 15 [từ ngày 09/11/2026 đến ngày 15/11/2026]
};

export type WeekOccurrenceStatus =
  | "NORMAL"
  | "HOLIDAY_OFF"
  | "SHIFTED_NEXT_WEEK"
  | "MAKEUP_EXTENSION"
  | "OUT_OF_RANGE";

export type WeekOccurrenceInfo = {
  visible: boolean;
  status: WeekOccurrenceStatus;
  holidayName: string;
  makeupNextDate: string;
  shiftedFromDate: string;
  sessionNumber: number | null;
  totalSessions: number | null;
  effectiveStartDate: string;
  effectiveEndDate: string;
  extraWeeks: number;
};

export const DEFAULT_HANU_HOLIDAYS: HolidayRule[] = [
  {
    id: "HOL-0902",
    name: "Nghỉ Lễ Quốc khánh 2/9",
    start_date: "2026-08-31",
    end_date: "2026-09-02",
  },
  {
    id: "HOL-1120",
    name: "Kỷ niệm Ngày Nhà giáo Việt Nam 20/11",
    start_date: "2026-11-20",
    end_date: "2026-11-20",
  },
  {
    id: "HOL-1124",
    name: "Nghỉ Lễ Ngày Văn hóa Việt Nam 24/11",
    start_date: "2026-11-24",
    end_date: "2026-11-24",
  },
  {
    id: "HOL-0101",
    name: "Nghỉ Tết Dương lịch",
    start_date: "2027-01-01",
    end_date: "2027-01-01",
  },
];

function parseIsoParts(iso?: string): [number, number, number] | null {
  if (!iso || iso.length < 10) return null;
  const parts = iso.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

function toUtcDate(iso: string): Date | null {
  const p = parseIsoParts(iso);
  if (!p) return null;
  return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
}

function formatUtcIso(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateVN(iso?: string): string {
  const p = parseIsoParts(iso);
  if (!p) return iso || "";
  return `${String(p[2]).padStart(2, "0")}/${String(p[1]).padStart(2, "0")}/${p[0]}`;
}

export function formatShortDateVN(iso?: string): string {
  const p = parseIsoParts(iso);
  if (!p) return "";
  return `${String(p[2]).padStart(2, "0")}/${String(p[1]).padStart(2, "0")}`;
}

export function addDaysIso(mondayIso: string, offsetDays: number): string {
  const base = toUtcDate(mondayIso);
  if (!base) return "";
  const next = new Date(base.getTime() + offsetDays * 86_400_000);
  return formatUtcIso(next);
}

export function dayHeaderWithDate(day: number, weekStartIso?: string): string {
  const baseName = day === 8 ? "Chủ nhật" : `Thứ ${day}`;
  if (!weekStartIso || weekStartIso === "all") return baseName;
  const dIso = addDaysIso(weekStartIso, day - 2);
  const short = formatShortDateVN(dIso);
  return short ? `${baseName} (${short})` : baseName;
}

export function findHolidayOnDate(isoDate?: string, holidays: HolidayRule[] = []): HolidayRule | null {
  if (!isoDate || isoDate.length < 10 || !holidays.length) return null;
  const d = isoDate.slice(0, 10);
  for (const h of holidays) {
    if (h.start_date && h.end_date && h.start_date.slice(0, 10) <= d && d <= h.end_date.slice(0, 10)) {
      return h;
    }
  }
  return null;
}

export function getHolidaysInWeek(week: AcademicWeek, holidays: HolidayRule[] = []): HolidayRule[] {
  if (!holidays.length) return [];
  const hits: HolidayRule[] = [];
  for (const h of holidays) {
    const s = h.start_date?.slice(0, 10) || "";
    const e = h.end_date?.slice(0, 10) || "";
    if (s && e && s <= week.endIso && week.startIso <= e) {
      hits.push(h);
    }
  }
  return hits;
}

export function buildAcademicWeeks(
  termStartDate = "2026-08-03",
  termEndDate = "2027-01-03"
): AcademicWeek[] {
  const rawStart = toUtcDate(termStartDate) ?? new Date(Date.UTC(2026, 7, 3));
  const dow = rawStart.getUTCDay(); // 0=Sun, 1=Mon...
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const firstMonday = new Date(rawStart.getTime() + diffToMon * 86_400_000);

  const rawEnd = toUtcDate(termEndDate) ?? new Date(firstMonday.getTime() + 21 * 7 * 86_400_000);
  const weeks: AcademicWeek[] = [];

  for (let i = 0; i < 40; i++) {
    const mon = new Date(firstMonday.getTime() + i * 7 * 86_400_000);
    if (i > 0 && mon.getTime() > rawEnd.getTime()) break;
    const sun = new Date(mon.getTime() + 6 * 86_400_000);
    const startIso = formatUtcIso(mon);
    const endIso = formatUtcIso(sun);
    const weekNumber = i + 1;
    weeks.push({
      weekNumber,
      startIso,
      endIso,
      label: `Tuần ${weekNumber} [từ ngày ${formatDateVN(startIso)} đến ngày ${formatDateVN(endIso)}]`,
    });
  }
  return weeks;
}

export function findCurrentOrDefaultWeek(weeks: AcademicWeek[]): string {
  if (!weeks.length) return "all";
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const hit = weeks.find((w) => w.startIso <= todayIso && todayIso <= w.endIso);
  if (hit) return hit.startIso;
  return "all";
}

function jsUtcDayForHanuDay(day: number): number {
  // HANU day: 2=Mon..7=Sat, 8=Sun -> UTC getUTCDay: 1=Mon..6=Sat, 0=Sun
  return day === 8 ? 0 : day - 1;
}

export function evaluateWeekOccurrence(
  item: { day: number; start_date?: string; end_date?: string; activity_type?: string },
  weekStartIso: string,
  holidays: HolidayRule[] = []
): WeekOccurrenceInfo {
  const sdRaw = (item.start_date || "").slice(0, 10);
  const edRaw = (item.end_date || "").slice(0, 10);
  const actUp = (item.activity_type || "").toUpperCase();
  const isSingleMakeup = actUp === "MAKEUP" && Boolean(sdRaw) && sdRaw === edRaw;
  const isAllWeeks = !weekStartIso || weekStartIso === "all";
  const targetIso = isAllWeeks ? "" : addDaysIso(weekStartIso, item.day - 2);

  const sdDt = sdRaw ? toUtcDate(sdRaw) : null;
  const edDt = edRaw ? toUtcDate(edRaw) : null;

  if (sdDt && edDt && sdDt.getTime() <= edDt.getTime()) {
    const targetDow = jsUtcDayForHanuDay(item.day);
    const offset = (targetDow - sdDt.getUTCDay() + 7) % 7;
    const firstOcc = new Date(sdDt.getTime() + offset * 86_400_000);
    if (firstOcc.getTime() > edDt.getTime()) {
      return {
        visible: false,
        status: "OUT_OF_RANGE",
        holidayName: "",
        makeupNextDate: "",
        shiftedFromDate: "",
        sessionNumber: null,
        totalSessions: 0,
        effectiveStartDate: sdRaw,
        effectiveEndDate: edRaw,
        extraWeeks: 0,
      };
    }

    const baseSessions = Math.floor((edDt.getTime() - firstOcc.getTime()) / (7 * 86_400_000)) + 1;
    type TimelineRow = {
      date: string;
      status: WeekOccurrenceStatus;
      holidayName: string;
      shiftedFromDate: string;
      makeupNextDate: string;
      sessionNumber: number | null;
    };
    const timeline: TimelineRow[] = [];
    let completed = 0;
    let pendingHolidays: { date: string; name: string }[] = [];
    const skippedNames: string[] = [];
    let curMs = firstOcc.getTime();

    for (let step = 0; step < 104 && completed < baseSessions; step++) {
      const curIso = formatUtcIso(new Date(curMs));
      const hit = isSingleMakeup ? null : findHolidayOnDate(curIso, holidays);
      if (hit) {
        pendingHolidays.push({ date: curIso, name: hit.name });
        if (!skippedNames.includes(hit.name)) skippedNames.push(hit.name);
        timeline.push({
          date: curIso,
          status: "HOLIDAY_OFF",
          holidayName: hit.name,
          shiftedFromDate: "",
          makeupNextDate: "",
          sessionNumber: null,
        });
      } else {
        completed += 1;
        let st: WeekOccurrenceStatus = "NORMAL";
        let hNames = "";
        let fromDt = "";
        if (pendingHolidays.length > 0) {
          hNames = Array.from(new Set(pendingHolidays.map((x) => x.name))).join(", ");
          fromDt = pendingHolidays[0].date;
          pendingHolidays = [];
          st = "SHIFTED_NEXT_WEEK";
        } else if (curMs > edDt.getTime() && skippedNames.length > 0) {
          hNames = skippedNames.join(", ");
          st = "MAKEUP_EXTENSION";
        }
        timeline.push({
          date: curIso,
          status: st,
          holidayName: hNames,
          shiftedFromDate: fromDt,
          makeupNextDate: "",
          sessionNumber: completed,
        });
      }
      curMs += 7 * 86_400_000;
    }

    let nextTeaching = "";
    for (let i = timeline.length - 1; i >= 0; i--) {
      if (timeline[i].status !== "HOLIDAY_OFF") {
        nextTeaching = timeline[i].date;
      } else {
        timeline[i].makeupNextDate = nextTeaching;
      }
    }

    const teachingRows = timeline.filter((r) => r.status !== "HOLIDAY_OFF");
    const effStart = teachingRows.length ? teachingRows[0].date : formatUtcIso(firstOcc);
    const effEnd = teachingRows.length ? teachingRows[teachingRows.length - 1].date : edRaw;
    const extraWeeks = timeline.filter((r) => r.status === "HOLIDAY_OFF").length;

    if (isAllWeeks) {
      return {
        visible: true,
        status: "NORMAL",
        holidayName: skippedNames.join(", "),
        makeupNextDate: "",
        shiftedFromDate: "",
        sessionNumber: null,
        totalSessions: baseSessions,
        effectiveStartDate: effStart,
        effectiveEndDate: effEnd,
        extraWeeks,
      };
    }

    const matched = timeline.find((r) => r.date === targetIso);
    if (!matched) {
      return {
        visible: false,
        status: "OUT_OF_RANGE",
        holidayName: "",
        makeupNextDate: "",
        shiftedFromDate: "",
        sessionNumber: null,
        totalSessions: baseSessions,
        effectiveStartDate: effStart,
        effectiveEndDate: effEnd,
        extraWeeks,
      };
    }

    return {
      visible: true,
      status: matched.status,
      holidayName: matched.holidayName,
      makeupNextDate: matched.makeupNextDate,
      shiftedFromDate: matched.shiftedFromDate,
      sessionNumber: matched.sessionNumber,
      totalSessions: baseSessions,
      effectiveStartDate: effStart,
      effectiveEndDate: effEnd,
      extraWeeks,
    };
  }

  // Open-ended or single-bound items
  if (!isAllWeeks && targetIso) {
    if (sdRaw && targetIso < sdRaw) {
      return {
        visible: false,
        status: "OUT_OF_RANGE",
        holidayName: "",
        makeupNextDate: "",
        shiftedFromDate: "",
        sessionNumber: null,
        totalSessions: null,
        effectiveStartDate: sdRaw,
        effectiveEndDate: edRaw,
        extraWeeks: 0,
      };
    }
    if (edRaw && targetIso > edRaw) {
      return {
        visible: false,
        status: "OUT_OF_RANGE",
        holidayName: "",
        makeupNextDate: "",
        shiftedFromDate: "",
        sessionNumber: null,
        totalSessions: null,
        effectiveStartDate: sdRaw,
        effectiveEndDate: edRaw,
        extraWeeks: 0,
      };
    }
    const hitNow = isSingleMakeup ? null : findHolidayOnDate(targetIso, holidays);
    if (hitNow) {
      let probeIso = addDaysIso(targetIso, 7);
      for (let k = 0; k < 12; k++) {
        if (!findHolidayOnDate(probeIso, holidays)) break;
        probeIso = addDaysIso(probeIso, 7);
      }
      return {
        visible: true,
        status: "HOLIDAY_OFF",
        holidayName: hitNow.name,
        makeupNextDate: probeIso,
        shiftedFromDate: "",
        sessionNumber: null,
        totalSessions: null,
        effectiveStartDate: sdRaw,
        effectiveEndDate: edRaw,
        extraWeeks: 1,
      };
    }
    const prevIso = addDaysIso(targetIso, -7);
    if (!sdRaw || prevIso >= sdRaw) {
      const hitPrev = isSingleMakeup ? null : findHolidayOnDate(prevIso, holidays);
      if (hitPrev) {
        return {
          visible: true,
          status: "SHIFTED_NEXT_WEEK",
          holidayName: hitPrev.name,
          makeupNextDate: "",
          shiftedFromDate: prevIso,
          sessionNumber: null,
          totalSessions: null,
          effectiveStartDate: sdRaw,
          effectiveEndDate: edRaw,
          extraWeeks: 1,
        };
      }
    }
  }

  return {
    visible: true,
    status: "NORMAL",
    holidayName: "",
    makeupNextDate: "",
    shiftedFromDate: "",
    sessionNumber: null,
    totalSessions: null,
    effectiveStartDate: sdRaw,
    effectiveEndDate: edRaw,
    extraWeeks: 0,
  };
}

export function isEventActiveInWeek(
  item: { day: number; start_date?: string; end_date?: string; activity_type?: string },
  weekStartIso: string,
  holidays: HolidayRule[] = []
): boolean {
  return evaluateWeekOccurrence(item, weekStartIso, holidays).visible;
}
