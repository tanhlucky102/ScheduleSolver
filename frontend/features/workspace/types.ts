import type { Dept, Teacher } from "../catalog/types";
import type { Room, Reservation } from "../rooms/types";

export type Profile = { role: "STAFF" | "HEAD" | "TEACHER"; teacher: string | null; department: string | null };
export type Session = {
  id: string;
  course: string;
  kind: string;
  students: number;
  periods?: number;
  teacher: string | null;
  department: string;
  room?: string;
  required_equipment?: string[];
  required_room_type?: string | null;
};
export type Slot = { day: number; start: number; end: number; evening: boolean };
export type Event = {
  id: string;
  cohort?: string;
  program?: string;
  course?: string;
  institution?: string;
  class_name?: string;
  room?: string;
  room_id?: string;
  teacher?: string;
  periods?: number;
  day: number;
  start: number;
  end: number;
};
export type Placement = { session: string; slot: number; room_id?: string | null };
export type Report = { hard: number; soft_total: number; violations: string[]; soft: Record<string, number> };
export type Workspace = {
  has_publication: boolean;
  revision: number;
  evaluation?: Report;
  state: {
    rooms?: Room[];
    reservations?: Reservation[];
    config?: {
      period_minutes: number;
      break_minutes: number;
      max_periods: number;
      rooms: Record<string, number>;
      slots: Slot[];
    };
    departments?: Dept[];
    teachers?: Teacher[];
    sessions?: Session[];
    draft?: Placement[];
    published: Event[];
    external?: Event[];
  };
};
