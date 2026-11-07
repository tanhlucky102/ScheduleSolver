"use client";
import type { ReactNode } from "react";

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
