"use client";
import { useMemo, useState } from "react";
import type { Room } from "./types";
import type { Dept } from "../catalog/types";
import type { OfferingItem, Session } from "../workspace/types";
import { ActionButton, EmptyState, Icon } from "../shared/ui";
import { commaValues as values } from "../shared/text";

const STANDARD_EQUIPMENT = [
  { code: "PROJECTOR", label: "Máy chiếu (PROJECTOR)" },
  { code: "COMPUTER", label: "Dàn máy tính (COMPUTER)" },
  { code: "MICRO", label: "Micro hội trường (MICRO)" },
  { code: "LOA", label: "Hệ thống âm thanh (LOA)" },
  { code: "GRAPHICS_CARD", label: "Đồ họa / GPU (GRAPHICS_CARD)" },
];

export function RequirementsEditor({
  sessions,
  disabled,
  onCommand,
  rooms = [],
  offerings = [],
  departments = [],
}: {
  sessions: Session[];
  disabled: boolean;
  onCommand: (action: string, payload: unknown) => Promise<void>;
  rooms?: Room[];
  offerings?: OfferingItem[];
  departments?: Dept[];
}) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "custom" | "default">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [targetSessions, setTargetSessions] = useState<Session[]>([]);
  const [primaryRoomGroup, setPrimaryRoomGroup] = useState<"PROJECTOR" | "COMPUTER">("PROJECTOR");
  const [requiredRoomType, setRequiredRoomType] = useState("");
  const [selectedEquip, setSelectedEquip] = useState<Set<string>>(new Set());
  const [extraEquipStr, setExtraEquipStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const offeringMap = useMemo(() => {
    const map = new Map<string, OfferingItem>();
    offerings.forEach((o) => {
      if (o.id) map.set(o.id, o);
      if (o.course && !map.has(o.course)) map.set(o.course, o);
    });
    return map;
  }, [offerings]);

  const equipmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    STANDARD_EQUIPMENT.forEach((e) => map.set(e.code, e.label));
    rooms.forEach((r) => {
      (r.equipment || []).forEach((eq) => {
        const up = eq.trim().toUpperCase();
        if (up && !map.has(up)) map.set(up, up);
      });
    });
    return Array.from(map.entries()).map(([code, label]) => ({ code, label }));
  }, [rooms]);

  const customRoomTypes = useMemo(() => {
    const set = new Set<string>(["PROJECTOR", "COMPUTER"]);
    rooms.forEach((r) => {
      if (r.room_type?.trim()) set.add(r.room_type.trim());
    });
    return Array.from(set);
  }, [rooms]);

  const isCustomSession = (s: Session) => {
    const defaultPrimary = s.kind === "TUT" ? "COMPUTER" : "PROJECTOR";
    return (
      Boolean(s.required_equipment && s.required_equipment.length > 0) ||
      Boolean(s.required_room_type) ||
      Boolean(s.room && s.room !== defaultPrimary)
    );
  };

  const getCourseName = (s: Session) =>
    (s.offering && offeringMap.get(s.offering)?.name) ||
    offeringMap.get(s.course)?.name ||
    "";

  const getCohort = (s: Session) =>
    s.cohort ||
    (s.offering && offeringMap.get(s.offering)?.cohort) ||
    offeringMap.get(s.course)?.cohort ||
    "—";

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (deptFilter && s.department !== deptFilter) return false;
      if (kindFilter !== "all" && s.kind !== kindFilter) return false;
      const custom = isCustomSession(s);
      if (statusFilter === "custom" && !custom) return false;
      if (statusFilter === "default" && custom) return false;
      if (!q) return true;
      const cName = getCourseName(s).toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q) ||
        cName.includes(q)
      );
    });
  }, [sessions, deptFilter, kindFilter, statusFilter, search, offeringMap]); // eslint-disable-line

  const customCount = useMemo(
    () => sessions.filter((s) => isCustomSession(s)).length,
    [sessions]
  );

  const openModalFor = (targets: Session[]) => {
    if (!targets.length) return;
    const first = targets[0];
    const defGroup = first.kind === "TUT" ? "COMPUTER" : "PROJECTOR";
    setTargetSessions(targets);
    setPrimaryRoomGroup(
      first.room === "COMPUTER" || first.room === "PROJECTOR" ? first.room : defGroup
    );
    setRequiredRoomType(first.required_room_type ?? "");
    const knownCodes = new Set(equipmentOptions.map((e) => e.code));
    const eqSet = new Set<string>();
    const extras: string[] = [];
    (first.required_equipment ?? []).forEach((eq) => {
      const up = eq.toUpperCase();
      if (knownCodes.has(up)) eqSet.add(up);
      else extras.push(up);
    });
    setSelectedEquip(eqSet);
    setExtraEquipStr(extras.join(", "));
    setModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!targetSessions.length) return;
    const mergedEquip = Array.from(
      new Set([
        ...Array.from(selectedEquip),
        ...values(extraEquipStr).map((x) => x.toUpperCase()),
      ])
    );
    setSaving(true);
    try {
      for (const s of targetSessions) {
        await onCommand("requirements", {
          session: s.id,
          room: primaryRoomGroup,
          required_equipment: mergedEquip,
          required_room_type: requiredRoomType.trim() || null,
        });
      }
      setModalOpen(false);
      setSelectedIds(new Set());
    } finally {
      setSaving(false);
    }
  };

  const handleResetModalToDefault = async () => {
    if (!targetSessions.length) return;
    setSaving(true);
    try {
      for (const s of targetSessions) {
        const defaultPrimary = s.kind === "TUT" ? "COMPUTER" : "PROJECTOR";
        await onCommand("requirements", {
          session: s.id,
          room: defaultPrimary,
          required_equipment: [],
          required_room_type: null,
        });
      }
      setModalOpen(false);
      setSelectedIds(new Set());
    } finally {
      setSaving(false);
    }
  };

  const handleResetSingle = async (s: Session) => {
    const defaultPrimary = s.kind === "TUT" ? "COMPUTER" : "PROJECTOR";
    setResettingId(s.id);
    try {
      await onCommand("requirements", {
        session: s.id,
        room: defaultPrimary,
        required_equipment: [],
        required_room_type: null,
      });
    } finally {
      setResettingId(null);
    }
  };

  const toggleSelectAll = () => {
    if (filteredSessions.length > 0 && selectedIds.size === filteredSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSessions.map((s) => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const deptList = useMemo(() => {
    if (departments.length) return departments;
    const ids = Array.from(new Set(sessions.map((s) => s.department).filter(Boolean))).sort();
    return ids.map((id) => ({ id, name: id, status: "UNSENT", note: "" }));
  }, [departments, sessions]);

  return (
    <section className="card">
      <div
        className="section-heading"
        style={{ flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "10px" }}
      >
        <div>
          <h2 style={{ display: "inline-flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <Icon name="sliders" size={18} />
            <span>Bảng Yêu cầu Phòng của Lớp học phần</span>
          </h2>
          <p style={{ marginTop: "3px" }}>
            Mặc định lớp Lý thuyết (LEC) xếp vào Phòng máy chiếu, Thực hành (TUT) xếp vào Phòng máy tính. Tùy chỉnh riêng khi lớp cần thiết bị hoặc loại phòng đặc thù.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge neutral">{customCount} lớp đã tùy chỉnh</span>
          {selectedIds.size > 0 && (
            <>
              <ActionButton
                type="button"
                variant="primary"
                icon="edit"
                disabled={disabled}
                onClick={() =>
                  openModalFor(sessions.filter((s) => selectedIds.has(s.id)))
                }
                style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}
              >
                Cập nhật hàng loạt ({selectedIds.size} lớp)
              </ActionButton>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setSelectedIds(new Set())}
                style={{ minHeight: "32px", padding: "4px 10px", fontSize: "12px" }}
              >
                Bỏ chọn
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bộ lọc gọn trên 1 hàng */}
      <div
        className="toolbar"
        style={{ marginTop: 0, gap: "10px", flexWrap: "wrap", alignItems: "center" }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã môn, tên học phần hoặc mã lớp..."
          style={{ minHeight: "36px", height: "36px", flex: 2, minWidth: "220px" }}
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ minHeight: "36px", height: "36px", flex: 1, minWidth: "150px" }}
        >
          <option value="">Tất cả bộ môn ({deptList.length})</option>
          {deptList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.id} {d.name && d.name !== d.id ? `— ${d.name}` : ""}
            </option>
          ))}
        </select>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          style={{ minHeight: "36px", height: "36px", flex: 1, minWidth: "145px" }}
        >
          <option value="all">Tất cả loại lớp</option>
          <option value="LEC">Lý thuyết (LEC)</option>
          <option value="TUT">Thực hành (TUT)</option>
          <option value="COMBINED">Tích hợp (COMBINED)</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "custom" | "default")}
          style={{ minHeight: "36px", height: "36px", flex: 1, minWidth: "155px" }}
        >
          <option value="all">Tất cả trạng thái ({sessions.length})</option>
          <option value="custom">Đã tùy chỉnh ({customCount})</option>
          <option value="default">Mặc định ({sessions.length - customCount})</option>
        </select>
      </div>

      {!sessions.length ? (
        <EmptyState title="Chưa có lớp học phần trong kế hoạch">
          Nhập kế hoạch mở lớp tại mục Kế hoạch &amp; Khung giờ trước khi thiết lập yêu cầu phòng.
        </EmptyState>
      ) : !filteredSessions.length ? (
        <EmptyState title="Không tìm thấy lớp học phần phù hợp">
          Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc trạng thái.
        </EmptyState>
      ) : (
        <div className="table-wrap table-scroll" style={{ maxHeight: "460px" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "42px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả lớp đang hiển thị"
                    checked={
                      filteredSessions.length > 0 &&
                      selectedIds.size === filteredSessions.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ width: "170px" }}>Mã lớp</th>
                <th>Học phần &amp; Bộ môn</th>
                <th style={{ width: "110px" }}>Loại &amp; Quy mô</th>
                <th>Yêu cầu phòng hiện tại</th>
                <th style={{ width: "110px" }}>Trạng thái</th>
                <th style={{ width: "175px", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => {
                const custom = isCustomSession(s);
                const cName = getCourseName(s);
                const effGroup = s.room || (s.kind === "TUT" ? "COMPUTER" : "PROJECTOR");
                return (
                  <tr key={s.id}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        aria-label={`Chọn lớp ${s.id}`}
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelectOne(s.id)}
                      />
                    </td>
                    <td>
                      <b>{s.id}</b>
                      <small>Khóa {getCohort(s)}</small>
                    </td>
                    <td>
                      <b>
                        {s.course}
                        {cName ? ` — ${cName}` : ""}
                      </b>
                      <small>Bộ môn {s.department}</small>
                    </td>
                    <td>
                      <span className="badge neutral">{s.kind}</span>
                      <small>
                        {s.students} SV · {s.periods ?? "—"} tiết
                      </small>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
                        <span
                          className={
                            "badge " + (effGroup === "COMPUTER" ? "neutral" : "success")
                          }
                        >
                          {effGroup === "COMPUTER" ? "Máy tính (COMPUTER)" : "Máy chiếu (PROJECTOR)"}
                        </span>
                        {s.required_room_type && (
                          <span className="badge warning">Loại: {s.required_room_type}</span>
                        )}
                      </div>
                      {s.required_equipment && s.required_equipment.length > 0 && (
                        <small style={{ marginTop: "3px" }}>
                          Thiết bị bắt buộc: {s.required_equipment.join(", ")}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className={"badge " + (custom ? "warning" : "neutral")}>
                        {custom ? "Đã tùy chỉnh" : "Mặc định"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <ActionButton
                        type="button"
                        icon="edit"
                        disabled={disabled}
                        onClick={() => openModalFor([s])}
                        style={{
                          minHeight: "30px",
                          padding: "3px 9px",
                          fontSize: "11.5px",
                          marginRight: custom ? "5px" : 0,
                        }}
                      >
                        Cập nhật
                      </ActionButton>
                      {custom && (
                        <ActionButton
                          type="button"
                          variant="ghost"
                          icon="undo"
                          loading={resettingId === s.id}
                          disabled={disabled}
                          onClick={() => void handleResetSingle(s)}
                          style={{ minHeight: "30px", padding: "3px 8px", fontSize: "11.5px" }}
                        >
                          Mặc định
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && targetSessions.length > 0 && (
        <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Cập nhật yêu cầu phòng cho lớp học phần</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Đóng"
                disabled={saving}
                onClick={() => setModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Thông tin ngữ cảnh lớp học phần */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "14px",
                fontSize: "12px",
              }}
            >
              {targetSessions.length === 1 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "6px 14px",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--muted)" }}>Mã lớp:</span>{" "}
                    <b>{targetSessions[0].id}</b>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)" }}>Bộ môn / Khóa:</span>{" "}
                    <b>
                      {targetSessions[0].department} · K{getCohort(targetSessions[0])}
                    </b>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "var(--muted)" }}>Học phần:</span>{" "}
                    <b>
                      {targetSessions[0].course}
                      {getCourseName(targetSessions[0])
                        ? ` — ${getCourseName(targetSessions[0])}`
                        : ""}
                    </b>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)" }}>Sĩ số:</span>{" "}
                    <b>{targetSessions[0].students} sinh viên</b>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)" }}>Số tiết / Loại:</span>{" "}
                    <b>
                      {targetSessions[0].periods ?? "—"} tiết ({targetSessions[0].kind})
                    </b>
                  </div>
                </div>
              ) : (
                <div>
                  <b>Đang cập nhật hàng loạt cho {targetSessions.length} lớp học phần:</b>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "5px",
                      marginTop: "6px",
                      maxHeight: "76px",
                      overflowY: "auto",
                    }}
                  >
                    {targetSessions.map((s) => (
                      <span key={s.id} className="badge neutral">
                        {s.id} ({s.department} · {s.students} SV · {s.periods ?? "—"}t)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveModal();
              }}
            >
              <label>
                <span>Nhóm phòng cơ sở</span>
                <select
                  value={primaryRoomGroup}
                  onChange={(e) =>
                    setPrimaryRoomGroup(e.target.value as "PROJECTOR" | "COMPUTER")
                  }
                >
                  <option value="PROJECTOR">PROJECTOR — Phòng máy chiếu (chuẩn Lý thuyết)</option>
                  <option value="COMPUTER">COMPUTER — Phòng máy tính (chuẩn Thực hành)</option>
                </select>
              </label>

              <label>
                <span>Loại phòng chuyên biệt (required_room_type)</span>
                <input
                  list="custom-room-types-list"
                  value={requiredRoomType}
                  onChange={(e) => setRequiredRoomType(e.target.value)}
                  placeholder="Để trống nếu áp dụng theo nhóm phòng cơ sở"
                />
                <datalist id="custom-room-types-list">
                  {customRoomTypes.map((rt) => (
                    <option key={rt} value={rt} />
                  ))}
                </datalist>
              </label>

              <fieldset style={{ margin: "12px 0", padding: "12px 14px" }}>
                <legend>Thiết bị bắt buộc (required_equipment)</legend>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                  {equipmentOptions.map((eq) => {
                    const checked = selectedEquip.has(eq.code);
                    return (
                      <label
                        key={eq.code}
                        className={`cap-check ${checked ? "is-checked-lec" : ""}`}
                        style={{ padding: "4px 9px" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(selectedEquip);
                            if (next.has(eq.code)) next.delete(eq.code);
                            else next.add(eq.code);
                            setSelectedEquip(next);
                          }}
                        />
                        <span>{eq.label}</span>
                      </label>
                    );
                  })}
                </div>
                <label style={{ margin: 0 }}>
                  <span>Thiết bị đặc thù khác (cách nhau bằng dấu phẩy)</span>
                  <input
                    value={extraEquipStr}
                    onChange={(e) => setExtraEquipStr(e.target.value)}
                    placeholder="VD: CAMERA, TABLET_PEN..."
                  />
                </label>
              </fieldset>

              <div
                className="actions"
                style={{ justifyContent: "space-between", marginTop: "16px", alignItems: "center" }}
              >
                <ActionButton
                  type="button"
                  variant="ghost"
                  icon="undo"
                  loading={saving}
                  onClick={() => void handleResetModalToDefault()}
                >
                  Đặt lại mặc định
                </ActionButton>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <ActionButton
                    type="submit"
                    variant="primary"
                    icon="check"
                    loading={saving}
                    loadingLabel="Đang lưu..."
                  >
                    Lưu yêu cầu phòng
                  </ActionButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
