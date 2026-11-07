from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.oxml.xmlchemy import OxmlElement
from pptx.dml.color import RGBColor
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'presentation'
prs=Presentation()
prs.slide_width=Inches(13.333333)
prs.slide_height=Inches(7.5)
BG,INK,MUTED,BLUE,TEAL,WHITE,LIGHT='F4F7FB','152B46','526580','245DCE','087F78','FFFFFF','E5EDFA'
outline=[]

def rect(s,x,y,w,h,color):
 q=s.shapes.add_shape(1,Inches(x),Inches(y),Inches(w),Inches(h))
 q.fill.solid();q.fill.fore_color.rgb=RGBColor.from_string(color);q.line.fill.background();q._element.spPr.append(OxmlElement('a:effectLst'))
 return q

def txt(s,text,x,y,w,h=.5,size=22,color=INK,bold=False):
 q=s.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h))
 tf=q.text_frame;tf.word_wrap=True
 tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
 for i,line in enumerate(text.split('\n')):
  p=tf.paragraphs[0] if i==0 else tf.add_paragraph()
  p.text=line;p.font.name='DejaVu Sans';p.font.size=Pt(size);p.font.bold=bold;p.font.color.rgb=RGBColor.from_string(color);p.space_after=Pt(9)
 return q

def new(title,tag,source,notes,seconds=55):
 s=prs.slides.add_slide(prs.slide_layouts[6])
 s.background.fill.solid();s.background.fill.fore_color.rgb=RGBColor.from_string(BG)
 rect(s,.5,.43,.1,.22,TEAL);txt(s,tag.upper(),.76,.4,11,.3,11,BLUE,True)
 txt(s,title,.7,.93,11.95,1.05,29,INK,True)
 rect(s,.7,6.94,11.95,.012,'D2DCEB')
 txt(s,source,.7,7.06,11.1,.25,9,MUTED);txt(s,f'{len(prs.slides):02}',12,7.03,.5,.3,11,MUTED)
 s.notes_slide.notes_text_frame.text=notes+'\n\nNguồn: '+source
 outline.append(dict(slide=len(prs.slides),message=title,source=source,form=tag,seconds=seconds,notes=notes))
 return s

def card(s,x,y,w,h,label,body,accent=BLUE):
 rect(s,x,y,w,h,WHITE);rect(s,x,y,.055,h,accent)
 txt(s,label,x+.22,y+.22,w-.44,.7,22,accent,True)
 if body:txt(s,body,x+.22,y+1.05,w-.44,h-1.15,19)

def banner(s,text,y=6.12):
 rect(s,.7,y,11.95,.58,BLUE);txt(s,text,.93,y+.13,11.5,.34,17,WHITE,True)

def screenshot(s,name,crop):
 im=Image.open(ROOT/'verification/redesign'/name).crop(crop)
 p=OUT/(Path(name).stem+'-detail.png');im.save(p)
 w,h=im.size;fit=min(8.2/w,4.55/h)
 s.shapes.add_picture(str(p),Inches(.7),Inches(2.02),width=Inches(w*fit),height=Inches(h*fit))

def evidence(s,name,crop=None):
 im=Image.open(ROOT/'verification/full-term-simulation'/name)
 if crop:
  crop=(crop[0],crop[1],min(crop[2],im.width),min(crop[3],im.height))
  im=im.crop(crop)
 p=OUT/(Path(name).stem+'-detail.png');im.save(p)
 w,h=im.size;fit=min(8.2/w,4.42/h)
 s.shapes.add_picture(str(p),Inches(.7),Inches(2.02),width=Inches(w*fit),height=Inches(h*fit))

s=new('ScheduleSolver Web','Báo cáo dự án • 06/11/2026','README.md; AUDIT.md; verification/RESULTS.md',
'Dự án hỗ trợ phối hợp giáo vụ, trưởng bộ môn và giảng viên. Trọng tâm là quy trình có kiểm soát và lịch đáp ứng ràng buộc. Giả định bài nói tiếng Việt cho hội đồng dự án phần mềm, khoảng 15 phút. Chưa có benchmark hoặc lịch học kỳ được nghiệm thu.',35)
txt(s,'Từ kế hoạch đào tạo\nđến lịch giảng dạy có kiểm soát',.75,2.15,11.7,1.7,38,INK,True)
txt(s,'Phân công đúng năng lực · Xếp giờ và phòng · Công bố theo phiên bản',.78,4.25,11.7,.8,21,MUTED)
banner(s,'FastAPI / Python     +     Next.js / TypeScript     +     Supabase',5.63)

