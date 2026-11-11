import { clock } from "../shared/time";
import { formatDateVN, formatShortDateVN } from "../shared/weeks";
import { getProgramType, resolveRule } from "./term-calendar-model";
import type { Event, ColorRule } from "./term-calendar-types";

export function ClassCard({
  event: e,
  colorRules,
}: {
  event: Event;
  colorRules?: ColorRule[];
}) {
  const pType = getProgramType(e);
  const progRule = resolveRule("PROGRAM", pType, colorRules);
  const kindRule = e.kind ? resolveRule("KIND", e.kind, colorRules) : null;
  const occ = e._occ;
  const isHolOff = occ?.status === "HOLIDAY_OFF";
  const isMakeupShift = occ?.status === "SHIFTED_NEXT_WEEK" || occ?.status === "MAKEUP_EXTENSION";
  const effStart = occ?.effectiveStartDate || e.start_date;
  const effEnd = occ?.effectiveEndDate || e.end_date;
  const dayTxt = e.day === 8 ? "CN" : `Thứ ${e.day}`;

  const shortSpan =
    effStart && effEnd
      ? `${formatShortDateVN(effStart)}–${formatShortDateVN(effEnd)}${occ && occ.extraWeeks > 0 ? ` (+${occ.extraWeeks}t bù)` : ""}`
      : effStart
      ? `Từ ${formatShortDateVN(effStart)}`
      : "";

  const tooltipLines = [
    `Mã MH: ${e.course || e.id}`,
    e.course_name ? `Tên môn: ${e.course_name}` : "",
    e.section ? `Nhóm: ${e.section}` : "",
    e.kind ? `Loại buổi: ${e.kind}` : "",
    e.periods !== undefined ? `Số tiết: ${e.periods}` : "",
    `Phòng: ${e.room_id || e.room || "Chưa gán"}`,
    `Giảng viên: ${e.teacher || "Chưa gán"}`,
    e.students !== undefined ? `Sĩ số: ${e.students} SV` : "",
    `Khung giờ: ${dayTxt} (${clock(e.start)} → ${clock(e.end)})`,
    effStart || effEnd
      ? `Thời gian thực học: ${formatDateVN(effStart)} → ${formatDateVN(effEnd)}${occ && occ.extraWeeks > 0 ? ` (+${occ.extraWeeks} tuần học bù lễ ${occ.holidayName})` : ""}`
      : "",
    isHolOff
      ? `🎌 Nghỉ lễ: ${occ?.holidayName} → Học bù ${dayTxt} tuần sau (${formatDateVN(occ?.makeupNextDate)})`
      : "",
    isMakeupShift ? `🔄 Học bù lễ: ${occ?.holidayName}` : "",
    progRule.note ? `Note: ${progRule.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div
      key={e.id}
      title={tooltipLines}
      style={{
        background: isHolOff ? "#fff1f2" : progRule.bg_color,
        border: isHolOff ? "1px dashed #fb7185" : `1px solid ${progRule.border_color}`,
        borderRadius: "6px",
        padding: "6px 8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        fontSize: "11px",
        lineHeight: 1.35,
        opacity: isHolOff ? 0.92 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "4px",
        }}
      >
        <b style={{ color: isHolOff ? "#9f1239" : progRule.text_color, fontSize: "11.5px" }}>
          {e.course || e.id}
          {e.section ? ` - N${e.section}` : ""}
        </b>
        <div style={{ display: "inline-flex", gap: "3px", flexShrink: 0 }}>
          {kindRule && (
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                padding: "1px 4px",
                borderRadius: "3px",
                background: kindRule.bg_color,
                color: kindRule.text_color,
                border: `1px solid ${kindRule.border_color}`,
              }}
            >
              {e.kind}
            </span>
          )}
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              padding: "1px 4px",
              borderRadius: "3px",
              background: "rgba(15,23,42,0.07)",
              color: progRule.text_color,
            }}
          >
            {pType}
          </span>
        </div>
      </div>

      {e.course_name && (
        <div
          style={{
            fontSize: "10.5px",
            color: "#334155",
            marginTop: "1px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {e.course_name}
        </div>
      )}

      {isHolOff && (
        <div
          style={{
            marginTop: "3px",
            padding: "2px 5px",
            borderRadius: "4px",
            background: "#ffe4e6",
            color: "#9f1239",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          🎌 Nghỉ lễ ({occ?.holidayName}) → Bù {dayTxt} tuần sau ({formatShortDateVN(occ?.makeupNextDate)})
        </div>
      )}

      {isMakeupShift && (
        <div
          style={{
            marginTop: "3px",
            padding: "2px 5px",
            borderRadius: "4px",
            background: "#f3e8ff",
            color: "#6d28d9",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          🔄 Học bù lễ {occ?.holidayName}
          {occ?.sessionNumber && occ?.totalSessions ? ` (${occ.sessionNumber}/${occ.totalSessions})` : ""}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "3px",
          color: "#334155",
        }}
      >
        <span style={{ fontWeight: 600 }}>{e.teacher || "Chưa gán"}</span>
        <span
          style={{
            background: "rgba(0,0,0,0.07)",
            padding: "1px 5px",
            borderRadius: "4px",
            fontWeight: 700,
            fontSize: "11px",
            color: "#1e293b",
          }}
        >
          {e.room_id || e.room || "Chưa có phòng"}
        </span>
      </div>

      <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px", display: "flex", justifyContent: "space-between", gap: "4px", flexWrap: "wrap" }}>
        <span>
          {e.cohort ? `K${e.cohort} · ` : ""}
          {clock(e.start)}–{clock(e.end)}
          {e.periods ? ` (${e.periods}t)` : ""}
        </span>
        {shortSpan ? <span>📅 {shortSpan}</span> : e.students !== undefined ? <span>{e.students} SV</span> : null}
      </div>
    </div>
  );
}
