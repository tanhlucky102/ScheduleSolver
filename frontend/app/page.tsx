"use client";
import { useEffect, useState, useMemo, memo, type FormEvent } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CatalogEditor, ConfigEditor, type Dept, type Teacher } from "./editors";
import { TermCalendar } from "./term-calendar";
import { RoomManager, RequirementsEditor, type Room, type Reservation } from "./rooms";
import { Icon, Metrics, Workflow, DepartmentProgress, AssignmentPanel, PersonalCalendar, EmptyState } from "./workspace-ui";

type Profile = { role: "STAFF" | "HEAD" | "TEACHER"; teacher: string | null; department: string | null };
type Session = {
  id: string;
  course: string;
  kind: string;
  students: number;
  periods?: number;
  teacher: string | null;
  department: string;
  room?: string;
  required_equipment?: string[];
  required_room_type?: string | null;
};
type Slot = { day: number; start: number; end: number; evening: boolean };
type Event = {
  id: string;
  cohort?: string;
  program?: string;
  course?: string;
  institution?: string;
  class_name?: string;
  room?: string;
  room_id?: string;
  teacher?: string;
  periods?: number;
  day: number;
  start: number;
  end: number;
};
type Placement = { session: string; slot: number; room_id?: string | null };
type Report = { hard: number; soft_total: number; violations: string[]; soft: Record<string, number> };
type Workspace = {
  has_publication: boolean;
  revision: number;
  evaluation?: Report;
  state: {
    rooms?: Room[];
    reservations?: Reservation[];
    config?: {
      period_minutes: number;
      break_minutes: number;
      max_periods: number;
      rooms: Record<string, number>;
      slots: Slot[];
    };
    departments?: Dept[];
    teachers?: Teacher[];
    sessions?: Session[];
    draft?: Placement[];
    published: Event[];
    external?: Event[];
  };
};

const clock = (m: number) =>
  String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
let browserAuth: SupabaseClient | null = null;
const roleName = { STAFF: "Giáo vụ", HEAD: "Trưởng bộ môn", TEACHER: "Giảng viên" };

