"use client";
import { memo } from "react";
import type { Session, Placement } from "../workspace/types";

type DraftRowProps = {
  session: Session;
  placement?: Placement;
  slotOptions?: React.ReactNode;
  roomOptions?: React.ReactNode;
  busy: boolean;
  hasRooms: boolean;
  hasSlots: boolean;
  firstRoomId?: string;
  onSlotChange: (sessionId: string, slot: number, roomId?: string) => void;
  onRoomChange: (sessionId: string, slot: number, roomId: string) => void;
};

export const DraftRow = memo(function DraftRow({
  session,
  placement,
  slotOptions,
  roomOptions,
  busy,
  hasRooms,
  hasSlots,
  firstRoomId,
  onSlotChange,
  onRoomChange,
}: DraftRowProps) {
  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <b>{session.course}</b>
          {session.kind && (
            <span
              className="badge neutral"
              style={{ fontSize: "10px", padding: "1px 6px" }}
            >
              {session.kind}
            </span>
          )}
        </div>
        <small style={{ display: "block", color: "var(--muted)" }}>
          {session.id}
          {session.teacher ? ` · GV: ${session.teacher}` : ""}
          {session.students ? ` · ${session.students} SV` : ""}
        </small>
      </td>
      <td>
        <select
          aria-label={"Khung giờ cho " + session.id}
          disabled={busy || !hasRooms}
          value={placement?.slot ?? ""}
          onChange={(e) =>
            onSlotChange(session.id, Number(e.target.value), placement?.room_id ?? firstRoomId)
          }
        >
          <option value="" disabled>
            Chưa xếp
          </option>
          {slotOptions}
        </select>
      </td>
      <td>
        <select
          aria-label={"Phòng cho " + session.id}
          disabled={busy || !hasSlots}
          value={placement?.room_id ?? ""}
          onChange={(e) =>
            onRoomChange(session.id, placement?.slot ?? 0, e.target.value)
          }
        >
          <option value="" disabled>
            Chọn phòng
          </option>
          {roomOptions}
        </select>
      </td>
    </tr>
  );
});
