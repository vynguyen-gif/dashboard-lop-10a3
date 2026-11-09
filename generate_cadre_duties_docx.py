# -*- coding: utf-8 -*-
"""
Script tạo file Word (.docx) Bảng Phân Công Chức Trách & Nhiệm Vụ Ban Cán Sự Lớp 10A3
Chuẩn thể thức văn bản hành chính sư phạm THPT Việt Nam (Nghị định 30/2020/NĐ-CP)
"""

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    """Đặt màu nền cho cell trong bảng"""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Đặt lề trong cho cell"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_duties_document(output_path):
    doc = Document()
    
    # Thiết lập lề trang chuẩn A4 văn bản hành chính (Trên: 2cm, Dưới: 2cm, Trái: 2.5cm, Phải: 1.5cm)
    for section in doc.sections:
        section.top_margin = Inches(0.79)     # ~2.0 cm
        section.bottom_margin = Inches(0.79)  # ~2.0 cm
        section.left_margin = Inches(0.98)    # ~2.5 cm
        section.right_margin = Inches(0.59)   # ~1.5 cm

    # Thiết lập Normal style font Times New Roman 12pt
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)

    # 1. PHẦN QUỐC HIỆU & TIÊU NGỮ / TÊN ĐƠN VỊ
    header_table = doc.add_table(rows=2, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False

    # Cột 1: Đơn vị
    cell_unit = header_table.cell(0, 0)
    p_unit1 = cell_unit.paragraphs[0]
    p_unit1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_unit1.add_run("SỞ GIÁO DỤC VÀ ĐÀO TẠO\nTRƯỜNG THPT NGUYỄN BỈNH KHIÊM")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(10)
    r1.bold = True

    p_class = header_table.cell(1, 0).paragraphs[0]
    p_class.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_class = p_class.add_run("TẬP THỂ LỚP 10A3\n***")
    r_class.font.name = 'Times New Roman'
    r_class.font.size = Pt(11)
    r_class.bold = True
    r_class.font.color.rgb = RGBColor(30, 58, 138)

    # Cột 2: Quốc hiệu
    cell_nation = header_table.cell(0, 1)
    p_nat = cell_nation.paragraphs[0]
    p_nat.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_nat = p_nat.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")
    r_nat.font.name = 'Times New Roman'
    r_nat.font.size = Pt(10.5)
    r_nat.bold = True

    p_motto = header_table.cell(1, 1).paragraphs[0]
    p_motto.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_motto = p_motto.add_run("Độc lập – Tự do – Hạnh phúc\n-----------------------")
    r_motto.font.name = 'Times New Roman'
    r_motto.font.size = Pt(11)
    r_motto.bold = True
    r_motto.italic = True

    # Ngày tháng
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_date = p_date.add_run("Lớp 10A3, ngày 09 tháng 11 năm 2026")
    r_date.font.italic = True
    r_date.font.size = Pt(11)

    # 2. TIÊU ĐỀ CHÍNH
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("BẢNG PHÂN CÔNG CHỨC TRÁCH & NHIỆM VỤ")
    r_title.bold = True
    r_title.font.size = Pt(15)
    r_title.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("BAN CÁN SỰ & ĐỘI NGŨ TỰ QUẢN LỚP 10A3 - NĂM HỌC 2026 – 2027\n(Ban hành kèm theo Quy chế thi đua nội bộ & Chương trình GDPT 2018)")
    r_sub.font.size = Pt(11)
    r_sub.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Lời mở đầu căn dặn sư phạm
    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_after = Pt(10)
    p_intro.paragraph_format.line_spacing = 1.15
    r_intro = p_intro.add_run(
        "Nhằm xây dựng tập thể Lớp 10A3 kỷ cương, đoàn kết, học tập tốt, hướng tới mô hình Trường học hạnh phúc; "
        "phát huy tính tự giác, tinh thần trách nhiệm và kỹ năng lãnh đạo bản thân của từng học sinh; "
        "Giáo viên chủ nhiệm công bố và phân công chức trách, nhiệm vụ cụ thể cho từng thành viên Ban Cán Sự, "
        "đội ngũ tự quản và toàn thể học sinh lớp 10A3 như sau:"
    )
    r_intro.font.size = Pt(11)

    # 3. BẢNG PHÂN CÔNG CHI TIẾT TỪNG VAI TRÒ
    cadre_data = [
        {
            "stt": "1",
            "role": "Lớp trưởng",
            "name": "Trần Lê Hồng Nhung",
            "team": "Tổ 5",
            "duties": [
                "Chịu trách nhiệm toàn diện trước GVCN và Ban Giám hiệu về mọi mặt học tập, kỷ luật và phong trào của lớp 10A3.",
                "Đại diện tiếng nói của tập thể lớp; tiếp nhận các kế hoạch, chỉ đạo từ nhà trường và GVCN để quán triệt, đôn đốc lớp thực hiện.",
                "Điều hành 15 phút truy bài đầu giờ mỗi ngày và chủ trì tiết Sinh hoạt lớp vào cuối tuần.",
                "Phối hợp với Lớp phó, 6 Tổ trưởng, Bí thư và Sao đỏ duy trì trật tự; xử lý bước đầu các bất đồng nội bộ; báo cáo ngay cho GVCN tình huống phát sinh vượt thẩm quyền.",
                "Thực hiện chấm điểm thi đua khách quan và bảo mật mã PIN điều hành."
            ]
        },
        {
            "stt": "2",
            "role": "Lớp phó Học tập\n(Kiêm CS Vật lý)",
            "name": "Lê Văn Vũ",
            "team": "Tổ 5",
            "duties": [
                "Phụ trách nề nếp học tập, chuẩn bị bài tập về nhà và kiểm tra bài cũ 15 phút đầu giờ.",
                "Quản lý, đôn đốc mạng lưới Cán sự các bộ môn (Toán, Lý, Hóa, Sinh, Văn, Sử, Địa, Anh...); kiểm tra sổ đầu bài sau mỗi buổi học.",
                "Xây dựng và theo dõi mô hình 'Đôi bạn cùng tiến', phân công các bạn học tốt hỗ trợ bạn gặp khó khăn kiến thức.",
                "Trực tiếp phụ trách bộ môn Vật lý: chuẩn bị dụng cụ thí nghiệm, hỗ trợ giáo viên bộ môn phát/thu đề cương.",
                "Thay mặt Lớp trưởng điều hành lớp khi Lớp trưởng vắng mặt."
            ]
        },
        {
            "stt": "3",
            "role": "Lớp phó Lao động",
            "name": "Nguyễn Quốc Huy",
            "team": "Tổ 6",
            "duties": [
                "Phụ trách toàn bộ công tác vệ sinh, cảnh quan phòng học và nếp sống văn minh học đường.",
                "Lập lịch và kiểm tra tổ trực nhật mỗi ngày (quét lớp, lau bảng, đổ rác, chuẩn bị nước uống và khăn lau bàn giáo viên).",
                "Kiểm tra và chịu trách nhiệm tắt toàn bộ đèn, quạt, máy chiếu/tivi, đóng then cửa sổ và khóa cửa phòng học khi tan trường.",
                "Quản lý, điều hành lực lượng lớp tham gia các đợt lao động toàn trường do Đoàn trường hoặc GVCN phân công.",
                "Kịp thời phát hiện và báo cáo GVCN các hư hỏng về cơ sở vật chất (bàn ghế, bóng điện, quạt, cửa kính)."
            ]
        },
        {
            "stt": "4",
            "role": "Bí thư Chi đoàn",
            "name": "Tạ Thanh Ngọc Giàu",
            "team": "Tổ 4",
            "duties": [
                "Lãnh đạo Chi đoàn TNCS Hồ Chí Minh Lớp 10A3; trực tiếp liên hệ và chịu sự chỉ đạo của Ban Chấp hành Đoàn trường và GVCN.",
                "Tổ chức sinh hoạt Chi đoàn định kỳ, phát động các phong trào xung kích, văn hóa văn nghệ, thể dục thể thao, đền ơn đáp nghĩa.",
                "Quản lý sổ Chi đoàn, sổ Đoàn viên, thu nộp đoàn phí định kỳ đúng hạn.",
                "Theo dõi, phát hiện và bồi dưỡng thanh niên ưu tú trong lớp để giới thiệu kết nạp Đoàn.",
                "Cùng Lớp trưởng và Sao đỏ uốn nắn tác phong, đạo đức, xây dựng văn hóa ứng xử lành mạnh, không bạo lực học đường."
            ]
        },
        {
            "stt": "5",
            "role": "Thủ quỹ\n(Kiêm CS Lịch sử)",
            "name": "Từ Diệu Yên Diễm",
            "team": "Tổ 2",
            "duties": [
                "Quản lý thu – chi quỹ lớp theo nguyên tắc công khai, minh bạch, tiết kiệm và đúng quy định.",
                "Chi tiêu cho các hoạt động thiết yếu: nước uống đóng bình, phấn viết, giẻ lau, dụng cụ vệ sinh, photo tài liệu, thăm hỏi bạn bè ốm đau, khen thưởng thi đua tuần.",
                "Ghi chép sổ quỹ chi tiết từng khoản thu - chi (có ngày tháng, chữ ký người nhận hoặc hóa đơn kèm theo).",
                "Báo cáo công khai tài chính định kỳ hàng tháng trước tập thể lớp và nộp báo cáo cho GVCN phê duyệt.",
                "Kiêm phụ trách môn Lịch sử: nhắc nhở ôn bài, tổng hợp thắc mắc kiến thức lịch sử gửi giáo viên."
            ]
        },
        {
            "stt": "6",
            "role": "Tổ trưởng Tổ 1",
            "name": "Dương Lục Yến Vy",
            "team": "Tổ 1\n(8 HS)",
            "duties": [
                "Quản lý nề nếp, chuyên cần, trang phục của 8 thành viên Tổ 1; điểm danh đầu giờ báo Lớp trưởng.",
                "Chấm điểm thi đua hàng ngày cho tổ viên trên hệ thống Dashboard (được cấp mã PIN Tổ 1).",
                "Kiểm tra sách vở, bài tập về nhà của thành viên trong tổ trong 15 phút đầu giờ.",
                "Phân công và giám sát các bạn trong tổ thực hiện trực nhật khi đến lượt Tổ 1.",
                "Báo cáo tổng kết thi đua, nhận xét sự tiến bộ của các thành viên tổ trong tiết sinh hoạt cuối tuần."
            ]
        },
        {
            "stt": "7",
            "role": "Tổ trưởng Tổ 2\n(Kiêm CS Hóa học)",
            "name": "Nguyễn Hoàng Gia Nguyên",
            "team": "Tổ 2\n(7 HS)",
            "duties": [
                "Bao quát nề nếp, chuyên cần và thái độ học tập của 7 thành viên Tổ 2; chấm điểm thi đua tổ hàng ngày.",
                "Kiêm phụ trách môn Hóa học: liên hệ giáo viên bộ môn chuẩn bị tiết thí nghiệm, kiểm tra bài tập Hóa của lớp trước giờ học.",
                "Đôn đốc, hỗ trợ các thành viên học tập và rèn luyện; phân công trực nhật chu đáo khi đến phiên Tổ 2.",
                "Báo cáo kết quả rèn luyện tổ và gương tiến bộ cho GVCN."
            ]
        },
        {
            "stt": "8",
            "role": "Tổ trưởng Tổ 3",
            "name": "Lê Thị Kim Trúc",
            "team": "Tổ 3\n(8 HS)",
            "duties": [
                "Quản lý nề nếp, trật tự, tác phong của 8 thành viên Tổ 3; chấm điểm thi đua hàng ngày bằng mã PIN Tổ 3.",
                "Đôn đốc tổ viên học bài, làm bài nghiêm túc; quản lý các bạn ngồi tại Dãy 1 (Bàn 9 đến Bàn 12).",
                "Điều phối tổ viên trực nhật vệ sinh sạch sẽ, giữ gìn khu vực bàn ghế ngăn nắp.",
                "Tổng kết điểm số, xếp hạng thi đua nội bộ tổ và phát biểu nhận xét cuối tuần."
            ]
        },
        {
            "stt": "9",
            "role": "Tổ trưởng Tổ 4\n(Kiêm CS Tiếng Anh)",
            "name": "Võ Quốc Duy Khôi",
            "team": "Tổ 4\n(8 HS)",
            "duties": [
                "Quản lý nề nếp và chấm điểm thi đua 8 thành viên Tổ 4 hàng ngày; nhắc nhở giữ trật tự và chuyên cần.",
                "Kiêm phụ trách môn Tiếng Anh: hỗ trợ các bạn ôn từ vựng, ngữ pháp, phát đề kiểm tra, đôn đốc chuẩn bị bài trước khi giáo viên vào lớp.",
                "Chỉ đạo tổ viên trực nhật đúng quy định; báo cáo kịp thời các trường hợp vi phạm nề nếp cho GVCN."
            ]
        },
        {
            "stt": "10",
            "role": "Tổ trưởng Tổ 5\n(Kiêm CS Ngữ văn)",
            "name": "Nguyễn Ngọc Trinh",
            "team": "Tổ 5\n(7 HS)",
            "duties": [
                "Quản lý nề nếp, chuyên cần và chấm điểm thi đua 7 thành viên Tổ 5 hàng ngày.",
                "Kiêm phụ trách môn Ngữ văn: nhắc nhở soạn bài, đọc tác phẩm, thu vở bài tập nộp cho giáo viên Ngữ văn đúng hạn.",
                "Phân công tổ viên trực nhật; theo dõi, động viên các bạn học sinh có điểm rèn luyện thấp vươn lên."
            ]
        },
        {
            "stt": "11",
            "role": "Tổ trưởng Tổ 6\n(Kiêm CS Sinh học)",
            "name": "Trương Thị Mỹ Ngân",
            "team": "Tổ 6\n(7 HS)",
            "duties": [
                "Bao quát nề nếp, tác phong và chấm điểm thi đua 7 thành viên Tổ 6; quản lý trật tự khu vực cuối Dãy 2.",
                "Kiêm phụ trách môn Sinh học: liên hệ giáo viên chuẩn bị tranh ảnh, mẫu vật, đôn đốc làm bài tập Sinh học.",
                "Phân công trực nhật nghiêm túc khi đến lượt Tổ 6; nhận xét thi đua tổ vào tiết sinh hoạt cuối tuần."
            ]
        },
        {
            "stt": "12",
            "role": "Đội ngũ Sao đỏ\n(Trực tuần thi đua)",
            "name": "1. Trần Thị Ngọc Phúc (Tổ 1)\n2. Võ Bách Tùng (Tổ 3)",
            "team": "Tổ 1 & Tổ 3",
            "duties": [
                "Kiểm tra nề nếp tác phong đầu giờ của lớp: đồng phục áo trắng/áo thể dục, phù hiệu, dép quai hậu/giày, đi học đúng giờ.",
                "Theo dõi, phát hiện các trường hợp sử dụng điện thoại sai mục đích, ăn quà vặt, làm việc riêng trong giờ học.",
                "Thực hiện nhiệm vụ chấm điểm trực ban chéo giữa các chi đoàn theo lịch phân công của Ban Thi đua Đoàn trường (đảm bảo công tâm, chính xác, trung thực).",
                "Ghi chép gương người tốt, việc tốt (nhặt của rơi, giúp đỡ bạn) để đề xuất tuyên dương, cộng điểm thi đua."
            ]
        },
        {
            "stt": "13",
            "role": "Cán sự Bộ môn\n(Toán, Văn, Hóa, Sinh, Sử, Anh...)",
            "name": "• Toán: Lê Tuấn Phát Tài\n• Văn: Kim Bơ / Ngọc Trinh\n• Hóa: Hoàng Gia Nguyên\n• Sinh: Trương Thị Mỹ Ngân\n• Sử: Từ Diệu Yên Diễm\n• Anh: Võ Quốc Duy Khôi\n• Lý: Lê Văn Vũ",
            "team": "Toàn lớp",
            "duties": [
                "Là cầu nối thông tin giữa thầy/cô giáo bộ môn và tập thể học sinh lớp 10A3.",
                "Nhắc nhở cả lớp chuẩn bị đồ dùng, sách vở, hoàn thành bài tập về nhà trước mỗi tiết học chuyên môn.",
                "Thu nhận, kiểm đếm và bàn giao bài kiểm tra, vở bài tập cho thầy/cô bộ môn đúng thời hạn.",
                "Hỗ trợ giáo viên chuẩn bị máy chiếu, phòng thí nghiệm thực hành, thiết bị dạy học chuyên dụng.",
                "Nhiệt tình hướng dẫn, giải đáp cho các bạn còn vướng mắc kiến thức môn học mình phụ trách."
            ]
        },
        {
            "stt": "14",
            "role": "Toàn thể Học sinh\n(Thành viên Lớp 10A3)",
            "name": "45 học sinh Lớp 10A3",
            "team": "6 Tổ",
            "duties": [
                "Chấp hành nghiêm túc Điều lệ trường THPT, nội quy nhà trường và Quy chế thi đua nội bộ lớp 10A3.",
                "Đi học đúng giờ (có mặt trước 15 phút), mặc đồng phục chỉnh tề, giữ lễ phép với thầy cô và người lớn tuổi.",
                "Trung thực trong học tập và thi cử; tích cực thảo luận, phát biểu xây dựng bài trong các tiết học.",
                "Có ý thức giữ gìn vệ sinh chung, trực nhật đúng lịch, bảo quản bàn ghế và tài sản phòng học.",
                "Đoàn kết, yêu thương, giúp đỡ lẫn nhau; không tham gia bạo lực học đường; cam kết tiến bộ từng bước nhỏ (Baby Steps)."
            ]
        }
    ]

    # Tạo bảng danh sách
    table = doc.add_table(rows=1, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(0.4), Inches(1.3), Inches(1.4), Inches(0.8), Inches(3.4)]

    # Header row
    hdr_cells = table.rows[0].cells
    hdr_titles = ["STT", "Chức Vụ", "Họ Và Tên Học Sinh", "Đơn Vị", "Chức Trách & Nhiệm Vụ Trọng Tâm"]
    for i, title in enumerate(hdr_titles):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "1E3A8A") # Navy Blue
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=100, right=100)
        hdr_cells[i].vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        r.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    # Thêm dữ liệu các dòng
    for item in cadre_data:
        row_cells = table.add_row().cells
        
        is_even = int(item['stt']) % 2 == 0
        bg_color = "F8FAFC" if is_even else "FFFFFF"

        for idx, c in enumerate(row_cells):
            c.width = col_widths[idx]
            set_cell_background(c, bg_color)
            set_cell_margins(c, top=90, bottom=90, left=90, right=90)
            c.vertical_alignment = WD_ALIGN_VERTICAL.TOP

        # 1. STT
        p_stt = row_cells[0].paragraphs[0]
        p_stt.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_stt = p_stt.add_run(item['stt'])
        r_stt.bold = True
        r_stt.font.size = Pt(10)

        # 2. Chức vụ
        p_role = row_cells[1].paragraphs[0]
        p_role.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r_role = p_role.add_run(item['role'])
        r_role.bold = True
        r_role.font.size = Pt(10)
        r_role.font.color.rgb = RGBColor(15, 23, 42)

        # 3. Họ và tên
        p_name = row_cells[2].paragraphs[0]
        p_name.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r_name = p_name.add_run(item['name'])
        r_name.font.size = Pt(9.5)
        r_name.font.color.rgb = RGBColor(30, 41, 59)
        r_name.bold = True

        # 4. Tổ
        p_team = row_cells[3].paragraphs[0]
        p_team.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_team = p_team.add_run(item['team'])
        r_team.font.size = Pt(9.5)
        r_team.italic = True

        # 5. Nhiệm vụ
        p_duties = row_cells[4].paragraphs[0]
        p_duties.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_duties.paragraph_format.line_spacing = 1.12
        p_duties.paragraph_format.space_after = Pt(2)
        for d_idx, duty in enumerate(item['duties']):
            if d_idx > 0:
                p_item = row_cells[4].add_paragraph()
                p_item.paragraph_format.line_spacing = 1.12
                p_item.paragraph_format.space_after = Pt(2)
                r_d = p_item.add_run(f"• {duty}")
            else:
                r_d = p_duties.add_run(f"• {duty}")
            r_d.font.size = Pt(9.5)

    # 4. QUY CHẾ KHEN THƯỞNG & KỶ LUẬT ĐÍNH KÈM
    p_rule_head = doc.add_paragraph()
    p_rule_head.paragraph_format.space_before = Pt(14)
    p_rule_head.paragraph_format.space_after = Pt(4)
    r_rh = p_rule_head.add_run("CHẾ ĐỘ KHEN THƯỞNG, ĐÃI NGỘ & TRÁCH NHIỆM")
    r_rh.bold = True
    r_rh.font.size = Pt(11)
    r_rh.font.color.rgb = RGBColor(30, 58, 138)

    rules = [
        ("Khen thưởng định kỳ:", "Cán sự lớp, Tổ trưởng, Sao đỏ và Cán sự bộ môn hoàn thành xuất sắc nhiệm vụ trong tuần/tháng sẽ được cộng điểm thi đua cá nhân (+10 đến +20 điểm), được ưu tiên xếp loại Rèn luyện Xuất sắc/Tốt cuối học kỳ và được nhận phần thưởng danh dự từ Quỹ lớp."),
        ("Quyền hạn tự quản:", "Ban Cán Sự và Tổ trưởng có toàn quyền ghi nhận, chấm điểm thi đua thành viên theo thang điểm quy định; có quyền nhắc nhở và đề xuất GVCN biểu dương hoặc kiểm điểm các trường hợp cụ thể."),
        ("Xử lý trách nhiệm:", "Nếu cán sự bao che khuyết điểm, thiếu gương mẫu hoặc không hoàn thành nhiệm vụ được giao quá 02 tuần liên tiếp, lớp sẽ tiến hành góp ý trong tiết sinh hoạt và GVCN sẽ xem xét miễn nhiệm, điều chuyển vị trí phù hợp.")
    ]
    for r_title, r_desc in rules:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.space_after = Pt(3)
        p_r.paragraph_format.line_spacing = 1.15
        r_t = p_r.add_run(f"1. {r_title} ") if r_title.startswith("Khen") else (p_r.add_run(f"2. {r_title} ") if r_title.startswith("Quyền") else p_r.add_run(f"3. {r_title} "))
        r_t.bold = True
        r_t.font.size = Pt(10.5)
        r_d = p_r.add_run(r_desc)
        r_d.font.size = Pt(10.5)

    # 5. PHẦN KÝ TÊN VÀ DUYỆT CỦA CÁC BÊN
    p_sign_head = doc.add_paragraph()
    p_sign_head.paragraph_format.space_before = Pt(14)

    sign_table = doc.add_table(rows=2, cols=3)
    sign_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sign_table.autofit = False

    sign_widths = [Inches(2.4), Inches(2.3), Inches(2.6)]
    for row in sign_table.rows:
        for idx, cell in enumerate(row.cells):
            cell.width = sign_widths[idx]

    # Row 0: Chức danh
    p_s1 = sign_table.cell(0, 0).paragraphs[0]
    p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1.add_run("ĐẠI DIỆN CHI ĐOÀN\nBÍ THƯ\n(Ký và ghi rõ họ tên)")
    r_s1.bold = True
    r_s1.font.size = Pt(10)

    p_s2 = sign_table.cell(0, 1).paragraphs[0]
    p_s2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s2 = p_s2.add_run("ĐẠI DIỆN BAN CÁN SỰ\nLỚP TRƯỞNG\n(Ký và ghi rõ họ tên)")
    r_s2.bold = True
    r_s2.font.size = Pt(10)

    p_s3 = sign_table.cell(0, 2).paragraphs[0]
    p_s3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s3 = p_s3.add_run("DUYỆT CỦA GVCN\nGIÁO VIÊN CHỦ NHIỆM\n(Ký và ghi rõ họ tên)")
    r_s3.bold = True
    r_s3.font.size = Pt(10)
    r_s3.font.color.rgb = RGBColor(180, 20, 20)

    # Row 1: Khoảng trống ký tên và Tên học sinh/GV
    p_n1 = sign_table.cell(1, 0).paragraphs[0]
    p_n1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_n1.paragraph_format.space_before = Pt(45)
    r_n1 = p_n1.add_run("Tạ Thanh Ngọc Giàu")
    r_n1.bold = True
    r_n1.font.size = Pt(11)

    p_n2 = sign_table.cell(1, 1).paragraphs[0]
    p_n2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_n2.paragraph_format.space_before = Pt(45)
    r_n2 = p_n2.add_run("Trần Lê Hồng Nhung")
    r_n2.bold = True
    r_n2.font.size = Pt(11)

    p_n3 = sign_table.cell(1, 2).paragraphs[0]
    p_n3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_n3.paragraph_format.space_before = Pt(45)
    r_n3 = p_n3.add_run("Thầy/Cô Chủ Nhiệm 10A3")
    r_n3.bold = True
    r_n3.font.size = Pt(11)

    # Lưu tài liệu
    doc.save(output_path)
    print("SUCCESS: Da tao thanh cong file Word tai: " + output_path)

if __name__ == '__main__':
    out_file = os.path.join(os.getcwd(), 'Bang_Phan_Cong_Nhiem_Vu_Ban_Can_Su_Lop_10A3.docx')
    create_duties_document(out_file)
