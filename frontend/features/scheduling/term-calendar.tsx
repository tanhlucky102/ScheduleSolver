"use client";
import { useEffect, useMemo, useState } from "react";
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
} from "../shared/weeks";
import { EmptyState, Icon, Spinner } from "../shared/ui";
import {
  buildDayPeriodClusters,
  buildPeriodRows,
  getProgramType,
  getQldtBlockPalette,
  mapEventToPeriods,
  resolveRule,
} from "./term-calendar-model";
import { ClassCard } from "./term-class-card";
import { exportTeacherWorkbook } from "../workspace/api-client";
import type {
  Event,
  Room,
  ColorRule,
  ShiftRule,
  HolidayRule,
  PeriodConfigInput,
} from "./term-calendar-types";
import type { OfferingItem } from "../workspace/types";

function downloadCsvWorkbook(filename: string, rows: string[][]) {
  const escapeCell = (val: string) => `"${(val ?? "").replace(/"/g, '""')}"`;
  const csvContent = "\uFEFF" + rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TermCalendar({
  events,
  draftEvents = [],
  rooms,
  offerings = [],
  colorRules = [],
  shiftRules = [],
  initialSource,
  termConfig,
  periodConfig,
  apiUrl = "http://localhost:8000",
  token = null,
}: {
  events: Event[];
  draftEvents?: Event[];
  rooms: Room[];
  offerings?: OfferingItem[];
  colorRules?: ColorRule[];
  shiftRules?: ShiftRule[];
  initialSource?: "draft" | "published";
  termConfig?: { term_name?: string; term_start_date?: string; term_end_date?: string; holidays?: HolidayRule[] };
  periodConfig?: PeriodConfigInput;
  apiUrl?: string;
  token?: string | null;
}) {
  const defaultSource: "draft" | "published" =
    initialSource ?? (events.length > 0 ? "published" : draftEvents.length > 0 ? "draft" : "published");

  const [source, setSource] = useState<"draft" | "published">(defaultSource);
  useEffect(() => {
    if (initialSource) setSource(initialSource);
  }, [initialSource]);

  const [viewMode, setViewMode] = useState<"week" | "semester" | "room">("week");
  const [cohort, setCohort] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [teacher, setTeacher] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEvening, setShowEvening] = useState(true);
  const [exporting, setExporting] = useState(false);

  const termName = termConfig?.term_name || "Học kỳ 1 - Năm học 2026 - 2027";
  const termStartIso = termConfig?.term_start_date || "2026-08-03";
  const termEndIso = termConfig?.term_end_date || "2027-01-03";
  const termRange = useMemo(
    () => ({ termStartIso, termEndIso }),
    [termStartIso, termEndIso]
  );

  const holidays = useMemo(
    () => termConfig?.holidays ?? DEFAULT_HANU_HOLIDAYS,
    [termConfig?.holidays]
  );
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

  const [cellModal, setCellModal] = useState<{
    day: number;
    periodLabel: string;
    timeLabel: string;
    classes: Event[];
  } | null>(null);
  const [modalQuery, setModalQuery] = useState("");

  const openCellModal = (payload: {
    day: number;
    periodLabel: string;
    timeLabel: string;
    classes: Event[];
  }) => {
    setModalQuery("");
    setCellModal(payload);
  };

  const courseNameMap = useMemo(() => {
    const m = new Map<string, string>();
    offerings.forEach((o) => {
      if (o.name) {
        m.set(o.id, o.name);
        m.set(o.course, o.name);
      }
    });
    return m;
  }, [offerings]);

  const offeringDateMap = useMemo(() => {
    const m = new Map<string, { start_date?: string; end_date?: string }>();
    offerings.forEach((o) => {
      if (o.start_date || o.end_date) {
        m.set(o.id, { start_date: o.start_date, end_date: o.end_date });
        m.set(o.course, { start_date: o.start_date, end_date: o.end_date });
      }
    });
    return m;
  }, [offerings]);

  const activeSource =
    source === "draft" && draftEvents.length === 0 && events.length > 0
      ? "published"
      : source === "published" && events.length === 0 && draftEvents.length > 0
      ? "draft"
      : source;

  const rawEvents = activeSource === "draft" ? draftEvents : events;

  const enrichedEvents = useMemo(
    () =>
      rawEvents.map((e) => {
        const dt =
          (e.offering ? offeringDateMap.get(e.offering) : undefined) ||
          (e.course ? offeringDateMap.get(e.course) : undefined);
        return {
          ...e,
          start_date: e.start_date || dt?.start_date || "",
          end_date: e.end_date || dt?.end_date || "",
          course_name:
            e.course_name ||
            (e.offering ? courseNameMap.get(e.offering) : undefined) ||
            (e.course ? courseNameMap.get(e.course) : undefined) ||
            "",
        };
      }),
    [rawEvents, courseNameMap, offeringDateMap]
  );

  const availableCohorts = useMemo(
    () =>
      Array.from(new Set(enrichedEvents.map((e) => e.cohort).filter((c): c is string => Boolean(c)))).sort(),
    [enrichedEvents]
  );

  const availableTeachers = useMemo(
    () =>
      Array.from(new Set(enrichedEvents.map((e) => e.teacher).filter((t): t is string => Boolean(t)))).sort(),
    [enrichedEvents]
  );

  const weekKeyForEval = viewMode === "semester" ? "all" : selectedWeek;

  const selected = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedEvents
      .map((e) => ({
        ...e,
        _occ: evaluateWeekOccurrence(e, weekKeyForEval, holidays, termRange),
      }))
      .filter((e) => {
        if (!e._occ.visible) return false;
        const matchCohort = !cohort || e.cohort === cohort;
        const matchTeacher = !teacher || e.teacher === teacher;
        const matchRoom = !roomFilter || e.room_id === roomFilter || e.room === roomFilter;
        const pType = getProgramType(e);
        const matchProgram = programFilter === "all" || pType === programFilter;
        const matchQuery =
          !q ||
          (e.course || "").toLowerCase().includes(q) ||
          (e.course_name || "").toLowerCase().includes(q) ||
          (e.id || "").toLowerCase().includes(q) ||
          (e.teacher || "").toLowerCase().includes(q) ||
          (e.room_id || e.room || "").toLowerCase().includes(q);
        return matchCohort && matchTeacher && matchRoom && matchProgram && matchQuery;
      });
  }, [
    enrichedEvents,
    weekKeyForEval,
    holidays,
    termRange,
    cohort,
    teacher,
    roomFilter,
    programFilter,
    searchQuery,
  ]);

  const weekDays = [2, 3, 4, 5, 6, 7, 8];

  const dayClusterMaps = useMemo(() => {
    const byDay = new Map<
      number,
      ReturnType<typeof buildDayPeriodClusters<Event>>
    >();
    for (const d of weekDays) {
      const dayEvs = selected.filter((e) => e.day === d);
      byDay.set(d, buildDayPeriodClusters(dayEvs, periodRows, maxVisiblePeriod));
    }
    return byDay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, periodRows, maxVisiblePeriod]);

  // Grouped rows for Thời khóa biểu dạng học kỳ (matching qldt_tkb_hoc_ky.png)
  const semesterGroups = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        key: string;
        course: string;
        courseName: string;
        cohort: string;
        section: string;
        program: string;
        totalPeriods: number;
        sessions: (Event & { _startPeriod: number; _spanPeriods: number })[];
      }
    >();

    for (const ev of selected) {
      const mapped = mapEventToPeriods(ev, periodRows);
      const cCode = ev.course || ev.id;
      const cCohort = ev.cohort || "";
      const cSec = ev.section || "01";
      const gKey = `${ev.offering || cCode}__${cCohort}__${cSec}`;

      const existing = groupsMap.get(gKey);
      const sessionWithPeriods = {
        ...ev,
        _startPeriod: mapped.startPeriod,
        _spanPeriods: mapped.spanPeriods,
      };
      if (existing) {
        existing.sessions.push(sessionWithPeriods);
        existing.totalPeriods += mapped.spanPeriods;
        if (!existing.courseName && ev.course_name) {
          existing.courseName = ev.course_name;
        }
      } else {
        groupsMap.set(gKey, {
          key: gKey,
          course: cCode,
          courseName: ev.course_name || "—",
          cohort: cCohort,
          section: cSec,
          program: getProgramType(ev),
          totalPeriods: mapped.spanPeriods,
          sessions: [sessionWithPeriods],
        });
      }
    }

    const list = Array.from(groupsMap.values()).sort(
      (a, b) =>
        a.course.localeCompare(b.course) ||
        a.cohort.localeCompare(b.cohort) ||
        a.section.localeCompare(b.section)
    );
    list.forEach((g) => {
      g.sessions.sort((a, b) => a.day - b.day || a.start - b.start);
    });
    return list;
  }, [selected, periodRows]);

  const activeRooms = useMemo(
    () => rooms.filter((r) => selected.some((e) => e.room_id === r.id || e.room === r.id)),
    [rooms, selected]
  );

  const hasActiveFilters = Boolean(
    cohort || teacher || roomFilter || programFilter !== "all" || searchQuery.trim()
  );

  const handlePrevWeek = () => {
    if (!weeks.length) return;
    if (selectedWeek === "all") {
      setSelectedWeek(weeks[0].startIso);
    } else if (currentWeekIdx > 0) {
      setSelectedWeek(weeks[currentWeekIdx - 1].startIso);
    }
  };

  const handleNextWeek = () => {
    if (!weeks.length) return;
    if (selectedWeek === "all") {
      setSelectedWeek(weeks[0].startIso);
    } else if (currentWeekIdx >= 0 && currentWeekIdx < weeks.length - 1) {
      setSelectedWeek(weeks[currentWeekIdx + 1].startIso);
    }
  };

  const handleExportExcel = async () => {
    if (exporting || !selected.length) return;
    setExporting(true);
    try {
      if (token && teacher) {
        const blob = await exportTeacherWorkbook(apiUrl, token, {
          teacherId: teacher,
          source: activeSource,
          weekStart: weekKeyForEval,
          weekLabel: activeWeekObj?.label || termName,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = activeWeekObj
          ? `TKB-GV-${teacher}-Tuan${activeWeekObj.weekNumber}.xlsx`
          : `TKB-GV-${teacher}-HocKy.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const header = [
        "Mã MH",
        "Tên môn học",
        "Nhóm tổ",
        "Khóa",
        "Hệ đào tạo",
        "Loại buổi",
        "Thứ",
        "Tiết bắt đầu",
        "Số tiết",
        "Khung giờ",
        "Phòng",
        "Giảng viên",
        "Từ ngày",
        "Đến ngày",
      ];
      const rows = [...selected]
        .sort((a, b) => (a.course || "").localeCompare(b.course || "") || a.day - b.day || a.start - b.start)
        .map((ev) => {
          const mp = mapEventToPeriods(ev, periodRows);
          const rawC = (ev.cohort || "").replace(/^K/i, "");
          return [
            ev.course || ev.id,
            ev.course_name || "",
            [ev.section || "01", rawC].filter(Boolean).join("."),
            rawC ? `K${rawC}` : "",
            getProgramType(ev),
            ev.kind || "",
            ev.day === 8 ? "CN" : String(ev.day),
            String(mp.startPeriod),
            String(mp.spanPeriods),
            `${clock(ev.start)} - ${clock(ev.end)}`,
            ev.room_id || ev.room || "",
            ev.teacher || "",
            formatDateVN(ev._occ?.effectiveStartDate),
            formatDateVN(ev._occ?.effectiveEndDate),
          ];
        });

      const suffix = cohort ? `-K${cohort.replace(/^K/i, "")}` : "-ToanKhoa";
      const modeTag = viewMode === "week" && activeWeekObj ? `-Tuan${activeWeekObj.weekNumber}` : "-HocKy";
      downloadCsvWorkbook(`TKB${suffix}${modeTag}.csv`, [header, ...rows]);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="card qldt-card term-calendar">
      {/* Sleek 2-Row QLDT Header */}
      <div className="qldt-toolbar">
        {/* Row 1: Term Badge · Source Switch · View Mode Tabs · Print & Excel */}
        <div className="qldt-toolbar-row">
          <div className="qldt-toolbar-group">
            <span className="qldt-term-badge">
              <Icon name="calendar" size={15} />
              <span>{termName}</span>
            </span>

            <div className="qldt-segmented" role="group" aria-label="Nguồn thời khóa biểu">
              <button
                type="button"
                aria-pressed={activeSource === "published"}
                disabled={!events.length}
                onClick={() => setSource("published")}
              >
                <Icon name="check" size={14} />
                <span>Đã công bố ({events.length})</span>
              </button>
              <button
                type="button"
                aria-pressed={activeSource === "draft"}
                disabled={!draftEvents.length}
                onClick={() => setSource("draft")}
              >
                <Icon name="draft" size={14} />
                <span>Bản nháp ({draftEvents.length})</span>
              </button>
            </div>

            <div className="qldt-segmented" role="tablist" aria-label="Chế độ hiển thị thời khóa biểu">
              <button
                type="button"
                aria-pressed={viewMode === "week"}
                onClick={() => setViewMode("week")}
              >
                <Icon name="term" size={14} />
                <span>Thời khóa biểu dạng tuần</span>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "semester"}
                onClick={() => setViewMode("semester")}
              >
                <Icon name="list" size={14} />
                <span>Thời khóa biểu dạng học kỳ</span>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "room"}
                onClick={() => setViewMode("room")}
              >
                <Icon name="building" size={14} />
                <span>Theo phòng học</span>
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
              disabled={exporting || !selected.length}
              onClick={() => void handleExportExcel()}
            >
              {exporting ? <Spinner size={14} /> : <Icon name="file-spreadsheet" size={15} />}
              <span>{exporting ? "Đang xuất..." : "Xuất Excel"}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Quick Cohort Pills + Inline Teacher / Room / Program / Search */}
        <div className="qldt-filter-bar">
          <div className="qldt-cohort-pills" role="group" aria-label="Chọn nhanh khóa học">
            <button
              type="button"
              className="qldt-cohort-pill"
              aria-pressed={cohort === ""}
              onClick={() => setCohort("")}
            >
              Tất cả khóa
            </button>
            {availableCohorts.map((c) => {
              const displayCohort = c.toUpperCase().startsWith("K") ? c : `K${c}`;
              return (
                <button
                  key={c}
                  type="button"
                  className="qldt-cohort-pill"
                  aria-pressed={cohort === c}
                  onClick={() => setCohort(cohort === c ? "" : c)}
                >
                  {displayCohort}
                </button>
              );
            })}
          </div>

          <select
            aria-label="Giảng viên trong học kỳ"
            className="qldt-inline-select"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
          >
            <option value="">Giảng viên: Tất cả</option>
            {availableTeachers.map((t) => (
              <option key={t} value={t}>
                GV: {t}
              </option>
            ))}
          </select>

          <select
            aria-label="Phòng học"
            className="qldt-inline-select"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="">Phòng học: Tất cả ({rooms.length})</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Phòng: {r.id}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo chương trình"
            className="qldt-inline-select"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="all">Hệ đào tạo: Tất cả</option>
            <option value="STANDARD">Hệ Đại trà</option>
            <option value="CLC">Hệ Chất lượng cao (CLC)</option>
            <option value="TT">Hệ Tiên tiến (TT)</option>
            <option value="MME">Truyền thông ĐPT (MME)</option>
          </select>

          <input
            type="search"
            aria-label="Tìm mã môn, tên môn, GV, phòng"
            className="qldt-inline-search"
            placeholder="Tìm mã môn, tên môn, GV, phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setCohort("");
                setTeacher("");
                setRoomFilter("");
                setProgramFilter("all");
                setSearchQuery("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                minHeight: "30px",
                padding: "3px 9px",
                fontSize: "12px",
                borderRadius: "6px",
                background: "#fff1f2",
                borderColor: "#fecdd3",
                color: "#be123c",
              }}
            >
              <Icon name="x" size={13} />
              <span>Bỏ lọc</span>
            </button>
          )}
        </div>
      </div>

      {!enrichedEvents.length ? (
        <EmptyState title="Chưa có dữ liệu thời khóa biểu">
          Hãy chạy bộ giải xếp lịch tại mục &quot;Xếp lịch &amp; công bố&quot; để xem thời khóa biểu dạng tuần và dạng học kỳ.
        </EmptyState>
      ) : viewMode === "week" ? (
        <>
          {/* Sub-bar directly above Weekly Grid (matching qldt_tkb_dang_tuan.jpg) */}
          <div className="qldt-week-subbar">
            <select
              aria-label="Chọn tuần thời khóa biểu"
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
                {(() => {
                  const lecRule = colorRules.find((r) => r.category === "KIND" && r.key.toUpperCase() === "LEC");
                  const tutRule = colorRules.find((r) => r.category === "KIND" && r.key.toUpperCase() === "TUT");
                  const extraRules = colorRules.filter(
                    (r) => !(r.category === "KIND" && (r.key.toUpperCase() === "LEC" || r.key.toUpperCase() === "TUT"))
                  );
                  return (
                    <>
                      <span className="qldt-legend-item" title={lecRule?.note || ""}>
                        <span
                          className="qldt-legend-swatch"
                          style={{
                            background: lecRule?.bg_color || "#dceefb",
                            border: `1.5px solid ${lecRule?.border_color || "#2b6cb0"}`,
                          }}
                        />
                        {lecRule?.label || "Lý thuyết (LEC)"}
                      </span>
                      <span className="qldt-legend-item" title={tutRule?.note || ""}>
                        <span
                          className="qldt-legend-swatch"
                          style={{
                            background: tutRule?.bg_color || "#fce8ea",
                            border: `1.5px solid ${tutRule?.border_color || "#c53030"}`,
                          }}
                        />
                        {tutRule?.label || "Thực hành (TUT)"}
                      </span>
                      {extraRules.map((r) => (
                        <span key={r.id} className="qldt-legend-item" title={r.note || ""}>
                          <span
                            className="qldt-legend-swatch"
                            style={{
                              background: r.bg_color,
                              border: `1.5px solid ${r.border_color || r.bg_color}`,
                            }}
                          />
                          {r.label || r.key}
                        </span>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

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
                      if (cellState?.type === "covered") {
                        return null;
                      }

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
                      const endRow = periodRows[cluster.endPeriod - 1] || pRow;
                      const modalPayload = {
                        day: d,
                        periodLabel:
                          cluster.startPeriod === cluster.endPeriod
                            ? `Tiết ${cluster.startPeriod}`
                            : `Tiết ${cluster.startPeriod} – ${cluster.endPeriod}`,
                        timeLabel: `${pRow.clockLabel} → ${clock(endRow.end)}`,
                        classes: cluster.events,
                      };

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
                              {cluster.events.map((ev) => (
                                <ClassCard
                                  key={ev.id}
                                  event={ev}
                                  colorRules={colorRules}
                                  compact={cluster.events.length === 2}
                                  onClick={() => openCellModal(modalPayload)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="qldt-dense-cluster">
                              <div className="qldt-dense-head">
                                <span>{cluster.events.length} lớp học phần</span>
                                <span style={{ fontWeight: 500, color: "#64748b" }}>
                                  {pRow.clockLabel}
                                </span>
                              </div>
                              <div className="qldt-dense-list">
                                {cluster.events.slice(0, cluster.rowSpan >= 4 ? 4 : 2).map((ev) => {
                                  const pal = getQldtBlockPalette(ev, colorRules);
                                  return (
                                    <div
                                      key={ev.id}
                                      className="qldt-compact-chip"
                                      style={{
                                        borderLeftColor: pal.border,
                                      }}
                                      onClick={() => openCellModal(modalPayload)}
                                      title={`${ev.course_name || ev.course} · Phòng ${ev.room_id || ev.room || "—"} · GV ${ev.teacher || "—"}`}
                                    >
                                      <span>
                                        <b>{ev.course || ev.id}</b>
                                        {ev.teacher ? ` · ${ev.teacher}` : ""}
                                      </span>
                                      <b style={{ fontSize: "10.5px", color: "#135d90", flexShrink: 0 }}>
                                        {ev.room_id || ev.room || "—"}
                                      </b>
                                    </div>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                className="qldt-more-btn"
                                onClick={() => openCellModal(modalPayload)}
                              >
                                Xem danh sách {cluster.events.length} lớp
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
        </>
      ) : viewMode === "semester" ? (
        /* View 2: Thời khóa biểu dạng học kỳ (matching qldt_tkb_hoc_ky.png) */
        !semesterGroups.length ? (
          <EmptyState title="Không tìm thấy lớp học phần phù hợp">
            Hãy thử chọn khóa học khác hoặc xóa bộ lọc tìm kiếm.
          </EmptyState>
        ) : (
          <div className="qldt-semester-wrap">
            <table className="qldt-semester-table" role="table">
              <thead>
                <tr>
                  <th style={{ width: "105px" }}>Mã MH</th>
                  <th>Tên môn học</th>
                  <th style={{ width: "95px" }}>Nhóm tổ</th>
                  <th className="col-center" style={{ width: "78px" }}>
                    Tổng tiết
                  </th>
                  <th style={{ width: "105px" }}>Lớp / Hệ</th>
                  <th className="col-center" style={{ width: "54px" }}>
                    Thứ
                  </th>
                  <th className="col-center" style={{ width: "92px" }}>
                    Tiết bắt đầu
                  </th>
                  <th className="col-center" style={{ width: "68px" }}>
                    Số tiết
                  </th>
                  <th style={{ width: "92px" }}>Phòng</th>
                  <th style={{ width: "130px" }}>Giảng viên</th>
                  <th style={{ width: "118px" }}>Thời gian học</th>
                </tr>
              </thead>
              <tbody>
                {semesterGroups.flatMap((group, gIdx) => {
                  const groupBgClass = gIdx % 2 === 0 ? "group-even" : "group-odd";
                  const rawC = group.cohort.replace(/^K/i, "");
                  const nhomTo = [group.section, rawC].filter(Boolean).join(".");
                  const lopHe = [
                    rawC ? `K${rawC}` : "",
                    group.program === "STANDARD" ? "Đại trà" : group.program,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return group.sessions.map((s, sIdx) => {
                    const isFirst = sIdx === 0;
                    const isLast = sIdx === group.sessions.length - 1;
                    const effStart = s._occ?.effectiveStartDate || termStartIso;
                    const effEnd = s._occ?.effectiveEndDate || termEndIso;
                    const extraWeeks = s._occ?.extraWeeks ?? 0;

                    return (
                      <tr
                        key={s.id}
                        className={`${groupBgClass}${isLast ? " group-last" : ""}`}
                      >
                        {isFirst && (
                          <>
                            <td rowSpan={group.sessions.length} style={{ fontWeight: 700 }}>
                              {group.course}
                            </td>
                            <td rowSpan={group.sessions.length}>{group.courseName}</td>
                            <td rowSpan={group.sessions.length}>{nhomTo}</td>
                            <td rowSpan={group.sessions.length} className="col-center">
                              {group.totalPeriods}
                            </td>
                            <td rowSpan={group.sessions.length}>
                              <span style={{ fontSize: "12px", color: "#334155" }}>{lopHe}</span>
                            </td>
                          </>
                        )}
                        <td className="subrow-cell col-center">
                          {s.day === 8 ? "CN" : s.day}
                        </td>
                        <td className="subrow-cell col-center">{s._startPeriod}</td>
                        <td
                          className="subrow-cell col-center"
                          title={`${clock(s.start)} → ${clock(s.end)}${s.kind ? ` (${s.kind})` : ""}`}
                        >
                          {s._spanPeriods}
                        </td>
                        <td className="subrow-cell" style={{ fontWeight: 600 }}>
                          {s.room_id || s.room || "—"}
                        </td>
                        <td className="subrow-cell">{s.teacher || "—"}</td>
                        <td className="subrow-cell">
                          <div className="qldt-date-stack">
                            <span>{formatDateVN(effStart)}</span>
                            <span>{formatDateVN(effEnd)}</span>
                          </div>
                          {extraWeeks > 0 && (
                            <span className="qldt-makeup-tag">+{extraWeeks} tuần bù lễ</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* View 3: Theo phòng học */
        <>
          <div className="qldt-week-subbar">
            <select
              aria-label="Chọn tuần xem phòng học"
              className="qldt-week-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              {weeks.map((w) => (
                <option key={w.startIso} value={w.startIso}>
                  {w.label}
                </option>
              ))}
              <option value="all">Mẫu tuần chuẩn toàn kỳ (Gộp các tuần)</option>
            </select>
            <small style={{ color: "var(--muted)" }}>
              Đang sử dụng <b>{activeRooms.length}</b>/{rooms.length} phòng học
            </small>
          </div>

          <div className="table-wrap term-table" style={{ maxHeight: "720px", overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={{ width: "140px" }}>
                    Phòng học
                  </th>
                  {[2, 3, 4, 5, 6, 7].map((d) => (
                    <th scope="col" key={d} style={{ textAlign: "center" }}>
                      {dayHeaderWithDate(d, selectedWeek)}
                      <small style={{ display: "block", color: "var(--muted)" }}>
                        {selected.filter((e) => e.day === d).length} buổi
                      </small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeRooms.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      <b>{r.id}</b>
                      <small style={{ display: "block", color: "var(--muted)" }}>
                        {r.name || r.id} · {r.capacity} chỗ
                      </small>
                    </th>
                    {[2, 3, 4, 5, 6, 7].map((d) => (
                      <td key={d} style={{ verticalAlign: "top" }}>
                        {selected
                          .filter((e) => e.day === d && (e.room_id === r.id || e.room === r.id))
                          .sort((a, b) => a.start - b.start)
                          .map((e) => {
                            const pType = getProgramType(e);
                            const pRule = resolveRule("PROGRAM", pType, colorRules);
                            return (
                              <article
                                className="term-event"
                                key={e.id}
                                data-session={e.id}
                                style={{
                                  background: pRule.bg_color,
                                  border: `1px solid ${pRule.border_color}`,
                                  color: pRule.text_color,
                                  marginBottom: "4px",
                                  padding: "5px 7px",
                                  borderRadius: "5px",
                                  fontSize: "11px",
                                }}
                                title={`${e.course_name || e.course} · GV: ${e.teacher || "—"}`}
                              >
                                <div style={{ fontWeight: 700 }}>
                                  {clock(e.start)}–{clock(e.end)} · {e.course}
                                </div>
                                <div>
                                  Nhóm {e.section || "01"} ({e.kind}) · {e.teacher || "—"}
                                </div>
                              </article>
                            );
                          })}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Slot Detail Modal (Clean QLĐT Table for multi-class slots or single block detail) */}
      {cellModal && (() => {
        const mq = modalQuery.trim().toLowerCase();
        const modalRows = [...cellModal.classes]
          .filter((e) => {
            if (!mq) return true;
            return (
              (e.course || "").toLowerCase().includes(mq) ||
              (e.course_name || "").toLowerCase().includes(mq) ||
              (e.room_id || e.room || "").toLowerCase().includes(mq) ||
              (e.teacher || "").toLowerCase().includes(mq) ||
              (e.cohort || "").toLowerCase().includes(mq) ||
              (e.section || "").toLowerCase().includes(mq)
            );
          })
          .sort(
            (a, b) =>
              a.start - b.start ||
              (a.course || "").localeCompare(b.course || "") ||
              (a.section || "").localeCompare(b.section || "")
          );

        return (
          <div className="modal-overlay" onClick={() => setCellModal(null)}>
            <div
              className="modal-card"
              style={{
                maxWidth: "900px",
                width: "95vw",
                maxHeight: "86vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header" style={{ marginBottom: "12px", flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, color: "#0f172a" }}>
                    {dayHeaderWithDate(cellModal.day, selectedWeek)} · {cellModal.periodLabel}
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "var(--muted)" }}>
                    Khung giờ: <b>{cellModal.timeLabel}</b> · Tổng cộng{" "}
                    <b>{cellModal.classes.length}</b> lớp học phần
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setCellModal(null)}
                  aria-label="Đóng"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>

              {cellModal.classes.length > 4 && (
                <div style={{ marginBottom: "10px", flexShrink: 0 }}>
                  <input
                    type="search"
                    aria-label="Lọc lớp trong khung giờ"
                    placeholder="Lọc nhanh theo mã môn, tên môn, phòng học, giảng viên, khóa..."
                    value={modalQuery}
                    onChange={(e) => setModalQuery(e.target.value)}
                    style={{ minHeight: "36px", height: "36px", fontSize: "12.5px" }}
                  />
                </div>
              )}

              <div className="qldt-modal-body">
                <table className="qldt-modal-table">
                  <thead>
                    <tr>
                      <th style={{ width: "115px" }}>Tiết / Giờ</th>
                      <th style={{ width: "100px" }}>Mã MH</th>
                      <th>Tên môn học</th>
                      <th style={{ width: "115px" }}>Nhóm · Khóa</th>
                      <th style={{ width: "86px" }}>Loại</th>
                      <th style={{ width: "86px" }}>Phòng</th>
                      <th style={{ width: "120px" }}>Giảng viên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                          Không có lớp học phần nào khớp từ khóa lọc.
                        </td>
                      </tr>
                    ) : (
                      modalRows.map((ev) => {
                        const mp = mapEventToPeriods(ev, periodRows);
                        const pal = getQldtBlockPalette(ev, colorRules);
                        const rawC = (ev.cohort || "").replace(/^K/i, "");
                        const pType = getProgramType(ev);
                        const secTxt = [ev.section || "01", rawC ? `K${rawC}` : ""].filter(Boolean).join(" · ");
                        const kindLabel =
                          (ev.kind || "").toUpperCase() === "TUT"
                            ? "Thực hành"
                            : (ev.kind || "").toUpperCase() === "COMBINED"
                            ? "Tích hợp"
                            : "Lý thuyết";
                        return (
                          <tr key={ev.id}>
                            <td style={{ whiteSpace: "nowrap" }}>
                              <b style={{ color: "#135d90" }}>
                                Tiết {mp.startPeriod}
                                {mp.endPeriod > mp.startPeriod ? `–${mp.endPeriod}` : ""}
                              </b>
                              <small style={{ display: "block", color: "var(--muted)" }}>
                                {clock(ev.start)} – {clock(ev.end)}
                              </small>
                            </td>
                            <td style={{ fontWeight: 700 }}>{ev.course || ev.id}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{ev.course_name || "—"}</div>
                              {pType !== "STANDARD" && (
                                <small style={{ color: "#475569" }}>Hệ {pType}</small>
                              )}
                            </td>
                            <td>{secTxt}</td>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  background: pal.bg,
                                  border: `1px solid ${pal.border}`,
                                  color: pal.text,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {kindLabel}
                              </span>
                            </td>
                            <td>
                              <b style={{ color: "#0f172a" }}>{ev.room_id || ev.room || "—"}</b>
                            </td>
                            <td>{ev.teacher || "—"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="actions" style={{ justifyContent: "space-between", alignItems: "center", margin: "12px 0 0", flexShrink: 0 }}>
                <small style={{ color: "var(--muted)" }}>
                  Hiển thị {modalRows.length}/{cellModal.classes.length} lớp học phần
                </small>
                <button type="button" className="primary" onClick={() => setCellModal(null)}>
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
