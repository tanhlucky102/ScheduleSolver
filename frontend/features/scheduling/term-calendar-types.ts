export type Event = {
  id: string;
  course?: string;
  cohort?: string;
  section?: string;
  kind?: string;
  teacher?: string;
  room_id?: string;
  room?: string;
  day: number;
  start: number;
  end: number;
  program?: string;
  department?: string;
  students?: number;
};

export type Room = { id: string; name: string; capacity: number; room_type?: string };
