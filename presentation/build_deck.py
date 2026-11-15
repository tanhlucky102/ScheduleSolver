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
 tag = __import__('re').sub(r'^\d+ • ', '', tag)
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

s=new('ScheduleSolver Web','Báo cáo dự án • 08/11/2026','README.md; AUDIT.md; verification/RESULTS.md',
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

s=new('Bàn giao theo trạng thái trước khi chạy solver','03 • Luồng nghiệp vụ','docs/UI_UX_REDESIGN.md; backend/app/domain_rules.py',
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

s=new('Phòng cụ thể là tài nguyên bắt buộc của mỗi buổi','06 • Mô hình ràng buộc','ROOM_IMPLEMENTATION.md; backend/app/domain_rules.py',
'Placement gồm buổi, khung giờ và room_id; giảng viên đã được phân công. Phòng phải hoạt động, đủ chỗ, đúng thiết bị/loại/điều kiện và chứa toàn buổi trong một khung khả dụng. Không suy ra phòng từ TKB tham khảo. Soft có trọng số nguyên 0–1000, mặc định 1; hard luôn ưu tiên.')
card(s,.7,2.1,5.85,3.65,'Ràng buộc cứng','Không trùng GV / phòng\nĐủ chỗ, đúng thiết bị và điều kiện\nGiờ, thời lượng, khả dụng hợp lệ\nTôn trọng lịch chiếm dụng')
card(s,6.8,2.1,5.85,3.65,'Ưu tiên mềm','Hạn chế thứ bảy và buổi tối\nHạn chế ngày chỉ một lớp\nGiảm vượt trần tiết/ngày\nGiảm phút trống của giảng viên',TEAL)
banner(s,'Nguồn hiện tại: 25 phòng (10 máy chiếu + 14 máy tính + 1 kết hợp).')

s=new('Ba chiến lược tìm kiếm giờ và phòng','07 • Thuật toán','backend/app/solver.py; backend/app/domain_rules.py',
'Khởi tạo tham lam xếp buổi nhiều ràng buộc, dài và có miền nhỏ trước. Mỗi bước thay giờ/phòng của một buổi và so sánh điểm (H,S), ưu tiên H. HC chỉ nhận điểm tốt hơn. SA không nhận H tăng; khi H bằng nhau có thể nhận S tăng với xác suất phụ thuộc nhiệt độ giảm dần. Tabu giữ 15 bước đảo, chấp nhận bước không bị cấm kể cả khi xấu hơn, trừ khi bước cấm cải thiện best thì được phép. Các ví dụ chỉ giải thích quy tắc, không phải số liệu thực nghiệm. Bộ giải trả lịch khi H=0; chưa chứng minh tối ưu toàn cục. Các worker chạy qua thread Python nên chưa chứng minh tăng tốc CPU.',75)
rect(s,.7,2.05,11.95,.58,LIGHT)
txt(s,'Xếp buổi khó trước  →  đổi một cặp giờ/phòng  →  chấm điểm (H, S)',.95,2.18,11.4,.3,17,BLUE,True)
for x,name,rule,example,limit,accent in [
 (.7,'HC · Hill Climbing','Chỉ nhận điểm tốt hơn','(1,12) → (0,80)  ✓','Dễ kẹt ở nghiệm cục bộ',BLUE),
 (4.77,'SA · Annealing','H không tăng; S có thể tăng','(0,12) → (0,14)  ?','Phụ thuộc lịch giảm nhiệt',TEAL),
 (8.84,'Tabu Search','Nhớ 15 bước đảo gần đây','(0,12) → (0,13)  ✓*','Tốn bước kiểm tra danh sách',BLUE)]:
 rect(s,x,3.0,3.8,2.62,WHITE)
 rect(s,x,3.0,3.8,.08,accent)
 txt(s,name,x+.2,3.22,3.4,.4,20,accent,True)
 txt(s,rule,x+.2,3.79,3.4,.45,17,INK)
 txt(s,example,x+.2,4.41,3.4,.42,19,INK,True)
 rect(s,x+.18,5.05,3.44,.02,LIGHT)
 txt(s,limit,x+.2,5.17,3.4,.35,14,MUTED)
banner(s,'* Tabu nhận bước không bị cấm; cả ba giữ nghiệm tốt nhất theo (H, S).',5.98)
s=new('Related Work & Technical Contributions','Đối chiếu phương pháp','UniTime: help.unitime.org/manuals/courses-solver.html • OR-Tools: developers.google.com/optimization/cp',
'UniTime hỗ trợ lập lịch đại học với miền giờ, phòng và các ràng buộc phân bố. OR-Tools cung cấp bộ giải CP-SAT tổng quát; ứng dụng phải mô hình hóa và tích hợp nghiệp vụ. So sánh này là phân tích phạm vi, không phải thử nghiệm hiệu năng. Khoảng trống của dự án là tích hợp quy trình phân công và quy tắc dữ liệu của đơn vị; không khẳng định hệ thống khác không thể đáp ứng. Nhóm triển khai bộ đánh giá, miền placement, khởi tạo tham lam, HC/SA/Tabu và quy trình snapshot/RBAC. Các metaheuristic là phương pháp đã có; FastAPI, Next.js, Supabase, SQLAlchemy và openpyxl là thành phần tái sử dụng.',80)
rows=[('Đối tượng','Điểm mạnh','Giới hạn khi áp dụng tại đơn vị'),('UniTime','Chuyên biệt lịch đại học','Cần ánh xạ dữ liệu và quy tắc cục bộ'),('OR-Tools / CP-SAT','Bộ giải ràng buộc tổng quát','Cần tự xây mô hình và quy trình web'),('ScheduleSolver','Quy trình 3 vai trò + giờ/phòng','Chưa benchmark; chưa bảo đảm tối ưu')]
for i,row in enumerate(rows):
 y=2.05+i*.62;rect(s,.7,y,11.95,.59,BLUE if i==0 else WHITE)
 for x,w,t in zip([.9,3.5,7.2],[2.4,3.5,5.1],row):txt(s,t,x,y+.12,w,.45,15,WHITE if i==0 else INK,i==0)
rect(s,.7,4.75,7.4,1.72,LIGHT)
txt(s,'Nhóm phát triển',.95,4.9,6.9,.4,20,BLUE,True)
txt(s,'Miền giờ/phòng + bộ đánh giá; khởi tạo có xét xung đột;\nquy trình phân công, kiểm tra và snapshot công bố.',.95,5.42,6.9,.9,17)
txt(s,'Kế thừa',8.45,4.9,3.9,.4,20,TEAL,True)
txt(s,'HC / SA / Tabu đã có\nFastAPI · Next.js · Supabase',8.45,5.42,4.1,.9,17)

s=new('Giáo vụ xem lịch của toàn bộ 290 buổi học','09 • Minh chứng: STAFF',
'verification/full-term-simulation/staff-entire-term.png; browser-results.json',
'Ảnh giao diện thật trên bộ giả lập toàn học kỳ, không phải API fixture. Màn Lịch học kỳ chứa đủ 290 ID buổi, được đối chiếu tự động với kế hoạch; lọc theo khóa, giảng viên và thứ. Ảnh trên slide trích phần đầu để đọc được; ảnh toàn trang và sáu ảnh theo ngày được bàn giao trong thư mục verification/full-term-simulation. Đã công bố vào PostgreSQL cục bộ, chưa công bố trên hosted.',55)
evidence(s,'staff-entire-term-viewport.png',(250,80,1910,1080))
txt(s,'290/290 buổi\n\nTất cả khóa học\n\n17 phòng giả lập\nCấu hình thử cũ',9.35,2.55,3.0,3.1,22,BLUE,True)
txt(s,'Supabase Auth thật → FastAPI thật → PostgreSQL cục bộ · dữ liệu phòng giả lập',.75,6.52,12,.3,12,MUTED)

s=new('Trưởng bộ môn kiểm tra phân công toàn học kỳ','10 • Minh chứng: HEAD / CNPM',
'verification/full-term-simulation/head-full-term-assignment.png; browser-results.json',
'Ảnh Trưởng bộ môn CNPM trên dữ liệu thật của bộ thử nghiệm 290 buổi. Bộ môn được giáo vụ trả lại qua API thật; TBM xem 11 lớp của giảng viên mẫu bằng bộ lọc rồi nộp lại. Các lớp của bộ môn khác vẫn nằm ngoài quyền xem và sửa. Không gọi đây là lịch toàn bộ khoa của HEAD; minh chứng là nghiệp vụ phân công trong phạm vi bộ môn.',55)
evidence(s,'head-full-term-assignment.png',(250,80,1910,1210))
txt(s,'Phạm vi: CNPM\n\nLọc giảng viên mẫu\n\nTrả lại → nộp lại',9.35,2.55,3.0,3.1,22,BLUE,True)
txt(s,'Phân công hợp lệ theo năng lực trong bộ giả lập; 7 bổ sung có provenance riêng.',.75,6.52,12,.3,12,MUTED)

s=new('Giảng viên mẫu có đủ 11 buổi trong lịch cá nhân','11 • Minh chứng: TEACHER',
'verification/full-term-simulation/teacher-quyennv-calendar.png; browser-results.json',
'Giảng viên dùng profile giảng viên mẫu trong database cục bộ. Tài khoản Auth demo hiện có được ánh xạ tới giảng viên mẫu chỉ trong database thử nghiệm; không sửa profile trên hosted. Lịch cá nhân lấy từ snapshot 290 buổi đã công bố và trả đúng 11 buổi. Có ảnh tuần mở toàn bộ khung giờ, danh sách đủ 11 buổi và mobile. Slide trích vùng thứ 2–6, từ 06:00 tới sau buổi cuối 18:50, chứa đủ 11 buổi; thứ 7/chủ nhật trống được bỏ khỏi crop. Bản tuần đầy đủ ở thư mục bằng chứng.',55)
evidence(s,'teacher-quyennv-calendar.png',(0,140,1135,1000))
txt(s,'giảng viên mẫu\n\n11 buổi / tuần\n\nGiờ, lớp và phòng',9.35,2.55,3.0,3.1,22,BLUE,True)
txt(s,'Profile demo cục bộ · tuần mở rộng và danh sách đầy đủ được bàn giao kèm ảnh.',.75,6.52,12,.3,12,MUTED)

s=new('Kiểm chứng qua năm tầng','12 • Kết quả kiểm chứng',
'docs/REFACTOR_AUDIT.md; verification/full-term-simulation/README.md; backend/tests/',
'Bảng tóm tắt kết quả đã ghi trong báo cáo dự án, không phải một lần chạy kiểm thử mới khi biên tập slide. Báo cáo refactor ghi 48 backend tests đạt. Kiểm thử phòng gồm 19 bài theo tài liệu trước đó; cần phân biệt đây là nhóm con hoặc đợt kiểm thử khác, không cộng vào tổng 48. Oracle 20 lượt đối chiếu bộ đếm xung đột với cách đếm độc lập. Báo cáo tích hợp PostgreSQL dùng Docker để kiểm tra transaction, revision và rollback. Browser smoke 14 command theo báo cáo refactor dùng Auth/API fixture; thử nghiệm toàn học kỳ 290 buổi dùng Auth/API thật và database cục bộ, phòng giả lập 17 phòng. Con số 106.91 giây là một lượt Python trực tiếp, không phải benchmark chung.',75)
rows=[('Backend','48 tests đạt','Theo báo cáo refactor'),
      ('Ràng buộc phòng','19 bài đạt','Sức chứa, thiết bị, khả dụng'),
      ('Oracle','20 lượt đối chiếu','Đếm xung đột độc lập'),
      ('PostgreSQL','Tích hợp đạt','Transaction, revision, rollback'),
      ('Browser / build','14 lệnh; build đạt','Ba vai trò với Auth/API fixture')]
for i,(label,result,scope) in enumerate(rows):
 y=2.05+i*.74
 rect(s,.7,y,11.95,.66,WHITE if i%2==0 else LIGHT)
 rect(s,.7,y,.06,.66,TEAL if i%2 else BLUE)
 txt(s,label,.96,y+.15,3.2,.36,17,INK,True)
 txt(s,result,4.1,y+.15,3.0,.36,17,TEAL,True)
 txt(s,scope,7.1,y+.15,5.2,.36,16,INK)
rect(s,.7,5.89,11.95,.77,BLUE)
txt(s,'290 buổi, hard = 0: thử nghiệm riêng trên 17 phòng giả lập.',.95,6.04,11.4,.38,17,WHITE,True)
s=new('Phạm vi bằng chứng và nguồn dữ liệu','Nguồn dữ liệu • resources','resources/*.csv; ke_hoach_mo_lop_HK1_2026.xlsx; presentation/resource-audit.json',
'Đối chiếu trực tiếp resources ngày 08/11/2026: so_phong.csv có 25 phòng duy nhất, gồm 10 máy chiếu, 14 máy tính và 1 kết hợp. Hai phòng 200 chỗ, ba phòng 150 chỗ, sáu phòng 100 chỗ và 14 phòng 45 chỗ. Phòng kết hợp 206A1 có 100 chỗ, chỉ tính là một phòng vật lý. Nguồn có tên, tính chất và sức chứa; không có khung khả dụng hoặc reservation. bo_mon.csv có 4 dòng; giang_vien.csv có 35; quy_uoc_phan_cong.csv có 104 dòng quy ước, không đồng nghĩa 104 năng lực duy nhất. Lịch ngoài có 22 dòng, tất cả gia_dinh=x. Kế hoạch chính là ke_hoach_mo_lop_HK1_2026.xlsx; 67 offering và 290 buổi là kết quả chuyển đổi đã duyệt. Workbook FIT chỉ tham khảo. Kết quả 290/290, hard=0 thuộc bộ thử 17 phòng giả lập và 7 bổ sung năng lực, chưa xác minh lại trên danh mục 25 phòng. Không đưa nội dung tai_khoan.csv lên slide.',80)
rows=[('Tệp / nhóm nguồn','Dữ liệu kiểm tra được','Phạm vi sử dụng'),('so_phong.csv','25 phòng: 10 + 14 + 1 kết hợp','Có tên, loại, sức chứa; thiếu khả dụng'),('bo_mon / giang_vien','4 bộ môn / 35 giảng viên','Danh mục tham chiếu'),('quy_uoc_phan_cong.csv','104 dòng quy ước Lec/Tut','Không tự bổ sung năng lực thiếu'),('lich_truong_khac.csv','22 dòng; tất cả gia_dinh = x','Dữ liệu giả định, không phải lịch xác nhận'),('Kế hoạch mở lớp HK1','67 dòng → 290 buổi (*)','(*) Sau chuyển đổi; FIT chỉ tham khảo')]
for i,row in enumerate(rows):
 y=2.02+i*.59;rect(s,.7,y,11.95,.56,BLUE if i==0 else WHITE)
 for x,w,t in zip([.88,4.0,7.45],[2.95,3.25,5.0],row):txt(s,t,x,y+.12,w,.4,14,WHITE if i==0 else INK,i==0)
rect(s,.7,5.8,11.95,.9,LIGHT)
txt(s,'290 buổi / hard = 0: kết quả cũ với 17 phòng giả lập.\nChưa có bằng chứng chạy lại với danh mục 25 phòng hiện tại.',.95,5.95,11.4,.7,18,BLUE,True)

s=new('Từ phiên bản hiện tại đến nghiệm thu vận hành','Tiến độ và giới hạn','git f432b3e, 50fcd3d; docs/REFACTOR_AUDIT.md; README.md',
'Phiên bản hiện tại tách route, command, model/rules, solver và storage; frontend tổ chức theo feature. Đây là thay đổi cấu trúc mã, không thay hợp đồng API. Commit trước bổ sung tối ưu đánh giá nháp, skeleton loaders và preset lịch ngoài. Báo cáo refactor ghi nhận 48 tests cùng typecheck/build; smoke mới dùng Auth/API fixture, khác với lượt thử toàn học kỳ có Auth/API thật và DB cục bộ. Chưa chạy lại ứng dụng khi biên tập presentation. Hướng tiếp theo là xác nhận dữ liệu, benchmark nhiều seed, sau đó giải quyết solver đồng bộ và kiểm thử tải.',65)
items=[('01 • ĐÃ TRIỂN KHAI','Tách module nghiệp vụ và feature UI\nTối ưu đánh giá bản nháp\nTrạng thái tải và mẫu lịch ngoài'),('02 • ĐÃ KIỂM CHỨNG','48 tests theo báo cáo refactor\nTypecheck và production build đạt\nSmoke 3 vai trò bằng fixture'),('03 • CẦN HOÀN THIỆN','Kiểm chứng lại với 25 phòng nguồn\nBenchmark nhiều seed / cấu hình\nJob queue và kiểm thử tải')]
for i,(label,body) in enumerate(items):
 y=2.1+i*1.43;rect(s,.7,y,.65,.65,TEAL if i<2 else BLUE)
 txt(s,str(i+1),.88,y+.1,.35,.45,21,WHITE,True)
 txt(s,label,1.65,y+.02,4.2,.5,20,BLUE,True)
 txt(s,body,6.1,y,6.4,1.25,18)

s=new('Đã chứng minh luồng lập lịch đầy đủ trên bộ giả lập','15 • Kết luận và thảo luận',
'verification/full-term-simulation/browser-results.json; manifest.json; optimized/readiness.json',
'Đóng góp hiện đã có bằng chứng toàn quy trình: giữ kế hoạch 67 dòng, phân 290 buổi, xếp giờ/phòng hard=0 trên 17 phòng giả lập; không phải danh mục 25 phòng hiện tại, công bố cục bộ và ba vai trò thao tác qua Auth/API/DB thật. giảng viên mẫu có 11 buổi riêng. Sửa khởi tạo đã giải quyết thất bại được tái hiện trong cấu hình này, không bảo đảm mọi đầu vào đều giải được. Tiếp theo là thay các giả định bằng dữ liệu phòng và năng lực được duyệt, nghiệm thu và benchmark rộng hơn.',45)
for i,b in enumerate(['290/290 buổi hợp lệ trên cấu hình thử nghiệm cũ','Đủ minh chứng 3 actor; lịch giảng viên mẫu có 11 buổi','Giáo vụ chỉnh ràng buộc; lịch công bố được bảo vệ']):
 y=2.25+i*1.08;txt(s,b,.95,y,11.2,.8,25,INK,True);rect(s,.7,y+.05,.06,.5,TEAL)
banner(s,'Tiếp theo: chạy lại với 25 phòng nguồn → nghiệm thu → benchmark nhiều cấu hình',5.82)

prs.core_properties.title='ScheduleSolver Web — Báo cáo dự án'
prs.core_properties.subject='Quy trình phân công và lập lịch giảng dạy'
prs.core_properties.author='ScheduleSolver Project'
prs.save(OUT/'ScheduleSolver_Project_VI.pptx')
(OUT/'outline.json').write_text(json.dumps(outline,ensure_ascii=False,indent=2))
md=['# ScheduleSolver Web — ghi chú trình bày','',f'{len(prs.slides)} slide chính; có ghi chú kỹ thuật và nguồn.','','Kết quả kiểm thử trích từ tài liệu dự án, không chạy lại ứng dụng khi dựng deck.','']
for item in outline:
 md += [f"## {item['slide']:02}. {item['message']}",'',f"Thời lượng: {item['seconds']} giây. Hình thức: {item['form']}.",'',item['notes'],'',f"Nguồn: {item['source']}",'']
(OUT/'speaker-notes.md').write_text('\n'.join(md))
print(f'Saved {len(prs.slides)} slides; talk {sum(x["seconds"] for x in outline)/60:.1f} minutes')
