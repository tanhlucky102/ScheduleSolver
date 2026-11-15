"use client";
import { useMemo, useState } from "react";
import type { AllowedProgram, Window, Room, Reservation } from "./types";
import type { Dept, ShiftRule } from "../catalog/types";
import type { OfferingItem } from "../workspace/types";
import { ReservationManager } from "./reservation-manager";
import { parseRoomsCsv } from "./room-import";
import { ActionButton, Icon } from "../shared/ui";
import { clock, minutes } from "../shared/time";
import { commaValues as values } from "../shared/text";

const PROGRAM_OPTIONS: { code: AllowedProgram; label: string }[] = [
  { code: "STANDARD", label: "STANDARD (Đại trà)" },
  { code: "CLC", label: "CLC (Chất lượng cao)" },
  { code: "TT", label: "TT (Tiên tiến)" },
  { code: "MME", label: "MME (Truyền thông ĐPT)" },
];

const defaultWeeklyAvailability: Window[] = Array.from({ length: 6 }, (_, i) => ({
  day: i + 2,
  start: 420,
  end: 1290,
  evening: true,
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

function Windows({
  items,
  shiftRules = [],
  onChange,
}: {
  items: Window[];
  shiftRules?: ShiftRule[];
  onChange: (v: Window[]) => void;
}) {
  const syncWithShiftRules = () => {
    const minStart = shiftRules.length
      ? Math.min(...shiftRules.map((s) => s.start))
      : 420; // 07:00
    const maxEnd = shiftRules.length
      ? Math.max(...shiftRules.map((s) => s.end))
      : 1290; // 21:30
    const synced: Window[] = Array.from({ length: 6 }, (_, i) => ({
      day: i + 2,
      start: minStart,
      end: maxEnd,
      evening: maxEnd > 1080,
    }));
    onChange(synced);
  };

  return (
    <fieldset style={{ margin: "14px 0", padding: "14px" }}>
      <legend>Khung giờ mở cửa phòng ({items.length} khung)</legend>
      <div style={{ maxHeight: "190px", overflowY: "auto", paddingRight: "4px" }}>
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
                    onChange(
                      items.map((v, j) => (j === i ? { ...v, [k]: minutes(e.target.value) } : v))
                    )
                  }
                />
              </label>
            ))}
            <ActionButton
              type="button"
              variant="danger"
              icon="trash"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ minHeight: "38px", padding: "0 10px" }}
            >
              Bỏ
            </ActionButton>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
        <ActionButton
          type="button"
          icon="plus"
          onClick={() => onChange([...items, { day: 2, start: 420, end: 1290, evening: true }])}
          style={{ minHeight: "32px", padding: "4px 10px", fontSize: "12px" }}
        >
          Thêm khung giờ
        </ActionButton>
        <ActionButton
          type="button"
          icon="clock"
          onClick={syncWithShiftRules}
          style={{
            minHeight: "32px",
            padding: "4px 12px",
            fontSize: "12px",
            background: "#eff6ff",
            borderColor: "#bfdbfe",
            color: "#1d4ed8",
          }}
        >
          Đồng bộ theo khung Ca học hiện hành
        </ActionButton>
      </div>
    </fieldset>
  );
}

