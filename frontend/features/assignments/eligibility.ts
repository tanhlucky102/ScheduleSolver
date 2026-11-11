import type { ClassSession, Teacher } from "../workspace/ui-types";

export const eligible=(s:ClassSession,t:Teacher)=>(t.active!==false)&&(t.department===s.department||Boolean(t.capabilities[s.course]))&&(!t.assistant||s.kind==="TUT")&&(t.capabilities[s.course]?.includes(s.kind)||(s.kind==="COMBINED"&&["LEC","TUT"].every(k=>t.capabilities[s.course]?.includes(k))));
