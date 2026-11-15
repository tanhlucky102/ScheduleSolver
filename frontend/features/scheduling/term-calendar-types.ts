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
  activity_type?: string;
  institution?: string;
  class_name?: string;
  color?: string;
  note?: string;
  _occ?: WeekOccurrenceInfo;
};

export type Room = { id: string; name: string; capacity: number; room_type?: string };

export type PeriodConfigInput = {
  period_minutes?: number;
  break_minutes?: number;
  include_break?: boolean;
  first_period_start?: number;
  afternoon_start?: number;
  evening_start?: number;
  inter_shift_gap?: number;
};

export type PeriodRow = {
  period: number; // 1..15
  label: string; // "Tiết 1" .. "Tiết 15"
  start: number;
  end: number;
  clockLabel: string; // "05:30" .. "21:35"
  evening: boolean;
};

export type MappedPeriodRange = {
  startPeriod: number;
  endPeriod: number;
  spanPeriods: number;
};

export type PeriodCluster<T> = {
  startPeriod: number;
  endPeriod: number;
  rowSpan: number;
  events: T[];
};
