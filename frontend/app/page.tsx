"use client";
import { useEffect, useState } from "react";
import { CatalogEditor } from "../features/catalog/catalog-editor";
import { ConfigEditor } from "../features/scheduling/config-editor";
import { TermCalendar } from "../features/scheduling/term-calendar";
import { RoomManager } from "../features/rooms/room-manager";
import { RequirementsEditor } from "../features/rooms/requirements-editor";
import { Icon, Metrics, EmptyState } from "../features/shared/ui";
import { Workflow, DepartmentProgress } from "../features/workspace/overview-panels";
import { AssignmentPanel } from "../features/assignments/assignment-panel";
import { PersonalCalendar } from "../features/scheduling/personal-calendar";
import { clock } from "../features/shared/time";
import { PlanImportCard } from "../features/workspace/plan-import-card";
import { DraftSchedule } from "../features/scheduling/draft-schedule";
import { PersonalSchedule } from "../features/scheduling/personal-schedule";
import { useWorkspaceSession } from "../features/workspace/use-workspace-session";
import { LoginScreen } from "../features/workspace/login-screen";

const roleName = { STAFF: "Giáo vụ", HEAD: "Trưởng bộ môn", TEACHER: "Giảng viên" };

export default function Home() {
  const { auth, token, profile, workspace, message, setMessage, failed, loading, busy,
    config, setConfig, apiUrl, refresh, perform, command, download, loginWithPassword,
    solverProgress, solverRunning, onlineTeachers, realtimeConnected } = useWorkspaceSession();
  const [tab, setTab] = useState("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [draftLimit, setDraftLimit] = useState(60);
  const [draftQuery, setDraftQuery] = useState("");
  const [external, setExternal] = useState({
    institution: "", course: "", class_name: "", room: "", day: 2,
    start: "07:00", end: "09:30",
  });

  useEffect(() => {
    if (!token) setTab("overview");
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
  const unsent = departments.some((d) => d.status === "UNSENT" && sessions.some((s) => s.department === d.id));
  const ready = !!sessions.length && !!departments.length && departments.every((d) => d.status === "SUBMITTED");

  if (!token) {
    return <LoginScreen busy={busy} authReady={Boolean(auth)} message={message} failed={failed}
      onDismiss={() => setMessage("")} onLogin={loginWithPassword}
      loginEmail={loginEmail} loginPassword={loginPassword} setLoginEmail={setLoginEmail} setLoginPassword={setLoginPassword} />;
  }

  const tabs = profile
    ? [
        ["overview", "Tổng quan"],
        ...(staff ? [["setup", "Giảng viên & Bộ môn"], ["rooms", "Phòng học"]] : []),
        ...(staff || head ? [["assign", "Phân công"]] : []),
        ...(staff ? [["draft", "Xếp lịch & công bố"], ["term", "Lịch học kỳ"]] : []),
        ...(!staff ? [["personal", "Lịch của tôi"]] : []),
      ]
    : [];

  const pageTitles: Record<string, string> = {
    overview: "Tổng quan điều phối",
    setup: "Giảng viên & Bộ môn",
    rooms: "Quản lý phòng học",
    assign: "Phân công giảng dạy",
    draft: "Xếp lịch & công bố",
    term: "Thời khóa biểu toàn học kỳ",
    personal: "Lịch giảng dạy cá nhân",
  };
  const descriptions: Record<string, string> = {
    overview: staff
      ? "Theo dõi tiến độ học kỳ và phối hợp cùng các bộ môn."
      : head
      ? "Điều phối giảng viên và theo dõi kế hoạch của bộ môn."
      : "Theo dõi các lớp và lịch giảng dạy đã được công bố.",
    setup: "Quản lý danh mục bộ môn, giảng viên, cấu hình khung giờ và nhập kế hoạch đào tạo.",
    rooms: "Quản lý sức chứa, thiết bị máy chiếu/máy tính và lịch chiếm dụng.",
    assign: "Đúng giảng viên, đúng năng lực, phân bố đều khối lượng phụ trách.",
    draft: "Kiểm tra ràng buộc phòng/giờ và hoàn thiện thời khóa biểu trước khi công bố.",
    term: "Theo dõi lịch của tất cả khóa học, giảng viên và phòng trong học kỳ.",
    personal: "Lịch khoa chính thức và lịch ngoài trong cùng một không gian.",
  };

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
                aria-current={tab === id ? "page" : undefined}
                className={tab === id ? "active" : ""}
                onClick={() => switchTab(id)}
              >
                <Icon name={id} />
                <span>{label}</span>
                {id === "assign" && remaining > 0 && <span className="nav-count">{remaining}</span>}
                {id === "draft" && isEvaluating && <span className="nav-spinner">⏳</span>}
              </button>
            ))
          )}
        </nav>

        {/* Sidebar Footer with Role Info and Settings Dropdown */}
        <div className="aside-foot">
          {loading || !profile ? (
            <div className="user-card skeleton-user shimmer" aria-label="Đang tải thông tin người dùng">
              <span className="avatar skeleton-avatar" />
              <div className="user-card-info skeleton-user-info">
                <div className="skeleton-line" style={{ width: "90px", height: "13px", marginBottom: "4px" }} />
                <div className="skeleton-badge-pill" style={{ width: "70px", height: "16px" }} />
              </div>
            </div>
          ) : (
            <div className="user-card">
              <span className="avatar">{staff ? "GV" : head ? "BM" : "CN"}</span>
              <div className="user-card-info">
                <b>{roleName[profile.role]}</b>
                <small>{profile.department ? `Bộ môn ${profile.department}` : profile.teacher || "Điều phối"}</small>
              </div>
              <button
                className="settings-btn"
                aria-label="Cài đặt & Tài khoản"
                title="Cài đặt & Tài khoản"
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            </div>
          )}

          {settingsOpen && (
            <div className="settings-popover">
              <button
                onClick={() => {
                  setSettingsOpen(false);
                  void perform(refresh);
                }}
              >
                <span>↻ Đồng bộ & làm mới</span>
              </button>
              <button
                className="logout"
                onClick={() => {
                  setSettingsOpen(false);
                  void perform(async () => {
                    await auth?.auth.signOut();
                  });
                }}
              >
                <span>🚪 Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main id="main-content">
        {/* Streamlined Topbar */}
        <div className="topbar">
          <span>
            Quản lý đào tạo <span aria-hidden="true">/</span> {profile ? roleName[profile.role] : "Không gian"}
            {workspace && (
              <span style={{ marginLeft: "12px", color: "var(--muted)" }}>
                (Phiên {workspace.revision})
              </span>
            )}
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button disabled={busy} onClick={() => perform(refresh)} style={{ minHeight: "30px", padding: "4px 10px" }}>
              ↻ Làm mới
            </button>
          </div>
        </div>

        {/* Compact Page Header */}
        <header>
          <div>
            <span className="eyebrow">{profile ? roleName[profile.role] : "SCHEDULE SOLVER"}</span>
            <h1>{pageTitles[tab] || "Không gian làm việc"}</h1>
            <p>{descriptions[tab] || ""}</p>
          </div>
          <div className="header-actions">
            {workspace && (
              <span className={"badge " + (workspace.has_publication ? "success" : "neutral")}>
                {workspace.has_publication ? "✓ Đã có lịch công bố" : "Đang chuẩn bị học kỳ"}
              </span>
            )}
          </div>
        </header>

        {/* Global Alert / Notice */}
        {message && (
          <div className={"notice " + (failed ? "error" : "success")} role={failed ? "alert" : "status"}>
            <b>{failed ? "Không thể hoàn tất thao tác" : "Thông báo"}</b>
            <span>{message}</span>
            <button aria-label="Đóng thông báo" onClick={() => setMessage("")}>
              ×
            </button>
          </div>
        )}

        {/* Loading Spinner Indicator */}
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
                <button disabled={busy} onClick={() => perform(refresh)}>
                  Thử lại
                </button>
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
                          { label: "Lớp trong kế hoạch", value: sessions.length, detail: remaining + " lớp chưa phân công" },
                          {
                            label: "Bộ môn đã nộp",
                            value: departments.filter((d) => d.status === "SUBMITTED").length + "/" + departments.length,
                            detail: "Phân công sẵn sàng để xếp lịch",
                          },
                          {
                            label: "Buổi đã công bố",
                            value: state?.published.length ?? 0,
                            detail: "Lịch giảng dạy chính thức",
                            tone: "text-success",
                          },
                        ]
                      : head
                      ? [
                          { label: "Lớp thuộc bộ môn", value: sessions.length, detail: remaining + " lớp chưa phân công" },
                          { label: "Giảng viên bộ môn", value: state?.teachers?.length ?? 0, detail: "Theo danh mục được cấp" },
                          {
                            label: "Khối lượng bộ môn",
                            value: sessions.reduce((n, s) => n + (s.periods ?? 0), 0),
                            detail: "Tiết/tuần trong kế hoạch",
                          },
                        ]
                      : [
                          { label: "Buổi giảng dạy", value: state?.published.length ?? 0, detail: "Đã được giáo vụ công bố" },
                          {
                            label: "Khối lượng giảng dạy",
                            value: state?.published.some((s) => s.periods === undefined)
                              ? "—"
                              : state?.published.reduce((n, s) => n + (s.periods ?? 0), 0) ?? 0,
                            detail: "Tiết/tuần theo lịch công bố",
                          },
                          { label: "Buổi lịch ngoài", value: state?.external?.length ?? 0, detail: "Lịch cá nhân đã khai báo" },
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
                            : "Tiếp tục phối hợp phân công"
                          : "Bắt đầu từ kế hoạch mở lớp"
                        : head
                        ? "Không gian phân công của bộ môn"
                        : "Lịch giảng dạy của bạn"}
                    </b>
                    <p>
                      {staff
                        ? ready
                          ? "Các bộ môn đã nộp. Kiểm tra phòng và ràng buộc trước khi chạy xếp lịch."
                          : "Gửi kế hoạch, theo dõi phân công và phản hồi những lớp cần điều chỉnh."
                        : head
                        ? "Xem kế hoạch, cân đối khối lượng và nộp phân công cho giáo vụ."
                        : "Lịch chỉ hiển thị khi đã được công bố; lịch ngoài được quản lý riêng cho bạn."}
                    </p>
                  </div>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => {
                      if (staff && unsent) {
                        void perform(() => command("send-all", {}));
                      } else {
                        switchTab(staff ? (sessions.length ? (ready ? "draft" : "assign") : "setup") : head ? "assign" : "personal");
                      }
                    }}
                  >
                    {staff
                      ? unsent
                        ? "⚡ Gửi kế hoạch đồng loạt cho các bộ môn"
                        : sessions.length
                        ? ready
                          ? "Đến xếp lịch"
                          : "Xem phân công"
                        : "Nhập kế hoạch"
                      : head
                      ? "Phân công giảng viên"
                      : "Mở lịch cá nhân"}{" "}
                    →
                  </button>
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
                    onCommand={(action, payload) => perform(() => command(action, payload))}
                  />
                )}
                {!staff && !head && <PersonalCalendar published={state?.published ?? []} external={state?.external ?? []} />}
              </>
            )}

            {/* Tab: Setup (Catalogs & Configurations) */}
            {tab === "setup" && staff && (
              <>
                <CatalogEditor
                  key={"catalog" + workspace.revision}
                  initialDepartments={state?.departments ?? []}
                  initialTeachers={state?.teachers ?? []}
                  onlineTeacherIds={onlineTeachers}
                  realtimeConnected={realtimeConnected}
                  disabled={busy}
                  onSaveCatalog={(data) => perform(() => command("catalog", data))}
                  onSaveDept={(data) => perform(() => command("department-save", data))}
                  onDeleteDept={(id) => perform(() => command("department-delete", { id }))}
                  onSaveTeacher={(t) => perform(() => command("teacher-save", t))}
                  onDeleteTeacher={(id) => perform(() => command("teacher-delete", { id }))}
                />

                <ConfigEditor
                  value={config}
                  onChange={setConfig}
                  disabled={busy}
                  hasPublished={Boolean(state?.published.length)}
                  onSave={(data) => perform(() => command("config", data))}
                />
              </>
            )}

            {/* Tab: Rooms */}
            {tab === "rooms" && staff && (
              <>
                {state?.published.some((r) => !r.room_id) && (
                  <section className="card">
                    <h2>Xác nhận phòng cho lịch công bố cũ</h2>
                    <p>
                      Cần đối chiếu phòng thực tế để bảo vệ chiếm dụng trước khi chạy bộ giải. Không tự suy đoán mã phòng.
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
                              perform(() => command("published-room", { session: r.id, room_id: e.target.value }))
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
                  disabled={busy}
                  onCommand={(action, payload) => perform(() => command(action, payload))}
                />
                <RequirementsEditor
                  key={"requirements" + workspace.revision}
                  sessions={state?.sessions ?? []}
                  disabled={busy}
                  onCommand={(action, payload) => perform(() => command(action, payload))}
                />
              </>
            )}

            {/* Tab: Assignments */}
            {tab === "assign" && (staff || head) && (
              <>
                {staff && sessions.length === 0 && (
                  <PlanImportCard
                    apiUrl={apiUrl}
                    token={token}
                    busy={busy}
                    sessionsCount={sessions.length}
                    perform={perform}
                    command={command}
                  />
                )}
                {staff && sessions.length > 0 && (
                  <details className="card" style={{ marginBottom: "16px" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                      📂 Nhập lại kế hoạch đào tạo Excel (.xlsx) / Reset về 0 lớp
                    </summary>
                    <div style={{ marginTop: "14px" }}>
                      <PlanImportCard
                        apiUrl={apiUrl}
                        token={token}
                        busy={busy}
                        sessionsCount={sessions.length}
                        perform={perform}
                        command={command}
                      />
                    </div>
                  </details>
                )}
                {staff && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => perform(() => command("capabilities-preset", {}))}
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      ⚡ Cập nhật năng lực giảng viên theo TKB gốc
                    </button>
                  </div>
                )}
                <AssignmentPanel
                  sessions={state?.sessions ?? []}
                  teachers={state?.teachers ?? []}
                  departments={state?.departments ?? []}
                  head={head}
                  busy={busy}
                  onCommand={(action, payload) => perform(() => command(action, payload))}
                />
              </>
            )}

            {tab === "draft" && staff && (
              <DraftSchedule workspace={workspace} busy={busy} ready={ready} isEvaluating={isEvaluating}
                solverProgress={solverProgress} solverRunning={solverRunning}
                perform={perform} command={command} download={download} onAssignClick={() => setTab("assign")}
                draftLimit={draftLimit} setDraftLimit={setDraftLimit} draftQuery={draftQuery} setDraftQuery={setDraftQuery} />
            )}

            {/* Tab: Whole Term Calendar */}
            {tab === "term" && staff && <TermCalendar events={state?.published ?? []} rooms={state?.rooms ?? []} />}

            {tab === "personal" && !staff && (
              <PersonalSchedule state={state!} hasPublication={workspace.has_publication} busy={busy}
                perform={perform} command={command} external={external} setExternal={setExternal} />
            )}
          </>
        )}

        <footer>ScheduleSolver · Hệ thống Quản trị & Điều phối Đào tạo Đại học</footer>
      </main>
    </div>
  );
}
