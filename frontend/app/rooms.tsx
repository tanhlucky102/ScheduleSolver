"use client";
import { useState } from "react";

export type Window = { day: number; start: number; end: number; evening?: boolean };
export type Room = {
  id: string;
  name: string;
  capacity: number;
  room_type: string;
  equipment: string[];
  availability: Window[];
  active: boolean;
  allowed_departments: string[];
  allowed_programs: ("STANDARD" | "CLC" | "TT")[];
  allowed_courses: string[];
  note: string;
};
export type Reservation = Window & { id: string; room_id: string; reason: string };

const clock = (m: number) =>
  String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const minutes = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
const values = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

// Default availability: Monday to Saturday from 07:00 (420) to 18:00 (1080)
const defaultWeeklyAvailability: Window[] = Array.from({ length: 6 }, (_, i) => ({
  day: i + 2,
  start: 420,
  end: 1080,
  evening: false,
}));

const emptyRoom = (preset: "PROJECTOR" | "COMPUTER" = "PROJECTOR"): Room => ({
  id: "",
  name: preset === "PROJECTOR" ? "Phòng máy chiếu" : "Phòng máy tính",
  capacity: preset === "PROJECTOR" ? 100 : 45,
  room_type: preset,
  equipment: preset === "PROJECTOR" ? ["PROJECTOR"] : ["COMPUTER", "PROJECTOR"],
  availability: structuredClone(defaultWeeklyAvailability),
  active: true,
  allowed_departments: [],
  allowed_programs: [],
  allowed_courses: [],
  note: preset === "PROJECTOR" ? "Phòng máy chiếu phục vụ LEC" : "Phòng máy tính phục vụ TUT",
});

