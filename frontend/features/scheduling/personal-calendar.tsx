"use client";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Icon, Spinner, ActionButton } from "../shared/ui";
import { clock } from "../shared/time";
import {
  DEFAULT_HANU_HOLIDAYS,
  addDaysIso,
  buildAcademicWeeks,
  dayHeaderWithDate,
  evaluateWeekOccurrence,
  findCurrentOrDefaultWeek,
  findHolidayOnDate,
  formatDateVN,
  formatShortDateVN,
  getHolidaysInWeek,
  type WeekOccurrenceInfo,
} from "../shared/weeks";
import {
  buildDayPeriodClusters,
  buildPeriodRows,
  mapEventToPeriods,
  resolveRule,
} from "./term-calendar-model";
import { exportTeacherWorkbook } from "../workspace/api-client";
import type { CalendarEvent } from "../workspace/ui-types";
import type { ColorRule, HolidayRule, ShiftRule } from "../catalog/types";
import type { PeriodConfigInput } from "./term-calendar-types";

type RichPersonalEvent = CalendarEvent & {
  isExternal: boolean;
  _occ: WeekOccurrenceInfo;
  course_name?: string;
  section?: string;
  cohort?: string;
  kind?: string;
  periods?: number;
};

const overlaps = (a: CalendarEvent, b: CalendarEvent) => {
  if (a.day !== b.day || !(a.start < b.end && b.start < a.end)) return false;
  if (a.start_date && a.end_date && b.start_date && b.end_date) {
    return a.start_date <= b.end_date && b.start_date <= a.end_date;
  }
  return true;
};

const DEFAULT_ACTIVITY_LABELS: Record<string, string> = {
  EXTERNAL_TEACHING: "Dạy trường ngoài",
  STUDYING: "Đi học / NCS",
  MAKEUP: "Dạy bù",
  PERSONAL_BUSY: "Lịch bận cá nhân",
};

