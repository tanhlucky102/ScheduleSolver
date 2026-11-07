"use client";
import { useState, type ReactNode } from "react";
import { CapabilitiesEditor } from "./editors";
export type Department = { id:string; name:string; status:string; note:string };
export type Teacher = { id:string; name:string; department:string; assistant:boolean; capabilities:Record<string,string[]> };
export type ClassSession = { id:string; course:string; kind:string; students:number; periods?:number; teacher:string|null; department:string };
export type CalendarEvent = { id:string; course?:string; institution?:string; class_name?:string; room?:string; room_id?:string; teacher?:string; periods?:number; day:number; start:number; end:number };
export const clock=(m:number)=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const dayName=(d:number)=>d===8?"Chủ nhật":"Thứ "+d;
export const eligible=(s:ClassSession,t:Teacher)=>(t.department===s.department||Boolean(t.capabilities[s.course]))&&(!t.assistant||s.kind==="TUT")&&(t.capabilities[s.course]?.includes(s.kind)||(s.kind==="COMBINED"&&["LEC","TUT"].every(k=>t.capabilities[s.course]?.includes(k))));
export function Icon({name}:{name:string}) {
 const paths:Record<string,ReactNode>={
 overview:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 setup:<><path d="M8 4H5a2 2 0 0 0-2 2v14h18V6a2 2 0 0 0-2-2h-3"/><rect x="8" y="2" width="8" height="5" rx="1"/><path d="M7 11h10M7 15h7"/></>,
 rooms:<><path d="M4 21V3h14v18M2 21h20M8 7h6M8 11h6M8 15h2M14 17v4"/></>,
 assign:<><circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5M3 21h12"/></>,
 personal:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3M7 18h3"/></>,
 draft:<><path d="M9 3H4v18h16V3h-5M9 3v4h6V3H9M8 13l2 2 6-5M8 18h8"/></>
 };
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]??paths.personal}</svg>;
}
export function EmptyState({title,children}:{title:string;children:ReactNode}) {return <div className="empty-state"><Icon name="setup"/><h3>{title}</h3><p>{children}</p></div>;}
export function Metrics({items}:{items:{label:string;value:string|number;detail:string;tone?:string}[]}) {return <div className="stats">{items.map(x=><article key={x.label}><span>{x.label}</span><strong className={x.tone}>{x.value}</strong><small>{x.detail}</small></article>)}</div>;}
export function Workflow({departments,sessions,draftCount,published,navigate}:{departments:Department[];sessions:ClassSession[];draftCount:number;published:boolean;navigate:(tab:string)=>void}) {
 const submitted=departments.length>0&&departments.every(d=>d.status==="SUBMITTED");
 const steps=[
 {title:"Kế hoạch mở lớp",owner:"Giáo vụ",done:sessions.length>0,target:"setup"},
 {title:"Phân công giảng viên",owner:"Trưởng bộ môn",done:submitted,target:"assign"},
 {title:"Xếp & kiểm tra lịch",owner:"Giáo vụ",done:draftCount>0,target:"draft"},
 {title:"Công bố & theo dõi",owner:"Giáo vụ → Giảng viên",done:published,target:"draft"}];
 const current=steps.findIndex(s=>!s.done);
 return <section className="card workflow"><div className="section-heading"><div><h2>Phối hợp trong học kỳ</h2><p>Trạng thái bàn giao từ kế hoạch đến lịch giảng dạy.</p></div><span className="badge neutral">4 bước nghiệp vụ</span></div><ol className="workflow-steps">{steps.map((s,i)=><li key={s.title} className={s.done?"complete":current===i?"current":""}><button onClick={()=>navigate(s.target)}><span className="step-number">{s.done?"✓":"0"+(i+1)}</span><span><b>{s.title}</b><small>{s.owner}</small><em>{s.done?"Đã có dữ liệu":current===i?"Cần thực hiện":"Chưa hoàn tất"}</em></span></button></li>)}</ol>{published&&<p className="inline-help">Lịch đã công bố được giữ riêng. Phân công mới cần được kiểm tra lại trước lần công bố tiếp theo.</p>}</section>;
}
export function DepartmentProgress({departments,sessions,staff,busy,navigate,onCommand}:{departments:Department[];sessions:ClassSession[];staff:boolean;busy:boolean;navigate:(tab:string)=>void;onCommand:(action:string,payload:unknown)=>Promise<void>}) {
 const [returning,setReturning]=useState(""),[note,setNote]=useState("");
 const unsentWithClasses = departments.filter(d => d.status === "UNSENT" && sessions.some(s => s.department === d.id));
 return <section className="card" id="department-progress" tabIndex={-1}><div className="section-heading" style={{ flexWrap: "wrap", gap: "10px" }}><div><h2>Tiến độ phân công bộ môn</h2><p>{staff?"Theo dõi bàn giao và phản hồi tại từng bộ môn.":"Hoàn tất phân công hợp lệ trước khi nộp cho giáo vụ."}</p></div><div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span className="badge neutral">{departments.filter(d=>d.status==="SUBMITTED").length}/{departments.length} đã nộp</span>{staff&&unsentWithClasses.length>0&&<button className="primary" disabled={busy} onClick={()=>onCommand("send-all",{})} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", minHeight: "32px", padding: "5px 12px" }} title={`Gửi kế hoạch đồng loạt cho tất cả ${unsentWithClasses.length} bộ môn chưa gửi`}><span>⚡ Gửi kế hoạch đồng loạt ({unsentWithClasses.length} bộ môn)</span></button>}</div></div>{!departments.length?<EmptyState title="Chưa có bộ môn">Nhập danh mục và kế hoạch để bắt đầu phân công.</EmptyState>:<div className="department-list">{departments.map(d=>{
 const classes=sessions.filter(s=>s.department===d.id),assigned=classes.filter(s=>s.teacher).length;
 return <article className="department-row" key={d.id}><div className="department-main"><span className="department-avatar"><Icon name="assign"/></span><div><h3>{d.name||d.id}</h3><small>{d.id} · {assigned}/{classes.length} lớp có giảng viên</small></div><span className={"badge "+(d.status==="SUBMITTED"?"success":d.status==="SENT"?"warning":"neutral")}>{d.status==="SUBMITTED"?"Đã nộp":d.status==="SENT"?d.note?"Cần điều chỉnh":"Đang phân công":"Chưa gửi"}</span></div><div className="progress-track" aria-label={assigned+"/"+classes.length+" lớp có giảng viên"}><span style={{width:(classes.length?assigned/classes.length*100:0)+"%"}}/></div>{d.note&&<p className="feedback"><b>Phản hồi giáo vụ:</b> {d.note}</p>}<div className="department-actions">{staff?d.status==="UNSENT"?<button disabled={busy||!classes.length} onClick={()=>onCommand("send",{department:d.id})}>Gửi bộ môn →</button>:d.status==="SUBMITTED"?<button disabled={busy} onClick={()=>{setReturning(returning===d.id?"":d.id);setNote("");}}>Trả lại để điều chỉnh</button>:<small>Chờ Trưởng bộ môn nộp phân công</small>:<button onClick={()=>navigate("assign")}>{d.status==="SENT"?"Tiếp tục phân công":"Xem phân công"} →</button>}</div>{returning===d.id&&d.status==="SUBMITTED"&&<form className="feedback-form" onSubmit={e=>{e.preventDefault();void onCommand("return",{department:d.id,note});}}><label>Lý do trả lại {d.name||d.id}<textarea required maxLength={1000} value={note} onChange={e=>setNote(e.target.value)} placeholder="Nêu lớp và nội dung cần điều chỉnh…"/></label><div className="actions"><button type="button" onClick={()=>setReturning("")}>Hủy</button><button className="primary" disabled={busy||!note.trim()}>Gửi phản hồi</button></div></form>}</article>;
 })}</div>}</section>;
}
export function AssignmentPanel({sessions,teachers,departments,head,busy,onCommand}:{sessions:ClassSession[];teachers:Teacher[];departments:Department[];head:boolean;busy:boolean;onCommand:(action:string,payload:unknown)=>Promise<void>}) {
 const [query,setQuery]=useState(""),[status,setStatus]=useState("all"),[department,setDepartment]=useState("");
 const [showMobileFilters, setShowMobileFilters] = useState(false);
 const [selected,setSelected]=useState(""),[capabilities,setCapabilities]=useState("{}"),[assistant,setAssistant]=useState(false);
 const [teacherQuery,setTeacherQuery]=useState("");
 const editable=head&&departments[0]?.status==="SENT";
 const invalid=(s:ClassSession)=>!teachers.some(t=>t.id===s.teacher&&eligible(s,t));
 const pending=sessions.filter(invalid).length;
 const filtered=sessions.filter(s=>(!department||s.department===department)&&(status==="all"||(status==="pending"?!s.teacher:status==="invalid"?!!s.teacher&&invalid(s):!!s.teacher&&!invalid(s)))&&[s.id,s.course,teachers.find(t=>t.id===s.teacher)?.name??""].join(" ").toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
 const load=(id:string)=>sessions.filter(s=>s.teacher===id).reduce((n,s)=>n+(s.periods??0),0);
 const filteredTeachers=teachers.filter(t=>!teacherQuery||t.id.toLowerCase().includes(teacherQuery.toLowerCase())||(t.name||"").toLowerCase().includes(teacherQuery.toLowerCase()));
 return <>
 <Metrics items={[{label:"Lớp trong kế hoạch",value:sessions.length,detail:"Phạm vi bộ môn được phép xem"},{label:"Phân công hợp lệ",value:sessions.length-pending,detail:"Đúng bộ môn và năng lực",tone:"text-success"},{label:"Cần hoàn tất",value:pending,detail:"Chưa phân công hoặc cần điều chỉnh",tone:pending?"text-warning":""}]}/>
 {head&&<div className={"context-banner "+(editable?"":"subtle")}><Icon name="assign"/><div><b>{editable?"Bộ môn đang tiếp nhận phân công":departments[0]?.status==="SUBMITTED"?"Đã nộp phân công cho giáo vụ":"Chờ giáo vụ gửi kế hoạch"}</b><p>{editable?"Chọn giảng viên đủ năng lực cho từng lớp, kiểm tra khối lượng rồi nộp.":"Chỉ chỉnh sửa khi giáo vụ gửi hoặc trả lại kế hoạch cho bộ môn."}</p>{departments[0]?.note&&<p><b>Yêu cầu điều chỉnh:</b> {departments[0].note}</p>}</div></div>}
 <div className="assignment-layout"><section className="card assignment-table"><div className="section-heading"><div><h2>Phân công lớp học phần</h2><p>{head?"Lựa chọn được lọc theo bộ môn, loại buổi và năng lực.":"Theo dõi phân công do Trưởng bộ môn thực hiện."}</p></div></div>
 <div className="filters assignment-filters">
  <label className="search-field">
    Tìm lớp, môn hoặc giảng viên
    <input type="search" placeholder="Mã lớp, môn hoặc tên giảng viên…" value={query} onChange={e=>setQuery(e.target.value)}/>
  </label>
  <button
    type="button"
    className="mobile-filter-toggle"
    onClick={() => setShowMobileFilters((prev) => !prev)}
    aria-expanded={showMobileFilters}
  >
    <span>Bộ lọc ⚙️</span>
    {(status !== "all" || department) && <span className="filter-badge">● Đang lọc</span>}
  </button>
  <div className={`filter-group ${showMobileFilters ? "open" : ""}`}>
    <label>
      Trạng thái
      <select aria-label="Trạng thái" value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="all">Tất cả trạng thái</option>
        <option value="pending">Chưa phân công</option>
        <option value="assigned">Đã phân công hợp lệ</option>
        <option value="invalid">Cần điều chỉnh</option>
      </select>
    </label>
    {!head && (
      <label>
        Bộ môn
        <select value={department} onChange={e=>setDepartment(e.target.value)}>
          <option value="">Tất cả bộ môn</option>
          {departments.map(d=><option key={d.id} value={d.id}>{d.name||d.id}</option>)}
        </select>
      </label>
    )}
  </div>
</div>
 <div className="table-wrap table-scroll" style={{ maxHeight: "560px" }}><table role="table"><caption className="sr-only">Phân công lớp học phần, {filtered.length} kết quả</caption><thead><tr><th scope="col">Lớp / Môn học</th><th scope="col">Loại buổi</th><th scope="col">Quy mô</th><th scope="col">Giảng viên phụ trách</th><th scope="col">Trạng thái</th></tr></thead><tbody>{filtered.map(s=>{
 const candidates=teachers.filter(t=>eligible(s,t));
 return <tr key={s.id}><td><b>{s.course}</b><small>{s.id}</small></td><td><span className="badge neutral">{({LEC:"Lý thuyết",TUT:"Thực hành",COMBINED:"LT + TH"} as Record<string,string>)[s.kind]??s.kind}</span></td><td>{s.students} SV<small>{s.periods??"—"} tiết/tuần</small></td><td data-label="Giảng viên phụ trách">{head?<><select aria-label={"Giảng viên cho "+s.id} disabled={busy||!editable||!candidates.length} value={s.teacher??""} onChange={e=>onCommand("assign",{department:s.department,session:s.id,teacher:e.target.value})}><option value="" disabled>Chọn giảng viên</option>{s.teacher&&!candidates.some(t=>t.id===s.teacher)&&<option value={s.teacher}>Cần điều chỉnh: {teachers.find(t=>t.id===s.teacher)?.name||s.teacher}</option>}{candidates.map(t=><option value={t.id} key={t.id}>{t.name} · {load(t.id)} tiết</option>)}</select>{!candidates.length&&<small className="text-warning">Chưa có GV đủ năng lực. Cập nhật năng lực bên dưới.</small>}</>:teachers.find(t=>t.id===s.teacher)?.name||s.teacher||"Chưa phân công"}</td><td><span className={"badge "+(invalid(s)?"warning":"success")}>{!s.teacher?"Chưa phân công":invalid(s)?"Cần điều chỉnh":"Đã phân công"}</span></td></tr>;
 })}</tbody></table></div>{!filtered.length&&<EmptyState title={sessions.length?"Không tìm thấy lớp phù hợp":"Chưa có lớp trong kế hoạch"}>{sessions.length?"Thử từ khóa khác hoặc chọn tất cả trạng thái.":"Lớp sẽ xuất hiện sau khi giáo vụ nhập kế hoạch."}</EmptyState>}
 <div className="table-footer"><small>Hiển thị {filtered.length}/{sessions.length} lớp</small><small>Thay đổi được lưu ngay sau khi chọn giảng viên.</small></div>
 {head&&<div className="assignment-submit"><p><b>{pending?pending+" lớp cần hoàn tất":"Phân công đã sẵn sàng"}</b><small>Trùng giờ được kiểm tra ở bước Giáo vụ xếp lịch.</small></p><div className="actions"><button type="button" disabled={busy||!editable} onClick={()=>onCommand("capabilities-preset",{department:departments[0]?.id})}>⚡ Đồng bộ năng lực TKB gốc</button><button disabled={busy||!editable||!sessions.some(s=>!s.teacher)} onClick={()=>onCommand("balance",{department:departments[0]?.id})}>Chia đều lớp còn trống</button><button className="primary" disabled={busy||!editable||!sessions.length||pending>0} onClick={()=>onCommand("submit",{department:departments[0]?.id})}>Nộp cho giáo vụ →</button></div></div>}
 </section><section className="card workload"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}><h2 style={{ margin: 0 }}>Khối lượng giảng dạy</h2><span className="badge neutral">{filteredTeachers.length}/{teachers.length} GV</span></div><p style={{ margin: "0 0 10px 0" }}>Tổng tiết/tuần theo phân công hiện tại.</p><div style={{ marginBottom: "10px" }}><input type="search" value={teacherQuery} onChange={e=>setTeacherQuery(e.target.value)} placeholder="🔍 Lọc theo mã GV (vd: KhoaTN, AnhNP)..." style={{ width: "100%", height: "34px", minHeight: "34px", fontSize: "12px", padding: "0 10px" }}/></div><div className="workload-list" style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "14px" }}>{!filteredTeachers.length&&<p style={{ fontSize: "13px", color: "var(--muted)", padding: "16px 0", textAlign: "center" }}>Không tìm thấy giảng viên.</p>}{filteredTeachers.map(t=><div className="teacher-load" key={t.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><div><b style={{ color: "var(--primary)" }}>{t.id}</b>{t.name&&t.name!==t.id&&<span style={{ marginLeft: "6px", fontSize: "12px", color: "var(--muted)" }}>{t.name}</span>}</div><strong style={{ whiteSpace: "nowrap", marginLeft: "8px" }}>{load(t.id)} <small>tiết</small></strong></div><small style={{ display: "block", color: "var(--muted)", marginTop: "2px" }}>{sessions.filter(s=>s.teacher===t.id).length} lớp · {t.assistant?"Trợ giảng":"Giảng viên"}</small><div className="progress-track" style={{ marginTop: "4px" }}><span style={{width:(load(t.id)/Math.max(1,...teachers.map(x=>load(x.id))))*100+"%"}}/></div></div>)}</div><p className="inline-help" style={{ marginTop: "10px" }}>Thanh so sánh tương đối giữa các giảng viên; không biểu thị định mức vượt tải.</p></section></div>
 {head&&<details className="card capability-panel"><summary>Cập nhật năng lực giảng dạy</summary><p>Khai báo môn và loại buổi giảng viên có thể phụ trách.</p><fieldset disabled={busy||!editable}><div style={{marginBottom:"12px"}}><button type="button" disabled={busy||!editable} onClick={()=>onCommand("capabilities-preset",{department:departments[0]?.id})}>⚡ Tự động cập nhật năng lực bộ môn từ TKB gốc</button></div><label>Giảng viên<select value={selected} onChange={e=>{setSelected(e.target.value);const t=teachers.find(t=>t.id===e.target.value);setCapabilities(JSON.stringify(t?.capabilities??{}));setAssistant(t?.assistant??false);}}><option value="">Chọn giảng viên</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>{selected&&<><label><input type="checkbox" checked={assistant} onChange={e=>setAssistant(e.target.checked)}/> Trợ giảng (chỉ dạy Thực hành)</label><CapabilitiesEditor value={capabilities} onChange={setCapabilities} courses={Array.from(new Set(sessions.map(s=>s.course)))}/><button className="primary" onClick={()=>onCommand("teacher",{department:departments[0]?.id,teacher:selected,assistant,capabilities:JSON.parse(capabilities)})}>Lưu năng lực</button></>}</fieldset></details>}
 </>;
}
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
