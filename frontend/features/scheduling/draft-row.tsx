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
        <b>{session.course}</b>
        <small>{session.id}</small>
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
