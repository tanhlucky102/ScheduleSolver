export type Dept = { id: string; name: string; status: string; note: string };

export type Teacher = {
  id: string;
  name: string;
  department: string;
  assistant: boolean;
  active?: boolean;
  capabilities: Record<string, string[]>;
  color_rules?: ColorRule[];
};

export type ShiftRule = {
  id: string;
  label: string;
  periods_label?: string;
  start: number;
  periods: number;
  include_break: boolean;
  break_minutes: number;
  end: number;
  evening: boolean;
};

export type ColorRule = {
  id: string;
  category: "PROGRAM" | "KIND" | "STATUS" | "INSTITUTION" | "CUSTOM";
  key: string;
  label: string;
  bg_color: string;
  border_color: string;
  text_color: string;
  note: string;
};

export type HolidayRule = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};
