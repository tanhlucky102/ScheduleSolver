"use client";
import { useState, type ChangeEvent } from "react";
import type { Dept, Teacher } from "./types";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = parts[idx] ?? "";
    });
    return row;
  });
}

export function CatalogImport({
  disabled,
  initialDepartments,
  initialTeachers,
  onSaveCatalog,
}: {
  disabled: boolean;
  initialDepartments: Dept[];
  initialTeachers: Teacher[];
  onSaveCatalog: (data: { departments: Dept[]; teachers: Teacher[] }) => Promise<void>;
}) {
  const [importPreview, setImportPreview] = useState<{
    valid: Dept[];
    errors: string[];
    summary: string;
  } | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportPreview(null);
    const text = await file.text();

    let rawList: Record<string, string>[] = [];
    if (file.name.endsWith(".json")) {
      try {
        const parsed = JSON.parse(text);
        rawList = Array.isArray(parsed) ? parsed : parsed.departments || [];
      } catch {
        setImportPreview({ valid: [], errors: ["Định dạng JSON không hợp lệ"], summary: "" });
        return;
      }
    } else {
      rawList = parseCSV(text);
    }

    const valid: Dept[] = [];
    const errors: string[] = [];
    rawList.forEach((row, idx) => {
      const id = (row.id || row.ma_bm || row.mabm || "").trim();
      const name = (row.name || row.ten_bm || row.tenbm || id).trim();
      if (!id) {
        errors.push(`Dòng ${idx + 2}: Thiếu mã bộ môn (id/ma_bm)`);
      } else if (valid.some((d) => d.id === id)) {
        errors.push(`Dòng ${idx + 2}: Trùng mã bộ môn '${id}' trong file`);
      } else {
        valid.push({ id, name, status: "UNSENT", note: "" });
      }
    });
    setImportPreview({
      valid,
      errors,
      summary: `Tìm thấy ${valid.length} bộ môn hợp lệ, ${errors.length} dòng lỗi.`,
    });
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !importPreview.valid.length) return;
    const mergedMap = new Map<string, Dept>();
    initialDepartments.forEach((d) => mergedMap.set(d.id, d));
    importPreview.valid.forEach((d) => mergedMap.set(d.id, d));
    await onSaveCatalog({ departments: Array.from(mergedMap.values()), teachers: initialTeachers });
    setImportPreview(null);
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
        <div>
          <b>Nhập danh sách Bộ môn từ file CSV / JSON</b>
        </div>

        <a
          href="/templates/bo-mon-mau.csv"
          download="Mau_Bo_Mon.csv"
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
          📥 Tải File Mẫu Bộ môn (.csv)
        </a>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid var(--line)", borderRadius: "8px", padding: "14px" }}>
        <p style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--muted)" }}>
          Mẫu cột chuẩn: <code>id, name</code> (VD: <code>CNPM, Công nghệ phần mềm</code>). Dữ liệu mới sẽ bổ sung hoặc cập nhật bộ môn cùng mã.
        </p>
        <label style={{ margin: 0 }}>
          <input
            type="file"
            accept=".json,.csv"
            disabled={disabled}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {importPreview && (
        <div style={{ marginTop: "16px", borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <b>{importPreview.summary}</b>
            <button
              className="primary"
              disabled={disabled || !importPreview.valid.length}
              onClick={handleConfirmImport}
            >
              Xác nhận lưu vào danh mục Bộ môn
            </button>
          </div>
          {importPreview.errors.length > 0 && (
            <div className="notice error" style={{ margin: "8px 0" }}>
              <b>Các dòng cần lưu ý:</b>
              {importPreview.errors.slice(0, 5).map((err, i) => (
                <span key={i}>• {err}</span>
              ))}
              {importPreview.errors.length > 5 && <span>... và {importPreview.errors.length - 5} lỗi khác</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