s=new('Một lịch hợp lệ cần nhiều hơn việc chọn giờ','01 • Bài toán','README.md; ROOM_IMPLEMENTATION.md',
'Câu hỏi thiết kế: làm sao đưa kế hoạch qua phân công đến lịch có giờ và phòng hợp lệ, trong khi mỗi vai trò chỉ tác động đúng phạm vi? Đây là động cơ thiết kế từ yêu cầu dự án, chưa có khảo sát định lượng về tiết kiệm thời gian.')
card(s,.7,2.15,3.8,3.65,'Con người','Giảng viên đủ năng lực\nPhân công đúng bộ môn\nKhông trùng giờ')
card(s,4.77,2.15,3.8,3.65,'Tài nguyên','Phòng đủ sức chứa\nĐúng thiết bị, loại phòng\nTrong giờ khả dụng',TEAL)
card(s,8.84,2.15,3.8,3.65,'Quy trình','Bàn giao có trạng thái\nKiểm tra trước công bố\nLịch sử được bảo toàn')
banner(s,'Câu hỏi: phối hợp ba vai trò để tạo và công bố lịch đáp ứng ràng buộc?')

s=new('Ba vai trò chia sẻ một quy trình rõ trách nhiệm','02 • Phạm vi sản phẩm','README.md; docs/UI_UX_REDESIGN.md',
'Giáo vụ nhập và chia lớp, quản lý phòng, gửi bộ môn, xếp lịch và công bố. Trưởng bộ môn cập nhật năng lực và phân công trong phạm vi bộ môn. Giảng viên xem lịch riêng và khai báo lịch ngoài sau công bố. Giảng viên được phân công trước khi chạy solver.')
card(s,.7,2.15,3.8,3.65,'Giáo vụ / STAFF','Kế hoạch và phòng học\nTheo dõi tiến độ bộ môn\nXếp lịch, sửa nháp, công bố')
card(s,4.77,2.15,3.8,3.65,'Trưởng bộ môn','Khai báo năng lực\nPhân công giảng viên\nNộp hoặc nộp lại',TEAL)
card(s,8.84,2.15,3.8,3.65,'Giảng viên','Lịch giảng dạy cá nhân\nKhai báo lịch ngoài\nĐiều chỉnh khi xung đột')
banner(s,'Quyền và phạm vi dữ liệu được kiểm tra tại backend.')

s=new('Bàn giao theo trạng thái trước khi chạy solver','03 • Luồng nghiệp vụ','docs/UI_UX_REDESIGN.md; backend/app/domain.py',
'UNSENT chưa giao; SENT cho phép trưởng bộ môn sửa; SUBMITTED khóa sửa. Giáo vụ trả riêng một bộ môn kèm lý do về SENT. Chỉ khi các bộ môn nộp hợp lệ, có khung giờ và phòng mới chạy solver. Công bố yêu cầu hard bằng 0.')
steps=[('1. Nhập kế hoạch','Giáo vụ\nUNSENT'),('2. Gửi bộ môn','Giáo vụ → TBM\nSENT'),('3. Phân công','TBM nộp\nSUBMITTED'),('4. Xếp, kiểm tra','Giờ + phòng\nBản nháp'),('5. Công bố','hard = 0\nSnapshot')]
for i,(a,b) in enumerate(steps):
 x=.7+i*2.45;rect(s,x,2.45,2.15,2.6,WHITE)
 txt(s,a,x+.16,2.7,1.85,.95,18,BLUE,True);txt(s,b,x+.16,3.85,1.85,1,17)
 if i<4:txt(s,'→',x+2.18,3.3,.3,.5,23,TEAL,True)
txt(s,'Trả riêng bộ môn kèm lý do → sửa phân công → nộp lại',.95,5.55,11.5,.7,23,TEAL,True)

