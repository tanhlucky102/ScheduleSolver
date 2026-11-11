import type { ColorRule, ShiftRule, HolidayRule } from "../catalog/types";
import type { WeekOccurrenceInfo } from "../shared/weeks";

export type { ColorRule, ShiftRule, HolidayRule };

export type Event = {
  id: string;
  offering?: string;
  course?: string;
  course_name?: string;
  cohort?: string;
  section?: string;
  kind?: string;
  periods?: number;
  evening?: boolean;
  teacher?: string;
  room_id?: string;
  room?: string;
  day: number;
  start: number;
  end: number;
  program?: string;
  department?: string;
  students?: number;
  start_date?: string;
  end_date?: string;
  _occ?: WeekOccurrenceInfo;
};

export type Room = { id: string; name: string; capacity: number; room_type?: string };
