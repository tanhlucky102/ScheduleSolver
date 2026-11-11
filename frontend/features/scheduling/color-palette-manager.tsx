"use client";
import { useState } from "react";
import type { ColorRule } from "../catalog/types";

const SIMPLE_STARTER_EXAMPLES: ColorRule[] = [
  {
    id: "sample-truong-a",
    category: "INSTITUTION",
    key: "TRƯỜNG A",
    label: "Trường A",
    bg_color: "#fef3c7",
    border_color: "#fcd34d",
    text_color: "#92400e",
    note: "Lịch thỉnh giảng tại Trường A",
  },
  {
    id: "sample-truong-b",
    category: "INSTITUTION",
    key: "TRƯỜNG B",
    label: "Trường B",
    bg_color: "#e0f2fe",
    border_color: "#7dd3fc",
    text_color: "#075985",
    note: "Lịch thỉnh giảng tại Trường B",
  },
];

const STATUS_PRESETS: Record<string, string> = {
  FACULTY: "Lịch khoa",
  EVENING: "TKB tối",
  EXTERNAL_TEACHING: "Dạy trường ngoài",
  STUDYING: "Đi học / NCS",
  MAKEUP: "Dạy bù",
  CONFLICT: "Trùng lịch",
};

export function ColorPaletteManager({
  customRules = [],
  busy,
  onCommand,
}: {
  customRules?: ColorRule[];
  busy: boolean;
  onCommand: (action: string, payload: unknown) => Promise<void>;
}) {
  const [catFilter, setCatFilter] = useState<string>("ALL");
  const [draftNotes, setDraftNotes] = useState<Record<string, Partial<ColorRule>>>({});
  const [newRule, setNewRule] = useState<{
    category: ColorRule["category"];
    key: string;
    label: string;
    bg_color: string;
    text_color: string;
    note: string;
  }>({
    category: "INSTITUTION",
    key: "",
    label: "",
    bg_color: "#fef3c7",
    text_color: "#92400e",
    note: "",
  });

  const visible = customRules.filter((r) => catFilter === "ALL" || r.category === catFilter);

  const getDraft = (r: ColorRule): ColorRule => ({
    ...r,
    ...(draftNotes[r.id] || {}),
  });

  const setField = (r: ColorRule, patch: Partial<ColorRule>) => {
    setDraftNotes((prev) => ({
      ...prev,
      [r.id]: { ...(prev[r.id] || {}), ...patch },
    }));
  };

  const saveRule = async (r: ColorRule) => {
    const merged = getDraft(r);
    await onCommand("color-rules", { rule: merged });
    setDraftNotes((prev) => {
      const next = { ...prev };
      delete next[r.id];
      return next;
    });
  };

  const categoryLabels: Record<string, string> = {
    INSTITUTION: "Trường / Đơn vị",
    CUSTOM: "Môn học / Ngành / Nhãn riêng",
    KIND: "Loại buổi (LEC / TUT)",
    PROGRAM: "Hệ đào tạo",
    STATUS: "Nhãn chú thích mặc định",
  };

  const compactSelectStyle = {
    height: "38px",
    minHeight: "38px",
    padding: "0 32px 0 12px",
    lineHeight: "36px",
    fontSize: "12.5px",
  } as const;

  return (
    <section className="card">
      <div className="section-heading" style={{ flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <div>
          <h2>🎨 Quản lý Mã Màu & Tự Note theo Sở thích (Dành riêng cho Giảng viên)</h2>
          <p>
            Khi bạn đổi <b>Tên nhãn</b> hoặc <b>Màu sắc</b> rồi bấm Lưu, cả ô lịch lẫn thanh chú thích phía trên TKB cá nhân sẽ tự động đổi chữ & màu tương ứng ngay lập tức.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {customRules.length === 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCommand("color-rules", { rules: SIMPLE_STARTER_EXAMPLES })}
              style={{ minHeight: "38px", height: "38px", padding: "0 12px", fontSize: "12px" }}
            >
              + Nạp ví dụ mẫu (Trường A, Trường B)
            </button>
          )}
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            style={{ ...compactSelectStyle, width: "auto" }}
          >
            <option value="ALL">Tất cả nhóm màu ({customRules.length})</option>
            <option value="INSTITUTION">Trường / Đơn vị (VD: Trường A, Trường B)</option>
            <option value="CUSTOM">Môn học / Ngành / Nhãn riêng</option>
            <option value="KIND">Loại buổi (LEC / TUT)</option>
            <option value="STATUS">Nhãn chú thích mặc định (Lịch khoa, Đi học, Dạy bù...)</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div style={{ padding: "18px", textAlign: "center", background: "#f8fafc", border: "1px dashed var(--line)", borderRadius: "8px", fontSize: "12.5px", color: "var(--muted)" }}>
          Chưa có mã màu riêng nào. Giảng viên có thể thêm ở khung bên dưới (VD: Trường A, Trường B, mã môn, LEC/TUT hoặc ghi đè màu & chữ của Lịch khoa / Đi học / Dạy bù).
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "165px" }}>Phân loại & Mã</th>
                <th style={{ width: "220px" }}>Tên nhãn trên TKB & Xem trước</th>
                <th style={{ width: "130px" }}>Màu nền / Chữ</th>
                <th>Ghi chú theo sở thích (Note)</th>
                <th style={{ width: "135px", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((orig) => {
                const r = getDraft(orig);
                return (
                  <tr key={r.id}>
                    <td>
                      <small style={{ color: "var(--muted)", display: "block" }}>
                        {categoryLabels[r.category] || r.category}
                      </small>
                      <b>{r.key}</b>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-start" }}>
                        <input
                          value={r.label}
                          onChange={(e) => setField(orig, { label: e.target.value })}
                          placeholder="Tên nhãn hiển thị..."
                          style={{ minHeight: "30px", height: "30px", fontSize: "12px", padding: "0 8px" }}
                        />
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            borderRadius: "5px",
                            background: r.bg_color,
                            border: `1px solid ${r.border_color || "#cbd5e1"}`,
                            color: r.text_color,
                            fontWeight: 600,
                            fontSize: "11px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.label || r.key}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <label style={{ margin: 0, fontSize: "10px", textAlign: "center" }}>
                          Nền
                          <input
                            type="color"
                            value={r.bg_color.startsWith("#") && r.bg_color.length === 7 ? r.bg_color : "#ffffff"}
                            onChange={(e) =>
                              setField(orig, { bg_color: e.target.value, border_color: e.target.value })
                            }
                            style={{ width: "36px", height: "28px", minHeight: "28px", padding: "1px", cursor: "pointer" }}
                          />
                        </label>
                        <label style={{ margin: 0, fontSize: "10px", textAlign: "center" }}>
                          Chữ
                          <input
                            type="color"
                            value={r.text_color.startsWith("#") && r.text_color.length === 7 ? r.text_color : "#0f172a"}
                            onChange={(e) => setField(orig, { text_color: e.target.value })}
                            style={{ width: "36px", height: "28px", minHeight: "28px", padding: "1px", cursor: "pointer" }}
                          />
                        </label>
                      </div>
                    </td>
                    <td>
                      <input
                        value={r.note}
                        onChange={(e) => setField(orig, { note: e.target.value })}
                        placeholder="Nhập ghi chú riêng trên lịch cho nhãn màu này..."
                        style={{ minHeight: "34px", height: "34px", fontSize: "12px" }}
                      />
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        className="primary"
                        disabled={busy}
                        onClick={() => void saveRule(orig)}
                        style={{ minHeight: "30px", height: "30px", padding: "0 10px", fontSize: "11.5px", marginRight: "6px" }}
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        className="btn-remove"
                        disabled={busy}
                        onClick={() => void onCommand("color-rules", { delete_id: r.id })}
                        style={{ minHeight: "30px", height: "30px", padding: "0 9px", fontSize: "11.5px" }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form thêm màu mới theo sở thích */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newRule.key.trim()) return;
          const key = newRule.key.trim().toUpperCase();
          const rule: ColorRule = {
            id: `custom-${Date.now()}`,
            category: newRule.category,
            key,
            label: newRule.label.trim() || STATUS_PRESETS[key] || newRule.key.trim(),
            bg_color: newRule.bg_color,
            border_color: newRule.bg_color,
            text_color: newRule.text_color,
            note: newRule.note.trim(),
          };
          void onCommand("color-rules", { rule });
          setNewRule({ ...newRule, key: "", label: "", note: "" });
        }}
        style={{
          marginTop: "14px",
          padding: "12px 14px",
          background: "#f8fafc",
          border: "1px solid var(--line)",
          borderRadius: "8px",
        }}
      >
        <b style={{ fontSize: "12.5px", display: "block", marginBottom: "8px" }}>
          ➕ Thêm mã màu mới hoặc đổi màu chú thích mặc định
        </b>
        <div className="editor-row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ flex: 1.15, minWidth: "180px" }}>
            <span>Phân loại</span>
            <select
              value={newRule.category}
              onChange={(e) => {
                const cat = e.target.value as ColorRule["category"];
                const defaultKey = cat === "STATUS" ? "EXTERNAL_TEACHING" : "";
                setNewRule({
                  ...newRule,
                  category: cat,
                  key: defaultKey,
                  label: defaultKey ? STATUS_PRESETS[defaultKey] : "",
                });
              }}
              style={compactSelectStyle}
            >
              <option value="INSTITUTION">Trường / Đơn vị (VD: Trường A)</option>
              <option value="CUSTOM">Môn học / Ngành (VD: 61FIT3JSD)</option>
              <option value="KIND">Loại buổi (LEC / TUT)</option>
              <option value="STATUS">Đổi màu nhãn mặc định (Đi học, Dạy ngoài...)</option>
            </select>
          </label>
          <label style={{ flex: 1, minWidth: "155px" }}>
            <span>Mã khớp trên lịch</span>
            {newRule.category === "STATUS" ? (
              <select
                value={newRule.key || "EXTERNAL_TEACHING"}
                onChange={(e) => {
                  const k = e.target.value;
                  setNewRule({ ...newRule, key: k, label: STATUS_PRESETS[k] || k });
                }}
                style={compactSelectStyle}
              >
                {Object.entries(STATUS_PRESETS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl} ({k})
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                value={newRule.key}
                onChange={(e) => setNewRule({ ...newRule, key: e.target.value })}
                placeholder="VD: Trường A, LEC, 61FIT3JSD..."
                style={{ height: "38px", minHeight: "38px" }}
              />
            )}
          </label>
          <label style={{ flex: 1.1, minWidth: "145px" }}>
            <span>Tên nhãn hiển thị</span>
            <input
              value={newRule.label}
              onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
              placeholder="VD: Lịch dạy Trường A"
              style={{ height: "38px", minHeight: "38px" }}
            />
          </label>
          <label style={{ flex: 0.35, minWidth: "58px" }}>
            <span>Nền</span>
            <input
              type="color"
              value={newRule.bg_color}
              onChange={(e) => setNewRule({ ...newRule, bg_color: e.target.value })}
              style={{ height: "38px", minHeight: "38px", padding: "2px", cursor: "pointer" }}
            />
          </label>
          <label style={{ flex: 0.35, minWidth: "58px" }}>
            <span>Chữ</span>
            <input
              type="color"
              value={newRule.text_color}
              onChange={(e) => setNewRule({ ...newRule, text_color: e.target.value })}
              style={{ height: "38px", minHeight: "38px", padding: "2px", cursor: "pointer" }}
            />
          </label>
          <label style={{ flex: 1.7, minWidth: "180px" }}>
            <span>Note theo sở thích</span>
            <input
              value={newRule.note}
              onChange={(e) => setNewRule({ ...newRule, note: e.target.value })}
              placeholder="Ghi chú cá nhân đính kèm lên lịch..."
              style={{ height: "38px", minHeight: "38px" }}
            />
          </label>
          <button
            type="submit"
            className="primary"
            disabled={busy || !newRule.key.trim()}
            style={{ height: "38px", minHeight: "38px", whiteSpace: "nowrap" }}
          >
            + Lưu màu
          </button>
        </div>
      </form>
    </section>
  );
}