s=new('Kế hoạch 67 dòng được chuyển thành 290 buổi học','04 • Dữ liệu đầu vào','data/fall2026/README.md; ROOM_IMPLEMENTATION.md; verification/RESULTS.md',
'Số liệu mô tả phạm vi dữ liệu đã nhập và kiểm chứng, không phải số buổi đã xếp lịch thành công. Nguồn chính là ke_hoach_mo_lop_HK1_2026.xlsx được duyệt; không trộn dữ liệu FIT tham khảo. 42 STANDARD + 13 CLC + 12 TT = 67 offering. Giữ 4 cờ học liền và 2 dòng chỉ định số lớp.')
for x,num,label in [(1.,'67','dòng kế hoạch'),(4.9,'290','buổi sau chia lớp'),(9.1,'35','GV trong catalog')]:
 txt(s,num,x,2.2,3.2,1.1,62,BLUE,True);txt(s,label,x,3.45,3.3,.65,20,MUTED)
card(s,.7,4.45,5.85,1.4,'42 STANDARD · 13 CLC · 12 TT','',TEAL)
card(s,6.8,4.45,5.85,1.4,'4 bộ môn trong catalog','')
banner(s,'Giữ nguồn từng dòng, cờ học liền, phòng Lec/Tut và số nhóm chỉ định.')

s=new('Backend kiểm soát nghiệp vụ, dữ liệu và quyền','05 • Kiến trúc','README.md; AUDIT.md; backend/app/auth.py; backend/app/storage.py',
'Browser gọi Supabase Auth để đăng nhập, FastAPI để làm nghiệp vụ. Backend xác thực token qua Supabase /user và lấy vai trò từ DB. Browser không truy cập schema schedule_web. Mỗi workspace lưu aggregate JSONB; profiles, publications và audit_log là bảng riêng.')
card(s,.7,2.2,3.3,2.85,'Next.js','Giao diện theo vai trò\nTypeScript\nLịch tuần và biểu mẫu')
card(s,5.,2.2,3.3,2.85,'FastAPI','Auth và nghiệp vụ\nSolver + evaluation\nNhập / xuất Excel',TEAL)
card(s,9.3,2.2,3.3,2.85,'PostgreSQL','Workspace JSONB\nProfile và snapshot\nAudit log')
txt(s,'API→',4.12,3.2,.8,.5,17,BLUE,True);txt(s,'SQL→',8.4,3.2,.8,.5,17,BLUE,True)
rect(s,.7,5.4,11.9,.85,LIGHT);txt(s,'Supabase Auth: browser đăng nhập → token → backend xác thực',.98,5.63,11.3,.5,21,BLUE,True)

s=new('Phòng cụ thể là tài nguyên bắt buộc của mỗi buổi','06 • Mô hình ràng buộc','ROOM_IMPLEMENTATION.md; backend/app/domain.py',
'Placement gồm buổi, khung giờ và room_id; giảng viên đã được phân công. Phòng phải hoạt động, đủ chỗ, đúng thiết bị/loại/điều kiện và chứa toàn buổi trong một khung khả dụng. Không suy ra phòng từ TKB tham khảo. Soft có trọng số nguyên 0–1000, mặc định 1; hard luôn ưu tiên.')
card(s,.7,2.1,5.85,3.65,'Ràng buộc cứng','Không trùng GV / phòng\nĐủ chỗ, đúng thiết bị và điều kiện\nGiờ, thời lượng, khả dụng hợp lệ\nTôn trọng lịch chiếm dụng')
card(s,6.8,2.1,5.85,3.65,'Ưu tiên mềm','Hạn chế thứ bảy và buổi tối\nHạn chế ngày chỉ một lớp\nGiảm vượt trần tiết/ngày\nGiảm phút trống của giảng viên',TEAL)
banner(s,'6 máy chiếu + 11 máy tính · Chỉ công bố khi hard = 0 · Soft không bỏ qua hard.')

s=new('Ba chiến lược cùng tìm kiếm cặp giờ và phòng','07 • Thuật toán','backend/app/domain.py: placement_domains, solve_worker, solve',
'Mỗi worker khởi tạo tham lam có xét xung đột: ưu tiên lớp có nhiều ràng buộc, dài và miền nhỏ; seed quyết định tie-break. Mỗi bước tiếp theo đổi placement của một buổi. HC nhận điểm tốt hơn. SA có thể nhận soft xấu hơn ở cùng hard theo nhiệt độ, không nhận hard xấu hơn. Tabu có danh sách cấm 15 bước và ngoại lệ khi cải thiện best. Ba worker dùng seed+i, mặc định 42/43/44, 500 lượt mỗi worker. Ba thread chưa chứng minh tăng tốc do GIL.',75)
rect(s,.7,2.05,11.95,.65,LIGHT);txt(s,'Lọc miền giờ/phòng → Xếp lớp khó trước → Khởi tạo theo seed',.95,2.2,11.5,.4,21,BLUE,True)
for x,label,body in [(.7,'HC','Nhận bước cải thiện'),(4.77,'SA','Khám phá theo nhiệt độ'),(8.84,'Tabu','Bộ nhớ bước di chuyển')]:
 card(s,x,3.05,3.8,1.9,label,body)
