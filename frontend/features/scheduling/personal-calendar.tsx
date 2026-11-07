"use client";
import { useState } from "react";
import { EmptyState } from "../shared/ui";
import { clock, dayName } from "../shared/time";
import type { CalendarEvent } from "../workspace/ui-types";

const overlaps=(a:CalendarEvent,b:CalendarEvent)=>a.day===b.day&&a.start<b.end&&b.start<a.end;
export function PersonalCalendar({published,external}:{published:CalendarEvent[];external:CalendarEvent[]}) {
 const [view,setView]=useState("week"),[source,setSource]=useState("all"),[expanded,setExpanded]=useState(false);
 const events=[...(source==="external"?[]:published.map(e=>({...e,isExternal:false}))),...(source==="faculty"?[]:external.map(e=>({...e,isExternal:true})))].sort((a,b)=>a.day-b.day||a.start-b.start||a.id.localeCompare(b.id));
 const conflict=(e:CalendarEvent)=>external.some(x=>x.id===e.id)&&published.some(p=>overlaps(p,e));
 return <section className="card personal-calendar"><div className="section-heading"><div><h2>Lịch giảng dạy chính thức</h2><p>Lịch lặp hằng tuần trong học kỳ · giờ địa phương</p></div><div className="segmented" aria-label="Chế độ xem lịch"><button aria-pressed={view==="week"} onClick={()=>setView("week")}>Lịch tuần</button><button aria-pressed={view==="list"} onClick={()=>setView("list")}>Danh sách</button></div></div><div className="calendar-toolbar"><button aria-pressed={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?"Thu gọn khung giờ":"Xem toàn bộ khung giờ"}</button><div className="legend"><span><i/> Lịch khoa</span><span><i className="external-dot"/> Lịch ngoài</span><span><i className="conflict-dot"/> Cần điều chỉnh</span></div><label>Nguồn lịch<select aria-label="Nguồn lịch" value={source} onChange={e=>setSource(e.target.value)}><option value="all">Tất cả lịch</option><option value="faculty">Lịch khoa</option><option value="external">Lịch ngoài</option></select></label></div>
 {!events.length?<EmptyState title="Chưa có buổi học trong lựa chọn này">Lịch khoa xuất hiện sau khi giáo vụ công bố. Đổi nguồn lịch để xem các buổi khác.</EmptyState>:<>
 {view==="week"&&<div className={"calendar-scroll"+(expanded?" calendar-expanded":"")} tabIndex={0} aria-label="Lịch tuần, cuộn để xem thêm giờ"><div className="week-grid"><div className="time-column"><div className="day-heading">Giờ</div><div className="time-body">{Array.from({length:18},(_,i)=><span key={i} style={{top:i*60}}>{clock((i+6)*60)}</span>)}</div></div>{Array.from({length:7},(_,i)=>i+2).map(day=><section className="week-day" key={day}><h3 className="day-heading">{dayName(day)}</h3><div className="day">{events.filter(e=>e.day===day).map(event=>{
 const sameDay=events.filter(e=>e.day===day),group=new Set([event.id]);let expanded=true;
 while(expanded){expanded=false;for(const item of sameDay)if(!group.has(item.id)&&sameDay.some(other=>group.has(other.id)&&overlaps(item,other))){group.add(item.id);expanded=true;}}
 const cluster=sameDay.filter(e=>group.has(e.id)),lane=cluster.findIndex(e=>e.id===event.id);
 return <article key={event.id} className={"calendar-event "+(event.isExternal?"external-event ":"")+(conflict(event)?"conflict-event":"")} style={{top:event.start-360,height:Math.max(24,event.end-event.start),left:"calc("+lane/cluster.length*100+"% + 3px)",width:"calc("+100/cluster.length+"% - 6px)"}}><b>{event.course}</b><small>{clock(event.start)}–{clock(event.end)}</small><small>{event.room_id||event.room||"Chưa có phòng"}</small><small>{event.institution||event.id}</small>{conflict(event)&&<strong>Cần đổi lịch ngoài</strong>}</article>;
 })}</div></section>)}</div></div>}
 <div className={view==="week"?"agenda mobile-agenda":"agenda"}>{Array.from(new Set(events.map(e=>e.day))).map(day=><section key={day}><h3>{dayName(day)}</h3>{events.filter(e=>e.day===day).map(e=><article className={conflict(e)?"agenda-event conflict-event":"agenda-event"} key={e.id}><time>{clock(e.start)}<small>{clock(e.end)}</small></time><div><b>{e.course}</b><small>{e.class_name||e.id} · {e.room_id||e.room||"Chưa có phòng"}</small><small>{e.institution||"Lịch khoa chính thức"}</small></div><span className={"badge "+(conflict(e)?"warning":e.isExternal?"neutral":"success")}>{conflict(e)?"Cần điều chỉnh":e.isExternal?"Lịch ngoài":"Lịch khoa"}</span></article>)}</section>)}</div>
 </>}<p className="inline-help">Lịch khoa luôn được ưu tiên. Nếu lịch mới công bố trùng lịch ngoài, hãy xóa buổi ngoài và khai báo lại giờ phù hợp.</p></section>;
}