export function RoomManager({
  initial,
  reservations,
  disabled,
  onCommand,
  departments = [],
  offerings = [],
  shiftRules = [],
}: {
  initial: Room[];
  reservations: Reservation[];
  disabled: boolean;
  onCommand: (action: string, payload: unknown) => Promise<void>;
  departments?: Dept[];
  offerings?: OfferingItem[];
  shiftRules?: ShiftRule[];
}) {
  const [room, setRoom] = useState<Room>(emptyRoom("PROJECTOR"));
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editing, setEditing] = useState(false);
  const [equipStr, setEquipStr] = useState("PROJECTOR");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseCommaInput, setCourseCommaInput] = useState("");
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");
  const [savingModal, setSavingModal] = useState(false);
  const [pendingToolbar, setPendingToolbar] = useState<string | null>(null);

  const isCapacityValid = Number.isInteger(room.capacity) && room.capacity > 0;
  const isFormValid = Boolean(room.id.trim() && room.name.trim() && isCapacityValid);

  const offeringCourseOptions = useMemo(() => {
    const map = new Map<string, string>();
    offerings.forEach((o) => {
      if (o.course && !map.has(o.course)) {
        map.set(o.course, o.name || "");
      }
    });
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [offerings]);

  const deptOptions = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(d.id, d.name || d.id));
    room.allowed_departments.forEach((id) => {
      if (!map.has(id)) map.set(id, id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [departments, room.allowed_departments]);

  const filteredCourseOptions = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    return offeringCourseOptions.filter(
      (c) =>
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [offeringCourseOptions, courseSearch]);

  const filtered = initial.filter((r) => {
    const matchType =
      typeFilter === "all" ||
      (typeFilter === "PROJECTOR" &&
        (r.room_type === "PROJECTOR" || r.room_type === "Phòng máy chiếu")) ||
      (typeFilter === "COMPUTER" &&
        (r.room_type === "COMPUTER" || r.room_type === "Phòng máy tính"));
    const matchSearch = (
      r.id +
      " " +
      r.name +
      " " +
      r.room_type +
      " " +
      (r.allowed_departments || []).join(" ") +
      " " +
      (r.allowed_programs || []).join(" ")
    )
      .toLowerCase()
      .includes(search.toLowerCase());
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
    setPendingToolbar("bulk-delete");
    try {
      const toDelete = Array.from(selectedRoomIds);
      await onCommand("rooms-delete", { ids: toDelete });
      setSelectedRoomIds(new Set());
    } finally {
      setPendingToolbar(null);
    }
  };

  const handleOpenAdd = (preset: "PROJECTOR" | "COMPUTER" = "PROJECTOR") => {
    const fresh = emptyRoom(preset);
    setRoom(fresh);
    setEquipStr(fresh.equipment.join(", "));
    setCourseSearch("");
    setCourseCommaInput("");
    setEditing(false);
    setErrorMsg("");
    setFormOpen(true);
  };

  const handleOpenEdit = (r: Room) => {
    setRoom(structuredClone(r));
    setEquipStr(r.equipment.join(", "));
    setCourseSearch("");
    setCourseCommaInput("");
    setEditing(true);
    setErrorMsg("");
    setFormOpen(true);
  };

  const toggleAllowedDept = (deptId: string) => {
    const next = new Set(room.allowed_departments);
    if (next.has(deptId)) next.delete(deptId);
    else next.add(deptId);
    setRoom({ ...room, allowed_departments: Array.from(next) });
  };

  const toggleAllowedProgram = (prog: AllowedProgram) => {
    const next = new Set(room.allowed_programs);
    if (next.has(prog)) next.delete(prog);
    else next.add(prog);
    setRoom({ ...room, allowed_programs: Array.from(next) });
  };

  const toggleAllowedCourse = (courseCode: string) => {
    const next = new Set(room.allowed_courses);
    if (next.has(courseCode)) next.delete(courseCode);
    else next.add(courseCode);
    setRoom({ ...room, allowed_courses: Array.from(next) });
  };

  const handleAddCommaCourses = () => {
    const extra = values(courseCommaInput).map((c) => c.toUpperCase());
    if (!extra.length) return;
    const merged = Array.from(new Set([...room.allowed_courses, ...extra]));
    setRoom({ ...room, allowed_courses: merged });
    setCourseCommaInput("");
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
    const extraCourses = values(courseCommaInput).map((c) => c.toUpperCase());
    const mergedCourses = Array.from(new Set([...room.allowed_courses, ...extraCourses]));
    const finalRoom: Room = {
      ...room,
      id: room.id.trim(),
      name: room.name.trim(),
      equipment: values(equipStr).map((x) => x.toUpperCase()),
      allowed_departments: room.allowed_departments,
      allowed_programs: room.allowed_programs,
      allowed_courses: mergedCourses,
    };
    const updated = editing
      ? initial.map((r) => (r.id === finalRoom.id ? finalRoom : r))
      : [...initial.filter((r) => r.id !== finalRoom.id), finalRoom];

    setSavingModal(true);
    try {
      await onCommand("rooms", { rooms: updated });
      setFormOpen(false);
    } finally {
      setSavingModal(false);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingToolbar("csv-import");
    try {
      const text = (await file.text()).replace(/^\uFEFF/, "");
      const newRooms = parseRoomsCsv(text, defaultWeeklyAvailability);
      if (newRooms.length) {
        const existingMap = new Map(initial.map((r) => [r.id, r]));
        for (const r of newRooms) {
          existingMap.set(r.id, r);
        }
        await onCommand("rooms", { rooms: Array.from(existingMap.values()) });
      }
    } finally {
      setPendingToolbar(null);
      e.target.value = "";
    }
  };

  return (
    <section className="card">
      <div
        className="section-heading"
        style={{ alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "10px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="building" size={18} />
          <h2 style={{ margin: 0 }}>Danh sách phòng khả dụng ({initial.length} phòng)</h2>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {selectedRoomIds.size > 0 && (
            <ActionButton
              type="button"
              variant="danger"
              icon="trash"
              loading={pendingToolbar === "bulk-delete"}
              disabled={disabled}
              onClick={() => void handleBulkDelete()}
              style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}
            >
              Xóa đã chọn ({selectedRoomIds.size})
            </ActionButton>
          )}
          {initial.length === 0 && (
            <ActionButton
              type="button"
              icon="play"
              loading={pendingToolbar === "preset"}
              disabled={disabled}
              onClick={() => {
                setPendingToolbar("preset");
                void onCommand("rooms-preset", {}).finally(() => setPendingToolbar(null));
              }}
              style={{
                background: "#eff6ff",
                borderColor: "#bfdbfe",
                color: "#1d4ed8",
                minHeight: "34px",
                padding: "0 12px",
                fontSize: "12px",
              }}
            >
              Nạp danh sách phòng chuẩn TKB
            </ActionButton>
          )}
          <a
            href="/templates/phong-hoc-mau.csv"
            download="Mau_Danh_Sach_Phong_Hoc.csv"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              minHeight: "34px",
              padding: "0 12px",
              fontSize: "12px",
              background: "#eff6ff",
              border: "1px solid #93c5fd",
              color: "#1d4ed8",
              borderRadius: "7px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Icon name="download" size={14} />
            <span>Tải mẫu (.csv)</span>
          </a>
          <label
            style={{
              margin: 0,
              cursor: disabled ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              minHeight: "34px",
              padding: "0 12px",
              fontSize: "12px",
              background: "#f8fafc",
              border: "1px solid var(--line)",
              borderRadius: "7px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            <Icon name="upload" size={14} />
            <span>{pendingToolbar === "csv-import" ? "Đang nhập..." : "Nhập phòng (.csv)"}</span>
            <input
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              disabled={disabled}
              onChange={(e) => void handleImportCsv(e)}
            />
          </label>
          <ActionButton
            type="button"
            variant="primary"
            icon="plus"
            disabled={disabled}
            onClick={() => handleOpenAdd("PROJECTOR")}
            style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}
          >
            Thêm phòng mới
          </ActionButton>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 0, gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã phòng, tên phòng, bộ môn hoặc hệ đào tạo..."
          style={{ minHeight: "36px", height: "36px", flex: 2, minWidth: "220px" }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ minHeight: "36px", height: "36px", flex: 1, minWidth: "180px" }}
        >
          <option value="all">Tất cả loại phòng ({initial.length})</option>
          <option value="PROJECTOR">Phòng máy chiếu (LEC)</option>
          <option value="COMPUTER">Phòng máy tính (TUT)</option>
        </select>
      </div>

      <div className="table-wrap table-scroll" style={{ maxHeight: "440px" }}>
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
              <th scope="col" style={{ width: "165px" }}>Mã &amp; Tên phòng</th>
              <th style={{ width: "95px" }}>Sức chứa</th>
              <th>Loại, Thiết bị &amp; Ràng buộc</th>
              <th style={{ width: "120px" }}>Khung mở cửa</th>
              <th style={{ width: "115px" }}>Trạng thái</th>
              <th style={{ width: "160px", textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "var(--muted)" }}>
                  {initial.length === 0
                    ? "Chưa có phòng học nào được khai báo. Nhấn 'Thêm phòng mới', 'Nhập phòng (.csv)' hoặc 'Nạp danh sách phòng chuẩn TKB' để bắt đầu."
                    : "Không tìm thấy phòng phù hợp với điều kiện lọc."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const hasDepts = (r.allowed_departments?.length ?? 0) > 0;
                const hasPrograms = (r.allowed_programs?.length ?? 0) > 0;
                const hasCourses = (r.allowed_courses?.length ?? 0) > 0;
                return (
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
                      <b>{r.capacity}</b>{" "}
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>chỗ</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
                        <span className={"badge " + (r.room_type === "COMPUTER" ? "neutral" : "success")}>
                          {r.room_type === "COMPUTER" ? "Phòng máy tính" : r.room_type === "PROJECTOR" ? "Phòng máy chiếu" : r.room_type}
                        </span>
                        {hasDepts && (
                          <span className="badge warning" title="Giới hạn bộ môn sử dụng">
                            BM: {r.allowed_departments.join(", ")}
                          </span>
                        )}
                        {hasPrograms && (
                          <span className="badge neutral" style={{ background: "#eef2ff", color: "#3730a3" }} title="Giới hạn hệ đào tạo">
                            Hệ: {r.allowed_programs.join(", ")}
                          </span>
                        )}
                        {hasCourses && (
                          <span className="badge neutral" style={{ background: "#f0f9ff", color: "#0369a1" }} title={r.allowed_courses.join(", ")}>
                            Môn ưu tiên: {r.allowed_courses.slice(0, 2).join(", ")}
                            {r.allowed_courses.length > 2 ? ` (+${r.allowed_courses.length - 2})` : ""}
                          </span>
                        )}
                      </div>
                      <small style={{ marginTop: "3px" }}>
                        Thiết bị: {r.equipment.join(", ") || "Chưa khai báo"}
                      </small>
                    </td>
                    <td>
                      <span className="badge neutral">{r.availability.length} khung/tuần</span>
                    </td>
                    <td>
                      <span className={"badge " + (r.active ? "success" : "danger")}>
                        {r.active ? "Đang sử dụng" : "Tạm ngưng"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <ActionButton
                        type="button"
                        icon="edit"
                        disabled={disabled}
                        style={{ marginRight: "6px", minHeight: "30px", padding: "3px 9px", fontSize: "11.5px" }}
                        onClick={() => handleOpenEdit(r)}
                      >
                        Sửa
                      </ActionButton>
                      <ActionButton
                        type="button"
                        variant="danger"
                        icon="trash"
                        disabled={disabled}
                        style={{ minHeight: "30px", padding: "3px 9px", fontSize: "11.5px" }}
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
                      </ActionButton>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: "680px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{editing ? `Cấu hình phòng ${room.id}` : "Thêm phòng học mới"}</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Đóng"
                onClick={() => setFormOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmitRoom();
              }}
            >
              {errorMsg && (
                <div className="notice error" role="alert" style={{ marginBottom: "14px" }}>
                  <b>Lỗi nhập liệu:</b> <span>{errorMsg}</span>
                </div>
              )}

              {!editing && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "14px",
                    background: "#f8fafc",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)" }}>
                    Mẫu khởi tạo nhanh:
                  </span>
                  <button
                    type="button"
                    style={{ minHeight: "30px", padding: "3px 10px", fontSize: "11.5px" }}
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
                    style={{ minHeight: "30px", padding: "3px 10px", fontSize: "11.5px" }}
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
                      } else if (
                        errorMsg === "Sức chứa chỗ ngồi phải là số nguyên dương lớn hơn 0."
                      ) {
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
                        equipment:
                          val === "COMPUTER" ? ["COMPUTER", "PROJECTOR"] : ["PROJECTOR"],
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
                  placeholder="VD: PROJECTOR, COMPUTER, MICRO, LOA"
                />
              </label>

              {/* Ràng buộc 1: Giới hạn Bộ môn sử dụng */}
              <fieldset style={{ margin: "14px 0", padding: "12px 14px" }}>
                <legend>Giới hạn Bộ môn sử dụng</legend>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    gap: "8px",
                  }}
                >
                  <span className={"badge " + (room.allowed_departments.length === 0 ? "success" : "warning")}>
                    {room.allowed_departments.length === 0
                      ? "Dùng chung toàn khoa"
                      : `Giới hạn ${room.allowed_departments.length} bộ môn`}
                  </span>
                  {room.allowed_departments.length > 0 && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ minHeight: "26px", padding: "2px 8px", fontSize: "11px" }}
                      onClick={() => setRoom({ ...room, allowed_departments: [] })}
                    >
                      Đặt lại dùng chung
                    </button>
                  )}
                </div>
                {deptOptions.length === 0 ? (
                  <small>Chưa có danh mục Bộ môn. Mặc định phòng dùng chung toàn khoa.</small>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {deptOptions.map((d) => {
                      const checked = room.allowed_departments.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className={`cap-check ${checked ? "is-checked-lec" : ""}`}
                          style={{ padding: "4px 10px" }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAllowedDept(d.id)}
                          />
                          <span>
                            {d.id} {d.name && d.name !== d.id ? `— ${d.name}` : ""}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>

              {/* Ràng buộc 2: Giới hạn Hệ đào tạo */}
              <fieldset style={{ margin: "14px 0", padding: "12px 14px" }}>
                <legend>Giới hạn Hệ đào tạo</legend>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    gap: "8px",
                  }}
                >
                  <span className={"badge " + (room.allowed_programs.length === 0 ? "neutral" : "warning")}>
                    {room.allowed_programs.length === 0
                      ? "Tất cả các hệ"
                      : `Áp dụng cho: ${room.allowed_programs.join(", ")}`}
                  </span>
                  {room.allowed_programs.length > 0 && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ minHeight: "26px", padding: "2px 8px", fontSize: "11px" }}
                      onClick={() => setRoom({ ...room, allowed_programs: [] })}
                    >
                      Cho phép tất cả các hệ
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {PROGRAM_OPTIONS.map((p) => {
                    const checked = room.allowed_programs.includes(p.code);
                    return (
                      <label
                        key={p.code}
                        className={`cap-check ${checked ? "is-checked-tut" : ""}`}
                        style={{ padding: "4px 10px" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAllowedProgram(p.code)}
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Ràng buộc 3: Giới hạn Mã học phần ưu tiên */}
              <fieldset style={{ margin: "14px 0", padding: "12px 14px" }}>
                <legend>Giới hạn Mã học phần ưu tiên</legend>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    gap: "8px",
                  }}
                >
                  <span className={"badge " + (room.allowed_courses.length === 0 ? "neutral" : "warning")}>
                    {room.allowed_courses.length === 0
                      ? "Không giới hạn môn"
                      : `${room.allowed_courses.length} học phần được chọn`}
                  </span>
                  {room.allowed_courses.length > 0 && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ minHeight: "26px", padding: "2px 8px", fontSize: "11px" }}
                      onClick={() => setRoom({ ...room, allowed_courses: [] })}
                    >
                      Xóa hết giới hạn môn
                    </button>
                  )}
                </div>

                {room.allowed_courses.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {room.allowed_courses.map((c) => (
                      <span
                        key={c}
                        className="badge neutral"
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          padding: "3px 7px",
                        }}
                      >
                        <span>{c}</span>
                        <button
                          type="button"
                          aria-label={`Bỏ môn ${c}`}
                          onClick={() => toggleAllowedCourse(c)}
                          style={{
                            minHeight: "16px",
                            height: "16px",
                            width: "16px",
                            padding: 0,
                            border: 0,
                            background: "transparent",
                            color: "inherit",
                            display: "inline-grid",
                            placeItems: "center",
                          }}
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="editor-row" style={{ marginBottom: "8px" }}>
                  <label style={{ flex: 2 }}>
                    <span>Nhập thêm mã học phần (phân tách bằng dấu phẩy)</span>
                    <input
                      value={courseCommaInput}
                      onChange={(e) => setCourseCommaInput(e.target.value)}
                      placeholder="VD: 61FIT3AI1, 61MME2GD1"
                    />
                  </label>
                  <ActionButton
                    type="button"
                    icon="plus"
                    onClick={handleAddCommaCourses}
                    disabled={!courseCommaInput.trim()}
                  >
                    Thêm mã
                  </ActionButton>
                </div>

                {offeringCourseOptions.length > 0 && (
                  <div>
                    <input
                      type="search"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Tìm nhanh từ kế hoạch mở lớp..."
                      style={{ minHeight: "34px", height: "34px", marginBottom: "6px" }}
                    />
                    <div
                      style={{
                        maxHeight: "120px",
                        overflowY: "auto",
                        border: "1px solid var(--line)",
                        borderRadius: "6px",
                        padding: "6px 8px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        background: "#fafbfd",
                      }}
                    >
                      {filteredCourseOptions.slice(0, 60).map((c) => {
                        const selected = room.allowed_courses.includes(c.code);
                        return (
                          <label
                            key={c.code}
                            className={`cap-check ${selected ? "is-checked-lec" : ""}`}
                            title={c.name ? `${c.code} — ${c.name}` : c.code}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleAllowedCourse(c.code)}
                            />
                            <span>
                              {c.code}
                              {c.name ? ` · ${c.name}` : ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </fieldset>

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
                shiftRules={shiftRules}
                onChange={(availability) => setRoom({ ...room, availability })}
              />

              <label>
                <span>Ghi chú vận hành</span>
                <input
                  value={room.note}
                  onChange={(e) => setRoom({ ...room, note: e.target.value })}
                  placeholder="Ghi chú thêm về phòng học"
                />
              </label>

              <div className="actions" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setFormOpen(false)}>
                  Hủy
                </button>
                <ActionButton
                  variant="primary"
                  type="submit"
                  icon="check"
                  loading={savingModal}
                  loadingLabel="Đang lưu..."
                  disabled={!isFormValid}
                >
                  {editing ? "Lưu cấu hình phòng" : "Thêm phòng"}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReservationManager
        initial={initial}
        reservations={reservations}
        disabled={disabled}
        onCommand={onCommand}
      />
    </section>
  );
}