function PlanImportCard({
  apiUrl,
  token,
  busy,
  sessionsCount,
  perform,
  command,
}: {
  apiUrl: string;
  token: string | null;
  busy: boolean;
  sessionsCount: number;
  perform: (action: () => Promise<void>) => Promise<void>;
  command: (action: string, payload?: unknown) => Promise<unknown>;
}) {
  const [preview, setPreview] = useState<{
    offerings: unknown[];
    errors: { row: number; message: string }[];
    can_import: boolean;
  } | null>(null);
  const [fileSelectedName, setFileSelectedName] = useState("");

  return (
    <section className="card" style={{ border: sessionsCount === 0 ? "2px dashed #93c5fd" : undefined }}>
      <div className="section-heading" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2>Nhập kế hoạch đào tạo Excel (.xlsx)</h2>
          <p>
            Tải <a href="/plan-template.xlsx" download>mẫu Excel</a>, điền kế hoạch mở lớp và tải lên để kiểm tra. Xem trước an toàn không thay đổi dữ liệu; khi bấm xác nhận hệ thống sẽ tự động tạo và chia các lớp học phần.
          </p>
        </div>
        {sessionsCount > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ kế hoạch hiện tại (${sessionsCount} lớp) để nhập lại từ đầu?`)) {
                void perform(async () => {
                  await command("plan-reset", {});
                });
                setPreview(null);
                setFileSelectedName("");
              }
            }}
            style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#dc2626", fontSize: "11px", minHeight: "32px", padding: "4px 10px" }}
          >
            🔄 Xóa kế hoạch (Reset về 0 lớp)
          </button>
        )}
      </div>

      <label>
        Tệp kế hoạch .xlsx
        <input
          type="file"
          accept=".xlsx"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setFileSelectedName(file.name);
            setPreview(null);
            void perform(async () => {
              const form = new FormData();
              form.append("file", file);
              const res = await fetch(apiUrl + "/api/import/preview", {
                method: "POST",
                headers: { Authorization: "Bearer " + token },
                body: form,
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.detail);
              setPreview(data);
            });
          }}
        />
      </label>

      {fileSelectedName && !preview && !busy && (
        <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>
          Đang đọc tệp: <b>{fileSelectedName}</b>...
        </p>
      )}

      {preview && (
        <div style={{ marginTop: "14px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
          <p>
            <b>{preview.offerings.length}</b> dòng hợp lệ; <b>{preview.errors.length}</b> dòng lỗi.
          </p>
          {preview.errors.map((e) => (
            <p key={e.row} className="text-warning">
              Dòng {e.row}: {e.message}
            </p>
          ))}
          {sessionsCount > 0 && (
            <p style={{ fontSize: "12px", color: "#d97706", margin: "8px 0" }}>
              ⚠️ Hệ thống đang có <b>{sessionsCount} lớp học phần</b>. Khi xác nhận, kế hoạch mới sẽ thay thế kế hoạch cũ.
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              className="primary"
              disabled={busy || !preview.can_import}
              onClick={() => {
                void perform(async () => {
                  await command("offerings", { offerings: preview.offerings });
                  setPreview(null);
                  setFileSelectedName("");
                });
              }}
            >
              Xác nhận nhập kế hoạch & chia lớp
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPreview(null);
                setFileSelectedName("");
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

type DraftRowProps = {
  session: Session;
  placement?: Placement;
  slotOptions?: React.ReactNode;
  roomOptions?: React.ReactNode;
  busy: boolean;
  hasRooms: boolean;
  hasSlots: boolean;
  firstRoomId?: string;
  onSlotChange: (sessionId: string, slot: number, roomId?: string) => void;
  onRoomChange: (sessionId: string, slot: number, roomId: string) => void;
};

const DraftRow = memo(function DraftRow({
  session,
  placement,
  slotOptions,
  roomOptions,
  busy,
  hasRooms,
  hasSlots,
  firstRoomId,
  onSlotChange,
  onRoomChange,
}: DraftRowProps) {
  return (
    <tr>
      <td>
        <b>{session.course}</b>
        <small>{session.id}</small>
      </td>
      <td>
        <select
          aria-label={"Khung giờ cho " + session.id}
          disabled={busy || !hasRooms}
          value={placement?.slot ?? ""}
          onChange={(e) =>
            onSlotChange(session.id, Number(e.target.value), placement?.room_id ?? firstRoomId)
          }
        >
          <option value="" disabled>
            Chưa xếp
          </option>
          {slotOptions}
        </select>
      </td>
      <td>
        <select
          aria-label={"Phòng cho " + session.id}
          disabled={busy || !hasSlots}
          value={placement?.room_id ?? ""}
          onChange={(e) =>
            onRoomChange(session.id, placement?.slot ?? 0, e.target.value)
          }
        >
          <option value="" disabled>
            Chọn phòng
          </option>
          {roomOptions}
        </select>
      </td>
    </tr>
  );
});

export default function Home() {
  const [auth, setAuth] = useState<SupabaseClient | null>(null);
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [draftLimit, setDraftLimit] = useState(60);

  // Login form quick-fill state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [external, setExternal] = useState({
    institution: "",
    course: "",
    class_name: "",
    room: "",
    day: 2,
    start: "07:00",
    end: "09:30",
  });
  const [draftQuery, setDraftQuery] = useState("");
  const [config, setConfig] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setFailed(true);
      setMessage("Cần cấu hình kết nối Supabase trước khi đăng nhập.");
      return;
    }
    const client =
      browserAuth ??
      (browserAuth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: true } }));
    setAuth(client);
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || "");
      if (!session) {
        setProfile(null);
        setWorkspace(null);
        setTab("overview");
        setMessage("");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function api(path: string, body?: unknown) {
    const response = await fetch(apiUrl + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const value = await response.json();
    if (!response.ok) {
      throw new Error(
        response.status === 401
          ? "Phiên đăng nhập đã hết hạn. Hãy đăng xuất và đăng nhập lại."
          : response.status === 403
          ? "Bạn chưa được cấp quyền cho thao tác này."
          : response.status === 409 && String(value.detail).includes("revision")
          ? "Dữ liệu đã thay đổi. Hãy làm mới trước khi thử lại."
          : typeof value.detail === "string"
          ? value.detail
          : JSON.stringify(value.detail)
      );
    }
    return value;
  }

  async function refresh() {
    const [p, w] = await Promise.all([api("/api/me"), api("/api/workspace")]);
    setProfile(p);
    setWorkspace(w);
    if (w.state?.config) setConfig(JSON.stringify(w.state?.config, null, 2));
  }

  useEffect(() => {
    if (token) {
      setLoading(true);
      refresh()
        .catch((e) => {
          setFailed(true);
          setMessage(e.message);
        })
        .finally(() => setLoading(false));
    }
  }, [token]); // eslint-disable-line

  async function perform(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      await fn();
    } catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : "Không thể xử lý thao tác này.");
    } finally {
      setBusy(false);
    }
  }

  async function command(action: string, payload: unknown = {}) {
    if (!workspace) return;
    await api("/api/commands/" + action, { revision: workspace.revision, payload });
    await refresh();
    setMessage(
      ({
        solve: "Đã tìm được phương án xếp lịch hợp lệ với phòng cụ thể.",
        assign: "Đã lưu phân công giảng viên.",
        submit: "Đã nộp phân công cho giáo vụ.",
        send: "Đã gửi kế hoạch cho bộ môn.",
        return: "Đã gửi yêu cầu điều chỉnh cho bộ môn.",
        publish: "Đã công bố thời khóa biểu chính thức.",
        external: "Đã lưu lịch công tác ngoài.",
        "department-save": "Đã lưu thông tin bộ môn.",
        "department-delete": "Đã xóa bộ môn thành công.",
        "teacher-save": "Đã lưu thông tin giảng viên.",
        "teacher-delete": "Đã xóa giảng viên thành công.",
        "rooms-preset": "Đã khởi tạo thành công 17 phòng học mẫu từ danh mục.",
        balance: "Đã chia đều các lớp học phần cho giảng viên đủ năng lực.",
        "capabilities-preset": "Đã tự động cập nhật năng lực giảng viên theo thời khóa biểu gốc.",
      } as Record<string, string>)[action] ?? "Đã lưu thay đổi thành công."
    );
  }

  async function download(source: string) {
    const res = await fetch(apiUrl + "/api/export/" + source, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = "Timetable-" + source + ".xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function login(e?: FormEvent<HTMLFormElement>, overrideEmail?: string, overridePass?: string) {
    if (e) e.preventDefault();
    const emailToUse = overrideEmail || loginEmail;
    const passToUse = overridePass || loginPassword;
    await perform(async () => {
      if (!auth) throw new Error("Chưa kết nối dịch vụ xác thực Supabase.");
      const { error } = await auth.auth.signInWithPassword({
        email: emailToUse,
        password: passToUse,
      });
      if (error) throw error;
    });
  }

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

  const draftMap = useMemo(
    () => new Map((state?.draft ?? []).map((p) => [p.session, p])),
    [state?.draft]
  );

  const slotOptions = useMemo(
    () =>
      state?.config?.slots?.map((slot, i) => (
        <option value={i} key={i}>
          {slot.day === 8 ? "Chủ nhật" : "Thứ " + slot.day} · bắt đầu {clock(slot.start)} (khung đến {clock(slot.end)})
        </option>
      )),
    [state?.config?.slots]
  );

  const roomOptions = useMemo(
    () =>
      state?.rooms?.map((r) => (
        <option key={r.id} value={r.id}>
          {r.id} · {r.capacity} chỗ ({r.room_type})
        </option>
      )),
    [state?.rooms]
  );

  const filteredDraftSessions = useMemo(() => {
    if (!draftQuery) return sessions;
    const q = draftQuery.toLowerCase();
    return sessions.filter((s) => (s.id + " " + s.course).toLowerCase().includes(q));
  }, [sessions, draftQuery]);

  const visibleDraftSessions = draftQuery
    ? filteredDraftSessions
    : filteredDraftSessions.slice(0, draftLimit);

  // Render Login View if not authenticated
  if (!token) {
    return (
      <div className="login-screen">
        <div className="login-container">
          {/* Left panel: Branding & value props */}
          <div className="login-brand-panel">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span className="brand-mark" style={{ width: "42px", height: "42px" }}>
                  <Icon name="personal" />
                </span>
                <div>
                  <strong style={{ fontSize: "19px", color: "white" }}>ScheduleSolver</strong>
                  <small style={{ color: "#9ec5fc", letterSpacing: "1.5px", display: "block" }}>
                    HỆ THỐNG ĐIỀU PHỐI ĐÀO TẠO
                  </small>
                </div>
              </div>
              <h1>Phối hợp & Lập lịch đào tạo</h1>
              <p>
                Giải pháp xếp thời khóa biểu thông minh cho các khoa và trường đại học. Liên thông quy trình giữa Giáo vụ, Trưởng bộ môn và Giảng viên.
              </p>
            </div>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">✓</div>
                <div>
                  <b>Quy trình 3 vai trò đồng bộ</b>
                  <small>Giáo vụ lập kế hoạch → Bộ môn phân công → Thuật toán xếp lịch tự động.</small>
                </div>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">✓</div>
                <div>
                  <b>Kiểm soát ràng buộc phòng học</b>
                  <small>Bảo toàn sức chứa, thiết bị máy chiếu/máy tính và lịch chiếm dụng thực tế.</small>
                </div>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">✓</div>
                <div>
                  <b>Tối ưu hóa đa mục tiêu</b>
                  <small>Cân bằng tải giảng viên, giảm thiểu giờ trống và xung đột lịch.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Modern login form */}
          <div className="login-form-panel">
            <span className="badge neutral" style={{ alignSelf: "flex-start", marginBottom: "6px" }}>
              CỔNG ĐĂNG NHẬP NỘI BỘ
            </span>
            <h2>Đăng nhập tài khoản</h2>
            <p>Sử dụng tài khoản được đơn vị cấp để truy cập không gian làm việc.</p>

            {message && (
              <div className={"notice " + (failed ? "error" : "success")} role={failed ? "alert" : "status"}>
                <b>{failed ? "Đăng nhập không thành công" : "Thông báo"}</b>
                <span>{message}</span>
                <button aria-label="Đóng thông báo" onClick={() => setMessage("")}>
                  ×
                </button>
              </div>
            )}

            <form onSubmit={(e) => login(e)}>
              <label>
                Email công tác
                <input
                  required
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="ten@donvi.edu.vn"
                />
              </label>
              <label>
                Mật khẩu
                <input
                  required
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                />
              </label>
              <button className="primary" disabled={busy || !auth}>
                {busy ? "Đang xác thực..." : "Đăng nhập vào hệ thống"}
              </button>
            </form>

            <div className="quick-login">
              <span>Thử nghiệm nhanh tài khoản demo:</span>
              <div className="quick-chips">
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => {
                    setLoginEmail("schedule-demo-staff-6cafcae3@example.com");
                    setLoginPassword("XiGyBbqk4hbVGkwCrFNuercHX6zxI7GB");
                    void login(undefined, "schedule-demo-staff-6cafcae3@example.com", "XiGyBbqk4hbVGkwCrFNuercHX6zxI7GB");
                  }}
                >
                  👤 Giáo vụ (Staff)
                </button>
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => {
                    setLoginEmail("schedule-demo-head-khmt-6cafcae3@example.com");
                    setLoginPassword("5HT6_tn_oumOgbdtstdtxt5p5BFZ4k-m");
                    void login(undefined, "schedule-demo-head-khmt-6cafcae3@example.com", "5HT6_tn_oumOgbdtstdtxt5p5BFZ4k-m");
                  }}
                >
                  👥 Trưởng BM KHMT
                </button>
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => {
                    setLoginEmail("schedule-demo-teacher-6cafcae3@example.com");
                    setLoginPassword("PO-YLOLlbVSkF7LeCObW6TqN0U44pY-w");
                    void login(undefined, "schedule-demo-teacher-6cafcae3@example.com", "PO-YLOLlbVSkF7LeCObW6TqN0U44pY-w");
                  }}
                >
                  🎓 Giảng viên
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

            {/* Tab: Scheduling / Draft */}
            {tab === "draft" && staff && (
              <>
                {isEvaluating && (
                  <div className="evaluating-indicator" role="status">
                    <div className="spinner-border" />
                    <span>Đang chuẩn bị dữ liệu và thẩm định 290 lớp học phần...</span>
                  </div>
                )}
                <section className="card">
                  <h2>Thẩm định & xếp lịch học kỳ</h2>
                  <div className="readiness">
                    <span className={"badge " + (ready ? "success" : "warning")}>
                      {ready ? "✓ Các bộ môn đã nộp" : "Chờ bộ môn hoàn tất phân công"}
                    </span>
                    <span className={"badge " + (state?.rooms?.length ? "success" : "warning")}>
                      {state?.rooms?.length ?? 0} phòng đã khai báo
                    </span>
                    <span className={"badge " + (state?.config?.slots.length ? "success" : "warning")}>
                      {state?.config?.slots.length ?? 0} khung giờ
                    </span>
                  </div>
                  <div className="actions">
                    <button disabled={busy || !state?.draft?.length} onClick={() => perform(() => download("draft"))}>
                      Xuất Excel nháp
                    </button>
                    <button disabled={busy || !state?.published.length} onClick={() => perform(() => download("published"))}>
                      Xuất Excel đã công bố
                    </button>
                  </div>
                  <p>
                    Kiểm tra phân công, sức chứa, thiết bị, điều kiện dùng phòng, toàn bộ khung khả dụng và lịch chiếm dụng. Nếu hết lượt tìm kiếm, hệ thống báo xung đột và giữ nguyên bản nháp; điều đó chưa chứng minh bài toán vô nghiệm.
                  </p>
                  <div className="actions">
                    <button
                      className="primary"
                      disabled={busy || !ready || !state?.rooms?.length || !state?.config?.slots.length}
                      onClick={() => perform(() => command("solve", { iterations: 500, seed: 42 }))}
                    >
                      Thẩm định & chạy bộ giải
                    </button>
                    <button
                      className="primary"
                      disabled={busy || workspace.evaluation?.hard !== 0 || !state?.draft?.length}
                      onClick={() => perform(() => command("publish"))}
                    >
                      Công bố lịch chính thức
                    </button>
                  </div>
                  {!ready && (
                    <p className="inline-help">
                      Hoàn tất phân công và nộp từ tất cả bộ môn trước khi xếp lịch.{" "}
                      <button onClick={() => setTab("assign")}>Xem phân công →</button>
                    </p>
                  )}
                  {!!state?.draft?.length && workspace.evaluation && (
                    <>
                      <Metrics
                        items={[
                          {
                            label: "Lỗi bắt buộc",
                            value: workspace.evaluation.hard,
                            detail: "Phải xử lý hết trước khi công bố",
                            tone: workspace.evaluation.hard ? "text-warning" : "text-success",
                          },
                          {
                            label: "Điểm ưu tiên mềm",
                            value: workspace.evaluation.soft_total,
                            detail: "Điểm càng thấp, lịch càng thuận tiện",
                          },
                          {
                            label: "Lớp đã xếp",
                            value: state?.draft.length + "/" + sessions.length,
                            detail: "Bản nháp đang hiệu chỉnh",
                          },
                        ]}
                      />
                      <details open={workspace.evaluation.hard > 0}>
                        <summary>Báo cáo thẩm định chi tiết</summary>
                        {workspace.evaluation.hard > 0 ? (
                          <>
                            <p className="text-warning">
                              Đối chiếu lớp và phòng bên dưới để điều chỉnh, hoặc kiểm tra lại phân công.
                            </p>
                            <ul className="violation-list">
                              {workspace.evaluation.violations.map((v, i) => (
                                <li key={i}>{v}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="text-success">Không có lỗi bắt buộc trong bản nháp hiện tại.</p>
                        )}
                        <dl className="evaluation-details">
                          {Object.entries(workspace.evaluation.soft).map(([key, value]) => (
                            <div key={key}>
                              <dt>
                                {({
                                  restricted: "Thứ bảy / buổi tối",
                                  single_class: "Ngày chỉ có một lớp",
                                  overload: "Số tiết vượt trần ngày",
                                  gaps_minutes: "Phút trống giữa buổi",
                                } as Record<string, string>)[key] ?? key}
                              </dt>
                              <dd>{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    </>
                  )}
                </section>
                <section className="card">
                  <h2>Hiệu chỉnh bản nháp</h2>
                  <p>Chọn khung bắt đầu và phòng; kết quả kiểm tra được cập nhật sau mỗi lần lưu.</p>
                  <label>
                    Tìm lớp trong bản nháp
                    <input
                      type="search"
                      placeholder="Nhập mã lớp hoặc mã môn…"
                      value={draftQuery}
                      onChange={(e) => setDraftQuery(e.target.value)}
                    />
                  </label>
                  <div className="table-wrap table-scroll" style={{ maxHeight: "500px" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Lớp học phần</th>
                          <th>Thứ & giờ bắt đầu</th>
                          <th>Phòng học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleDraftSessions.map((s) => (
                          <DraftRow
                            key={s.id}
                            session={s}
                            placement={draftMap.get(s.id)}
                            slotOptions={slotOptions}
                            roomOptions={roomOptions}
                            busy={busy}
                            hasRooms={!!state?.rooms?.length}
                            hasSlots={!!state?.config?.slots.length}
                            firstRoomId={state?.rooms?.[0]?.id}
                            onSlotChange={(sessionId, slot, roomId) =>
                              perform(() =>
                                command("placement", {
                                  session: sessionId,
                                  slot,
                                  room_id: roomId,
                                })
                              )
                            }
                            onRoomChange={(sessionId, slot, roomId) =>
                              perform(() =>
                                command("placement", {
                                  session: sessionId,
                                  slot,
                                  room_id: roomId,
                                })
                              )
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!draftQuery && filteredDraftSessions.length > draftLimit && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderTop: "1px solid var(--line)", fontSize: "12px", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ color: "var(--muted)" }}>
                        Đang hiển thị {visibleDraftSessions.length}/{filteredDraftSessions.length} lớp học phần
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px" }}
                          onClick={() => setDraftLimit((prev) => prev + 60)}
                        >
                          Xem thêm 60 lớp
                        </button>
                        <button
                          type="button"
                          className="primary"
                          style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px" }}
                          onClick={() => setDraftLimit(filteredDraftSessions.length)}
                        >
                          Hiển thị toàn bộ ({filteredDraftSessions.length} lớp)
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Tab: Whole Term Calendar */}
            {tab === "term" && staff && <TermCalendar events={state?.published ?? []} rooms={state?.rooms ?? []} />}

            {/* Tab: Personal Calendar */}
            {tab === "personal" && !staff && (
              <>
                <PersonalCalendar published={state?.published ?? []} external={state?.external ?? []} />
                <section className="card">
                  <h2>Khai báo lịch trường ngoài</h2>
                  <p>Thêm buổi giảng dạy ngoài khoa để quản lý lịch cá nhân. Giờ kết thúc phải sau giờ bắt đầu.</p>
                  {!workspace.has_publication && (
                    <p className="feedback">Bạn có thể khai báo lịch ngoài sau khi giáo vụ công bố lịch khoa.</p>
                  )}
                  <form
                    className="external-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      perform(async () => {
                        if (external.end <= external.start) throw new Error("Giờ kết thúc phải sau giờ bắt đầu.");
                        const minute = (v: string) => {
                          const [h, m] = v.split(":").map(Number);
                          return h * 60 + m;
                        };
                        await command("external", {
                          ...external,
                          start: minute(external.start),
                          end: minute(external.end),
                        });
                      });
                    }}
                  >
                    {(["institution", "course", "class_name", "room"] as const).map((key, i) => (
                      <label key={key}>
                        {["Trường", "Môn", "Lớp", "Phòng (tùy chọn)"][i]}
                        <input
                          required={key !== "room"}
                          value={external[key]}
                          onChange={(e) => setExternal({ ...external, [key]: e.target.value })}
                        />
                      </label>
                    ))}
                    <label>
                      Thứ
                      <select value={external.day} onChange={(e) => setExternal({ ...external, day: Number(e.target.value) })}>
                        {Array.from({ length: 7 }, (_, i) => i + 2).map((d) => (
                          <option key={d} value={d}>
                            {d === 8 ? "Chủ nhật" : "Thứ " + d}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", margin: "4px 0 8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>Chọn nhanh ca học:</span>
                      <button
                        type="button"
                        style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: "6px" }}
                        onClick={() => setExternal({ ...external, start: "07:00", end: "11:30" })}
                      >
                        Ca sáng (07:00 – 11:30)
                      </button>
                      <button
                        type="button"
                        style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: "6px" }}
                        onClick={() => setExternal({ ...external, start: "12:30", end: "17:00" })}
                      >
                        Ca chiều (12:30 – 17:00)
                      </button>
                      <button
                        type="button"
                        style={{ minHeight: "28px", padding: "3px 10px", fontSize: "11px", background: "#f1f5f9", border: "1px solid var(--line)", borderRadius: "6px" }}
                        onClick={() => setExternal({ ...external, start: "18:00", end: "20:30" })}
                      >
                        Ca tối (18:00 – 20:30)
                      </button>
                    </div>
                    {(["start", "end"] as const).map((k) => (
                      <label key={k}>
                        {k === "start" ? "Bắt đầu" : "Kết thúc"}
                        <input
                          type="time"
                          min="06:00"
                          max="22:00"
                          required
                          value={external[k]}
                          onChange={(e) => setExternal({ ...external, [k]: e.target.value })}
                        />
                      </label>
                    ))}
                    <button
                      className="primary"
                      disabled={busy || !workspace.has_publication || external.end <= external.start}
                    >
                      Lưu lịch ngoài
                    </button>
                  </form>
                  <div className="external-list" style={{ marginTop: "20px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h3 style={{ fontSize: "14px", margin: 0, fontWeight: 600 }}>
                        Các buổi giảng dạy ngoài khoa đã khai báo ({state?.external?.length ?? 0})
                      </h3>
                      {state?.external && state.external.length > 0 && (
                        <small style={{ color: "var(--muted)" }}>Lịch khoa được ưu tiên khi xếp lịch</small>
                      )}
                    </div>
                    {(!state?.external || state.external.length === 0) ? (
                      <p style={{ fontSize: "12px", color: "var(--muted)", margin: "8px 0" }}>
                        Chưa có buổi học ngoài trường nào được khai báo.
                      </p>
                    ) : (
                      state.external.map((r) => {
                        const isConflict = state?.published.some(
                          (p) => p.day === r.day && p.start < r.end && r.start < p.end
                        );
                        return (
                          <article
                            className="dept"
                            key={r.id}
                            style={{
                              padding: "10px 12px",
                              background: isConflict ? "#fff7ed" : "#f8fafc",
                              borderRadius: "6px",
                              border: `1px solid ${isConflict ? "#fdba74" : "var(--line)"}`,
                              marginBottom: "8px",
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <b style={{ fontSize: "13px" }}>{r.institution}</b>
                                <span style={{ color: "var(--muted)" }}>·</span>
                                <span style={{ fontSize: "12px", fontWeight: 500 }}>{r.course}</span>
                                {r.class_name && <span style={{ fontSize: "11px", color: "var(--muted)" }}>({r.class_name})</span>}
                                {isConflict && (
                                  <span className="badge warning" style={{ fontSize: "10px" }}>
                                    ⚠️ Trùng lịch khoa
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: "4px 0 0", fontSize: "11px", color: isConflict ? "#c2410c" : "var(--muted)" }}>
                                Thứ {r.day === 8 ? "Chủ nhật" : r.day} · {clock(r.start)} – {clock(r.end)} {r.room ? `· Phòng ${r.room}` : ""}
                                {isConflict && " — Trùng với lịch khoa chính thức mới công bố, hãy xóa hoặc sửa lại giờ."}
                              </p>
                            </div>
                            <button
                              className="btn-remove"
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm("Xóa buổi " + r.course + " tại " + r.institution + "?")) {
                                  void perform(() => command("external-delete", { id: r.id }));
                                }
                              }}
                            >
                              Xóa buổi
                            </button>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        <footer>ScheduleSolver · Hệ thống Quản trị & Điều phối Đào tạo Đại học</footer>
      </main>
    </div>
  );
}
