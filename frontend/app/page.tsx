"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CatalogEditor } from "../features/catalog/catalog-editor";
import { ConfigEditor } from "../features/scheduling/config-editor";
import { TermCalendar } from "../features/scheduling/term-calendar";
import { buildDraftEvents } from "../features/scheduling/term-calendar-model";
import { RoomManager } from "../features/rooms/room-manager";
import { RequirementsEditor } from "../features/rooms/requirements-editor";
import { ActionButton, EmptyState, Icon, Metrics, Spinner } from "../features/shared/ui";
import { Workflow, DepartmentProgress } from "../features/workspace/overview-panels";
import { AssignmentPanel } from "../features/assignments/assignment-panel";
import { PersonnelMatrix } from "../features/assignments/personnel-matrix";
import { clock } from "../features/shared/time";
import { PlanImportCard } from "../features/workspace/plan-import-card";
import { DraftSchedule } from "../features/scheduling/draft-schedule";
import { PersonalSchedule, type ExternalDraft } from "../features/scheduling/personal-schedule";
import { useWorkspaceSession, type ToastItem } from "../features/workspace/use-workspace-session";
import { LoginScreen } from "../features/workspace/login-screen";

const roleName = { STAFF: "Giáo vụ", HEAD: "Trưởng bộ môn", TEACHER: "Giảng viên" };

