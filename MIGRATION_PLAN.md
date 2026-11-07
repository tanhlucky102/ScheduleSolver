# Migration plan

SoT: /home/masao-1112/Documents/FALL2026_JSD/schedule_solver_BA/TAI_LIEU_PHAN_TICH_NGHIEP_VU.md

Audit: Java 21/Maven, Swing, POI, JUnit. Workspace .ssp; ClassSplitter, DepartmentService, ScheduleService; parallel HC/SA/Tabu. Code and repo docs are references only. No legacy password migration.

Stages: 1. Audit and rule comparison. 2. Python domain, Supabase schema and backend RBAC/API tests. 3. Independent Next.js TypeScript UI. 4. Env, SQL migrations and bootstrap instructions. 5. Tests/build and Supabase smoke; explicitly record unverified work.

SoT rules: assistants only Tut; heads act within department and remain teachers; all submissions valid before solving; solver preserves teacher; 0 hard errors before publish. Room compatibility/capacity/occupancy are HARD under the 2026-11-05 request; >8 periods remains SOFT. Published snapshot remains independent of draft. External conflicts use published real times.

Six open issues in SoT section 6 were sent to user; no unconfirmed workflows will be described as complete. All new files stay in Documents.

## Trạng thái sau triển khai
Các giai đoạn triển khai core đã có code và kiểm thử cục bộ; sáu câu hỏi đã được đối chiếu repo theo chỉ dẫn bổ sung của người dùng, xem AUDIT.md. Chưa nghiệm thu Supabase hosted, import workbook gốc và tương thích mẫu in tuyệt đối. Hướng dẫn chạy và giới hạn nằm trong README.md; bằng chứng kiểm chứng nằm trong verification/RESULTS.md.

2026-11-05: migration 002 for explicit rooms; approved 67-row plan converted to 290 sessions. See ROOM_IMPLEMENTATION.md.
