"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconName =
  | "overview"
  | "setup"
  | "rooms"
  | "personnel"
  | "term"
  | "assign"
  | "personal"
  | "draft"
  | "refresh"
  | "send"
  | "check"
  | "alert"
  | "bell"
  | "upload"
  | "download"
  | "plus"
  | "trash"
  | "edit"
  | "calendar"
  | "list"
  | "building"
  | "sliders"
  | "search"
  | "filter"
  | "lock"
  | "user"
  | "users"
  | "logout"
  | "clock"
  | "arrow-left"
  | "arrow-right"
  | "chevron-down"
  | "chevron-right"
  | "eye"
  | "printer"
  | "file-spreadsheet"
  | "play"
  | "x"
  | "info"
  | "palette"
  | "undo";

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName | string;
  size?: number;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    setup: (
      <>
        <path d="M8 4H5a2 2 0 0 0-2 2v14h18V6a2 2 0 0 0-2-2h-3" />
        <rect x="8" y="2" width="8" height="5" rx="1" />
        <path d="M7 11h10M7 15h7" />
      </>
    ),
    rooms: (
      <>
        <path d="M4 21V3h14v18M2 21h20M8 7h6M8 11h6M8 15h2M14 17v4" />
      </>
    ),
    personnel: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-4a6 6 0 0 1 12 0v4" />
        <path d="M16 11h6M19 8v6" />
      </>
    ),
    term: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M9 4v17M15 4v17" />
      </>
    ),
    assign: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5M3 21h12" />
      </>
    ),
    personal: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3M7 18h3" />
      </>
    ),
    draft: (
      <>
        <path d="M9 3H4v18h16V3h-5M9 3v4h6V3H9M8 13l2 2 6-5M8 18h8" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </>
    ),
    send: (
      <>
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4Z" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    alert: (
      <>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    bell: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>
    ),
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m17 8-5-5-5 5M12 3v12" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    building: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    "arrow-left": (
      <>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </>
    ),
    "arrow-right": (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    eye: (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    printer: (
      <>
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </>
    ),
    "file-spreadsheet": (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8M12 13v4" />
      </>
    ),
    play: <polygon points="6 3 20 12 6 21 6 3" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </>
    ),
    palette: (
      <>
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z" />
      </>
    ),
    undo: (
      <>
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? paths.personal}
    </svg>
  );
}

export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="icon-spin"
      aria-hidden="true"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  );
}

export function ActionButton({
  loading = false,
  loadingLabel,
  icon,
  variant = "secondary",
  children,
  disabled,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
  icon?: IconName;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variantClass =
    variant === "primary"
      ? "primary"
      : variant === "danger"
      ? "btn-remove"
      : variant === "ghost"
      ? "btn-ghost"
      : "";
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`btn-action ${variantClass} ${className}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        ...rest.style,
      }}
    >
      {loading ? <Spinner size={14} /> : icon ? <Icon name={icon} size={15} /> : null}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <Icon name="setup" size={28} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function Metrics({
  items,
}: {
  items: { label: string; value: string | number; detail: string; tone?: string }[];
}) {
  return (
    <div className="stats" data-count={items.length}>
      {items.map((x) => (
        <article key={x.label}>
          <span>{x.label}</span>
          <strong className={x.tone}>{x.value}</strong>
          <small>{x.detail}</small>
        </article>
      ))}
    </div>
  );
}
