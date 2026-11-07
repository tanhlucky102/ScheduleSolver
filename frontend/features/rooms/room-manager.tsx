"use client";
import { useState } from "react";
import type { Window, Room, Reservation } from "./types";
import { ReservationManager } from "./reservation-manager";
import { parseRoomsCsv } from "./room-import";
import { clock, minutes } from "../shared/time";
import { commaValues as values } from "../shared/text";

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
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");

  const isCapacityValid = Number.isInteger(room.capacity) && room.capacity > 0;
  const isFormValid = Boolean(room.id.trim() && room.name.trim() && isCapacityValid);

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
    setErrorMsg("");
    setFormOpen(true);
  };

  const handleOpenEdit = (r: Room) => {
    setRoom(structuredClone(r));
    setEquipStr(r.equipment.join(", "));
    setDeptStr(r.allowed_departments.join(", "));
    setCourseStr(r.allowed_courses.join(", "));
    setEditing(true);
    setErrorMsg("");
    setFormOpen(true);
  };

  const handleSubmitRoom = async () => {
    if (!room.id.trim()) {
      setErrorMsg("Mã phòng không được để trống.");
      return;
    }
    if (!room.name.trim()) {
      setErrorMsg("Tên phòng không được để trống.");
      return;
    }
    if (!isCapacityValid) {
      setErrorMsg("Sức chứa chỗ ngồi phải là số nguyên dương lớn hơn 0.");
      return;
    }
    setErrorMsg("");
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
      const newRooms = parseRoomsCsv(text, defaultWeeklyAvailability);
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
              {errorMsg && (
                <div
                  className="notice error"
                  role="alert"
                  style={{
                    marginBottom: "14px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    borderRadius: "6px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                  }}
                >
                  <b>Lỗi nhập liệu:</b> <span>{errorMsg}</span>
                </div>
              )}
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
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRoom({ ...room, capacity: val });
                      if (val <= 0) {
                        setErrorMsg("Sức chứa chỗ ngồi phải là số nguyên dương lớn hơn 0.");
                      } else if (errorMsg === "Sức chứa chỗ ngồi phải là số nguyên dương lớn hơn 0.") {
                        setErrorMsg("");
                      }
                    }}
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
                <button className="primary" type="submit" disabled={!isFormValid}>
                  {editing ? "Lưu thay đổi phòng" : "Thêm phòng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReservationManager initial={initial} reservations={reservations} disabled={disabled} onCommand={onCommand} />
    </section>
  );
}
