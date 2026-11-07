import type { Room, Window } from "./types";

export function parseRoomsCsv(text: string, defaultWeeklyAvailability: Window[]): Room[] {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return [];
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
  return newRooms;
}
