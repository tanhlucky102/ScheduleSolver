"use client";
import { useState } from "react";
import { previewWorkbook } from "./api-client";
import { formatDateVN } from "../shared/weeks";
import type { OfferingItem } from "./types";

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
    offerings: OfferingItem[];
    errors: { row: number; message: string }[];
    can_import: boolean;
  } | null>(null);
  const [fileSelectedName, setFileSelectedName] = useState("");
  const [showSampleColumns, setShowSampleColumns] = useState(false);

  return (
    <section className="card" style={{ border: sessionsCount === 0 ? "2px dashed #93c5fd" : undefined }}>
      <div className="section-heading" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2>Nhập kế hoạch đào tạo Excel (.xlsx)</h2>
          <p>
            Tải file mẫu chuẩn (hỗ trợ cả số tiết lẻ như <b>2.5 tiết HANU</b>, hệ <b>CLC / Tiên tiến TT / MME / Đại trà</b>), điền danh sách học phần và tải lên để thẩm định trước khi chia lớp.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <a
            href={`${apiUrl}/api/templates/plan`}
            download="Mau_Ke_Hoach_Dao_Tao_HANU.xlsx"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "#eff6ff",
              border: "1px solid #93c5fd",
              color: "#1d4ed8",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            📥 Tải File Mẫu Chuẩn (.xlsx)
          </a>
          <button
            type="button"
            onClick={() => setShowSampleColumns((prev) => !prev)}
            style={{ fontSize: "12px", minHeight: "32px", padding: "4px 10px" }}
          >
            {showSampleColumns ? "Ẩn cấu trúc cột mẫu" : "👁 Xem cấu trúc 14 cột chuẩn"}
          </button>
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
      </div>

      {showSampleColumns && (
        <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#f8fafc", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "11.5px" }}>
          <b style={{ display: "block", marginBottom: "6px", color: "#0f172a" }}>
            📋 Khớp 100% với bộ đọc Kế hoạch đào tạo (12 cột chuẩn trong 1 sheet Excel duy nhất):
          </b>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã môn</th>
                  <th>Tên học phần</th>
                  <th>Khóa</th>
                  <th>Bộ môn</th>
                  <th>Sĩ số</th>
                  <th>Số tiết Lec</th>
                  <th>Số tiết Tut</th>
                  <th>Lec+Tut liền</th>
                  <th>Phòng Lec</th>
                  <th>Phòng Tut</th>
                  <th>Số lớp Lec</th>
                  <th>Số lớp Tut</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>61FIT3SS1</b></td>
                  <td>Phát triển PM nguồn mở</td>
                  <td>2024</td>
                  <td>CNPM</td>
                  <td>120</td>
                  <td>2.5</td>
                  <td>2.5</td>
                  <td></td>
                  <td>Máy chiếu</td>
                  <td>Máy tính</td>
                  <td>1</td>
                  <td>4</td>
                  <td>17/08/2026</td>
                  <td>22/11/2026</td>
                </tr>
                <tr>
                  <td><b>66FIT3AI1</b></td>
                  <td>Trí tuệ nhân tạo (TT)</td>
                  <td>2024</td>
                  <td>KHMT</td>
                  <td>55</td>
                  <td>2.5</td>
                  <td>2.5</td>
                  <td></td>
                  <td>Máy chiếu</td>
                  <td>Máy tính</td>
                  <td>1</td>
                  <td>2</td>
                  <td>17/08/2026</td>
                  <td>22/11/2026</td>
                </tr>
                <tr>
                  <td><b>61MME2GD1</b></td>
                  <td>Thiết kế đồ họa ĐPT</td>
                  <td>2025</td>
                  <td>TTDPT</td>
                  <td>80</td>
                  <td>2</td>
                  <td>2</td>
                  <td>x</td>
                  <td>Máy tính</td>
                  <td>Máy tính</td>
                  <td></td>
                  <td>3</td>
                  <td>07/09/2026</td>
                  <td>13/12/2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <label>
        Chọn tệp kế hoạch .xlsx để tải lên kiểm tra
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
              const data = await previewWorkbook<{ offerings: OfferingItem[]; errors: { row: number; message: string }[]; can_import: boolean }>(apiUrl, token, file);
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
          {preview.offerings.length > 0 && (
            <div className="table-wrap" style={{ maxHeight: "220px", overflowY: "auto", margin: "8px 0 10px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Mã môn</th>
                    <th>Tên học phần</th>
                    <th>Khóa / Bộ môn</th>
                    <th>Sĩ số</th>
                    <th>Tiết Lec / Tut</th>
                    <th>Thời gian học (BĐ → KT)</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.offerings.slice(0, 50).map((o) => (
                    <tr key={o.id}>
                      <td><b>{o.course}</b></td>
                      <td>{o.name}</td>
                      <td>K{o.cohort} · {o.department}</td>
                      <td>{o.students}</td>
                      <td>{o.lecture_periods} / {o.tutorial_periods}</td>
                      <td>
                        {o.start_date || o.end_date
                          ? `${formatDateVN(o.start_date)} → ${formatDateVN(o.end_date)}`
                          : "Toàn học kỳ"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