function downloadPersonalCsv(filename: string, rows: string[][]) {
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PersonalCalendar({
  published,
  external,
  colorRules = [],
  shiftRules = [],
  periodConfig,
  termConfig,
  apiUrl = "http://localhost:8000",
  token = null,
  busy = false,
  onOpenExternalTab,
}: {
  published: CalendarEvent[];
  external: CalendarEvent[];
  colorRules?: ColorRule[];
  shiftRules?: ShiftRule[];
  periodConfig?: PeriodConfigInput;
  termConfig?: { term_name?: string; term_start_date?: string; term_end_date?: string; holidays?: HolidayRule[] };
  apiUrl?: string;
  token?: string | null;
  busy?: boolean;
  onOpenExternalTab?: () => void;
}) {
  const [view, setView] = useState<"week" | "semester">("week");
  const [source, setSource] = useState<"all" | "faculty" | "external">("all");
  const [showEvening, setShowEvening] = useState(true);
  const [exporting, setExporting] = useState(false);

  const termName = termConfig?.term_name || "Học kỳ 1 - Năm học 2026 - 2027";
  const termStartIso = termConfig?.term_start_date || "2026-08-03";
  const termEndIso = termConfig?.term_end_date || "2027-01-03";
  const termRange = useMemo(() => ({ termStartIso, termEndIso }), [termStartIso, termEndIso]);

  const holidays = useMemo(() => termConfig?.holidays ?? DEFAULT_HANU_HOLIDAYS, [termConfig?.holidays]);
  const weeks = useMemo(
    () => buildAcademicWeeks(termStartIso, termEndIso),
    [termStartIso, termEndIso]
  );

  const [selectedWeek, setSelectedWeek] = useState<string>(() => findCurrentOrDefaultWeek(weeks));
  useEffect(() => {
    if (selectedWeek !== "all" && !weeks.some((w) => w.startIso === selectedWeek)) {
      setSelectedWeek(findCurrentOrDefaultWeek(weeks));
    }
  }, [weeks, selectedWeek]);

  const currentWeekIdx = weeks.findIndex((w) => w.startIso === selectedWeek);
  const activeWeekObj = currentWeekIdx >= 0 ? weeks[currentWeekIdx] : undefined;

  const periodRows = useMemo(
    () => buildPeriodRows(shiftRules, periodConfig),
    [shiftRules, periodConfig]
  );
  const maxVisiblePeriod = showEvening ? 15 : 10;
  const visiblePeriodRows = useMemo(
    () => periodRows.filter((r) => r.period <= maxVisiblePeriod),
    [periodRows, maxVisiblePeriod]
  );

  const weekKeyForEval = view === "semester" ? "all" : selectedWeek;

  const events: RichPersonalEvent[] = useMemo(() => {
    const merged = [
      ...(source === "external" ? [] : published.map((e) => ({ ...e, isExternal: false }))),
      ...(source === "faculty" ? [] : external.map((e) => ({ ...e, isExternal: true }))),
    ];
    return merged
      .map((e) => ({
        ...e,
        _occ: evaluateWeekOccurrence(e, weekKeyForEval, holidays, termRange),
      }))
      .filter((e) => e._occ.visible)
      .sort((a, b) => a.day - b.day || a.start - b.start || a.id.localeCompare(b.id));
  }, [published, external, source, weekKeyForEval, holidays, termRange]);

  const isConflict = (e: CalendarEvent) =>
    external.some((x) => x.id === e.id) && published.some((p) => overlaps(p, e));

  const findStatusRule = (key: string): ColorRule | undefined =>
    colorRules.find((r) => r.category === "STATUS" && r.key.toUpperCase() === key.toUpperCase());

  const getActivityLabel = (actType?: string) => {
    const key = (actType || "EXTERNAL_TEACHING").toUpperCase();
    const customStatus = findStatusRule(key);
    if (customStatus?.label) return customStatus.label;
    return DEFAULT_ACTIVITY_LABELS[key] || actType || "Lịch ngoài";
  };

  const findCustomMatch = (e: RichPersonalEvent): ColorRule | undefined => {
    const courseUp = (e.course || "").toUpperCase();
    const idUp = (e.id || "").toUpperCase();
    const instUp = (e.institution || "").toUpperCase();
    const kindUp =
      (e.kind || "").toUpperCase() ||
      (idUp.includes("-LEC-")
        ? "LEC"
        : idUp.includes("-TUT-")
        ? "TUT"
        : idUp.includes("-COMBINED-")
        ? "COMBINED"
        : "");

    return (
      colorRules.find(
        (r) =>
          r.category === "CUSTOM" &&
          r.key &&
          (courseUp.includes(r.key.toUpperCase()) || idUp.includes(r.key.toUpperCase()))
      ) ||
      (instUp
        ? colorRules.find(
            (r) => r.category === "INSTITUTION" && r.key && instUp.includes(r.key.toUpperCase())
          )
        : undefined) ||
      (kindUp
        ? colorRules.find((r) => r.category === "KIND" && r.key.toUpperCase() === kindUp)
        : undefined) ||
      colorRules.find(
        (r) =>
          r.category === "PROGRAM" &&
          r.key &&
          (courseUp.includes(r.key.toUpperCase()) || (e.program || "").toUpperCase() === r.key.toUpperCase())
      )
    );
  };

  const getEventStyle = (e: RichPersonalEvent) => {
    const occ = e._occ;
    if (isConflict(e)) {
      const cRule = findStatusRule("CONFLICT") ?? resolveRule("STATUS", "CONFLICT", colorRules);
      return {
        bg: cRule.bg_color || "#fee2e2",
        border: "#dc2626",
        text: cRule.text_color || "#7f1d1d",
        accent: "#dc2626",
        ruleNote: cRule.note || "",
        ruleLabel: cRule.label || "",
      };
    }

    const matched = findCustomMatch(e);
    if (matched) {
      const bdr = matched.border_color || "#475569";
      return {
        bg: matched.bg_color,
        border: bdr,
        text: matched.text_color,
        accent: bdr,
        ruleNote: matched.note || "",
        ruleLabel: matched.label || "",
      };
    }

    if (e.isExternal) {
      const actKey = (e.activity_type || "EXTERNAL_TEACHING").toUpperCase();
      const customStatus = findStatusRule(actKey);
      if (customStatus) {
        const bdr = customStatus.border_color || "#475569";
        return {
          bg: customStatus.bg_color,
          border: bdr,
          text: customStatus.text_color,
          accent: bdr,
          ruleNote: customStatus.note || "",
          ruleLabel: customStatus.label || "",
        };
      }
    } else {
      if (occ.status === "SHIFTED_NEXT_WEEK" || occ.status === "MAKEUP_EXTENSION") {
        const makeupStatus = findStatusRule("MAKEUP");
        if (makeupStatus) {
          const bdr = makeupStatus.border_color || "#7c3aed";
          return {
            bg: makeupStatus.bg_color,
            border: bdr,
            text: makeupStatus.text_color,
            accent: bdr,
            ruleNote: makeupStatus.note || "",
            ruleLabel: makeupStatus.label || "",
          };
        }
      }
      const facRule = findStatusRule("FACULTY");
      if (facRule) {
        const bdr = facRule.border_color || "#2b6cb0";
        return {
          bg: facRule.bg_color,
          border: bdr,
          text: facRule.text_color,
          accent: bdr,
          ruleNote: facRule.note || "",
          ruleLabel: facRule.label || "",
        };
      }
    }

    // Mặc định hệ thống: chỉ Xanh dương = Lý thuyết (LEC), Đỏ = Thực hành (TUT)
    const idUp = (e.id || "").toUpperCase();
    if ((e.kind || "").toUpperCase() === "TUT" || idUp.includes("-TUT-")) {
      return {
        bg: "#fce8ea",
        border: "#c53030",
        text: "#3b0d11",
        accent: "#c53030",
        ruleNote: "",
        ruleLabel: "",
      };
    }
    return {
      bg: "#dceefb",
      border: "#2b6cb0",
      text: "#0f2942",
      accent: "#2b6cb0",
      ruleNote: "",
      ruleLabel: "",
    };
  };

  const hasAnyConflict = useMemo(
    () => events.some((ev) => isConflict(ev)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, published, external]
  );

  const legendItems = useMemo(() => {
    const lecRule = colorRules.find((r) => r.category === "KIND" && r.key.toUpperCase() === "LEC");
    const tutRule = colorRules.find((r) => r.category === "KIND" && r.key.toUpperCase() === "TUT");
    const items: { id: string; label: string; bg: string; border: string; note?: string }[] = [
      {
        id: "default-lec",
        label: lecRule?.label || "Lý thuyết (LEC)",
        bg: lecRule?.bg_color || "#dceefb",
        border: lecRule?.border_color || "#2b6cb0",
        note: lecRule?.note || "",
      },
      {
        id: "default-tut",
        label: tutRule?.label || "Thực hành (TUT)",
        bg: tutRule?.bg_color || "#fce8ea",
        border: tutRule?.border_color || "#c53030",
        note: tutRule?.note || "",
      },
    ];

    for (const r of colorRules) {
      if (r.category === "KIND" && (r.key.toUpperCase() === "LEC" || r.key.toUpperCase() === "TUT")) {
        continue;
      }
      items.push({
        id: r.id,
        label: r.label || r.key,
        bg: r.bg_color,
        border: r.border_color || "#475569",
        note: r.note || "",
      });
    }

    if (hasAnyConflict && !colorRules.some((r) => r.category === "STATUS" && r.key.toUpperCase() === "CONFLICT")) {
      items.push({
        id: "conflict-alert",
        label: "Trùng lịch",
        bg: "#fee2e2",
        border: "#dc2626",
        note: "Cảnh báo đụng giờ với lịch Khoa",
      });
    }

    return items;
  }, [colorRules, hasAnyConflict]);

  const weekDays = [2, 3, 4, 5, 6, 7, 8];

  const dayClusterMaps = useMemo(() => {
    const byDay = new Map<
      number,
      ReturnType<typeof buildDayPeriodClusters<RichPersonalEvent>>
    >();
    for (const d of weekDays) {
      const dayEvs = events.filter((e) => e.day === d);
      byDay.set(d, buildDayPeriodClusters(dayEvs, periodRows, maxVisiblePeriod));
    }
    return byDay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, periodRows, maxVisiblePeriod]);

  const [slotModal, setSlotModal] = useState<{
    day: number;
    periodLabel: string;
    items: RichPersonalEvent[];
  } | null>(null);

  const handlePrevWeek = () => {
    if (!weeks.length) return;
    if (selectedWeek === "all") setSelectedWeek(weeks[0].startIso);
    else if (currentWeekIdx > 0) setSelectedWeek(weeks[currentWeekIdx - 1].startIso);
  };

  const handleNextWeek = () => {
    if (!weeks.length) return;
    if (selectedWeek === "all") setSelectedWeek(weeks[0].startIso);
    else if (currentWeekIdx >= 0 && currentWeekIdx < weeks.length - 1) {
      setSelectedWeek(weeks[currentWeekIdx + 1].startIso);
    }
  };

  const handleExportPersonal = async () => {
    if (exporting || (published.length === 0 && external.length === 0)) return;
    setExporting(true);
    try {
      if (token) {
        const blob = await exportTeacherWorkbook(apiUrl, token, {
          weekStart: weekKeyForEval,
          weekLabel: activeWeekObj?.label || termName,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = activeWeekObj
          ? `TKB-CaNhan-Tuan${activeWeekObj.weekNumber}-${activeWeekObj.startIso}.xlsx`
          : `TKB-CaNhan-HocKy.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const header = [
        "Mã MH / Hoạt động",
        "Đơn vị / Tên môn",
        "Lớp / Nhóm",
        "Phân loại",
        "Thứ",
        "Tiết BĐ",
        "Số tiết",
        "Khung giờ",
        "Phòng",
        "Từ ngày",
        "Đến ngày",
      ];
      const rows = events.map((ev) => {
        const mp = mapEventToPeriods(ev, periodRows);
        return [
          ev.course || ev.id,
          ev.isExternal ? ev.institution || "Ngoài khoa" : ev.course_name || "Khoa CNTT",
          ev.class_name || ev.section || ev.id,
          ev.isExternal ? getActivityLabel(ev.activity_type) : "Lịch khoa",
          ev.day === 8 ? "CN" : String(ev.day),
          String(mp.startPeriod),
          String(mp.spanPeriods),
          `${clock(ev.start)} - ${clock(ev.end)}`,
          ev.room_id || ev.room || "",
          formatDateVN(ev._occ.effectiveStartDate),
          formatDateVN(ev._occ.effectiveEndDate),
        ];
      });
      downloadPersonalCsv("TKB-CaNhan.csv", [header, ...rows]);
    } finally {
      setExporting(false);
    }
  };

  const renderPersonalBlock = (ev: RichPersonalEvent) => {
    const st = getEventStyle(ev);
    const occ = ev._occ;
    const isHolOff = occ.status === "HOLIDAY_OFF";
    const isMakeup = occ.status === "SHIFTED_NEXT_WEEK" || occ.status === "MAKEUP_EXTENSION";
    const hasConflict = isConflict(ev) && !isHolOff;
    const effStart = occ.effectiveStartDate || termStartIso;
    const effEnd = occ.effectiveEndDate || termEndIso;

    const titleText = ev.course_name
      ? `${ev.course_name} (${ev.course || ev.id})`
      : ev.course || ev.id;

    const groupText = ev.isExternal
      ? `${getActivityLabel(ev.activity_type)}${ev.institution ? ` · ${ev.institution}` : ""}`
      : [ev.section || ev.class_name || ev.id, ev.cohort ? `${ev.cohort}` : ""].filter(Boolean).join(".");

    const tooltip = [
      titleText,
      ev.isExternal ? `Đơn vị: ${ev.institution || "Ngoài khoa"}` : "Đơn vị: Khoa CNTT",
      `Lớp / Nhóm: ${ev.class_name || ev.section || ev.id}`,
      `Phòng: ${ev.room_id || ev.room || "Chưa gán"}`,
      `Khung giờ: ${clock(ev.start)} → ${clock(ev.end)}`,
      `Thời gian học: ${formatDateVN(effStart)} → ${formatDateVN(effEnd)}`,
      isHolOff ? `Nghỉ lễ ${occ.holidayName} → Bù ${formatDateVN(occ.makeupNextDate)}` : "",
      isMakeup ? `Buổi học bù lễ ${occ.holidayName}` : "",
      hasConflict ? "Cảnh báo: Trùng giờ với lịch giảng dạy chính khóa tại Khoa!" : "",
      ev.note || st.ruleNote ? `Ghi chú: ${[ev.note, st.ruleNote].filter(Boolean).join(" · ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return (
      <div
        key={ev.id}
        title={tooltip}
        className="qldt-course-block"
        style={{
          background: st.bg,
          borderColor: st.border,
          borderWidth: hasConflict ? "2px" : "1.5px",
          borderStyle: isHolOff ? "dashed" : "solid",
          color: st.text,
          cursor: "default",
        }}
      >
        <div className="qldt-course-title">{titleText}</div>
        <div className="qldt-course-meta">
          <strong>{ev.isExternal ? "Loại:" : "Nhóm:"}</strong> {groupText}
        </div>
        <div className="qldt-course-meta">
          <strong>Phòng:</strong> {ev.room_id || ev.room || "Chưa gán"}
        </div>
        {st.ruleNote && (
          <div className="qldt-course-meta" style={{ fontStyle: "italic", fontWeight: 500 }}>
            📌 {st.ruleNote}
          </div>
        )}
        {ev.note && ev.note !== st.ruleNote && (
          <div className="qldt-course-meta" style={{ fontStyle: "italic" }}>
            {ev.note}
          </div>
        )}

        {hasConflict && (
          <span
            className="qldt-status-pill"
            style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #f87171" }}
          >
            Trùng lịch khoa
          </span>
        )}
        {isHolOff && (
          <span
            className="qldt-status-pill"
            style={{ background: "#ffe4e6", color: "#9f1239", border: "1px solid #fda4af" }}
          >
            Nghỉ lễ · Bù {formatShortDateVN(occ.makeupNextDate)}
          </span>
        )}
        {isMakeup && (
          <span
            className="qldt-status-pill"
            style={{ background: "#f3e8ff", color: "#6d28d9", border: "1px solid #d8b4fe" }}
          >
            Dạy bù lễ
          </span>
        )}

        <div className="qldt-course-time">
          <span style={{ color: st.accent, display: "inline-flex", alignItems: "center" }}>
            <Icon name="clock" size={12} />
          </span>
          <span>
            {clock(ev.start)} → {clock(ev.end)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section className="card qldt-card personal-calendar">
      {/* Row 1: Term Badge · Source Select · View Tabs (Tuần / Học kỳ) · Print & Excel */}
      <div className="qldt-toolbar">
        <div className="qldt-toolbar-row">
          <div className="qldt-toolbar-group">
            <span className="qldt-term-badge">
              <Icon name="calendar" size={15} />
              <span>{termName}</span>
            </span>

            <select
              aria-label="Nguồn lịch cá nhân"
              className="qldt-inline-select"
              value={source}
              onChange={(e) => setSource(e.target.value as "all" | "faculty" | "external")}
            >
              <option value="all">Thời khóa biểu cá nhân (Tất cả)</option>
              <option value="faculty">Lịch giảng dạy tại Khoa ({published.length})</option>
              <option value="external">Lịch ngoài khoa &amp; Đi học ({external.length})</option>
            </select>

            <div className="qldt-segmented" role="tablist" aria-label="Chế độ xem lịch cá nhân">
              <button
                type="button"
                aria-pressed={view === "week"}
                onClick={() => setView("week")}
              >
                <Icon name="term" size={14} />
                <span>Thời khóa biểu dạng tuần</span>
              </button>
              <button
                type="button"
                aria-pressed={view === "semester"}
                onClick={() => setView("semester")}
              >
                <Icon name="list" size={14} />
                <span>Thời khóa biểu dạng học kỳ</span>
              </button>
            </div>
          </div>

          <div className="qldt-toolbar-group">
            <button
              type="button"
              className="qldt-action-btn"
              onClick={() => window.print()}
            >
              <Icon name="printer" size={15} />
              <span>In</span>
            </button>
            <button
              type="button"
              className="qldt-action-btn"
              disabled={busy || exporting || (published.length === 0 && external.length === 0)}
              onClick={() => void handleExportPersonal()}
            >
              {exporting ? <Spinner size={14} /> : <Icon name="file-spreadsheet" size={15} />}
              <span>{exporting ? "Đang xuất..." : "Xuất Excel"}</span>
            </button>
          </div>
        </div>
      </div>

      {view === "week" ? (
        <>
          <div className="qldt-week-subbar">
            <select
              aria-label="Chọn tuần học"
              className="qldt-week-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              {weeks.map((w) => {
                const hits = getHolidaysInWeek(w, holidays);
                return (
                  <option key={w.startIso} value={w.startIso}>
                    {w.label}
                    {hits.length > 0 ? ` · Nghỉ lễ: ${hits.map((h) => h.name).join(", ")}` : ""}
                  </option>
                );
              })}
              <option value="all">Mẫu tuần chuẩn toàn kỳ (Gộp các tuần)</option>
            </select>

            <div className="qldt-subbar-controls">
              <label className="qldt-evening-toggle">
                <input
                  type="checkbox"
                  checked={showEvening}
                  onChange={(e) => setShowEvening(e.target.checked)}
                />
                <span>Thời khóa biểu tối</span>
              </label>

              <div className="qldt-legend">
                {legendItems.map((item) => (
                  <span key={item.id} className="qldt-legend-item" title={item.note || ""}>
                    <span
                      className="qldt-legend-swatch"
                      style={{ background: item.bg, border: `1.5px solid ${item.border}` }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {published.length === 0 && external.length === 0 ? (
            <EmptyState title="Chưa có lịch giảng dạy hoặc lịch cá nhân">
              <span>
                Lịch khoa sẽ tự động hiển thị sau khi Giáo vụ công bố. Bạn có thể khai báo trước lịch dạy ngoài hoặc lịch đi học để bộ giải tránh xếp trùng.
              </span>
              {onOpenExternalTab && (
                <div style={{ marginTop: "10px" }}>
                  <ActionButton
                    type="button"
                    variant="primary"
                    icon="plus"
                    onClick={onOpenExternalTab}
                  >
                    Khai báo lịch ngoài khoa
                  </ActionButton>
                </div>
              )}
            </EmptyState>
          ) : (
            <div className="qldt-week-wrap">
              <table className="qldt-week-table" role="table">
                <thead>
                  <tr>
                    <th className="qldt-nav-col-left">
                      <button
                        type="button"
                        className="qldt-week-arrow-btn"
                        aria-label="Tuần trước"
                        disabled={selectedWeek !== "all" && currentWeekIdx <= 0}
                        onClick={handlePrevWeek}
                        title="Tuần trước"
                      >
                        <Icon name="arrow-left" size={16} />
                      </button>
                    </th>

                    {weekDays.map((d) => {
                      const dayIso = selectedWeek !== "all" ? addDaysIso(selectedWeek, d - 2) : "";
                      const shortDate = dayIso ? formatShortDateVN(dayIso) : "";
                      const dayHol = dayIso ? findHolidayOnDate(dayIso, holidays) : null;
                      const dayLabel = d === 8 ? "Chủ Nhật" : `Thứ ${d}`;
                      return (
                        <th
                          key={d}
                          style={dayHol ? { background: "#fff1f2", color: "#9f1239" } : undefined}
                        >
                          <span>{dayLabel}</span>
                          {shortDate && <span className="qldt-day-header-date">({shortDate})</span>}
                          {dayHol && (
                            <span className="qldt-day-holiday-tag" title={dayHol.name}>
                              {dayHol.name}
                            </span>
                          )}
                        </th>
                      );
                    })}

                    <th className="qldt-nav-col-right">
                      <button
                        type="button"
                        className="qldt-week-arrow-btn"
                        aria-label="Tuần sau"
                        disabled={selectedWeek !== "all" && currentWeekIdx >= weeks.length - 1}
                        onClick={handleNextWeek}
                        title="Tuần sau"
                      >
                        <Icon name="arrow-right" size={16} />
                      </button>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visiblePeriodRows.map((pRow) => (
                    <tr key={pRow.period}>
                      <td className="qldt-period-cell">{pRow.label}</td>

                      {weekDays.map((d) => {
                        const dayMap = dayClusterMaps.get(d);
                        const cellState = dayMap?.get(pRow.period);
                        if (cellState?.type === "covered") return null;

                        const dayIso = selectedWeek !== "all" ? addDaysIso(selectedWeek, d - 2) : "";
                        const isHolCol = Boolean(dayIso && findHolidayOnDate(dayIso, holidays));

                        if (!cellState) {
                          return (
                            <td
                              key={d}
                              className={`qldt-day-cell${isHolCol ? " is-holiday-col" : ""}${
                                pRow.evening ? " is-evening-row" : ""
                              }`}
                            />
                          );
                        }

                        const { cluster } = cellState;
                        return (
                          <td
                            key={d}
                            rowSpan={cluster.rowSpan}
                            className={`qldt-day-cell${isHolCol ? " is-holiday-col" : ""}${
                              pRow.evening ? " is-evening-row" : ""
                            }`}
                          >
                            {cluster.events.length <= 2 ? (
                              <div
                                className="qldt-slot-grid"
                                data-count={String(cluster.events.length)}
                              >
                                {cluster.events.map((ev) => renderPersonalBlock(ev))}
                              </div>
                            ) : (
                              <div className="qldt-dense-cluster">
                                {cluster.events.slice(0, 2).map((ev) => {
                                  const st = getEventStyle(ev);
                                  return (
                                    <div
                                      key={ev.id}
                                      className="qldt-compact-chip"
                                      style={{
                                        background: st.bg,
                                        borderLeftColor: st.border,
                                        color: st.text,
                                      }}
                                    >
                                      <span>
                                        <b>{ev.course || ev.id}</b> · {ev.room_id || ev.room || "—"}
                                      </span>
                                    </div>
                                  );
                                })}
                                <button
                                  type="button"
                                  className="qldt-more-btn"
                                  onClick={() =>
                                    setSlotModal({
                                      day: d,
                                      periodLabel: `Tiết ${cluster.startPeriod} – ${cluster.endPeriod}`,
                                      items: cluster.events,
                                    })
                                  }
                                >
                                  + Xem tất cả {cluster.events.length} buổi
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      <td className="qldt-clock-cell">{pRow.clockLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Mode 2: Thời khóa biểu dạng học kỳ */
        !events.length ? (
          <EmptyState title="Chưa có dữ liệu lịch trong học kỳ">
            Hãy khai báo lịch ngoài khoa hoặc chờ lịch chính khóa được công bố.
          </EmptyState>
        ) : (
          <div className="qldt-semester-wrap">
            <table className="qldt-semester-table" role="table">
              <thead>
                <tr>
                  <th style={{ width: "130px" }}>Mã MH / Hoạt động</th>
                  <th>Đơn vị / Tên môn</th>
                  <th style={{ width: "120px" }}>Lớp / Nhóm</th>
                  <th style={{ width: "130px" }}>Phân loại</th>
                  <th className="col-center" style={{ width: "54px" }}>
                    Thứ
                  </th>
                  <th className="col-center" style={{ width: "76px" }}>
                    Tiết BĐ
                  </th>
                  <th className="col-center" style={{ width: "130px" }}>
                    Số tiết / Khung giờ
                  </th>
                  <th style={{ width: "100px" }}>Phòng</th>
                  <th style={{ width: "120px" }}>Thời gian học</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, idx) => {
                  const mp = mapEventToPeriods(ev, periodRows);
                  const st = getEventStyle(ev);
                  const effStart = ev._occ.effectiveStartDate || termStartIso;
                  const effEnd = ev._occ.effectiveEndDate || termEndIso;
                  const hasConflict = isConflict(ev);

                  return (
                    <tr
                      key={ev.id}
                      className={`${idx % 2 === 0 ? "group-even" : "group-odd"} group-last`}
                    >
                      <td style={{ fontWeight: 700 }}>{ev.course || ev.id}</td>
                      <td>
                        <div>
                          {ev.isExternal
                            ? ev.institution || "Đơn vị ngoài"
                            : ev.course_name || "Khoa CNTT (Chính khóa)"}
                        </div>
                        {ev.note && (
                          <small style={{ color: "var(--muted)", display: "block" }}>{ev.note}</small>
                        )}
                      </td>
                      <td>{ev.class_name || ev.section || ev.id}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: st.bg,
                            border: `1px solid ${st.border}`,
                            color: st.text,
                          }}
                        >
                          {hasConflict
                            ? "Trùng lịch khoa"
                            : ev.isExternal
                            ? getActivityLabel(ev.activity_type)
                            : "Lịch khoa"}
                        </span>
                      </td>
                      <td className="col-center">{ev.day === 8 ? "CN" : ev.day}</td>
                      <td className="col-center">{mp.startPeriod}</td>
                      <td className="col-center">
                        <b>{mp.spanPeriods} tiết</b>
                        <small style={{ display: "block", color: "var(--muted)" }}>
                          {clock(ev.start)} – {clock(ev.end)}
                        </small>
                      </td>
                      <td style={{ fontWeight: 600 }}>{ev.room_id || ev.room || "—"}</td>
                      <td>
                        <div className="qldt-date-stack">
                          <span>{formatDateVN(effStart)}</span>
                          <span>{formatDateVN(effEnd)}</span>
                        </div>
                        {ev._occ.extraWeeks > 0 && (
                          <span className="qldt-makeup-tag">+{ev._occ.extraWeeks} tuần bù lễ</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {slotModal && (
        <div className="modal-overlay" onClick={() => setSlotModal(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: "660px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>
                  {dayHeaderWithDate(slotModal.day, selectedWeek)} · {slotModal.periodLabel}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--muted)" }}>
                  {slotModal.items.length} hoạt động trong khung này
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSlotModal(null)}
                aria-label="Đóng"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div
              style={{
                flex: "1 1 auto",
                minHeight: 0,
                overflowY: "auto",
                padding: "12px 2px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gridAutoRows: "max-content",
                alignContent: "start",
                gap: "10px",
              }}
            >
              {slotModal.items.map((ev) => renderPersonalBlock(ev))}
            </div>
            <div className="actions" style={{ justifyContent: "flex-end", marginTop: "14px" }}>
              <button type="button" className="primary" onClick={() => setSlotModal(null)}>
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
