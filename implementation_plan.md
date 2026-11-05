# Kế Hoạch Triển Khai: Dashboard Quản Trị Lớp Học Tự Quản 10A3

## 1. Mục Tiêu & Phạm Vi
Xây dựng ứng dụng Dashboard quản lý điểm thi đua lớp 10A3 theo mô hình Token Economy:
- Sĩ số: 45 học sinh, 6 tổ, 10 học sinh diện theo dõi đặc biệt (hỗ trợ vươn lên).
- Quỹ điểm chuẩn: 100 điểm/học sinh/chu kỳ tuần.
- Lưu trữ 100% LocalStorage trên trình duyệt.

## 2. Lược Đồ Kiến Trúc & Dữ Liệu
### 2.1 Cấu trúc Dữ liệu
1. **`students`**:
   - `id`: string (UUID hoặc mã HS)
   - `fullName`: string
   - `groupNumber`: number (1-6)
   - `isSpecialSupport`: boolean (Cần theo dõi đặc biệt)
   - `role`: string (Lớp trưởng, Bí thư, Lớp phó, Tổ trưởng, Sao đỏ, Thành viên...)
   - `createdDate`: ISO string

2. **`dailyLogs`**:
   - `id`: string (UUID)
   - `date`: YYYY-MM-DD
   - `studentId`: string
   - `type`: 'bonus' | 'violation'
   - `ruleKey`: string
   - `ruleLabel`: string
   - `pointsChanged`: number (âm hoặc dương)
   - `recordedBy`: string (Tên cán sự/Sao đỏ ghi nhận)
   - `note`: string
   - `timestamp`: number

3. **Thang Điểm Quy Định**:
   - Điểm trừ: Vắng không phép (-20), Nói tục/chửi thề (-15), Chép bài/gian lận (-15), Không làm/không học bài (-10), Làm việc riêng/sử dụng điện thoại/tự ý đổi chỗ (-10), Ngủ gục/nói chuyện/ăn vặt/thiếu dụng cụ (-5), Đi muộn/sai đồng phục (-5).
   - Điểm cộng: Điểm Tốt toàn diện/Thành tích trường (+50), Cán sự hoàn thành tốt (+20), Kèm bạn yếu Toán/Lý (+10 cho cả hai), Xung phong lên bảng đúng (+10), Học sinh yếu nỗ lực (+10), Cả tổ 100% làm bài (+10/người), Hoàn thành bài/Trực nhật tự giác/Bổ sung ý kiến (+5).
   - Xếp loại: Tốt (>= 90), Khá (70 - 89), Đạt (50 - 69), Chưa đạt (< 50).

## 3. Các Phân Hệ (Modules)
1. **Layout & Navigation**: Sidebar với các mục:
   - Tổng quan Thi đua (Dashboard & Analytics)
   - Chấm điểm & Ghi nhận (Quick Scoring Form cho Sao đỏ / Tổ trưởng)
   - Sổ Nhật ký Thi đua (Audit Log & Tra cứu)
   - Quản lý Học sinh (CRUD danh sách 45 học sinh, phân tổ, gán chức vụ, đánh dấu diện hỗ trợ)
   - Sao lưu & Cài đặt (Backup JSON, Import, Khôi phục / Tạo dữ liệu mẫu)
2. **Dashboard Tổng quan**:
   - KPI Cards: Điểm trung bình lớp, Tỷ lệ Tốt/Khá, Tổng số lượt tuyên dương, Tổng số vi phạm, Nhóm cần quan tâm.
   - Biểu đồ Cột Chart.js: Xếp hạng thi đua 6 Tổ (Đua Top Tổ Xuất Sắc Nhất).
   - Biểu đồ Doughnut Chart.js: Tỷ lệ phân loại học lực/kỷ luật (Tốt, Khá, Đạt, Chưa đạt).
   - Danh sách "Vinh Danh Top Xuất Sắc" & Danh sách "Cảnh Báo Cần Hỗ Trợ Kịp Thời".
3. **Form Nhập Liệu Tối Ưu Tốc Độ**:
   - Chọn Ngày -> Lọc Tổ (1-6) -> Click chọn Học sinh (hỗ trợ chọn nhanh 1 em hoặc cả tổ) -> Chọn nhanh hành vi cộng/trừ -> Nhập người ghi chép -> Bấm Lưu tức thì với âm thanh phản hồi trực quan/Toast.
4. **Quản lý Danh sách Học sinh**:
   - Modal Thêm/Sửa học sinh.
   - Badge trực quan cho Ban Cán sự & Tag màu cam "Cần theo dõi đặc biệt".
   - Bộ lọc theo Tổ (1-6), lọc diện hỗ trợ đặc biệt, tìm kiếm theo tên.
5. **Dữ liệu Mẫu & Demo**:
   - Tự động nạp 10 học sinh mẫu ban đầu (đầy đủ các vai trò: Lớp trưởng, Bí thư, Tổ trưởng, Thành viên đặc biệt, có nhật ký điểm cộng/trừ giả lập thực tế).
   - Có nút nạp thêm hoặc khôi phục 45 học sinh chuẩn để giáo viên xem toàn cảnh cả lớp.

## 4. Lộ Trình Triển Khai
- [x] Tạo `AGENTS.md`
- [x] Tạo `implementation_plan.md`
- [ ] Xây dựng `styles.css` (Tùy chỉnh Navy/White, badge, nút bấm, hiệu ứng)
- [ ] Xây dựng `index.html` (Khung giao diện hoàn chỉnh, sidebar, các views, modals)
- [ ] Xây dựng `app.js` (Logic nghiệp vụ, CRUD, Chart.js, LocalStorage, Mock data)
- [ ] Kiểm thử hiển thị & chụp ảnh màn hình xác nhận
- [ ] Soạn thảo `walkthrough.md` hướng dẫn chi tiết cho Giáo viên Chủ nhiệm
