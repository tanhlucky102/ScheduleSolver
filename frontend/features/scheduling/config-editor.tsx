"use client";
import { clock as time, minutes } from "../shared/time";
export type Config = {
  soft_weights?: Record<string, number>;
  period_minutes: number;
  break_minutes: number;
  max_periods: number;
  rooms: Record<string, number>;
  slots: { day: number; start: number; end: number; evening: boolean }[];
};


export function ConfigEditor({
  value,
  onChange,
  onSave,
  disabled,
  hasPublished,
}: {
  value: string;
  onChange: (s: string) => void;
  onSave: (data: unknown) => void;
  disabled: boolean;
  hasPublished?: boolean;
}) {
  const config: Config = value
    ? JSON.parse(value)
    : {
        period_minutes: 50,
        break_minutes: 10,
        max_periods: 8,
        rooms: { PROJECTOR: 10, COMPUTER: 5 },
        slots: [],
      };
  const update = (c: Config) => onChange(JSON.stringify(c));

  // Generate 66 standard slots (07:00-12:00, 13:00-22:00 Monday-Saturday)
  const generateFitStandardSlots = () => {
    const slots = [];
    for (let day = 2; day <= 7; day++) {
      // Morning slots: 07:00, 08:00, 09:00, 10:00 to 12:00
      for (const h of [7, 8, 9, 10]) {
        slots.push({ day, start: h * 60, end: 12 * 60, evening: false });
      }
      // Afternoon slots: 13:00, 14:00, 15:00, 16:00, 17:00 to 22:00
      for (const h of [13, 14, 15, 16, 17]) {
        slots.push({ day, start: h * 60, end: 22 * 60, evening: false });
      }
      // Evening slots: 18:00, 19:00 to 22:00
      for (const h of [18, 19]) {
        slots.push({ day, start: h * 60, end: 22 * 60, evening: true });
      }
    }
    return slots;
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Khung giờ & quy định học kỳ</h2>
          <p>Thiết lập thời lượng mỗi tiết, thời gian nghỉ, trần tiết/ngày và các khung giờ bắt đầu khả dụng.</p>
        </div>
      </div>

      {hasPublished && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#166534" }}>
          <b>💡 Lưu ý vận hành:</b> Học kỳ hiện đã có lịch công bố. Bạn vẫn có thể tự do điều chỉnh thời lượng tiết, trần tiết và khung giờ. Sau khi nhấn <b>"Lưu cấu hình khung giờ"</b>, hệ thống sẽ lưu cấu hình mới và bạn có thể chuyển sang mục Xếp lịch để chạy lại bộ giải khi cần.
        </div>
      )}

      <fieldset disabled={disabled}>
        <legend>Thời lượng & giới hạn tiết học</legend>
        <div className="editor-row">
          {(["period_minutes", "break_minutes", "max_periods"] as const).map((key, i) => (
            <label key={key}>
              <span>{["Phút mỗi tiết", "Phút nghỉ giữa tiết", "Trần tiết tối đa/ngày"][i]}</span>
              <input
                type="number"
                min={key === "break_minutes" ? 0 : 1}
                max={key === "max_periods" ? 8 : 120}
                value={config[key]}
                onChange={(e) => update({ ...config, [key]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--muted)" }}>
          Phòng học thực tế và điều kiện sử dụng được quản lý tại mục Phòng học. Trần tiết/ngày là ưu tiên mềm giúp phân bố tải đều.
        </p>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend>Khung giờ có thể xếp lớp ({config.slots.length} khung)</legend>
        <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--muted)" }}>
          Mỗi khung xác định ngày và giờ bắt đầu khả dụng cho các lớp học phần trong tuần.
        </p>

        <div style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "6px" }}>
          {config.slots.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "13px", padding: "12px 0" }}>
              Chưa có khung giờ nào. Hãy bấm "+ Thêm khung mới" hoặc "Nạp 66 khung chuẩn FIT" bên dưới.
            </p>
          ) : (
            config.slots.map((slot, i) => (
              <div className="editor-row" key={i}>
                <label style={{ flex: 1.2 }}>
                  <span>Thứ</span>
                  <select
                    value={slot.day}
                    onChange={(e) =>
                      update({
                        ...config,
                        slots: config.slots.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)),
                      })
                    }
                  >
                    {Array.from({length: 7}, (_, j) => j + 2).map((d) => (
                      <option key={d} value={d}>
                        {d === 8 ? "Chủ nhật" : "Thứ " + d}
                      </option>
                    ))}
                  </select>
                </label>
                {(["start", "end"] as const).map((k) => (
                  <label key={k}>
                    <span>{k === "start" ? "Bắt đầu" : "Kết thúc"}</span>
                    <input
                      type="time"
                      value={time(slot[k])}
                      onChange={(e) =>
                        update({
                          ...config,
                          slots: config.slots.map((x, j) =>
                            j === i ? { ...x, [k]: minutes(e.target.value) } : x
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <label style={{ flex: 0.8, minWidth: "100px", paddingBottom: "10px" }}>
                  <input
                    type="checkbox"
                    checked={slot.evening}
                    onChange={(e) =>
                      update({
                        ...config,
                        slots: config.slots.map((x, j) =>
                          j === i ? { ...x, evening: e.target.checked } : x
                        ),
                      })
                    }
                  />
                  <span style={{ display: "inline", textTransform: "none", fontSize: "12px" }}>Buổi tối</span>
                </label>
                <button
                  className="btn-remove"
                  type="button"
                  onClick={() => update({ ...config, slots: config.slots.filter((_, j) => j !== i) })}
                >
                  Bỏ
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() =>
              update({
                ...config,
                slots: [...config.slots, { day: 2, start: 420, end: 720, evening: false }],
              })
            }
          >
            + Thêm khung mới
          </button>
          <button
            type="button"
            onClick={() => update({ ...config, slots: generateFitStandardSlots() })}
            style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
          >
            ⚡ Nạp 66 khung chuẩn FIT
          </button>
          <button
            type="button"
            onClick={() =>
              update({
                ...config,
                slots: Array.from({ length: 6 }, (_, i) => [
                  { day: i + 2, start: 420, end: 720, evening: false },
                  { day: i + 2, start: 780, end: 1080, evening: false },
                ]).flat(),
              })
            }
          >
            Điền khung mẫu (Sáng & Chiều T2–T7)
          </button>
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend>Trọng số tối ưu hóa lịch (Soft constraints)</legend>
        <div className="editor-row">
          {(["restricted", "single_class", "overload", "gaps_minutes"] as const).map((key, i) => (
            <label key={key}>
              <span>{["Thứ 7 / Buổi tối", "Ngày chỉ có 1 lớp", "Vượt trần tiết/ngày", "Phút trống giữa buổi"][i]}</span>
              <input
                type="number"
                min={0}
                max={1000}
                value={config.soft_weights?.[key] ?? 1}
                onChange={(e) =>
                  update({
                    ...config,
                    soft_weights: {
                      restricted: 1,
                      single_class: 1,
                      overload: 1,
                      gaps_minutes: 1,
                      ...config.soft_weights,
                      [key]: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      </fieldset>

      <button className="primary" disabled={disabled || !config.slots.length} onClick={() => onSave(config)}>
        Lưu cấu hình khung giờ ({config.slots.length} khung)
      </button>
    </section>
  );
}
