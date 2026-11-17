import { Icon } from "../shared/ui";
import { clock } from "../shared/time";
import { formatDateVN, formatShortDateVN } from "../shared/weeks";
import { getProgramType, getQldtBlockPalette } from "./term-calendar-model";
import type { Event, ColorRule } from "./term-calendar-types";

export function ClassCard({
  event: e,
  colorRules,
  compact = false,
  onClick,
}: {
  event: Event;
  colorRules?: ColorRule[];
  compact?: boolean;
  onClick?: () => void;
}) {
  const pType = getProgramType(e);
  const palette = getQldtBlockPalette(e, colorRules);
  const occ = e._occ;
  const isHolOff = occ?.status === "HOLIDAY_OFF";
  const isMakeupShift = occ?.status === "SHIFTED_NEXT_WEEK" || occ?.status === "MAKEUP_EXTENSION";
  const effStart = occ?.effectiveStartDate || e.start_date || "";
  const effEnd = occ?.effectiveEndDate || e.end_date || "";
  const dayTxt = e.day === 8 ? "Chủ Nhật" : `Thứ ${e.day}`;

  const rawCohort = (e.cohort || "").replace(/^K/i, "");
  const sectionText = [e.section || "01", rawCohort].filter(Boolean).join(".");

  const tooltipLines = [
    `Mã MH: ${e.course || e.id}`,
    e.course_name ? `Tên môn: ${e.course_name}` : "",
    `Nhóm: ${sectionText}${e.kind ? ` (${e.kind})` : ""}`,
    `Hệ: ${pType}`,
    `Phòng: ${e.room_id || e.room || "Chưa gán"}`,
    `Giảng viên: ${e.teacher || "Chưa phân công"}`,
    e.students !== undefined ? `Sĩ số: ${e.students} SV` : "",
    `Khung giờ: ${dayTxt} (${clock(e.start)} → ${clock(e.end)})`,
    effStart && effEnd
      ? `Thời gian học: ${formatDateVN(effStart)} → ${formatDateVN(effEnd)}${
          occ && occ.extraWeeks > 0 ? ` (+${occ.extraWeeks} tuần bù lễ ${occ.holidayName})` : ""
        }`
      : "",
    isHolOff
      ? `Nghỉ lễ: ${occ?.holidayName} → Học bù ${dayTxt} tuần sau (${formatDateVN(occ?.makeupNextDate)})`
      : "",
    isMakeupShift ? `Buổi học bù lễ: ${occ?.holidayName}` : "",
    palette.note ? `Ghi chú màu: ${palette.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (compact) {
    return (
      <div
        title={tooltipLines}
        onClick={onClick}
        className="qldt-course-block is-compact"
        style={{
          background: palette.bg,
          borderColor: palette.border,
          borderStyle: isHolOff ? "dashed" : "solid",
          color: palette.text,
          cursor: onClick ? "pointer" : "default",
        }}
      >
        <div className="qldt-course-title">
          {e.course_name ? `${e.course_name} (${e.course || e.id})` : e.course || e.id}
        </div>
        <div className="qldt-course-meta">
          <strong>P.{e.room_id || e.room || "—"}</strong> · GV: {e.teacher || "—"}
        </div>
        <div className="qldt-course-time">
          <span style={{ color: palette.accent, display: "inline-flex", alignItems: "center" }}>
            <Icon name="clock" size={11} />
          </span>
          <span>
            {clock(e.start)} → {clock(e.end)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      title={tooltipLines}
      onClick={onClick}
      className="qldt-course-block"
      style={{
        background: palette.bg,
        borderColor: palette.border,
        borderStyle: isHolOff ? "dashed" : "solid",
        color: palette.text,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div className="qldt-course-title">
        {e.course_name ? `${e.course_name} (${e.course || e.id})` : e.course || e.id}
      </div>

      <div className="qldt-course-meta">
        <strong>Nhóm:</strong> {sectionText}
        {pType !== "STANDARD" ? ` · ${pType}` : ""}
      </div>

      <div className="qldt-course-meta">
        <strong>Phòng:</strong> {e.room_id || e.room || "Chưa gán"}
      </div>

      <div className="qldt-course-meta">
        <strong>GV:</strong> {e.teacher || "Chưa phân công"}
      </div>

      {palette.note && (
        <div className="qldt-course-meta" style={{ fontStyle: "italic" }}>
          📌 {palette.note}
        </div>
      )}

      {isHolOff && (
        <span
          className="qldt-status-pill"
          style={{ background: "#ffe4e6", color: "#9f1239", border: "1px solid #fda4af" }}
        >
          Nghỉ lễ · Bù {formatShortDateVN(occ?.makeupNextDate)}
        </span>
      )}

      {isMakeupShift && (
        <span
          className="qldt-status-pill"
          style={{ background: "#f3e8ff", color: "#6d28d9", border: "1px solid #d8b4fe" }}
        >
          Dạy bù lễ{occ?.sessionNumber && occ?.totalSessions ? ` (${occ.sessionNumber}/${occ.totalSessions})` : ""}
        </span>
      )}

      <div className="qldt-course-time">
        <span style={{ color: palette.accent, display: "inline-flex", alignItems: "center" }}>
          <Icon name="clock" size={12} />
        </span>
        <span>
          {clock(e.start)} → {clock(e.end)}
        </span>
      </div>
    </div>
  );
}
