"use client";
import { type FormEvent } from "react";
import { Icon } from "../shared/ui";

type Props = {
  busy: boolean;
  authReady: boolean;
  message: string;
  failed: boolean;
  onDismiss: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  loginEmail: string;
  loginPassword: string;
  setLoginEmail: (value: string) => void;
  setLoginPassword: (value: string) => void;
};

export function LoginScreen({ busy, authReady, message, failed, onDismiss, onLogin, loginEmail, loginPassword, setLoginEmail, setLoginPassword }: Props) {
  function login(e?: FormEvent<HTMLFormElement>, overrideEmail?: string, overridePass?: string) {
    e?.preventDefault();
    return onLogin(overrideEmail || loginEmail, overridePass || loginPassword);
  }
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
                <button aria-label="Đóng thông báo" onClick={onDismiss}>
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
              <button className="primary" disabled={busy || !authReady}>
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
