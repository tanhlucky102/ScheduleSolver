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
