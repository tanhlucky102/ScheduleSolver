"use client";
import { useMemo, useState, type ChangeEvent } from "react";
import { ActionButton, EmptyState, Icon, Metrics, Spinner } from "../shared/ui";
import type { Department, ClassSession, Teacher } from "../workspace/ui-types";
import type { OfferingItem } from "../workspace/types";

const FALLBACK_COURSE_NAMES: Record<string, string> = {
  "61FIT1CF": "Cơ sở lập trình",
  "61FIT2AIN": "Trí tuệ nhân tạo",
  "61FIT2CSA": "Kiến trúc máy tính",
  "61FIT2DBS": "Hệ cơ sở dữ liệu",
  "61FIT2DMA": "Toán rời rạc",
  "61FIT2DSA": "Cấu trúc dữ liệu và giải thuật",
  "61FIT2OOP": "Lập trình hướng đối tượng",
  "61FIT2POP": "Nguyên lý hệ điều hành",
  "61FIT2PR1": "Lập trình 1",
  "61FIT2PR2": "Lập trình 2",
  "61FIT3AIN": "Trí tuệ nhân tạo",
  "61FIT3AI1": "Trí tuệ nhân tạo",
  "61FIT3CGR": "Đồ họa máy tính",
  "61FIT3DBS": "Hệ quản trị cơ sở dữ liệu",
  "61FIT3DSY": "Hệ thống phân tán",
  "61FIT3IS1": "Hệ thống thông tin",
  "61FIT3JSD": "Phát triển phần mềm Java",
  "61FIT3MLA": "Học máy và ứng dụng",
  "61FIT3NET": "Mạng máy tính",
  "61FIT3NPR": "Lập trình mạng",
  "61FIT3SAD": "Phân tích và thiết kế hệ thống",
  "61FIT3SE1": "Công nghệ phần mềm 1",
  "61FIT3SE2": "Công nghệ phần mềm 2",
  "61FIT3SS1": "Chuyên đề phần mềm 1",
  "61FIT3SS2": "Chuyên đề phần mềm 2",
  "61FIT3WPR": "Lập trình Web",
  "61FIT4ATI": "Chủ đề tiên tiến trong CNTT",
  "61FIT4BDT": "Dữ liệu lớn",
  "61FIT4CLD": "Điện toán đám mây",
  "61FIT4DLN": "Học sâu",
  "61FIT4IOT": "Internet vạn vật",
  "61FIT4ISB": "An toàn thông tin",
  "61FIT4MLA": "Học máy và ứng dụng",
  "61FIT4MOB": "Phát triển ứng dụng di động",
  "61FIT4NAD": "Quản trị mạng",
  "61FIT4NLP": "Xử lý ngôn ngữ tự nhiên",
  "61FIT4SQT": "Kiểm thử và đảm bảo chất lượng PM",
  "61MME2DMA": "Toán rời rạc",
  "61MME2GD1": "Thiết kế đồ họa đa phương tiện",
  "61MME2PRC": "Nguyên lý máy tính",
  "61MME2PRE": "Kỹ thuật trình diễn đa phương tiện",
  "61MME3ANM": "Hoạt hình máy tính",
  "61MME3AUD": "Xử lý âm thanh số",
  "61MME3CG1": "Đồ họa máy tính 1",
  "61MME3CG2": "Đồ họa máy tính 2",
  "61MME3SM1": "Truyền thông xã hội & số 1",
  "61MME3VID": "Kỹ thuật xử lý video số",
  "62FIT2POP": "Nguyên lý hệ điều hành",
  "62FIT3SS1": "Chuyên đề phần mềm 1",
  "62FIT4ATI": "Chủ đề tiên tiến trong CNTT",
  "62FIT4NAD": "Quản trị mạng",
  "66FIT2DMA": "Toán rời rạc (TT)",
  "66FIT3AI1": "Trí tuệ nhân tạo (TT)",
};

export function parseRfc4180Csv(rawText: string): Record<string, string>[] {
  const clean = rawText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? "";
    });
    return obj;
  });
}

function isTruthyFlag(val: string | undefined): boolean {
  if (!val) return false;
  const s = val.trim().toLowerCase();
  return (
    s === "1" ||
    s === "true" ||
    s === "x" ||
    s === "yes" ||
    s === "co" ||
    s === "có" ||
    s === "lec" ||
    s === "tut"
  );
}

type CapPreviewItem = {
  teacherId: string;
  teacherName: string;
  assistant: boolean;
  course: string;
  kinds: ("LEC" | "TUT")[];
  strippedLec: boolean;
};

