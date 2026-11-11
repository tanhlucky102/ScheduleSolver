"use client";
import { useEffect, useMemo, useState } from "react";
import { CatalogEditor } from "../features/catalog/catalog-editor";
import { ConfigEditor } from "../features/scheduling/config-editor";
import { TermCalendar } from "../features/scheduling/term-calendar";
import { buildDraftEvents } from "../features/scheduling/term-calendar-model";
import { RoomManager } from "../features/rooms/room-manager";
import { RequirementsEditor } from "../features/rooms/requirements-editor";
import { Icon, Metrics, EmptyState } from "../features/shared/ui";
import { Workflow, DepartmentProgress } from "../features/workspace/overview-panels";
import { AssignmentPanel } from "../features/assignments/assignment-panel";
import { PersonnelMatrix } from "../features/assignments/personnel-matrix";
import { clock } from "../features/shared/time";
import { PlanImportCard } from "../features/workspace/plan-import-card";
import { DraftSchedule } from "../features/scheduling/draft-schedule";
import { PersonalSchedule, type ExternalDraft } from "../features/scheduling/personal-schedule";
import { useWorkspaceSession } from "../features/workspace/use-workspace-session";
import { LoginScreen } from "../features/workspace/login-screen";

const roleName = { STAFF: "Giáo vụ", HEAD: "Trưởng bộ môn", TEACHER: "Giảng viên" };

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
    config,
    setConfig,
    apiUrl,
    refresh,
    perform,
    command,
    download,
    loginWithPassword,
  } = useWorkspaceSession();

  const [tab, setTab] = useState("overview");
  const [termSource, setTermSource] = useState<"draft" | "published" | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const ready = !!sessions.length && !!departments.length && departments.every((d) => d.status === "SUBMITTED");

  const draftEvents = useMemo(() => buildDraftEvents(state), [state]);
  const personalColorRules = workspace?.color_rules ?? state?.config?.color_rules ?? [];
  const systemColorRules = state?.config?.color_rules ?? [];
  const activeShiftRules = state?.config?.shift_rules ?? workspace?.shift_rules ?? [];
  const onlineTeachers = workspace?.online_teachers ?? [];

  if (!token) {
    return (
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
      ? "Theo dõi tiến độ học kỳ và phối hợp cùng các bộ môn."
      : head
      ? "Điều phối nhân sự, năng lực LEC/TUT và kế hoạch của bộ môn."
      : "Tổng hợp khối lượng giảng dạy tại khoa, lịch đi học và lịch dạy trường ngoài.",
    setup: "Nhập kế hoạch đào tạo Excel, cấu hình khung ca/tiết đồng nhất T2–T7 (chuẩn HANU Tiết 3–14) và danh mục Bộ môn.",
    rooms: "Quản lý sức chứa, thiết bị máy chiếu/máy tính, file mẫu CSV và lịch chiếm dụng.",
    personnel: "Quản lý tập trung toàn bộ nhân sự, trạng thái hoạt động tại khoa, Online và môn phụ trách LEC/TUT.",
    assign: "Gán giảng viên đủ năng lực LEC/TUT vào từng lớp học phần và cân đối tải.",
    draft: "Chạy bộ giải xếp lịch, kiểm tra ràng buộc và hiệu chỉnh từng lớp trước khi công bố.",
    term: "Đối chiếu TKB cả tuần (Bản nháp & Chính thức) theo Ma trận Thứ×Ca, Danh sách môn và Phòng học.",
    personal: "Xem lịch tuần, import lịch trường ngoài / lịch đi học và tự đánh dấu mã màu / ghi chú theo sở thích.",
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

        {message && (
          <div className={"notice " + (failed ? "error" : "success")} role={failed ? "alert" : "status"}>
            <b>{failed ? "Không thể hoàn tất thao tác" : "Thông báo"}</b>
            <span>{message}</span>
            <button aria-label="Đóng thông báo" onClick={() => setMessage("")}>
              ×
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
                            label: "Buổi đã xếp (Nháp / Công bố)",
                            value: `${draftEvents.length} / ${state?.published.length ?? 0}`,
                            detail: "Xem ngay trên Lịch học kỳ",
                            tone: "text-success",
                          },
                        ]
                      : head
                      ? [
                          { label: "Lớp thuộc bộ môn", value: sessions.length, detail: remaining + " lớp chưa phân công" },
                          { label: "Nhân sự bộ môn", value: state?.teachers?.length ?? 0, detail: "Xem đầy đủ tại mục Nhân Sự" },
                          {
                            label: "Khối lượng bộ môn",
                            value: sessions.reduce((n, s) => n + (s.periods ?? 0), 0),
                            detail: "Tiết/tuần trong kế hoạch",
                          },
                        ]
                      : [
                          { label: "Buổi giảng dạy tại khoa", value: state?.published.length ?? 0, detail: "Đã được giáo vụ công bố" },
                          {
                            label: "Khối lượng tại khoa",
                            value: state?.published.some((s) => s.periods === undefined)
                              ? "—"
                              : state?.published.reduce((n, s) => n + (s.periods ?? 0), 0) ?? 0,
                            detail: "Tiết/tuần theo lịch công bố",
                          },
                          { label: "Lịch ngoài & Đi học", value: state?.external?.length ?? 0, detail: "Đã khai báo / Import" },
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
                        ? "Không gian Nhân Sự & Phân công của bộ môn"
                        : "Lịch giảng dạy, Đi học & Mã màu cá nhân"}
                    </b>
                    <p>
                      {staff
                        ? ready
                          ? "Các bộ môn đã nộp. Kiểm tra phòng và chạy xếp lịch để xem ngay TKB cả tuần."
                          : "Theo dõi tiến độ bộ môn bên dưới và phản hồi những lớp cần điều chỉnh."
                        : head
                        ? "Cập nhật môn phụ trách LEC / TUT tại mục Nhân Sự, sau đó gán lớp và nộp phân công."
                        : "Mở mục Lịch của tôi để xem TKB tuần, import lịch trường ngoài/đi học và tùy chỉnh mã màu theo sở thích."}
                    </p>
                  </div>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      switchTab(
                        staff ? (sessions.length ? (ready ? "draft" : "assign") : "setup") : head ? "personnel" : "personal"
                      )
                    }
                  >
                    {staff
                      ? sessions.length
                        ? ready
                          ? "Đến xếp lịch"
                          : "Xem phân công"
                        : "Nhập kế hoạch mở lớp"
                      : head
                      ? "Mở bảng Nhân Sự"
                      : "Mở Lịch của tôi"}{" "}
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
              </>
            )}

            {/* Tab: Setup (Kế hoạch, Khung giờ & Bộ môn — không lặp Giảng viên) */}
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
                  onSave={(data) => perform(() => command("config", data))}
                />

                <CatalogEditor
                  key={"catalog" + workspace.revision}
                  initialDepartments={state?.departments ?? []}
                  initialTeachers={state?.teachers ?? []}
                  disabled={busy}
                  onSaveCatalog={(data) => perform(() => command("catalog", data))}
                  onSaveDept={(data) => perform(() => command("department-save", data))}
                  onDeleteDept={(id) => perform(() => command("department-delete", { id }))}
                />
              </>
            )}

            {/* Tab: Personnel ("Nhân Sự" — nơi duy nhất quản lý Giảng viên & Năng lực LEC/TUT) */}
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
                onCommand={(action, payload) => perform(() => command(action, payload))}
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

            {/* Tab: Assignments (Chỉ phân công lớp, không lặp lại PlanImportCard hay PersonnelMatrix) */}
            {tab === "assign" && (staff || head) && (
              <>
                {staff && sessions.length === 0 && (
                  <div className="context-banner subtle" style={{ marginBottom: "16px" }}>
                    <Icon name="setup" />
                    <div>
                      <b>Chưa có kế hoạch mở lớp trong hệ thống</b>
                      <p>Hãy chuyển sang mục Kế hoạch &amp; Khung giờ để tải lên file Excel kế hoạch đào tạo trước khi phân công.</p>
                    </div>
                    <button type="button" className="primary" onClick={() => switchTab("setup")}>
                      Đi tới Kế hoạch &amp; Khung giờ →
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

        <footer>ScheduleSolver · Hệ thống Quản trị & Điều phối Đào tạo Đại học</footer>
      </main>
    </div>
  );
}
