"use client";
import { useState, type ChangeEvent } from "react";
import type { Dept, Teacher } from "./types";

// Helper to parse simple CSV
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

export function CatalogImport({ disabled, initialDepartments, initialTeachers, onSaveCatalog }: {
  disabled: boolean;
  initialDepartments: Dept[];
  initialTeachers: Teacher[];
  onSaveCatalog: (data: { departments: Dept[]; teachers: Teacher[] }) => Promise<void>;
}) {
  // Import State
  const [importMode, setImportMode] = useState<"dept" | "teacher">("dept");
  const [importPreview, setImportPreview] = useState<{
    valid: unknown[];
    errors: string[];
    summary: string;
  } | null>(null);

  // Handlers for Import
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportPreview(null);
    const text = await file.text();

    if (importMode === "dept") {
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
    } else {
      let rawList: Record<string, string>[] = [];
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          rawList = Array.isArray(parsed) ? parsed : parsed.teachers || [];
        } catch {
          setImportPreview({ valid: [], errors: ["Định dạng JSON không hợp lệ"], summary: "" });
          return;
        }
      } else {
        rawList = parseCSV(text);
      }

      const valid: Teacher[] = [];
      const errors: string[] = [];
      const knownDeptIds = new Set(initialDepartments.map((d) => d.id));

      rawList.forEach((row, idx) => {
        const id = (row.id || row.ma_gv || row.magv || "").trim();
        const name = (row.name || row.ho_ten || row.hoten || id).trim();
        const dept = (row.department || row.bo_mon || row.bomon || "").trim();
        const assistant = Boolean(row.assistant || row.tro_giang === "x" || row.tro_giang === "true");

        if (!id) {
          errors.push(`Dòng ${idx + 2}: Thiếu mã giảng viên (id/ma_gv)`);
        } else if (!dept) {
          errors.push(`Dòng ${idx + 2}: Giảng viên '${id}' thiếu thông tin bộ môn`);
        } else if (!knownDeptIds.has(dept)) {
          errors.push(`Dòng ${idx + 2}: Bộ môn '${dept}' của GV '${id}' chưa có trong danh mục`);
        } else if (valid.some((t) => t.id === id)) {
          errors.push(`Dòng ${idx + 2}: Trùng mã giảng viên '${id}' trong file`);
        } else {
          const existing = initialTeachers.find((t) => t.id === id);
          let caps = existing?.capabilities || {};
          if (row.capabilities && typeof row.capabilities === "object") {
            caps = row.capabilities as unknown as Record<string, ("LEC" | "TUT" | "COMBINED")[]>;
          }
          valid.push({ id, name, department: dept, assistant, capabilities: caps });
        }
      });
      setImportPreview({
        valid,
        errors,
        summary: `Tìm thấy ${valid.length} giảng viên hợp lệ, ${errors.length} dòng lỗi.`,
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !importPreview.valid.length) return;
    if (importMode === "dept") {
      const newDepts = importPreview.valid as Dept[];
      const mergedMap = new Map<string, Dept>();
      initialDepartments.forEach((d) => mergedMap.set(d.id, d));
      newDepts.forEach((d) => mergedMap.set(d.id, d));
      await onSaveCatalog({ departments: Array.from(mergedMap.values()), teachers: initialTeachers });
    } else {
      const newTeachers = importPreview.valid as Teacher[];
      const mergedMap = new Map<string, Teacher>();
      initialTeachers.forEach((t) => mergedMap.set(t.id, t));
      newTeachers.forEach((t) => mergedMap.set(t.id, t));
      await onSaveCatalog({ departments: initialDepartments, teachers: Array.from(mergedMap.values()) });
    }
    setImportPreview(null);
  };

  return (
        <div style={{ padding: "8px 0" }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="radio"
                name="importMode"
                checked={importMode === "dept"}
                onChange={() => {
                  setImportMode("dept");
                  setImportPreview(null);
                }}
              />
              <b>1. Nhập Bộ môn (CSV/JSON)</b>
            </label>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="radio"
                name="importMode"
                checked={importMode === "teacher"}
                onChange={() => {
                  setImportMode("teacher");
                  setImportPreview(null);
                }}
              />
              <b>2. Nhập Giảng viên (CSV/JSON)</b>
            </label>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid var(--line)", borderRadius: "8px", padding: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--muted)" }}>
              {importMode === "dept"
                ? "Hỗ trợ file .json hoặc file .csv chứa các cột (ma_bm, ten_bm, truong_bo_mon). Dữ liệu nhập mới sẽ bổ sung hoặc cập nhật bộ môn cùng mã."
                : "Hỗ trợ file .json hoặc file .csv chứa các cột (ma_gv, ho_ten, bo_mon, tro_giang). Cần đảm bảo bộ môn đã tồn tại trước khi import giảng viên."}
            </p>
            <label style={{ margin: 0 }}>
              <input
                key={importMode}
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
                  Xác nhận lưu vào danh mục
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
