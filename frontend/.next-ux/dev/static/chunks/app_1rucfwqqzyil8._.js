(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/editors.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CapabilitiesEditor",
    ()=>CapabilitiesEditor,
    "CatalogEditor",
    ()=>CatalogEditor,
    "ConfigEditor",
    ()=>ConfigEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const time = (m)=>String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const minutes = (s)=>{
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
};
function CatalogEditor({ disabled, onSave, initialDepartments, initialTeachers }) {
    _s();
    const [departments, setDepartments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialDepartments);
    const [teachers, setTeachers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialTeachers);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Danh mục bộ môn & giảng viên"
            }, void 0, false, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 11,
                columnNumber: 35
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Nhập mã định danh chính xác. Danh mục khóa sau khi nhập kế hoạch."
            }, void 0, false, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 11,
                columnNumber: 72
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                disabled: disabled,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                        children: "Bộ môn"
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 12,
                        columnNumber: 32
                    }, this),
                    departments.map((d, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Mã bộ môn",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            required: true,
                                            value: d.id,
                                            onChange: (e)=>setDepartments(departments.map((x, j)=>j === i ? {
                                                        ...x,
                                                        id: e.target.value
                                                    } : x))
                                        }, void 0, false, {
                                            fileName: "[project]/app/editors.tsx",
                                            lineNumber: 12,
                                            columnNumber: 131
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 12,
                                    columnNumber: 115
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Tên bộ môn",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: d.name,
                                            onChange: (e)=>setDepartments(departments.map((x, j)=>j === i ? {
                                                        ...x,
                                                        name: e.target.value
                                                    } : x))
                                        }, void 0, false, {
                                            fileName: "[project]/app/editors.tsx",
                                            lineNumber: 12,
                                            columnNumber: 273
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 12,
                                    columnNumber: 256
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setDepartments(departments.filter((_, j)=>i !== j)),
                                    children: "Bỏ"
                                }, void 0, false, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 12,
                                    columnNumber: 393
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/app/editors.tsx",
                            lineNumber: 12,
                            columnNumber: 79
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setDepartments([
                                ...departments,
                                {
                                    id: "",
                                    name: ""
                                }
                            ]),
                        children: "Thêm bộ môn"
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 12,
                        columnNumber: 483
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 12,
                columnNumber: 2
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                disabled: disabled,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                        children: "Giảng viên"
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 13,
                        columnNumber: 32
                    }, this),
                    teachers.map((t, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Mã GV",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: t.id,
                                            onChange: (e)=>setTeachers(teachers.map((x, j)=>j === i ? {
                                                        ...x,
                                                        id: e.target.value
                                                    } : x))
                                        }, void 0, false, {
                                            fileName: "[project]/app/editors.tsx",
                                            lineNumber: 13,
                                            columnNumber: 128
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 13,
                                    columnNumber: 116
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Họ tên",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: t.name,
                                            onChange: (e)=>setTeachers(teachers.map((x, j)=>j === i ? {
                                                        ...x,
                                                        name: e.target.value
                                                    } : x))
                                        }, void 0, false, {
                                            fileName: "[project]/app/editors.tsx",
                                            lineNumber: 13,
                                            columnNumber: 251
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 13,
                                    columnNumber: 238
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Bộ môn",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: t.department,
                                            onChange: (e)=>setTeachers(teachers.map((x, j)=>j === i ? {
                                                        ...x,
                                                        department: e.target.value
                                                    } : x)),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "Chọn"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/editors.tsx",
                                                    lineNumber: 13,
                                                    columnNumber: 496
                                                }, this),
                                                departments.map((d, j)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: d.id,
                                                        children: d.name || d.id
                                                    }, j, false, {
                                                        fileName: "[project]/app/editors.tsx",
                                                        lineNumber: 13,
                                                        columnNumber: 550
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/editors.tsx",
                                            lineNumber: 13,
                                            columnNumber: 378
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 13,
                                    columnNumber: 365
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setTeachers(teachers.filter((_, j)=>i !== j)),
                                    children: "Bỏ"
                                }, void 0, false, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 13,
                                    columnNumber: 621
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/app/editors.tsx",
                            lineNumber: 13,
                            columnNumber: 80
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setTeachers([
                                ...teachers,
                                {
                                    id: "",
                                    name: "",
                                    department: "",
                                    assistant: false,
                                    capabilities: {}
                                }
                            ]),
                        children: "Thêm giảng viên"
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 13,
                        columnNumber: 705
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 13,
                columnNumber: 2
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "primary",
                disabled: disabled || !departments.length || departments.some((d)=>!d.id.trim()) || teachers.some((t)=>!t.id.trim() || !t.department),
                onClick: ()=>onSave({
                        departments,
                        teachers
                    }),
                children: "Lưu danh mục"
            }, void 0, false, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 14,
                columnNumber: 2
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/editors.tsx",
        lineNumber: 11,
        columnNumber: 9
    }, this);
}
_s(CatalogEditor, "RxmQc+hw/LsTd3eWOI8KXdDVVDU=");
_c = CatalogEditor;
function ConfigEditor({ value, onChange, onSave, disabled }) {
    const config = value ? JSON.parse(value) : {
        period_minutes: 50,
        break_minutes: 10,
        max_periods: 8,
        rooms: {
            PROJECTOR: 10,
            COMPUTER: 5
        },
        slots: []
    };
    const update = (c)=>onChange(JSON.stringify(c));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Khung giờ & quy định"
            }, void 0, false, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 19,
                columnNumber: 35
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                disabled: disabled,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                        children: "Thời lượng & giới hạn"
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 19,
                        columnNumber: 94
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-row",
                        children: [
                            "period_minutes",
                            "break_minutes",
                            "max_periods"
                        ].map((key, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    [
                                        "Phút mỗi tiết",
                                        "Phút nghỉ giữa tiết",
                                        "Trần tiết/ngày"
                                    ][i],
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        min: key === "break_minutes" ? 0 : 1,
                                        max: key === "max_periods" ? 8 : 120,
                                        value: config[key],
                                        onChange: (e)=>update({
                                                ...config,
                                                [key]: Number(e.target.value)
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/app/editors.tsx",
                                        lineNumber: 19,
                                        columnNumber: 312
                                    }, this)
                                ]
                            }, key, true, {
                                fileName: "[project]/app/editors.tsx",
                                lineNumber: 19,
                                columnNumber: 234
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 19,
                        columnNumber: 132
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Phòng cụ thể và điều kiện sử dụng được quản lý tại mục Phòng học. Sức chứa, thiết bị và khả dụng là ràng buộc bắt buộc. Trần tiết/ngày là ưu tiên mềm."
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 19,
                        columnNumber: 497
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 19,
                columnNumber: 64
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                disabled: disabled,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                        children: "Khung có thể xếp lớp"
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 20,
                        columnNumber: 32
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Mỗi khung cho phép bắt đầu lớp tại giờ đã chọn; kết thúc là giới hạn buổi học."
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 20,
                        columnNumber: 69
                    }, this),
                    config.slots.map((slot, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Thứ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: slot.day,
                                            onChange: (e)=>update({
                                                    ...config,
                                                    slots: config.slots.map((x, j)=>j === i ? {
                                                            ...x,
                                                            day: Number(e.target.value)
                                                        } : x)
                                                }),
                                            children: Array.from({
                                                length: 7
                                            }, (_, j)=>j + 2).map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: d,
                                                    children: d === 8 ? "Chủ nhật" : "Thứ " + d
                                                }, d, false, {
                                                    fileName: "[project]/app/editors.tsx",
                                                    lineNumber: 20,
                                                    columnNumber: 402
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/editors.tsx",
                                            lineNumber: 20,
                                            columnNumber: 228
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 20,
                                    columnNumber: 218
                                }, this),
                                [
                                    "start",
                                    "end"
                                ].map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            k === "start" ? "Bắt đầu" : "Kết thúc",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "time",
                                                value: time(slot[k]),
                                                onChange: (e)=>update({
                                                        ...config,
                                                        slots: config.slots.map((x, j)=>j === i ? {
                                                                ...x,
                                                                [k]: minutes(e.target.value)
                                                            } : x)
                                                    })
                                            }, void 0, false, {
                                                fileName: "[project]/app/editors.tsx",
                                                lineNumber: 20,
                                                columnNumber: 567
                                            }, this)
                                        ]
                                    }, k, true, {
                                        fileName: "[project]/app/editors.tsx",
                                        lineNumber: 20,
                                        columnNumber: 518
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "checkbox",
                                            checked: slot.evening,
                                            onChange: (e)=>update({
                                                    ...config,
                                                    slots: config.slots.map((x, j)=>j === i ? {
                                                            ...x,
                                                            evening: e.target.checked
                                                        } : x)
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/app/editors.tsx",
                                            lineNumber: 20,
                                            columnNumber: 734
                                        }, this),
                                        " Buổi tối"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 20,
                                    columnNumber: 727
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>update({
                                            ...config,
                                            slots: config.slots.filter((_, j)=>j !== i)
                                        }),
                                    children: "Bỏ"
                                }, void 0, false, {
                                    fileName: "[project]/app/editors.tsx",
                                    lineNumber: 20,
                                    columnNumber: 903
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/app/editors.tsx",
                            lineNumber: 20,
                            columnNumber: 182
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>update({
                                ...config,
                                slots: [
                                    ...config.slots,
                                    {
                                        day: 2,
                                        start: 420,
                                        end: 720,
                                        evening: false
                                    }
                                ]
                            }),
                        children: "Thêm khung"
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 20,
                        columnNumber: 1004
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>update({
                                ...config,
                                slots: Array.from({
                                    length: 6
                                }, (_, i)=>[
                                        {
                                            day: i + 2,
                                            start: 420,
                                            end: 720,
                                            evening: false
                                        },
                                        {
                                            day: i + 2,
                                            start: 780,
                                            end: 1080,
                                            evening: false
                                        }
                                    ]).flat()
                            }),
                        children: "Điền khung ví dụ để chỉnh sửa"
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 20,
                        columnNumber: 1129
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 20,
                columnNumber: 2
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                disabled: disabled,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                        children: "Trọng số ưu tiên mềm (0 = không ưu tiên)"
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 21,
                        columnNumber: 32
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "editor-row",
                        children: [
                            "restricted",
                            "single_class",
                            "overload",
                            "gaps_minutes"
                        ].map((key, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    [
                                        "Thứ bảy / buổi tối",
                                        "Ngày chỉ có một lớp",
                                        "Vượt trần tiết/ngày",
                                        "Phút trống giữa buổi"
                                    ][i],
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        min: 0,
                                        max: 1000,
                                        value: config.soft_weights?.[key] ?? 1,
                                        onChange: (e)=>update({
                                                ...config,
                                                soft_weights: {
                                                    restricted: 1,
                                                    single_class: 1,
                                                    overload: 1,
                                                    gaps_minutes: 1,
                                                    ...config.soft_weights,
                                                    [key]: Number(e.target.value)
                                                }
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/app/editors.tsx",
                                        lineNumber: 21,
                                        columnNumber: 309
                                    }, this)
                                ]
                            }, key, true, {
                                fileName: "[project]/app/editors.tsx",
                                lineNumber: 21,
                                columnNumber: 198
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 21,
                        columnNumber: 89
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Các trọng số chỉ tối ưu lịch hợp lệ. Trùng giảng viên, Lec/Tut, CLC và mọi điều kiện phòng vẫn là bắt buộc."
                    }, void 0, false, {
                        fileName: "[project]/app/editors.tsx",
                        lineNumber: 21,
                        columnNumber: 559
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 21,
                columnNumber: 2
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "primary",
                disabled: disabled || !config.slots.length,
                onClick: ()=>onSave(config),
                children: "Lưu khung giờ"
            }, void 0, false, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 22,
                columnNumber: 2
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/editors.tsx",
        lineNumber: 19,
        columnNumber: 9
    }, this);
}
_c1 = ConfigEditor;
function CapabilitiesEditor({ value, onChange, courses }) {
    const data = JSON.parse(value);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                children: "Năng lực theo môn"
            }, void 0, false, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 27,
                columnNumber: 19
            }, this),
            courses.map((course)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "editor-row",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            children: course
                        }, void 0, false, {
                            fileName: "[project]/app/editors.tsx",
                            lineNumber: 27,
                            columnNumber: 115
                        }, this),
                        [
                            "LEC",
                            "TUT"
                        ].map((kind)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: data[course]?.includes(kind) ?? false,
                                        onChange: (e)=>{
                                            const values = new Set(data[course] ?? []);
                                            if (e.target.checked) values.add(kind);
                                            else values.delete(kind);
                                            onChange(JSON.stringify({
                                                ...data,
                                                [course]: Array.from(values)
                                            }));
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/app/editors.tsx",
                                        lineNumber: 27,
                                        columnNumber: 184
                                    }, this),
                                    " ",
                                    kind === "LEC" ? "Lecture" : "Tutorial"
                                ]
                            }, kind, true, {
                                fileName: "[project]/app/editors.tsx",
                                lineNumber: 27,
                                columnNumber: 166
                            }, this))
                    ]
                }, course, true, {
                    fileName: "[project]/app/editors.tsx",
                    lineNumber: 27,
                    columnNumber: 74
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Buổi gộp Lec + Tut cần cả hai năng lực. Trợ giảng chỉ được phân công Tutorial."
            }, void 0, false, {
                fileName: "[project]/app/editors.tsx",
                lineNumber: 27,
                columnNumber: 490
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/editors.tsx",
        lineNumber: 27,
        columnNumber: 9
    }, this);
}
_c2 = CapabilitiesEditor;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "CatalogEditor");
__turbopack_context__.k.register(_c1, "ConfigEditor");
__turbopack_context__.k.register(_c2, "CapabilitiesEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$editors$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/editors.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$rooms$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/rooms.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/workspace-ui.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const clock = (m)=>String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
let browserAuth = null;
const roleName = {
    STAFF: "Giáo vụ",
    HEAD: "Trưởng bộ môn",
    TEACHER: "Giảng viên"
};
function Home() {
    _s();
    const [auth, setAuth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [token, setToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [workspace, setWorkspace] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [failed, setFailed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("overview");
    const [external, setExternal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        institution: "",
        course: "",
        class_name: "",
        room: "",
        day: 2,
        start: "07:00",
        end: "09:30"
    });
    const [preview, setPreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [draftQuery, setDraftQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [config, setConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const apiUrl = ("TURBOPACK compile-time value", "http://127.0.0.1:5298") || "http://localhost:8000";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            const url = ("TURBOPACK compile-time value", "http://127.0.0.1:5299"), key = ("TURBOPACK compile-time value", "public-test-key");
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const client = browserAuth ?? (browserAuth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, key, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: true
                }
            }));
            setAuth(client);
            const { data } = client.auth.onAuthStateChange({
                "Home.useEffect": (_event, session)=>{
                    setToken(session?.access_token || "");
                    if (!session) {
                        setProfile(null);
                        setWorkspace(null);
                        setTab("overview");
                        setMessage("");
                        setPreview(null);
                    }
                }
            }["Home.useEffect"]);
            return ({
                "Home.useEffect": ()=>data.subscription.unsubscribe()
            })["Home.useEffect"];
        }
    }["Home.useEffect"], []);
    async function api(path, body) {
        const response = await fetch(apiUrl + path, {
            method: body === undefined ? "GET" : "POST",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json"
            },
            ...body === undefined ? {} : {
                body: JSON.stringify(body)
            }
        });
        const value = await response.json();
        if (!response.ok) throw new Error(response.status === 401 ? "Phiên đăng nhập đã hết hạn. Hãy đăng xuất và đăng nhập lại." : response.status === 403 ? "Bạn chưa được cấp quyền cho thao tác này." : response.status === 409 && String(value.detail).includes("revision") ? "Dữ liệu đã thay đổi. Hãy làm mới trước khi thử lại." : typeof value.detail === "string" ? value.detail : JSON.stringify(value.detail));
        return value;
    }
    async function refresh() {
        const [p, w] = await Promise.all([
            api("/api/me"),
            api("/api/workspace")
        ]);
        setProfile(p);
        setWorkspace(w);
        if (w.state?.config) setConfig(JSON.stringify(w.state?.config, null, 2));
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            if (token) {
                setLoading(true);
                refresh().catch({
                    "Home.useEffect": (e)=>{
                        setFailed(true);
                        setMessage(e.message);
                    }
                }["Home.useEffect"]).finally({
                    "Home.useEffect": ()=>setLoading(false)
                }["Home.useEffect"]);
            }
        }
    }["Home.useEffect"], [
        token
    ]); // eslint-disable-line
    async function perform(fn) {
        if (busy) return;
        setBusy(true);
        setMessage("");
        setFailed(false);
        try {
            await fn();
        } catch (e) {
            setFailed(true);
            setMessage(e instanceof Error ? e.message : "Không thể xử lý");
        } finally{
            setBusy(false);
        }
    }
    async function command(action, payload = {}) {
        if (!workspace) return;
        await api("/api/commands/" + action, {
            revision: workspace.revision,
            payload
        });
        await refresh();
        setMessage({
            solve: "Đã tìm được lịch hợp lệ với phòng cụ thể.",
            assign: "Đã lưu phân công giảng viên.",
            submit: "Đã nộp phân công cho giáo vụ.",
            send: "Đã gửi kế hoạch cho bộ môn.",
            return: "Đã gửi yêu cầu điều chỉnh cho bộ môn.",
            publish: "Đã công bố lịch giảng dạy.",
            external: "Đã lưu lịch ngoài."
        }[action] ?? "Đã lưu thay đổi.");
    }
    async function download(source) {
        const res = await fetch(apiUrl + "/api/export/" + source, {
            headers: {
                Authorization: "Bearer " + token
            }
        });
        if (!res.ok) throw new Error((await res.json()).detail);
        const url = URL.createObjectURL(await res.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = "Timetable-" + source + ".xlsx";
        a.click();
        URL.revokeObjectURL(url);
    }
    async function login(e) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        await perform(async ()=>{
            if (!auth) throw new Error("Chưa cấu hình Supabase");
            const { error } = await auth.auth.signInWithPassword({
                email: String(form.get("email")),
                password: String(form.get("password"))
            });
            if (error) throw error;
        });
    }
    const state = workspace?.state;
    const staff = profile?.role === "STAFF", head = profile?.role === "HEAD";
    const tabs = profile ? [
        [
            "overview",
            "Tổng quan"
        ],
        ...staff ? [
            [
                "setup",
                "Cấu hình & kế hoạch"
            ],
            [
                "rooms",
                "Phòng học"
            ]
        ] : [],
        ...staff || head ? [
            [
                "assign",
                "Phân công"
            ]
        ] : [],
        ...staff ? [
            [
                "draft",
                "Xếp lịch & công bố"
            ]
        ] : [],
        ...!staff ? [
            [
                "personal",
                "Lịch của tôi"
            ]
        ] : []
    ] : [];
    const pageTitles = {
        overview: "Tổng quan điều phối",
        setup: "Kế hoạch & cấu hình",
        rooms: "Quản lý phòng học",
        assign: "Phân công giảng dạy",
        draft: "Xếp lịch & công bố",
        personal: "Lịch giảng dạy cá nhân"
    };
    const descriptions = {
        overview: staff ? "Theo dõi tiến độ học kỳ và phối hợp cùng các bộ môn." : head ? "Điều phối giảng viên và theo dõi kế hoạch của bộ môn." : "Theo dõi các lớp và lịch giảng dạy đã được công bố.",
        setup: "Chuẩn bị danh mục, khung giờ và kế hoạch mở lớp.",
        rooms: "Quản lý sức chứa, thiết bị, khả dụng và lịch chiếm dụng.",
        assign: "Đúng giảng viên, đúng năng lực, rõ khối lượng phụ trách.",
        draft: "Kiểm tra ràng buộc và hoàn thiện thời khóa biểu trước khi công bố.",
        personal: "Lịch khoa và lịch ngoài trong cùng một không gian."
    };
    const sessions = state?.sessions ?? [], departments = state?.departments ?? [];
    const remaining = sessions.filter((s)=>!s.teacher).length;
    const unsent = departments.some((d)=>d.status === "UNSENT" && sessions.some((s)=>s.department === d.id));
    const ready = !!sessions.length && !!departments.length && departments.every((d)=>d.status === "SUBMITTED");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "shell",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                className: "skip-link",
                href: "#main-content",
                children: "Đến nội dung chính"
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 94,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        className: "brand",
                        href: "/",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "brand-mark",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                    name: "personal"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 95,
                                    columnNumber: 71
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 95,
                                columnNumber: 42
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: [
                                    "ScheduleSolver",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "ĐIỀU PHỐI ĐÀO TẠO"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 95,
                                        columnNumber: 123
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 95,
                                columnNumber: 101
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 95,
                        columnNumber: 12
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "nav-label",
                        children: "KHÔNG GIAN LÀM VIỆC"
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 96,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        "aria-label": "Điều hướng chính",
                        children: tabs.map(([id, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                "aria-current": tab === id ? "page" : undefined,
                                className: tab === id ? "active" : "",
                                onClick: ()=>{
                                    setTab(id);
                                    setMessage("");
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                        name: id
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 97,
                                        columnNumber: 200
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: label
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 97,
                                        columnNumber: 217
                                    }, this),
                                    id === "assign" && remaining > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "nav-count",
                                        children: remaining
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 97,
                                        columnNumber: 266
                                    }, this)
                                ]
                            }, id, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 97,
                                columnNumber: 66
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 97,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "aside-foot",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "aside-tip",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                        name: "draft"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 62
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: "Một quy trình, cùng phối hợp"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 82
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            "Kế hoạch rõ ràng.",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 98,
                                                columnNumber: 137
                                            }, this),
                                            "Phân công đúng năng lực.",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 98,
                                                columnNumber: 166
                                            }, this),
                                            "Lịch dạy không xung đột."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 117
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 98,
                                columnNumber: 35
                            }, this),
                            profile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "user-profile",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "avatar",
                                        children: staff ? "GV" : head ? "BM" : "CN"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 245
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                children: roleName[profile.role]
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 98,
                                                columnNumber: 309
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: profile.department || profile.teacher || "Điều phối đào tạo"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 98,
                                                columnNumber: 340
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 304
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 98,
                                columnNumber: 215
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 98,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 95,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                id: "main-content",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "topbar",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "Quản lý đào tạo ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "aria-hidden": "true",
                                        children: "/"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 100,
                                        columnNumber: 75
                                    }, this),
                                    " ",
                                    profile ? roleName[profile.role] : "Tài khoản"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 100,
                                columnNumber: 53
                            }, this),
                            token && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                disabled: busy,
                                onClick: ()=>perform(async ()=>{
                                        await auth?.auth.signOut();
                                    }),
                                children: "Đăng xuất"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 100,
                                columnNumber: 168
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 100,
                        columnNumber: 29
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "eyebrow",
                                        children: profile ? roleName[profile.role] : "SCHEDULE SOLVER"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 101,
                                        columnNumber: 20
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        children: token ? pageTitles[tab] : "Chào mừng trở lại"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 101,
                                        columnNumber: 103
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: token ? descriptions[tab] : "Không gian phối hợp lịch học và giảng dạy."
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 101,
                                        columnNumber: 155
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 101,
                                columnNumber: 15
                            }, this),
                            workspace && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "badge " + (workspace.has_publication ? "success" : "neutral"),
                                children: workspace.has_publication ? "Đã có lịch công bố" : "Đang chuẩn bị học kỳ"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 101,
                                columnNumber: 250
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 101,
                        columnNumber: 7
                    }, this),
                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "notice " + (failed ? "error" : "success"),
                        role: failed ? "alert" : "status",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                children: failed ? "Không thể hoàn tất thao tác" : "Thông báo"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 102,
                                columnNumber: 102
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: message
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 102,
                                columnNumber: 159
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                "aria-label": "Đóng thông báo",
                                onClick: ()=>setMessage(""),
                                children: "×"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 102,
                                columnNumber: 181
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 102,
                        columnNumber: 17
                    }, this),
                    busy && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "working",
                        role: "status",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "spinner"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 103,
                                columnNumber: 53
                            }, this),
                            "Đang xử lý, vui lòng chờ…"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 103,
                        columnNumber: 14
                    }, this),
                    !token ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "login card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "badge neutral",
                                children: "TÀI KHOẢN ĐƠN VỊ"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 104,
                                columnNumber: 47
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Đăng nhập"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 104,
                                columnNumber: 102
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Sử dụng tài khoản được cấp để truy cập không gian của bạn."
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 104,
                                columnNumber: 120
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: login,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            "Email",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                type: "email",
                                                name: "email",
                                                autoComplete: "username",
                                                placeholder: "ten@donvi.edu.vn"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 104,
                                                columnNumber: 220
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 104,
                                        columnNumber: 208
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            "Mật khẩu",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                type: "password",
                                                name: "password",
                                                autoComplete: "current-password",
                                                placeholder: "Nhập mật khẩu"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 104,
                                                columnNumber: 341
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 104,
                                        columnNumber: 326
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "primary",
                                        disabled: busy || !auth,
                                        children: busy ? "Đang đăng nhập…" : "Đăng nhập"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 104,
                                        columnNumber: 458
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 104,
                                columnNumber: 185
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "Liên hệ quản trị viên đơn vị nếu bạn chưa có tài khoản hoặc cần cấp lại quyền truy cập."
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 104,
                                columnNumber: 561
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 104,
                        columnNumber: 15
                    }, this) : !workspace ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "card",
                        "aria-busy": loading,
                        children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "empty-state",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "spinner"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 105,
                                    columnNumber: 102
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    children: "Đang tải không gian làm việc…"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 105,
                                    columnNumber: 129
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 105,
                            columnNumber: 73
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EmptyState"], {
                                    title: "Chưa tải được không gian làm việc",
                                    children: "Kiểm tra kết nối hoặc liên hệ quản trị viên về quyền tài khoản."
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 105,
                                    columnNumber: 176
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    disabled: busy,
                                    onClick: ()=>perform(refresh),
                                    children: "Thử lại"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 105,
                                    columnNumber: 306
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 105,
                            columnNumber: 174
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 105,
                        columnNumber: 18
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "toolbar",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "Dữ liệu hiện tại · Phiên ",
                                            workspace.revision
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 106,
                                        columnNumber: 32
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        disabled: busy,
                                        onClick: ()=>perform(refresh),
                                        children: "↻ Làm mới"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 106,
                                        columnNumber: 90
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 106,
                                columnNumber: 7
                            }, this),
                            tab === "overview" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Metrics"], {
                                        items: staff ? [
                                            {
                                                label: "Lớp trong kế hoạch",
                                                value: sessions.length,
                                                detail: remaining + " lớp chưa phân công"
                                            },
                                            {
                                                label: "Bộ môn đã nộp",
                                                value: departments.filter((d)=>d.status === "SUBMITTED").length + "/" + departments.length,
                                                detail: "Phân công sẵn sàng để xếp lịch"
                                            },
                                            {
                                                label: "Buổi đã công bố",
                                                value: state?.published.length ?? 0,
                                                detail: "Lịch giảng dạy chính thức",
                                                tone: "text-success"
                                            }
                                        ] : head ? [
                                            {
                                                label: "Lớp thuộc bộ môn",
                                                value: sessions.length,
                                                detail: remaining + " lớp chưa phân công"
                                            },
                                            {
                                                label: "Giảng viên bộ môn",
                                                value: state?.teachers?.length ?? 0,
                                                detail: "Theo danh mục được cấp"
                                            },
                                            {
                                                label: "Khối lượng bộ môn",
                                                value: sessions.reduce((n, s)=>n + (s.periods ?? 0), 0),
                                                detail: "Tiết/tuần trong kế hoạch"
                                            }
                                        ] : [
                                            {
                                                label: "Buổi giảng dạy",
                                                value: state?.published.length ?? 0,
                                                detail: "Đã được giáo vụ công bố"
                                            },
                                            {
                                                label: "Khối lượng giảng dạy",
                                                value: state?.published.some((s)=>s.periods === undefined) ? "—" : state?.published.reduce((n, s)=>n + (s.periods ?? 0), 0) ?? 0,
                                                detail: "Tiết/tuần theo lịch công bố"
                                            },
                                            {
                                                label: "Buổi lịch ngoài",
                                                value: state?.external?.length ?? 0,
                                                detail: "Lịch cá nhân đã khai báo"
                                            }
                                        ]
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 108,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "context-banner",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                                name: staff ? "draft" : head ? "assign" : "personal"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 121,
                                                columnNumber: 45
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                        children: staff ? sessions.length ? ready ? "Sẵn sàng kiểm tra và xếp lịch" : "Tiếp tục phối hợp phân công" : "Bắt đầu từ kế hoạch mở lớp" : head ? "Không gian phân công của bộ môn" : "Lịch giảng dạy của bạn"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 121,
                                                        columnNumber: 103
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: staff ? ready ? "Các bộ môn đã nộp. Kiểm tra phòng và ràng buộc trước khi chạy xếp lịch." : "Gửi kế hoạch, theo dõi phân công và phản hồi những lớp cần điều chỉnh." : head ? "Xem kế hoạch, cân đối khối lượng và nộp phân công cho giáo vụ." : "Lịch chỉ hiển thị khi đã được công bố; lịch ngoài được quản lý riêng cho bạn."
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 121,
                                                        columnNumber: 296
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 121,
                                                columnNumber: 98
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "primary",
                                                onClick: ()=>{
                                                    if (staff && unsent) {
                                                        const target = document.getElementById("department-progress");
                                                        target?.scrollIntoView({
                                                            behavior: "smooth",
                                                            block: "start"
                                                        });
                                                        target?.focus({
                                                            preventScroll: true
                                                        });
                                                    } else setTab(staff ? sessions.length ? ready ? "draft" : "assign" : "setup" : head ? "assign" : "personal");
                                                },
                                                children: [
                                                    staff ? unsent ? "Gửi kế hoạch cho bộ môn" : sessions.length ? ready ? "Đến xếp lịch" : "Xem phân công" : "Nhập kế hoạch" : head ? "Phân công giảng viên" : "Mở lịch cá nhân",
                                                    " →"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 121,
                                                columnNumber: 621
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 121,
                                        columnNumber: 9
                                    }, this),
                                    staff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Workflow"], {
                                        departments: departments,
                                        sessions: sessions,
                                        draftCount: state?.draft?.length ?? 0,
                                        published: workspace.has_publication,
                                        navigate: setTab
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 122,
                                        columnNumber: 17
                                    }, this),
                                    (staff || head) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DepartmentProgress"], {
                                        departments: departments,
                                        sessions: sessions,
                                        staff: staff,
                                        busy: busy,
                                        navigate: setTab,
                                        onCommand: (action, payload)=>perform(()=>command(action, payload))
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 123,
                                        columnNumber: 25
                                    }, this),
                                    !staff && !head && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PersonalCalendar"], {
                                        published: state?.published ?? [],
                                        external: state?.external ?? []
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 124,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 107,
                                columnNumber: 26
                            }, this),
                            tab === "setup" && staff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "card",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Danh mục khởi tạo đã đối chiếu"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 127,
                                                columnNumber: 35
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: "Nhập danh mục bộ môn và giảng viên bằng tệp JSON của đơn vị hoặc điền bảng bên dưới. Danh mục được khóa sau khi nhập kế hoạch."
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 127,
                                                columnNumber: 74
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                children: [
                                                    "Tệp danh mục JSON",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "file",
                                                        accept: ".json",
                                                        disabled: busy || !!state?.sessions?.length,
                                                        onChange: (e)=>{
                                                            const file = e.target.files?.[0];
                                                            if (file) perform(async ()=>command("catalog", JSON.parse(await file.text())));
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 127,
                                                        columnNumber: 231
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 127,
                                                columnNumber: 207
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 127,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$editors$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CatalogEditor"], {
                                        initialDepartments: state?.departments ?? [],
                                        initialTeachers: state?.teachers ?? [],
                                        disabled: busy || !!state?.sessions?.length,
                                        onSave: (data)=>perform(()=>command("catalog", data))
                                    }, "catalog" + workspace.revision, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 128,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$editors$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConfigEditor"], {
                                        value: config,
                                        onChange: setConfig,
                                        disabled: busy || !!state?.published.length,
                                        onSave: (data)=>perform(()=>command("config", data))
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 129,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "card",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Nhập kế hoạch Excel"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 130,
                                                columnNumber: 35
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: [
                                                    "Tải ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: "/plan-template.xlsx",
                                                        download: true,
                                                        children: "mẫu Excel"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 130,
                                                        columnNumber: 70
                                                    }, this),
                                                    ", điền kế hoạch trong một sheet và tải lên để kiểm tra. Xem trước không thay đổi dữ liệu; xác nhận sẽ tạo lớp học phần."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 130,
                                                columnNumber: 63
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                children: [
                                                    "File .xlsx",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "file",
                                                        accept: ".xlsx",
                                                        disabled: busy || !!sessions.length,
                                                        onChange: (e)=>{
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            setPreview(null);
                                                            perform(async ()=>{
                                                                const form = new FormData();
                                                                form.append("file", file);
                                                                const res = await fetch(apiUrl + "/api/import/preview", {
                                                                    method: "POST",
                                                                    headers: {
                                                                        Authorization: "Bearer " + token
                                                                    },
                                                                    body: form
                                                                });
                                                                const data = await res.json();
                                                                if (!res.ok) throw new Error(data.detail);
                                                                setPreview(data);
                                                            });
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 130,
                                                        columnNumber: 262
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 130,
                                                columnNumber: 245
                                            }, this),
                                            preview && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: [
                                                            preview.offerings.length,
                                                            " dòng hợp lệ; ",
                                                            preview.errors.length,
                                                            " dòng lỗi."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 131,
                                                        columnNumber: 23
                                                    }, this),
                                                    preview.errors.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            children: [
                                                                "Dòng ",
                                                                e.row,
                                                                ": ",
                                                                e.message
                                                            ]
                                                        }, e.row, true, {
                                                            fileName: "[project]/app/page.tsx",
                                                            lineNumber: 131,
                                                            columnNumber: 126
                                                        }, this)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        disabled: busy || !preview.can_import || !!sessions.length,
                                                        onClick: ()=>perform(()=>command("offerings", {
                                                                    offerings: preview.offerings
                                                                })),
                                                        children: "Xác nhận nhập & chia lớp"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 131,
                                                        columnNumber: 172
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 131,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 130,
                                        columnNumber: 9
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 126,
                                columnNumber: 30
                            }, this),
                            tab === "rooms" && staff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    state?.published.some((r)=>!r.room_id) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "card",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Xác nhận phòng cho lịch công bố cũ"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 134,
                                                columnNumber: 97
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: "Cần đối chiếu phòng thực tế để bảo vệ chiếm dụng trước khi chạy bộ giải. Không tự suy đoán mã phòng."
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 134,
                                                columnNumber: 140
                                            }, this),
                                            state?.published.filter((r)=>!r.room_id).map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    children: [
                                                        r.id,
                                                        " · Thứ ",
                                                        r.day,
                                                        " · ",
                                                        clock(r.start),
                                                        "–",
                                                        clock(r.end),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                            disabled: busy,
                                                            value: "",
                                                            onChange: (e)=>perform(()=>command("published-room", {
                                                                        session: r.id,
                                                                        room_id: e.target.value
                                                                    })),
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: "",
                                                                    disabled: true,
                                                                    children: "Chọn phòng đã xác nhận"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/page.tsx",
                                                                    lineNumber: 134,
                                                                    columnNumber: 490
                                                                }, this),
                                                                state?.rooms?.map((room)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: room.id,
                                                                        children: room.id
                                                                    }, room.id, false, {
                                                                        fileName: "[project]/app/page.tsx",
                                                                        lineNumber: 134,
                                                                        columnNumber: 572
                                                                    }, this))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/page.tsx",
                                                            lineNumber: 134,
                                                            columnNumber: 366
                                                        }, this)
                                                    ]
                                                }, r.id, true, {
                                                    fileName: "[project]/app/page.tsx",
                                                    lineNumber: 134,
                                                    columnNumber: 294
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 134,
                                        columnNumber: 71
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$rooms$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoomManager"], {
                                        initial: state?.rooms ?? [],
                                        reservations: state?.reservations ?? [],
                                        disabled: busy,
                                        onCommand: (action, payload)=>perform(()=>command(action, payload))
                                    }, workspace.revision, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 134,
                                        columnNumber: 660
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$rooms$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RequirementsEditor"], {
                                        sessions: state?.sessions ?? [],
                                        disabled: busy,
                                        onCommand: (action, payload)=>perform(()=>command(action, payload))
                                    }, "requirements" + workspace.revision, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 134,
                                        columnNumber: 848
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 134,
                                columnNumber: 30
                            }, this),
                            tab === "assign" && (staff || head) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AssignmentPanel"], {
                                sessions: state?.sessions ?? [],
                                teachers: state?.teachers ?? [],
                                departments: state?.departments ?? [],
                                head: head,
                                busy: busy,
                                onCommand: (action, payload)=>perform(()=>command(action, payload))
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 135,
                                columnNumber: 39
                            }, this),
                            tab === "draft" && staff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "card",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Thẩm định & xếp lịch"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 137,
                                                columnNumber: 35
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "readiness",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "badge " + (ready ? "success" : "warning"),
                                                        children: ready ? "✓ Các bộ môn đã nộp" : "Chờ bộ môn hoàn tất phân công"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 91
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "badge " + (state?.rooms?.length ? "success" : "warning"),
                                                        children: [
                                                            state?.rooms?.length ?? 0,
                                                            " phòng đã khai báo"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 214
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "badge " + (state?.config?.slots.length ? "success" : "warning"),
                                                        children: [
                                                            state?.config?.slots.length ?? 0,
                                                            " khung giờ"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 334
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 137,
                                                columnNumber: 64
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "actions",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        disabled: busy || !state?.draft?.length,
                                                        onClick: ()=>perform(()=>download("draft")),
                                                        children: "Xuất Excel nháp"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 491
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        disabled: busy || !state?.published.length,
                                                        onClick: ()=>perform(()=>download("published")),
                                                        children: "Xuất Excel đã công bố"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 607
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 137,
                                                columnNumber: 466
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: "Kiểm tra phân công, sức chứa, thiết bị, điều kiện dùng phòng, toàn bộ khung khả dụng và lịch chiếm dụng. Nếu hết lượt tìm kiếm, hệ thống báo xung đột và giữ nguyên bản nháp; điều đó chưa chứng minh bài toán vô nghiệm."
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 137,
                                                columnNumber: 742
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "actions",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        disabled: busy || !ready || !state?.rooms?.length || !state?.config?.slots.length,
                                                        onClick: ()=>perform(()=>command("solve", {
                                                                    iterations: 500,
                                                                    seed: 42
                                                                })),
                                                        children: "Thẩm định & chạy bộ giải"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 991
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "primary",
                                                        disabled: busy || workspace.evaluation?.hard !== 0 || !state?.draft?.length,
                                                        onClick: ()=>perform(()=>command("publish")),
                                                        children: "Công bố lịch"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 1178
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 137,
                                                columnNumber: 966
                                            }, this),
                                            !ready && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "inline-help",
                                                children: [
                                                    "Hoàn tất phân công và nộp từ tất cả bộ môn trước khi xếp lịch. ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setTab("assign"),
                                                        children: "Xem phân công →"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 138,
                                                        columnNumber: 108
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 138,
                                                columnNumber: 18
                                            }, this),
                                            !!state?.draft?.length && workspace.evaluation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Metrics"], {
                                                        items: [
                                                            {
                                                                label: "Lỗi bắt buộc",
                                                                value: workspace.evaluation.hard,
                                                                detail: "Phải xử lý hết trước khi công bố",
                                                                tone: workspace.evaluation.hard ? "text-warning" : "text-success"
                                                            },
                                                            {
                                                                label: "Điểm ưu tiên mềm",
                                                                value: workspace.evaluation.soft_total,
                                                                detail: "Điểm càng thấp, lịch càng thuận tiện"
                                                            },
                                                            {
                                                                label: "Lớp đã xếp",
                                                                value: state?.draft.length + "/" + sessions.length,
                                                                detail: "Bản nháp đang hiệu chỉnh"
                                                            }
                                                        ]
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 139,
                                                        columnNumber: 58
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                                        open: workspace.evaluation.hard > 0,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                                                children: "Báo cáo kiểm tra"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/page.tsx",
                                                                lineNumber: 139,
                                                                columnNumber: 492
                                                            }, this),
                                                            workspace.evaluation.hard > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-warning",
                                                                        children: "Đối chiếu lớp và phòng bên dưới để điều chỉnh, hoặc kiểm tra lại phân công."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/page.tsx",
                                                                        lineNumber: 139,
                                                                        columnNumber: 558
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                                        className: "violation-list",
                                                                        children: workspace.evaluation.violations.map((v, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                                children: v
                                                                            }, i, false, {
                                                                                fileName: "[project]/app/page.tsx",
                                                                                lineNumber: 139,
                                                                                columnNumber: 740
                                                                            }, this))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/page.tsx",
                                                                        lineNumber: 139,
                                                                        columnNumber: 665
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/page.tsx",
                                                                lineNumber: 139,
                                                                columnNumber: 556
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-success",
                                                                children: "Không có lỗi bắt buộc trong bản nháp hiện tại."
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/page.tsx",
                                                                lineNumber: 139,
                                                                columnNumber: 771
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                                                className: "evaluation-details",
                                                                children: Object.entries(workspace.evaluation.soft).map(([key, value])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                                                children: {
                                                                                    restricted: "Thứ bảy / buổi tối",
                                                                                    single_class: "Ngày chỉ có một lớp",
                                                                                    overload: "Số tiết vượt trần ngày",
                                                                                    gaps_minutes: "Phút trống giữa buổi"
                                                                                }[key] ?? key
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/page.tsx",
                                                                                lineNumber: 139,
                                                                                columnNumber: 962
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                                                children: value
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/page.tsx",
                                                                                lineNumber: 139,
                                                                                columnNumber: 1148
                                                                            }, this)
                                                                        ]
                                                                    }, key, true, {
                                                                        fileName: "[project]/app/page.tsx",
                                                                        lineNumber: 139,
                                                                        columnNumber: 947
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/page.tsx",
                                                                lineNumber: 139,
                                                                columnNumber: 850
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 139,
                                                        columnNumber: 448
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 139,
                                                columnNumber: 56
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 137,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "card",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                children: "Hiệu chỉnh bản nháp"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 141,
                                                columnNumber: 35
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: "Chọn khung bắt đầu và phòng; kết quả kiểm tra được cập nhật sau mỗi lần lưu."
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 141,
                                                columnNumber: 63
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                children: [
                                                    "Tìm lớp trong bản nháp",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "search",
                                                        placeholder: "Nhập mã lớp hoặc mã môn…",
                                                        value: draftQuery,
                                                        onChange: (e)=>setDraftQuery(e.target.value)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 141,
                                                        columnNumber: 175
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 141,
                                                columnNumber: 146
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "table-wrap",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        children: "Lớp"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/page.tsx",
                                                                        lineNumber: 141,
                                                                        columnNumber: 353
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        children: "Thứ & giờ bắt đầu"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/page.tsx",
                                                                        lineNumber: 141,
                                                                        columnNumber: 365
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        children: "Phòng"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/page.tsx",
                                                                        lineNumber: 141,
                                                                        columnNumber: 391
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/page.tsx",
                                                                lineNumber: 141,
                                                                columnNumber: 349
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/page.tsx",
                                                            lineNumber: 141,
                                                            columnNumber: 342
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                            children: sessions.filter((s)=>(s.id + " " + s.course).toLowerCase().includes(draftQuery.toLowerCase())).map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                                                    children: s.course
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/page.tsx",
                                                                                    lineNumber: 141,
                                                                                    columnNumber: 541
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                                    children: s.id
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/page.tsx",
                                                                                    lineNumber: 141,
                                                                                    columnNumber: 558
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/page.tsx",
                                                                            lineNumber: 141,
                                                                            columnNumber: 537
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                                "aria-label": "Khung giờ cho " + s.id,
                                                                                disabled: busy || !state?.rooms?.length,
                                                                                value: state?.draft?.find((p)=>p.session === s.id)?.slot ?? "",
                                                                                onChange: (e)=>perform(()=>command("placement", {
                                                                                            session: s.id,
                                                                                            slot: Number(e.target.value),
                                                                                            room_id: state?.draft?.find((p)=>p.session === s.id)?.room_id ?? state?.rooms?.[0]?.id
                                                                                        })),
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                        value: "",
                                                                                        disabled: true,
                                                                                        children: "Chưa xếp"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/page.tsx",
                                                                                        lineNumber: 141,
                                                                                        columnNumber: 899
                                                                                    }, this),
                                                                                    state?.config?.slots.map((slot, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: i,
                                                                                            children: [
                                                                                                slot.day === 8 ? "Chủ nhật" : "Thứ " + slot.day,
                                                                                                " · bắt đầu ",
                                                                                                clock(slot.start),
                                                                                                " (khung đến ",
                                                                                                clock(slot.end),
                                                                                                ")"
                                                                                            ]
                                                                                        }, i, true, {
                                                                                            fileName: "[project]/app/page.tsx",
                                                                                            lineNumber: 141,
                                                                                            columnNumber: 978
                                                                                        }, this))
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/page.tsx",
                                                                                lineNumber: 141,
                                                                                columnNumber: 588
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/page.tsx",
                                                                            lineNumber: 141,
                                                                            columnNumber: 584
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                                "aria-label": "Phòng cho " + s.id,
                                                                                disabled: busy || !state?.config?.slots.length,
                                                                                value: state?.draft?.find((p)=>p.session === s.id)?.room_id ?? "",
                                                                                onChange: (e)=>perform(()=>command("placement", {
                                                                                            session: s.id,
                                                                                            slot: state?.draft?.find((p)=>p.session === s.id)?.slot ?? 0,
                                                                                            room_id: e.target.value
                                                                                        })),
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                        value: "",
                                                                                        disabled: true,
                                                                                        children: "Chọn phòng"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/page.tsx",
                                                                                        lineNumber: 141,
                                                                                        columnNumber: 1420
                                                                                    }, this),
                                                                                    state?.rooms?.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: r.id,
                                                                                            children: [
                                                                                                r.id,
                                                                                                " · ",
                                                                                                r.capacity,
                                                                                                " SV"
                                                                                            ]
                                                                                        }, r.id, true, {
                                                                                            fileName: "[project]/app/page.tsx",
                                                                                            lineNumber: 141,
                                                                                            columnNumber: 1487
                                                                                        }, this))
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/page.tsx",
                                                                                lineNumber: 141,
                                                                                columnNumber: 1134
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/page.tsx",
                                                                            lineNumber: 141,
                                                                            columnNumber: 1130
                                                                        }, this)
                                                                    ]
                                                                }, s.id, true, {
                                                                    fileName: "[project]/app/page.tsx",
                                                                    lineNumber: 141,
                                                                    columnNumber: 522
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/page.tsx",
                                                            lineNumber: 141,
                                                            columnNumber: 418
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/page.tsx",
                                                    lineNumber: 141,
                                                    columnNumber: 335
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 141,
                                                columnNumber: 307
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: "Mỗi lần chỉnh sửa sẽ chấm điểm lại. Bản đã công bố được giữ riêng."
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 141,
                                                columnNumber: 1597
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 141,
                                        columnNumber: 9
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 136,
                                columnNumber: 30
                            }, this),
                            tab === "personal" && !staff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$workspace$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PersonalCalendar"], {
                                published: state?.published ?? [],
                                external: state?.external ?? []
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 143,
                                columnNumber: 34
                            }, this),
                            tab === "personal" && !staff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: "Khai báo lịch trường ngoài"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 144,
                                        columnNumber: 60
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Thêm buổi giảng dạy ngoài khoa để quản lý lịch cá nhân. Giờ kết thúc phải sau giờ bắt đầu."
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 144,
                                        columnNumber: 95
                                    }, this),
                                    !workspace.has_publication && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "feedback",
                                        children: "Bạn có thể khai báo lịch ngoài sau khi giáo vụ công bố lịch khoa."
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 144,
                                        columnNumber: 221
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                        className: "external-form",
                                        onSubmit: (e)=>{
                                            e.preventDefault();
                                            perform(async ()=>{
                                                if (external.end <= external.start) throw new Error("Giờ kết thúc phải sau giờ bắt đầu.");
                                                const minute = (v)=>{
                                                    const [h, m] = v.split(":").map(Number);
                                                    return h * 60 + m;
                                                };
                                                await command("external", {
                                                    ...external,
                                                    start: minute(external.start),
                                                    end: minute(external.end)
                                                });
                                            });
                                        },
                                        children: [
                                            [
                                                "institution",
                                                "course",
                                                "class_name",
                                                "room"
                                            ].map((key, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    children: [
                                                        [
                                                            "Trường",
                                                            "Môn",
                                                            "Lớp",
                                                            "Phòng (tùy chọn)"
                                                        ][i],
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            required: key !== "room",
                                                            value: external[key],
                                                            onChange: (e)=>setExternal({
                                                                    ...external,
                                                                    [key]: e.target.value
                                                                })
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/page.tsx",
                                                            lineNumber: 144,
                                                            columnNumber: 797
                                                        }, this)
                                                    ]
                                                }, key, true, {
                                                    fileName: "[project]/app/page.tsx",
                                                    lineNumber: 144,
                                                    columnNumber: 734
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                children: [
                                                    "Thứ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        value: external.day,
                                                        onChange: (e)=>setExternal({
                                                                ...external,
                                                                day: Number(e.target.value)
                                                            }),
                                                        children: Array.from({
                                                            length: 7
                                                        }, (_, i)=>i + 2).map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: d,
                                                                children: d === 8 ? "Chủ nhật" : "Thứ " + d
                                                            }, d, false, {
                                                                fileName: "[project]/app/page.tsx",
                                                                lineNumber: 144,
                                                                columnNumber: 1072
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/page.tsx",
                                                        lineNumber: 144,
                                                        columnNumber: 933
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 144,
                                                columnNumber: 923
                                            }, this),
                                            [
                                                "start",
                                                "end"
                                            ].map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    children: [
                                                        k === "start" ? "Bắt đầu" : "Kết thúc",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "time",
                                                            min: "06:00",
                                                            max: "22:00",
                                                            required: true,
                                                            value: external[k],
                                                            onChange: (e)=>setExternal({
                                                                    ...external,
                                                                    [k]: e.target.value
                                                                })
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/page.tsx",
                                                            lineNumber: 144,
                                                            columnNumber: 1237
                                                        }, this)
                                                    ]
                                                }, k, true, {
                                                    fileName: "[project]/app/page.tsx",
                                                    lineNumber: 144,
                                                    columnNumber: 1188
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "primary",
                                                disabled: busy || !workspace.has_publication || external.end <= external.start,
                                                children: "Lưu lịch ngoài"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 144,
                                                columnNumber: 1380
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 144,
                                        columnNumber: 315
                                    }, this),
                                    state?.external?.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                            className: "dept",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        r.institution,
                                                        " · ",
                                                        r.course,
                                                        " · Thứ ",
                                                        r.day,
                                                        " · ",
                                                        clock(r.start),
                                                        "–",
                                                        clock(r.end),
                                                        state?.published.some((p)=>p.day === r.day && p.start < r.end && r.start < p.end) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: " — Trùng lịch khoa mới công bố, cần sửa lịch ngoài"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/page.tsx",
                                                            lineNumber: 144,
                                                            columnNumber: 1725
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/page.tsx",
                                                    lineNumber: 144,
                                                    columnNumber: 1574
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    disabled: busy,
                                                    onClick: ()=>{
                                                        if (window.confirm("Xóa buổi " + r.course + " tại " + r.institution + "?")) void perform(()=>command("external-delete", {
                                                                id: r.id
                                                            }));
                                                    },
                                                    children: "Xóa buổi"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/page.tsx",
                                                    lineNumber: 144,
                                                    columnNumber: 1797
                                                }, this)
                                            ]
                                        }, r.id, true, {
                                            fileName: "[project]/app/page.tsx",
                                            lineNumber: 144,
                                            columnNumber: 1537
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 144,
                                columnNumber: 34
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 105,
                        columnNumber: 392
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                        children: "ScheduleSolver · Kế hoạch → Phân công → Xếp lịch → Công bố"
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 146,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 100,
                columnNumber: 5
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 93,
        columnNumber: 10
    }, this);
}
_s(Home, "ZbV52tlDpotfuSSUdOjA1ZXRb0g=");
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/rooms.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RequirementsEditor",
    ()=>RequirementsEditor,
    "RoomManager",
    ()=>RoomManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const clock = (m)=>String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const minutes = (s)=>{
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
};
const values = (s)=>s.split(",").map((x)=>x.trim()).filter(Boolean);
const empty = {
    id: "",
    name: "",
    capacity: 0,
    room_type: "",
    equipment: [],
    availability: [],
    active: true,
    allowed_departments: [],
    allowed_programs: [],
    allowed_courses: [],
    note: ""
};
function Windows({ items, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                children: "Khung khả dụng hằng tuần (không khai báo = không được dùng)"
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 11,
                columnNumber: 19
            }, this),
            items.map((w, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "editor-row",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "Thứ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: w.day,
                                    onChange: (e)=>onChange(items.map((v, j)=>j === i ? {
                                                ...v,
                                                day: Number(e.target.value)
                                            } : v)),
                                    children: Array.from({
                                        length: 7
                                    }, (_, k)=>k + 2).map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: d,
                                            children: d === 8 ? "Chủ nhật" : "Thứ " + d
                                        }, d, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 11,
                                            columnNumber: 307
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 11,
                                    columnNumber: 159
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 11,
                            columnNumber: 149
                        }, this),
                        [
                            "start",
                            "end"
                        ].map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    k === "start" ? "Từ" : "Đến",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        required: true,
                                        type: "time",
                                        value: clock(w[k]),
                                        onChange: (e)=>onChange(items.map((v, j)=>j === i ? {
                                                    ...v,
                                                    [k]: minutes(e.target.value)
                                                } : v))
                                    }, void 0, false, {
                                        fileName: "[project]/app/rooms.tsx",
                                        lineNumber: 11,
                                        columnNumber: 462
                                    }, this)
                                ]
                            }, k, true, {
                                fileName: "[project]/app/rooms.tsx",
                                lineNumber: 11,
                                columnNumber: 423
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>onChange(items.filter((_, j)=>j !== i)),
                            children: "Bỏ khung"
                        }, void 0, false, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 11,
                            columnNumber: 606
                        }, this)
                    ]
                }, i, true, {
                    fileName: "[project]/app/rooms.tsx",
                    lineNumber: 11,
                    columnNumber: 113
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>onChange([
                        ...items,
                        {
                            day: 2,
                            start: 420,
                            end: 720
                        }
                    ]),
                children: "Thêm khung để chỉnh sửa"
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 11,
                columnNumber: 704
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/rooms.tsx",
        lineNumber: 11,
        columnNumber: 9
    }, this);
}
_c = Windows;
function RoomManager({ initial, reservations, disabled, onCommand }) {
    _s();
    const [room, setRoom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(empty);
    const [formOpen, setFormOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(!initial.length);
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [booking, setBooking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        id: "",
        room_id: "",
        day: 2,
        start: "07:00",
        end: "09:00",
        reason: ""
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Phòng học & lịch chiếm dụng"
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 19,
                columnNumber: 35
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Khai báo phòng thực tế, thiết bị và thời gian được phép sử dụng. Những điều kiện này được kiểm tra khi xếp lịch."
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 19,
                columnNumber: 71
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Tìm phòng",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "search",
                        value: search,
                        onChange: (e)=>setSearch(e.target.value),
                        placeholder: "Mã phòng hoặc tên phòng…"
                    }, void 0, false, {
                        fileName: "[project]/app/rooms.tsx",
                        lineNumber: 20,
                        columnNumber: 18
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 20,
                columnNumber: 2
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "table-wrap",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        scope: "col",
                                        children: "Phòng"
                                    }, void 0, false, {
                                        fileName: "[project]/app/rooms.tsx",
                                        lineNumber: 20,
                                        columnNumber: 188
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        children: "Sức chứa"
                                    }, void 0, false, {
                                        fileName: "[project]/app/rooms.tsx",
                                        lineNumber: 20,
                                        columnNumber: 214
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        children: "Loại / thiết bị"
                                    }, void 0, false, {
                                        fileName: "[project]/app/rooms.tsx",
                                        lineNumber: 20,
                                        columnNumber: 231
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        children: "Khả dụng"
                                    }, void 0, false, {
                                        fileName: "[project]/app/rooms.tsx",
                                        lineNumber: 20,
                                        columnNumber: 255
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        children: "Thao tác"
                                    }, void 0, false, {
                                        fileName: "[project]/app/rooms.tsx",
                                        lineNumber: 20,
                                        columnNumber: 272
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/rooms.tsx",
                                lineNumber: 20,
                                columnNumber: 184
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 20,
                            columnNumber: 177
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: initial.filter((r)=>(r.id + " " + r.name).toLowerCase().includes(search.toLowerCase())).map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            children: [
                                                r.id,
                                                " · ",
                                                r.name,
                                                !r.active && " (Tạm ngưng)"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 20,
                                            columnNumber: 414
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            children: r.capacity
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 20,
                                            columnNumber: 467
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            children: [
                                                r.room_type,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                    children: r.equipment.join(", ") || "Chưa khai báo thiết bị"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/rooms.tsx",
                                                    lineNumber: 20,
                                                    columnNumber: 505
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 20,
                                            columnNumber: 488
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            children: [
                                                r.availability.length,
                                                " khung"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 20,
                                            columnNumber: 575
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    disabled: disabled,
                                                    onClick: ()=>{
                                                        setRoom(structuredClone(r));
                                                        setEditing(true);
                                                        setFormOpen(true);
                                                    },
                                                    children: [
                                                        "Sửa ",
                                                        r.id
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/rooms.tsx",
                                                    lineNumber: 20,
                                                    columnNumber: 617
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    disabled: disabled,
                                                    onClick: ()=>{
                                                        if (window.confirm("Xóa phòng " + r.id + "? Phòng đang dùng trong lịch công bố sẽ được hệ thống bảo vệ.")) void onCommand("rooms", {
                                                            rooms: initial.filter((x)=>x.id !== r.id)
                                                        });
                                                    },
                                                    children: [
                                                        "Xóa ",
                                                        r.id
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/rooms.tsx",
                                                    lineNumber: 20,
                                                    columnNumber: 744
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 20,
                                            columnNumber: 613
                                        }, this)
                                    ]
                                }, r.id, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 20,
                                    columnNumber: 399
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 20,
                            columnNumber: 302
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/rooms.tsx",
                    lineNumber: 20,
                    columnNumber: 170
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 20,
                columnNumber: 142
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                disabled: disabled,
                onClick: ()=>{
                    setRoom(structuredClone(empty));
                    setEditing(false);
                    setFormOpen(true);
                },
                children: "Nhập phòng mới"
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 21,
                columnNumber: 2
            }, this),
            formOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: (e)=>{
                    e.preventDefault();
                    void onCommand("rooms", {
                        rooms: editing ? initial.map((r)=>r.id === room.id ? room : r) : [
                            ...initial,
                            room
                        ]
                    });
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                    disabled: disabled,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                            children: editing ? "Chỉnh phòng " + room.id : "Phòng mới"
                        }, void 0, false, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 22,
                            columnNumber: 181
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "editor-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Mã phòng",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            required: true,
                                            disabled: editing,
                                            value: room.id,
                                            onChange: (e)=>setRoom({
                                                    ...room,
                                                    id: e.target.value
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 22,
                                            columnNumber: 285
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 22,
                                    columnNumber: 270
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Tên phòng",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            required: true,
                                            value: room.name,
                                            onChange: (e)=>setRoom({
                                                    ...room,
                                                    name: e.target.value
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 22,
                                            columnNumber: 412
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 22,
                                    columnNumber: 396
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Sức chứa đã xác nhận",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            required: true,
                                            type: "number",
                                            min: 1,
                                            max: 10000,
                                            value: room.capacity || "",
                                            onChange: (e)=>setRoom({
                                                    ...room,
                                                    capacity: Number(e.target.value)
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 22,
                                            columnNumber: 535
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 22,
                                    columnNumber: 508
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Loại phòng",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            required: true,
                                            placeholder: "Nhập loại đã xác nhận",
                                            value: room.room_type,
                                            onChange: (e)=>setRoom({
                                                    ...room,
                                                    room_type: e.target.value
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 22,
                                            columnNumber: 702
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 22,
                                    columnNumber: 685
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 22,
                            columnNumber: 242
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "Thiết bị (cách nhau bằng dấu phẩy)",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    defaultValue: room.equipment.join(", "),
                                    onBlur: (e)=>setRoom((r)=>({
                                                ...r,
                                                equipment: values(e.target.value)
                                            }))
                                }, room.id + "equipment" + editing, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 23,
                                    columnNumber: 43
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 23,
                            columnNumber: 2
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "Mã PROJECTOR = máy chiếu; COMPUTER = máy tính. Chỉ thêm thiết bị đã được xác nhận, kể cả mã thiết bị riêng của đơn vị."
                        }, void 0, false, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 23,
                            columnNumber: 200
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: room.active,
                                    onChange: (e)=>setRoom({
                                            ...room,
                                            active: e.target.checked
                                        })
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 24,
                                    columnNumber: 9
                                }, this),
                                " Đang được phép sử dụng"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 24,
                            columnNumber: 2
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Windows, {
                            items: room.availability,
                            onChange: (availability)=>setRoom({
                                    ...room,
                                    availability
                                })
                        }, void 0, false, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 25,
                            columnNumber: 2
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                                    children: "Điều kiện sử dụng (danh sách trống = không giới hạn)"
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 26,
                                    columnNumber: 12
                                }, this),
                                [
                                    "allowed_departments",
                                    "allowed_courses"
                                ].map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            k === "allowed_departments" ? "Mã bộ môn được dùng" : "Mã môn được dùng",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                defaultValue: room[k].join(", "),
                                                onBlur: (e)=>setRoom((r)=>({
                                                            ...r,
                                                            [k]: values(e.target.value)
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/app/rooms.tsx",
                                                lineNumber: 26,
                                                columnNumber: 241
                                            }, this)
                                        ]
                                    }, room.id + k + editing, true, {
                                        fileName: "[project]/app/rooms.tsx",
                                        lineNumber: 26,
                                        columnNumber: 142
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "editor-row",
                                    children: [
                                        "STANDARD",
                                        "CLC",
                                        "TT"
                                    ].map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: room.allowed_programs.includes(p),
                                                    onChange: (e)=>setRoom({
                                                            ...room,
                                                            allowed_programs: e.target.checked ? [
                                                                ...room.allowed_programs,
                                                                p
                                                            ] : room.allowed_programs.filter((x)=>x !== p)
                                                        })
                                                }, void 0, false, {
                                                    fileName: "[project]/app/rooms.tsx",
                                                    lineNumber: 26,
                                                    columnNumber: 439
                                                }, this),
                                                p === "CLC" ? "Chất lượng cao" : p === "TT" ? "Tiên tiến" : "Đại trà"
                                            ]
                                        }, p, true, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 26,
                                            columnNumber: 424
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 26,
                                    columnNumber: 353
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 26,
                            columnNumber: 2
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "Ghi chú cho người vận hành (không phải quy tắc tự động)",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    value: room.note,
                                    onChange: (e)=>setRoom({
                                            ...room,
                                            note: e.target.value
                                        })
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 27,
                                    columnNumber: 64
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 27,
                            columnNumber: 2
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "actions",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "primary",
                                    children: "Lưu phòng"
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 27,
                                    columnNumber: 176
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setFormOpen(false),
                                    children: "Đóng biểu mẫu"
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 27,
                                    columnNumber: 222
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 27,
                            columnNumber: 151
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/rooms.tsx",
                    lineNumber: 22,
                    columnNumber: 151
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 22,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "Lịch chiếm dụng đã xác nhận"
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 28,
                columnNumber: 2
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Mỗi mục chặn phòng hằng tuần trong học kỳ. Lịch đã công bố được bảo vệ tự động. Chỉ giải phóng một mục khi việc chiếm dụng đã kết thúc."
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 28,
                columnNumber: 38
            }, this),
            reservations.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "dept",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                r.room_id,
                                " · Thứ ",
                                r.day,
                                " · ",
                                clock(r.start),
                                "–",
                                clock(r.end),
                                " · ",
                                r.reason
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 29,
                            columnNumber: 56
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            disabled: disabled,
                            onClick: ()=>onCommand("reservation-delete", {
                                    id: r.id
                                }),
                            children: [
                                "Giải phóng ",
                                r.id
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 29,
                            columnNumber: 135
                        }, this)
                    ]
                }, r.id, true, {
                    fileName: "[project]/app/rooms.tsx",
                    lineNumber: 29,
                    columnNumber: 23
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                className: "reservation-panel",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        children: "Thêm lịch chiếm dụng"
                    }, void 0, false, {
                        fileName: "[project]/app/rooms.tsx",
                        lineNumber: 30,
                        columnNumber: 41
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: (e)=>{
                            e.preventDefault();
                            void onCommand("reservation", {
                                ...booking,
                                start: minutes(booking.start),
                                end: minutes(booking.end)
                            });
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                            disabled: disabled,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                                    children: "Thêm lịch chiếm dụng"
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 30,
                                    columnNumber: 249
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Mã chiếm dụng",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            required: true,
                                            value: booking.id,
                                            onChange: (e)=>setBooking({
                                                    ...booking,
                                                    id: e.target.value
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 30,
                                            columnNumber: 306
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 30,
                                    columnNumber: 286
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Phòng",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            required: true,
                                            value: booking.room_id,
                                            onChange: (e)=>setBooking({
                                                    ...booking,
                                                    room_id: e.target.value
                                                }),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "Chọn phòng"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/rooms.tsx",
                                                    lineNumber: 30,
                                                    columnNumber: 522
                                                }, this),
                                                initial.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: r.id,
                                                        children: r.id
                                                    }, r.id, false, {
                                                        fileName: "[project]/app/rooms.tsx",
                                                        lineNumber: 30,
                                                        columnNumber: 574
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 30,
                                            columnNumber: 419
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 30,
                                    columnNumber: 407
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Thứ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: booking.day,
                                            onChange: (e)=>setBooking({
                                                    ...booking,
                                                    day: Number(e.target.value)
                                                }),
                                            children: Array.from({
                                                length: 7
                                            }, (_, i)=>i + 2).map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: d,
                                                    children: d === 8 ? "Chủ nhật" : "Thứ " + d
                                                }, d, false, {
                                                    fileName: "[project]/app/rooms.tsx",
                                                    lineNumber: 30,
                                                    columnNumber: 786
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 30,
                                            columnNumber: 650
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 30,
                                    columnNumber: 640
                                }, this),
                                [
                                    "start",
                                    "end"
                                ].map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            k === "start" ? "Bắt đầu" : "Kết thúc",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "time",
                                                required: true,
                                                value: booking[k],
                                                onChange: (e)=>setBooking({
                                                        ...booking,
                                                        [k]: e.target.value
                                                    })
                                            }, void 0, false, {
                                                fileName: "[project]/app/rooms.tsx",
                                                lineNumber: 30,
                                                columnNumber: 951
                                            }, this)
                                        ]
                                    }, k, true, {
                                        fileName: "[project]/app/rooms.tsx",
                                        lineNumber: 30,
                                        columnNumber: 902
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Lý do đã xác nhận",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            required: true,
                                            value: booking.reason,
                                            onChange: (e)=>setBooking({
                                                    ...booking,
                                                    reason: e.target.value
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 30,
                                            columnNumber: 1091
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 30,
                                    columnNumber: 1067
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "primary",
                                    children: "Xác nhận chiếm dụng"
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 30,
                                    columnNumber: 1200
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 30,
                            columnNumber: 219
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/rooms.tsx",
                        lineNumber: 30,
                        columnNumber: 80
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 30,
                columnNumber: 2
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/rooms.tsx",
        lineNumber: 19,
        columnNumber: 9
    }, this);
}
_s(RoomManager, "Cg6HYd74MBwCD0pUWXS/HBBSnRA=");
_c1 = RoomManager;
function RequirementsEditor({ sessions, disabled, onCommand }) {
    _s1();
    const [id, setId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(""), [equipment, setEquipment] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(""), [roomType, setRoomType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(""), [primary, setPrimary] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("PROJECTOR");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Yêu cầu phòng theo lớp"
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 35,
                columnNumber: 35
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Thiết bị bổ sung và loại phòng là ràng buộc bắt buộc, cộng với yêu cầu phòng đã nhập trong kế hoạch."
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 35,
                columnNumber: 66
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: (e)=>{
                    e.preventDefault();
                    void onCommand("requirements", {
                        session: id,
                        room: primary,
                        required_equipment: values(equipment),
                        required_room_type: roomType || null
                    });
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                    disabled: disabled,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "Lớp",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    required: true,
                                    value: id,
                                    onChange: (e)=>{
                                        setId(e.target.value);
                                        const s = sessions.find((s)=>s.id === e.target.value);
                                        setEquipment(s?.required_equipment?.join(", ") ?? "");
                                        setRoomType(s?.required_room_type ?? "");
                                        setPrimary(s?.room ?? "PROJECTOR");
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: "Chọn lớp"
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 35,
                                            columnNumber: 622
                                        }, this),
                                        sessions.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: s.id,
                                                children: s.id
                                            }, s.id, false, {
                                                fileName: "[project]/app/rooms.tsx",
                                                lineNumber: 35,
                                                columnNumber: 673
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 35,
                                    columnNumber: 383
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 35,
                            columnNumber: 373
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "Thiết bị chính bắt buộc",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: primary,
                                    onChange: (e)=>setPrimary(e.target.value),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "PROJECTOR",
                                            children: "Máy chiếu"
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 35,
                                            columnNumber: 834
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "COMPUTER",
                                            children: "Máy tính"
                                        }, void 0, false, {
                                            fileName: "[project]/app/rooms.tsx",
                                            lineNumber: 35,
                                            columnNumber: 878
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 35,
                                    columnNumber: 769
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 35,
                            columnNumber: 739
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "Thiết bị bổ sung, cách nhau bằng dấu phẩy",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    value: equipment,
                                    onChange: (e)=>setEquipment(e.target.value)
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 35,
                                    columnNumber: 985
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 35,
                            columnNumber: 937
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "Loại phòng bắt buộc (trống = bất kỳ)",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    value: roomType,
                                    onChange: (e)=>setRoomType(e.target.value)
                                }, void 0, false, {
                                    fileName: "[project]/app/rooms.tsx",
                                    lineNumber: 35,
                                    columnNumber: 1105
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 35,
                            columnNumber: 1062
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            disabled: !id,
                            className: "primary",
                            children: "Lưu yêu cầu"
                        }, void 0, false, {
                            fileName: "[project]/app/rooms.tsx",
                            lineNumber: 35,
                            columnNumber: 1180
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/rooms.tsx",
                    lineNumber: 35,
                    columnNumber: 343
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/rooms.tsx",
                lineNumber: 35,
                columnNumber: 173
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/rooms.tsx",
        lineNumber: 35,
        columnNumber: 9
    }, this);
}
_s1(RequirementsEditor, "9QxxXvyIKYqIx0L0jsy+BI3hR2s=");
_c2 = RequirementsEditor;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "Windows");
__turbopack_context__.k.register(_c1, "RoomManager");
__turbopack_context__.k.register(_c2, "RequirementsEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/workspace-ui.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AssignmentPanel",
    ()=>AssignmentPanel,
    "DepartmentProgress",
    ()=>DepartmentProgress,
    "EmptyState",
    ()=>EmptyState,
    "Icon",
    ()=>Icon,
    "Metrics",
    ()=>Metrics,
    "PersonalCalendar",
    ()=>PersonalCalendar,
    "Workflow",
    ()=>Workflow,
    "clock",
    ()=>clock,
    "eligible",
    ()=>eligible
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$editors$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/editors.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
"use client";
;
;
const clock = (m)=>String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const dayName = (d)=>d === 8 ? "Chủ nhật" : "Thứ " + d;
const eligible = (s, t)=>t.department === s.department && (!t.assistant || s.kind === "TUT") && (t.capabilities[s.course]?.includes(s.kind) || s.kind === "COMBINED" && [
        "LEC",
        "TUT"
    ].every((k)=>t.capabilities[s.course]?.includes(k)));
function Icon({ name }) {
    const paths = {
        overview: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "3",
                    width: "7",
                    height: "7",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 13,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "14",
                    y: "3",
                    width: "7",
                    height: "7",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 13,
                    columnNumber: 60
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "14",
                    width: "7",
                    height: "7",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 13,
                    columnNumber: 108
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "14",
                    y: "14",
                    width: "7",
                    height: "7",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 13,
                    columnNumber: 156
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/workspace-ui.tsx",
            lineNumber: 13,
            columnNumber: 11
        }, this),
        setup: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M8 4H5a2 2 0 0 0-2 2v14h18V6a2 2 0 0 0-2-2h-3"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 14,
                    columnNumber: 10
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "8",
                    y: "2",
                    width: "8",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 14,
                    columnNumber: 67
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M7 11h10M7 15h7"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 14,
                    columnNumber: 114
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/workspace-ui.tsx",
            lineNumber: 14,
            columnNumber: 8
        }, this),
        rooms: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 21V3h14v18M2 21h20M8 7h6M8 11h6M8 15h2M14 17v4"
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 15,
                columnNumber: 10
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/workspace-ui.tsx",
            lineNumber: 15,
            columnNumber: 8
        }, this),
        assign: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "9",
                    cy: "7",
                    r: "3"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 16,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5M3 21h12"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 16,
                    columnNumber: 40
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/workspace-ui.tsx",
            lineNumber: 16,
            columnNumber: 9
        }, this),
        personal: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "5",
                    width: "18",
                    height: "16",
                    rx: "2"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 17,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3M7 18h3"
                }, void 0, false, {
                    fileName: "[project]/app/workspace-ui.tsx",
                    lineNumber: 17,
                    columnNumber: 62
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/workspace-ui.tsx",
            lineNumber: 17,
            columnNumber: 11
        }, this),
        draft: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9 3H4v18h16V3h-5M9 3v4h6V3H9M8 13l2 2 6-5M8 18h8"
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 18,
                columnNumber: 10
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/workspace-ui.tsx",
            lineNumber: 18,
            columnNumber: 8
        }, this)
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.7",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        children: paths[name] ?? paths.personal
    }, void 0, false, {
        fileName: "[project]/app/workspace-ui.tsx",
        lineNumber: 20,
        columnNumber: 9
    }, this);
}
_c = Icon;
function EmptyState({ title, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "empty-state",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                name: "setup"
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 22,
                columnNumber: 117
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: title
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 22,
                columnNumber: 137
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: children
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 22,
                columnNumber: 153
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/workspace-ui.tsx",
        lineNumber: 22,
        columnNumber: 88
    }, this);
}
_c1 = EmptyState;
function Metrics({ items }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "stats",
        children: items.map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: x.label
                    }, void 0, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 23,
                        columnNumber: 174
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        className: x.tone,
                        children: x.value
                    }, void 0, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 23,
                        columnNumber: 196
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                        children: x.detail
                    }, void 0, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 23,
                        columnNumber: 241
                    }, this)
                ]
            }, x.label, true, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 23,
                columnNumber: 151
            }, this))
    }, void 0, false, {
        fileName: "[project]/app/workspace-ui.tsx",
        lineNumber: 23,
        columnNumber: 114
    }, this);
}
_c2 = Metrics;
function Workflow({ departments, sessions, draftCount, published, navigate }) {
    const submitted = departments.length > 0 && departments.every((d)=>d.status === "SUBMITTED");
    const steps = [
        {
            title: "Kế hoạch mở lớp",
            owner: "Giáo vụ",
            done: sessions.length > 0,
            target: "setup"
        },
        {
            title: "Phân công giảng viên",
            owner: "Trưởng bộ môn",
            done: submitted,
            target: "assign"
        },
        {
            title: "Xếp & kiểm tra lịch",
            owner: "Giáo vụ",
            done: draftCount > 0,
            target: "draft"
        },
        {
            title: "Công bố & theo dõi",
            owner: "Giáo vụ → Giảng viên",
            done: published,
            target: "draft"
        }
    ];
    const current = steps.findIndex((s)=>!s.done);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card workflow",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Phối hợp trong học kỳ"
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 32,
                                columnNumber: 82
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Trạng thái bàn giao từ kế hoạch đến lịch giảng dạy."
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 32,
                                columnNumber: 112
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 32,
                        columnNumber: 77
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "badge neutral",
                        children: "4 bước nghiệp vụ"
                    }, void 0, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 32,
                        columnNumber: 176
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 32,
                columnNumber: 44
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                className: "workflow-steps",
                children: steps.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: s.done ? "complete" : current === i ? "current" : "",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>navigate(s.target),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "step-number",
                                    children: s.done ? "✓" : "0" + (i + 1)
                                }, void 0, false, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 32,
                                    columnNumber: 400
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: s.title
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 32,
                                            columnNumber: 465
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            children: s.owner
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 32,
                                            columnNumber: 481
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                            children: s.done ? "Đã có dữ liệu" : current === i ? "Cần thực hiện" : "Chưa hoàn tất"
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 32,
                                            columnNumber: 505
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 32,
                                    columnNumber: 459
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/workspace-ui.tsx",
                            lineNumber: 32,
                            columnNumber: 359
                        }, this)
                    }, s.title, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 32,
                        columnNumber: 286
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 32,
                columnNumber: 237
            }, this),
            published && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "inline-help",
                children: "Lịch đã công bố được giữ riêng. Phân công mới cần được kiểm tra lại trước lần công bố tiếp theo."
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 32,
                columnNumber: 622
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/workspace-ui.tsx",
        lineNumber: 32,
        columnNumber: 9
    }, this);
}
_c3 = Workflow;
function DepartmentProgress({ departments, sessions, staff, busy, navigate, onCommand }) {
    _s();
    const [returning, setReturning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(""), [note, setNote] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card",
        id: "department-progress",
        tabIndex: -1,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Tiến độ phân công bộ môn"
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 36,
                                columnNumber: 112
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: staff ? "Theo dõi bàn giao và phản hồi tại từng bộ môn." : "Hoàn tất phân công hợp lệ trước khi nộp cho giáo vụ."
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 36,
                                columnNumber: 145
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 36,
                        columnNumber: 107
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "badge neutral",
                        children: [
                            departments.filter((d)=>d.status === "SUBMITTED").length,
                            "/",
                            departments.length,
                            " đã nộp"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 36,
                        columnNumber: 269
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 36,
                columnNumber: 74
            }, this),
            !departments.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                title: "Chưa có bộ môn",
                children: "Nhập danh mục và kế hoạch để bắt đầu phân công."
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 36,
                columnNumber: 417
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "department-list",
                children: departments.map((d)=>{
                    const classes = sessions.filter((s)=>s.department === d.id), assigned = classes.filter((s)=>s.teacher).length;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "department-row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "department-main",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "department-avatar",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                            name: "assign"
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 38,
                                            columnNumber: 125
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 38,
                                        columnNumber: 89
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                children: d.name || d.id
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 38,
                                                columnNumber: 158
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: [
                                                    d.id,
                                                    " · ",
                                                    assigned,
                                                    "/",
                                                    classes.length,
                                                    " lớp có giảng viên"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 38,
                                                columnNumber: 181
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 38,
                                        columnNumber: 153
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "badge " + (d.status === "SUBMITTED" ? "success" : d.status === "SENT" ? "warning" : "neutral"),
                                        children: d.status === "SUBMITTED" ? "Đã nộp" : d.status === "SENT" ? d.note ? "Cần điều chỉnh" : "Đang phân công" : "Chưa gửi"
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 38,
                                        columnNumber: 256
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 38,
                                columnNumber: 56
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "progress-track",
                                "aria-label": assigned + "/" + classes.length + " lớp có giảng viên",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        width: (classes.length ? assigned / classes.length * 100 : 0) + "%"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 38,
                                    columnNumber: 566
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 38,
                                columnNumber: 472
                            }, this),
                            d.note && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "feedback",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: "Phản hồi giáo vụ:"
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 38,
                                        columnNumber: 679
                                    }, this),
                                    " ",
                                    d.note
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 38,
                                columnNumber: 655
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "department-actions",
                                children: staff ? d.status === "UNSENT" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    disabled: busy || !classes.length,
                                    onClick: ()=>onCommand("send", {
                                            department: d.id
                                        }),
                                    children: "Gửi bộ môn →"
                                }, void 0, false, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 38,
                                    columnNumber: 780
                                }, this) : d.status === "SUBMITTED" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    disabled: busy,
                                    onClick: ()=>{
                                        setReturning(returning === d.id ? "" : d.id);
                                        setNote("");
                                    },
                                    children: "Trả lại để điều chỉnh"
                                }, void 0, false, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 38,
                                    columnNumber: 916
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "Chờ Trưởng bộ môn nộp phân công"
                                }, void 0, false, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 38,
                                    columnNumber: 1039
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>navigate("assign"),
                                    children: [
                                        d.status === "SENT" ? "Tiếp tục phân công" : "Xem phân công",
                                        " →"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 38,
                                    columnNumber: 1086
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 38,
                                columnNumber: 717
                            }, this),
                            returning === d.id && d.status === "SUBMITTED" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                className: "feedback-form",
                                onSubmit: (e)=>{
                                    e.preventDefault();
                                    void onCommand("return", {
                                        department: d.id,
                                        note
                                    });
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            "Lý do trả lại ",
                                            d.name || d.id,
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                required: true,
                                                maxLength: 1000,
                                                value: note,
                                                onChange: (e)=>setNote(e.target.value),
                                                placeholder: "Nêu lớp và nội dung cần điều chỉnh…"
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 38,
                                                columnNumber: 1395
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 38,
                                        columnNumber: 1360
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "actions",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setReturning(""),
                                                children: "Hủy"
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 38,
                                                columnNumber: 1566
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "primary",
                                                disabled: busy || !note.trim(),
                                                children: "Gửi phản hồi"
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 38,
                                                columnNumber: 1631
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 38,
                                        columnNumber: 1541
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 38,
                                columnNumber: 1244
                            }, this)
                        ]
                    }, d.id, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 36,
                columnNumber: 513
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/workspace-ui.tsx",
        lineNumber: 36,
        columnNumber: 9
    }, this);
}
_s(DepartmentProgress, "pX33VtvOySGVqxNJRiZcsc1f0Lk=");
_c4 = DepartmentProgress;
function AssignmentPanel({ sessions, teachers, departments, head, busy, onCommand }) {
    _s1();
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(""), [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all"), [department, setDepartment] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [selected, setSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(""), [capabilities, setCapabilities] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("{}"), [assistant, setAssistant] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const editable = head && departments[0]?.status === "SENT";
    const invalid = (s)=>!teachers.some((t)=>t.id === s.teacher && eligible(s, t));
    const pending = sessions.filter(invalid).length;
    const filtered = sessions.filter((s)=>(!department || s.department === department) && (status === "all" || (status === "pending" ? !s.teacher : status === "invalid" ? !!s.teacher && invalid(s) : !!s.teacher && !invalid(s))) && [
            s.id,
            s.course,
            teachers.find((t)=>t.id === s.teacher)?.name ?? ""
        ].join(" ").toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
    const load = (id)=>sessions.filter((s)=>s.teacher === id).reduce((n, s)=>n + (s.periods ?? 0), 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Metrics, {
                items: [
                    {
                        label: "Lớp trong kế hoạch",
                        value: sessions.length,
                        detail: "Phạm vi bộ môn được phép xem"
                    },
                    {
                        label: "Phân công hợp lệ",
                        value: sessions.length - pending,
                        detail: "Đúng bộ môn và năng lực",
                        tone: "text-success"
                    },
                    {
                        label: "Cần hoàn tất",
                        value: pending,
                        detail: "Chưa phân công hoặc cần điều chỉnh",
                        tone: pending ? "text-warning" : ""
                    }
                ]
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 50,
                columnNumber: 2
            }, this),
            head && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "context-banner " + (editable ? "" : "subtle"),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                        name: "assign"
                    }, void 0, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 51,
                        columnNumber: 67
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                children: editable ? "Bộ môn đang tiếp nhận phân công" : departments[0]?.status === "SUBMITTED" ? "Đã nộp phân công cho giáo vụ" : "Chờ giáo vụ gửi kế hoạch"
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 51,
                                columnNumber: 93
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: editable ? "Chọn giảng viên đủ năng lực cho từng lớp, kiểm tra khối lượng rồi nộp." : "Chỉ chỉnh sửa khi giáo vụ gửi hoặc trả lại kế hoạch cho bộ môn."
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 51,
                                columnNumber: 239
                            }, this),
                            departments[0]?.note && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: "Yêu cầu điều chỉnh:"
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 51,
                                        columnNumber: 421
                                    }, this),
                                    " ",
                                    departments[0].note
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 51,
                                columnNumber: 418
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 51,
                        columnNumber: 88
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 51,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "assignment-layout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "card assignment-table",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "section-heading",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            children: "Phân công lớp học phần"
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 52,
                                            columnNumber: 118
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: head ? "Lựa chọn được lọc theo bộ môn, loại buổi và năng lực." : "Theo dõi phân công do Trưởng bộ môn thực hiện."
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 52,
                                            columnNumber: 149
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 52,
                                    columnNumber: 113
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 52,
                                columnNumber: 80
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "filters",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "search-field",
                                        children: [
                                            "Tìm lớp, môn hoặc giảng viên",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "search",
                                                placeholder: "Mã lớp, môn hoặc tên giảng viên…",
                                                value: query,
                                                onChange: (e)=>setQuery(e.target.value)
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 53,
                                                columnNumber: 87
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 53,
                                        columnNumber: 27
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            "Trạng thái",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                "aria-label": "Trạng thái",
                                                value: status,
                                                onChange: (e)=>setStatus(e.target.value),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "all",
                                                        children: "Tất cả trạng thái"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 53,
                                                        columnNumber: 321
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "pending",
                                                        children: "Chưa phân công"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 53,
                                                        columnNumber: 367
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "assigned",
                                                        children: "Đã phân công hợp lệ"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 53,
                                                        columnNumber: 414
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "invalid",
                                                        children: "Cần điều chỉnh"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 53,
                                                        columnNumber: 467
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 53,
                                                columnNumber: 234
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 53,
                                        columnNumber: 217
                                    }, this),
                                    !head && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            "Bộ môn",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                value: department,
                                                onChange: (e)=>setDepartment(e.target.value),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "",
                                                        children: "Tất cả bộ môn"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 53,
                                                        columnNumber: 623
                                                    }, this),
                                                    departments.map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: d.id,
                                                            children: d.name || d.id
                                                        }, d.id, false, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 53,
                                                            columnNumber: 682
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 53,
                                                columnNumber: 552
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 53,
                                        columnNumber: 539
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 53,
                                columnNumber: 2
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "table-wrap",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                    role: "table",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("caption", {
                                            className: "sr-only",
                                            children: [
                                                "Phân công lớp học phần, ",
                                                filtered.length,
                                                " kết quả"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 54,
                                            columnNumber: 50
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                        scope: "col",
                                                        children: "Lớp / Môn học"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 54,
                                                        columnNumber: 149
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                        scope: "col",
                                                        children: "Loại buổi"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 54,
                                                        columnNumber: 183
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                        scope: "col",
                                                        children: "Quy mô"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 54,
                                                        columnNumber: 213
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                        scope: "col",
                                                        children: "Giảng viên phụ trách"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 54,
                                                        columnNumber: 240
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                        scope: "col",
                                                        children: "Trạng thái"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 54,
                                                        columnNumber: 281
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 54,
                                                columnNumber: 145
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 54,
                                            columnNumber: 138
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                            children: filtered.map((s)=>{
                                                const candidates = teachers.filter((t)=>eligible(s, t));
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                                    children: s.course
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                                    lineNumber: 56,
                                                                    columnNumber: 28
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                    children: s.id
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                                    lineNumber: 56,
                                                                    columnNumber: 45
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 56,
                                                            columnNumber: 24
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "badge neutral",
                                                                children: {
                                                                    LEC: "Lý thuyết",
                                                                    TUT: "Thực hành",
                                                                    COMBINED: "LT + TH"
                                                                }[s.kind] ?? s.kind
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                lineNumber: 56,
                                                                columnNumber: 75
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 56,
                                                            columnNumber: 71
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            children: [
                                                                s.students,
                                                                " SV",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                    children: [
                                                                        s.periods ?? "—",
                                                                        " tiết/tuần"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                                    lineNumber: 56,
                                                                    columnNumber: 235
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 56,
                                                            columnNumber: 216
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            "data-label": "Giảng viên phụ trách",
                                                            children: head ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                        "aria-label": "Giảng viên cho " + s.id,
                                                                        disabled: busy || !editable || !candidates.length,
                                                                        value: s.teacher ?? "",
                                                                        onChange: (e)=>onCommand("assign", {
                                                                                department: s.department,
                                                                                session: s.id,
                                                                                teacher: e.target.value
                                                                            }),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: "",
                                                                                disabled: true,
                                                                                children: "Chọn giảng viên"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                                lineNumber: 56,
                                                                                columnNumber: 536
                                                                            }, this),
                                                                            s.teacher && !candidates.some((t)=>t.id === s.teacher) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: s.teacher,
                                                                                children: [
                                                                                    "Cần điều chỉnh: ",
                                                                                    teachers.find((t)=>t.id === s.teacher)?.name || s.teacher
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                                lineNumber: 56,
                                                                                columnNumber: 637
                                                                            }, this),
                                                                            candidates.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                    value: t.id,
                                                                                    children: [
                                                                                        t.name,
                                                                                        " · ",
                                                                                        load(t.id),
                                                                                        " tiết"
                                                                                    ]
                                                                                }, t.id, true, {
                                                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                                                    lineNumber: 56,
                                                                                    columnNumber: 761
                                                                                }, this))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                                        lineNumber: 56,
                                                                        columnNumber: 327
                                                                    }, this),
                                                                    !candidates.length && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                        className: "text-warning",
                                                                        children: "Chưa có GV đủ năng lực. Cập nhật năng lực bên dưới."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                                        lineNumber: 56,
                                                                        columnNumber: 862
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                lineNumber: 56,
                                                                columnNumber: 325
                                                            }, this) : teachers.find((t)=>t.id === s.teacher)?.name || s.teacher || "Chưa phân công"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 56,
                                                            columnNumber: 281
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "badge " + (invalid(s) ? "warning" : "success"),
                                                                children: !s.teacher ? "Chưa phân công" : invalid(s) ? "Cần điều chỉnh" : "Đã phân công"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                lineNumber: 56,
                                                                columnNumber: 1037
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 56,
                                                            columnNumber: 1033
                                                        }, this)
                                                    ]
                                                }, s.id, true, {
                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                    lineNumber: 56,
                                                    columnNumber: 9
                                                }, this);
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 54,
                                            columnNumber: 325
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 54,
                                    columnNumber: 30
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 54,
                                columnNumber: 2
                            }, this),
                            !filtered.length && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                                title: sessions.length ? "Không tìm thấy lớp phù hợp" : "Chưa có lớp trong kế hoạch",
                                children: sessions.length ? "Thử từ khóa khác hoặc chọn tất cả trạng thái." : "Lớp sẽ xuất hiện sau khi giáo vụ nhập kế hoạch."
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 57,
                                columnNumber: 46
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "table-footer",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: [
                                            "Hiển thị ",
                                            filtered.length,
                                            "/",
                                            sessions.length,
                                            " lớp"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 58,
                                        columnNumber: 32
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: "Thay đổi được lưu ngay sau khi chọn giảng viên."
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 58,
                                        columnNumber: 95
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 58,
                                columnNumber: 2
                            }, this),
                            head && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "assignment-submit",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                children: pending ? pending + " lớp cần hoàn tất" : "Phân công đã sẵn sàng"
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 59,
                                                columnNumber: 47
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: "Trùng giờ được kiểm tra ở bước Giáo vụ xếp lịch."
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 59,
                                                columnNumber: 115
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 59,
                                        columnNumber: 44
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "actions",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                disabled: busy || !editable || !sessions.some((s)=>!s.teacher),
                                                onClick: ()=>onCommand("balance", {
                                                        department: departments[0]?.id
                                                    }),
                                                children: "Chia đều lớp còn trống"
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 59,
                                                columnNumber: 207
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "primary",
                                                disabled: busy || !editable || !sessions.length || pending > 0,
                                                onClick: ()=>onCommand("submit", {
                                                        department: departments[0]?.id
                                                    }),
                                                children: "Nộp cho giáo vụ →"
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 59,
                                                columnNumber: 371
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 59,
                                        columnNumber: 182
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 59,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 52,
                        columnNumber: 37
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "card workload",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Khối lượng giảng dạy"
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 60,
                                columnNumber: 47
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Tổng tiết/tuần theo phân công hiện tại."
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 60,
                                columnNumber: 76
                            }, this),
                            !teachers.length && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Chưa có giảng viên."
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 60,
                                columnNumber: 141
                            }, this),
                            teachers.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "teacher-load",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                    children: t.name
                                                }, void 0, false, {
                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                    lineNumber: 60,
                                                    columnNumber: 231
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: [
                                                        load(t.id),
                                                        " ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            children: "tiết"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 60,
                                                            columnNumber: 267
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                    lineNumber: 60,
                                                    columnNumber: 246
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 60,
                                            columnNumber: 226
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            children: [
                                                sessions.filter((s)=>s.teacher === t.id).length,
                                                " lớp · ",
                                                t.assistant ? "Trợ giảng" : "Giảng viên"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 60,
                                            columnNumber: 301
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "progress-track",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    width: load(t.id) / Math.max(1, ...teachers.map((t)=>load(t.id))) * 100 + "%"
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 60,
                                                columnNumber: 438
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 60,
                                            columnNumber: 406
                                        }, this)
                                    ]
                                }, t.id, true, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 60,
                                    columnNumber: 185
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "inline-help",
                                children: "Thanh so sánh tương đối giữa các giảng viên; không biểu thị định mức vượt tải."
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 60,
                                columnNumber: 537
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 60,
                        columnNumber: 12
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 52,
                columnNumber: 2
            }, this),
            head && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                className: "card capability-panel",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        children: "Cập nhật năng lực giảng dạy"
                    }, void 0, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 61,
                        columnNumber: 52
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Khai báo môn và loại buổi giảng viên có thể phụ trách."
                    }, void 0, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 61,
                        columnNumber: 98
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                        disabled: busy || !editable,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    "Giảng viên",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: selected,
                                        onChange: (e)=>{
                                            setSelected(e.target.value);
                                            const t = teachers.find((t)=>t.id === e.target.value);
                                            setCapabilities(JSON.stringify(t?.capabilities ?? {}));
                                            setAssistant(t?.assistant ?? false);
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "Chọn giảng viên"
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 61,
                                                columnNumber: 418
                                            }, this),
                                            teachers.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: t.id,
                                                    children: t.name
                                                }, t.id, false, {
                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                    lineNumber: 61,
                                                    columnNumber: 476
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 61,
                                        columnNumber: 213
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 61,
                                columnNumber: 196
                            }, this),
                            selected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "checkbox",
                                                checked: assistant,
                                                onChange: (e)=>setAssistant(e.target.checked)
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 61,
                                                columnNumber: 564
                                            }, this),
                                            " Trợ giảng (chỉ dạy Thực hành)"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 61,
                                        columnNumber: 557
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$editors$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CapabilitiesEditor"], {
                                        value: capabilities,
                                        onChange: setCapabilities,
                                        courses: Array.from(new Set(sessions.map((s)=>s.course)))
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 61,
                                        columnNumber: 691
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "primary",
                                        onClick: ()=>onCommand("teacher", {
                                                department: departments[0]?.id,
                                                teacher: selected,
                                                assistant,
                                                capabilities: JSON.parse(capabilities)
                                            }),
                                        children: "Lưu năng lực"
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 61,
                                        columnNumber: 817
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 61,
                                columnNumber: 555
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 61,
                        columnNumber: 159
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 61,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/workspace-ui.tsx",
        lineNumber: 49,
        columnNumber: 9
    }, this);
}
_s1(AssignmentPanel, "2GORq3FrOKU35lBw5H90Dej1lpg=");
_c5 = AssignmentPanel;
const overlaps = (a, b)=>a.day === b.day && a.start < b.end && b.start < a.end;
function PersonalCalendar({ published, external }) {
    _s2();
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("week"), [source, setSource] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const events = [
        ...source === "external" ? [] : published.map((e)=>({
                ...e,
                isExternal: false
            })),
        ...source === "faculty" ? [] : external.map((e)=>({
                ...e,
                isExternal: true
            }))
    ].sort((a, b)=>a.day - b.day || a.start - b.start || a.id.localeCompare(b.id));
    const conflict = (e)=>external.some((x)=>x.id === e.id) && published.some((p)=>overlaps(p, e));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card personal-calendar",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "section-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Lịch giảng dạy chính thức"
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 69,
                                columnNumber: 91
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Lịch lặp hằng tuần trong học kỳ · giờ địa phương"
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 69,
                                columnNumber: 125
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 69,
                        columnNumber: 86
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "segmented",
                        "aria-label": "Chế độ xem lịch",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                "aria-pressed": view === "week",
                                onClick: ()=>setView("week"),
                                children: "Lịch tuần"
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 69,
                                columnNumber: 242
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                "aria-pressed": view === "list",
                                onClick: ()=>setView("list"),
                                children: "Danh sách"
                            }, void 0, false, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 69,
                                columnNumber: 327
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 69,
                        columnNumber: 186
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 69,
                columnNumber: 53
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "calendar-toolbar",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "legend",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 69,
                                        columnNumber: 488
                                    }, this),
                                    " Lịch khoa"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 69,
                                columnNumber: 482
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                        className: "external-dot"
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 69,
                                        columnNumber: 515
                                    }, this),
                                    " Lịch ngoài"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 69,
                                columnNumber: 509
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                        className: "conflict-dot"
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 69,
                                        columnNumber: 568
                                    }, this),
                                    " Cần điều chỉnh"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 69,
                                columnNumber: 562
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 69,
                        columnNumber: 458
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Nguồn lịch",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                "aria-label": "Nguồn lịch",
                                value: source,
                                onChange: (e)=>setSource(e.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "all",
                                        children: "Tất cả lịch"
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 69,
                                        columnNumber: 729
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "faculty",
                                        children: "Lịch khoa"
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 69,
                                        columnNumber: 769
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "external",
                                        children: "Lịch ngoài"
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 69,
                                        columnNumber: 811
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 69,
                                columnNumber: 642
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 69,
                        columnNumber: 625
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 69,
                columnNumber: 424
            }, this),
            !events.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                title: "Chưa có buổi học trong lựa chọn này",
                children: "Lịch khoa xuất hiện sau khi giáo vụ công bố. Đổi nguồn lịch để xem các buổi khác."
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 70,
                columnNumber: 18
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    view === "week" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "calendar-scroll",
                        tabIndex: 0,
                        "aria-label": "Lịch tuần, cuộn để xem thêm giờ",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "week-grid",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "time-column",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "day-heading",
                                            children: "Giờ"
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 71,
                                            columnNumber: 165
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "time-body",
                                            children: Array.from({
                                                length: 18
                                            }, (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        top: i * 60
                                                    },
                                                    children: clock((i + 6) * 60)
                                                }, i, false, {
                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                    lineNumber: 71,
                                                    columnNumber: 261
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 71,
                                            columnNumber: 203
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/workspace-ui.tsx",
                                    lineNumber: 71,
                                    columnNumber: 136
                                }, this),
                                Array.from({
                                    length: 7
                                }, (_, i)=>i + 2).map((day)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "week-day",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "day-heading",
                                                children: dayName(day)
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 71,
                                                columnNumber: 416
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "day",
                                                children: events.filter((e)=>e.day === day).map((event)=>{
                                                    const sameDay = events.filter((e)=>e.day === day), group = new Set([
                                                        event.id
                                                    ]);
                                                    let expanded = true;
                                                    while(expanded){
                                                        expanded = false;
                                                        for (const item of sameDay)if (!group.has(item.id) && sameDay.some((other)=>group.has(other.id) && overlaps(item, other))) {
                                                            group.add(item.id);
                                                            expanded = true;
                                                        }
                                                    }
                                                    const cluster = sameDay.filter((e)=>group.has(e.id)), lane = cluster.findIndex((e)=>e.id === event.id);
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                                        className: "calendar-event " + (event.isExternal ? "external-event " : "") + (conflict(event) ? "conflict-event" : ""),
                                                        style: {
                                                            top: event.start - 360,
                                                            height: Math.max(24, event.end - event.start),
                                                            left: "calc(" + lane / cluster.length * 100 + "% + 3px)",
                                                            width: "calc(" + 100 / cluster.length + "% - 6px)"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                                children: event.course
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                lineNumber: 75,
                                                                columnNumber: 305
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                children: [
                                                                    clock(event.start),
                                                                    "–",
                                                                    clock(event.end)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                lineNumber: 75,
                                                                columnNumber: 326
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                children: event.room_id || event.room || "Chưa có phòng"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                lineNumber: 75,
                                                                columnNumber: 380
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                children: event.institution || event.id
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                lineNumber: 75,
                                                                columnNumber: 439
                                                            }, this),
                                                            conflict(event) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                children: "Cần đổi lịch ngoài"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/workspace-ui.tsx",
                                                                lineNumber: 75,
                                                                columnNumber: 501
                                                            }, this)
                                                        ]
                                                    }, event.id, true, {
                                                        fileName: "[project]/app/workspace-ui.tsx",
                                                        lineNumber: 75,
                                                        columnNumber: 9
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/app/workspace-ui.tsx",
                                                lineNumber: 71,
                                                columnNumber: 463
                                            }, this)
                                        ]
                                    }, day, true, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 71,
                                        columnNumber: 376
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/workspace-ui.tsx",
                            lineNumber: 71,
                            columnNumber: 109
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 71,
                        columnNumber: 18
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: view === "week" ? "agenda mobile-agenda" : "agenda",
                        children: Array.from(new Set(events.map((e)=>e.day))).map((day)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: dayName(day)
                                    }, void 0, false, {
                                        fileName: "[project]/app/workspace-ui.tsx",
                                        lineNumber: 77,
                                        columnNumber: 136
                                    }, this),
                                    events.filter((e)=>e.day === day).map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                            className: conflict(e) ? "agenda-event conflict-event" : "agenda-event",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("time", {
                                                    children: [
                                                        clock(e.start),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            children: clock(e.end)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 77,
                                                            columnNumber: 308
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                    lineNumber: 77,
                                                    columnNumber: 286
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                            children: e.course
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 77,
                                                            columnNumber: 349
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            children: [
                                                                e.class_name || e.id,
                                                                " · ",
                                                                e.room_id || e.room || "Chưa có phòng"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 77,
                                                            columnNumber: 366
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            children: e.institution || "Lịch khoa chính thức"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/workspace-ui.tsx",
                                                            lineNumber: 77,
                                                            columnNumber: 440
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                    lineNumber: 77,
                                                    columnNumber: 344
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "badge " + (conflict(e) ? "warning" : e.isExternal ? "neutral" : "success"),
                                                    children: conflict(e) ? "Cần điều chỉnh" : e.isExternal ? "Lịch ngoài" : "Lịch khoa"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/workspace-ui.tsx",
                                                    lineNumber: 77,
                                                    columnNumber: 500
                                                }, this)
                                            ]
                                        }, e.id, true, {
                                            fileName: "[project]/app/workspace-ui.tsx",
                                            lineNumber: 77,
                                            columnNumber: 197
                                        }, this))
                                ]
                            }, day, true, {
                                fileName: "[project]/app/workspace-ui.tsx",
                                lineNumber: 77,
                                columnNumber: 117
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/workspace-ui.tsx",
                        lineNumber: 77,
                        columnNumber: 2
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 70,
                columnNumber: 169
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "inline-help",
                children: "Lịch khoa luôn được ưu tiên. Nếu lịch mới công bố trùng lịch ngoài, hãy xóa buổi ngoài và khai báo lại giờ phù hợp."
            }, void 0, false, {
                fileName: "[project]/app/workspace-ui.tsx",
                lineNumber: 78,
                columnNumber: 6
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/workspace-ui.tsx",
        lineNumber: 69,
        columnNumber: 9
    }, this);
}
_s2(PersonalCalendar, "fzzRz5Shxrm1EdDOrUMdqmdCtDc=");
_c6 = PersonalCalendar;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "Icon");
__turbopack_context__.k.register(_c1, "EmptyState");
__turbopack_context__.k.register(_c2, "Metrics");
__turbopack_context__.k.register(_c3, "Workflow");
__turbopack_context__.k.register(_c4, "DepartmentProgress");
__turbopack_context__.k.register(_c5, "AssignmentPanel");
__turbopack_context__.k.register(_c6, "PersonalCalendar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_1rucfwqqzyil8._.js.map