banner(s,'Chọn điểm nhỏ nhất theo thứ tự (hard, soft) → đánh giá lại → trả nháp',5.35)
txt(s,'Mặc định: 500 lượt / chiến lược · Seed 42, 43, 44 · Chưa chứng minh tối ưu toàn cục',.85,6.15,11.8,.5,16,MUTED)

s=new('Lỗi tìm kiếm được tách khỏi kết luận vô nghiệm','08 • Độ tin cậy','ROOM_IMPLEMENTATION.md; backend/app/domain.py; AUDIT.md',
'INFEASIBLE_INPUT: một buổi có miền cặp giờ/phòng rỗng theo cấu hình hiện tại. SEARCH_EXHAUSTED: ngân sách tìm kiếm kết thúc, chưa có lịch hard=0, không chứng minh toàn bài toán vô nghiệm. HTTP 409 rollback nháp/revision. Sửa nháp và công bố đều đánh giá lại. Snapshot độc lập nháp; row lock và revision ngăn ghi đè stale.')
card(s,.7,2.15,5.85,2.9,'INFEASIBLE_INPUT','Có buổi không có cặp giờ/phòng hợp lệ.\nTrả nguyên nhân để bổ sung dữ liệu.')
card(s,6.8,2.15,5.85,2.9,'SEARCH_EXHAUSTED','Hết lượt, chưa tìm được lịch hợp lệ.\nChưa thể kết luận bài toán vô nghiệm.',TEAL)
banner(s,'Sửa nháp → chấm lại; công bố → snapshot riêng; cập nhật → revision + row lock',5.65)

s=new('Giáo vụ xem lịch của toàn bộ 290 buổi học','09 • Minh chứng: STAFF',
'verification/full-term-simulation/staff-entire-term.png; browser-results.json',
'Ảnh giao diện thật trên bộ giả lập toàn học kỳ, không phải API fixture. Màn Lịch học kỳ chứa đủ 290 ID buổi, được đối chiếu tự động với kế hoạch; lọc theo khóa, giảng viên và thứ. Ảnh trên slide trích phần đầu để đọc được; ảnh toàn trang và sáu ảnh theo ngày được bàn giao trong thư mục verification/full-term-simulation. Đã công bố vào PostgreSQL cục bộ, chưa công bố trên hosted.',55)
evidence(s,'staff-entire-term-viewport.png',(250,80,1910,1080))
txt(s,'290/290 buổi\n\nTất cả khóa học\n\n17 phòng: 6 + 11',9.35,2.55,3.0,3.1,22,BLUE,True)
txt(s,'Supabase Auth thật → FastAPI thật → PostgreSQL cục bộ · dữ liệu phòng giả lập',.75,6.52,12,.3,12,MUTED)

s=new('Trưởng bộ môn kiểm tra phân công toàn học kỳ','10 • Minh chứng: HEAD / CNPM',
'verification/full-term-simulation/head-full-term-assignment.png; browser-results.json',
'Ảnh Trưởng bộ môn CNPM trên dữ liệu thật của bộ thử nghiệm 290 buổi. Bộ môn được giáo vụ trả lại qua API thật; TBM xem 11 lớp của QuyenNV bằng bộ lọc rồi nộp lại. Các lớp của bộ môn khác vẫn nằm ngoài quyền xem và sửa. Không gọi đây là lịch toàn bộ khoa của HEAD; minh chứng là nghiệp vụ phân công trong phạm vi bộ môn.',55)
evidence(s,'head-full-term-assignment.png',(250,80,1910,1210))
txt(s,'Phạm vi: CNPM\n\nLọc QuyenNV\n\nTrả lại → nộp lại',9.35,2.55,3.0,3.1,22,BLUE,True)
txt(s,'Phân công hợp lệ theo năng lực trong bộ giả lập; 7 bổ sung có provenance riêng.',.75,6.52,12,.3,12,MUTED)

