import type { Room, Window } from "./types";

export function parseRoomsCsv(text: string, defaultWeeklyAvailability: Window[]): Room[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
  const idIdx = headers.findIndex((h) => h === "id" || h === "ma_phong" || h.includes("ten_phong") || h === "phong");
  const nameIdx = headers.findIndex((h) => h === "name" || h === "ten" || h === "tên phòng");
  const capIdx = headers.findIndex((h) => h === "capacity" || h.includes("suc_chua") || h.includes("cap"));
  const typeIdx = headers.findIndex((h) => h === "room_type" || h.includes("tinh_chat") || h.includes("type") || h.includes("loai"));
  const equipIdx = headers.findIndex((h) => h === "equipment" || h.includes("thiet_bi"));
  const activeIdx = headers.findIndex((h) => h === "active" || h.includes("trang_thai"));
  const noteIdx = headers.findIndex((h) => h === "note" || h.includes("ghi_chu"));

  const newRooms: Room[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    const id = parts[idIdx >= 0 ? idIdx : 0];
    if (!id) continue;
    const rawType = (parts[typeIdx >= 0 ? typeIdx : 1] || "").toLowerCase();
    const isComp = rawType.includes("máy tính") || rawType.includes("computer");
    const isProj = rawType.includes("máy chiếu") || rawType.includes("projector");

    const capVal = parts[capIdx >= 0 ? capIdx : 2];
    const cap = Number(capVal) || (isComp ? 45 : 150);

    let equip: string[] = [];
    if (equipIdx >= 0 && parts[equipIdx]) {
      equip = parts[equipIdx]
        .split(/[|;]/)
        .map((e) => e.trim().toUpperCase())
        .filter(Boolean);
    }
    if (!equip.length) {
      equip = isComp ? ["COMPUTER", "PROJECTOR"] : isProj ? ["PROJECTOR"] : ["PROJECTOR"];
    }

    const activeRaw = activeIdx >= 0 ? (parts[activeIdx] || "true").toLowerCase() : "true";
    const active = !(activeRaw === "false" || activeRaw === "0" || activeRaw === "off");
    const name = (nameIdx >= 0 && parts[nameIdx]) ? parts[nameIdx] : `Phòng ${id}`;
    const note =
      noteIdx >= 0 && parts[noteIdx] !== undefined
        ? parts[noteIdx]
        : isComp
        ? `Phòng máy tính ${id} phục vụ TUT`
        : `Phòng máy chiếu ${id} phục vụ LEC`;

    newRooms.push({
      id,
      name,
      capacity: cap,
      room_type: isComp ? "COMPUTER" : "PROJECTOR",
      equipment: equip,
      availability: structuredClone(defaultWeeklyAvailability),
      active,
      allowed_departments: [],
      allowed_programs: [],
      allowed_courses: [],
      note,
    });
  }
  return newRooms;
}