function Windows({ items, onChange }: { items: Window[]; onChange: (v: Window[]) => void }) {
  return (
    <fieldset>
      <legend>Khung thời gian khả dụng hằng tuần ({items.length} khung)</legend>
      <div style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
        {items.map((w, i) => (
          <div className="editor-row" key={i}>
            <label style={{ flex: 1 }}>
              <span>Thứ</span>
              <select
                value={w.day}
                onChange={(e) =>
                  onChange(items.map((v, j) => (j === i ? { ...v, day: Number(e.target.value) } : v)))
                }
              >
                {Array.from({ length: 7 }, (_, k) => k + 2).map((d) => (
                  <option key={d} value={d}>
                    {d === 8 ? "Chủ nhật" : "Thứ " + d}
                  </option>
                ))}
              </select>
            </label>
            {(["start", "end"] as const).map((k) => (
              <label key={k} style={{ flex: 1 }}>
                <span>{k === "start" ? "Từ" : "Đến"}</span>
                <input
                  required
                  type="time"
                  value={clock(w[k])}
                  onChange={(e) =>
                    onChange(items.map((v, j) => (j === i ? { ...v, [k]: minutes(e.target.value) } : v)))
                  }
                />
              </label>
            ))}
            <button
              className="btn-remove"
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              Bỏ
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button
          type="button"
          onClick={() => onChange([...items, { day: 2, start: 420, end: 1080 }])}
        >
          + Thêm khung giờ
        </button>
        <button
          type="button"
          onClick={() => onChange(structuredClone(defaultWeeklyAvailability))}
        >
          Đặt lại khung chuẩn (T2–T7 07:00–18:00)
        </button>
      </div>
    </fieldset>
  );
}

export function RoomManager({
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
  const [room, setRoom] = useState<Room>(emptyRoom("PROJECTOR"));
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editing, setEditing] = useState(false);
  const [equipStr, setEquipStr] = useState("PROJECTOR");
  const [deptStr, setDeptStr] = useState("");
  const [courseStr, setCourseStr] = useState("");
  const [booking, setBooking] = useState({ id: "", room_id: "", day: 2, start: "07:00", end: "09:00", reason: "" });
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());

  const filtered = initial.filter((r) => {
    const matchType =
      typeFilter === "all" ||
      (typeFilter === "PROJECTOR" && (r.room_type === "PROJECTOR" || r.room_type === "Phòng máy chiếu")) ||
      (typeFilter === "COMPUTER" && (r.room_type === "COMPUTER" || r.room_type === "Phòng máy tính"));
    const matchSearch = (r.id + " " + r.name + " " + r.room_type).toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const toggleSelectAll = () => {
    if (selectedRoomIds.size === filtered.length && filtered.length > 0) {
      setSelectedRoomIds(new Set());
    } else {
      setSelectedRoomIds(new Set(filtered.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedRoomIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRoomIds(next);
  };

  const handleBulkDelete = async () => {
    if (selectedRoomIds.size === 0) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedRoomIds.size} phòng đã chọn? Các phòng này sẽ được gỡ khỏi hệ thống.`
      )
    )
      return;
    const toDelete = Array.from(selectedRoomIds);
    await onCommand("rooms-delete", { ids: toDelete });
    setSelectedRoomIds(new Set());
  };

  const handleOpenAdd = (preset: "PROJECTOR" | "COMPUTER" = "PROJECTOR") => {
    const fresh = emptyRoom(preset);
    setRoom(fresh);
    setEquipStr(fresh.equipment.join(", "));
    setDeptStr("");
    setCourseStr("");
    setEditing(false);
    setFormOpen(true);
  };

  const handleOpenEdit = (r: Room) => {
    setRoom(structuredClone(r));
    setEquipStr(r.equipment.join(", "));
    setDeptStr(r.allowed_departments.join(", "));
    setCourseStr(r.allowed_courses.join(", "));
    setEditing(true);
    setFormOpen(true);
  };

  const handleSubmitRoom = async () => {
    if (!room.id.trim() || !room.name.trim() || room.capacity <= 0) return;
    const finalRoom: Room = {
      ...room,
      id: room.id.trim(),
      name: room.name.trim(),
      equipment: values(equipStr),
      allowed_departments: values(deptStr),
      allowed_courses: values(courseStr),
    };
    const updated = editing
      ? initial.map((r) => (r.id === finalRoom.id ? finalRoom : r))
      : [...initial.filter((r) => r.id !== finalRoom.id), finalRoom];

    await onCommand("rooms", { rooms: updated });
    setFormOpen(false);
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const tenIdx = headers.findIndex((h) => h.includes("ten") || h.includes("phong") || h === "id");
      const tinhChatIdx = headers.findIndex((h) => h.includes("tinh_chat") || h.includes("type") || h.includes("loai"));
      const sucChuaIdx = headers.findIndex((h) => h.includes("suc_chua") || h.includes("cap"));

      const newRooms: Room[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        const id = parts[tenIdx >= 0 ? tenIdx : 0];
        if (!id) continue;
        const tinhChat = (parts[tinhChatIdx >= 0 ? tinhChatIdx : 1] || "").toLowerCase();
        const capVal = parts[sucChuaIdx >= 0 ? sucChuaIdx : 2];
        const cap = Number(capVal) || (tinhChat.includes("chiếu") || tinhChat.includes("projector") ? 150 : 45);

        const isComp = tinhChat.includes("máy tính") || tinhChat.includes("computer");
        const isProj = tinhChat.includes("máy chiếu") || tinhChat.includes("projector");
        const equip = isComp && isProj ? ["COMPUTER", "PROJECTOR"] : isComp ? ["COMPUTER", "PROJECTOR"] : ["PROJECTOR"];

        newRooms.push({
          id,
          name: `Phòng ${id}`,
          capacity: cap,
          room_type: isComp ? "COMPUTER" : "PROJECTOR",
          equipment: equip,
          availability: structuredClone(defaultWeeklyAvailability),
          active: true,
          allowed_departments: [],
          allowed_programs: [],
          allowed_courses: [],
          note: isComp && isProj ? `Phòng ${id} đa năng` : isComp ? `Phòng máy tính ${id} phục vụ TUT` : `Phòng máy chiếu ${id} phục vụ LEC`,
        });
      }
      if (newRooms.length) {
        const existingMap = new Map(initial.map((r) => [r.id, r]));
        for (const r of newRooms) {
          existingMap.set(r.id, r);
        }
        await onCommand("rooms", { rooms: Array.from(existingMap.values()) });
      }
    } finally {
      e.target.value = "";
    }
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Quản lý phòng học & lịch chiếm dụng ({initial.length} phòng)</h2>
          <p>
            Khai báo phòng thực tế, thiết bị và khả dụng tuần. Quy tắc nghiệp vụ: Phòng máy tính phục vụ Thực hành (TUT), Phòng máy chiếu phục vụ Lý thuyết (LEC).
          </p>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 0, gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px" }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã phòng hoặc tên phòng..."
            style={{ minHeight: "36px", height: "36px", flex: 2 }}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ minHeight: "36px", height: "36px", flex: 1 }}
          >
            <option value="all">Tất cả loại phòng</option>
            <option value="PROJECTOR">Phòng máy chiếu (LEC)</option>
            <option value="COMPUTER">Phòng máy tính (TUT)</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {selectedRoomIds.size > 0 && (
            <button
              type="button"
              className="btn-remove"
              disabled={disabled}
              onClick={handleBulkDelete}
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                borderColor: "#fca5a5",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
                minHeight: "36px",
                padding: "0 14px",
              }}
            >
              <span>🗑️</span>
              <span>Xóa đã chọn ({selectedRoomIds.size})</span>
            </button>
          )}
          {initial.length === 0 && (
            <button
              disabled={disabled}
              onClick={() => onCommand("rooms-preset", {})}
              style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
            >
              ⚡ Nạp 25 phòng chuẩn TKB (từ so_phong.csv)
            </button>
          )}
          <label
            className="button"
            style={{
              margin: 0,
              cursor: disabled ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "36px",
              padding: "0 12px",
              fontSize: "12px",
              background: "#f8fafc",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              fontWeight: 500,
            }}
          >
            📂 Nhập phòng từ CSV
            <input
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              disabled={disabled}
              onChange={handleImportCsv}
            />
          </label>
          <button
            className="primary"
            disabled={disabled}
            onClick={() => handleOpenAdd("PROJECTOR")}
          >
            + Nhập phòng mới
          </button>
        </div>
      </div>

      <div className="table-wrap table-scroll" style={{ maxHeight: "450px" }}>
        <table>
          <thead>
            <tr>
              <th scope="col" style={{ width: "44px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả phòng"
                  checked={filtered.length > 0 && selectedRoomIds.size === filtered.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th scope="col" style={{ width: "160px" }}>Mã & Tên phòng</th>
              <th style={{ width: "100px" }}>Sức chứa</th>
              <th>Loại & Thiết bị</th>
              <th style={{ width: "120px" }}>Khả dụng</th>
              <th style={{ width: "120px" }}>Trạng thái</th>
              <th style={{ width: "150px", textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "var(--muted)" }}>
                  {initial.length === 0
                    ? "Chưa có phòng học nào được khai báo. Hãy nhấn '+ Nhập phòng mới', '📂 Nhập phòng từ CSV' hoặc '⚡ Nạp 25 phòng chuẩn' để bắt đầu."
                    : "Không tìm thấy phòng phù hợp với điều kiện lọc."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      aria-label={`Chọn phòng ${r.id}`}
                      checked={selectedRoomIds.has(r.id)}
                      onChange={() => toggleSelectOne(r.id)}
                    />
                  </td>
                  <td>
                    <b>{r.id}</b>
                    <small>{r.name}</small>
                  </td>
                  <td>
                    <b>{r.capacity}</b> <span style={{ fontSize: "11px", color: "var(--muted)" }}>chỗ</span>
                  </td>
                  <td>
                    <span className={"badge " + (r.room_type === "COMPUTER" ? "neutral" : "success")}>
                      {r.room_type === "COMPUTER" ? "Phòng máy tính" : "Phòng máy chiếu"}
                    </span>
                    <small style={{ marginTop: "3px" }}>
                      {r.equipment.join(", ") || "Chưa khai báo thiết bị"}
                    </small>
                  </td>
                  <td>
                    <span className="badge neutral">{r.availability.length} khung</span>
                  </td>
                  <td>
                    <span className={"badge " + (r.active ? "success" : "danger")}>
                      {r.active ? "Đang sử dụng" : "Tạm ngưng"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      disabled={disabled}
                      style={{ marginRight: "6px", minHeight: "32px", padding: "4px 10px" }}
                      onClick={() => handleOpenEdit(r)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn-remove"
                      disabled={disabled}
                      style={{ minHeight: "32px", padding: "4px 10px" }}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Bạn có chắc chắn muốn xóa phòng ${r.id}? Phòng sẽ được gỡ khỏi danh sách.`
                          )
                        ) {
                          void onCommand("rooms", { rooms: initial.filter((x) => x.id !== r.id) });
                        }
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal / Form thêm & sửa phòng học */}
      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="modal-card" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? `Chỉnh sửa phòng ${room.id}` : "Thêm phòng học mới"}</h3>
              <button className="modal-close" onClick={() => setFormOpen(false)}>
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmitRoom();
              }}
            >
              {!editing && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "14px", background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", alignSelf: "center" }}>Mẫu phòng:</span>
                  <button
                    type="button"
                    style={{ minHeight: "30px", padding: "3px 10px", fontSize: "11px" }}
                    onClick={() => {
                      const p = emptyRoom("PROJECTOR");
                      setRoom({ ...p, id: room.id });
                      setEquipStr("PROJECTOR");
                    }}
                  >
                    Phòng máy chiếu (LEC)
                  </button>
                  <button
                    type="button"
                    style={{ minHeight: "30px", padding: "3px 10px", fontSize: "11px" }}
                    onClick={() => {
                      const p = emptyRoom("COMPUTER");
                      setRoom({ ...p, id: room.id });
                      setEquipStr("COMPUTER, PROJECTOR");
                    }}
                  >
                    Phòng máy tính (TUT)
                  </button>
                </div>
              )}

              <div className="editor-row">
                <label>
                  <span>Mã phòng</span>
                  <input
                    required
                    disabled={editing}
                    value={room.id}
                    onChange={(e) => setRoom({ ...room, id: e.target.value.toUpperCase() })}
                    placeholder="VD: P101, LAB01"
                  />
                </label>
                <label>
                  <span>Tên phòng</span>
                  <input
                    required
                    value={room.name}
                    onChange={(e) => setRoom({ ...room, name: e.target.value })}
                    placeholder="VD: Phòng máy chiếu 101"
                  />
                </label>
              </div>

              <div className="editor-row">
                <label>
                  <span>Sức chứa chỗ ngồi</span>
                  <input
                    required
                    type="number"
                    min={1}
                    max={10000}
                    value={room.capacity || ""}
                    onChange={(e) => setRoom({ ...room, capacity: Number(e.target.value) })}
                  />
                </label>
                <label>
                  <span>Loại phòng nghiệp vụ</span>
                  <select
                    value={room.room_type}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRoom({
                        ...room,
                        room_type: val,
                        equipment: val === "COMPUTER" ? ["COMPUTER", "PROJECTOR"] : ["PROJECTOR"],
                      });
                      setEquipStr(val === "COMPUTER" ? "COMPUTER, PROJECTOR" : "PROJECTOR");
                    }}
                  >
                    <option value="PROJECTOR">Phòng máy chiếu (PROJECTOR - phục vụ LEC)</option>
                    <option value="COMPUTER">Phòng máy tính (COMPUTER - phục vụ TUT)</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Thiết bị trong phòng (cách nhau bằng dấu phẩy)</span>
                <input
                  value={equipStr}
                  onChange={(e) => setEquipStr(e.target.value)}
                  placeholder="VD: PROJECTOR, COMPUTER"
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  checked={room.active}
                  onChange={(e) => setRoom({ ...room, active: e.target.checked })}
                />
                <span>Đang sẵn sàng sử dụng (Active)</span>
              </label>

              <Windows
                items={room.availability}
                onChange={(availability) => setRoom({ ...room, availability })}
              />

              <label>
                <span>Ghi chú vận hành</span>
                <input
                  value={room.note}
                  onChange={(e) => setRoom({ ...room, note: e.target.value })}
                  placeholder="Ghi chú thêm (không phải ràng buộc lập lịch)"
                />
              </label>

              <div className="actions" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setFormOpen(false)}>
                  Hủy
                </button>
                <button className="primary" type="submit">
                  {editing ? "Lưu thay đổi phòng" : "Thêm phòng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chiếm dụng phòng */}
      <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <h3 style={{ margin: 0 }}>Lịch chiếm dụng phòng định kỳ ({reservations.length})</h3>
        </div>
        <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 14px 0" }}>
          Chặn phòng vào một số buổi cố định trong học kỳ (hội nghị, bảo trì, sự kiện...). Lịch đã công bố được tự động bảo vệ.
        </p>

        {reservations.length === 0 ? (
          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed var(--line)", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
            Chưa có lịch chiếm dụng phòng nào được khai báo.
          </div>
        ) : (
          <div className="table-wrap" style={{ marginTop: "10px" }}>
            <table style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr>
                  <th style={{ width: "130px" }}>Mã & Phòng</th>
                  <th style={{ width: "140px" }}>Thời gian</th>
                  <th>Lý do chiếm dụng</th>
                  <th style={{ width: "120px", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="badge neutral" style={{ fontWeight: 600 }}>Phòng {r.room_id}</span>
                      <small style={{ display: "block", color: "var(--muted)", marginTop: "2px" }}>{r.id}</small>
                    </td>
                    <td>
                      <b>Thứ {r.day === 8 ? "Chủ nhật" : r.day}</b>
                      <small style={{ display: "block", color: "var(--muted)" }}>{clock(r.start)} – {clock(r.end)}</small>
                    </td>
                    <td>
                      <span>{r.reason}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn-remove"
                        disabled={disabled}
                        style={{ minHeight: "30px", padding: "4px 12px", fontSize: "12px" }}
                        onClick={() => onCommand("reservation-delete", { id: r.id })}
                      >
                        Giải phóng
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <details className="reservation-panel" style={{ marginTop: "14px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--primary)" }}>+ Thêm lịch chiếm dụng mới</summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onCommand("reservation", {
                ...booking,
                start: minutes(booking.start),
                end: minutes(booking.end),
              });
            }}
            style={{ marginTop: "12px" }}
          >
            <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0 }}>
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
              <button className="primary" style={{ marginTop: "10px" }}>
                Xác nhận chiếm dụng
              </button>
            </fieldset>
          </form>
        </details>
      </div>
    </section>
  );
}