s=new('QuyenNV có đủ 11 buổi trong lịch cá nhân','11 • Minh chứng: TEACHER',
'verification/full-term-simulation/teacher-quyennv-calendar.png; browser-results.json',
'Giảng viên dùng profile QuyenNV trong database cục bộ. Tài khoản Auth demo hiện có được ánh xạ tới QuyenNV chỉ trong database thử nghiệm; không sửa profile trên hosted. Lịch cá nhân lấy từ snapshot 290 buổi đã công bố và trả đúng 11 buổi. Có ảnh tuần mở toàn bộ khung giờ, danh sách đủ 11 buổi và mobile. Slide trích vùng thứ 2–6, từ 06:00 tới sau buổi cuối 18:50, chứa đủ 11 buổi; thứ 7/chủ nhật trống được bỏ khỏi crop. Bản tuần đầy đủ ở thư mục bằng chứng.',55)
evidence(s,'teacher-quyennv-calendar.png',(0,140,1135,1000))
txt(s,'QuyenNV\n\n11 buổi / tuần\n\nGiờ, lớp và phòng',9.35,2.55,3.0,3.1,22,BLUE,True)
txt(s,'Profile demo cục bộ · tuần mở rộng và danh sách đầy đủ được bàn giao kèm ảnh.',.75,6.52,12,.3,12,MUTED)

s=new('Đủ 290 buổi, 0 lỗi cứng trên bộ giả lập 17 phòng','12 • Kết quả kiểm chứng',
'verification/full-term-simulation/browser-results.json; optimized/readiness.json; backend/tests/test_full_term.py',
'Kết quả theo một cấu hình giả lập, seed 42 và 500 lượt mỗi chiến lược. Trước sửa: SEARCH_EXHAUSTED với 52 lỗi cứng sau 169.04 giây. Sau khởi tạo có xét ràng buộc và giảm chấm lại: 290 buổi, hard=0, 106.91 giây trong lần chạy Python trực tiếp. Đây là quan sát một lần chạy, không phải benchmark tổng quát hoặc chứng minh tối ưu. Browser chạy lại qua API thật, publish và export Excel; kiểm tra độc lập từng cặp lớp, phòng, khả dụng, thiết bị và reservation.',75)
rows=[('Toàn học kỳ','290/290; hard = 0','Kế hoạch gốc + phòng giả lập 6/11'),
      ('Python trực tiếp','169.04s → 106.91s','Một cấu hình; trước: 52 lỗi, sau: 0'),
      ('Backend','45 tests passed','Thêm regression 290 buổi + oracle'),
      ('Browser thật','3 actor; 0 lỗi trang','Chỉnh phòng, nộp lại, công bố, lọc'),
      ('Frontend / Excel','Build + tsc PASS','Xuất đủ 290 dòng; lịch QuyenNV: 11')]
for i,(a,b,c) in enumerate(rows):
 y=2.12+i*.76;rect(s,.7,y,11.95,.66,WHITE if i%2==0 else LIGHT)
 txt(s,a,.9,y+.16,2.65,.4,18,INK,True);txt(s,b,3.6,y+.16,3.1,.4,17,TEAL,True);txt(s,c,6.85,y+.16,5.55,.4,16)
txt(s,'Kết quả trên bộ giả lập có ghi nguồn; không suy rộng sang mọi học kỳ.',.85,6.3,11.7,.4,17,MUTED)

s=new('Bằng chứng mới: Auth thật, API và database cục bộ','13 • Phạm vi bằng chứng',
'verification/full-term-simulation/browser-results.json; manifest.json',
'Đã kiểm chứng giao diện mới qua Chromium với Supabase Auth thật, FastAPI thật và PostgreSQL 17 Docker thật. Không mock API. Dữ liệu kế hoạch 67 dòng được giữ nguyên; số lượng phòng từ so_phong.csv. Mã/sức chứa/khả dụng phòng, reservations, khung giờ, năng lực thiếu và phân công được giả lập tường minh. Hosted database không bị sửa. Chưa nghiệm thu dữ liệu phòng và năng lực giảng viên thực tế.',65)
card(s,.7,2.15,5.85,3.65,'Đã quan sát trực tiếp','Đăng nhập thật đủ 3 actor\nLịch 290 buổi; QuyenNV: 11\nSửa phòng có lưu database\nCông bố, RBAC và xuất Excel',TEAL)
card(s,6.8,2.15,5.85,3.65,'Điều kiện của bằng chứng','PostgreSQL cục bộ riêng\n17 phòng: số lượng từ CSV\nThuộc tính và năng lực: giả lập\nHosted DB giữ nguyên')
banner(s,'Đã chạy đủ học kỳ trong môi trường giả lập; chưa nghiệm thu học kỳ thực.')

