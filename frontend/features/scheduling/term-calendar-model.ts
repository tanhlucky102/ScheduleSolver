import type { Event } from "./term-calendar-types";

// Time slot definitions corresponding to standard FIT timetable slots
export const TIME_SLOTS = [
  { id: "M1", session: "Sáng", label: "Tiết 1 – 3", time: "07:10 – 09:15", start: 430, end: 555 },
  { id: "M2", session: "Sáng", label: "Tiết 4 – 6", time: "09:30 – 11:35", start: 570, end: 695 },
  { id: "A1", session: "Chiều", label: "Tiết 7 – 9", time: "12:20 – 14:25", start: 740, end: 865 },
  { id: "A2", session: "Chiều", label: "Tiết 10 – 12", time: "14:40 – 16:45", start: 880, end: 1005 },
  { id: "E1", session: "Tối", label: "Tiết 13 – 14", time: "16:40 – 18:45", start: 1000, end: 1125 },
  { id: "E2", session: "Tối", label: "Tiết 15 – 16", time: "18:55 – 21:00", start: 1135, end: 1260 },
];

export function getProgramType(e: Event): "CLC" | "MME" | "STANDARD" {
  if (
    e.program === "CLC" ||
    (e.course && e.course.toUpperCase().includes("CLC")) ||
    (e.id && e.id.toUpperCase().includes("CLC")) ||
    (e.section && e.section.toUpperCase().includes("CLC"))
  ) {
    return "CLC";
  }
  if (
    (e.course && e.course.toUpperCase().startsWith("61MME")) ||
    (e.id && e.id.toUpperCase().includes("MME")) ||
    e.department === "TTDPT"
  ) {
    return "MME";
  }
  return "STANDARD";
}
