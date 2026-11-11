import type { Dept, Teacher, ShiftRule, ColorRule, HolidayRule } from "../catalog/types";
import type { Room, Reservation } from "../rooms/types";

export type Profile = { role: "STAFF" | "HEAD" | "TEACHER"; teacher: string | null; department: string | null };

export type OfferingItem = {
  id: string;
  course: string;
  name: string;
  cohort: string;
  department: string;
  students: number;
  lecture_periods: number;
  tutorial_periods: number;
  program?: string;
  start_date?: string;
  end_date?: string;
};

export type Session = {
  id: string;
  offering?: string;
  course: string;
  cohort?: string;
  section?: string;
  kind: string;
  students: number;
  periods?: number;
  program?: string;
  teacher: string | null;
  department: string;
  room?: string;
  required_equipment?: string[];
  required_room_type?: string | null;
  start_date?: string;
  end_date?: string;
};

export type Slot = { day: number; start: number; end: number; evening: boolean };

export type Event = {
  id: string;
  offering?: string;
  cohort?: string;
  section?: string;
  kind?: string;
  program?: string;
  department?: string;
  students?: number;
  course?: string;
  institution?: string;
  class_name?: string;
  room?: string;
  room_id?: string;
  teacher?: string;
  periods?: number;
  evening?: boolean;
  activity_type?: "EXTERNAL_TEACHING" | "STUDYING" | "PERSONAL_BUSY" | "MAKEUP" | string;
  color?: string;
  note?: string;
  start_date?: string;
  end_date?: string;
  day: number;
  start: number;
  end: number;
};

export type Placement = { session: string; slot: number; room_id?: string | null };
export type Report = { hard: number; soft_total: number; violations: string[]; soft: Record<string, number> };

export type Workspace = {
  has_publication: boolean;
  revision: number;
  online_teachers?: string[];
  color_rules?: ColorRule[];
  shift_rules?: ShiftRule[];
  term_config?: {
    term_name: string;
    term_start_date: string;
    term_end_date: string;
    holidays?: HolidayRule[];
  };
  period_config?: {
    period_minutes: number;
    break_minutes: number;
    include_break: boolean;
    first_period_start: number;
  };
  evaluation?: Report;
  state: {
    rooms?: Room[];
    reservations?: Reservation[];
    config?: {
      term_name?: string;
      term_start_date?: string;
      term_end_date?: string;
      holidays?: HolidayRule[];
      period_minutes: number;
      break_minutes: number;
      include_break?: boolean;
      first_period_start?: number;
      active_days?: number[];
      shift_rules?: ShiftRule[];
      color_rules?: ColorRule[];
      max_periods: number;
      rooms: Record<string, number>;
      slots: Slot[];
      soft_weights?: Record<string, number>;
    };
    departments?: Dept[];
    teachers?: Teacher[];
    offerings?: OfferingItem[];
    sessions?: Session[];
    draft?: Placement[];
    published: Event[];
    external?: Event[];
  };
};
