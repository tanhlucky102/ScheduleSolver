"use client";
export function CapabilitiesEditor({
  value,
  onChange,
  courses,
}: {
  value: string;
  onChange: (s: string) => void;
  courses: string[];
}) {
  const data: Record<string, string[]> = JSON.parse(value || "{}");
  return (
    <fieldset>
      <legend>Năng lực giảng dạy theo học phần</legend>
      <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "8px", padding: "12px", background: "white" }}>
        {courses.map((course) => (
          <div
            className="editor-row"
            key={course}
            style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginBottom: "8px" }}
          >
            <b style={{ minWidth: "140px", fontSize: "12px" }}>{course}</b>
            {(["LEC", "TUT"] as const).map((kind) => (
              <label key={kind} style={{ flex: "none", minWidth: "120px" }}>
                <input
                  type="checkbox"
                  checked={data[course]?.includes(kind) ?? false}
                  onChange={(e) => {
                    const values = new Set(data[course] ?? []);
                    if (e.target.checked) values.add(kind);
                    else values.delete(kind);
                    onChange(JSON.stringify({ ...data, [course]: Array.from(values) }));
                  }}
                />
                <span style={{ display: "inline", textTransform: "none", fontSize: "12px" }}>
                  {kind === "LEC" ? "Lý thuyết (LEC)" : "Thực hành (TUT)"}
                </span>
              </label>
            ))}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
        Buổi gộp (LT + TH) cần cả hai năng lực. Trợ giảng chỉ được phân công tiết Thực hành.
      </p>
    </fieldset>
  );
}
