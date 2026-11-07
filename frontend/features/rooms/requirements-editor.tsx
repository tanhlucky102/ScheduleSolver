"use client";
import { useState } from "react";
import { commaValues as values } from "../shared/text";

export function RequirementsEditor({
  sessions,
  disabled,
  onCommand,
}: {
  sessions: { id: string; course?: string; name?: string; kind?: string; students?: number; room?: string; required_equipment?: string[]; required_room_type?: string | null }[];
  disabled: boolean;
  onCommand: (action: string, payload: unknown) => Promise<void>;
}) {
  const [id, setId] = useState("");
  const [equipment, setEquipment] = useState("");
  const [roomType, setRoomType] = useState("");
  const [primary, setPrimary] = useState("PROJECTOR");

  const customSessions = sessions.filter(
    (s) =>
      (s.required_equipment && s.required_equipment.length > 0) ||
      Boolean(s.required_room_type) ||
      (s.room && s.room !== (s.kind === "TUT" ? "COMPUTER" : "PROJECTOR"))
  );

  const handleSelectSession = (sessionId: string) => {
    setId(sessionId);
    const s = sessions.find((item) => item.id === sessionId);
    setEquipment(s?.required_equipment?.join(", ") ?? "");
    setRoomType(s?.required_room_type ?? "");
    setPrimary(s?.room ?? (s?.kind === "TUT" ? "COMPUTER" : "PROJECTOR"));
  };

  const handleResetToDefault = async (sessionId: string) => {
    const s = sessions.find((item) => item.id === sessionId);
    if (!s) return;
    const defaultPrimary = s.kind === "TUT" ? "COMPUTER" : "PROJECTOR";
    await onCommand("requirements", {
      session: sessionId,
      room: defaultPrimary,
      required_equipment: [],
      required_room_type: null,
    });
    if (id === sessionId) {
      setPrimary(defaultPrimary);
      setEquipment("");
      setRoomType("");
    }
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Yêu cầu phòng theo lớp học phần</h2>
          <p>
            Khai báo điều kiện phòng học chuyên biệt cho từng lớp học phần (thiết bị đặc thù, loại phòng cụ thể).
          </p>
        </div>
      </div>

      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#166534" }}>
        <b>💡 Mục đích chức năng:</b> Cho phép Giáo vụ tùy biến yêu cầu phòng riêng biệt cho từng lớp học phần.
        <div style={{ marginTop: "4px", color: "#15803d", lineHeight: 1.5 }}>
          • Mặc định: Lớp lý thuyết (LEC) tự động gán vào <b>Phòng máy chiếu (PROJECTOR)</b>, lớp thực hành (TUT) tự động gán vào <b>Phòng máy tính (COMPUTER)</b>.<br />
          • Chỉ cần cài đặt bên dưới nếu lớp có nhu cầu đặc biệt (ví dụ: máy tính cấu hình cao, máy chiếu hội trường, hoặc thiết bị ngoại vi).
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onCommand("requirements", {
            session: id,
            room: primary,
            required_equipment: values(equipment),
            required_room_type: roomType.trim() || null,
          });
        }}
      >
        <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="editor-row">
            <label style={{ flex: 1.5 }}>
              <span>Chọn lớp học phần</span>
              <select
                required
                value={id}
                onChange={(e) => handleSelectSession(e.target.value)}
              >
                <option value="">Chọn lớp học phần ({sessions.length} lớp)</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} ({s.course} · {s.kind === "TUT" ? "Thực hành" : "Lý thuyết"})
                  </option>
                ))}
              </select>
            </label>
            <label style={{ flex: 1 }}>
              <span>Thiết bị chính bắt buộc</span>
              <select value={primary} onChange={(e) => setPrimary(e.target.value)}>
                <option value="PROJECTOR">Máy chiếu (LEC - PROJECTOR)</option>
                <option value="COMPUTER">Máy tính (TUT - COMPUTER)</option>
              </select>
            </label>
          </div>
          <div className="editor-row">
            <label>
              <span>Thiết bị bổ sung (cách nhau bằng dấu phẩy)</span>
              <input
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="VD: LOA, MICRO, GRAPHICS_CARD..."
              />
            </label>
            <label>
              <span>Loại phòng bắt buộc</span>
              <input
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                placeholder="Để trống nếu áp dụng theo thiết bị chuẩn"
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button disabled={!id} className="primary" type="submit">
              Lưu yêu cầu phòng cho {id || "lớp đã chọn"}
            </button>
            {id && (
              <button
                type="button"
                onClick={() => handleResetToDefault(id)}
                style={{ background: "#f8fafc" }}
              >
                Đặt lại mặc định
              </button>
            )}
          </div>
        </fieldset>
      </form>

      {/* Danh sách các lớp đang có yêu cầu phòng riêng */}
      <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "14px", margin: "0 0 6px 0" }}>
          Lớp đang có yêu cầu phòng riêng biệt ({customSessions.length})
        </h3>
        {customSessions.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
            Tất cả các lớp học phần hiện tại đang áp dụng quy tắc phòng chuẩn theo tính chất buổi (LEC: Máy chiếu, TUT: Máy tính).
          </p>
        ) : (
          <div className="table-wrap" style={{ marginTop: "8px" }}>
            <table style={{ width: "100%", fontSize: "12px" }}>
              <thead>
                <tr>
                  <th>Mã lớp / Môn</th>
                  <th>Loại buổi</th>
                  <th>Thiết bị chính</th>
                  <th>Thiết bị bổ sung</th>
                  <th>Loại phòng</th>
                  <th style={{ textAlign: "right", width: "140px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {customSessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.id}</b>
                      <small style={{ display: "block", color: "var(--muted)" }}>{s.course}</small>
                    </td>
                    <td>
                      <span className="badge neutral">
                        {s.kind === "TUT" ? "Thực hành" : "Lý thuyết"}
                      </span>
                    </td>
                    <td>
                      <span className={"badge " + (s.room === "COMPUTER" ? "neutral" : "success")}>
                        {s.room === "COMPUTER" ? "Máy tính" : "Máy chiếu"}
                      </span>
                    </td>
                    <td>{s.required_equipment?.join(", ") || "—"}</td>
                    <td>{s.required_room_type || "Chuẩn theo thiết bị"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        style={{ marginRight: "4px", minHeight: "28px", padding: "2px 8px", fontSize: "11px" }}
                        onClick={() => handleSelectSession(s.id)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-remove"
                        style={{ minHeight: "28px", padding: "2px 8px", fontSize: "11px" }}
                        onClick={() => handleResetToDefault(s.id)}
                      >
                        Đặt lại
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
