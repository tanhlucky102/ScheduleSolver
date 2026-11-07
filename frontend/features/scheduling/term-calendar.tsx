"use client";
import { useState } from "react";
import { clock } from "../shared/time";
import { Metrics, EmptyState } from "../shared/ui";
import { TIME_SLOTS, getProgramType } from "./term-calendar-model";
import { ClassCard } from "./term-class-card";
import type { Event, Room } from "./term-calendar-types";

export function TermCalendar({ events, rooms }: { events: Event[]; rooms: Room[] }) {
  const [viewMode, setViewMode] = useState<"matrix" | "room">("matrix");
  const [cohort, setCohort] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [teacher, setTeacher] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [cellModal, setCellModal] = useState<{
    day: number;
    slot: (typeof TIME_SLOTS)[0];
    classes: Event[];
  } | null>(null);

  const selected = events.filter((e) => {
    const matchCohort = !cohort || e.cohort === cohort;
    const matchTeacher = !teacher || e.teacher === teacher;
    const matchRoom = !roomFilter || e.room_id === roomFilter;
    const matchDay = !dayFilter || e.day === Number(dayFilter);
    const pType = getProgramType(e);
    const matchProgram =
      programFilter === "all" ||
      (programFilter === "CLC" && pType === "CLC") ||
      (programFilter === "MME" && pType === "MME") ||
      (programFilter === "STANDARD" && pType === "STANDARD");
    return matchCohort && matchTeacher && matchRoom && matchDay && matchProgram;
  });

  const days = dayFilter
    ? [Number(dayFilter)]
    : [2, 3, 4, 5, 6, 7];

  const activeRooms = rooms.filter((r) =>
    selected.some((e) => e.room_id === r.id)
  );

  const clcCount = events.filter((e) => getProgramType(e) === "CLC").length;
  const mmeCount = events.filter((e) => getProgramType(e) === "MME").length;
  const stdCount = events.filter((e) => getProgramType(e) === "STANDARD").length;

  return (
    <>
      <Metrics
        items={[
          { label: "Tổng số lớp đã xếp", value: events.length, detail: "Toàn bộ kế hoạch học kỳ" },
          { label: "Lớp CLC (Màu xanh)", value: clcCount, detail: "Chất lượng cao", tone: "text-primary" },
          { label: "Lớp MME (Màu cam)", value: mmeCount, detail: "Truyền thông ĐPT", tone: "text-warning" },
          { label: "Lớp Đại trà (Chuẩn)", value: stdCount, detail: "Chương trình tiêu chuẩn" },
        ]}
      />

      <section className="card term-calendar">
        <div className="section-heading" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2>Thời khóa biểu toàn học kỳ</h2>
            <p>
              Hiển thị lưới học kỳ theo ma trận thứ và ca học · {selected.length}/{events.length} lớp học phần
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                📅 Ma trận Thứ × Ca học (Mẫu chuẩn)
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
            <span className="badge success">Đã công bố</span>
          </div>
        </div>

        {/* Legend: Visual Color coding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "10px 14px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid var(--line)",
            fontSize: "12px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--muted)" }}>Phân loại màu:</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                background: "#dbeafe",
                border: "1px solid #93c5fd",
                borderRadius: "3px",
              }}
            />
            <b>CLC</b>: Chất lượng cao ({clcCount})
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                background: "#ffedd5",
                border: "1px solid #fed7aa",
                borderRadius: "3px",
              }}
            />
            <b>MME</b>: Truyền thông đa phương tiện ({mmeCount})
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "3px",
              }}
            />
            <b>Đại trà</b>: Chương trình tiêu chuẩn ({stdCount})
          </div>
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
            {(programFilter !== "all" || cohort || teacher || roomFilter || dayFilter) && (
              <span className="filter-badge">● Đang lọc</span>
            )}
          </button>
          <div className={`filters term-filters-group ${showFilters ? "open" : ""}`} style={{ flexWrap: "wrap", gap: "10px" }}>
            <label>
              Chương trình
              <select
                aria-label="Lọc theo chương trình"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
              >
                <option value="all">Tất cả chương trình ({events.length})</option>
                <option value="CLC">Lớp CLC ({clcCount})</option>
                <option value="MME">Lớp MME ({mmeCount})</option>
                <option value="STANDARD">Lớp Đại trà ({stdCount})</option>
              </select>
            </label>
            <label>
              Khóa học
              <select
                aria-label="Khóa học"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
              >
                <option value="">Tất cả khóa học</option>
                {Array.from(new Set(events.map((e) => e.cohort).filter(Boolean)))
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
              <select
                aria-label="Giảng viên trong học kỳ"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
              >
                <option value="">Tất cả giảng viên</option>
                {Array.from(new Set(events.map((e) => e.teacher).filter(Boolean)))
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
              <select
                aria-label="Phòng học"
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
              >
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
              <select
                aria-label="Thứ trong tuần"
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
              >
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

        {!events.length ? (
          <EmptyState title="Chưa có lịch công bố">
            Hoàn tất xếp lịch và công bố để xem toàn học kỳ.
          </EmptyState>
        ) : viewMode === "matrix" ? (
          /* Ma trận Thứ × Ca học (Matrix View tương tự Excel mẫu Nhà trường) */
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
                      width: "120px",
                      position: "sticky",
                      left: 0,
                      top: 0,
                      background: "var(--surface)",
                      zIndex: 3,
                      borderRight: "2px solid var(--line)",
                    }}
                  >
                    Ca học / Giờ
                  </th>
                  {days.map((d) => (
                    <th
                      key={d}
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "var(--surface)",
                        zIndex: 2,
                        minWidth: "180px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "14px" }}>Thứ {d}</div>
                      <small style={{ color: "var(--muted)" }}>
                        {selected.filter((e) => e.day === d).length} lớp
                      </small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => {
                  return (
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
                        // Matches classes running in this slot on this day
                        const cellClasses = selected.filter(
                          (e) =>
                            e.day === d &&
                            e.start < slot.end &&
                            slot.start < e.end
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
                                  <ClassCard key={e.id} event={e} />
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
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Theo phòng học (Room grid view) */
          <div className="table-wrap term-table" style={{ maxHeight: "750px", overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th scope="col" style={{ width: "140px" }}>Phòng</th>
                  {days.map((d) => (
                    <th scope="col" key={d} style={{ textAlign: "center" }}>
                      Thứ {d}
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
                            const cardBg =
                              pType === "CLC"
                                ? "#dbeafe"
                                : pType === "MME"
                                ? "#ffedd5"
                                : "#ffffff";
                            const cardBorder =
                              pType === "CLC"
                                ? "#93c5fd"
                                : pType === "MME"
                                ? "#fed7aa"
                                : "#cbd5e1";

                            return (
                              <article
                                className="term-event"
                                key={e.id}
                                data-session={e.id}
                                style={{
                                  background: cardBg,
                                  border: `1px solid ${cardBorder}`,
                                  marginBottom: "4px",
                                }}
                                title={`${e.id} · ${e.cohort} · ${e.program}`}
                              >
                                <time>{clock(e.start)}–{clock(e.end)}</time>
                                <b>{e.course} - {e.section || e.id}</b>
                                <span>{e.teacher} · {e.cohort}</span>
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
                  <ClassCard key={e.id} event={e} />
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
