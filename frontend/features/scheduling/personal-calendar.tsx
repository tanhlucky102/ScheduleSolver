"use client";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../shared/ui";
import { clock, dayName } from "../shared/time";
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
import { resolveRule } from "./term-calendar-model";
import { exportTeacherWorkbook } from "../workspace/api-client";
import type { CalendarEvent } from "../workspace/ui-types";
import type { ColorRule, HolidayRule } from "../catalog/types";

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

export function PersonalCalendar({
  published,
  external,
  colorRules = [],
  termConfig,
  apiUrl = "http://localhost:8000",
  token = null,
  busy = false,
}: {
  published: CalendarEvent[];
  external: CalendarEvent[];
  colorRules?: ColorRule[];
  termConfig?: { term_name?: string; term_start_date?: string; term_end_date?: string; holidays?: HolidayRule[] };
  apiUrl?: string;
  token?: string | null;
  busy?: boolean;
}) {
  const [view, setView] = useState("week");
  const [source, setSource] = useState("all");
  const [exporting, setExporting] = useState(false);

  const termName = termConfig?.term_name || "Học kỳ 1 - Năm học 2026 - 2027";
  const holidays = useMemo(() => termConfig?.holidays ?? DEFAULT_HANU_HOLIDAYS, [termConfig?.holidays]);
  const weeks = useMemo(
    () => buildAcademicWeeks(termConfig?.term_start_date || "2026-08-03", termConfig?.term_end_date || "2027-01-03"),
    [termConfig?.term_start_date, termConfig?.term_end_date]
  );
  const holidayWeekChips = useMemo(
    () =>
      weeks
        .map((w) => ({ week: w, hits: getHolidaysInWeek(w, holidays) }))
        .filter((x) => x.hits.length > 0),
    [weeks, holidays]
  );

  const [selectedWeek, setSelectedWeek] = useState<string>(() => findCurrentOrDefaultWeek(weeks));
  useEffect(() => {
    if (selectedWeek !== "all" && !weeks.some((w) => w.startIso === selectedWeek)) {
      setSelectedWeek(findCurrentOrDefaultWeek(weeks));
    }
  }, [weeks, selectedWeek]);

  const currentWeekIdx = weeks.findIndex((w) => w.startIso === selectedWeek);
  const activeWeekObj = currentWeekIdx >= 0 ? weeks[currentWeekIdx] : undefined;

  const weekHolidays = useMemo(() => {
    if (selectedWeek === "all") return [];
    const found: { day: number; dateIso: string; name: string }[] = [];
    for (let d = 2; d <= 8; d++) {
      const dIso = addDaysIso(selectedWeek, d - 2);
      const hit = findHolidayOnDate(dIso, holidays);
      if (hit) found.push({ day: d, dateIso: dIso, name: hit.name });
    }
    return found;
  }, [selectedWeek, holidays]);

  const events = useMemo(() => {
    const merged = [
      ...(source === "external" ? [] : published.map((e) => ({ ...e, isExternal: false }))),
      ...(source === "faculty" ? [] : external.map((e) => ({ ...e, isExternal: true }))),
    ];
    return merged
      .map((e) => ({ ...e, _occ: evaluateWeekOccurrence(e, selectedWeek, holidays) }))
      .filter((e) => e._occ.visible)
      .sort((a, b) => a.day - b.day || a.start - b.start || a.id.localeCompare(b.id));
  }, [published, external, source, selectedWeek, holidays]);

  const conflict = (e: CalendarEvent) =>
    external.some((x) => x.id === e.id) && published.some((p) => overlaps(p, e));

  const findStatusRule = (key: string): ColorRule | undefined =>
    colorRules.find((r) => r.category === "STATUS" && r.key.toUpperCase() === key.toUpperCase());

  const getActivityLabel = (actType?: string) => {
    const key = (actType || "EXTERNAL_TEACHING").toUpperCase();
    const customStatus = findStatusRule(key);
    if (customStatus?.label) return customStatus.label;
    return DEFAULT_ACTIVITY_LABELS[key] || actType || "Lịch ngoài";
  };

  const findCustomMatch = (e: CalendarEvent & { isExternal: boolean }): ColorRule | undefined => {
    const courseUp = (e.course || "").toUpperCase();
    const idUp = (e.id || "").toUpperCase();
    const instUp = (e.institution || "").toUpperCase();
    const kindUp = idUp.includes("-LEC-")
      ? "LEC"
      : idUp.includes("-TUT-")
      ? "TUT"
      : idUp.includes("-COMBINED-")
      ? "COMBINED"
      : "";

    return (
      colorRules.find((r) => r.category === "CUSTOM" && courseUp.includes(r.key.toUpperCase())) ||
      (instUp ? colorRules.find((r) => r.category === "INSTITUTION" && instUp.includes(r.key.toUpperCase())) : undefined) ||
      (kindUp ? colorRules.find((r) => r.category === "KIND" && r.key.toUpperCase() === kindUp) : undefined) ||
      colorRules.find((r) => r.category === "PROGRAM" && courseUp.includes(r.key.toUpperCase()))
    );
  };

  const getEventStyle = (e: CalendarEvent & { isExternal: boolean }) => {
    if (conflict(e)) {
      const cRule = resolveRule("STATUS", "CONFLICT", colorRules);
      return { bg: cRule.bg_color, border: cRule.border_color, text: cRule.text_color, ruleNote: cRule.note };
    }
    const matched = findCustomMatch(e);
    if (e.isExternal) {
      if (matched) {
        return { bg: matched.bg_color, border: matched.border_color, text: matched.text_color, ruleNote: matched.note };
      }
      const actKey = (e.activity_type || "EXTERNAL_TEACHING").toUpperCase();
      const customStatus = findStatusRule(actKey);
      if (customStatus) {
        return {
          bg: customStatus.bg_color,
          border: customStatus.border_color,
          text: customStatus.text_color,
          ruleNote: customStatus.note,
        };
      }
      if (e.color && e.color.startsWith("#")) {
        return { bg: e.color, border: "#94a3b8", text: "#0f172a", ruleNote: "" };
      }
      if (actKey === "STUDYING" || actKey === "MAKEUP") {
        const stRule = resolveRule("STATUS", actKey, colorRules);
        return { bg: stRule.bg_color, border: stRule.border_color, text: stRule.text_color, ruleNote: stRule.note };
      }
      return { bg: "#fef9c3", border: "#fde047", text: "#713f12", ruleNote: "" };
    }
    if (matched) {
      return { bg: matched.bg_color, border: matched.border_color, text: matched.text_color, ruleNote: matched.note };
    }
    if (e.evening || e.start >= 1020) {
      const evRule = resolveRule("STATUS", "EVENING", colorRules);
      return { bg: evRule.bg_color, border: evRule.border_color, text: evRule.text_color, ruleNote: evRule.note };
    }
    const facRule = findStatusRule("FACULTY");
    if (facRule) {
      return { bg: facRule.bg_color, border: facRule.border_color, text: facRule.text_color, ruleNote: facRule.note };
    }
    return { bg: undefined, border: undefined, text: undefined, ruleNote: "" };
  };

  const legendItems = useMemo(() => {
    const facultyRule = findStatusRule("FACULTY");
    const eveningRule = resolveRule("STATUS", "EVENING", colorRules);
    const extRule = findStatusRule("EXTERNAL_TEACHING");
    const studyRule = resolveRule("STATUS", "STUDYING", colorRules);
    const makeupRule = resolveRule("STATUS", "MAKEUP", colorRules);
    const conflictRule = resolveRule("STATUS", "CONFLICT", colorRules);

    const baseItems: { id: string; label: string; color?: string; border?: string; note?: string; className?: string }[] = [
      {
        id: "base-faculty",
        label: facultyRule?.label || "Lịch khoa",
        color: facultyRule?.bg_color,
        border: facultyRule?.border_color,
        note: facultyRule?.note,
      },
      {
        id: "base-evening",
        label: findStatusRule("EVENING")?.label || "TKB tối",
        color: findStatusRule("EVENING")?.bg_color || eveningRule.bg_color || "#e0f2fe",
        border: findStatusRule("EVENING")?.border_color || eveningRule.border_color || "#38bdf8",
        note: eveningRule.note,
      },
      {
        id: "base-ext",
        label: extRule?.label || "Dạy trường ngoài",
        color: extRule?.bg_color || "#fef08a",
        border: extRule?.border_color || "#facc15",
        note: extRule?.note,
      },
      {
        id: "base-study",
        label: findStatusRule("STUDYING")?.label || "Đi học / NCS",
        color: studyRule.bg_color || "#dcfce7",
        border: studyRule.border_color || "#4ade80",
        note: studyRule.note,
      },
      {
        id: "base-makeup",
        label: findStatusRule("MAKEUP")?.label || "Dạy bù",
        color: makeupRule.bg_color || "#f3e8ff",
        border: makeupRule.border_color || "#c084fc",
        note: makeupRule.note,
      },
      {
        id: "base-conflict",
        label: findStatusRule("CONFLICT")?.label || "Trùng lịch",
        color: findStatusRule("CONFLICT")?.bg_color,
        border: findStatusRule("CONFLICT")?.border_color,
        className: findStatusRule("CONFLICT") ? undefined : "conflict-dot",
        note: conflictRule.note,
      },
    ];

    const handledStatusKeys = new Set(["FACULTY", "EVENING", "EXTERNAL_TEACHING", "STUDYING", "MAKEUP", "CONFLICT"]);
    const extraCustomItems: typeof baseItems = colorRules
      .filter((r) => !(r.category === "STATUS" && handledStatusKeys.has(r.key.toUpperCase())))
      .map((r) => ({
        id: `rule-${r.id}`,
        label: r.label || r.key,
        color: r.bg_color,
        border: r.border_color || r.text_color,
        note: r.note ? `${r.key}: ${r.note}` : r.key,
      }));

    return [...baseItems, ...extraCustomItems];
  }, [colorRules]);

  const handleExportPersonal = async () => {
    if (!token || exporting) return;
    setExporting(true);
    try {
      const blob = await exportTeacherWorkbook(apiUrl, token, {
        weekStart: selectedWeek,
        weekLabel: activeWeekObj?.label || termName,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeWeekObj
        ? `TKB-CaNhan-Tuan${activeWeekObj.weekNumber}-${activeWeekObj.startIso}.xlsx`
        : `TKB-CaNhan-ToanKy.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const renderDateBadge = (e: CalendarEvent & { _occ?: WeekOccurrenceInfo }) => {
    const occ = e._occ;
    const rawS = occ?.effectiveStartDate || e.start_date;
    const rawE = occ?.effectiveEndDate || e.end_date;
    if (!rawS && !rawE) return null;
    const s = formatShortDateVN(rawS);
    const en = formatShortDateVN(rawE);
    const extra = occ && occ.extraWeeks > 0 ? ` (+${occ.extraWeeks}t bù lễ)` : "";
    if (s && en) return `${s}–${en}${extra}`;
    return (s || en) + extra;
  };

  return (
    <section className="card personal-calendar">
      <div className="section-heading" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2>⚙️ THỜI KHÓA BIỂU DẠNG TUẦN (Lịch khoa, Dạy ngoài & Lịch đi học)</h2>
          <p>
            Xem theo từng tuần thực tế giống cổng đào tạo HANU hoặc gộp toàn học kỳ · hỗ trợ xuất Excel cá nhân
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {token && (
            <button
              type="button"
              disabled={busy || exporting || (published.length === 0 && external.length === 0)}
              onClick={() => void handleExportPersonal()}
              style={{
                background: "#0f766e",
                borderColor: "#0f766e",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              {exporting
                ? "⏳ Đang xuất..."
                : activeWeekObj
                ? `📥 Xuất Excel Tuần ${activeWeekObj.weekNumber} (.xlsx)`
                : "📥 Xuất Excel Cả Kỳ (.xlsx)"}
            </button>
          )}
          <div className="segmented" aria-label="Chế độ xem lịch">
            <button aria-pressed={view === "week"} onClick={() => setView("week")}>
              Lịch tuần
            </button>
            <button aria-pressed={view === "list"} onClick={() => setView("list")}>
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Thanh chọn Học kỳ + Loại lịch + Tuần chuẩn cổng đào tạo HANU */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
          padding: "12px 14px",
          marginBottom: "14px",
          display: "grid",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              flex: "1 1 240px",
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
            }}
          >
            🎓 {termName}
          </div>
          <select
            aria-label="Nguồn lịch"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ flex: "1 1 220px", background: "#ffffff", fontWeight: 500 }}
          >
            <option value="all">Thời khóa biểu cá nhân (Tất cả lịch)</option>
            <option value="faculty">Thời khóa biểu Khoa (Chính khóa)</option>
            <option value="external">Lịch dạy ngoài, Đi học & Dạy bù</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            aria-label="Chọn tuần học"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            style={{ flex: "1 1 360px", background: "#ffffff", fontWeight: 600, color: "#1e3a8a" }}
          >
            <option value="all">📅 Toàn học kỳ (Hiển thị gộp tất cả các tuần)</option>
            {weeks.map((w) => {
              const hits = getHolidaysInWeek(w, holidays);
              return (
                <option key={w.startIso} value={w.startIso}>
                  {w.label}
                  {hits.length > 0 ? ` · 🎌 ${hits.map((h) => h.name).join(", ")}` : ""}
                </option>
              );
            })}
          </select>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              disabled={selectedWeek === "all" ? weeks.length === 0 : currentWeekIdx <= 0}
              onClick={() => {
                if (selectedWeek === "all" && weeks.length) setSelectedWeek(weeks[0].startIso);
                else if (currentWeekIdx > 0) setSelectedWeek(weeks[currentWeekIdx - 1].startIso);
              }}
              style={{ minHeight: "34px", padding: "4px 10px", fontSize: "12px" }}
            >
              ◀ Tuần trước
            </button>
            <button
              type="button"
              onClick={() => {
                const cur = findCurrentOrDefaultWeek(weeks);
                setSelectedWeek(cur === "all" && weeks.length ? weeks[0].startIso : cur);
              }}
              style={{ minHeight: "34px", padding: "4px 10px", fontSize: "12px" }}
            >
              Hôm nay
            </button>
            <button
              type="button"
              disabled={selectedWeek !== "all" && currentWeekIdx >= weeks.length - 1}
              onClick={() => {
                if (selectedWeek === "all" && weeks.length) setSelectedWeek(weeks[0].startIso);
                else if (currentWeekIdx >= 0 && currentWeekIdx < weeks.length - 1) {
                  setSelectedWeek(weeks[currentWeekIdx + 1].startIso);
                }
              }}
              style={{ minHeight: "34px", padding: "4px 10px", fontSize: "12px" }}
            >
              Tuần sau ▶
            </button>
          </div>
        </div>

        {holidayWeekChips.length > 0 && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", fontSize: "11.5px" }}>
            <span style={{ fontWeight: 600, color: "#92400e" }}>🎌 Xem nhanh tuần lễ trong kỳ:</span>
            {holidayWeekChips.map(({ week: w, hits }) => {
              const active = selectedWeek === w.startIso;
              return (
                <button
                  key={w.startIso}
                  type="button"
                  onClick={() => setSelectedWeek(w.startIso)}
                  style={{
                    minHeight: "26px",
                    padding: "2px 9px",
                    fontSize: "11px",
                    borderRadius: "999px",
                    fontWeight: 600,
                    background: active ? "#be123c" : "#fff1f2",
                    borderColor: active ? "#be123c" : "#fda4af",
                    color: active ? "#ffffff" : "#9f1239",
                  }}
                >
                  Tuần {w.weekNumber}: {hits.map((h) => h.name).join(", ")}
                </button>
              );
            })}
          </div>
        )}

        {weekHolidays.length > 0 && (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "12px",
              color: "#9f1239",
            }}
          >
            <b>🎌 Nghỉ lễ trong tuần này:</b>{" "}
            {weekHolidays
              .map((h) => `${h.day === 8 ? "CN" : `Thứ ${h.day}`} (${formatShortDateVN(h.dateIso)}): ${h.name}`)
              .join(" · ")}{" "}
            — Các môn trùng ngày lễ được nghỉ và tự động đẩy học bù sang đúng Thứ &amp; Ca đó của tuần kế tiếp.
          </div>
        )}
      </div>

      <div className="calendar-toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div className="legend" style={{ flexWrap: "wrap", gap: "10px" }}>
          {legendItems.map((item) => (
            <span key={item.id} title={item.note || item.label}>
              <i
                className={item.className}
                style={
                  item.color
                    ? {
                        background: item.color,
                        border: item.border ? `1px solid ${item.border}` : undefined,
                      }
                    : undefined
                }
              />{" "}
              {item.label}
            </span>
          ))}
        </div>
        <small style={{ color: "var(--muted)", marginLeft: "auto" }}>
          Đang hiển thị <b>{events.length}</b> buổi trong {activeWeekObj ? `Tuần ${activeWeekObj.weekNumber}` : "toàn kỳ"}
        </small>
      </div>

      {!events.length ? (
        <EmptyState title="Không có buổi dạy / lịch học trong tuần đã chọn">
          Bạn có thể chuyển sang tuần khác, chọn &quot;Toàn học kỳ&quot;, hoặc khai báo/Import lịch dạy ngoài &amp; lịch đi học bên dưới.
        </EmptyState>
      ) : (
        <>
          {view === "week" && (
            <div
              className="calendar-scroll calendar-expanded"
              tabIndex={0}
              aria-label="Lịch tuần đầy đủ khung giờ"
            >
              <div className="week-grid">
                <div className="time-column">
                  <div className="day-heading">Giờ</div>
                  <div className="time-body">
                    {Array.from({ length: 18 }, (_, i) => (
                      <span key={i} style={{ top: i * 60 }}>
                        {clock((i + 6) * 60)}
                      </span>
                    ))}
                  </div>
                </div>
                {Array.from({ length: 7 }, (_, i) => i + 2).map((day) => {
                  const dayHol = selectedWeek !== "all" ? findHolidayOnDate(addDaysIso(selectedWeek, day - 2), holidays) : null;
                  return (
                  <section className="week-day" key={day}>
                    <h3
                      className="day-heading"
                      style={dayHol ? { background: "#fff1f2", color: "#9f1239" } : undefined}
                      title={dayHol ? `Nghỉ lễ: ${dayHol.name}` : undefined}
                    >
                      {dayHeaderWithDate(day, selectedWeek)}
                      {dayHol && (
                        <small style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#be123c" }}>
                          🎌 {dayHol.name}
                        </small>
                      )}
                    </h3>
                    <div className="day" style={dayHol ? { background: "rgba(255, 241, 242, 0.35)" } : undefined}>
                      {events
                        .filter((e) => e.day === day)
                        .map((event) => {
                          const sameDay = events.filter((e) => e.day === day);
                          const group = new Set([event.id]);
                          let growing = true;
                          while (growing) {
                            growing = false;
                            for (const item of sameDay) {
                              if (
                                !group.has(item.id) &&
                                sameDay.some((other) => group.has(other.id) && overlaps(item, other))
                              ) {
                                group.add(item.id);
                                growing = true;
                              }
                            }
                          }
                          const cluster = sameDay.filter((e) => group.has(e.id));
                          const lane = cluster.findIndex((e) => e.id === event.id);
                          const st = getEventStyle(event);
                          const dtBadge = renderDateBadge(event);
                          const occ = event._occ;
                          const isHolOff = occ.status === "HOLIDAY_OFF";
                          const isMakeupShift = occ.status === "SHIFTED_NEXT_WEEK" || occ.status === "MAKEUP_EXTENSION";
                          const effStart = occ.effectiveStartDate || event.start_date;
                          const effEnd = occ.effectiveEndDate || event.end_date;
                          const dayLabelShort = day === 8 ? "CN" : `Thứ ${day}`;

                          return (
                            <article
                              key={event.id}
                              title={[
                                `${event.course || event.id}`,
                                event.institution ? `Đơn vị: ${event.institution}` : "Khoa CNTT",
                                event.activity_type ? `Loại: ${getActivityLabel(event.activity_type)}` : "",
                                `Giờ: ${clock(event.start)} – ${clock(event.end)}`,
                                `Phòng: ${event.room_id || event.room || "Chưa có"}`,
                                effStart || effEnd
                                  ? `Thời gian thực học: ${formatDateVN(effStart)} → ${formatDateVN(effEnd)}${occ.extraWeeks > 0 ? ` (+${occ.extraWeeks} tuần bù lễ ${occ.holidayName})` : ""}`
                                  : "",
                                isHolOff
                                  ? `🎌 Nghỉ lễ: ${occ.holidayName} → Học bù ${dayLabelShort} tuần sau (${formatDateVN(occ.makeupNextDate)})`
                                  : "",
                                isMakeupShift ? `🔄 Buổi học bù lễ: ${occ.holidayName}` : "",
                                event.note || st.ruleNote ? `Note: ${[event.note, st.ruleNote].filter(Boolean).join(" · ")}` : "",
                              ]
                                .filter(Boolean)
                                .join("\n")}
                              className={
                                "calendar-event " +
                                (event.isExternal ? "external-event " : "") +
                                (conflict(event) && !isHolOff ? "conflict-event" : "")
                              }
                              style={{
                                top: event.start - 360,
                                height: Math.max(28, event.end - event.start),
                                left: "calc(" + (lane / cluster.length) * 100 + "% + 3px)",
                                width: "calc(" + 100 / cluster.length + "% - 6px)",
                                ...(st.bg ? { background: st.bg, borderColor: st.border, color: st.text } : {}),
                                ...(isHolOff
                                  ? {
                                      background: "#fff1f2",
                                      borderColor: "#fb7185",
                                      borderStyle: "dashed",
                                      color: "#9f1239",
                                      opacity: 0.92,
                                    }
                                  : {}),
                              }}
                            >
                              <b>{event.course}</b>
                              <small>
                                {clock(event.start)}–{clock(event.end)} · {event.room_id || event.room || "Chưa có phòng"}
                              </small>
                              {isHolOff ? (
                                <strong style={{ color: "#be123c", fontSize: "10.5px" }}>
                                  🎌 Nghỉ lễ ({occ.holidayName}) → Bù {dayLabelShort} tuần sau ({formatShortDateVN(occ.makeupNextDate)})
                                </strong>
                              ) : isMakeupShift ? (
                                <strong style={{ color: "#6d28d9", fontSize: "10.5px" }}>
                                  🔄 Học bù lễ {occ.holidayName}
                                  {occ.sessionNumber && occ.totalSessions ? ` (Buổi ${occ.sessionNumber}/${occ.totalSessions})` : ""}
                                </strong>
                              ) : (
                                <small>
                                  {event.isExternal
                                    ? `${getActivityLabel(event.activity_type)} · ${event.institution}`
                                    : event.id}
                                </small>
                              )}
                              {dtBadge && <small>📅 {dtBadge}</small>}
                              {(event.note || st.ruleNote) && <small>📝 {event.note || st.ruleNote}</small>}
                              {conflict(event) && !isHolOff && <strong>Cần đổi lịch ngoài</strong>}
                            </article>
                          );
                        })}
                    </div>
                  </section>
                  );
                })}
              </div>
            </div>
          )}

          <div className={view === "week" ? "agenda mobile-agenda" : "agenda"}>
            {Array.from(new Set(events.map((e) => e.day))).map((day) => (
              <section key={day}>
                <h3>{selectedWeek === "all" ? dayName(day) : dayHeaderWithDate(day, selectedWeek)}</h3>
                {events
                  .filter((e) => e.day === day)
                  .map((e) => {
                    const occ = e._occ;
                    const isHolOff = occ.status === "HOLIDAY_OFF";
                    const isMakeupShift = occ.status === "SHIFTED_NEXT_WEEK" || occ.status === "MAKEUP_EXTENSION";
                    const effStart = occ.effectiveStartDate || e.start_date;
                    const effEnd = occ.effectiveEndDate || e.end_date;
                    const dTxt = day === 8 ? "CN" : `Thứ ${day}`;
                    return (
                      <article
                        className={conflict(e) && !isHolOff ? "agenda-event conflict-event" : "agenda-event"}
                        key={e.id}
                        style={isHolOff ? { background: "#fff1f2", borderColor: "#fecdd3" } : undefined}
                      >
                        <time>
                          {clock(e.start)}
                          <small>{clock(e.end)}</small>
                        </time>
                        <div>
                          <b>{e.course}</b>
                          <small>
                            {e.class_name || e.id} · {e.room_id || e.room || "Chưa có phòng"}
                          </small>
                          <small>
                            {e.institution || "Lịch khoa chính thức"}
                            {(effStart || effEnd)
                              ? ` · 📅 ${formatDateVN(effStart)} → ${formatDateVN(effEnd)}${occ.extraWeeks > 0 ? ` (+${occ.extraWeeks}t bù lễ)` : ""}`
                              : ""}
                            {isHolOff
                              ? ` · 🎌 Nghỉ lễ ${occ.holidayName} → Học bù ${dTxt} tuần sau (${formatDateVN(occ.makeupNextDate)})`
                              : isMakeupShift
                              ? ` · 🔄 Học bù lễ ${occ.holidayName}`
                              : ""}
                            {e.note ? ` · 📝 ${e.note}` : ""}
                          </small>
                        </div>
                        <span
                          className={
                            "badge " +
                            (isHolOff
                              ? "warning"
                              : conflict(e)
                              ? "warning"
                              : isMakeupShift
                              ? "neutral"
                              : e.isExternal
                              ? "neutral"
                              : "success")
                          }
                        >
                          {isHolOff
                            ? "🎌 Nghỉ lễ (Bù tuần sau)"
                            : conflict(e)
                            ? "Trùng lịch"
                            : isMakeupShift
                            ? "🔄 Học bù lễ"
                            : e.isExternal
                            ? getActivityLabel(e.activity_type)
                            : "Lịch khoa"}
                        </span>
                      </article>
                    );
                  })}
              </section>
            ))}
          </div>
        </>
      )}
      <p className="inline-help">
        Lịch ngoài trường &amp; lịch đi học được dùng để hệ thống tránh xếp trùng khi Giáo vụ chạy bộ giải; sau khi công bố, lịch khoa luôn giữ quyền ưu tiên cao nhất.
      </p>
    </section>
  );
}
