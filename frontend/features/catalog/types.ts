export type Dept = { id: string; name: string; status: string; note: string };
export type Teacher = {
  id: string;
  name: string;
  department: string;
  assistant: boolean;
  capabilities: Record<string, string[]>;
};