export function PersonnelMatrix({
  teachers,
  departments,
  sessions,
  offerings = [],
  onlineTeachers = [],
  currentTeacher,
  role,
  busy,
  onCommand,
}: {
  teachers: Teacher[];
  departments: Department[];
  sessions: ClassSession[];
  offerings?: OfferingItem[];
  onlineTeachers?: string[];
  currentTeacher?: string | null;
  role: "STAFF" | "HEAD" | "TEACHER";
  busy: boolean;
  onCommand: (action: string, payload: unknown) => Promise<void>;
}) {
  const isHead = role === "HEAD";
  const isStaff = role === "STAFF";
  const headDept = departments[0]?.id || "";

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [rowPending, setRowPending] = useState<string | null>(null);

  // Local draft overrides for courses where TBM unchecked both LEC & TUT so card stays visible
  const [emptyDraftCourses, setEmptyDraftCourses] = useState<Record<string, string[]>>({});

  // STAFF Personnel CSV Import Modal
  const [staffCsvModalOpen, setStaffCsvModalOpen] = useState(false);
  const [staffImportPreview, setStaffImportPreview] = useState<{
    valid: (Teacher & { isUpdate: boolean })[];
    errors: string[];
  } | null>(null);
  const [savingStaffCsv, setSavingStaffCsv] = useState(false);

  // STAFF Add/Edit Teacher Modal
  const [savingTeacherModal, setSavingTeacherModal] = useState(false);
  const [teacherModal, setTeacherModal] = useState<{
    open: boolean;
    isEdit: boolean;
    id: string;
    name: string;
    department: string;
    assistant: boolean;
    active: boolean;
  }>({
    open: false,
    isEdit: false,
    id: "",
    name: "",
    department: departments[0]?.id || "",
    assistant: false,
    active: true,
  });

  // HEAD Capability CSV Import Modal
  const [headCapModalOpen, setHeadCapModalOpen] = useState(false);
  const [capImportMode, setCapImportMode] = useState<"merge" | "replace">("merge");
  const [capCsvText, setCapCsvText] = useState("");
  const [capFileName, setCapFileName] = useState("");
  const [savingHeadCapCsv, setSavingHeadCapCsv] = useState(false);

  // HEAD Add Courses Modal for a Teacher
  const [addCourseModal, setAddCourseModal] = useState<{
    open: boolean;
    teacher: Teacher | null;
    search: string;
    showCrossDept: boolean;
    customCode: string;
    selections: Record<string, { lec: boolean; tut: boolean }>;
  }>({
    open: false,
    teacher: null,
    search: "",
    showCrossDept: false,
    customCode: "",
    selections: {},
  });
  const [savingAddCourses, setSavingAddCourses] = useState(false);

  const onlineSet = useMemo(() => {
    const s = new Set(onlineTeachers);
    if (currentTeacher) s.add(currentTeacher);
    return s;
  }, [onlineTeachers, currentTeacher]);

  const courseNameMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(FALLBACK_COURSE_NAMES).forEach(([code, name]) => map.set(code, name));
    offerings.forEach((o) => {
      if (o.course && o.name) map.set(o.course, o.name);
    });
    return map;
  }, [offerings]);

  const courseDeptMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (course: string, dept: string) => {
      if (!course || !dept) return;
      if (!map.has(course)) map.set(course, new Set());
      map.get(course)!.add(dept);
    };
    offerings.forEach((o) => add(o.course, o.department));
    sessions.forEach((s) => add(s.course, s.department));
    teachers.forEach((t) => {
      Object.keys(t.capabilities || {}).forEach((c) => add(c, t.department));
    });
    return map;
  }, [offerings, sessions, teachers]);

  const allKnownCourses = useMemo(() => {
    const set = new Set<string>();
    offerings.forEach((o) => {
      if (o.course) set.add(o.course);
    });
    sessions.forEach((s) => {
      if (s.course) set.add(s.course);
    });
    teachers.forEach((t) => {
      Object.keys(t.capabilities || {}).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [offerings, sessions, teachers]);

  const filterableCourses = useMemo(() => {
    if (!deptFilter) return allKnownCourses;
    return allKnownCourses.filter((c) => courseDeptMap.get(c)?.has(deptFilter));
  }, [allKnownCourses, courseDeptMap, deptFilter]);

  const formatCourseLabel = (code: string) => {
    const name = courseNameMap.get(code);
    return name ? `${code} — ${name}` : code;
  };

  const filteredTeachers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teachers.filter((t) => {
      const isAct = t.active !== false;
      if (deptFilter && t.department !== deptFilter) return false;
      if (activeFilter === "active" && !isAct) return false;
      if (activeFilter === "inactive" && isAct) return false;
      if (courseFilter && !(t.capabilities?.[courseFilter]?.length)) return false;
      if (!q) return true;
      const capCodes = Object.keys(t.capabilities || {});
      const capText = capCodes
        .map((c) => `${c} ${courseNameMap.get(c) || ""}`)
        .join(" ")
        .toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        (t.name || "").toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        capText.includes(q)
      );
    });
  }, [teachers, deptFilter, activeFilter, courseFilter, query, courseNameMap]);

  const activeCount = teachers.filter((t) => t.active !== false).length;
  const onlineCount = teachers.filter((t) => onlineSet.has(t.id)).length;
  const capableCount = teachers.filter((t) =>
    Object.values(t.capabilities || {}).some((v) => v.length > 0)
  ).length;

  const teacherLoad = (id: string) =>
    sessions.filter((s) => s.teacher === id).reduce((sum, s) => sum + (s.periods ?? 0), 0);

  // HEAD Capability CSV Local Preview Calculation
  const headCapPreview = useMemo(() => {
    if (!capCsvText.trim()) return null;
    const rows = parseRfc4180Csv(capCsvText);
    const deptTeacherLookup = new Map<string, Teacher>();
    teachers
      .filter((t) => !headDept || t.department === headDept)
      .forEach((t) => deptTeacherLookup.set(t.id.toLowerCase(), t));

    const matchedItems: CapPreviewItem[] = [];
    let skippedOtherDeptCount = 0;
    let assistantStrippedCount = 0;
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      const rawTeacher = (
        row.ma_gv ||
        row.teacher_id ||
        row.teacher ||
        row.id ||
        row.magv ||
        row.giang_vien ||
        row.ma_giang_vien ||
        ""
      ).trim();

      if (!rawTeacher) {
        errors.push(`Dòng ${idx + 2}: Thiếu mã giảng viên (ma_gv)`);
        return;
      }

      const rowDept = (row.bo_mon || row.department || row.ma_bm || "").trim().toUpperCase();
      const matchedTeacher = deptTeacherLookup.get(rawTeacher.toLowerCase());

      if (!matchedTeacher || (rowDept && headDept && rowDept !== headDept.toUpperCase())) {
        skippedOtherDeptCount++;
        return;
      }

      const rawCourse = (
        row.ma_mon ||
        row.ma_hp ||
        row.ma_hoc_phan ||
        row.hoc_phan ||
        row.course ||
        row.course_id ||
        row.mon_hoc ||
        ""
      )
        .trim()
        .toUpperCase();

      if (rawCourse) {
        const hasLecCol =
          "lec" in row || "ly_thuyet" in row || "lt" in row || "day_lec" in row;
        const hasTutCol =
          "tut" in row || "thuc_hanh" in row || "th" in row || "day_tut" in row;
        const combinedCol = (
          row.loai ||
          row.loai_buoi ||
          row.nang_luc ||
          row.vai_tro_day ||
          row.kinds ||
          row.type ||
          ""
        )
          .trim()
          .toUpperCase();

        let kinds: ("LEC" | "TUT")[] = [];
        if (hasLecCol || hasTutCol) {
          if (isTruthyFlag(row.lec ?? row.ly_thuyet ?? row.lt ?? row.day_lec)) kinds.push("LEC");
          if (isTruthyFlag(row.tut ?? row.thuc_hanh ?? row.th ?? row.day_tut)) kinds.push("TUT");
        } else if (combinedCol) {
          if (
            combinedCol.includes("LEC") ||
            combinedCol.includes("LT") ||
            combinedCol === "BOTH" ||
            combinedCol === "ALL" ||
            combinedCol === "COMBINED"
          ) {
            kinds.push("LEC");
          }
          if (
            combinedCol.includes("TUT") ||
            combinedCol.includes("TH") ||
            combinedCol === "BOTH" ||
            combinedCol === "ALL" ||
            combinedCol === "COMBINED"
          ) {
            kinds.push("TUT");
          }
        } else {
          kinds = ["LEC", "TUT"];
        }

        let strippedLec = false;
        if (matchedTeacher.assistant && kinds.includes("LEC")) {
          kinds = kinds.filter((k) => k !== "LEC");
          if (kinds.length === 0) kinds = ["TUT"];
          strippedLec = true;
          assistantStrippedCount++;
        }

        if (kinds.length > 0) {
          matchedItems.push({
            teacherId: matchedTeacher.id,
            teacherName: matchedTeacher.name || matchedTeacher.id,
            assistant: matchedTeacher.assistant,
            course: rawCourse,
            kinds,
            strippedLec,
          });
        }
      } else {
        // Semicolon format fallback: capabilities / nang_luc = "61FIT3AI1:LEC|TUT;..."
        const rawCap = (row.nang_luc || row.capabilities || "").trim();
        if (!rawCap) return;
        for (const chunk of rawCap.split(";")) {
          const [cPart, kPart] = chunk.split(":");
          const cCode = (cPart || "").trim().toUpperCase();
          if (!cCode) continue;
          let kinds = (kPart || "LEC|TUT")
            .split(/[|,/]/)
            .map((k) => k.trim().toUpperCase())
            .filter((k): k is "LEC" | "TUT" => k === "LEC" || k === "TUT");
          let strippedLec = false;
          if (matchedTeacher.assistant && kinds.includes("LEC")) {
            kinds = kinds.filter((k) => k !== "LEC");
            if (kinds.length === 0) kinds = ["TUT"];
            strippedLec = true;
            assistantStrippedCount++;
          }
          if (kinds.length > 0) {
            matchedItems.push({
              teacherId: matchedTeacher.id,
              teacherName: matchedTeacher.name || matchedTeacher.id,
              assistant: matchedTeacher.assistant,
              course: cCode,
              kinds,
              strippedLec,
            });
          }
        }
      }
    });

    const distinctTeachers = new Set(matchedItems.map((m) => m.teacherId)).size;
    return {
      totalRows: rows.length,
      matchedItems,
      distinctTeachers,
      skippedOtherDeptCount,
      assistantStrippedCount,
      errors,
    };
  }, [capCsvText, teachers, headDept]);

  const toggleCapability = async (t: Teacher, course: string, kind: "LEC" | "TUT") => {
    if (!isHead) return;
    if (t.assistant && kind === "LEC") return;

    const isCurrentlyEmptyDraft = (emptyDraftCourses[t.id] ?? []).includes(course);
    const currentSet = new Set<string>(
      isCurrentlyEmptyDraft ? [] : t.capabilities?.[course] ?? []
    );

    if (currentSet.has(kind)) currentSet.delete(kind);
    else currentSet.add(kind);

    if (currentSet.size === 0) {
      // Keep visible in local draft state with amber hint instead of silently vanishing!
      setEmptyDraftCourses((prev) => ({
        ...prev,
        [t.id]: Array.from(new Set([...(prev[t.id] ?? []), course])),
      }));
      return;
    }

    // Remove from empty draft state & persist to server
    setEmptyDraftCourses((prev) => ({
      ...prev,
      [t.id]: (prev[t.id] ?? []).filter((c) => c !== course),
    }));

    const nextCaps: Record<string, string[]> = {
      ...(t.capabilities || {}),
      [course]: Array.from(currentSet),
    };

    setRowPending(`cap-${t.id}-${course}`);
    try {
      await onCommand("teacher", {
        department: headDept || t.department,
        teacher: t.id,
        assistant: t.assistant,
        active: t.active !== false,
        capabilities: nextCaps,
      });
    } finally {
      setRowPending(null);
    }
  };

  const removeCourseFromTeacher = async (t: Teacher, course: string) => {
    if (!isHead) return;
    setEmptyDraftCourses((prev) => ({
      ...prev,
      [t.id]: (prev[t.id] ?? []).filter((c) => c !== course),
    }));
    if (!t.capabilities?.[course]) return;

    const nextCaps: Record<string, string[]> = { ...(t.capabilities || {}) };
    delete nextCaps[course];

    setRowPending(`rm-${t.id}-${course}`);
    try {
      await onCommand("teacher", {
        department: headDept || t.department,
        teacher: t.id,
        assistant: t.assistant,
        active: t.active !== false,
        capabilities: nextCaps,
      });
    } finally {
      setRowPending(null);
    }
  };

  const setTeacherRole = async (t: Teacher, nextAssistant: boolean) => {
    if (t.assistant === nextAssistant) return;
    const canEdit = isStaff || (isHead && (!headDept || t.department === headDept));
    if (!canEdit) return;

    const sanitizedCaps: Record<string, string[]> = {};
    Object.entries(t.capabilities || {}).forEach(([c, kinds]) => {
      const nextKinds = nextAssistant ? kinds.filter((k) => k !== "LEC") : kinds;
      if (nextKinds.length > 0) sanitizedCaps[c] = nextKinds;
    });

    setRowPending(`role-${t.id}`);
    try {
      if (isHead) {
        await onCommand("teacher", {
          department: headDept || t.department,
          teacher: t.id,
          assistant: nextAssistant,
          active: t.active !== false,
          capabilities: sanitizedCaps,
        });
      } else {
        await onCommand("teacher-save", {
          id: t.id,
          name: t.name,
          department: t.department,
          assistant: nextAssistant,
          active: t.active !== false,
          capabilities: t.capabilities || {},
        });
      }
    } finally {
      setRowPending(null);
    }
  };

  const toggleActive = async (t: Teacher) => {
    const canEdit = isStaff || (isHead && (!headDept || t.department === headDept));
    if (!canEdit) return;
    const nextActive = !(t.active !== false);

    setRowPending(`active-${t.id}`);
    try {
      if (isHead) {
        await onCommand("teacher", {
          department: headDept || t.department,
          teacher: t.id,
          assistant: t.assistant,
          active: nextActive,
          capabilities: t.capabilities || {},
        });
      } else {
        await onCommand("teacher-save", {
          id: t.id,
          name: t.name,
          department: t.department,
          assistant: t.assistant,
          active: nextActive,
          capabilities: t.capabilities || {},
        });
      }
    } finally {
      setRowPending(null);
    }
  };

  const handleSaveTeacherModal = async () => {
    if (!teacherModal.id.trim() || !teacherModal.department) return;
    const existing = teachers.find((t) => t.id === teacherModal.id.trim());
    setSavingTeacherModal(true);
    try {
      await onCommand("teacher-save", {
        id: teacherModal.id.trim(),
        name: teacherModal.name.trim() || teacherModal.id.trim(),
        department: teacherModal.department,
        assistant: teacherModal.assistant,
        active: teacherModal.active,
        capabilities: existing?.capabilities || {},
      });
      setTeacherModal({
        open: false,
        isEdit: false,
        id: "",
        name: "",
        department: departments[0]?.id || "",
        assistant: false,
        active: true,
      });
    } finally {
      setSavingTeacherModal(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhân sự ${id}?`)) return;
    setRowPending(`del-${id}`);
    try {
      await onCommand("teacher-delete", { id });
    } finally {
      setRowPending(null);
    }
  };

  // STAFF Personnel CSV File Handler (RFC-4180, NO capabilities read/sent!)
  const handleStaffCsvFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStaffImportPreview(null);
    const text = await file.text();
    const rawRows = parseRfc4180Csv(text);

    const valid: (Teacher & { isUpdate: boolean })[] = [];
    const errors: string[] = [];
    const knownDeptIds = new Set(departments.map((d) => d.id));

    rawRows.forEach((row, idx) => {
      const id = (row.ma_gv || row.id || row.magv || "").trim();
      const rawHoTen = (row.ho_ten || row.name || row.hoten || "").trim();
      const rawBiDanh = (row.bi_danh || row.alias || "").trim();
      const name = rawHoTen || rawBiDanh || id;
      const dept = (row.bo_mon || row.department || row.bomon || "").trim();

      const roleRaw = (row.vai_tro ?? row.assistant ?? row.tro_giang ?? "")
        .trim()
        .toLowerCase();
      const assistant =
        roleRaw === "true" ||
        roleRaw === "1" ||
        roleRaw === "x" ||
        roleRaw === "ta" ||
        roleRaw === "assistant" ||
        roleRaw === "tro_giang" ||
        roleRaw === "trợ giảng" ||
        roleRaw === "tro giang";

      const statusRaw = (row.trang_thai ?? row.active ?? "dang_day")
        .trim()
        .toLowerCase();
      const active = !(
        statusRaw === "false" ||
        statusRaw === "0" ||
        statusRaw === "off" ||
        statusRaw === "inactive" ||
        statusRaw === "nghi" ||
        statusRaw === "tam_nghi" ||
        statusRaw === "tạm nghỉ" ||
        statusRaw === "tam nghi"
      );

      if (!id) {
        errors.push(`Dòng ${idx + 2}: Thiếu mã giảng viên (ma_gv / id)`);
      } else if (!dept) {
        errors.push(`Dòng ${idx + 2}: Nhân sự '${id}' thiếu thông tin bộ môn (bo_mon)`);
      } else if (knownDeptIds.size > 0 && !knownDeptIds.has(dept)) {
        errors.push(
          `Dòng ${idx + 2}: Bộ môn '${dept}' của '${id}' chưa tồn tại trong Danh mục Bộ môn`
        );
      } else if (valid.some((t) => t.id.toLowerCase() === id.toLowerCase())) {
        errors.push(`Dòng ${idx + 2}: Trùng mã giảng viên '${id}' trong tệp CSV`);
      } else {
        const existing = teachers.find((t) => t.id === id);
        // STRICT PERMISSION BOUNDARY: NEVER read capabilities from STAFF CSV!
        valid.push({
          id,
          name,
          department: dept,
          assistant,
          active,
          capabilities: existing?.capabilities ? { ...existing.capabilities } : {},
          isUpdate: Boolean(existing),
        });
      }
    });

    setStaffImportPreview({ valid, errors });
  };

  const handleConfirmStaffCsv = async () => {
    if (!staffImportPreview || !staffImportPreview.valid.length) return;
    setSavingStaffCsv(true);
    try {
      const mergedMap = new Map<string, Teacher>();
      teachers.forEach((t) => mergedMap.set(t.id, t));
      staffImportPreview.valid.forEach(({ isUpdate: _u, ...teacherData }) => {
        mergedMap.set(teacherData.id, teacherData);
      });
      await onCommand("catalog", {
        departments,
        teachers: Array.from(mergedMap.values()),
      });
      setStaffImportPreview(null);
      setStaffCsvModalOpen(false);
    } finally {
      setSavingStaffCsv(false);
    }
  };

  // HEAD Capability CSV File Handler
  const handleHeadCapFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapFileName(file.name);
    const text = await file.text();
    setCapCsvText(text);
  };

  const handleConfirmHeadCapImport = async () => {
    if (!capCsvText.trim()) return;
    setSavingHeadCapCsv(true);
    try {
      await onCommand("capabilities-import", {
        csv_text: capCsvText,
        mode: capImportMode,
      });
      setHeadCapModalOpen(false);
      setCapCsvText("");
      setCapFileName("");
    } finally {
      setSavingHeadCapCsv(false);
    }
  };

  // Open Add Course Modal for HEAD
  const openAddCourseModal = (t: Teacher) => {
    setAddCourseModal({
      open: true,
      teacher: t,
      search: "",
      showCrossDept: false,
      customCode: "",
      selections: {},
    });
  };

  const modalCandidateCourses = useMemo(() => {
    const t = addCourseModal.teacher;
    if (!t) return [];
    const existingSet = new Set([
      ...Object.keys(t.capabilities || {}).filter(
        (c) => (t.capabilities?.[c]?.length ?? 0) > 0
      ),
      ...(emptyDraftCourses[t.id] ?? []),
    ]);
    const q = addCourseModal.search.trim().toLowerCase();
    const targetDept = headDept || t.department;

    const list = allKnownCourses.filter((c) => {
      if (existingSet.has(c)) return false;
      const depts = courseDeptMap.get(c);
      const belongsToDept = !targetDept || !depts || depts.size === 0 || depts.has(targetDept);
      if (!addCourseModal.showCrossDept && !belongsToDept && !addCourseModal.selections[c]) {
        return false;
      }
      if (!q) return true;
      const name = (courseNameMap.get(c) || "").toLowerCase();
      return c.toLowerCase().includes(q) || name.includes(q);
    });

    // Sort own-department courses first
    return list.sort((a, b) => {
      const aOwn = courseDeptMap.get(a)?.has(targetDept) ? 0 : 1;
      const bOwn = courseDeptMap.get(b)?.has(targetDept) ? 0 : 1;
      if (aOwn !== bOwn) return aOwn - bOwn;
      return a.localeCompare(b);
    });
  }, [addCourseModal, allKnownCourses, courseDeptMap, courseNameMap, emptyDraftCourses, headDept]);

  const toggleModalCourseSelect = (course: string, assistant: boolean) => {
    setAddCourseModal((prev) => {
      const next = { ...prev.selections };
      if (next[course]) {
        delete next[course];
      } else {
        next[course] = { lec: !assistant, tut: true };
      }
      return { ...prev, selections: next };
    });
  };

  const toggleModalCourseKind = (course: string, kind: "lec" | "tut", assistant: boolean) => {
    if (assistant && kind === "lec") return;
    setAddCourseModal((prev) => {
      const cur = prev.selections[course] ?? { lec: false, tut: false };
      const updated = { ...cur, [kind]: !cur[kind] };
      const next = { ...prev.selections };
      if (!updated.lec && !updated.tut) {
        delete next[course];
      } else {
        next[course] = updated;
      }
      return { ...prev, selections: next };
    });
  };

  const handleAddCustomCourseInModal = () => {
    const t = addCourseModal.teacher;
    const code = addCourseModal.customCode.trim().toUpperCase();
    if (!t || !code) return;
    setAddCourseModal((prev) => ({
      ...prev,
      customCode: "",
      selections: {
        ...prev.selections,
        [code]: { lec: !t.assistant, tut: true },
      },
    }));
  };

  const handleSaveModalCourses = async () => {
    const t = addCourseModal.teacher;
    if (!t) return;
    const entries = Object.entries(addCourseModal.selections).filter(
      ([, v]) => v.lec || v.tut
    );
    if (!entries.length) return;

    const nextCaps: Record<string, string[]> = { ...(t.capabilities || {}) };
    entries.forEach(([course, v]) => {
      const kinds: string[] = [];
      if (v.lec && !t.assistant) kinds.push("LEC");
      if (v.tut) kinds.push("TUT");
      if (kinds.length > 0) nextCaps[course] = kinds;
    });

    setSavingAddCourses(true);
    try {
      await onCommand("teacher", {
        department: headDept || t.department,
        teacher: t.id,
        assistant: t.assistant,
        active: t.active !== false,
        capabilities: nextCaps,
      });
      setAddCourseModal({
        open: false,
        teacher: null,
        search: "",
        showCrossDept: false,
        customCode: "",
        selections: {},
      });
    } finally {
      setSavingAddCourses(false);
    }
  };

  const selectedModalCount = Object.values(addCourseModal.selections).filter(
    (v) => v.lec || v.tut
  ).length;

  return (
    <>
      <Metrics
        items={[
          {
            label: "Tổng nhân sự hiển thị",
            value: `${filteredTeachers.length}/${teachers.length}`,
            detail: "Giảng viên & trợ giảng trong phạm vi",
          },
          {
            label: "Đang giảng dạy",
            value: activeCount,
            detail: `${teachers.length - activeCount} nhân sự đang tạm nghỉ`,
            tone: "text-success",
          },
          {
            label: "Trạng thái trực tuyến",
            value: `${onlineCount} Online`,
            detail: "Đang có phiên kết nối trên hệ thống",
            tone: "text-primary",
          },
          {
            label: "Đã khai báo năng lực",
            value: `${capableCount}/${teachers.length}`,
            detail: "Có ít nhất 1 học phần LEC hoặc TUT",
          },
        ]}
      />

      {/* Onboarding 1-line guide cho Trưởng bộ môn */}
      {isHead && showOnboarding && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "9px 14px",
            marginBottom: "12px",
            borderRadius: "8px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e3a8a",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <Icon name="info" size={16} />
            <span>
              <b>Quy trình 3 bước cho Trưởng bộ môn:</b> (1) Nhập nhanh từ tệp CSV năng lực hoặc bấm{" "}
              <b>&quot;+ Thêm học phần&quot;</b> · (2) Tick chọn ô <b>Lý thuyết (LEC)</b> /{" "}
              <b>Thực hành (TUT)</b> · (3) Sang mục <b>Phân công</b> để gán lớp.
            </span>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Ẩn hướng dẫn"
            onClick={() => setShowOnboarding(false)}
            style={{ width: "24px", height: "24px", minHeight: "24px" }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      <section className="card">
        {/* Thanh công cụ vai trò & Bộ lọc tích hợp gọn gàng, không lặp tiêu đề trang */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            paddingBottom: "12px",
            marginBottom: "12px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <Icon name="users" size={17} />
            <b style={{ fontSize: "14px", color: "var(--ink)" }}>
              Bảng Nhân sự &amp; Năng lực Học phần ({filteredTeachers.length})
            </b>
            {isStaff && (
              <span className="badge neutral" title="Giáo vụ quản lý danh sách nhân sự; Trưởng bộ môn cập nhật năng lực LEC/TUT">
                Chế độ Giáo vụ: Chỉ xem năng lực LEC/TUT
              </span>
            )}
            {isHead && !showOnboarding && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowOnboarding(true)}
                style={{ minHeight: "26px", padding: "2px 8px", fontSize: "11px" }}
              >
                Hiện hướng dẫn nhanh
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {isStaff && (
              <>
                <ActionButton
                  type="button"
                  icon="upload"
                  disabled={busy}
                  onClick={() => {
                    setStaffImportPreview(null);
                    setStaffCsvModalOpen(true);
                  }}
                  style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}
                >
                  Nhập nhân sự (.csv)
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="primary"
                  icon="plus"
                  disabled={busy || !departments.length}
                  onClick={() =>
                    setTeacherModal({
                      open: true,
                      isEdit: false,
                      id: "",
                      name: "",
                      department: deptFilter || departments[0]?.id || "",
                      assistant: false,
                      active: true,
                    })
                  }
                  style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}
                >
                  Thêm nhân sự
                </ActionButton>
              </>
            )}

            {isHead && (
              <>
                <a
                  href="/templates/nang-luc-bo-mon-mau.csv"
                  download="nang-luc-bo-mon-mau.csv"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "34px",
                    padding: "0 12px",
                    borderRadius: "7px",
                    background: "#eff6ff",
                    border: "1px solid #93c5fd",
                    color: "#1d4ed8",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <Icon name="download" size={14} />
                  <span>Tải mẫu CSV năng lực</span>
                </a>
                <ActionButton
                  type="button"
                  variant="primary"
                  icon="upload"
                  disabled={busy}
                  onClick={() => {
                    setCapCsvText("");
                    setCapFileName("");
                    setCapImportMode("merge");
                    setHeadCapModalOpen(true);
                  }}
                  style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}
                >
                  Nhập năng lực (.csv)
                </ActionButton>
              </>
            )}
          </div>
        </div>

        {/* Bộ lọc danh sách Nhân Sự */}
        <div
          className="filters"
          style={{ flexWrap: "wrap", gap: "10px", marginBottom: "14px", alignItems: "flex-end" }}
        >
          <label style={{ flex: 2, minWidth: "220px" }}>
            Tìm mã GV, họ tên hoặc học phần
            <input
              type="search"
              placeholder="VD: KhoaTN, Nguyễn Văn A, 61FIT3SS1, Trí tuệ nhân tạo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {!isHead && (
            <label style={{ flex: 1, minWidth: "155px" }}>
              Bộ môn
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="">Tất cả bộ môn ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} — {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label style={{ flex: 1, minWidth: "155px" }}>
            Trạng thái giảng dạy
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang dạy</option>
              <option value="inactive">Tạm nghỉ</option>
            </select>
          </label>
          <label style={{ flex: 1.3, minWidth: "190px" }}>
            Lọc theo học phần phụ trách
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
              <option value="">Tất cả học phần ({filterableCourses.length})</option>
              {filterableCourses.map((c) => (
                <option key={c} value={c}>
                  {formatCourseLabel(c)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!filteredTeachers.length ? (
          <EmptyState title="Không tìm thấy nhân sự phù hợp">
            Thử xóa bộ lọc tìm kiếm hoặc kiểm tra lại điều kiện lọc hiện tại.
          </EmptyState>
        ) : (
          <div className="table-wrap table-scroll" style={{ maxHeight: "620px" }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "175px" }}>Nhân sự</th>
                  <th style={{ width: "185px" }}>Bộ môn &amp; Vai trò</th>
                  <th style={{ width: "190px" }}>Trạng thái &amp; Phiên</th>
                  <th style={{ width: "100px" }}>Khối lượng</th>
                  <th>Môn phụ trách &amp; Năng lực (LEC / TUT)</th>
                  {isStaff && <th style={{ width: "125px", textAlign: "right" }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => {
                  const isAct = t.active !== false;
                  const isOnline = onlineSet.has(t.id);
                  const load = teacherLoad(t.id);
                  const classCount = sessions.filter((s) => s.teacher === t.id).length;
                  const hasDistinctName = Boolean(
                    t.name && t.name.trim() && t.name.trim() !== t.id.trim()
                  );
                  const canEditRowMeta =
                    isStaff || (isHead && (!headDept || t.department === headDept));

                  const persistedCourses = Object.keys(t.capabilities || {}).filter(
                    (c) => (t.capabilities?.[c]?.length ?? 0) > 0
                  );
                  const draftEmptyList = isHead ? emptyDraftCourses[t.id] ?? [] : [];
                  const displayedCourses = Array.from(
                    new Set([...persistedCourses, ...draftEmptyList])
                  ).sort();

                  return (
                    <tr
                      key={t.id}
                      style={{
                        opacity: isAct ? 1 : 0.7,
                        background: isAct ? undefined : "#f8fafc",
                      }}
                    >
                      {/* Cột 1: Mã & Họ tên (không lặp lại BachNG / BachNG) */}
                      <td>
                        <b style={{ fontSize: "12.5px", color: "#0f172a" }}>{t.id}</b>
                        <small
                          style={{
                            display: "block",
                            marginTop: "2px",
                            fontWeight: hasDistinctName ? 500 : 400,
                            color: hasDistinctName ? "#334155" : "#94a3b8",
                          }}
                        >
                          {hasDistinctName ? t.name : "Mã giảng viên"}
                        </small>
                      </td>

                      {/* Cột 2: Bộ môn (chữ tĩnh) + Vai trò (Segmented GV | Trợ giảng) */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-start" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#475569",
                              letterSpacing: "0.2px",
                            }}
                          >
                            Bộ môn {t.department}
                          </span>

                          {canEditRowMeta ? (
                            <div
                              className="role-segmented"
                              role="group"
                              aria-label={`Vai trò của ${t.id}`}
                            >
                              <button
                                type="button"
                                className={!t.assistant ? "active" : ""}
                                disabled={busy || rowPending === `role-${t.id}`}
                                onClick={() => void setTeacherRole(t, false)}
                              >
                                GV
                              </button>
                              <button
                                type="button"
                                className={t.assistant ? "active is-ta" : ""}
                                disabled={busy || rowPending === `role-${t.id}`}
                                onClick={() => void setTeacherRole(t, true)}
                              >
                                Trợ giảng
                              </button>
                              {rowPending === `role-${t.id}` && (
                                <span style={{ display: "inline-grid", placeItems: "center", padding: "0 4px" }}>
                                  <Spinner size={11} />
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                              {t.assistant ? "Trợ giảng" : "Giảng viên"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Toggle Switch Đang dạy / Tạm nghỉ + Chấm Online/Offline tĩnh */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isAct}
                            aria-label={`Trạng thái giảng dạy của ${t.id}`}
                            className="switch-toggle"
                            disabled={busy || !canEditRowMeta || rowPending === `active-${t.id}`}
                            onClick={() => void toggleActive(t)}
                          >
                            <span className="switch-track">
                              <span className="switch-thumb" />
                            </span>
                            <span>{isAct ? "Đang dạy" : "Tạm nghỉ"}</span>
                            {rowPending === `active-${t.id}` && <Spinner size={12} />}
                          </button>

                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "11px",
                              color: isOnline ? "#15803d" : "#64748b",
                              fontWeight: isOnline ? 600 : 400,
                              paddingLeft: "3px",
                            }}
                          >
                            <span
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                background: isOnline ? "#22c55e" : "#cbd5e1",
                              }}
                            />
                            <span>{isOnline ? "Trực tuyến" : "Ngoại tuyến"}</span>
                          </span>
                        </div>
                      </td>

                      {/* Cột 4: Khối lượng */}
                      <td>
                        <b>{load}</b> <small style={{ display: "inline" }}>tiết/tuần</small>
                        <small style={{ display: "block", color: "var(--muted)" }}>
                          {classCount} lớp phụ trách
                        </small>
                      </td>

                      {/* Cột 5: Môn phụ trách & Năng lực (LEC / TUT) */}
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "8px" }}>
                          {/* STAFF khi GV chưa khai báo môn nào: hiển thị rõ ranh giới quyền hạn */}
                          {isStaff && displayedCourses.length === 0 && (
                            <div
                              className="cap-card"
                              style={{ background: "#f8fafc", borderStyle: "dashed" }}
                              title="Giáo vụ không được phép chỉnh sửa năng lực — Chỉ Trưởng bộ môn thực hiện"
                            >
                              <small style={{ color: "#64748b", fontWeight: 500 }}>
                                Chưa khai báo môn (Chỉ Trưởng bộ môn cập nhật)
                              </small>
                              <div className="cap-checks-row">
                                <label
                                  className="cap-check is-disabled"
                                  title="Giáo vụ không được phép chỉnh sửa năng lực — Chỉ Trưởng bộ môn thực hiện"
                                >
                                  <input type="checkbox" disabled checked={false} readOnly />
                                  <span>Lý thuyết (LEC)</span>
                                </label>
                                <label
                                  className="cap-check is-disabled"
                                  title="Giáo vụ không được phép chỉnh sửa năng lực — Chỉ Trưởng bộ môn thực hiện"
                                >
                                  <input type="checkbox" disabled checked={false} readOnly />
                                  <span>Thực hành (TUT)</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {displayedCourses.map((course) => {
                            const isEmptyDraft = draftEmptyList.includes(course);
                            const kinds = isEmptyDraft ? [] : t.capabilities?.[course] ?? [];
                            const hasLec = kinds.includes("LEC");
                            const hasTut = kinds.includes("TUT");
                            const cName = courseNameMap.get(course);
                            const isHighlighted = courseFilter === course;
                            const isSavingCourse =
                              rowPending === `cap-${t.id}-${course}` ||
                              rowPending === `rm-${t.id}-${course}`;

                            return (
                              <div
                                key={course}
                                className={`cap-card ${isEmptyDraft ? "is-draft-empty" : ""}`}
                                style={
                                  isHighlighted && !isEmptyDraft
                                    ? { borderColor: "#60a5fa", background: "#f8fbff" }
                                    : undefined
                                }
                              >
                                <div className="cap-card-head">
                                  <div
                                    className="cap-card-title"
                                    title={cName ? `${course} — ${cName}` : course}
                                  >
                                    {course}
                                    {cName ? <span> — {cName}</span> : null}
                                  </div>

                                  {isHead && (
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                      {isSavingCourse && <Spinner size={12} />}
                                      <button
                                        type="button"
                                        className="cap-remove-btn"
                                        disabled={busy || isSavingCourse}
                                        onClick={() => void removeCourseFromTeacher(t, course)}
                                        title={`Gỡ môn ${course}`}
                                        aria-label={`Gỡ môn ${course}`}
                                      >
                                        <Icon name="x" size={13} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {isStaff ? (
                                  <div className="cap-checks-row">
                                    <label
                                      className="cap-check is-disabled"
                                      title="Giáo vụ không được phép chỉnh sửa năng lực — Chỉ Trưởng bộ môn thực hiện"
                                    >
                                      <input type="checkbox" disabled checked={hasLec} readOnly />
                                      <span>Lý thuyết (LEC)</span>
                                    </label>
                                    <label
                                      className="cap-check is-disabled"
                                      title="Giáo vụ không được phép chỉnh sửa năng lực — Chỉ Trưởng bộ môn thực hiện"
                                    >
                                      <input type="checkbox" disabled checked={hasTut} readOnly />
                                      <span>Thực hành (TUT)</span>
                                    </label>
                                  </div>
                                ) : (
                                  <>
                                    <div className="cap-checks-row">
                                      <label
                                        className={`cap-check ${
                                          t.assistant
                                            ? "is-disabled"
                                            : hasLec
                                            ? "is-checked-lec"
                                            : ""
                                        }`}
                                        title={
                                          t.assistant
                                            ? "Trợ giảng chỉ dạy Thực hành"
                                            : `Tick dạy Lý thuyết (LEC) môn ${course}`
                                        }
                                      >
                                        <input
                                          type="checkbox"
                                          disabled={busy || isSavingCourse || t.assistant}
                                          checked={t.assistant ? false : hasLec}
                                          onChange={() => void toggleCapability(t, course, "LEC")}
                                        />
                                        <span>Lý thuyết (LEC)</span>
                                      </label>

                                      <label
                                        className={`cap-check ${hasTut ? "is-checked-tut" : ""}`}
                                        title={`Tick dạy Thực hành (TUT) môn ${course}`}
                                      >
                                        <input
                                          type="checkbox"
                                          disabled={busy || isSavingCourse}
                                          checked={hasTut}
                                          onChange={() => void toggleCapability(t, course, "TUT")}
                                        />
                                        <span>Thực hành (TUT)</span>
                                      </label>
                                    </div>
                                    {isEmptyDraft && (
                                      <small
                                        style={{
                                          color: "#b45309",
                                          fontWeight: 600,
                                          fontSize: "10.5px",
                                          lineHeight: 1.35,
                                        }}
                                      >
                                        Chọn LEC hoặc TUT để lưu, hoặc bấm × để gỡ môn
                                      </small>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}

                          {isHead && (
                            <ActionButton
                              type="button"
                              icon="plus"
                              disabled={busy}
                              onClick={() => openAddCourseModal(t)}
                              style={{
                                minHeight: "32px",
                                padding: "4px 10px",
                                fontSize: "11.5px",
                                borderStyle: "dashed",
                                background: "#f8fafc",
                                color: "#1d4ed8",
                                borderColor: "#93c5fd",
                              }}
                            >
                              Thêm học phần
                            </ActionButton>
                          )}
                        </div>
                      </td>

                      {isStaff && (
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <ActionButton
                            type="button"
                            icon="edit"
                            disabled={busy}
                            onClick={() =>
                              setTeacherModal({
                                open: true,
                                isEdit: true,
                                id: t.id,
                                name: t.name || t.id,
                                department: t.department,
                                assistant: t.assistant,
                                active: t.active !== false,
                              })
                            }
                            style={{
                              minHeight: "28px",
                              padding: "3px 8px",
                              fontSize: "11.5px",
                              marginRight: "5px",
                            }}
                          >
                            Sửa
                          </ActionButton>
                          <ActionButton
                            type="button"
                            variant="danger"
                            icon="trash"
                            loading={rowPending === `del-${t.id}`}
                            disabled={busy}
                            onClick={() => void handleDeleteTeacher(t.id)}
                            style={{
                              minHeight: "28px",
                              padding: "3px 8px",
                              fontSize: "11.5px",
                            }}
                          >
                            Xóa
                          </ActionButton>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL 1: Thêm / Chỉnh sửa Nhân sự (STAFF) */}
      {teacherModal.open && isStaff && (
        <div
          className="modal-overlay"
          onClick={() => !savingTeacherModal && setTeacherModal({ ...teacherModal, open: false })}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{teacherModal.isEdit ? "Chỉnh sửa hồ sơ Nhân sự" : "Thêm Nhân sự mới"}</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Đóng"
                disabled={savingTeacherModal}
                onClick={() => setTeacherModal({ ...teacherModal, open: false })}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveTeacherModal();
              }}
            >
              <label>
                Mã giảng viên (VD: ThaoDTP, KhoaTN)
                <input
                  required
                  disabled={teacherModal.isEdit}
                  value={teacherModal.id}
                  onChange={(e) => setTeacherModal({ ...teacherModal, id: e.target.value })}
                  placeholder="Mã định danh giảng viên"
                />
              </label>
              <label>
                Họ và tên giảng viên
                <input
                  required
                  value={teacherModal.name}
                  onChange={(e) => setTeacherModal({ ...teacherModal, name: e.target.value })}
                  placeholder="Họ và tên đầy đủ"
                />
              </label>
              <label>
                Thuộc bộ môn
                <select
                  required
                  value={teacherModal.department}
                  onChange={(e) =>
                    setTeacherModal({ ...teacherModal, department: e.target.value })
                  }
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} — {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  checked={teacherModal.assistant}
                  onChange={(e) =>
                    setTeacherModal({ ...teacherModal, assistant: e.target.checked })
                  }
                />
                <span>Trợ giảng (chỉ phụ trách tiết Thực hành TUT)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  checked={teacherModal.active}
                  onChange={(e) =>
                    setTeacherModal({ ...teacherModal, active: e.target.checked })
                  }
                />
                <span>Đang hoạt động giảng dạy tại khoa</span>
              </label>
              <div className="actions" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="button"
                  disabled={savingTeacherModal}
                  onClick={() => setTeacherModal({ ...teacherModal, open: false })}
                >
                  Hủy
                </button>
                <ActionButton
                  variant="primary"
                  type="submit"
                  icon="check"
                  loading={savingTeacherModal}
                  loadingLabel="Đang lưu..."
                >
                  {teacherModal.isEdit ? "Cập nhật nhân sự" : "Thêm nhân sự"}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Nhập danh sách Nhân sự từ CSV chuẩn cho Giáo vụ (STAFF) */}
      {staffCsvModalOpen && isStaff && (
        <div
          className="modal-overlay"
          onClick={() => !savingStaffCsv && setStaffCsvModalOpen(false)}
        >
          <div
            className="modal-card"
            style={{ maxWidth: "740px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Nhập danh sách Nhân sự từ CSV (Giáo vụ)</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Đóng"
                disabled={savingStaffCsv}
                onClick={() => setStaffCsvModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "10px",
              }}
            >
              <p style={{ margin: 0, fontSize: "12px" }}>
                Hỗ trợ chuẩn RFC-4180 UTF-8: bảng chuẩn <code>ma_gv, ho_ten, bo_mon, vai_tro, trang_thai</code> hoặc trực tiếp tệp <code>giang_vien.csv</code>. Năng lực giảng dạy hiện có được bảo toàn nguyên vẹn.
              </p>
              <a
                href="/templates/nhan-su-mau.csv"
                download="nhan-su-mau.csv"
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
                <Icon name="download" size={14} />
                <span>Tải mẫu nhan-su-mau.csv</span>
              </a>
            </div>

            {/* Bảng cấu trúc cột mẫu */}
            <div
              className="table-wrap"
              style={{
                marginBottom: "12px",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                fontSize: "11.5px",
              }}
            >
              <table>
                <thead>
                  <tr>
                    <th>ma_gv</th>
                    <th>ho_ten</th>
                    <th>bo_mon</th>
                    <th>vai_tro</th>
                    <th>trang_thai</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>KhoaTN</b></td>
                    <td>Trần Ngọc Khoa</td>
                    <td>KHMT</td>
                    <td>GIANG_VIEN</td>
                    <td>DANG_DAY</td>
                  </tr>
                  <tr>
                    <td><b>LinhNT</b></td>
                    <td>Nguyễn Thùy Linh</td>
                    <td>CNPM</td>
                    <td>TRO_GIANG</td>
                    <td>DANG_DAY</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <label style={{ margin: "0 0 12px" }}>
              Chọn tệp CSV nhân sự (.csv)
              <input
                type="file"
                accept=".csv"
                disabled={savingStaffCsv}
                onChange={(e) => void handleStaffCsvFile(e)}
              />
            </label>

            {staffImportPreview && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: "8px",
                  }}
                >
                  <span className="badge success">
                    {staffImportPreview.valid.length} nhân sự hợp lệ
                  </span>
                  {staffImportPreview.errors.length > 0 && (
                    <span className="badge danger">
                      {staffImportPreview.errors.length} dòng lỗi
                    </span>
                  )}
                </div>

                {staffImportPreview.errors.length > 0 && (
                  <div className="notice error" style={{ margin: "8px 0" }}>
                    <b>Các dòng không hợp lệ:</b>
                    {staffImportPreview.errors.slice(0, 5).map((err, i) => (
                      <span key={i}>- {err}</span>
                    ))}
                    {staffImportPreview.errors.length > 5 && (
                      <span>... và {staffImportPreview.errors.length - 5} dòng khác</span>
                    )}
                  </div>
                )}

                {staffImportPreview.valid.length > 0 && (
                  <div
                    className="table-wrap table-scroll"
                    style={{ maxHeight: "220px", marginBottom: "12px" }}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Mã GV</th>
                          <th>Họ và tên</th>
                          <th>Bộ môn</th>
                          <th>Vai trò</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffImportPreview.valid.map((item) => (
                          <tr key={item.id}>
                            <td><b>{item.id}</b></td>
                            <td>{item.name}</td>
                            <td>{item.department}</td>
                            <td>{item.assistant ? "Trợ giảng" : "Giảng viên"}</td>
                            <td>
                              <span className={"badge " + (item.active !== false ? "success" : "neutral")}>
                                {item.active !== false ? "Đang dạy" : "Tạm nghỉ"}
                              </span>
                            </td>
                            <td>
                              <span className="badge neutral">
                                {item.isUpdate ? "Cập nhật hồ sơ" : "Thêm mới"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="actions" style={{ justifyContent: "flex-end", marginBottom: 0 }}>
                  <button
                    type="button"
                    disabled={savingStaffCsv}
                    onClick={() => setStaffCsvModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <ActionButton
                    type="button"
                    variant="primary"
                    icon="check"
                    loading={savingStaffCsv}
                    loadingLabel="Đang nhập..."
                    disabled={!staffImportPreview.valid.length}
                    onClick={() => void handleConfirmStaffCsv()}
                  >
                    Xác nhận nhập {staffImportPreview.valid.length} nhân sự
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Nhập năng lực giảng viên từ CSV cho Trưởng bộ môn (HEAD) */}
      {headCapModalOpen && isHead && (
        <div
          className="modal-overlay"
          onClick={() => !savingHeadCapCsv && setHeadCapModalOpen(false)}
        >
          <div
            className="modal-card"
            style={{ maxWidth: "740px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Nhập năng lực giảng dạy từ CSV — Bộ môn {headDept}</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Đóng"
                disabled={savingHeadCapCsv}
                onClick={() => setHeadCapModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "12px",
                fontSize: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: "240px" }}>
                Bạn có thể tải lên trực tiếp tệp <code>resources/nang_luc_giang_vien.csv</code> toàn khoa hoặc tệp mẫu của bộ môn. Hệ thống tự động lọc riêng các giảng viên thuộc <b>Bộ môn {headDept}</b> và bỏ qua bộ môn khác.
              </div>
              <a
                href="/templates/nang-luc-bo-mon-mau.csv"
                download="nang-luc-bo-mon-mau.csv"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 11px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  border: "1px solid #93c5fd",
                  color: "#1d4ed8",
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name="download" size={14} />
                <span>Tải mẫu CSV năng lực</span>
              </a>
            </div>

            <fieldset style={{ margin: "0 0 12px", padding: "10px 14px" }}>
              <legend>Chế độ áp dụng dữ liệu</legend>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <label style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="cap-import-mode"
                    checked={capImportMode === "merge"}
                    onChange={() => setCapImportMode("merge")}
                  />
                  <span>Gộp thêm vào năng lực hiện có (Khuyên dùng)</span>
                </label>
                <label style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="cap-import-mode"
                    checked={capImportMode === "replace"}
                    onChange={() => setCapImportMode("replace")}
                  />
                  <span>Thay thế toàn bộ năng lực bộ môn {headDept}</span>
                </label>
              </div>
            </fieldset>

            <label style={{ margin: "0 0 12px" }}>
              Chọn tệp CSV năng lực (.csv) {capFileName ? `— ${capFileName}` : ""}
              <input
                type="file"
                accept=".csv"
                disabled={savingHeadCapCsv}
                onChange={(e) => void handleHeadCapFile(e)}
              />
            </label>

            {headCapPreview && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span className="badge success">
                    Khớp {headCapPreview.matchedItems.length} dòng ({headCapPreview.distinctTeachers} GV bộ môn {headDept})
                  </span>
                  {headCapPreview.skippedOtherDeptCount > 0 && (
                    <span className="badge neutral">
                      Tự động bỏ qua {headCapPreview.skippedOtherDeptCount} dòng thuộc bộ môn khác
                    </span>
                  )}
                  {headCapPreview.assistantStrippedCount > 0 && (
                    <span className="badge warning">
                      Đã lược bỏ LEC ở {headCapPreview.assistantStrippedCount} dòng của Trợ giảng
                    </span>
                  )}
                </div>

                {headCapPreview.matchedItems.length > 0 && (
                  <div
                    className="table-wrap table-scroll"
                    style={{ maxHeight: "220px", marginBottom: "12px" }}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Giảng viên</th>
                          <th>Học phần</th>
                          <th>Năng lực áp dụng</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {headCapPreview.matchedItems.slice(0, 80).map((item, idx) => (
                          <tr key={`${item.teacherId}-${item.course}-${idx}`}>
                            <td>
                              <b>{item.teacherId}</b>
                              {item.teacherName !== item.teacherId && (
                                <small>{item.teacherName}</small>
                              )}
                            </td>
                            <td>{formatCourseLabel(item.course)}</td>
                            <td>
                              <div style={{ display: "flex", gap: "5px" }}>
                                {item.kinds.map((k) => (
                                  <span
                                    key={k}
                                    className={"badge " + (k === "LEC" ? "neutral" : "success")}
                                  >
                                    {k}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              {item.strippedLec ? (
                                <span className="badge warning">Trợ giảng: chỉ giữ TUT</span>
                              ) : (
                                <span style={{ color: "var(--muted)", fontSize: "11px" }}>Hợp lệ</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="actions" style={{ justifyContent: "flex-end", marginBottom: 0 }}>
              <button
                type="button"
                disabled={savingHeadCapCsv}
                onClick={() => setHeadCapModalOpen(false)}
              >
                Hủy
              </button>
              <ActionButton
                type="button"
                variant="primary"
                icon="check"
                loading={savingHeadCapCsv}
                loadingLabel="Đang áp dụng..."
                disabled={!capCsvText.trim() || (headCapPreview?.matchedItems.length ?? 0) === 0}
                onClick={() => void handleConfirmHeadCapImport()}
              >
                Áp dụng năng lực
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Thêm học phần phụ trách cho Giảng viên (thay thế triệt để dropdown tràn màn hình) */}
      {addCourseModal.open && isHead && addCourseModal.teacher && (
        <div
          className="modal-overlay"
          onClick={() =>
            !savingAddCourses && setAddCourseModal({ ...addCourseModal, open: false })
          }
        >
          <div
            className="modal-card"
            style={{ maxWidth: "660px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Thêm học phần phụ trách cho{" "}
                {addCourseModal.teacher.name &&
                addCourseModal.teacher.name !== addCourseModal.teacher.id
                  ? `${addCourseModal.teacher.name} (${addCourseModal.teacher.id})`
                  : addCourseModal.teacher.id}
              </h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Đóng"
                disabled={savingAddCourses}
                onClick={() => setAddCourseModal({ ...addCourseModal, open: false })}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {addCourseModal.teacher.assistant && (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                  borderRadius: "7px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  marginBottom: "10px",
                }}
              >
                Nhân sự này là <b>Trợ giảng</b> — chỉ được phân công dạy <b>Thực hành (TUT)</b>.
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "10px",
              }}
            >
              <input
                type="search"
                value={addCourseModal.search}
                onChange={(e) =>
                  setAddCourseModal({ ...addCourseModal, search: e.target.value })
                }
                placeholder="Tìm theo mã môn hoặc tên học phần..."
                style={{ flex: 1, minWidth: "220px", height: "38px", minHeight: "38px" }}
              />
              <label
                style={{
                  margin: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={addCourseModal.showCrossDept}
                  onChange={(e) =>
                    setAddCourseModal({ ...addCourseModal, showCrossDept: e.target.checked })
                  }
                />
                <span>Hiển thị thêm học phần bộ môn khác</span>
              </label>
            </div>

            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                background: "#fafbfd",
                marginBottom: "12px",
              }}
            >
              {modalCandidateCourses.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: "12.5px" }}>
                  Không tìm thấy học phần nào chưa gán. Bạn có thể bật &quot;Hiển thị thêm học phần bộ môn khác&quot; hoặc nhập mã môn bên dưới.
                </div>
              ) : (
                modalCandidateCourses.map((course) => {
                  const sel = addCourseModal.selections[course];
                  const isSelected = Boolean(sel && (sel.lec || sel.tut));
                  const depts = Array.from(courseDeptMap.get(course) ?? []);
                  const assistant = addCourseModal.teacher!.assistant;

                  return (
                    <div
                      key={course}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        padding: "9px 12px",
                        borderBottom: "1px solid #edf2f7",
                        background: isSelected ? "#eff6ff" : "#ffffff",
                        flexWrap: "wrap",
                      }}
                    >
                      <label
                        style={{
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flex: 1,
                          minWidth: "200px",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleModalCourseSelect(course, assistant)}
                        />
                        <span>
                          <b>{course}</b>
                          {courseNameMap.get(course) ? ` — ${courseNameMap.get(course)}` : ""}
                        </span>
                        {depts.length > 0 && (
                          <span className="badge neutral" style={{ fontSize: "10px" }}>
                            {depts.join(", ")}
                          </span>
                        )}
                      </label>

                      <div className="cap-checks-row">
                        <label
                          className={`cap-check ${
                            assistant ? "is-disabled" : sel?.lec ? "is-checked-lec" : ""
                          }`}
                          title={assistant ? "Trợ giảng chỉ dạy Thực hành" : undefined}
                        >
                          <input
                            type="checkbox"
                            disabled={assistant}
                            checked={assistant ? false : Boolean(sel?.lec)}
                            onChange={() => toggleModalCourseKind(course, "lec", assistant)}
                          />
                          <span>Lý thuyết (LEC)</span>
                        </label>
                        <label className={`cap-check ${sel?.tut ? "is-checked-tut" : ""}`}>
                          <input
                            type="checkbox"
                            checked={Boolean(sel?.tut)}
                            onChange={() => toggleModalCourseKind(course, "tut", assistant)}
                          />
                          <span>Thực hành (TUT)</span>
                        </label>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Nhập mã học phần tùy chỉnh nếu chưa có trong danh mục */}
            <div className="editor-row" style={{ marginBottom: "12px" }}>
              <label style={{ flex: 2 }}>
                <span>Hoặc thêm nhanh mã học phần mới ngoài danh sách</span>
                <input
                  value={addCourseModal.customCode}
                  onChange={(e) =>
                    setAddCourseModal({
                      ...addCourseModal,
                      customCode: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="VD: 61FIT4NLP"
                />
              </label>
              <ActionButton
                type="button"
                icon="plus"
                disabled={!addCourseModal.customCode.trim()}
                onClick={handleAddCustomCourseInModal}
              >
                Chọn mã này
              </ActionButton>
            </div>

            <div
              className="actions"
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
                marginBottom: 0,
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
                Đã chọn {selectedModalCount} học phần
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={savingAddCourses}
                  onClick={() => setAddCourseModal({ ...addCourseModal, open: false })}
                >
                  Hủy
                </button>
                <ActionButton
                  type="button"
                  variant="primary"
                  icon="check"
                  loading={savingAddCourses}
                  loadingLabel="Đang lưu..."
                  disabled={selectedModalCount === 0}
                  onClick={() => void handleSaveModalCourses()}
                >
                  Lưu học phần đã chọn ({selectedModalCount})
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
