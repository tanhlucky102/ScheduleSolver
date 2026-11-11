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
import { Metrics, EmptyState } from "../shared/ui";
import { buildTimeSlots, getProgramType, resolveRule } from "./term-calendar-model";
import { ClassCard } from "./term-class-card";
import { exportTeacherWorkbook } from "../workspace/api-client";
import type { Event, Room, ColorRule, ShiftRule, HolidayRule } from "./term-calendar-types";
import type { OfferingItem } from "../workspace/types";

export function TermCalendar({
  events,
  draftEvents = [],
  rooms,
  offerings = [],
  colorRules = [],
  shiftRules = [],
  initialSource,
  termConfig,
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
  apiUrl?: string;
  token?: string | null;
}) {
  const defaultSource: "draft" | "published" =
    initialSource ?? (events.length > 0 ? "published" : draftEvents.length > 0 ? "draft" : "published");

  const [source, setSource] = useState<"draft" | "published">(defaultSource);
  useEffect(() => {
    if (initialSource) setSource(initialSource);
  }, [initialSource]);
  const [viewMode, setViewMode] = useState<"matrix" | "list" | "room">("matrix");
  const [cohort, setCohort] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [teacher, setTeacher] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [exportingTeacher, setExportingTeacher] = useState(false);

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
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
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

  const timeSlots = useMemo(() => buildTimeSlots(shiftRules), [shiftRules]);

  const [cellModal, setCellModal] = useState<{
    day: number;
    slot: (typeof timeSlots)[0];
    classes: Event[];
  } | null>(null);

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

  const activeSource =
    source === "draft" && draftEvents.length === 0 && events.length > 0
      ? "published"
      : source === "published" && events.length === 0 && draftEvents.length > 0
      ? "draft"
      : source;

  const rawEvents = activeSource === "draft" ? draftEvents : events;

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

  const selected = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedEvents
      .map((e) => ({ ...e, _occ: evaluateWeekOccurrence(e, selectedWeek, holidays) }))
      .filter((e) => {
        if (!e._occ.visible) return false;
        const matchCohort = !cohort || e.cohort === cohort;
        const matchTeacher = !teacher || e.teacher === teacher;
        const matchRoom = !roomFilter || e.room_id === roomFilter;
        const matchDay = !dayFilter || e.day === Number(dayFilter);
        const matchKind = kindFilter === "all" || e.kind === kindFilter;
        const pType = getProgramType(e);
        const matchProgram = programFilter === "all" || pType === programFilter;
        const matchQuery =
          !q ||
          (e.course || "").toLowerCase().includes(q) ||
          (e.course_name || "").toLowerCase().includes(q) ||
          (e.id || "").toLowerCase().includes(q) ||
          (e.teacher || "").toLowerCase().includes(q) ||
          (e.room_id || "").toLowerCase().includes(q);
        return matchCohort && matchTeacher && matchRoom && matchDay && matchKind && matchProgram && matchQuery;
      });
  }, [enrichedEvents, cohort, teacher, roomFilter, dayFilter, kindFilter, programFilter, searchQuery, selectedWeek, holidays]);

  const days = dayFilter ? [Number(dayFilter)] : [2, 3, 4, 5, 6, 7];
  const activeRooms = rooms.filter((r) => selected.some((e) => e.room_id === r.id));

  const clcCount = enrichedEvents.filter((e) => getProgramType(e) === "CLC").length;
  const ttCount = enrichedEvents.filter((e) => getProgramType(e) === "TT").length;
  const mmeCount = enrichedEvents.filter((e) => getProgramType(e) === "MME").length;
  const stdCount = enrichedEvents.filter((e) => getProgramType(e) === "STANDARD").length;

  const clcRule = resolveRule("PROGRAM", "CLC", colorRules);
  const ttRule = resolveRule("PROGRAM", "TT", colorRules);
  const mmeRule = resolveRule("PROGRAM", "MME", colorRules);
  const stdRule = resolveRule("PROGRAM", "STANDARD", colorRules);

  const findShiftLabel = (e: Event) => {
    const matched = timeSlots.find((s) => e.start < s.end && s.start < e.end);
    return matched ? matched.label : `${clock(e.start)}–${clock(e.end)}`;
  };

  return (
    <>
      <Metrics
        items={[
          {
            label: activeSource === "draft" ? "Lớp trên TKB Bản nháp" : "Tổng số lớp đã công bố",
            value: enrichedEvents.length,
            detail: activeSource === "draft" ? "Xem ngay sau khi xếp lịch" : "Lịch chính thức toàn học kỳ",
          },
          { label: "Lớp CLC", value: clcCount, detail: clcRule.note || "Chất lượng cao", tone: "text-primary" },
          { label: "Lớp Tiên tiến (TT)", value: ttCount, detail: ttRule.note || "Chương trình Tiên tiến", tone: "text-success" },
          { label: "MME & Đại trà", value: `${mmeCount} / ${stdCount}`, detail: "Truyền thông ĐPT / Tiêu chuẩn" },
        ]}
      />

      <section className="card term-calendar">
        <div className="section-heading" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2>Thời khóa biểu & Danh sách Môn học Cả Tuần</h2>
            <p>
              Đối chiếu các môn học, nhóm Lec/Tut, phòng học, giảng viên và khung ca/tiết trên TKB tuần ·{" "}
              <b>{selected.length}/{enrichedEvents.length}</b> buổi học
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Source Switcher: Draft vs Published */}
            <div className="segmented" style={{ display: "inline-flex" }}>
              <button
                type="button"
                aria-pressed={activeSource === "draft"}
                disabled={!draftEvents.length}
                onClick={() => setSource("draft")}
                style={{
                  fontWeight: activeSource === "draft" ? 700 : 400,
                  background: activeSource === "draft" ? "#0f766e" : "transparent",
                  color: activeSource === "draft" ? "#fff" : "inherit",
                }}
              >
                📝 Bản nháp vừa xếp ({draftEvents.length})
              </button>
              <button
                type="button"
                aria-pressed={activeSource === "published"}
                disabled={!events.length}
                onClick={() => setSource("published")}
                style={{
                  fontWeight: activeSource === "published" ? 700 : 400,
                  background: activeSource === "published" ? "#15803d" : "transparent",
                  color: activeSource === "published" ? "#fff" : "inherit",
                }}
              >
                ✅ Đã công bố ({events.length})
              </button>
            </div>

            {/* 3 View Modes: Matrix, Course List, Room Grid */}
            <div className="segmented" style={{ display: "inline-flex" }}>
              <button
                type="button"
                aria-pressed={viewMode === "matrix"}
                onClick={() => setViewMode("matrix")}
                style={{
                  fontWeight: viewMode === "matrix" ? 700 : 400,
                  background: viewMode === "matrix" ? "#0284c7" : "transparent",
                  color: viewMode === "matrix" ? "#fff" : "inherit",
                }}
              >
                📅 Ma trận Thứ × Ca
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                style={{
                  fontWeight: viewMode === "list" ? 700 : 400,
                  background: viewMode === "list" ? "#0284c7" : "transparent",
                  color: viewMode === "list" ? "#fff" : "inherit",
                }}
              >
                📋 Danh sách môn đã xếp
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "room"}
                onClick={() => setViewMode("room")}
                style={{
                  fontWeight: viewMode === "room" ? 700 : 400,
                  background: viewMode === "room" ? "#0284c7" : "transparent",
                  color: viewMode === "room" ? "#fff" : "inherit",
                }}
              >
                🏢 Theo phòng học
              </button>
            </div>
          </div>
        </div>

        {/* Visual Color Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "10px 14px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid var(--line)",
            fontSize: "12px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--muted)" }}>Bảng màu hiện hành:</span>
          {[
            { rule: clcRule, count: clcCount, name: "CLC" },
            { rule: ttRule, count: ttCount, name: "Tiên tiến (TT)" },
            { rule: mmeRule, count: mmeCount, name: "MME" },
            { rule: stdRule, count: stdCount, name: "Đại trà" },
          ].map((item) => (
            <div key={item.name} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }} title={item.rule.note}>
              <span
                style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  background: item.rule.bg_color,
                  border: `1px solid ${item.rule.border_color}`,
                  borderRadius: "3px",
                }}
              />
              <b>{item.name}</b> ({item.count})
              {item.rule.note && <small style={{ color: "var(--muted)" }}>· {item.rule.note}</small>}
            </div>
          ))}
        </div>

        {/* Thanh chọn Tuần học chuẩn HANU + Xuất Excel TKB Giảng viên */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "14px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "12.5px", color: "#0f172a" }}>🎓 {termName}</span>
          <select
            aria-label="Chọn tuần thời khóa biểu"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            style={{ flex: "1 1 340px", background: "#ffffff", fontWeight: 600, color: "#1e3a8a" }}
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
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={selectedWeek === "all" ? weeks.length === 0 : currentWeekIdx <= 0}
              onClick={() => {
                if (selectedWeek === "all" && weeks.length) setSelectedWeek(weeks[0].startIso);
                else if (currentWeekIdx > 0) setSelectedWeek(weeks[currentWeekIdx - 1].startIso);
              }}
              style={{ minHeight: "32px", padding: "4px 10px", fontSize: "12px" }}
            >
              ◀ Tuần trước
            </button>
            <button
              type="button"
              onClick={() => {
                const cur = findCurrentOrDefaultWeek(weeks);
                setSelectedWeek(cur === "all" && weeks.length ? weeks[0].startIso : cur);
              }}
              style={{ minHeight: "32px", padding: "4px 10px", fontSize: "12px" }}
            >
              Tuần hiện tại
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
              style={{ minHeight: "32px", padding: "4px 10px", fontSize: "12px" }}
            >
              Tuần sau ▶
            </button>
            {token && teacher && (
              <button
                type="button"
                disabled={exportingTeacher}
                onClick={async () => {
                  setExportingTeacher(true);
                  try {
                    const blob = await exportTeacherWorkbook(apiUrl, token, {
                      teacherId: teacher,
                      source: activeSource,
                      weekStart: selectedWeek,
                      weekLabel: activeWeekObj?.label || termName,
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = activeWeekObj
                      ? `TKB-GV-${teacher}-Tuan${activeWeekObj.weekNumber}.xlsx`
                      : `TKB-GV-${teacher}-ToanKy.xlsx`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } finally {
                    setExportingTeacher(false);
                  }
                }}
                style={{
                  minHeight: "32px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: "#0f766e",
                  borderColor: "#0f766e",
                  color: "#ffffff",
                }}
              >
                {exportingTeacher ? "⏳ Đang xuất..." : `📥 Xuất Excel GV ${teacher}`}
              </button>
            )}
          </div>
          {holidayWeekChips.length > 0 && (
            <div style={{ width: "100%", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", fontSize: "11.5px" }}>
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
                width: "100%",
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
              — Các lớp trùng ngày lễ được nghỉ và tự động đẩy lịch học bù sang đúng Thứ &amp; Ca đó của tuần kế tiếp.
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="term-filters-wrapper">
          <button
            type="button"
            className="mobile-filter-toggle"
            onClick={() => setShowFilters((prev) => !prev)}
            aria-expanded={showFilters}
            style={{ marginBottom: "10px" }}
          >
            <span>Bộ lọc TKB ⚙️</span>
            {(programFilter !== "all" || kindFilter !== "all" || cohort || teacher || roomFilter || dayFilter || searchQuery) && (
              <span className="filter-badge">● Đang lọc</span>
            )}
          </button>
          <div className={`filters term-filters-group ${showFilters ? "open" : ""}`} style={{ flexWrap: "wrap", gap: "10px" }}>
            <label style={{ minWidth: "180px" }}>
              Tìm mã môn / tên môn / phòng
              <input
                type="search"
                placeholder="VD: 61FIT, 801C, KhoaTN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <label>
              Chương trình
              <select
                aria-label="Lọc theo chương trình"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
              >
                <option value="all">Tất cả ({enrichedEvents.length})</option>
                <option value="CLC">Lớp CLC ({clcCount})</option>
                <option value="TT">Tiên tiến TT ({ttCount})</option>
                <option value="MME">Lớp MME ({mmeCount})</option>
                <option value="STANDARD">Đại trà ({stdCount})</option>
              </select>
            </label>
            <label>
              Loại buổi
              <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
                <option value="all">Tất cả (LEC + TUT)</option>
                <option value="LEC">Lý thuyết (LEC)</option>
                <option value="TUT">Thực hành (TUT)</option>
                <option value="COMBINED">Gộp (LT + TH)</option>
              </select>
            </label>
            <label>
              Khóa học
              <select aria-label="Khóa học" value={cohort} onChange={(e) => setCohort(e.target.value)}>
                <option value="">Tất cả khóa</option>
                {Array.from(new Set(enrichedEvents.map((e) => e.cohort).filter(Boolean)))
                  .sort()
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Giảng viên
              <select aria-label="Giảng viên trong học kỳ" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                <option value="">Tất cả giảng viên</option>
                {Array.from(new Set(enrichedEvents.map((e) => e.teacher).filter(Boolean)))
                  .sort()
                  .map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Phòng học
              <select aria-label="Phòng học" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
                <option value="">Tất cả phòng ({rooms.length})</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.name || r.id})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Thứ
              <select aria-label="Thứ trong tuần" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
                <option value="">Cả tuần (Thứ 2 – Thứ 7)</option>
                {[2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    Thứ {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {!enrichedEvents.length ? (
          <EmptyState title="Chưa có dữ liệu thời khóa biểu">
            Hãy chạy bộ giải xếp lịch tại mục &quot;Xếp lịch &amp; công bố&quot; để xem ngay TKB cả tuần (cả Bản nháp lẫn Bản công bố).
          </EmptyState>
        ) : viewMode === "matrix" ? (
          <div className="table-wrap term-table" style={{ maxHeight: "750px", overflowY: "auto" }}>
            <table
              role="table"
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      width: "135px",
                      position: "sticky",
                      left: 0,
                      top: 0,
                      background: "var(--surface)",
                      zIndex: 3,
                      borderRight: "2px solid var(--line)",
                    }}
                  >
                    Ca học / Tiết
                  </th>
                  {days.map((d) => {
                    const dayHol = selectedWeek !== "all" ? findHolidayOnDate(addDaysIso(selectedWeek, d - 2), holidays) : null;
                    return (
                      <th
                        key={d}
                        style={{
                          position: "sticky",
                          top: 0,
                          background: dayHol ? "#fff1f2" : "var(--surface)",
                          color: dayHol ? "#9f1239" : undefined,
                          zIndex: 2,
                          minWidth: "180px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "14px" }}>{dayHeaderWithDate(d, selectedWeek)}</div>
                        {dayHol && (
                          <small style={{ display: "block", color: "#be123c", fontWeight: 700, fontSize: "10.5px" }}>
                            🎌 {dayHol.name}
                          </small>
                        )}
                        <small style={{ color: "var(--muted)" }}>
                          {selected.filter((e) => e.day === d).length} lớp
                        </small>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <th
                      scope="row"
                      style={{
                        position: "sticky",
                        left: 0,
                        background: "#f8fafc",
                        zIndex: 1,
                        borderRight: "2px solid var(--line)",
                        padding: "10px 8px",
                        textAlign: "left",
                        verticalAlign: "top",
                      }}
                    >
                      <span
                        className="badge neutral"
                        style={{
                          display: "inline-block",
                          fontSize: "10px",
                          padding: "2px 6px",
                          marginBottom: "4px",
                        }}
                      >
                        {slot.session}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: "12px", color: "var(--primary)" }}>
                        {slot.label}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                        {slot.time}
                      </div>
                    </th>

                    {days.map((d) => {
                      const cellClasses = selected.filter(
                        (e) => e.day === d && e.start < slot.end && slot.start < e.end
                      );

                      return (
                        <td
                          key={d}
                          style={{
                            padding: "6px",
                            verticalAlign: "top",
                            borderLeft: "1px solid var(--line)",
                            background: cellClasses.length === 0 ? "#ffffff" : "#fafafa",
                          }}
                        >
                          {cellClasses.length === 0 ? (
                            <div
                              style={{
                                minHeight: "44px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#cbd5e1",
                                fontSize: "11px",
                              }}
                            >
                              —
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {cellClasses.slice(0, 4).map((e) => (
                                <ClassCard key={e.id} event={e} colorRules={colorRules} />
                              ))}
                              {cellClasses.length > 4 && (
                                <button
                                  type="button"
                                  className="cell-expand-btn"
                                  onClick={() => setCellModal({ day: d, slot, classes: cellClasses })}
                                  title={`Xem toàn bộ ${cellClasses.length} lớp học phần`}
                                >
                                  + {cellClasses.length - 4} lớp khác...
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : viewMode === "list" ? (
          /* Chế độ 3: Danh sách môn học đã xếp trên TKB cả tuần */
          <div className="table-wrap table-scroll" style={{ maxHeight: "720px" }}>
            <table>
              <thead>
                <tr>
                  <th>Mã MH & Lớp</th>
                  <th>Tên học phần</th>
                  <th>Khóa / Hệ</th>
                  <th>Loại</th>
                  <th>Số tiết</th>
                  <th>Thứ & Ca học</th>
                  <th>Khung giờ</th>
                  <th>Phòng học</th>
                  <th>Giảng viên</th>
                  <th>Thời gian học</th>
                  <th>Sĩ số</th>
                </tr>
              </thead>
              <tbody>
                {[...selected]
                  .sort((a, b) => a.day - b.day || a.start - b.start || (a.course || "").localeCompare(b.course || ""))
                  .map((e) => {
                    const pType = getProgramType(e);
                    const pRule = resolveRule("PROGRAM", pType, colorRules);
                    const kRule = e.kind ? resolveRule("KIND", e.kind, colorRules) : null;
                    return (
                      <tr key={e.id}>
                        <td>
                          <b>{e.course || e.id}</b>
                          <small style={{ display: "block", color: "var(--muted)" }}>
                            {e.section ? `Nhóm ${e.section} · ` : ""}
                            {e.id}
                          </small>
                        </td>
                        <td>{e.course_name || "—"}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              background: pRule.bg_color,
                              border: `1px solid ${pRule.border_color}`,
                              color: pRule.text_color,
                            }}
                          >
                            {pType}
                          </span>
                          {e.cohort && <small style={{ marginLeft: "6px" }}>K{e.cohort}</small>}
                        </td>
                        <td>
                          {kRule ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                background: kRule.bg_color,
                                color: kRule.text_color,
                              }}
                            >
                              {e.kind}
                            </span>
                          ) : (
                            e.kind || "—"
                          )}
                        </td>
                        <td>{e.periods ?? "—"} tiết</td>
                        <td>
                          <b>Thứ {e.day === 8 ? "CN" : e.day}</b>
                          <small style={{ display: "block", color: "var(--muted)" }}>{findShiftLabel(e)}</small>
                        </td>
                        <td>
                          {clock(e.start)} – {clock(e.end)}
                        </td>
                        <td>
                          <span className="badge neutral">{e.room_id || e.room || "Chưa gán"}</span>
                        </td>
                        <td>
                          <b>{e.teacher || "Chưa phân công"}</b>
                        </td>
                        <td>
                          {e._occ?.effectiveStartDate || e.start_date || e.end_date ? (
                            <small>
                              {formatDateVN(e._occ?.effectiveStartDate || e.start_date)} →{" "}
                              {formatDateVN(e._occ?.effectiveEndDate || e.end_date)}
                              {e._occ && e._occ.extraWeeks > 0 && (
                                <span style={{ display: "block", color: "#6d28d9", fontWeight: 600 }}>
                                  +{e._occ.extraWeeks} tuần học bù lễ ({e._occ.holidayName})
                                </span>
                              )}
                              {e._occ?.status === "HOLIDAY_OFF" && (
                                <span style={{ display: "block", color: "#be123c", fontWeight: 700 }}>
                                  🎌 Nghỉ lễ → Bù {formatDateVN(e._occ.makeupNextDate)}
                                </span>
                              )}
                            </small>
                          ) : (
                            <small style={{ color: "var(--muted)" }}>Toàn học kỳ</small>
                          )}
                        </td>
                        <td>{e.students !== undefined ? `${e.students} SV` : "—"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Chế độ 2: Theo phòng học */
          <div className="table-wrap term-table" style={{ maxHeight: "750px", overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={{ width: "140px" }}>Phòng</th>
                  {days.map((d) => (
                    <th scope="col" key={d} style={{ textAlign: "center" }}>
                      {dayHeaderWithDate(d, selectedWeek)}
                      <small>{selected.filter((e) => e.day === d).length} buổi</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeRooms.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      <b>{r.id}</b>
                      <small>{r.name || r.id}</small>
                      <small>{r.capacity} chỗ</small>
                    </th>
                    {days.map((d) => (
                      <td key={d}>
                        {selected
                          .filter((e) => e.day === d && e.room_id === r.id)
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
                                }}
                                title={`${e.id} · ${e.cohort || ""} · ${pType}`}
                              >
                                <time>{clock(e.start)}–{clock(e.end)}</time>
                                <b>
                                  {e.course} - {e.section || e.id} ({e.kind})
                                </b>
                                <span>
                                  {e.teacher} · {e.students ?? ""} SV
                                </span>
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
        )}

        {cellModal && (
          <div className="modal-overlay" onClick={() => setCellModal(null)}>
            <div
              className="modal-card"
              style={{ maxWidth: "680px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0 }}>
                    Thứ {cellModal.day} · {cellModal.slot.session} ({cellModal.slot.label})
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                    Khung giờ: {cellModal.slot.time} · Có {cellModal.classes.length} lớp học phần được bố trí
                  </p>
                </div>
                <button className="modal-close" onClick={() => setCellModal(null)} aria-label="Đóng">
                  ×
                </button>
              </div>
              <div
                style={{
                  overflowY: "auto",
                  padding: "12px 2px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "10px",
                }}
              >
                {cellModal.classes.map((e) => (
                  <ClassCard key={e.id} event={e} colorRules={colorRules} />
                ))}
              </div>
              <div className="actions" style={{ justifyContent: "flex-end", marginTop: "14px" }}>
                <button type="button" className="primary" onClick={() => setCellModal(null)}>
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
