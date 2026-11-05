# Dashboard Quản Trị Lớp Học Tự Quản 10A3 (Phiên Bản Toàn Diện)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvynguyen-gif%2Fdashboard-lop-10a3)

- 🌐 **Demo Trực Tuyến Trên Vercel:** [https://fast-gust-izgqogj.tmp.now](https://fast-gust-izgqogj.tmp.now)
- 📦 **Mã Nguồn GitHub:** [https://github.com/vynguyen-gif/dashboard-lop-10a3](https://github.com/vynguyen-gif/dashboard-lop-10a3)

Hệ thống quản lý lớp học (Token Economy) hỗ trợ Giáo viên Chủ nhiệm và Ban cán sự lớp 10A3 bứt phá thứ hạng thi đua toàn trường.

## 🚀 Tính Năng Chính
- **Bảng Điều Khiển Tổng Quan (Dashboard):**
  - Biểu đồ cột đua Top 6 Tổ tự quản bằng Chart.js.
  - Biểu đồ Doughnut phân bổ xếp loại tháng (Tốt, Khá, Đạt, Chưa đạt).
  - Bảng vàng Top 5 học sinh xuất sắc & Cảnh báo kỷ luật / học sinh cần kèm cặp.
- **Phiếu Chấm Điểm & Ghi Nhận Nhanh (Sao đỏ & Tổ trưởng):**
  - Thao tác 3 bước: Chọn Ngày & Người ghi -> Lọc Tổ & Click chọn học sinh -> Chọn tiêu chí Điểm cộng (+)/Điểm trừ (-).
  - Tự động tính toán điểm số và cập nhật quỹ điểm 100đ/tuần.
- **Quản Trị Danh Sách Học Sinh:**
  - Quản lý 45 học sinh, phân 6 tổ, gán chức vụ (Lớp trưởng, Bí thư, Tổ trưởng, Sao đỏ...).
  - Huy hiệu nhận diện 10 học sinh diện theo dõi đặc biệt (đầu vào thấp) để kịp thời động viên, hỗ trợ.
- **Sổ Nhật Ký Thi Đua (Daily Logs):**
  - Tra cứu, lọc theo ngày/tổ/loại điểm.
  - Cho phép hủy bản ghi nếu ghi nhầm (tự động hoàn lại điểm).
- **Lưu Trữ & Khôi Phục:**
  - 100% Offline trên trình duyệt qua `window.localStorage`.
  - Hỗ trợ Xuất / Nhập dự phòng file JSON.

## 🛠️ Công Nghệ
- HTML5, CSS3, Tailwind CSS (CDN), Font Awesome 6
- Vanilla JavaScript (ES6+, Strict Mode)
- Chart.js

## 📖 Hướng Dẫn Sử Dụng
Mở trực tiếp file `index.html` bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox...).