function formatSyncTime(date: Date | null): string {
  if (!date) return "--:--:--";
  return date.toLocaleTimeString("vi-VN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatNotifTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec >= 0 && diffSec < 60) return "Vừa xong";
  if (diffSec >= 60 && diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  return d.toLocaleString("vi-VN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="region" aria-label="Thông báo trạng thái" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item ${t.tone}`}>
          <Icon
            name={
              t.tone === "success"
                ? "check"
                : t.tone === "error" || t.tone === "warning"
                ? "alert"
                : "info"
            }
            size={16}
          />
          <span>{t.text}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Đóng thông báo"
            onClick={() => onDismiss(t.id)}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const {
    auth,
    token,
    profile,
    workspace,
    message,
    setMessage,
    failed,
    loading,
    busy,
    pendingAction,
    lastSyncedAt,
    toasts,
    dismissToast,
    config,
    setConfig,
    apiUrl,
    refresh,
    perform,
    command,
    download,
    loginWithPassword,
    solverProgress,
    solverRunning,
    onlineTeachers: realtimeOnlineTeachers,
    realtimeConnected,
  } = useWorkspaceSession();

  const [tab, setTab] = useState("overview");
  const [termSource, setTermSource] = useState<"draft" | "published" | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastReadRev, setLastReadRev] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [draftLimit, setDraftLimit] = useState(60);
  const [draftQuery, setDraftQuery] = useState("");
  const [external, setExternal] = useState<ExternalDraft>({
    institution: "",
    course: "",
    class_name: "",
    room: "",
    day: 2,
    start: "07:10",
    end: "09:15",
    activity_type: "EXTERNAL_TEACHING",
    color: "#fef3c7",
    note: "",
  });

  const notifAnchorRef = useRef<HTMLDivElement | null>(null);

  const notifStorageKey = profile
    ? `schedule-notif-read-${profile.role}-${profile.teacher || "staff"}`
    : "";

  useEffect(() => {
    if (!notifStorageKey || typeof window === "undefined") {
      setLastReadRev(0);
      return;
    }
    const saved = Number(window.localStorage.getItem(notifStorageKey) || "0");
    setLastReadRev(Number.isFinite(saved) ? saved : 0);
  }, [notifStorageKey]);

  useEffect(() => {
    if (!notifOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (notifAnchorRef.current && !notifAnchorRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [notifOpen]);

  useEffect(() => {
    if (!token) {
      setTab("overview");
      setNotifOpen(false);
      setSettingsOpen(false);
    }
  }, [token]);

  function switchTab(newTab: string) {
    if (newTab === "draft" && tab !== "draft") {
      setIsEvaluating(true);
      setTab("draft");
      setMessage("");
      setTimeout(() => {
        setIsEvaluating(false);
      }, 60);
    } else {
      if (newTab === "term" && tab !== "draft") {
        setTermSource(undefined);
      }
      setTab(newTab);
      setMessage("");
    }
  }

  const state = workspace?.state;
  const staff = profile?.role === "STAFF";
  const head = profile?.role === "HEAD";
  const sessions = state?.sessions ?? [];
  const departments = state?.departments ?? [];
  const remaining = sessions.filter((s) => !s.teacher).length;
  const ready =
    !!sessions.length &&
    !!departments.length &&
    departments.every((d) => d.status === "SUBMITTED");

  const draftEvents = useMemo(() => buildDraftEvents(state), [state]);
  const personalColorRules = workspace?.color_rules ?? state?.config?.color_rules ?? [];
  const systemColorRules = state?.config?.color_rules ?? [];
  const activeShiftRules = state?.config?.shift_rules ?? workspace?.shift_rules ?? [];
  const onlineTeachers = realtimeOnlineTeachers?.length
    ? realtimeOnlineTeachers
    : workspace?.online_teachers ?? [];

  const notifications = useMemo(() => {
    const list = workspace?.notifications ?? [];
    return [...list].sort((a, b) => b.revision - a.revision);
  }, [workspace?.notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.revision > lastReadRev).length,
    [notifications, lastReadRev]
  );

  const markAllNotificationsRead = () => {
    const maxRev = Math.max(
      workspace?.revision ?? 0,
      ...notifications.map((n) => n.revision)
    );
    setLastReadRev(maxRev);
    if (notifStorageKey && typeof window !== "undefined") {
      window.localStorage.setItem(notifStorageKey, String(maxRev));
    }
  };

  const handleManualSync = () => {
    void perform(
      async () => {
        await refresh();
      },
      "refresh",
      "Đã đồng bộ dữ liệu mới nhất"
    );
  };

  if (!token) {
    return (
      <>
        <LoginScreen
          busy={busy}
          authReady={Boolean(auth)}
          message={message}
          failed={failed}
          onDismiss={() => setMessage("")}
          onLogin={loginWithPassword}
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          setLoginEmail={setLoginEmail}
          setLoginPassword={setLoginPassword}
        />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const tabs = profile
    ? [
        ["overview", "Tổng quan"],
        ...(staff ? [["setup", "Kế hoạch & Khung giờ"], ["rooms", "Phòng học"]] : []),
        ...(staff || head ? [["personnel", "Nhân Sự"], ["assign", "Phân công"]] : []),
        ...(staff ? [["draft", "Xếp lịch & công bố"], ["term", "Lịch học kỳ"]] : []),
        ...(!staff ? [["personal", "Lịch của tôi"]] : []),
      ]
    : [];

  const pageTitles: Record<string, string> = {
    overview: "Tổng quan điều phối",
    setup: "Kế hoạch mở lớp, Bộ môn & Quy chuẩn Ca/Tiết",
    rooms: "Quản lý phòng học",
    personnel: "Nhân Sự & Hồ sơ Năng lực Giảng viên",
    assign: "Phân công giảng dạy (LEC / TUT)",
    draft: "Xếp lịch & Công bố học kỳ",
    term: "Thời khóa biểu Cả Tuần",
    personal: "Lịch giảng dạy, Đi học & Mã màu cá nhân",
  };

  const descriptions: Record<string, string> = {
    overview: staff
      ? "Theo dõi tiến độ học kỳ và trạng thái bàn giao của các bộ môn."
      : head
      ? "Điều phối nhân sự, năng lực LEC/TUT và kế hoạch phân công của bộ môn."
      : "Tổng hợp khối lượng giảng dạy tại khoa, lịch đi học và lịch dạy trường ngoài.",
    setup:
      "Nhập kế hoạch đào tạo Excel, cấu hình khung ca/tiết đồng nhất T2–T7 (chuẩn HANU Tiết 3–14) và danh mục Bộ môn.",
    rooms: "Quản lý sức chứa, thiết bị máy chiếu/máy tính, ràng buộc phòng và lịch chiếm dụng.",
    personnel:
      "Quản lý tập trung toàn bộ nhân sự, trạng thái giảng dạy, phiên trực tuyến và hồ sơ năng lực LEC/TUT.",
    assign:
      "Điều phối kế hoạch bộ môn, gán giảng viên đủ năng lực LEC/TUT vào từng lớp học phần và cân đối tải.",
    draft: "Chạy bộ giải xếp lịch, kiểm tra ràng buộc và hiệu chỉnh từng lớp trước khi công bố.",
    term: "Tra cứu Thời khóa biểu dạng tuần (Tiết 1–15), Thời khóa biểu dạng học kỳ chuẩn QLĐT và lịch sử dụng phòng.",
    personal:
      "Xem lịch tuần, nhập lịch trường ngoài / lịch đi học và tùy chỉnh mã màu theo sở thích.",
  };

  const isRefreshing = pendingAction === "refresh";

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>

      {/* Main Sidebar */}
      <aside>
        <a className="brand" href="/">
          <span className="brand-mark">
            <Icon name="personal" />
          </span>
          <strong>
            ScheduleSolver
            <small>ĐIỀU PHỐI ĐÀO TẠO</small>
          </strong>
        </a>

        <p className="nav-label">KHÔNG GIAN LÀM VIỆC</p>
        <nav aria-label="Điều hướng chính">
          {loading || !profile ? (
            <div className="skeleton-nav" aria-label="Đang tải danh mục điều hướng">
              <div className="skeleton-item shimmer" />
              <div className="skeleton-item shimmer" />
              <div className="skeleton-item shimmer" />
              <div className="skeleton-item shimmer" />
              <div className="skeleton-item shimmer" />
            </div>
          ) : (
            tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-current={tab === id ? "page" : undefined}
                className={tab === id ? "active" : ""}
                onClick={() => switchTab(id)}
              >
                <Icon name={id} />
                <span>{label}</span>
                {id === "assign" && remaining > 0 && (
                  <span className="nav-count">{remaining}</span>
                )}
                {id === "draft" && isEvaluating && (
                  <span className="nav-spinner">
                    <Spinner size={13} />
                  </span>
                )}
              </button>
            ))
          )}
        </nav>

        <div className="aside-foot">
          {loading || !profile ? (
            <div
              className="user-card skeleton-user shimmer"
              aria-label="Đang tải thông tin người dùng"
            >
              <span className="avatar skeleton-avatar" />
              <div className="user-card-info skeleton-user-info">
                <div
                  className="skeleton-line"
                  style={{ width: "90px", height: "13px", marginBottom: "4px" }}
                />
                <div className="skeleton-badge-pill" style={{ width: "70px", height: "16px" }} />
              </div>
            </div>
          ) : (
            <div className="user-card">
              <span className="avatar">{staff ? "GV" : head ? "BM" : "CN"}</span>
              <div className="user-card-info">
                <b>{roleName[profile.role]}</b>
                <small>
                  {profile.department
                    ? `Bộ môn ${profile.department}`
                    : profile.teacher || "Điều phối"}
                </small>
              </div>
              <button
                type="button"
                className="settings-btn"
                aria-label="Cài đặt & Tài khoản"
                title="Cài đặt & Tài khoản"
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <Icon name="sliders" size={16} />
              </button>
            </div>
          )}

          {settingsOpen && (
            <div className="settings-popover">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setSettingsOpen(false);
                  handleManualSync();
                }}
              >
                <Icon name="refresh" size={14} className={isRefreshing ? "icon-spin" : undefined} />
                <span>Đồng bộ dữ liệu ({formatSyncTime(lastSyncedAt)})</span>
              </button>
              <button
                type="button"
                className="logout"
                onClick={() => {
                  setSettingsOpen(false);
                  void perform(async () => {
                    await auth?.auth.signOut();
                  }, "logout");
                }}
              >
                <Icon name="logout" size={14} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main id="main-content">
        <div className="topbar">
          <span>
            Quản lý đào tạo <span aria-hidden="true">/</span>{" "}
            {profile ? roleName[profile.role] : "Không gian"}
            {profile?.department ? ` (${profile.department})` : ""}
          </span>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {workspace && (
              <div
                className="sync-pill"
                title="Trạng thái kết nối tự động và thời điểm cập nhật dữ liệu gần nhất"
              >
                <span className={`sync-dot ${realtimeConnected ? "online" : ""}`} />
                <span>{realtimeConnected ? "Đã kết nối" : "Đang kết nối lại"}</span>
                <span aria-hidden="true">·</span>
                <span>Cập nhật {formatSyncTime(lastSyncedAt)}</span>
              </div>
            )}

            {/* Notification Bell + Unread Badge + Popover */}
            <div className="notif-anchor" ref={notifAnchorRef}>
              <button
                type="button"
                className="notif-bell-btn"
                aria-label="Trung tâm thông báo"
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((prev) => !prev)}
                title="Hoạt động & thông báo hệ thống"
              >
                <Icon name="bell" size={16} />
                {unreadCount > 0 && (
                  <span className="notif-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-popover" role="dialog" aria-label="Hoạt động hệ thống">
                  <div className="notif-popover-head">
                    <b>Hoạt động gần đây ({notifications.length})</b>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={markAllNotificationsRead}
                        style={{ minHeight: "26px", padding: "2px 8px", fontSize: "11px" }}
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div
                      style={{
                        padding: "28px 16px",
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: "12px",
                      }}
                    >
                      <Icon name="bell" size={22} />
                      <p style={{ margin: "8px 0 0" }}>Chưa có hoạt động nào ghi nhận</p>
                    </div>
                  ) : (
                    <div>
                      {notifications.slice(0, 30).map((n) => {
                        const isUnread = n.revision > lastReadRev;
                        return (
                          <div
                            key={n.id || `${n.revision}-${n.action}`}
                            className={`notif-item ${isUnread ? "unread" : ""}`}
                          >
                            {isUnread ? (
                              <span className="notif-unread-dot" aria-label="Chưa đọc" />
                            ) : (
                              <span style={{ width: "7px", flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: isUnread ? 600 : 500, color: "#0f172a" }}>
                                {n.summary}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  flexWrap: "wrap",
                                  marginTop: "4px",
                                  fontSize: "11px",
                                  color: "var(--muted)",
                                }}
                              >
                                <span>{n.actor_label || n.actor_role || "Hệ thống"}</span>
                                <span aria-hidden="true">·</span>
                                <span>{formatNotifTime(n.created_at)}</span>
                                {n.department && (
                                  <span
                                    className="badge neutral"
                                    style={{ fontSize: "9.5px", padding: "1px 6px" }}
                                  >
                                    BM {n.department}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-action"
              disabled={busy}
              onClick={handleManualSync}
              style={{
                minHeight: "32px",
                padding: "4px 11px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Icon
                name="refresh"
                size={14}
                className={isRefreshing ? "icon-spin" : undefined}
              />
              <span>{isRefreshing ? "Đang đồng bộ..." : "Đồng bộ"}</span>
            </button>
          </div>
        </div>

        <header>
          <div>
            <span className="eyebrow">
              {profile ? roleName[profile.role] : "SCHEDULE SOLVER"}
            </span>
            <h1>{pageTitles[tab] || "Không gian làm việc"}</h1>
            <p>{descriptions[tab] || ""}</p>
          </div>
          <div className="header-actions">
            {workspace && (
              <span
                className={"badge " + (workspace.has_publication ? "success" : "neutral")}
              >
                {workspace.has_publication && <Icon name="check" size={13} />}
                <span>
                  {workspace.has_publication
                    ? "Đã có lịch công bố"
                    : "Đang chuẩn bị học kỳ"}
                </span>
              </span>
            )}
          </div>
        </header>

        {message && failed && (
          <div className="notice error" role="alert">
            <b>Không thể hoàn tất thao tác</b>
            <span>{message}</span>
            <button aria-label="Đóng thông báo" onClick={() => setMessage("")}>
              <Icon name="x" size={15} />
            </button>
          </div>
        )}

        {busy && (
          <div className="working" role="status">
            <span className="spinner" />
            Đang xử lý, vui lòng chờ…
          </div>
        )}

        {!workspace ? (
          <section className="card" aria-busy={loading}>
            {loading ? (
              <div className="empty-state">
                <span className="spinner" />
                <h2>Đang tải không gian làm việc…</h2>
              </div>
            ) : (
              <>
                <EmptyState title="Chưa tải được không gian làm việc">
                  Kiểm tra kết nối hoặc liên hệ quản trị viên về quyền tài khoản.
                </EmptyState>
                <ActionButton
                  type="button"
                  icon="refresh"
                  loading={busy}
                  onClick={handleManualSync}
                >
                  Thử lại
                </ActionButton>
              </>
            )}
          </section>
        ) : (
          <>
            {/* Tab: Overview */}
            {tab === "overview" && (
              <>
                <Metrics
                  items={
                    staff
                      ? [
                          {
                            label: "Lớp trong kế hoạch",
                            value: sessions.length,
                            detail: remaining + " lớp chưa phân công",
                          },
                          {
                            label: "Bộ môn đã nộp",
                            value:
                              departments.filter((d) => d.status === "SUBMITTED").length +
                              "/" +
                              departments.length,
                            detail: "Phân công sẵn sàng để xếp lịch",
                          },
                          {
                            label: "Phòng học khả dụng",
                            value: (state?.rooms ?? []).filter((r) => r.active !== false).length,
                            detail: `Trên tổng ${(state?.rooms ?? []).length} phòng`,
                          },
                          {
                            label: "Buổi đã xếp (Nháp / Công bố)",
                            value: `${draftEvents.length} / ${state?.published.length ?? 0}`,
                            detail: "Xem ngay trên Lịch học kỳ",
                            tone: "text-success",
                          },
                        ]
                      : head
                      ? [
                          {
                            label: "Lớp thuộc bộ môn",
                            value: sessions.length,
                            detail: remaining + " lớp chưa phân công",
                          },
                          {
                            label: "Nhân sự bộ môn",
                            value: state?.teachers?.length ?? 0,
                            detail: "Xem đầy đủ tại mục Nhân Sự",
                          },
                          {
                            label: "Khối lượng bộ môn",
                            value: sessions.reduce((n, s) => n + (s.periods ?? 0), 0),
                            detail: "Tiết/tuần trong kế hoạch",
                          },
                          {
                            label: "Trạng thái kế hoạch",
                            value:
                              departments[0]?.status === "SUBMITTED"
                                ? "Đã nộp"
                                : departments[0]?.status === "SENT"
                                ? "Đang gán"
                                : "Chưa gửi",
                            detail: departments[0]?.id ? `Bộ môn ${departments[0].id}` : "Bộ môn",
                            tone: departments[0]?.status === "SUBMITTED" ? "text-success" : "",
                          },
                        ]
                      : [
                          {
                            label: "Buổi giảng dạy tại khoa",
                            value: state?.published.length ?? 0,
                            detail: "Đã được Giáo vụ công bố",
                          },
                          {
                            label: "Khối lượng tại khoa",
                            value: state?.published.some((s) => s.periods === undefined)
                              ? "—"
                              : state?.published.reduce((n, s) => n + (s.periods ?? 0), 0) ?? 0,
                            detail: "Tiết/tuần theo lịch công bố",
                          },
                          {
                            label: "Lịch ngoài & Đi học",
                            value: state?.external?.length ?? 0,
                            detail: "Đã khai báo / Import",
                          },
                        ]
                  }
                />

                <section className="context-banner">
                  <Icon name={staff ? "draft" : head ? "assign" : "personal"} />
                  <div>
                    <b>
                      {staff
                        ? sessions.length
                          ? ready
                            ? "Sẵn sàng kiểm tra và xếp lịch"
                            : "Tiếp tục phối hợp phân công bộ môn"
                          : "Bắt đầu từ kế hoạch mở lớp"
                        : head
                        ? "Không gian Nhân Sự & Phân công của bộ môn"
                        : "Lịch giảng dạy, Đi học & Mã màu cá nhân"}
                    </b>
                    <p>
                      {staff
                        ? ready
                          ? "Các bộ môn đã nộp. Kiểm tra phòng và chạy xếp lịch để xem ngay TKB cả tuần."
                          : "Gửi kế hoạch mở lớp và theo dõi kết quả phân công tại mục Phân công."
                        : head
                        ? "Cập nhật môn phụ trách LEC / TUT tại mục Nhân Sự, sau đó gán lớp và nộp phân công."
                        : "Mở mục Lịch của tôi để xem TKB tuần, nhập lịch trường ngoài/đi học và tùy chỉnh mã màu."}
                    </p>
                  </div>
                  <ActionButton
                    type="button"
                    variant="primary"
                    icon="arrow-right"
                    disabled={busy}
                    onClick={() =>
                      switchTab(
                        staff
                          ? sessions.length
                            ? ready
                              ? "draft"
                              : "assign"
                            : "setup"
                          : head
                          ? "personnel"
                          : "personal"
                      )
                    }
                  >
                    {staff
                      ? sessions.length
                        ? ready
                          ? "Đến xếp lịch"
                          : "Điều phối phân công"
                        : "Nhập kế hoạch mở lớp"
                      : head
                      ? "Mở bảng Nhân Sự"
                      : "Mở Lịch của tôi"}
                  </ActionButton>
                </section>

                {staff && (
                  <Workflow
                    departments={departments}
                    sessions={sessions}
                    draftCount={state?.draft?.length ?? 0}
                    published={workspace.has_publication}
                    navigate={switchTab}
                  />
                )}
                {(staff || head) && (
                  <DepartmentProgress
                    departments={departments}
                    sessions={sessions}
                    staff={staff}
                    busy={busy}
                    navigate={switchTab}
                  />
                )}
              </>
            )}

            {/* Tab: Setup */}
            {tab === "setup" && staff && (
              <>
                <PlanImportCard
                  apiUrl={apiUrl}
                  token={token}
                  busy={busy}
                  sessionsCount={sessions.length}
                  perform={perform}
                  command={command}
                />

                <ConfigEditor
                  value={config}
                  onChange={setConfig}
                  disabled={busy}
                  hasPublished={Boolean(state?.published.length)}
                  onSave={(data) => perform(() => command("config", data), "config")}
                />

                <CatalogEditor
                  key={"catalog" + workspace.revision}
                  initialDepartments={state?.departments ?? []}
                  initialTeachers={state?.teachers ?? []}
                  onlineTeacherIds={onlineTeachers}
                  realtimeConnected={realtimeConnected}
                  disabled={busy}
                  onSaveCatalog={(data) => perform(() => command("catalog", data), "catalog")}
                  onSaveDept={(data) =>
                    perform(() => command("department-save", data), "department-save")
                  }
                  onDeleteDept={(id) =>
                    perform(() => command("department-delete", { id }), "department-delete")
                  }
                />
              </>
            )}

            {/* Tab: Personnel */}
            {tab === "personnel" && (staff || head) && (
              <PersonnelMatrix
                teachers={state?.teachers ?? []}
                departments={state?.departments ?? []}
                sessions={state?.sessions ?? []}
                offerings={state?.offerings ?? []}
                onlineTeachers={onlineTeachers}
                currentTeacher={profile?.teacher}
                role={profile?.role ?? "STAFF"}
                busy={busy}
                onCommand={(action, payload) => perform(() => command(action, payload), action)}
              />
            )}

            {/* Tab: Rooms */}
            {tab === "rooms" && staff && (
              <>
                {state?.published.some((r) => !r.room_id) && (
                  <section className="card">
                    <h2>Xác nhận phòng cho lịch công bố cũ</h2>
                    <p>
                      Cần đối chiếu phòng thực tế để bảo vệ chiếm dụng trước khi chạy bộ giải.
                    </p>
                    {state?.published
                      .filter((r) => !r.room_id)
                      .map((r) => (
                        <label key={r.id}>
                          {r.id} · Thứ {r.day} · {clock(r.start)}–{clock(r.end)}
                          <select
                            disabled={busy}
                            value=""
                            onChange={(e) =>
                              perform(
                                () =>
                                  command("published-room", {
                                    session: r.id,
                                    room_id: e.target.value,
                                  }),
                                "published-room"
                              )
                            }
                          >
                            <option value="" disabled>
                              Chọn phòng đã xác nhận
                            </option>
                            {state?.rooms?.map((room) => (
                              <option key={room.id} value={room.id}>
                                {room.id}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                  </section>
                )}
                <RoomManager
                  key={workspace.revision}
                  initial={state?.rooms ?? []}
                  reservations={state?.reservations ?? []}
                  departments={state?.departments ?? []}
                  offerings={state?.offerings ?? []}
                  shiftRules={activeShiftRules}
                  disabled={busy}
                  onCommand={(action, payload) => perform(() => command(action, payload), action)}
                />
                <RequirementsEditor
                  key={"requirements" + workspace.revision}
                  sessions={state?.sessions ?? []}
                  rooms={state?.rooms ?? []}
                  offerings={state?.offerings ?? []}
                  departments={state?.departments ?? []}
                  disabled={busy}
                  onCommand={(action, payload) => perform(() => command(action, payload), action)}
                />
              </>
            )}

            {/* Tab: Assignments */}
            {tab === "assign" && (staff || head) && (
              <>
                {staff && sessions.length === 0 && (
                  <div className="context-banner subtle" style={{ marginBottom: "16px" }}>
                    <Icon name="setup" />
                    <div>
                      <b>Chưa có kế hoạch mở lớp trong hệ thống</b>
                      <p>
                        Hãy chuyển sang mục Kế hoạch &amp; Khung giờ để tải lên tệp Excel kế hoạch đào tạo trước khi phân công.
                      </p>
                    </div>
                    <ActionButton
                      type="button"
                      variant="primary"
                      icon="arrow-right"
                      onClick={() => switchTab("setup")}
                    >
                      Đi tới Kế hoạch &amp; Khung giờ
                    </ActionButton>
                  </div>
                )}
                <AssignmentPanel
                  sessions={state?.sessions ?? []}
                  teachers={state?.teachers ?? []}
                  departments={state?.departments ?? []}
                  offerings={state?.offerings ?? []}
                  head={head}
                  busy={busy}
                  onCommand={(action, payload) => perform(() => command(action, payload), action)}
                  onOpenPersonnel={() => switchTab("personnel")}
                />
              </>
            )}

            {/* Tab: Draft & Solve */}
            {tab === "draft" && staff && (
              <DraftSchedule
                workspace={workspace}
                busy={busy}
                ready={ready}
                isEvaluating={isEvaluating}
                solverProgress={solverProgress}
                solverRunning={solverRunning}
                perform={perform}
                command={command}
                download={download}
                onAssignClick={() => switchTab("assign")}
                onOpenTermDraft={() => {
                  setTermSource("draft");
                  setTab("term");
                  setMessage("");
                }}
                draftLimit={draftLimit}
                setDraftLimit={setDraftLimit}
                draftQuery={draftQuery}
                setDraftQuery={setDraftQuery}
              />
            )}

            {/* Tab: Whole Term Calendar */}
            {tab === "term" && staff && (
              <TermCalendar
                events={state?.published ?? []}
                draftEvents={draftEvents}
                rooms={state?.rooms ?? []}
                offerings={state?.offerings ?? []}
                colorRules={systemColorRules}
                shiftRules={activeShiftRules}
                periodConfig={workspace.period_config ?? state?.config}
                initialSource={termSource}
                termConfig={
                  state?.config
                    ? {
                        term_name: state.config.term_name,
                        term_start_date: state.config.term_start_date,
                        term_end_date: state.config.term_end_date,
                        holidays: state.config.holidays,
                      }
                    : workspace.term_config
                }
                apiUrl={apiUrl}
                token={token}
              />
            )}

            {/* Tab: Personal Schedule (HEAD & TEACHER) */}
            {tab === "personal" && !staff && (
              <PersonalSchedule
                apiUrl={apiUrl}
                token={token}
                state={state!}
                colorRules={personalColorRules}
                shiftRules={activeShiftRules}
                periodConfig={workspace.period_config ?? state?.config}
                termConfig={
                  workspace.term_config ??
                  (state?.config
                    ? {
                        term_name: state.config.term_name,
                        term_start_date: state.config.term_start_date,
                        term_end_date: state.config.term_end_date,
                        holidays: state.config.holidays,
                      }
                    : undefined)
                }
                hasPublication={workspace.has_publication}
                busy={busy}
                perform={perform}
                command={command}
                external={external}
                setExternal={setExternal}
              />
            )}
          </>
        )}

        <footer>ScheduleSolver · Hệ thống Quản trị &amp; Điều phối Đào tạo Đại học</footer>
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
