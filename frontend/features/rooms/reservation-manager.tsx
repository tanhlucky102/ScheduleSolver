"use client";
import { useState } from "react";
import type { Room, Reservation } from "./types";
import { ActionButton, Icon } from "../shared/ui";
import { clock, minutes } from "../shared/time";

export function ReservationManager({
  initial,
  reservations,
  disabled,
  onCommand,
}: {
  initial: Room[];
  reservations: Reservation[];
  disabled: boolean;
  onCommand: (action: string, payload: unknown) => Promise<void>;
}) {
  const [booking, setBooking] = useState({
    id: "",
    room_id: "",
    day: 2,
    start: "07:00",
    end: "09:00",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
          gap: "8px",
        }}
      >
        <h3 style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Icon name="calendar" size={16} />
          <span>Lịch chiếm dụng phòng định kỳ ({reservations.length})</span>
        </h3>
      </div>
      <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 12px 0" }}>
        Chặn phòng vào các buổi cố định trong học kỳ (hội nghị, bảo trì, sự kiện...). Lịch đã công bố được tự động bảo vệ.
      </p>

      {reservations.length === 0 ? (
        <div
          style={{
            padding: "14px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px dashed var(--line)",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "12.5px",
          }}
        >
          Chưa có lịch chiếm dụng phòng nào được khai báo.
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: "8px" }}>
          <table style={{ width: "100%", fontSize: "12.5px" }}>
            <thead>
              <tr>
                <th style={{ width: "140px" }}>Mã &amp; Phòng</th>
                <th style={{ width: "150px" }}>Thời gian</th>
                <th>Lý do chiếm dụng</th>
                <th style={{ width: "130px", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="badge neutral" style={{ fontWeight: 600 }}>
                      Phòng {r.room_id}
                    </span>
                    <small style={{ display: "block", color: "var(--muted)", marginTop: "2px" }}>
                      {r.id}
                    </small>
                  </td>
                  <td>
                    <b>{r.day === 8 ? "Chủ nhật" : `Thứ ${r.day}`}</b>
                    <small style={{ display: "block", color: "var(--muted)" }}>
                      {clock(r.start)} – {clock(r.end)}
                    </small>
                  </td>
                  <td>
                    <span>{r.reason}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <ActionButton
                      type="button"
                      variant="danger"
                      icon="trash"
                      loading={deletingId === r.id}
                      disabled={disabled}
                      style={{ minHeight: "30px", padding: "4px 10px", fontSize: "11.5px" }}
                      onClick={() => {
                        setDeletingId(r.id);
                        void onCommand("reservation-delete", { id: r.id }).finally(() =>
                          setDeletingId(null)
                        );
                      }}
                    >
                      Giải phóng
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details
        className="reservation-panel"
        style={{
          marginTop: "12px",
          background: "#f8fafc",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid var(--line)",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 600,
            color: "var(--accent)",
            fontSize: "13px",
          }}
        >
          Thêm lịch chiếm dụng mới
        </summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSaving(true);
            void onCommand("reservation", {
              ...booking,
              start: minutes(booking.start),
              end: minutes(booking.end),
            })
              .then(() => {
                setBooking((prev) => ({ ...prev, id: "", reason: "" }));
              })
              .finally(() => setSaving(false));
          }}
          style={{ marginTop: "12px" }}
        >
          <fieldset disabled={disabled || saving} style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="editor-row">
              <label>
                <span>Mã đặt phòng</span>
                <input
                  required
                  value={booking.id}
                  onChange={(e) => setBooking({ ...booking, id: e.target.value })}
                  placeholder="VD: EVENT-01"
                />
              </label>
              <label>
                <span>Phòng</span>
                <select
                  required
                  value={booking.room_id}
                  onChange={(e) => setBooking({ ...booking, room_id: e.target.value })}
                >
                  <option value="">Chọn phòng</option>
                  {initial.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} ({r.name})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Thứ</span>
                <select
                  value={booking.day}
                  onChange={(e) => setBooking({ ...booking, day: Number(e.target.value) })}
                >
                  {Array.from({ length: 7 }, (_, i) => i + 2).map((d) => (
                    <option key={d} value={d}>
                      {d === 8 ? "Chủ nhật" : "Thứ " + d}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="editor-row">
              {(["start", "end"] as const).map((k) => (
                <label key={k}>
                  <span>{k === "start" ? "Bắt đầu" : "Kết thúc"}</span>
                  <input
                    type="time"
                    required
                    value={booking[k]}
                    onChange={(e) => setBooking({ ...booking, [k]: e.target.value })}
                  />
                </label>
              ))}
              <label style={{ flex: 2 }}>
                <span>Lý do chiếm dụng</span>
                <input
                  required
                  value={booking.reason}
                  onChange={(e) => setBooking({ ...booking, reason: e.target.value })}
                  placeholder="VD: Sinh hoạt chuyên môn khoa"
                />
              </label>
            </div>
            <ActionButton
              type="submit"
              variant="primary"
              icon="check"
              loading={saving}
              loadingLabel="Đang lưu..."
              style={{ marginTop: "8px" }}
            >
              Xác nhận chiếm dụng
            </ActionButton>
          </fieldset>
        </form>
      </details>
    </div>
  );
}
