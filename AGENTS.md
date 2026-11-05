# AGENTS.md - Quy Chuẩn & Định Hướng Phát Triển Hệ Thống Dashboard 10A3

## 1. Mục Tiêu Dự Án
Xây dựng Dashboard Quản trị Lớp học Tự quản 10A3 (Mô hình Token Economy - Kinh tế Thưởng Điểm) hỗ trợ Giáo viên Chủ nhiệm và Ban cán sự lớp theo dõi, chấm điểm thi đua hàng ngày/tuần/tháng, tạo động lực bứt phá thi đua toàn trường.

## 2. Quy Chuẩn Kỹ Thuật (Strict Guidelines)
- **Ngôn ngữ Giao diện:** 100% Tiếng Việt chuẩn mực sư phạm, rõ ràng, trực quan, thân thiện với học sinh và phụ huynh.
- **JavaScript Standard:**
  - Chạy ở chế độ `'use strict';`.
  - Sử dụng chuẩn ES6+ hiện đại (Arrow functions, Destructuring, Optional chaining, Async/Await nếu cần).
  - Kiến trúc module hóa rõ ràng: State Management, Data Storage Service (LocalStorage), UI Rendering Controllers, Event Handlers.
  - Xử lý lỗi an toàn (Error Handling với try-catch và Toast notifications).
- **Styling & Giao diện:**
  - Tailwind CSS qua CDN hiện đại kèm icon Lucide/FontAwesome qua CDN SVG/CSS.
  - Phong cách thiết kế thẻ (Card-based UI), bảng màu chủ đạo Navy Blue (`#1E3A8A` / `#0F172A`) phối Trắng tinh tế, điểm nhấn Emerald Green (`#10B981`) cho điểm cộng và Crimson Red (`#EF4444`) cho điểm trừ.
  - Đáp ứng (Responsive) tốt trên màn hình máy tính bàn, laptop và máy tính bảng của giáo viên/cán sự.
- **Biểu đồ & Trực quan hóa:**
  - Chart.js cho biểu đồ cột so sánh điểm 6 tổ và biểu đồ phân bổ xếp loại.
- **Lưu trữ & Bảo mật:**
  - 100% Offline / Local Web App - Không phụ thuộc backend.
  - Dữ liệu lưu trong `window.localStorage` với khóa chuẩn hóa `dashboard10a3_students` và `dashboard10a3_logs`.
  - Cung cấp tính năng Backup/Restore dữ liệu ra định dạng JSON để giáo viên bảo toàn dữ liệu khi đổi máy hoặc xóa cache.