export function RequirementsEditor({
  sessions,
  disabled,
  onCommand,
}: {
  sessions: { id: string; course?: string; name?: string; kind?: string; students?: number; room?: string; required_equipment?: string[]; required_room_type?: string | null }[];
  disabled: boolean;
  onCommand: (action: string, payload: unknown) => Promise<void>;
}) {
  const [id, setId] = useState("");
  const [equipment, setEquipment] = useState("");
  const [roomType, setRoomType] = useState("");
  const [primary, setPrimary] = useState("PROJECTOR");

  const customSessions = sessions.filter(
    (s) =>
      (s.required_equipment && s.required_equipment.length > 0) ||
      Boolean(s.required_room_type) ||
      (s.room && s.room !== (s.kind === "TUT" ? "COMPUTER" : "PROJECTOR"))
  );

  const handleSelectSession = (sessionId: string) => {
    setId(sessionId);
    const s = sessions.find((item) => item.id === sessionId);
    setEquipment(s?.required_equipment?.join(", ") ?? "");
    setRoomType(s?.required_room_type ?? "");
    setPrimary(s?.room ?? (s?.kind === "TUT" ? "COMPUTER" : "PROJECTOR"));
  };

  const handleResetToDefault = async (sessionId: string) => {
    const s = sessions.find((item) => item.id === sessionId);
    if (!s) return;
    const defaultPrimary = s.kind === "TUT" ? "COMPUTER" : "PROJECTOR";
    await onCommand("requirements", {
      session: sessionId,
      room: defaultPrimary,
      required_equipment: [],
      required_room_type: null,
    });
    if (id === sessionId) {
      setPrimary(defaultPrimary);
      setEquipment("");
      setRoomType("");
    }
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Yêu cầu phòng theo lớp học phần</h2>
          <p>
            Khai báo điều kiện phòng học chuyên biệt cho từng lớp học phần (thiết bị đặc thù, loại phòng cụ thể).
          </p>
        </div>
      </div>

      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#166534" }}>
        <b>💡 Mục đích chức năng:</b> Cho phép Giáo vụ tùy biến yêu cầu phòng riêng biệt cho từng lớp học phần.
        <div style={{ marginTop: "4px", color: "#15803d", lineHeight: 1.5 }}>
          • Mặc định: Lớp lý thuyết (LEC) tự động gán vào <b>Phòng máy chiếu (PROJECTOR)</b>, lớp thực hành (TUT) tự động gán vào <b>Phòng máy tính (COMPUTER)</b>.<br />
          • Chỉ cần cài đặt bên dưới nếu lớp có nhu cầu đặc biệt (ví dụ: máy tính cấu hình cao, máy chiếu hội trường, hoặc thiết bị ngoại vi).
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onCommand("requirements", {
            session: id,
            room: primary,
            required_equipment: values(equipment),
            required_room_type: roomType.trim() || null,
          });
        }}
      >
        <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="editor-row">
            <label style={{ flex: 1.5 }}>
              <span>Chọn lớp học phần</span>
              <select
                required
                value={id}
                onChange={(e) => handleSelectSession(e.target.value)}
              >
                <option value="">Chọn lớp học phần ({sessions.length} lớp)</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} ({s.course} · {s.kind === "TUT" ? "Thực hành" : "Lý thuyết"})
                  </option>
                ))}
              </select>
            </label>
            <label style={{ flex: 1 }}>
              <span>Thiết bị chính bắt buộc</span>
              <select value={primary} onChange={(e) => setPrimary(e.target.value)}>
                <option value="PROJECTOR">Máy chiếu (LEC - PROJECTOR)</option>
                <option value="COMPUTER">Máy tính (TUT - COMPUTER)</option>
              </select>
            </label>
          </div>
          <div className="editor-row">
            <label>
              <span>Thiết bị bổ sung (cách nhau bằng dấu phẩy)</span>
              <input
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="VD: LOA, MICRO, GRAPHICS_CARD..."
              />
            </label>
            <label>
              <span>Loại phòng bắt buộc</span>
              <input
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                placeholder="Để trống nếu áp dụng theo thiết bị chuẩn"
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button disabled={!id} className="primary" type="submit">
              Lưu yêu cầu phòng cho {id || "lớp đã chọn"}
            </button>
            {id && (
              <button
                type="button"
                onClick={() => handleResetToDefault(id)}
                style={{ background: "#f8fafc" }}
              >
                Đặt lại mặc định
              </button>
            )}
          </div>
        </fieldset>
      </form>

      {/* Danh sách các lớp đang có yêu cầu phòng riêng */}
      <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "14px", margin: "0 0 6px 0" }}>
          Lớp đang có yêu cầu phòng riêng biệt ({customSessions.length})
        </h3>
        {customSessions.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
            Tất cả các lớp học phần hiện tại đang áp dụng quy tắc phòng chuẩn theo tính chất buổi (LEC: Máy chiếu, TUT: Máy tính).
          </p>
        ) : (
          <div className="table-wrap" style={{ marginTop: "8px" }}>
            <table style={{ width: "100%", fontSize: "12px" }}>
              <thead>
                <tr>
                  <th>Mã lớp / Môn</th>
                  <th>Loại buổi</th>
                  <th>Thiết bị chính</th>
                  <th>Thiết bị bổ sung</th>
                  <th>Loại phòng</th>
                  <th style={{ textAlign: "right", width: "140px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {customSessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.id}</b>
                      <small style={{ display: "block", color: "var(--muted)" }}>{s.course}</small>
                    </td>
                    <td>
                      <span className="badge neutral">
                        {s.kind === "TUT" ? "Thực hành" : "Lý thuyết"}
                      </span>
                    </td>
                    <td>
                      <span className={"badge " + (s.room === "COMPUTER" ? "neutral" : "success")}>
                        {s.room === "COMPUTER" ? "Máy tính" : "Máy chiếu"}
                      </span>
                    </td>
                    <td>{s.required_equipment?.join(", ") || "—"}</td>
                    <td>{s.required_room_type || "Chuẩn theo thiết bị"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        style={{ marginRight: "4px", minHeight: "28px", padding: "2px 8px", fontSize: "11px" }}
                        onClick={() => handleSelectSession(s.id)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-remove"
                        style={{ minHeight: "28px", padding: "2px 8px", fontSize: "11px" }}
                        onClick={() => handleResetToDefault(s.id)}
                      >
                        Đặt lại
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
