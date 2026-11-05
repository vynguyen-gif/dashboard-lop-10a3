# Cẩm Nang Bàn Giao & Hướng Dẫn Sử Dụng Dashboard Quản Trị Lớp 10A3

Kính gửi Thầy/Cô Chủ nhiệm Lớp 10A3,

Hệ thống **Dashboard Quản Trị Lớp Học Tự Quản 10A3 (Phiên Bản Toàn Diện - Token Economy)** đã được hoàn thiện 100%, sẵn sàng đưa vào vận hành ngay để thúc đẩy phong trào thi đua của lớp.

---

## 1. Cách Mở Ứng Dụng Trên Trình Duyệt

Hệ thống hoạt động hoàn toàn độc lập (Offline), không yêu cầu cài đặt phần mềm máy chủ hay kết nối internet.

### Cách 1: Mở trực tiếp (Nhanh nhất)
1. Mở thư mục dự án tại đường dẫn:
   `C:\Users\admin\.gemini\antigravity\scratch\dashboard-10a3\`
2. Click đúp chuột vào tệp [index.html](file:///C:/Users/admin/.gemini/antigravity/scratch/dashboard-10a3/index.html) (hoặc chuột phải chọn **Open with** &rarr; **Microsoft Edge** hoặc **Google Chrome**).

### Cách 2: Chạy Web Server Cục Bộ (Tùy chọn chia sẻ trong mạng lớp học)
Mở PowerShell tại thư mục trên và gõ:
```powershell
python -m http.server 8080
```
Sau đó truy cập: `http://localhost:8080` trên trình duyệt.

---

## 2. Cách Xóa Dữ Liệu Mẫu & Khởi Tạo Danh Sách Lớp Thật

Hệ thống đang tích hợp sẵn 10 học sinh mẫu (đầy đủ chức vụ và lịch sử điểm mô phỏng) để Thầy/Cô và Ban Cán Sự trải nghiệm thử. Khi bắt đầu áp dụng thực tế:

### Bước 1: Xóa dữ liệu mẫu
1. Trên thanh điều hướng (Sidebar bên trái), click vào mục **"Dữ Liệu & Cài Đặt"**.
2. Nhấn vào nút đỏ: **"Xóa Toàn Bộ Dữ Liệu (Reset Về Trắng)"**.
3. Chọn **OK** khi hộp thoại xác nhận hiện ra. Toàn bộ điểm số và danh sách giả lập sẽ được làm sạch hoàn toàn.

### Bước 2: Nạp Danh Sách 45 Học Sinh Lớp 10A3
Thầy/Cô có 2 lựa chọn tiện lợi:

* **Lựa chọn A (Khuyên dùng - Nhanh nhất):**
  1. Trong mục **"Dữ Liệu & Cài Đặt"**, bấm nút: **"Nạp Đầy Đủ 45 Học Sinh Lớp 10A3 (6 Tổ, 10 em diện hỗ trợ)"**.
  2. Hệ thống sẽ tự động cấu trúc chuẩn 45 học sinh chia đều cho 6 tổ, gán sẵn các chức danh (Lớp trưởng, Bí thư, Tổ trưởng...) và đánh dấu sẵn 10 học sinh diện theo dõi đặc biệt.
  3. Thầy/Cô chuyển sang tab **"Quản Lý Học Sinh"**, bấm biểu tượng cây bút <i class="fa-solid fa-pen"></i> để sửa lại Họ và Tên thật của từng em.

* **Lựa chọn B (Nhập thủ công từng em):**
  1. Vào tab **"Quản Lý Học Sinh"**.
  2. Bấm nút xanh **"+ Thêm Học Sinh"**.
  3. Điền Họ Tên, chọn Tổ (1 - 6), chức vụ và tick chọn vào ô *"Học sinh diện theo dõi đặc biệt (10 em đầu vào thấp)"* nếu thuộc nhóm cần kèm cặp.

---

## 3. Quy Trình Vận Hành Hàng Ngày Dành Cho Ban Cán Sự / Sao Đỏ

1. **Ghi Nhận Điểm Nhanh:**
   - Vào tab **"Chấm Điểm & Sao Đỏ"**.
   - **Bước 1:** Chọn ngày và nhập tên người trực (Ví dụ: *Sao đỏ Tổ 1*, *Lớp trưởng*...).
   - **Bước 2:** Bấm chọn nhanh Tổ cần chấm &rarr; Click chọn tên học sinh (có thể chọn 1 em, nhiều em hoặc chọn nút *"Chọn cả tổ"* khi cả tổ làm bài tập).
   - **Bước 3:** Click vào 1 tiêu chí điểm trong danh sách **Điểm Cộng (Xanh lá)** hoặc **Điểm Trừ (Đỏ)**.
   - Nhập ghi chú nếu có (Ví dụ: *Tiết Toán Thầy Tuấn*) &rarr; Bấm **"Ghi Nhận & Lưu"**.
   - *Hệ thống sẽ cập nhật ngay lập tức vào điểm số cá nhân và điểm trung bình của Tổ.*

2. **Xử Lý Khi Ghi Nhầm:**
   - Vào tab **"Sổ Nhật Ký Thi Đua"**.
   - Tìm kiếm lượt ghi điểm cần chỉnh sửa &rarr; Bấm biểu tượng thùng rác <i class="fa-solid fa-trash-can"></i>.
   - Hệ thống sẽ xóa bản ghi và tự động hoàn trả điểm số chuẩn xác cho học sinh.

3. **Theo Dõi & Tuyên Dương Trên Dashboard:**
   - **Bảng Vàng Thi Đua:** Tuyên dương Top 5 học sinh dẫn đầu vào mỗi tiết sinh hoạt lớp.
   - **Đua Top 6 Tổ:** Biểu đồ cột trực quan tạo không khí thi đua sôi nổi giữa các tổ.
   - **Cảnh Báo Kỷ Luật & Cần Hỗ Trợ:** Giúp GVCN phát hiện sớm học sinh bị trừ điểm hoặc học sinh diện đầu vào thấp để cử bạn kèm cặp kịp thời theo tiêu chí *"+10 điểm cho cả hai khi kèm bạn yếu"*.

---

## 4. An Toàn Dữ Liệu (Backup & Khôi Phục)
- Dữ liệu được lưu vĩnh viễn trên trình duyệt của máy tính (LocalStorage).
- **Khuyến nghị:** Vào chiều thứ Sáu hàng tuần sau tiết sinh hoạt lớp, GVCN vào tab **"Dữ Liệu & Cài Đặt"** &rarr; bấm **"Tải File Backup (.json)"** để lưu trữ một bản trên Google Drive hoặc máy tính cá nhân.
- Khi đổi máy tính hoặc dùng máy khác, chỉ cần bấm **"Khôi Phục Từ File"** và chọn tệp JSON đã lưu để tiếp tục theo dõi ngay lập tức.