s=new('Giáo vụ có thể chỉnh phòng và các ràng buộc','14 • Cấu hình và giới hạn',
'resources/so_phong.csv; manifest.json; staff-room-constraints.png; backend/app/domain.py',
'Số lượng đúng nguồn: 6 phòng máy chiếu, 11 phòng máy tính. Mã MC01–MC06, MT01–MT11 giả lập; máy chiếu 200 chỗ, máy tính 40/48 chỗ. Hai reservation và MT11 chỉ CLC/TT được kiểm tra. Giáo vụ có thể sửa sức chứa, thiết bị, khả dụng, trạng thái và điều kiện dùng phòng; lịch công bố vẫn được bảo vệ. Trình duyệt đã thử sửa MC01 từ 200 lên 220 rồi trả về 200 và đối chiếu DB. Chưa đo tải, tối ưu toàn cục hoặc registry liên workspace.',65)
card(s,.7,2.12,5.85,3.7,'Đúng số phòng từ nguồn','6 máy chiếu · 11 máy tính\nSức chứa giả lập: 200 / 40–48\nKhả dụng sáng, chiều và tối\n2 lịch chiếm dụng được tôn trọng')
card(s,6.8,2.12,5.85,3.7,'Giáo vụ được chỉnh','Sức chứa và thiết bị\nKhung khả dụng, tạm ngưng\nĐiều kiện bộ môn / môn / chương trình\nSnapshot công bố vẫn được bảo vệ',TEAL)
banner(s,'Để vận hành thực: xác nhận thuộc tính phòng, năng lực và phân công đã giả lập.')

s=new('Đã chứng minh luồng lập lịch đầy đủ trên bộ giả lập','15 • Kết luận và thảo luận',
'verification/full-term-simulation/browser-results.json; manifest.json; optimized/readiness.json',
'Đóng góp hiện đã có bằng chứng toàn quy trình: giữ kế hoạch 67 dòng, phân 290 buổi, xếp giờ/phòng hard=0, công bố cục bộ và ba vai trò thao tác qua Auth/API/DB thật. QuyenNV có 11 buổi riêng. Sửa khởi tạo đã giải quyết thất bại được tái hiện trong cấu hình này, không bảo đảm mọi đầu vào đều giải được. Tiếp theo là thay các giả định bằng dữ liệu phòng và năng lực được duyệt, nghiệm thu và benchmark rộng hơn.',45)
for i,b in enumerate(['290/290 buổi hợp lệ với đúng 6 + 11 phòng từ nguồn','Đủ minh chứng 3 actor; lịch QuyenNV có 11 buổi','Giáo vụ chỉnh ràng buộc; lịch công bố được bảo vệ']):
 y=2.25+i*1.08;txt(s,b,.95,y,11.2,.8,25,INK,True);rect(s,.7,y+.05,.06,.5,TEAL)
banner(s,'Tiếp theo: xác nhận dữ liệu giả lập → nghiệm thu thực → benchmark nhiều cấu hình',5.82)

prs.core_properties.title='ScheduleSolver Web — Báo cáo dự án'
prs.core_properties.subject='Quy trình phân công và lập lịch giảng dạy'
prs.core_properties.author='ScheduleSolver Project'
prs.save(OUT/'ScheduleSolver_Project_VI.pptx')
(OUT/'outline.json').write_text(json.dumps(outline,ensure_ascii=False,indent=2))
md=['# ScheduleSolver Web — ghi chú trình bày','','16 slide chính, khoảng 15 phút; không có phụ lục.','','Kết quả kiểm thử trích từ tài liệu dự án, không chạy lại ứng dụng khi dựng deck.','']
for item in outline:
 md += [f"## {item['slide']:02}. {item['message']}",'',f"Thời lượng: {item['seconds']} giây. Hình thức: {item['form']}.",'',item['notes'],'',f"Nguồn: {item['source']}",'']
(OUT/'speaker-notes.md').write_text('\n'.join(md))
print(f'Saved {len(prs.slides)} slides; talk {sum(x["seconds"] for x in outline)/60:.1f} minutes')
