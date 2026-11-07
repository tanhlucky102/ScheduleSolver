"use client";
import { useState } from "react";
import { previewWorkbook } from "./api-client";

export function PlanImportCard({
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
              const data = await previewWorkbook<{ offerings: unknown[]; errors: { row: number; message: string }[]; can_import: boolean }>(apiUrl, token, file);
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
