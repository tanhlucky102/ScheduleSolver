import { clock } from "../shared/time";
import { getProgramType } from "./term-calendar-model";
import type { Event } from "./term-calendar-types";

export function ClassCard({ event: e }: { event: Event }) {
  const pType = getProgramType(e);
  const isCLC = pType === "CLC";
  const isMME = pType === "MME";

  const cardBg = isCLC ? "#dbeafe" : isMME ? "#ffedd5" : "#ffffff";
  const cardBorder = isCLC ? "#93c5fd" : isMME ? "#fed7aa" : "#cbd5e1";
  const cardText = isCLC ? "#1e3a8a" : isMME ? "#7c2d12" : "#0f172a";
  const badgeBg = isCLC ? "#bfdbfe" : isMME ? "#ffedd5" : "#f1f5f9";

  return (
    <div
      key={e.id}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: "6px",
        padding: "6px 8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        fontSize: "11px",
        lineHeight: 1.35,
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
        <b style={{ color: cardText, fontSize: "11.5px" }}>
          {e.course || e.id}
          {e.section ? ` - ${e.section}` : ""}
        </b>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            padding: "1px 4px",
            borderRadius: "3px",
            background: badgeBg,
            color: cardText,
          }}
        >
          {pType}
        </span>
      </div>

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
            background: "rgba(0,0,0,0.06)",
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

      {e.cohort && (
        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
          {e.cohort} · {clock(e.start)}–{clock(e.end)}
        </div>
      )}
    </div>
  );
}
