'use strict';

/**
 * DASHBOARD QUẢN TRỊ LỚP HỌC TỰ QUẢN 10A3
 * Kiến trúc: Vanilla JavaScript ES6+, Strict Mode, LocalStorage Persistence
 */

// ==================== HẰNG SỐ & CẤU HÌNH QUY CHẾ ====================
const STORAGE_KEYS = {
  STUDENTS: 'dashboard10a3_official_45_students_v42_clean',
  LOGS: 'dashboard10a3_official_45_logs_v10',
  LOCKED_WEEKS: 'dashboard10a3_locked_weeks_v4',
  CURRENT_ROLE: 'dashboard10a3_current_role_v2',
  AUTH_ROLES: 'dashboard10a3_authenticated_roles_v1',
  SEATING: 'dashboard10a3_official_45_seating_v42_clean'
};

const DEFAULT_PINS = {
  gvcn: '261030',        // Mã PIN GVCN nâng cao (chấp nhận cả 1030)
  cadre: '832610',       // Mã PIN Cán sự mới: 832610 (khó đoán, bảo mật cao)
  cadreAlpha: 'cs10a3@26' // Mã chữ phụ nếu muốn nhập ký tự
};

// ==================== HỆ THỐNG PHÂN QUYỀN VAI TRÒ (RBAC) ====================
const ROLES = {
  gvcn: { id: 'gvcn', label: '👑 GVCN Lớp 10A3', canScore: true, canLock: true, canReset: true, allowedGroups: 'all' },
  monitor: { id: 'monitor', label: '🎖️ Lớp trưởng (Hồng Nhung)', canScore: true, canLock: false, canReset: false, allowedGroups: 'all' },
  lead_t1: { id: 'lead_t1', label: '👤 Tổ trưởng T1 (Yến Vy)', canScore: true, canLock: false, canReset: false, allowedGroups: [1] },
  lead_t2: { id: 'lead_t2', label: '👤 Tổ trưởng T2 (Gia Nguyên)', canScore: true, canLock: false, canReset: false, allowedGroups: [2] },
  lead_t3: { id: 'lead_t3', label: '👤 Tổ trưởng T3 (Kim Trúc)', canScore: true, canLock: false, canReset: false, allowedGroups: [3] },
  lead_t4: { id: 'lead_t4', label: '👤 Tổ trưởng T4 (Duy Khôi)', canScore: true, canLock: false, canReset: false, allowedGroups: [4] },
  lead_t5: { id: 'lead_t5', label: '👤 Tổ trưởng T5 (Ngọc Trinh)', canScore: true, canLock: false, canReset: false, allowedGroups: [5] },
  lead_t6: { id: 'lead_t6', label: '👤 Tổ trưởng T6 (Mỹ Ngân)', canScore: true, canLock: false, canReset: false, allowedGroups: [6] },
  redstar_phuc: { id: 'redstar_phuc', label: '⭐ Sao đỏ (Ngọc Phúc)', canScore: true, canLock: false, canReset: false, allowedGroups: 'all' },
  redstar_tung: { id: 'redstar_tung', label: '⭐ Sao đỏ (Bách Tùng)', canScore: true, canLock: false, canReset: false, allowedGroups: 'all' },
  member: { id: 'member', label: '👁️ Học sinh (Chỉ xem)', canScore: false, canLock: false, canReset: false, allowedGroups: [] }
};

const BASE_WEEKLY_SCORE = 100;

// Thang Xếp Loại Tháng: Tốt (>= 90), Khá (70-89), Đạt (50-69), Chưa đạt (<50)
// Thang Xếp Loại: Tốt (>= 95), Khá (80-94), Đạt (60-79), Chưa đạt (<60)
const RANKING_TIERS = {
  GOOD: { label: 'Tốt', min: 95, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  FAIR: { label: 'Khá', min: 80, color: 'text-blue-700 bg-blue-50 border-blue-300' },
  PASS: { label: 'Đạt', min: 60, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  FAIL: { label: 'Chưa đạt', min: 0, color: 'text-rose-700 bg-rose-50 border-rose-300' },
  RESTRICTED: { label: 'Chưa đạt (Khống chế ⚠️)', min: 0, color: 'text-rose-900 bg-rose-100 dark:bg-rose-950/80 border-rose-500 dark:border-rose-700 font-black' }
};

// THANG ĐIỂM CỘNG
const BONUS_RULES = [
  // IV. THƯỞNG CHUYÊN CẦN & TẬP THỂ
  { key: 'bonus_class_attendance', group: 'attendance', label: 'Lớp / Tổ đi học đủ 100% cả tuần (Không vắng, không trễ)', points: 50, icon: 'fa-trophy' },
  { key: 'bonus_individual_attendance', group: 'attendance', label: 'HS đi học đủ cả tuần (Không vắng, không trễ, đúng đồng phục, tóc nghiêm túc)', points: 40, icon: 'fa-medal' },
  { key: 'bonus_full_10_lesson', group: 'lesson', label: 'Tiết học xếp loại Tốt Full 10 điểm (Cả tổ/lớp)', points: 50, icon: 'fa-crown' },
  { key: 'bonus_good_lesson', group: 'lesson', label: 'Tiết học xếp loại Tốt (Cả tổ)', points: 25, icon: 'fa-star' },

  // II. HỌC TẬP & PHÁT BIỂU
  { key: 'bonus_high_score', group: 'academic', label: 'Điểm 8, 9, 10 (Kiểm tra miệng, 15 phút, lên bảng)', points: 10, icon: 'fa-award' },
  { key: 'bonus_speech_multiple', group: 'academic', label: 'Phát biểu 3 lần trong 1 tiết học', points: 10, icon: 'fa-hand-sparkles' },
  { key: 'bonus_speech_single', group: 'academic', label: 'Phát biểu xây dựng bài (1 lần)', points: 5, icon: 'fa-lightbulb' },
  { key: 'bonus_board_solution', group: 'academic', label: 'Xung phong lên bảng giải bài đúng', points: 10, icon: 'fa-chalkboard-user' },

  // TIẾN BỘ & PHONG TRÀO
  { key: 'bonus_duty_excellent', group: 'duty', label: 'Cán sự lớp / Tổ trưởng hoàn thành xuất sắc nhiệm vụ', points: 20, icon: 'fa-user-check' },
  { key: 'bonus_paired_progress', group: 'progress', label: 'Đôi bạn cùng tiến: Cùng tiến bộ / Kèm bạn đạt kết quả tốt (+15 cho cả hai)', points: 15, icon: 'fa-handshake-angle' },
  { key: 'bonus_baby_steps', group: 'progress', label: 'Nỗ lực vi mô (Baby Steps): Hoàn thành cam kết giao ước tuần', points: 10, icon: 'fa-stairs' },
  { key: 'bonus_effort_support', group: 'progress', label: 'Học sinh diện hỗ trợ có nỗ lực làm bài', points: 10, icon: 'fa-heart-circle-bolt' },
  { key: 'bonus_group_homework', group: 'academic', label: 'Cả tổ 100% làm bài tập về nhà (+10/người)', points: 10, icon: 'fa-users' },
  { key: 'bonus_logical_consequence', group: 'progress', label: 'Tự giác khắc phục hệ quả (Trực nhật bù, làm bài bù, lao động tích cực)', points: 10, icon: 'fa-broom' }
];

// THANG ĐIỂM TRỪ
const VIOLATION_RULES = [
  // I. LỖI KHỐNG CHẾ (HẠ BẬC / CHƯA ĐẠT NGAY - ĐỀU TRỪ 50 ĐIỂM)
  { key: 'viol_cheating', group: 'restricted', isRestricted: true, label: '⚠️ [LỖI KHỐNG CHẾ] Gian lận thi cử / Chép bài kiểm tra', points: -50, icon: 'fa-file-circle-xmark' },
  { key: 'viol_fighting', group: 'restricted', isRestricted: true, label: '🚫 [LỖI KHỐNG CHẾ] Đánh nhau / Gây gổ mất đoàn kết', points: -50, icon: 'fa-hand-fist' },
  { key: 'viol_phone', group: 'restricted', isRestricted: true, label: '📱 [LỖI KHỐNG CHẾ] Sử dụng điện thoại trong giờ học không xin phép', points: -50, icon: 'fa-mobile-screen-button' },
  { key: 'viol_truancy', group: 'restricted', isRestricted: true, label: '🏃 [LỖI KHỐNG CHẾ] Trốn tiết / Vắng học không phép', points: -50, icon: 'fa-user-xmark' },
  { key: 'viol_disrespect', group: 'restricted', isRestricted: true, label: '⚡ [LỖI KHỐNG CHẾ] Nói tục, chửi thề / Vô lễ với thầy cô', points: -50, icon: 'fa-triangle-exclamation' },

  // II. HỌC TẬP & KỶ LUẬT TIẾT HỌC
  { key: 'viol_no_homework', group: 'academic', isRestricted: false, label: '📚 Không soạn bài / Không làm bài tập về nhà (1 lần)', points: -15, icon: 'fa-book-skull' },
  { key: 'viol_inattentive', group: 'academic', isRestricted: false, label: '💤 Không nghiêm túc, làm việc riêng, ngủ gục, nói chuyện', points: -15, icon: 'fa-bed' },
  { key: 'viol_low_score', group: 'academic', isRestricted: false, label: '📉 Điểm dưới 5 (Miệng / 15 phút / Giữa kỳ)', points: -15, icon: 'fa-chart-line-down' },
  { key: 'viol_seat_change', group: 'academic', isRestricted: false, label: '🔄 Tự ý đổi chỗ ngồi không xin phép', points: -20, icon: 'fa-arrows-split-up-and-left' },

  // III. CHUYÊN CẦN & NỀ NẾP
  { key: 'viol_late', group: 'conduct', isRestricted: false, label: '⏰ Đi học trễ (muộn giờ)', points: -15, icon: 'fa-clock' },
  { key: 'viol_uniform', group: 'conduct', isRestricted: false, label: '👔 Vi phạm tác phong: Tóc dài, nhuộm tóc, đạp quai hậu, sai đồng phục', points: -20, icon: 'fa-shirt' },
  { key: 'viol_eating_drawing', group: 'conduct', isRestricted: false, label: '🥤 Ăn quà vặt trong giờ / Ghi vẽ bậy lên bàn học', points: -15, icon: 'fa-cookie-bite' },
  { key: 'viol_cleaning_trash', group: 'conduct', isRestricted: false, label: '🧹 Trực nhật bẩn / Xả rác bừa bãi', points: -10, icon: 'fa-trash-can' },
  { key: 'viol_late_docs', group: 'conduct', isRestricted: false, label: '📑 Nộp trễ giấy tờ / Không tham gia phong trào chung', points: -10, icon: 'fa-file-lines' },
  { key: 'viol_excused_absence', group: 'conduct', isRestricted: false, label: '📝 Vắng có phép', points: -5, icon: 'fa-envelope-open-text' }
];

// ==================== STATE HỆ THỐNG ====================
let appState = {
  students: [],
  dailyLogs: [],
  selectedStudentIds: new Set(),
  activeRule: null,
  activeScoringGroup: 'all',
  charts: {
    groupsChart: null,
    ratingsChart: null
  },
  seating: [],
  seatingFilter: 'all',
  seatingSearch: '',
  swapSourceSeatId: null,
  isSwapMode: false,
  activeModalSeat: null,
  activeFormId: 'form1',
  selectedFormStudentId: '',
  theme: 'light',
  starsEnabled: true,
  activeLeaderboardWeek: '9',
  lockedWeeks: [],
  currentUserRole: 'member',
  pendingRoleId: null
};

// ==================== KHỞI TẠO HỆ THỐNG ====================
document.addEventListener('DOMContentLoaded', () => {
  initThemeAndStarfield();
  initDateInputs();
  renderRuleButtons();
  loadDataFromStorage();

  // Đảm bảo luôn sử dụng đúng danh sách 45 học sinh chính thức theo ảnh sổ lớp
  const hasBalancedRoster = appState.students.length === 45 && 
                            appState.students.some(s => s.fullName === 'Nguyễn Hoàng Gia Nguyên' && s.role === 'Tổ trưởng') &&
                            appState.students.some(s => s.id === 'hs_10a3_36' && s.role === 'Tổ trưởng' && s.groupNumber === 3) &&
                            appState.students.some(s => s.id === 'hs_10a3_10' && s.role === 'Thành viên' && s.groupNumber === 3) &&
                            appState.students.some(s => s.id === 'hs_10a3_14' && s.groupNumber === 1) &&
                            appState.students.some(s => s.id === 'hs_10a3_07' && s.groupNumber === 4) &&
                            appState.students.some(s => s.id === 'hs_10a3_37' && s.groupNumber === 3) &&
                            appState.students.some(s => s.id === 'hs_10a3_19' && s.groupNumber === 6) &&
                            appState.students.some(s => s.fullName === 'Ngô Thị Diễm Hằng' && s.groupNumber === 4);
  if (!hasBalancedRoster) {
    injectOfficial45Students(false);
  }

  // Kiểm tra URL hash (vd: #scoring, #students, #forms, #duties) để mở tab tương ứng
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['dashboard', 'leaderboard', 'scoring', 'students', 'seating', 'logs', 'forms', 'backup', 'duties'].includes(initialHash)) {
    if (['seating', 'forms', 'backup'].includes(initialHash) && appState.currentUserRole !== 'gvcn') {
      switchTab('dashboard');
    } else {
      switchTab(initialHash);
    }
  } else if (initialHash === 'print-preview') {
    if (appState.currentUserRole === 'gvcn') {
      switchTab('seating');
      setTimeout(() => openPrintPreviewModal(), 200);
    } else {
      switchTab('dashboard');
    }
  } else {
    refreshAllUI();
  }
});

// Cập nhật ngày tháng hôm nay
function initDateInputs() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('score-input-date');
  if (dateInput) dateInput.value = today;

  const dateText = document.getElementById('current-date-text');
  if (dateText) {
    const options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
    dateText.textContent = new Date().toLocaleDateString('vi-VN', options);
  }
}

// ==================== LOCAL STORAGE SERVICES ====================
function getAuthenticatedRoles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_ROLES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function isRoleAuthenticated(roleId) {
  if (!roleId || roleId === 'member') return true;
  const list = getAuthenticatedRoles();
  // GVCN có toàn quyền xác thực
  if (list.includes('gvcn')) return true;
  // Cán sự được quyền chấm điểm (Lớp trưởng & 6 Tổ trưởng)
  if (roleId !== 'gvcn' && (list.includes('cadre') || list.includes(roleId))) return true;
  return false;
}

function addAuthenticatedRole(roleId) {
  try {
    let list = getAuthenticatedRoles();
    if (!list.includes(roleId)) list.push(roleId);
    if (roleId === 'gvcn') {
      list.push('cadre', 'monitor', 'lead_t1', 'lead_t2', 'lead_t3', 'lead_t4', 'lead_t5', 'lead_t6', 'redstar_phuc', 'redstar_tung');
    } else if (roleId === 'monitor' || roleId.startsWith('lead_t') || roleId.startsWith('redstar_')) {
      list.push('cadre');
    }
    list = Array.from(new Set(list));
    localStorage.setItem(STORAGE_KEYS.AUTH_ROLES, JSON.stringify(list));
  } catch (e) {
    console.error('Lỗi khi lưu vai trò xác thực:', e);
  }
}

function logoutAllRoles() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_ROLES);
  executeChangeRole('member');
  showToast('Đã đăng xuất quyền cán sự! Bạn đang ở Chế độ Học sinh (Chỉ xem).', 'info');
}

function loadDataFromStorage() {
  try {
    const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const rawLocked = localStorage.getItem(STORAGE_KEYS.LOCKED_WEEKS);
    const rawRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);

    appState.students = rawStudents ? JSON.parse(rawStudents) : [];
    appState.dailyLogs = rawLogs ? JSON.parse(rawLogs) : [];
    appState.lockedWeeks = rawLocked ? JSON.parse(rawLocked) : [];

    // Chỉ duy trì vai trò quản trị nếu thiết bị này đã được xác thực PIN
    if (rawRole && rawRole !== 'member' && isRoleAuthenticated(rawRole)) {
      appState.currentUserRole = rawRole;
    } else {
      appState.currentUserRole = 'member';
    }
    appState.activeLeaderboardWeek = '9';

    // Đồng bộ nhóm và vai trò khi đổi vị trí học sinh
    if (appState.students && appState.students.length === 45) {
      const vk = appState.students.find(s => s.id === 'hs_10a3_14');
      const ng = appState.students.find(s => s.id === 'hs_10a3_07');
      const ph = appState.students.find(s => s.id === 'hs_10a3_10');
      const kt = appState.students.find(s => s.id === 'hs_10a3_36');
      const hl = appState.students.find(s => s.id === 'hs_10a3_19');
      const bt = appState.students.find(s => s.id === 'hs_10a3_37');
      let changed = false;
      if (vk && vk.groupNumber !== 1) { vk.groupNumber = 1; changed = true; }
      if (ng && ng.groupNumber !== 4) { ng.groupNumber = 4; changed = true; }
      if (ph && ph.role === 'Tổ trưởng') { ph.role = 'Thành viên'; changed = true; }
      if (kt && kt.role !== 'Tổ trưởng') { kt.role = 'Tổ trưởng'; changed = true; }
      if (hl && hl.groupNumber !== 6) { hl.groupNumber = 6; changed = true; }
      if (bt && bt.groupNumber !== 3) { bt.groupNumber = 3; changed = true; }
      const np = appState.students.find(s => s.id === 'hs_10a3_30');
      if (np && np.role !== 'Sao đỏ') { np.role = 'Sao đỏ'; changed = true; }
      if (bt && bt.role !== 'Sao đỏ') { bt.role = 'Sao đỏ'; changed = true; }
      if (changed) saveDataToStorage();
    }

    loadSeatingData();
  } catch (err) {
    console.error('Lỗi khi đọc LocalStorage:', err);
    showToast('Lỗi khi tải dữ liệu từ bộ nhớ trình duyệt!', 'error');
  }
}

function saveDataToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(appState.students));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appState.dailyLogs));
    localStorage.setItem(STORAGE_KEYS.LOCKED_WEEKS, JSON.stringify(appState.lockedWeeks));
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, appState.currentUserRole);
    
    const countDisplay = document.getElementById('storage-count');
    if (countDisplay) {
      countDisplay.textContent = `${appState.dailyLogs.length} logs`;
    }
  } catch (err) {
    console.error('Lỗi khi ghi LocalStorage:', err);
    showToast('Không thể lưu dữ liệu! Hãy kiểm tra dung lượng trình duyệt.', 'error');
  }
}

// ==================== TÍNH TOÁN ĐIỂM SỐ & XẾP LOẠI ====================
function calculateStudentScore(studentId) {
  let score = BASE_WEEKLY_SCORE;
  const logs = appState.dailyLogs.filter(log => log.studentId === studentId);
  logs.forEach(log => {
    score += Number(log.pointsChanged) || 0;
  });
  return score;
}

function getRankingTier(score, hasRestrictedViolation = false) {
  if (hasRestrictedViolation) {
    return RANKING_TIERS.RESTRICTED;
  }
  if (score >= RANKING_TIERS.GOOD.min) return RANKING_TIERS.GOOD;
  if (score >= RANKING_TIERS.FAIR.min) return RANKING_TIERS.FAIR;
  if (score >= RANKING_TIERS.PASS.min) return RANKING_TIERS.PASS;
  return RANKING_TIERS.FAIL;
}

function getGroupStats() {
  const groups = [1, 2, 3, 4, 5, 6].map(gNum => {
    const members = appState.students.filter(s => Number(s.groupNumber) === gNum);
    if (members.length === 0) return { groupNumber: gNum, count: 0, totalScore: 0, avgScore: 100 };
    
    let groupTotal = 0;
    members.forEach(m => {
      groupTotal += calculateStudentScore(m.id);
    });
    return {
      groupNumber: gNum,
      count: members.length,
      totalScore: groupTotal,
      avgScore: Math.round((groupTotal / members.length) * 10) / 10
    };
  });
  return groups;
}

// ==================== GIAO DIỆN & ĐIỀU HƯỚNG TAB ====================
function switchTab(tabName) {
  // BẢO MẬT KHU VỰC GVCN: Chỉ duy nhất GVCN mới được vào xem Sơ đồ lớp, Biểu mẫu sư phạm và Dữ liệu & Cài đặt
  if (['seating', 'forms', 'backup'].includes(tabName) && appState.currentUserRole !== 'gvcn') {
    const tabLabels = {
      seating: 'Sơ đồ lớp học',
      forms: 'Biểu mẫu sư phạm',
      backup: 'Dữ liệu & Cài đặt'
    };
    const label = tabLabels[tabName] || tabName;
    showToast(`Khu vực "${label}" được bảo mật! Vui lòng nhập mã PIN GVCN để truy cập.`, 'warning');
    appState.pendingRoleId = 'gvcn';
    appState.targetTabAfterAuth = tabName;
    openRolePinModal('gvcn');
    return;
  }
  const sections = {
    dashboard: document.getElementById('section-dashboard'),
    leaderboard: document.getElementById('section-leaderboard'),
    scoring: document.getElementById('section-scoring'),
    students: document.getElementById('section-students'),
    seating: document.getElementById('section-seating'),
    logs: document.getElementById('section-logs'),
    forms: document.getElementById('section-forms'),
    backup: document.getElementById('section-backup'),
    duties: document.getElementById('section-duties')
  };

  const navButtons = {
    dashboard: document.getElementById('nav-dashboard'),
    leaderboard: document.getElementById('nav-leaderboard'),
    scoring: document.getElementById('nav-scoring'),
    students: document.getElementById('nav-students'),
    seating: document.getElementById('nav-seating'),
    logs: document.getElementById('nav-logs'),
    forms: document.getElementById('nav-forms'),
    backup: document.getElementById('nav-backup'),
    duties: document.getElementById('nav-duties')
  };

  const titles = {
    dashboard: 'Bảng Điều Khiển Tổng Quan Thi Đua Lớp 10A3',
    leaderboard: 'Bảng Xếp Hạng Thi Đua Học Sinh & Tổ Xuất Sắc Theo Tuần',
    scoring: 'Phiếu Ghi Nhận Điểm Thi Đua Tự Quản (Ban Cán Sự / Sao Đỏ)',
    students: 'Danh Sách & Quản Trị Học Sinh Lớp 10A3',
    seating: 'Sơ Đồ Chỗ Ngồi Lớp Học 10A3 (2 Dãy • 6 Tổ • 24 Bàn)',
    logs: 'Sổ Tra Cứu & Nhật Ký Ghi Nhận Điểm',
    forms: 'Trung Tâm Biểu Mẫu Sư Phạm & Kế Hoạch Tiến Bộ (GDPT 2018)',
    backup: 'Trung Tâm Dữ Liệu, Cài Đặt & Sao Lưu',
    duties: 'Bảng Phân Công Nhiệm Vụ Ban Cán Sự & Tự Quản Lớp 10A3'
  };

  // Hide all sections, remove active class
  Object.keys(sections).forEach(key => {
    if (sections[key]) sections[key].classList.add('hidden');
    if (navButtons[key]) {
      navButtons[key].className = 'nav-btn w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition';
    }
  });

  // Activate selected section
  if (sections[tabName]) sections[tabName].classList.remove('hidden');
  if (navButtons[tabName]) {
    navButtons[tabName].className = 'nav-btn w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-white bg-blue-600 shadow-sm transition';
  }

  const topTitle = document.getElementById('top-title');
  if (topTitle && titles[tabName]) {
    topTitle.textContent = titles[tabName];
  }

  // Refresh tab specific rendering
  if (tabName === 'dashboard') {
    renderDashboardStats();
    renderCharts();
  } else if (tabName === 'leaderboard') {
    renderLeaderboard();
  } else if (tabName === 'scoring') {
    renderScoringStudentPills();
    renderScoringPermissionsUI();
  } else if (tabName === 'students') {
    renderStudentsTable();
  } else if (tabName === 'seating') {
    renderSeatingPlan();
  } else if (tabName === 'logs') {
    renderLogsTable();
  } else if (tabName === 'forms') {
    initFormsTab();
  } else if (tabName === 'duties') {
    renderCadreDuties();
  }

  const hSel = document.getElementById('header-user-role-selector');
  if (hSel) hSel.value = appState.currentUserRole || 'member';
  updateResetButtonsVisibility();
}

// ==================== RENDERING: DASHBOARD ====================
function renderDashboardStats() {
  const totalStudents = appState.students.length;
  document.getElementById('kpi-total-students').textContent = totalStudents;
  document.getElementById('badge-total-students').textContent = totalStudents;

  // Điểm trung bình cả lớp
  let totalScoreAll = 0;
  let totalBonusPoints = 0;
  let totalViolationPoints = 0;
  let specialCount = 0;

  const studentScoreMap = appState.students.map(s => {
    const score = calculateStudentScore(s.id);
    totalScoreAll += score;
    if (s.isSpecialSupport) specialCount++;
    return { ...s, currentScore: score };
  });

  const avgScore = totalStudents > 0 ? (totalScoreAll / totalStudents).toFixed(1) : '100.0';
  const isGVCN = (appState.currentUserRole === 'gvcn');
  document.getElementById('kpi-avg-score').textContent = avgScore;
  const kpiSpecialCount = document.getElementById('kpi-special-count');
  const kpiSpecialTitle = document.getElementById('kpi-special-title');
  const kpiSpecialDesc = document.getElementById('kpi-special-desc');
  if (kpiSpecialCount) {
    if (isGVCN) {
      if (kpiSpecialTitle) kpiSpecialTitle.textContent = 'Diện Hỗ Trợ (GVCN)';
      kpiSpecialCount.textContent = specialCount;
      if (kpiSpecialDesc) kpiSpecialDesc.textContent = 'em cần kèm cặp';
    } else {
      if (kpiSpecialTitle) kpiSpecialTitle.textContent = 'Kỷ Luật Lớp';
      kpiSpecialCount.textContent = '100%';
      if (kpiSpecialDesc) kpiSpecialDesc.textContent = 'nề nếp ổn định';
    }
  }

  // Tổng điểm cộng & trừ trong nhật ký
  appState.dailyLogs.forEach(l => {
    const pts = Number(l.pointsChanged) || 0;
    if (pts > 0) totalBonusPoints += pts;
    else if (pts < 0) totalViolationPoints += pts;
  });

  document.getElementById('kpi-total-bonus').textContent = `+${totalBonusPoints}`;
  document.getElementById('kpi-total-violation').textContent = `${totalViolationPoints}`;

  // Phân bổ xếp loại
  let counts = { good: 0, fair: 0, pass: 0, fail: 0 };
  studentScoreMap.forEach(s => {
    const tier = getRankingTier(s.currentScore);
    if (tier.label === 'Tốt') counts.good++;
    else if (tier.label === 'Khá') counts.fair++;
    else if (tier.label === 'Đạt') counts.pass++;
    else counts.fail++;
  });

  document.getElementById('stat-count-good').textContent = counts.good;
  document.getElementById('stat-count-fair').textContent = counts.fair;
  document.getElementById('stat-count-pass').textContent = counts.pass;
  document.getElementById('stat-count-fail').textContent = counts.fail;

  // Render Top 5 Xuất Sắc
  const sortedDesc = [...studentScoreMap].sort((a, b) => b.currentScore - a.currentScore);
  const topContainer = document.getElementById('top-students-list');
  topContainer.innerHTML = '';

  if (sortedDesc.length === 0) {
    topContainer.innerHTML = '<p class="text-xs text-slate-400 p-4 text-center">Chưa có dữ liệu học sinh</p>';
  } else {
    sortedDesc.slice(0, 5).forEach((stu, idx) => {
      const rankBadgeClass = idx === 0 ? 'rank-1 font-black' : idx === 1 ? 'rank-2 font-bold' : idx === 2 ? 'rank-3 font-bold' : 'bg-slate-100 text-slate-600 font-semibold';
      const item = document.createElement('div');
      item.className = 'py-2.5 px-3 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition cursor-pointer';
      item.onclick = () => openStudentDetailModal(stu.id);
      item.innerHTML = `
        <div class="flex items-center space-x-3">
          <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${rankBadgeClass}">${idx + 1}</span>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-800 text-sm hover:text-blue-600 transition">${escapeHtml(stu.fullName)}</span>
              ${getRoleBadgeHtml(stu.role)}
              ${(isGVCN && stu.isSpecialSupport) ? '<span class="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">Ưu tiên kèm</span>' : ''}
            </div>
            <p class="text-[11px] text-slate-400">Tổ ${stu.groupNumber} • Quỹ chuẩn 100đ</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-base font-black text-emerald-600">${stu.currentScore} đ</span>
          <span class="block text-[10px] text-emerald-700 font-bold uppercase">Hạng ${getRankingTier(stu.currentScore).label}</span>
        </div>
      `;
      topContainer.appendChild(item);
    });
  }

  // Render Cảnh Báo Vi Phạm & Cần Hỗ Trợ
  const warningContainer = document.getElementById('warning-students-list');
  warningContainer.innerHTML = '';

  // BẢO MẬT: Chỉ GVCN mới thấy học sinh diện hỗ trợ trong danh sách cần lưu ý
  // Đối với học sinh / cán sự: CHỈ hiển thị nếu học sinh thực sự bị trừ điểm (<90đ), không làm các em tủi thân
  const needAttention = studentScoreMap
    .filter(s => s.currentScore < 90 || (isGVCN && s.isSpecialSupport))
    .sort((a, b) => a.currentScore - b.currentScore)
    .slice(0, 5);

  if (needAttention.length === 0) {
    warningContainer.innerHTML = `
      <div class="p-6 text-center text-slate-400">
        <i class="fa-solid fa-circle-check text-2xl text-emerald-500 mb-1"></i>
        <p class="text-xs font-semibold text-slate-600">Tuyệt vời! Không có học sinh nào bị cảnh báo hoặc tụt điểm sâu.</p>
      </div>
    `;
  } else {
    needAttention.forEach(stu => {
      const tier = getRankingTier(stu.currentScore);
      const isDeducted = stu.currentScore < 100;
      const item = document.createElement('div');
      item.className = 'py-2.5 px-3 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition cursor-pointer';
      item.onclick = () => openStudentDetailModal(stu.id);
      item.innerHTML = `
        <div class="flex items-center space-x-3">
          <span class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-xs">
            <i class="fa-solid ${(isGVCN && stu.isSpecialSupport) ? 'fa-handshake-angle text-amber-600' : 'fa-circle-exclamation'}"></i>
          </span>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-800 text-sm hover:text-blue-600 transition">${escapeHtml(stu.fullName)}</span>
              ${(isGVCN && stu.isSpecialSupport) ? '<span class="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded border border-amber-300">Cần theo dõi đặc biệt</span>' : ''}
            </div>
            <p class="text-[11px] text-slate-400">Tổ ${stu.groupNumber} • ${isDeducted ? `Bị trừ ${100 - stu.currentScore} điểm` : 'Đang duy trì ổn định'}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-base font-black ${stu.currentScore < 70 ? 'text-rose-600' : 'text-amber-600'}">${stu.currentScore} đ</span>
          <span class="block text-[10px] font-bold ${tier.color} px-1.5 py-0.5 rounded border text-center">${tier.label}</span>
        </div>
      `;
      warningContainer.appendChild(item);
    });
  }
}

// ==================== RENDERING: CHARTS (CHART.JS) ====================
function renderCharts() {
  const groupStats = getGroupStats();

  // 1. Biểu đồ cột thi đua 6 Tổ
  const ctxGroup = document.getElementById('groupsChart');
  if (ctxGroup) {
    const labels = groupStats.map(g => `Tổ ${g.groupNumber}`);
    const dataValues = groupStats.map(g => g.avgScore);

    if (appState.charts.groupsChart) {
      appState.charts.groupsChart.destroy();
    }

    appState.charts.groupsChart = new Chart(ctxGroup, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Điểm Trung Bình Tổ',
          data: dataValues,
          backgroundColor: [
            'rgba(37, 99, 235, 0.85)',   // Blue
            'rgba(16, 185, 129, 0.85)',  // Emerald
            'rgba(245, 158, 11, 0.85)',  // Amber
            'rgba(139, 92, 246, 0.85)',  // Purple
            'rgba(236, 72, 153, 0.85)',  // Pink
            'rgba(14, 165, 233, 0.85)'   // Cyan
          ],
          borderColor: [
            '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'
          ],
          borderWidth: 1.5,
          borderRadius: 8,
          maxBarThickness: 45
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `Điểm TB: ${item.raw} điểm`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 40,
            max: 120,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: {
              stepSize: 10,
              font: { family: "'Plus Jakarta Sans', sans-serif" }
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: 'bold' } }
          }
        }
      }
    });
  }

  // 2. Biểu đồ Doughnut Xếp Loại Tháng
  const ctxRating = document.getElementById('ratingsChart');
  if (ctxRating) {
    let counts = { good: 0, fair: 0, pass: 0, fail: 0 };
    appState.students.forEach(s => {
      const score = calculateStudentScore(s.id);
      const hasRestricted = violList.some(v => { const r = VIOLATION_RULES.find(vr => vr.key === v.ruleKey); return r && r.isRestricted; });
    const tier = getRankingTier(score, hasRestricted);
      if (tier.label === 'Tốt') counts.good++;
      else if (tier.label === 'Khá') counts.fair++;
      else if (tier.label === 'Đạt') counts.pass++;
      else counts.fail++;
    });

    if (appState.charts.ratingsChart) {
      appState.charts.ratingsChart.destroy();
    }

    appState.charts.ratingsChart = new Chart(ctxRating, {
      type: 'doughnut',
      data: {
        labels: ['Tốt (≥90)', 'Khá (70-89)', 'Đạt (50-69)', 'Chưa đạt (<50)'],
        datasets: [{
          data: [counts.good, counts.fair, counts.pass, counts.fail],
          backgroundColor: [
            '#10b981', // Tốt: Emerald
            '#3b82f6', // Khá: Blue
            '#f59e0b', // Đạt: Amber
            '#ef4444'  // Chưa đạt: Red
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

// ==================== RENDERING: FORM CHẤM ĐIỂM (TAB 2) ====================
function renderRuleButtons() {
  // Bonus buttons
  const bonusList = document.getElementById('bonus-buttons-list');
  if (bonusList) {
    bonusList.innerHTML = BONUS_RULES.map(rule => `
      <div onclick="selectRule('bonus', '${rule.key}')" id="rule-btn-${rule.key}" class="scoring-btn bg-white dark:bg-slate-800 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-500 flex items-center justify-between text-xs cursor-pointer shadow-sm">
        <div class="flex items-center space-x-2.5">
          <span class="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 rule-icon-box border border-emerald-200/50 dark:border-emerald-700/60">
            <i class="fa-solid ${rule.icon}"></i>
          </span>
          <span class="font-semibold text-slate-800 dark:text-slate-100 rule-label">${rule.label}</span>
        </div>
        <span class="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/90 px-2 py-0.5 rounded-md shrink-0 border border-emerald-200 dark:border-emerald-700/60 points-badge points-bonus">+${rule.points}</span>
      </div>
    `).join('');
  }

  // Violation buttons
  const violList = document.getElementById('violation-buttons-list');
  if (violList) {
    violList.innerHTML = VIOLATION_RULES.map(rule => `
      <div onclick="selectRule('violation', '${rule.key}')" id="rule-btn-${rule.key}" class="scoring-btn bg-white dark:bg-slate-800 p-3 rounded-xl border border-rose-200 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-500 flex items-center justify-between text-xs cursor-pointer shadow-sm">
        <div class="flex items-center space-x-2.5">
          <span class="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0 rule-icon-box border border-rose-200/50 dark:border-rose-700/60">
            <i class="fa-solid ${rule.icon}"></i>
          </span>
          <span class="font-semibold text-slate-800 dark:text-slate-100 rule-label">${rule.label}</span>
        </div>
        <span class="font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/90 px-2 py-0.5 rounded-md shrink-0 border border-rose-200 dark:border-rose-700/60 points-badge points-violation">${rule.points}</span>
      </div>
    `).join('');
  }
}

function filterScoringGroup(groupNum) {
  appState.activeScoringGroup = groupNum;
  document.querySelectorAll('.group-tab-btn').forEach(btn => {
    const g = btn.getAttribute('data-group');
    if (String(g) === String(groupNum)) {
      btn.className = 'group-tab-btn px-3 py-1.5 text-xs font-bold rounded-lg border bg-blue-600 text-white border-blue-600';
    } else {
      btn.className = 'group-tab-btn px-3 py-1.5 text-xs font-bold rounded-lg border bg-white text-slate-600 border-slate-300 hover:border-blue-400';
    }
  });
  renderScoringStudentPills();
}

function renderScoringStudentPills() {
  const container = document.getElementById('scoring-students-grid');
  if (!container) return;

  container.innerHTML = '';
  const filtered = appState.students.filter(s => {
    if (appState.activeScoringGroup === 'all') return true;
    return Number(s.groupNumber) === Number(appState.activeScoringGroup);
  });

  // Populate quick-select-student-dropdown
  const quickSelect = document.getElementById('quick-select-student-dropdown');
  if (quickSelect) {
    const currentVal = quickSelect.value;
    quickSelect.innerHTML = '<option value="">-- Chọn nhanh 1 học sinh theo tên --</option>';
    const studentsForSelect = appState.activeScoringGroup === 'all' 
      ? appState.students 
      : filtered;
    studentsForSelect.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `T${s.groupNumber} • ${s.fullName} (${s.role || 'Thành viên'})`;
      quickSelect.appendChild(opt);
    });
    quickSelect.value = currentVal;
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p class="col-span-full text-center text-xs text-slate-400 py-4">Chưa có học sinh nào trong tổ này</p>';
    return;
  }

  filtered.forEach(stu => {
    const isSelected = appState.selectedStudentIds.has(stu.id);
    const pill = document.createElement('div');
    pill.className = `student-pill p-2 rounded-xl border text-xs flex flex-col justify-between cursor-pointer transition select-none ${isSelected ? 'active bg-blue-50 dark:bg-blue-950/50 border-blue-500 shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`;
    pill.onclick = () => toggleSelectStudent(stu.id);
    pill.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black text-slate-400">T${stu.groupNumber}</span>
        ${isSelected ? '<i class="fa-solid fa-circle-check text-blue-600 text-xs"></i>' : '<i class="fa-regular fa-circle text-slate-300 text-xs"></i>'}
      </div>
      <p class="font-bold text-slate-800 dark:text-slate-100 truncate my-1">${escapeHtml(stu.fullName)}</p>
      <div class="flex items-center justify-between text-[10px]">
        <span class="text-slate-500 dark:text-slate-400 truncate">${escapeHtml(stu.role || 'Thành viên')}</span>
        <span class="font-bold text-slate-700 dark:text-slate-300">${calculateStudentScore(stu.id)}đ</span>
      </div>
    `;
    container.appendChild(pill);
  });

  updateSelectedCountUI();
}

function toggleSelectStudent(studentId) {
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bạn đang ở Chế độ Chỉ Xem! Vui lòng đăng nhập Cán sự hoặc GVCN để chấm điểm.', 'warning');
    return;
  }
  // Nếu là Tổ trưởng, kiểm tra học sinh có thuộc tổ mình không
  if (appState.currentUserRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(appState.currentUserRole.replace('lead_t', ''), 10);
    const stu = appState.students.find(s => s.id === studentId);
    if (stu && Number(stu.groupNumber) !== leaderGroup) {
      showToast(`Bạn là Tổ trưởng Tổ ${leaderGroup}, chỉ được chấm điểm cho các bạn thuộc Tổ ${leaderGroup}!`, 'warning');
      return;
    }
  }

  if (appState.selectedStudentIds.has(studentId)) {
    appState.selectedStudentIds.delete(studentId);
  } else {
    appState.selectedStudentIds.add(studentId);
  }
  renderScoringStudentPills();
}

function selectAllVisibleStudents() {
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bạn đang ở Chế độ Chỉ Xem! Không thể chọn học sinh.', 'warning');
    return;
  }
  if (appState.currentUserRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(appState.currentUserRole.replace('lead_t', ''), 10);
    const groupStudents = appState.students.filter(s => Number(s.groupNumber) === leaderGroup);
    groupStudents.forEach(s => appState.selectedStudentIds.add(s.id));
    renderScoringStudentPills();
    showToast(`Đã chọn toàn bộ ${groupStudents.length} học sinh Tổ ${leaderGroup}`, 'info');
    return;
  }

  const filtered = appState.students.filter(s => {
    if (appState.activeScoringGroup === 'all') return true;
    return Number(s.groupNumber) === Number(appState.activeScoringGroup);
  });
  filtered.forEach(s => appState.selectedStudentIds.add(s.id));
  renderScoringStudentPills();
  showToast(`Đã chọn toàn bộ ${filtered.length} học sinh đang hiển thị`, 'info');
}

function clearSelectedStudents() {
  appState.selectedStudentIds.clear();
  renderScoringStudentPills();
}

function updateSelectedCountUI() {
  const count = appState.selectedStudentIds.size;
  const countText = document.getElementById('selected-students-count-text');
  if (countText) countText.textContent = `Đã chọn: ${count} học sinh`;

  const badge = document.getElementById('preview-students-badge');
  if (badge) badge.textContent = `${count} học sinh được chọn`;
  if (typeof renderScoringRecentLogs === 'function') {
    renderScoringRecentLogs();
  }
}

function selectRule(type, ruleKey) {
  // Clear previous selected buttons
  document.querySelectorAll('.scoring-btn').forEach(btn => {
    btn.classList.remove('selected-bonus', 'selected-violation');
  });

  const rule = (type === 'bonus' ? BONUS_RULES : VIOLATION_RULES).find(r => r.key === ruleKey);
  if (!rule) return;

  appState.activeRule = { ...rule, type };

  const activeBtn = document.getElementById(`rule-btn-${ruleKey}`);
  if (activeBtn) {
    activeBtn.classList.add(type === 'bonus' ? 'selected-bonus' : 'selected-violation');
  }

  // Update preview bar
  const ruleText = document.getElementById('preview-rule-text');
  const pointsBadge = document.getElementById('preview-points-badge');

  if (ruleText) ruleText.textContent = `[${type === 'bonus' ? 'ĐIỂM CỘNG' : 'ĐIỂM TRỪ'}] ${rule.label}`;
  if (pointsBadge) {
    pointsBadge.textContent = type === 'bonus' ? `+${rule.points} điểm` : `${rule.points} điểm`;
    pointsBadge.className = type === 'bonus' ? 'text-xl font-black text-emerald-400' : 'text-xl font-black text-rose-400';
  }
}

function submitScoringEntry() {
  // 1. Kiểm tra quyền hạn vai trò
  const currentRole = appState.currentUserRole || 'member';
  const roleMeta = ROLES[currentRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Tài khoản của bạn đang ở Chế độ Chỉ Xem! Chỉ GVCN, Lớp trưởng và 6 Tổ trưởng mới có quyền ghi nhận điểm.', 'error');
    return;
  }

  // 2. Kiểm tra tuần có bị khóa không
  const currentWeek = document.getElementById('score-input-week')?.value || appState.activeLeaderboardWeek || '10';
  if (isWeekLocked(currentWeek)) {
    showToast(`Tuần ${currentWeek} đã chốt sổ và khóa điểm! Vui lòng chọn tuần đang mở hoặc liên hệ GVCN mở khóa.`, 'error');
    return;
  }

  // 3. Nếu là Tổ trưởng, chỉ được chấm điểm thành viên trong tổ mình
  if (currentRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(currentRole.replace('lead_t', ''), 10);
    const selectedStudents = appState.students.filter(s => appState.selectedStudentIds.has(s.id));
    const foreignStudents = selectedStudents.filter(s => Number(s.groupNumber) !== leaderGroup);
    if (foreignStudents.length > 0) {
      showToast(`Bạn là Tổ trưởng Tổ ${leaderGroup}, chỉ được quyền chấm điểm cho các bạn thuộc Tổ ${leaderGroup}!`, 'warning');
      return;
    }
  }

  if (appState.selectedStudentIds.size === 0) {
    showToast('Vui lòng click chọn ít nhất 1 học sinh ở Danh sách bên trái!', 'warning');
    return;
  }
  if (!appState.activeRule) {
    showToast('Vui lòng chọn 1 tiêu chí điểm cộng hoặc điểm trừ từ danh sách xổ xuống!', 'warning');
    return;
  }

  const dateVal = document.getElementById('score-input-date')?.value || new Date().toISOString().split('T')[0];
  const recorderVal = document.getElementById('score-input-recorder')?.value.trim() || 'Sao đỏ trực nhật';
  const weekVal = document.getElementById('score-input-week')?.value || appState.activeLeaderboardWeek || '10';
  const noteVal = document.getElementById('score-note')?.value.trim() || '';

  const newLogs = [];
  const selectedIds = Array.from(appState.selectedStudentIds);

  selectedIds.forEach(stuId => {
    newLogs.push({
      id: generateUUID(),
      date: dateVal,
      week: String(weekVal),
      studentId: stuId,
      type: appState.activeRule.type,
      ruleKey: appState.activeRule.key,
      ruleLabel: appState.activeRule.label,
      pointsChanged: appState.activeRule.points,
      recordedBy: recorderVal,
      note: noteVal,
      timestamp: Date.now()
    });
  });

  // Prepend to logs
  appState.dailyLogs.unshift(...newLogs);
  saveDataToStorage();

  // Reset selection and dropdowns
  appState.selectedStudentIds.clear();
  appState.activeRule = null;
  
  const noteInput = document.getElementById('score-note');
  if (noteInput) noteInput.value = '';

  const bonusSelect = document.getElementById('select-bonus-rule');
  if (bonusSelect) bonusSelect.value = '';
  const bonusCard = document.getElementById('bonus-preview-card');
  if (bonusCard) bonusCard.classList.add('hidden');

  const violSelect = document.getElementById('select-violation-rule');
  if (violSelect) violSelect.value = '';
  const violCard = document.getElementById('violation-preview-card');
  if (violCard) violCard.classList.add('hidden');

  const quickSelect = document.getElementById('quick-select-student-dropdown');
  if (quickSelect) quickSelect.value = '';

  const ruleText = document.getElementById('preview-rule-text');
  if (ruleText) ruleText.textContent = 'Hãy chọn học sinh bên trái và chọn 1 tiêu chí từ menu xổ xuống Điểm cộng hoặc Điểm trừ.';
  
  const pointsBadge = document.getElementById('preview-points-badge');
  if (pointsBadge) {
    pointsBadge.textContent = '0 điểm';
    pointsBadge.className = 'font-black text-base text-white px-2 py-0.5 rounded bg-slate-800';
  }

  renderScoringStudentPills();
  refreshAllUI();

  showToast(`Đã ghi nhận thành công cho ${newLogs.length} học sinh (Tuần ${weekVal})!`, 'success');
}

// ==================== RENDERING: QUẢN LÝ DANH SÁCH HỌC SINH (TAB 3) ====================
function renderStudentsTable() {
  const tbody = document.getElementById('students-table-body');
  if (!tbody) return;

  const searchKeyword = (document.getElementById('search-student-input')?.value || '').toLowerCase().trim();
  const filterGroup = document.getElementById('filter-student-group')?.value || 'all';
  const filterSpecial = document.getElementById('filter-student-special')?.value || 'all';
  const filterRole = document.getElementById('filter-student-role')?.value || 'all';

  const isGVCN = (appState.currentUserRole === 'gvcn');
  
  // Ẩn bộ lọc diện theo dõi đặc biệt đối với người không phải GVCN
  const specialFilterWrap = document.getElementById('filter-student-special')?.parentElement;
  if (specialFilterWrap) {
    specialFilterWrap.style.display = isGVCN ? '' : 'none';
  }

  // Ẩn/Hiện cột Theo Dõi Đặc Biệt trên tiêu đề bảng: CHỈ DUY NHẤT GVCN MỚI THẤY
  const thSpecial = document.getElementById('th-student-special');
  if (thSpecial) {
    thSpecial.style.display = isGVCN ? '' : 'none';
  }

  const filtered = appState.students.filter(s => {
    const matchName = s.fullName.toLowerCase().includes(searchKeyword);
    const matchGroup = filterGroup === 'all' || Number(s.groupNumber) === Number(filterGroup);
    let matchSpecial = true;
    if (isGVCN) {
      if (filterSpecial === 'special') matchSpecial = s.isSpecialSupport === true;
      if (filterSpecial === 'normal') matchSpecial = !s.isSpecialSupport;
    }
    let matchRole = true;
    if (filterRole !== 'all') matchRole = s.role === filterRole;
    return matchName && matchGroup && matchSpecial && matchRole;
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    const emptyColspan = isGVCN ? 10 : 9;
    tbody.innerHTML = `<tr><td colspan="${emptyColspan}" class="text-center py-8 text-slate-400 text-xs">Không tìm thấy học sinh nào phù hợp</td></tr>`;
    document.getElementById('students-table-summary').textContent = 'Hiển thị 0 học sinh';
    return;
  }

  filtered.forEach((stu, index) => {
    const score = calculateStudentScore(stu.id);

    // Tính điểm cộng và điểm trừ của học sinh từ dailyLogs
    const stuLogs = appState.dailyLogs.filter(log => log.studentId === stu.id);
    let bonusPts = 0;
    let violPts = 0;
    let hasRestricted = false;
    const bonusList = [];
    const violList = [];

    stuLogs.forEach(l => {
      const pts = Number(l.pointsChanged) || 0;
      const matchedViolRule = VIOLATION_RULES.find(vr => vr.key === l.ruleKey);
      if (matchedViolRule && matchedViolRule.isRestricted) {
        hasRestricted = true;
      }

      if (pts > 0) {
        bonusPts += pts;
        bonusList.push(l);
      } else if (pts < 0) {
        violPts += pts;
        violList.push(l);
      } else if (l.type === 'violation' || (matchedViolRule && matchedViolRule.isRestricted)) {
        violList.push(l);
      }
    });

    const tier = getRankingTier(score, hasRestricted);

    const bonusHtml = bonusPts > 0 
      ? `
        <div class="text-center cursor-pointer" onclick="openStudentDetailModal('${stu.id}')" title="Bấm để xem lịch sử điểm cộng chi tiết">
          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 transition shadow-2xs">
            <i class="fa-solid fa-plus text-[10px]"></i>
            <span>${bonusPts} đ</span>
          </span>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[170px] mx-auto text-left space-y-0.5">
            ${bonusList.slice(0, 2).map(b => `
              <div class="truncate text-emerald-600 dark:text-emerald-400 font-semibold" title="${escapeHtml(b.ruleLabel)} (+${b.pointsChanged}đ${b.week ? `, Tuần ${b.week}` : ''})">
                • +${b.pointsChanged}đ ${escapeHtml(b.ruleLabel)}
              </div>
            `).join('')}
            ${bonusList.length > 2 ? `<div class="text-[9px] text-emerald-600 dark:text-emerald-400 italic text-center hover:underline">+${bonusList.length - 2} khen thưởng khác...</div>` : ''}
          </div>
        </div>
      `
      : '<span class="text-slate-300 dark:text-slate-600 text-xs font-semibold">0 đ</span>';

    const hasViolEntries = violPts < 0 || hasRestricted || violList.length > 0;
    const violBadgeText = hasRestricted 
      ? (violPts < 0 ? `⚠️ Khống chế (${violPts}đ)` : '⚠️ Khống chế (0đ)')
      : `${Math.abs(violPts)} đ`;

    const violHtml = hasViolEntries 
      ? `
        <div class="text-center cursor-pointer" onclick="openStudentDetailModal('${stu.id}')" title="Bấm để xem chi tiết vi phạm">
          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700 hover:border-rose-400 transition shadow-2xs">
            <i class="fa-solid fa-minus text-[10px]"></i>
            <span>${violBadgeText}</span>
          </span>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[170px] mx-auto text-left space-y-0.5">
            ${violList.slice(0, 2).map(v => {
              const r = VIOLATION_RULES.find(vr => vr.key === v.ruleKey);
              const isRestrictedRule = r && r.isRestricted;
              const ptsLabel = isRestrictedRule ? '⚠️' : `${v.pointsChanged}đ`;
              return `
              <div class="truncate text-rose-600 dark:text-rose-400 font-semibold" title="${escapeHtml(v.ruleLabel)} (${ptsLabel}${v.week ? `, Tuần ${v.week}` : ''})">
                • ${ptsLabel} ${escapeHtml(v.ruleLabel)}
              </div>`;
            }).join('')}
            ${violList.length > 2 ? `<div class="text-[9px] text-rose-600 dark:text-rose-400 italic text-center hover:underline">+${violList.length - 2} vi phạm khác...</div>` : ''}
          </div>
        </div>
      `
      : '<span class="text-slate-300 dark:text-slate-600 text-xs font-semibold">0 đ</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-100 dark:border-slate-800';

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono text-xs text-slate-400">${index + 1}</td>
      <td class="py-3 px-4 cursor-pointer" onclick="openStudentDetailModal('${stu.id}')">
        <span class="font-bold text-slate-800 dark:text-slate-100 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition block">${escapeHtml(stu.fullName)}</span>
        <span class="text-[11px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
          <span><i class="fa-regular fa-id-card text-[10px] mr-1"></i>${stu.code || 'Chưa có mã'}</span>
          ${stu.dob ? `<span>• <i class="fa-regular fa-calendar text-[10px] mr-1"></i>${stu.dob}</span>` : ''}
          ${stu.academicScore ? `<span class="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold rounded text-[10px]"><i class="fa-solid fa-graduation-cap text-[9px] mr-1"></i>${stu.academicScore}đ</span>` : ''}
        </span>
      </td>
      <td class="py-3 px-4 text-center">
        <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Tổ ${stu.groupNumber}
        </span>
      </td>
      <td class="py-3 px-4">
        ${getRoleBadgeHtml(stu.role)}
      </td>
${isGVCN ? `
      <td class="py-3 px-4 text-center">
        ${stu.isSpecialSupport 
          ? '<span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs"><i class="fa-solid fa-shield-heart text-amber-600 dark:text-amber-400"></i><span>Cần theo dõi</span></span>' 
          : '<span class="text-slate-300 dark:text-slate-600 text-xs">—</span>'}
      </td>` : ''}
      <td class="py-3 px-3 text-center">
        ${bonusHtml}
      </td>
      <td class="py-3 px-3 text-center">
        ${violHtml}
      </td>
      <td class="py-3 px-4 text-right">
        <span class="font-black text-sm ${score >= 90 ? 'text-emerald-600 dark:text-emerald-400' : score >= 70 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}">${score} đ</span>
      </td>
      <td class="py-3 px-4 text-center">
        <span class="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${tier.color}">
          ${tier.label}
        </span>
      </td>
      <td class="py-3 px-4 text-center space-x-1">
        ${appState.currentUserRole === "member" 
          ? '<span class="text-xs text-slate-400 italic">Chỉ xem</span>' 
          : `<button onclick="quickScoreSingle('${stu.id}')" title="Chấm điểm em này" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition"><i class="fa-solid fa-star"></i></button>
             <button onclick="openEditStudentModal('${stu.id}')" title="Sửa thông tin" class="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"><i class="fa-solid fa-pen"></i></button>
             <button onclick="deleteStudent('${stu.id}')" title="Xóa học sinh" class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition"><i class="fa-solid fa-trash-can"></i></button>`}
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('students-table-summary').textContent = `Hiển thị ${filtered.length} / ${appState.students.length} học sinh`;
}

function getRoleBadgeHtml(role) {
  if (!role || role === 'Thành viên') {
    return `<span class="text-xs text-slate-500">Thành viên</span>`;
  }

  // Hỗ trợ cán sự kiêm nhiệm nhiều chức danh (nối bằng '&')
  const parts = role.split('&').map(p => p.trim());
  return parts.map(part => {
    switch (part) {
      case 'Lớp trưởng':
        return `<span class="badge-role-lead px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-crown mr-1"></i>Lớp trưởng</span>`;
      case 'Lớp phó':
      case 'Lớp phó Học tập':
        return `<span class="badge-role-deputy px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-user-graduate mr-1"></i>Lớp phó</span>`;
      case 'Lớp phó Lao động':
        return `<span class="badge-role-deputy px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-broom mr-1"></i>Lớp phó LĐ</span>`;
      case 'Bí thư':
        return `<span class="badge-role-sec px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-flag mr-1"></i>Bí thư</span>`;
      case 'Tổ trưởng':
        return `<span class="badge-role-group px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-sitemap mr-1"></i>Tổ trưởng</span>`;
      case 'Cán sự Toán':
      case 'CS Toán':
        return `<span class="badge-role-math px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-calculator mr-1"></i>CS Toán</span>`;
      case 'Cán sự Lý':
      case 'CS Lý':
        return `<span class="badge-role-phys px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-atom mr-1"></i>CS Lý</span>`;
      case 'Cán sự Hóa':
      case 'CS Hóa':
        return `<span class="badge-role-chem px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-flask mr-1"></i>CS Hóa</span>`;
      case 'Cán sự Anh':
      case 'CS Anh':
      case 'Cán sự Tiếng Anh':
        return `<span class="badge-role-eng px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-language mr-1"></i>CS Anh</span>`;
      case 'Cán sự Sinh':
      case 'CS Sinh':
        return `<span class="badge-role-bio px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-dna mr-1"></i>CS Sinh</span>`;
      case 'Cán sự Văn':
      case 'CS Văn':
        return `<span class="badge-role-lit px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-book-open mr-1"></i>CS Văn</span>`;
      case 'Sao đỏ':
        return `<span class="badge-role-redstar px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-star mr-1"></i>Sao đỏ</span>`;
      default:
        return `<span class="text-xs text-slate-500">${escapeHtml(part)}</span>`;
    }
  }).join(' ');
}

// ==================== MODAL THÊM / SỬA HỌC SINH ====================
function openAddStudentModal() {
  document.getElementById('modal-student-title').textContent = 'Thêm Học Sinh Mới';
  document.getElementById('student-form-id').value = '';
  document.getElementById('student-form-name').value = '';
  document.getElementById('student-form-code').value = '';
  document.getElementById('student-form-dob').value = '';
  document.getElementById('student-form-academic').value = '';
  document.getElementById('student-form-group').value = '1';
  document.getElementById('student-form-role').value = 'Thành viên';
  document.getElementById('student-form-special').checked = false;

  const modal = document.getElementById('modal-student');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function openEditStudentModal(id) {
  const stu = appState.students.find(s => s.id === id);
  if (!stu) return;

  document.getElementById('modal-student-title').textContent = 'Chỉnh Sửa Thông Tin Học Sinh';
  document.getElementById('student-form-id').value = stu.id;
  document.getElementById('student-form-name').value = stu.fullName;
  document.getElementById('student-form-code').value = stu.code || '';
  document.getElementById('student-form-dob').value = stu.dob || '';
  document.getElementById('student-form-academic').value = stu.academicScore || '';
  document.getElementById('student-form-group').value = stu.groupNumber;
  document.getElementById('student-form-role').value = stu.role;
  document.getElementById('student-form-special').checked = stu.isSpecialSupport;
  const specialCheckRow = document.getElementById('student-form-special')?.closest('.bg-amber-50') || document.getElementById('student-form-special')?.parentElement;
  if (specialCheckRow) {
    specialCheckRow.style.display = (appState.currentUserRole === 'gvcn') ? '' : 'none';
  }

  const modal = document.getElementById('modal-student');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeStudentModal() {
  const modal = document.getElementById('modal-student');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function saveStudentForm(e) {
  e.preventDefault();
  const id = document.getElementById('student-form-id').value;
  const fullName = document.getElementById('student-form-name').value.trim();
  const code = document.getElementById('student-form-code').value.trim();
  const dob = document.getElementById('student-form-dob').value.trim();
  const academicVal = document.getElementById('student-form-academic').value;
  const academicScore = academicVal ? Number(academicVal) : null;
  const groupNumber = Number(document.getElementById('student-form-group').value);
  const role = document.getElementById('student-form-role').value;
  const isSpecialSupport = document.getElementById('student-form-special').checked;

  if (!fullName) {
    showToast('Họ và tên học sinh không được để trống!', 'warning');
    return;
  }

  if (id) {
    // Sửa học sinh hiện có
    const index = appState.students.findIndex(s => s.id === id);
    if (index !== -1) {
      appState.students[index] = {
        ...appState.students[index],
        fullName,
        code,
        dob,
        academicScore,
        groupNumber,
        role,
        isSpecialSupport
      };
      showToast('Cập nhật thông tin học sinh thành công!', 'success');
    }
  } else {
    // Thêm mới
    const newStudent = {
      id: generateUUID(),
      code,
      dob,
      academicScore,
      fullName,
      groupNumber,
      role,
      isSpecialSupport,
      createdDate: new Date().toISOString()
    };
    appState.students.push(newStudent);
    showToast(`Đã thêm học sinh ${fullName} vào Tổ ${groupNumber}!`, 'success');
  }

  saveDataToStorage();
  closeStudentModal();
  refreshAllUI();
}

function deleteStudent(id) {
  const stu = appState.students.find(s => s.id === id);
  if (!stu) return;

  if (confirm(`Bạn có chắc chắn muốn xóa học sinh "${stu.fullName}" khỏi danh sách lớp 10A3 không? Các nhật ký liên quan cũng sẽ được xóa.`)) {
    appState.students = appState.students.filter(s => s.id !== id);
    appState.dailyLogs = appState.dailyLogs.filter(l => l.studentId !== id);
    appState.selectedStudentIds.delete(id);
    saveDataToStorage();
    refreshAllUI();
    showToast(`Đã xóa học sinh "${stu.fullName}".`, 'info');
  }
}

function quickScoreSingle(studentId) {
  appState.selectedStudentIds.clear();
  appState.selectedStudentIds.add(studentId);
  switchTab('scoring');
  showToast('Đã chọn học sinh vào phiếu chấm điểm', 'info');
}

// ==================== RENDERING: SỔ NHẬT KÝ THI ĐUA (TAB 4) ====================
function renderLogsTable() {
  const tbody = document.getElementById('logs-table-body');
  if (!tbody) return;

  const filterDate = document.getElementById('filter-log-date')?.value || '';
  const filterType = document.getElementById('filter-log-type')?.value || 'all';
  const filterGroup = document.getElementById('filter-log-group')?.value || 'all';

  const filteredLogs = appState.dailyLogs.filter(log => {
    const student = appState.students.find(s => s.id === log.studentId);
    const matchDate = !filterDate || log.date === filterDate;
    const matchType = filterType === 'all' || log.type === filterType;
    const matchGroup = filterGroup === 'all' || (student && Number(student.groupNumber) === Number(filterGroup));
    return matchDate && matchType && matchGroup;
  });

  tbody.innerHTML = '';
  document.getElementById('logs-count-display').textContent = `${filteredLogs.length} bản ghi nhật ký`;

  if (filteredLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400 text-xs">Không có bản ghi nhật ký nào phù hợp</td></tr>`;
    return;
  }

  filteredLogs.forEach(log => {
    const student = appState.students.find(s => s.id === log.studentId) || { fullName: 'Học sinh đã xóa', groupNumber: '?' };
    const isBonus = Number(log.pointsChanged) > 0;
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition border-b border-slate-100 text-xs';

    tr.innerHTML = `
      <td class="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">${log.date}</td>
      <td class="py-2.5 px-4 font-bold text-slate-800">${escapeHtml(student.fullName)}</td>
      <td class="py-2.5 px-4 text-center">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Tổ ${student.groupNumber}</span>
      </td>
      <td class="py-2.5 px-4">
        <span class="inline-flex items-center space-x-1.5 font-medium ${isBonus ? 'text-emerald-800' : 'text-rose-800'}">
          <i class="fa-solid ${isBonus ? 'fa-plus text-emerald-600' : 'fa-minus text-rose-600'} text-[10px]"></i>
          <span>${escapeHtml(log.ruleLabel)}</span>
        </span>
      </td>
      <td class="py-2.5 px-4 text-right font-black ${isBonus ? 'text-emerald-600' : 'text-rose-600'} whitespace-nowrap">
        ${isBonus ? `+${log.pointsChanged}` : log.pointsChanged} đ
      </td>
      <td class="py-2.5 px-4 text-slate-500">${escapeHtml(log.recordedBy || 'Cán sự')}</td>
      <td class="py-2.5 px-4 text-slate-400 italic">${escapeHtml(log.note || '—')}</td>
      <td class="py-2.5 px-4 text-center">
        <button onclick="deleteLogEntry('${log.id}')" title="Xóa bản ghi này (hoàn lại điểm)" class="p-1 text-slate-400 hover:text-rose-600 transition">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


// ==================== HỆ THỐNG XÓA ĐIỂM & ĐIỀU CHỈNH CHẤM NHẦM ====================
function checkCanDeleteLog(log) {
  const currentRole = appState.currentUserRole || 'member';
  const roleMeta = ROLES[currentRole] || ROLES.member;
  
  if (!roleMeta.canScore) {
    return { allowed: false, reason: 'Bạn đang ở Chế độ Chỉ Xem! Vui lòng đăng nhập Cán sự hoặc GVCN để xóa/điều chỉnh điểm.' };
  }
  
  if (currentRole === 'gvcn' || currentRole === 'monitor') {
    return { allowed: true };
  }

  // Nếu là Tổ trưởng: chỉ được xóa điểm của HS trong tổ mình hoặc do chính mình ghi
  if (currentRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(currentRole.replace('lead_t', ''), 10);
    const stu = appState.students.find(s => s.id === log.studentId);
    if (stu && Number(stu.groupNumber) === leaderGroup) {
      return { allowed: true };
    }
    if (log.recordedBy && log.recordedBy.includes(`Tổ trưởng Tổ ${leaderGroup}`)) {
      return { allowed: true };
    }
    return { allowed: false, reason: `Bạn là Tổ trưởng Tổ ${leaderGroup}, chỉ được quyền xóa/điều chỉnh điểm của học sinh Tổ ${leaderGroup}!` };
  }

  // Nếu là Sao đỏ: được xóa nếu là cán sự
  if (currentRole === 'redstar_phuc' || currentRole === 'redstar_tung') {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Bạn không có quyền xóa bản ghi điểm này!' };
}

function deleteScoreLog(logId, silent = false) {
  const log = appState.dailyLogs.find(l => l.id === logId);
  if (!log) {
    showToast('Không tìm thấy bản ghi điểm này!', 'warning');
    return false;
  }

  const check = checkCanDeleteLog(log);
  if (!check.allowed) {
    showToast(check.reason, 'error');
    if (appState.currentUserRole === 'member') {
      openRolePinModal('gvcn');
    }
    return false;
  }

  const currentWeek = log.week || document.getElementById('score-input-week')?.value || '10';
  if (isWeekLocked(currentWeek) && appState.currentUserRole !== 'gvcn') {
    showToast(`Tuần ${currentWeek} đã chốt sổ và khóa điểm thi đua! Chỉ GVCN mới có quyền mở khóa để xóa/điều chỉnh.`, 'error');
    return false;
  }

  const stu = appState.students.find(s => s.id === log.studentId);
  const stuName = stu ? stu.fullName : 'Học sinh';
  const ptsText = log.pointsChanged > 0 ? `+${log.pointsChanged}đ` : `${log.pointsChanged}đ`;

  if (!silent) {
    const confirmMsg = `XÁC NHẬN XÓA LƯỢT CHẤM ĐIỂM:\n\n• Học sinh: ${stuName}\n• Điểm số: ${ptsText} (${log.ruleLabel || 'Điểm thi đua'})\n• Người chấm: ${log.recordedBy || 'Cán sự'}\n• Ngày ghi: ${log.date}\n\nBạn có chắc chắn muốn xóa lượt chấm này không? Điểm của học sinh sẽ tự động được hoàn lại ngay lập tức.`;
    if (!confirm(confirmMsg)) {
      return false;
    }
  }

  appState.dailyLogs = appState.dailyLogs.filter(l => l.id !== logId);
  saveDataToStorage();
  refreshAllUI();
  showToast(`✅ Đã xóa lượt chấm (${ptsText}) và hoàn lại điểm cho ${stuName}!`, 'success');
  return true;
}

function deleteLogEntry(logId) {
  return deleteScoreLog(logId);
}

function undoLastScoringEntry() {
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bạn đang ở Chế độ Chỉ Xem! Vui lòng nhập mã PIN Cán sự hoặc GVCN để xóa điểm.', 'warning');
    openRolePinModal('gvcn');
    return;
  }

  if (!appState.dailyLogs || appState.dailyLogs.length === 0) {
    showToast('Chưa có lượt chấm điểm nào trong nhật ký để hoàn tác!', 'info');
    return;
  }

  // Nếu đang chọn học sinh, ưu tiên xóa lượt gần nhất của học sinh đó
  if (appState.selectedStudentIds && appState.selectedStudentIds.size > 0) {
    const selectedIds = Array.from(appState.selectedStudentIds);
    const candidateLog = appState.dailyLogs.find(l => selectedIds.includes(l.studentId));
    if (candidateLog) {
      deleteScoreLog(candidateLog.id);
      return;
    }
  }

  // Ngược lại xóa lượt mới nhất trong danh sách
  const lastLog = appState.dailyLogs[0];
  deleteScoreLog(lastLog.id);
}

function quickUndoOrDeleteMistakenScore(type) {
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bạn đang ở Chế độ Chỉ Xem! Vui lòng nhập mã PIN Cán sự hoặc GVCN để xóa điểm.', 'warning');
    openRolePinModal('gvcn');
    return;
  }

  const isBonus = type === 'bonus';
  const typeLabel = isBonus ? 'điểm cộng (+)' : 'điểm trừ (-)';

  // 1. Nếu có học sinh đang được chọn, tìm lượt cộng/trừ gần nhất của học sinh đó
  if (appState.selectedStudentIds && appState.selectedStudentIds.size > 0) {
    const selectedIds = Array.from(appState.selectedStudentIds);
    const candidateLog = appState.dailyLogs.find(l => {
      const matchType = isBonus ? (l.pointsChanged > 0) : (l.pointsChanged < 0);
      return selectedIds.includes(l.studentId) && matchType;
    });

    if (candidateLog) {
      deleteScoreLog(candidateLog.id);
      return;
    } else {
      showToast(`Học sinh đang chọn chưa có lượt ${typeLabel} nào gần đây để xóa! Bấm vào danh sách bên dưới để chọn lượt muốn xóa.`, 'warning');
      return;
    }
  }

  // 2. Nếu chưa chọn học sinh nào, tìm lượt cộng/trừ mới nhất của toàn lớp
  const recentLog = appState.dailyLogs.find(l => isBonus ? (l.pointsChanged > 0) : (l.pointsChanged < 0));
  if (recentLog) {
    deleteScoreLog(recentLog.id);
  } else {
    showToast(`Hiện chưa có lượt ${typeLabel} nào trong hệ thống để xóa!`, 'info');
  }
}

function renderScoringRecentLogs() {
  const container = document.getElementById('scoring-recent-logs-container');
  const titleEl = document.getElementById('scoring-recent-logs-title');
  const subtitleEl = document.getElementById('scoring-recent-logs-subtitle');
  if (!container) return;

  const currentWeek = document.getElementById('score-input-week')?.value || appState.activeLeaderboardWeek || '10';
  const selectedCount = appState.selectedStudentIds ? appState.selectedStudentIds.size : 0;

  let displayLogs = [];
  if (selectedCount === 1) {
    const singleId = Array.from(appState.selectedStudentIds)[0];
    const stu = appState.students.find(s => s.id === singleId);
    const stuName = stu ? stu.fullName : 'Học sinh';
    if (titleEl) titleEl.textContent = `Lịch Sử Điểm Của ${stuName} (Tuần ${currentWeek})`;
    if (subtitleEl) subtitleEl.textContent = `Hiển thị điểm cộng & trừ của ${stuName}. Bấm nút "Xóa điểm nhầm" màu đỏ để hủy và hoàn lại điểm ngay.`;

    displayLogs = appState.dailyLogs.filter(l => l.studentId === singleId && String(l.week) === String(currentWeek));
    if (displayLogs.length === 0) {
      displayLogs = appState.dailyLogs.filter(l => l.studentId === singleId).slice(0, 6);
    }
  } else if (selectedCount > 1) {
    const selectedIds = Array.from(appState.selectedStudentIds);
    if (titleEl) titleEl.textContent = `Lịch Sử Điểm Của ${selectedCount} Học Sinh Đang Chọn (Tuần ${currentWeek})`;
    if (subtitleEl) subtitleEl.textContent = `Hiển thị điểm cộng & trừ của các bạn đang chọn. Bấm "Xóa điểm nhầm" để hủy và hoàn lại điểm ngay.`;

    displayLogs = appState.dailyLogs.filter(l => selectedIds.includes(l.studentId) && String(l.week) === String(currentWeek));
    if (displayLogs.length === 0) {
      displayLogs = appState.dailyLogs.filter(l => selectedIds.includes(l.studentId)).slice(0, 8);
    }
  } else {
    if (titleEl) titleEl.textContent = `Lịch Sử Ghi Điểm Gần Đây Toàn Lớp (Tuần ${currentWeek})`;
    if (subtitleEl) subtitleEl.textContent = `Các lượt cộng/trừ điểm mới nhất của lớp 10A3. Bấm nút "Xóa điểm nhầm" màu đỏ nếu bị nhầm để hoàn lại điểm.`;

    const weekLogs = appState.dailyLogs.filter(l => String(l.week) === String(currentWeek));
    displayLogs = weekLogs.length > 0 ? weekLogs.slice(0, 8) : appState.dailyLogs.slice(0, 8);
  }

  if (displayLogs.length === 0) {
    container.innerHTML = `
      <div class="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
        <i class="fa-regular fa-clipboard text-slate-300 text-lg mb-1 block"></i>
        <span>Chưa có lượt ghi điểm nào gần đây cần xóa hoặc điều chỉnh.</span>
      </div>
    `;
    return;
  }

  let html = '';
  displayLogs.forEach(log => {
    const stu = appState.students.find(s => s.id === log.studentId);
    const stuName = stu ? stu.fullName : (log.studentName || 'Học sinh');
    const stuGroup = stu ? `Tổ ${stu.groupNumber}` : '';
    const isBonus = log.pointsChanged > 0;
    const badgeColor = isBonus 
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    const sign = isBonus ? `+${log.pointsChanged}` : `${log.pointsChanged}`;
    const icon = isBonus ? 'fa-plus-circle text-emerald-600' : 'fa-minus-circle text-rose-600';

    html += `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition">
        <div class="flex items-center space-x-3 min-w-0">
          <span class="px-2 py-1 rounded-lg text-xs font-black border ${badgeColor} shrink-0">
            ${sign}đ
          </span>
          <div class="min-w-0">
            <div class="flex items-center space-x-1.5 flex-wrap">
              <span class="font-extrabold text-xs text-slate-800 dark:text-slate-100">${escapeHtml(stuName)}</span>
              ${stuGroup ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">${stuGroup}</span>` : ''}
              <span class="text-[10px] text-slate-400">• Tuần ${log.week || '9'}</span>
              <span class="text-[10px] text-slate-400">• ${log.date || ''}</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 truncate">
              <i class="fa-solid ${icon} mr-1 text-[10px]"></i>
              <span>${escapeHtml(log.ruleLabel || 'Điểm thi đua')}</span>
              ${log.note ? `<span class="italic text-slate-400 ml-1">(${escapeHtml(log.note)})</span>` : ''}
            </p>
            <div class="text-[10px] text-slate-400">Người ghi: <span class="font-semibold text-slate-500 dark:text-slate-400">${escapeHtml(log.recordedBy || 'Cán sự')}</span></div>
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <button type="button" onclick="deleteScoreLog('${log.id}')" title="Xóa lượt chấm này và hoàn lại điểm cho học sinh" class="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 hover:text-rose-700 border border-slate-300 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs">
            <i class="fa-solid fa-trash-can text-xs"></i>
            <span>Xóa điểm nhầm</span>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}


// ==================== MODAL CHI TIẾT HỒ SƠ 1 HỌC SINH ====================
function openStudentDetailModal(studentId) {
  const stu = appState.students.find(s => s.id === studentId);
  if (!stu) return;

  const score = calculateStudentScore(studentId);
  const tier = getRankingTier(score);
  const stuLogs = appState.dailyLogs.filter(l => l.studentId === studentId);

  document.getElementById('detail-student-name').textContent = stu.fullName;
  const isGVCN = (appState.currentUserRole === 'gvcn');
  document.getElementById('detail-student-meta').textContent = `Tổ ${stu.groupNumber} • ${stu.role}${stu.code ? ` • Mã: ${stu.code}` : ''}${stu.dob ? ` • NS: ${stu.dob}` : ''}${stu.academicScore ? ` • Điểm đầu vào: ${stu.academicScore}đ` : ''}${(isGVCN && stu.isSpecialSupport) ? ' • [Cần hỗ trợ đặc biệt]' : ''}`;
  document.getElementById('detail-student-score').textContent = `${score} đ`;
  document.getElementById('detail-student-rank').textContent = tier.label;
  document.getElementById('detail-student-rank').className = `text-sm font-bold ${tier.color} px-2 py-0.5 rounded border inline-block`;

  let bonusCount = 0;
  let violCount = 0;
  stuLogs.forEach(l => {
    if (Number(l.pointsChanged) > 0) bonusCount++;
    else violCount++;
  });
  document.getElementById('detail-student-counts').textContent = `-${violCount} vi phạm / +${bonusCount} khen thưởng`;

  const logsContainer = document.getElementById('detail-student-logs');
  logsContainer.innerHTML = '';

  if (stuLogs.length === 0) {
    logsContainer.innerHTML = '<p class="text-xs text-slate-400 py-4 text-center">Chưa có bản ghi điểm thưởng hoặc phạt nào.</p>';
  } else {
    stuLogs.forEach(log => {
      const isBonus = Number(log.pointsChanged) > 0;
      const div = document.createElement('div');
      div.className = `p-2.5 rounded-xl border text-xs flex items-center justify-between ${isBonus ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`;
      div.innerHTML = `
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-bold text-slate-800">${escapeHtml(log.ruleLabel)}</span>
            <span class="text-[10px] text-slate-400 font-mono">${log.date}</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5">${log.recordedBy ? `Ghi bởi: ${escapeHtml(log.recordedBy)}` : ''} ${log.note ? `• Ghi chú: ${escapeHtml(log.note)}` : ''}</p>
        </div>
        <span class="font-black text-sm ${isBonus ? 'text-emerald-700' : 'text-rose-700'} shrink-0 ml-3">
          ${isBonus ? `+${log.pointsChanged}` : log.pointsChanged} đ
        </span>
      `;
      logsContainer.appendChild(div);
    });
  }

  const modal = document.getElementById('modal-student-detail');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeDetailModal() {
  const modal = document.getElementById('modal-student-detail');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// ==================== DỮ LIỆU MẪU & SAO LƯU ====================

// Protocol Phase 3: Nạp 10 học sinh mẫu (có đủ các chức vụ và điểm số giả lập)
function inject10SampleStudents(notify = true) {
  const sampleStudents = [
    { id: 'hs_01', fullName: 'Trần Minh Khang', groupNumber: 1, role: 'Lớp trưởng', isSpecialSupport: false },
    { id: 'hs_02', fullName: 'Lê Nguyễn Quỳnh Anh', groupNumber: 1, role: 'Bí thư', isSpecialSupport: false },
    { id: 'hs_03', fullName: 'Nguyễn Hoàng Long', groupNumber: 2, role: 'Lớp phó Học tập', isSpecialSupport: false },
    { id: 'hs_04', fullName: 'Phạm Đức Trọng', groupNumber: 2, role: 'Tổ trưởng', isSpecialSupport: false },
    { id: 'hs_05', fullName: 'Đặng Tuấn Kiệt', groupNumber: 3, role: 'Sao đỏ', isSpecialSupport: false },
    { id: 'hs_06', fullName: 'Vũ Hải Đăng', groupNumber: 3, role: 'Thành viên', isSpecialSupport: true }, // Cần theo dõi
    { id: 'hs_07', fullName: 'Hoàng Quốc Bảo', groupNumber: 4, role: 'Thành viên', isSpecialSupport: true }, // Cần theo dõi
    { id: 'hs_08', fullName: 'Ngô Thảo Nguyên', groupNumber: 4, role: 'Tổ trưởng', isSpecialSupport: false },
    { id: 'hs_09', fullName: 'Bùi Gia Huy', groupNumber: 5, role: 'Thành viên', isSpecialSupport: true }, // Cần theo dõi
    { id: 'hs_10', fullName: 'Đỗ Thùy Linh', groupNumber: 6, role: 'Tổ trưởng', isSpecialSupport: false }
  ];

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const sampleLogs = [
    // Lớp trưởng hoàn thành xuất sắc
    { id: 'log_01', date: today, studentId: 'hs_01', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự làm tốt nhiệm vụ tháng', pointsChanged: 20, recordedBy: 'GVCN', note: 'Quản lý 15 phút đầu giờ nghiêm túc', timestamp: Date.now() - 1000 },
    // Bí thư kèm bạn yếu Toán
    { id: 'log_02', date: today, studentId: 'hs_02', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'Kèm bạn yếu Toán/Lý (+10 cho cả hai)', pointsChanged: 10, recordedBy: 'Lớp trưởng', note: 'Kèm bạn Vũ Hải Đăng giải bài tập Đại số', timestamp: Date.now() - 2000 },
    // Vũ Hải Đăng (diện hỗ trợ) được cộng điểm kèm và nỗ lực
    { id: 'log_03', date: today, studentId: 'hs_06', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'Kèm bạn yếu Toán/Lý (+10 cho cả hai)', pointsChanged: 10, recordedBy: 'Lớp trưởng', note: 'Cùng bạn Quỳnh Anh học nhóm', timestamp: Date.now() - 3000 },
    { id: 'log_04', date: yesterday, studentId: 'hs_06', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Học sinh yếu có nỗ lực làm bài', pointsChanged: 10, recordedBy: 'GV Bộ môn Toán', note: 'Chủ động lên chữa bài tập về nhà', timestamp: Date.now() - 4000 },
    // Nguyễn Hoàng Long xung phong lên bảng
    { id: 'log_05', date: today, studentId: 'hs_03', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong lên bảng đúng', pointsChanged: 10, recordedBy: 'Sao đỏ Tổ 2', note: 'Tiết Hóa học', timestamp: Date.now() - 5000 },
    // Hoàng Quốc Bảo (diện hỗ trợ) vi phạm nói chuyện & không làm bài
    { id: 'log_06', date: yesterday, studentId: 'hs_07', type: 'violation', ruleKey: 'viol_no_homework', ruleLabel: 'Không làm bài / không học bài', pointsChanged: -10, recordedBy: 'Sao đỏ Tổ 4', note: 'Thiếu bài tập Tiếng Anh', timestamp: Date.now() - 6000 },
    { id: 'log_07', date: today, studentId: 'hs_07', type: 'violation', ruleKey: 'viol_distraction_phone', ruleLabel: 'Làm việc riêng / sử dụng ĐT / tự ý đổi chỗ', pointsChanged: -10, recordedBy: 'Tổ trưởng Tổ 4', note: 'Dùng điện thoại trong giờ Sinh học', timestamp: Date.now() - 7000 },
    // Bùi Gia Huy đi muộn
    { id: 'log_08', date: today, studentId: 'hs_09', type: 'violation', ruleKey: 'viol_late_uniform', ruleLabel: 'Đi muộn / sai đồng phục', pointsChanged: -5, recordedBy: 'Sao đỏ trực cổng', note: 'Muộn 10 phút tiết 1', timestamp: Date.now() - 8000 }
  ];

  appState.students = sampleStudents;
  appState.dailyLogs = sampleLogs;
  saveDataToStorage();
  refreshAllUI();

  if (notify) {
    showToast('Đã nạp thành công 10 học sinh mẫu và nhật ký thi đua thực tế!', 'success');
  }
}

// ==================== DỮ LIỆU CHÍNH THỨC 45 HỌC SINH 10A3 ====================
// Trường THPT Bùi Thị Xuân - Mũi Né (Sở GD&ĐT Lâm Đồng)
// Danh sách chuẩn xác 100% theo ảnh chụp sổ điểm lớp 10A3 (STT 1 đến 45)
// Phân bố đều 6 tổ theo điểm lực học đầu vào, đã loại các học sinh chuyển lớp/nghỉ học
const OFFICIAL_10A3_STUDENTS = [
  // ===== TỔ 1 (8 học sinh • Điểm TB Lực Học: 34.75) =====
  { id: 'hs_10a3_43', code: '1704246671', fullName: 'Dương Lục Yến Vy', dob: '24/09/2011', academicScore: 34, groupNumber: 1, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_41', code: '1701472685', fullName: 'Lê Gia Vũ', dob: '08/03/2011', academicScore: 35, groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_26', code: '1703554579', fullName: 'Cao Ngọc An Nhiên', dob: '14/12/2011', academicScore: 39, groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_30', code: '1701941035', fullName: 'Trần Thị Ngọc Phúc', dob: '09/09/2011', academicScore: 36, groupNumber: 1, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_14', code: '1704379491', fullName: 'Nguyễn Vinh Khang', dob: '16/10/2011', academicScore: 28, groupNumber: 1, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_25', code: '1702780397', fullName: 'Võ Thị Yến Nhi', dob: '16/04/2011', academicScore: 34, groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_32', code: '1704379981', fullName: 'Lê Tuấn Phát Tài', dob: '17/07/2011', academicScore: 34, groupNumber: 1, role: 'Cán sự Toán', isSpecialSupport: false },
  { id: 'hs_10a3_28', code: '1805586438', fullName: 'Võ Thành Phát', dob: '14/11/2011', academicScore: 36, groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },

  // ===== TỔ 2 (8 học sinh • Điểm TB Lực Học: 33.56) =====
  { id: 'hs_10a3_24', code: '1805586434', fullName: 'Nguyễn Hoàng Gia Nguyên', dob: '06/01/2011', academicScore: 38, groupNumber: 2, role: 'Tổ trưởng & CS Hóa', isSpecialSupport: false },
  { id: 'hs_10a3_33', code: '1703412028', fullName: 'Đỗ Quốc Thành', dob: '19/08/2011', academicScore: 35, groupNumber: 2, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_34', code: '1704831627', fullName: 'Nguyễn Ngọc Anh Thư', dob: '24/10/2011', academicScore: 29, groupNumber: 2, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_38', code: '1704784854', fullName: 'Nguyễn Thị Thanh Tuyền (12/01)', dob: '12/01/2011', academicScore: 31, groupNumber: 2, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_06', code: '1702759605', fullName: 'Trương Nguyễn Trường Giang', dob: '01/05/2011', academicScore: 35, groupNumber: 2, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_02', code: '1704683664', fullName: 'Nguyễn Thị Kim Bơ', dob: '10/08/2011', academicScore: 33, groupNumber: 2, role: 'Cán sự Văn', isSpecialSupport: false },
  { id: 'hs_10a3_03', code: '1805425255', fullName: 'Từ Diệu Yên Diễm', dob: '13/05/2011', academicScore: 33, groupNumber: 2, role: 'Thủ quỹ & CS Sử', isSpecialSupport: false },
  { id: 'hs_10a3_16', code: '1701502268', fullName: 'Nguyễn Tấn Kỳ', dob: '26/12/2011', academicScore: 37, groupNumber: 2, role: 'Thành viên', isSpecialSupport: false },

  // ===== TỔ 3 (8 học sinh • Điểm TB Lực Học: 34.00) =====
  { id: 'hs_10a3_10', code: '1703554565', fullName: 'Trần Bảo Phi Hoàng', dob: '16/12/2011', academicScore: 39, groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_01', code: '1702997113', fullName: 'Phan Thị Ngọc Ẩn', dob: '09/04/2011', academicScore: 35, groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_20', code: '1702880874', fullName: 'Nguyễn Bảo Long', dob: '24/04/2011', academicScore: 38, groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_05', code: '2201723937', fullName: 'Trần Hữu Đồng', dob: '01/03/2011', academicScore: 33, groupNumber: 3, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_04', code: '1703398860', fullName: 'Võ Ngọc Mỹ Duyên', dob: '30/01/2011', academicScore: 37, groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_36', code: '1701981797', fullName: 'Lê Thị Kim Trúc', dob: '25/08/2011', academicScore: 34, groupNumber: 3, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_37', code: '1701981799', fullName: 'Võ Bách Tùng', dob: '19/08/2011', academicScore: 34, groupNumber: 3, role: 'Sao đỏ', isSpecialSupport: false },

  // ===== TỔ 4 (8 học sinh • Điểm TB Lực Học: 35.31) =====
  { id: 'hs_10a3_15', code: '1704121058', fullName: 'Võ Quốc Duy Khôi', dob: '06/07/2011', academicScore: 35, groupNumber: 4, role: 'Tổ trưởng & CS Anh', isSpecialSupport: false },
  { id: 'hs_10a3_07', code: '1702780386', fullName: 'Tạ Thanh Ngọc Giàu', dob: '13/02/2011', academicScore: 26, groupNumber: 4, role: 'Bí thư', isSpecialSupport: true },
  { id: 'hs_10a3_45', code: '1703509575', fullName: 'Đỗ Khôi Vỹ', dob: '08/12/2011', academicScore: 36, groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_44', code: '2511977424', fullName: 'Phạm Ngọc Tường Vy', dob: '01/08/2010', academicScore: 34.5, groupNumber: 4, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_39', code: '1702759627', fullName: 'Nguyễn Thị Thanh Tuyền (14/06)', dob: '14/06/2011', academicScore: 38, groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_22', code: '1701941028', fullName: 'Nguyễn Hữu Đan Mạch', dob: '01/01/2011', academicScore: 39, groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_08', code: '1702997106', fullName: 'Ngô Thị Diễm Hằng', dob: '18/11/2011', academicScore: 37, groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_09', code: '1701980221', fullName: 'Nguyễn Vinh Hoa', dob: '15/07/2011', academicScore: 37, groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },

  // ===== TỔ 5 (7 học sinh • Điểm TB Lực Học: 33.43) =====
  { id: 'hs_10a3_35', code: '1703919858', fullName: 'Nguyễn Ngọc Trinh', dob: '18/04/2011', academicScore: 29, groupNumber: 5, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_27', code: '1702997079', fullName: 'Trần Lê Hồng Nhung', dob: '20/10/2011', academicScore: 36, groupNumber: 5, role: 'Lớp trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_42', code: '1702780409', fullName: 'Lê Văn Vũ', dob: '03/01/2011', academicScore: 39, groupNumber: 5, role: 'Lớp phó Học tập & CS Lý', isSpecialSupport: false },
  { id: 'hs_10a3_18', code: '1702780393', fullName: 'Nguyễn Đỗ Kim Yến Linh', dob: '19/06/2011', academicScore: 37, groupNumber: 5, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_31', code: '1704684848', fullName: 'Hoàng Thế Tài', dob: '04/10/2011', academicScore: 35, groupNumber: 5, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_12', code: '1701384874', fullName: 'Đỗ Tuấn Hưng', dob: '17/06/2011', academicScore: 29, groupNumber: 5, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_40', code: '1803521194', fullName: 'Trần Phúc Vinh', dob: '06/09/2011', academicScore: 29, groupNumber: 5, role: 'Thành viên', isSpecialSupport: true },

  // ===== TỔ 6 (7 học sinh • Điểm TB Lực Học: 35.43) =====
  { id: 'hs_10a3_23', code: '1704684195', fullName: 'Trương Thị Mỹ Ngân', dob: '23/02/2011', academicScore: 38, groupNumber: 6, role: 'Tổ trưởng & CS Sinh', isSpecialSupport: false },
  { id: 'hs_10a3_21', code: '1703805924', fullName: 'Trần Minh Luân', dob: '25/12/2011', academicScore: 25, groupNumber: 6, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_29', code: '1702716688', fullName: 'Nguyễn Xuân Phúc', dob: '23/11/2011', academicScore: 38, groupNumber: 6, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_17', code: '1702780666', fullName: 'Lê Thị Mỹ Linh', dob: '15/10/2011', academicScore: 36, groupNumber: 6, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_13', code: '1701502384', fullName: 'Lê Minh Khải', dob: '25/06/2011', academicScore: 37, groupNumber: 6, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_19', code: '1704303580', fullName: 'Bùi Nguyễn Hoàng Long', dob: '30/10/2011', academicScore: 38, groupNumber: 6, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_11', code: '1701470035', fullName: 'Nguyễn Quốc Huy', dob: '19/09/2011', academicScore: 23, groupNumber: 6, role: 'Lớp phó Lao động', isSpecialSupport: true }
];

// Khởi tạo toàn bộ 45 học sinh lớp 10A3 chuẩn cân bằng 6 tổ
function injectFull45StudentsPrompt() {
  if (confirm('Thao tác này sẽ tải danh sách 45 học sinh chính thức Lớp 10A3 phân bổ cân bằng 6 tổ theo điểm lực học (Trần Lê Hồng Nhung làm Lớp trưởng, Từ Diệu Yên Diễm làm Lớp phó). Tiếp tục?')) {
    injectOfficial45Students(true);
  }
}

function injectOfficial45Students(notify = true) {
  // Tự động dọn dẹp các khóa lưu trữ cũ nếu có
  try {
    localStorage.removeItem('dashboard10a3_students');
    localStorage.removeItem('dashboard10a3_logs');
    localStorage.removeItem('dashboard10a3_students_v2');
    localStorage.removeItem('dashboard10a3_logs_v2');
    localStorage.removeItem('dashboard10a3_official_students_v3');
    localStorage.removeItem('dashboard10a3_official_logs_v3');
    localStorage.removeItem('dashboard10a3_balanced_students_v4');
    localStorage.removeItem('dashboard10a3_balanced_logs_v4');
    localStorage.removeItem('dashboard10a3_balanced_students_v5');
    localStorage.removeItem('dashboard10a3_balanced_logs_v5');
  } catch (e) {}

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const sampleLogs = [
    // Lớp trưởng Trần Lê Hồng Nhung hoàn thành xuất sắc
    { id: 'log_01', date: today, studentId: 'hs_10a3_27', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự làm tốt nhiệm vụ tháng', pointsChanged: 20, recordedBy: 'GVCN', note: 'Quản lý nền nếp tự quản lớp 10A3 rất nghiêm túc', timestamp: Date.now() - 1000 },
    // Lớp phó Từ Diệu Yên Diễm kèm bạn học
    { id: 'log_02', date: today, studentId: 'hs_10a3_03', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'Kèm bạn yếu Toán/Lý (+10 cho cả hai)', pointsChanged: 10, recordedBy: 'Lớp trưởng', note: 'Kèm bạn Nguyễn Thị Kim Bơ ôn tập', timestamp: Date.now() - 2000 },
    { id: 'log_03', date: today, studentId: 'hs_10a3_02', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'Kèm bạn yếu Toán/Lý (+10 cho cả hai)', pointsChanged: 10, recordedBy: 'Lớp trưởng', note: 'Có tiến bộ rõ rệt trong giờ Toán', timestamp: Date.now() - 3000 },
    // Cán sự Toán Nguyễn Hữu Đan Mạch lên bảng giải bài
    { id: 'log_04', date: yesterday, studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong lên bảng đúng', pointsChanged: 10, recordedBy: 'Sao đỏ Tổ 1', note: 'Giải bài tập nâng cao Đại số', timestamp: Date.now() - 4000 },
    // Tổ trưởng Tổ 1 Dương Lục Yến Vy làm tốt nhiệm vụ
    { id: 'log_05', date: today, studentId: 'hs_10a3_43', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự làm tốt nhiệm vụ tháng', pointsChanged: 20, recordedBy: 'GVCN', note: 'Đôn đốc Tổ 1 hoàn thành 100% bài tập', timestamp: Date.now() - 5000 },
    // Tổ trưởng Tổ 4 Nguyễn Ngọc Trinh nỗ lực
    { id: 'log_06', date: today, studentId: 'hs_10a3_35', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Học sinh yếu có nỗ lực làm bài', pointsChanged: 10, recordedBy: 'GV Bộ môn', note: 'Hoàn thành tốt nhiệm vụ tổ trưởng', timestamp: Date.now() - 6000 },
    // Tổ trưởng Tổ 6 Trương Thị Mỹ Ngân
    { id: 'log_07', date: today, studentId: 'hs_10a3_23', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự làm tốt nhiệm vụ tháng', pointsChanged: 20, recordedBy: 'GVCN', note: 'Tổ 6 xếp hạng nhất tuần', timestamp: Date.now() - 7000 },
    // Nguyễn Quốc Huy nỗ lực
    { id: 'log_08', date: today, studentId: 'hs_10a3_11', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Học sinh yếu có nỗ lực làm bài', pointsChanged: 10, recordedBy: 'GVCN', note: 'Tiến bộ rõ rệt', timestamp: Date.now() - 8000 }
  ];

  // Nhân bản dữ liệu để tránh xung đột
  appState.students = JSON.parse(JSON.stringify(OFFICIAL_10A3_STUDENTS));
  appState.dailyLogs = sampleLogs;
  saveDataToStorage();
  refreshAllUI();

  if (notify) {
    showToast('Đã nạp danh sách 45 học sinh chính thức phân bổ cân bằng lực học 6 tổ!', 'success');
  }
}

// Reset toàn bộ về trắng
function resetAllData() {
  if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu học sinh và nhật ký thi đua không?')) {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    appState.students = [];
    appState.dailyLogs = [];
    appState.selectedStudentIds.clear();
    refreshAllUI();
    showToast('Đã đặt lại toàn bộ hệ thống về trạng thái ban đầu.', 'info');
  }
}

// Export JSON
function exportDataJSON() {
  const exportData = {
    className: '10A3',
    version: '1.0',
    exportTime: new Date().toISOString(),
    students: appState.students,
    dailyLogs: appState.dailyLogs
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  const fileName = `Backup_Lop10A3_${new Date().toISOString().split('T')[0]}.json`;
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast('Đã xuất file dự phòng JSON thành công!', 'success');
}

// Import JSON
function importDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (Array.isArray(parsed.students)) {
        appState.students = parsed.students;
        appState.dailyLogs = Array.isArray(parsed.dailyLogs) ? parsed.dailyLogs : [];
        saveDataToStorage();
        refreshAllUI();
        showToast(`Đã phục hồi thành công ${appState.students.length} học sinh và ${appState.dailyLogs.length} nhật ký!`, 'success');
      } else {
        showToast('File JSON không đúng định dạng dữ liệu Lớp 10A3!', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi đọc file JSON!', 'error');
    }
  };
  reader.readAsText(file);
}

// ==================== TIỆN ÍCH HỆ THỐNG ====================
function refreshAllUI() {
  renderDashboardStats();
  renderCharts();
  renderLeaderboard();
  renderScoringStudentPills();
  renderStudentsTable();
  renderLogsTable();
  renderScoringPermissionsUI();
  updateResetButtonsVisibility();
  if (typeof renderSeatingTab === 'function') {
    renderSeatingTab();
  }
  if (typeof renderCadreDuties === 'function') {
    renderCadreDuties();
  }
  if (typeof renderScoringRecentLogs === 'function') {
    renderScoringRecentLogs();
  }

  const countDisplay = document.getElementById('storage-count');
  if (countDisplay) {
    countDisplay.textContent = `${appState.dailyLogs.length} logs`;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-rose-600 text-white' : type === 'warning' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white';
  const iconClass = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info';

  toast.className = `${bgClass} px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto max-w-sm`;
  toast.innerHTML = `
    <i class="fa-solid ${iconClass} text-sm"></i>
    <span class="flex-1">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function generateUUID() {
  return 'id_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

function escapeHtml(string) {
  if (string === null || string === undefined) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ==========================================================================
// ==================== CHỨC NĂNG SƠ ĐỒ LỚP HỌC (SEATING PLAN) ====================
// ==================== 2 DÃY • 6 TỔ • 24 BÀN ĐÔI • 48 VỊ TRÍ NGỒI ====================
// ==========================================================================

/**
 * Tạo danh sách sơ đồ chỗ ngồi chuẩn ban đầu
 * Phân bổ đôi bạn cùng tiến (10 HS diện hỗ trợ ngồi cạnh Lớp trưởng, Tổ trưởng, Sao đỏ, Cán sự)
 */
function getDefaultSeating() {
  return [
    // ==================== DÃY 1 (Phía Cửa Sổ) - 12 BÀN (TỔ 1, 2, 3) ====================
    // --- TỔ 1 (Bàn 1 -> 4) ---
    // [HÀNG 1: BÀN 1 GHÉP BÀN 2 - BÀN ĐẦU TIÊN SÁT BỤC GIẢNG]
    {
      tableId: 'tbl_d1_t1',
      row: 1,
      groupNumber: 1,
      tableInGroup: 1,
      globalTable: 1,
      pairWithTable: 2,
      title: 'Bàn 1',
      subtitle: 'Ghép Bàn 2',
      leftSeat: { seatId: 'seat_r1_g1_t1_l', position: 'left', studentId: 'hs_10a3_41' }, // Lê Gia Vũ (35đ)
      rightSeat: { seatId: 'seat_r1_g1_t1_r', position: 'right', studentId: 'hs_10a3_25' } // Võ Thị Yến Nhi (34đ) [Đổi chỗ với Vinh Khang - Bàn 1 Dãy 1 sát bục giảng]
    },
    {
      tableId: 'tbl_d1_t2',
      row: 1,
      groupNumber: 1,
      tableInGroup: 2,
      globalTable: 2,
      pairWithTable: 1,
      title: 'Bàn 2',
      subtitle: 'Ghép Bàn 1',
      leftSeat: { seatId: 'seat_r1_g1_t2_l', position: 'left', studentId: 'hs_10a3_26' }, // Cao Ngọc An Nhiên (39đ, học rất giỏi, gương mẫu)
      rightSeat: { seatId: 'seat_r1_g1_t2_r', position: 'right', studentId: 'hs_10a3_14' } // Nguyễn Vinh Khang (Hỗ trợ - 28đ) [Đổi chỗ với Yến Nhi - An Nhiên kèm Vinh Khang]
    },
    // [HÀNG 2: BÀN 3 GHÉP BÀN 4 - TỔ TRƯỞNG NGỒI HÀNG SAU ĐỂ BAO QUÁT TỔ]
    {
      tableId: 'tbl_d1_t3',
      row: 1,
      groupNumber: 1,
      tableInGroup: 3,
      globalTable: 3,
      pairWithTable: 4,
      title: 'Bàn 3',
      subtitle: 'Ghép Bàn 4',
      leftSeat: { seatId: 'seat_r1_g1_t3_l', position: 'left', studentId: 'hs_10a3_30' }, // Trần Thị Ngọc Phúc (Sao đỏ - 36đ) [Đổi chỗ với Yến Vy]
      rightSeat: { seatId: 'seat_r1_g1_t3_r', position: 'right', studentId: 'hs_10a3_32' } // Lê Tuấn Phát Tài (Cán sự Toán - 34đ)
    },
    {
      tableId: 'tbl_d1_t4',
      row: 1,
      groupNumber: 1,
      tableInGroup: 4,
      globalTable: 4,
      pairWithTable: 3,
      title: 'Bàn 4',
      subtitle: 'Ghép Bàn 3',
      leftSeat: { seatId: 'seat_r1_g1_t4_l', position: 'left', studentId: 'hs_10a3_43' }, // Dương Lục Yến Vy (TỔ TRƯỞNG TỔ 1 - 34đ) [Đổi chỗ với Ngọc Phúc]
      rightSeat: { seatId: 'seat_r1_g1_t4_r', position: 'right', studentId: 'hs_10a3_28' } // Võ Thành Phát (36đ)
    },

    // --- TỔ 2 (Bàn 5 -> 8) ---
    // [HÀNG 3: BÀN 5 GHÉP BÀN 6]
    {
      tableId: 'tbl_d1_t5',
      row: 1,
      groupNumber: 2,
      tableInGroup: 1,
      globalTable: 5,
      pairWithTable: 6,
      title: 'Bàn 5',
      subtitle: 'Ghép Bàn 6',
      leftSeat: { seatId: 'seat_r1_g2_t1_l', position: 'left', studentId: 'hs_10a3_03' }, // Từ Diệu Yên Diễm (33đ)
      rightSeat: { seatId: 'seat_r1_g2_t1_r', position: 'right', studentId: 'hs_10a3_42' } // Lê Văn Vũ (Lớp phó Học tập & CS Lý - 39đ) [Đổi chỗ với Thanh Tuyền 12/01]
    },
    {
      tableId: 'tbl_d1_t6',
      row: 1,
      groupNumber: 2,
      tableInGroup: 2,
      globalTable: 6,
      pairWithTable: 5,
      title: 'Bàn 6',
      subtitle: 'Ghép Bàn 5',
      leftSeat: { seatId: 'seat_r1_g2_t2_l', position: 'left', studentId: 'hs_10a3_33' }, // Đỗ Quốc Thành (35đ) [Đổi chỗ với Ngọc Trinh]
      rightSeat: { seatId: 'seat_r1_g2_t2_r', position: 'right', studentId: 'hs_10a3_06' } // Trương Nguyễn Trường Giang (35đ)
    },
    // [HÀNG 4: BÀN 7 GHÉP BÀN 8 - TÁCH GIA NGUYÊN & GIA VŨ VỀ 2 PHÍA NGOÀI CÙNG]
    {
      tableId: 'tbl_d1_t7',
      row: 1,
      groupNumber: 2,
      tableInGroup: 3,
      globalTable: 7,
      pairWithTable: 8,
      title: 'Bàn 7',
      subtitle: 'Ghép Bàn 8',
      leftSeat: { seatId: 'seat_r1_g2_t3_l', position: 'left', studentId: 'hs_10a3_38' }, // Nguyễn Thị Thanh Tuyền (12/01) (Hỗ trợ - 31đ) [Đổi chỗ với Văn Vũ]
      rightSeat: { seatId: 'seat_r1_g2_t3_r', position: 'right', studentId: 'hs_10a3_35' } // Nguyễn Ngọc Trinh (Tổ trưởng T5 - 29đ) [Đổi chỗ với Quốc Thành]
    },
    {
      tableId: 'tbl_d1_t8',
      row: 1,
      groupNumber: 2,
      tableInGroup: 4,
      globalTable: 8,
      pairWithTable: 7,
      title: 'Bàn 8',
      subtitle: 'Ghép Bàn 7',
      leftSeat: { seatId: 'seat_r1_g2_t4_l', position: 'left', studentId: 'hs_10a3_02' }, // Nguyễn Thị Kim Bơ (Cán sự Văn - 33đ) [Học tốt]
      rightSeat: { seatId: 'seat_r1_g2_t4_r', position: 'right', studentId: 'hs_10a3_16' } // Nguyễn Tấn Kỳ (37đ)
    },

    // --- TỔ 3 (Bàn 9 -> 12) ---
    // [HÀNG 5: BÀN 9 GHÉP BÀN 10]
    {
      tableId: 'tbl_d1_t9',
      row: 1,
      groupNumber: 3,
      tableInGroup: 1,
      globalTable: 9,
      pairWithTable: 10,
      title: 'Bàn 9',
      subtitle: 'Ghép Bàn 10',
      leftSeat: { seatId: 'seat_r1_g3_t1_l', position: 'left', studentId: 'hs_10a3_37' }, // Võ Bách Tùng (Sao đỏ - 34đ) [Đổi chỗ với Hoàng Long]
      rightSeat: { seatId: 'seat_r1_g3_t1_r', position: 'right', studentId: 'hs_10a3_20' } // Nguyễn Bảo Long (38đ) [Bàn 9 Tổ 3: Bách Tùng & Bảo Long]
    },
    {
      tableId: 'tbl_d1_t10',
      row: 1,
      groupNumber: 3,
      tableInGroup: 2,
      globalTable: 10,
      pairWithTable: 9,
      title: 'Bàn 10',
      subtitle: 'Ghép Bàn 9',
      leftSeat: { seatId: 'seat_r1_g3_t2_l', position: 'left', studentId: 'hs_10a3_01' }, // Phan Thị Ngọc Ẩn (35đ)
      rightSeat: { seatId: 'seat_r1_g3_t2_r', position: 'right', studentId: 'hs_10a3_05' } // Trần Hữu Đồng (Hỗ trợ - 33đ) [Đôi bạn cùng tiến]
    },
    // [HÀNG 6: BÀN 11 GHÉP BÀN 12 - TỔ TRƯỞNG NGỒI HÀNG SAU ĐỂ BAO QUÁT TỔ]
    {
      tableId: 'tbl_d1_t11',
      row: 1,
      groupNumber: 3,
      tableInGroup: 3,
      globalTable: 11,
      pairWithTable: 12,
      title: 'Bàn 11',
      subtitle: 'Ghép Bàn 12',
      leftSeat: { seatId: 'seat_r1_g3_t3_l', position: 'left', studentId: null }, // Ghế trống dự phòng
      rightSeat: { seatId: 'seat_r1_g3_t3_r', position: 'right', studentId: 'hs_10a3_10' } // Trần Bảo Phi Hoàng (39đ) [Ngồi bàn ghép sát phía trên Kim Trúc]
    },
    {
      tableId: 'tbl_d1_t12',
      row: 1,
      groupNumber: 3,
      tableInGroup: 4,
      globalTable: 12,
      pairWithTable: 11,
      title: 'Bàn 12',
      subtitle: 'Ghép Bàn 11',
      leftSeat: { seatId: 'seat_r1_g3_t4_l', position: 'left', studentId: 'hs_10a3_04' }, // Võ Ngọc Mỹ Duyên (37đ) [Ngồi sát cạnh Kim Trúc]
      rightSeat: { seatId: 'seat_r1_g3_t4_r', position: 'right', studentId: 'hs_10a3_36' } // Lê Thị Kim Trúc (Tổ trưởng T3 - 34đ)
    },

    // ==================== DÃY 2 (Phía Cửa Ra Vào) - 12 BÀN (TỔ 4, 5, 6) ====================
    // --- TỔ 4 (Bàn 1 -> 4) ---
    // [HÀNG 1: BÀN 1 GHÉP BÀN 2 - BÀN ĐẦU TIÊN SÁT BỤC GIẢNG]
    {
      tableId: 'tbl_d2_t1',
      row: 2,
      groupNumber: 4,
      tableInGroup: 1,
      globalTable: 1,
      pairWithTable: 2,
      title: 'Bàn 1',
      subtitle: 'Ghép Bàn 2',
      leftSeat: { seatId: 'seat_r2_g4_t1_l', position: 'left', studentId: 'hs_10a3_07' }, // Tạ Thanh Ngọc Giàu (Bí thư - 26đ, nhỏ con) [Đổi chỗ với Đan Mạch - Bàn 1 Dãy 2 ghế trái]
      rightSeat: { seatId: 'seat_r2_g4_t1_r', position: 'right', studentId: 'hs_10a3_22' } // Nguyễn Hữu Đan Mạch (39đ, học giỏi, nghiêm túc) [Đổi chỗ với Ngọc Giàu - Bàn 1 Dãy 2 ghế phải]
    },
    {
      tableId: 'tbl_d2_t2',
      row: 2,
      groupNumber: 4,
      tableInGroup: 2,
      globalTable: 2,
      pairWithTable: 1,
      title: 'Bàn 2',
      subtitle: 'Ghép Bàn 1',
      leftSeat: { seatId: 'seat_r2_g4_t2_l', position: 'left', studentId: 'hs_10a3_39' }, // Nguyễn Thị Thanh Tuyền (14/06) (38đ)
      rightSeat: { seatId: 'seat_r2_g4_t2_r', position: 'right', studentId: 'hs_10a3_45' } // Đỗ Khôi Vỹ (36đ) [Khôi Vỹ lên bàn đầu sát bục giảng, không còn làm việc riêng]
    },
    // [HÀNG 2: BÀN 3 GHÉP BÀN 4 - TỔ TRƯỞNG NGỒI HÀNG SAU ĐỂ BAO QUÁT TỔ]
    {
      tableId: 'tbl_d2_t3',
      row: 2,
      groupNumber: 4,
      tableInGroup: 3,
      globalTable: 3,
      pairWithTable: 4,
      title: 'Bàn 3',
      subtitle: 'Ghép Bàn 4',
      leftSeat: { seatId: 'seat_r2_g4_t3_l', position: 'left', studentId: 'hs_10a3_34' }, // Nguyễn Ngọc Anh Thư (Hỗ trợ - 29đ)
      rightSeat: { seatId: 'seat_r2_g4_t3_r', position: 'right', studentId: 'hs_10a3_15' } // Võ Quốc Duy Khôi (Tổ trưởng T4 & CS Anh - 35đ) [Đổi chỗ với Tường Vy]
    },
    {
      tableId: 'tbl_d2_t4',
      row: 2,
      groupNumber: 4,
      tableInGroup: 4,
      globalTable: 4,
      pairWithTable: 3,
      title: 'Bàn 4',
      subtitle: 'Ghép Bàn 3',
      leftSeat: { seatId: 'seat_r2_g4_t4_l', position: 'left', studentId: 'hs_10a3_44' }, // Phạm Ngọc Tường Vy (34.5đ, Hỗ trợ) [Đổi chỗ với Duy Khôi - ngồi cạnh Diễm Hằng]
      rightSeat: { seatId: 'seat_r2_g4_t4_r', position: 'right', studentId: 'hs_10a3_08' } // Ngô Thị Diễm Hằng (37đ)
    },

    // --- TỔ 5 (Bàn 5 -> 8) ---
    // [HÀNG 3: BÀN 5 GHÉP BÀN 6]
    {
      tableId: 'tbl_d2_t5',
      row: 2,
      groupNumber: 5,
      tableInGroup: 1,
      globalTable: 5,
      pairWithTable: 6,
      title: 'Bàn 5',
      subtitle: 'Ghép Bàn 6',
      leftSeat: { seatId: 'seat_r2_g5_t1_l', position: 'left', studentId: 'hs_10a3_18' }, // Nguyễn Đỗ Kim Yến Linh (37đ)
      rightSeat: { seatId: 'seat_r2_g5_t1_r', position: 'right', studentId: 'hs_10a3_40' } // Trần Phúc Vinh (Hỗ trợ - 29đ) [Đôi bạn cùng tiến: Yến Linh kèm Phúc Vinh]
    },
    {
      tableId: 'tbl_d2_t6',
      row: 2,
      groupNumber: 5,
      tableInGroup: 2,
      globalTable: 6,
      pairWithTable: 5,
      title: 'Bàn 6',
      subtitle: 'Ghép Bàn 5',
      leftSeat: { seatId: 'seat_r2_g5_t2_l', position: 'left', studentId: 'hs_10a3_31' }, // Hoàng Thế Tài (35đ)
      rightSeat: { seatId: 'seat_r2_g5_t2_r', position: 'right', studentId: null } // Ghế trống dự phòng
    },
    // [HÀNG 4: BÀN 7 GHÉP BÀN 8 - TỔ TRƯỞNG & LỚP TRƯỞNG NGỒI HÀNG SAU BAO QUÁT TỔ]
    {
      tableId: 'tbl_d2_t7',
      row: 2,
      groupNumber: 5,
      tableInGroup: 3,
      globalTable: 7,
      pairWithTable: 8,
      title: 'Bàn 7',
      subtitle: 'Ghép Bàn 8',
      leftSeat: { seatId: 'seat_r2_g5_t3_l', position: 'left', studentId: 'hs_10a3_27' }, // Trần Lê Hồng Nhung (Lớp trưởng - 36đ)
      rightSeat: { seatId: 'seat_r2_g5_t3_r', position: 'right', studentId: 'hs_10a3_12' } // Đỗ Tuấn Hưng (Hỗ trợ - 29đ) [Đôi bạn cùng tiến: Hồng Nhung kèm Tuấn Hưng]
    },
    {
      tableId: 'tbl_d2_t8',
      row: 2,
      groupNumber: 5,
      tableInGroup: 4,
      globalTable: 8,
      pairWithTable: 7,
      title: 'Bàn 8',
      subtitle: 'Ghép Bàn 7',
      leftSeat: { seatId: 'seat_r2_g5_t4_l', position: 'left', studentId: 'hs_10a3_09' }, // Nguyễn Vinh Hoa (37đ)
      rightSeat: { seatId: 'seat_r2_g5_t4_r', position: 'right', studentId: 'hs_10a3_24' } // Nguyễn Hoàng Gia Nguyên (38đ) [Đổi chỗ với Vinh Hoa]
    },

    // --- TỔ 6 (Bàn 9 -> 12) ---
    // [HÀNG 5: BÀN 9 GHÉP BÀN 10]
    {
      tableId: 'tbl_d2_t9',
      row: 2,
      groupNumber: 6,
      tableInGroup: 1,
      globalTable: 9,
      pairWithTable: 10,
      title: 'Bàn 9',
      subtitle: 'Ghép Bàn 10',
      leftSeat: { seatId: 'seat_r2_g6_t1_l', position: 'left', studentId: 'hs_10a3_21' }, // Trần Minh Luân (Hỗ trợ - 25đ) [Bàn đầu Tổ 6]
      rightSeat: { seatId: 'seat_r2_g6_t1_r', position: 'right', studentId: 'hs_10a3_11' } // Nguyễn Quốc Huy (Lớp phó Lao động - 23đ) [Đôi bạn cùng tiến: Bảo Long kèm Quốc Huy]
    },
    {
      tableId: 'tbl_d2_t10',
      row: 2,
      groupNumber: 6,
      tableInGroup: 2,
      globalTable: 10,
      pairWithTable: 9,
      title: 'Bàn 10',
      subtitle: 'Ghép Bàn 9',
      leftSeat: { seatId: 'seat_r2_g6_t2_l', position: 'left', studentId: 'hs_10a3_17' }, // Lê Thị Mỹ Linh (36đ)
      rightSeat: { seatId: 'seat_r2_g6_t2_r', position: 'right', studentId: 'hs_10a3_19' } // Bùi Nguyễn Hoàng Long (38đ) [Đổi chỗ với Bách Tùng]
    },
    // [HÀNG 6: BÀN 11 GHÉP BÀN 12 - TỔ TRƯỞNG NGỒI HÀNG SAU ĐỂ BAO QUÁT TỔ]
    {
      tableId: 'tbl_d2_t11',
      row: 2,
      groupNumber: 6,
      tableInGroup: 3,
      globalTable: 11,
      pairWithTable: 12,
      title: 'Bàn 11',
      subtitle: 'Ghép Bàn 12',
      leftSeat: { seatId: 'seat_r2_g6_t3_l', position: 'left', studentId: 'hs_10a3_23' }, // Trương Thị Mỹ Ngân (TỔ TRƯỞNG TỔ 6 & CS Sinh - 38đ)
      rightSeat: { seatId: 'seat_r2_g6_t3_r', position: 'right', studentId: 'hs_10a3_29' } // Nguyễn Xuân Phúc (38đ) [Đôi bạn học tốt 38đ ở hàng sau]
    },
    {
      tableId: 'tbl_d2_t12',
      row: 2,
      groupNumber: 6,
      tableInGroup: 4,
      globalTable: 12,
      pairWithTable: 11,
      title: 'Bàn 12',
      subtitle: 'Ghép Bàn 11',
      leftSeat: { seatId: 'seat_r2_g6_t4_l', position: 'left', studentId: 'hs_10a3_13' }, // Lê Minh Khải (37đ) [Học sinh giỏi 37đ, tự giác tốt ngồi bàn cuối]
      rightSeat: { seatId: 'seat_r2_g6_t4_r', position: 'right', studentId: null } // Ghế trống dự phòng
    }
  ];
}

/**
 * Tải dữ liệu sơ đồ chỗ ngồi từ LocalStorage
 */
function loadSeatingData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEATING);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Kiểm tra tính toàn vẹn (đủ 24 bàn và chứa các học sinh của lớp)
      if (Array.isArray(parsed) && parsed.length === 24) {
        let changed = false;
        const t1 = parsed.find(t => t.tableId === 'tbl_d1_t1');
        const t2_d1 = parsed.find(t => t.tableId === 'tbl_d1_t2');
        const t4 = parsed.find(t => t.tableId === 'tbl_d2_t1');
        const t9_d1 = parsed.find(t => t.tableId === 'tbl_d1_t9');
        const t10_d2 = parsed.find(t => t.tableId === 'tbl_d2_t10');
        const t3_d2 = parsed.find(t => t.tableId === 'tbl_d2_t3');
        const t4_d2 = parsed.find(t => t.tableId === 'tbl_d2_t4');
        if (t1 && t1.rightSeat.studentId === 'hs_10a3_07') {
          t1.rightSeat.studentId = 'hs_10a3_14';
          changed = true;
        }
        if (t1 && t1.rightSeat.studentId === 'hs_10a3_14' && t2_d1 && t2_d1.rightSeat.studentId === 'hs_10a3_25') {
          t1.rightSeat.studentId = 'hs_10a3_25';
          t2_d1.rightSeat.studentId = 'hs_10a3_14';
          changed = true;
        }
        if (t3_d2 && t3_d2.rightSeat.studentId === 'hs_10a3_08' && t4_d2 && t4_d2.rightSeat.studentId === 'hs_10a3_44') {
          t3_d2.rightSeat.studentId = 'hs_10a3_44';
          t4_d2.rightSeat.studentId = 'hs_10a3_08';
          changed = true;
        }
        if (t3_d2 && t3_d2.rightSeat.studentId === 'hs_10a3_44' && t4_d2 && t4_d2.leftSeat.studentId === 'hs_10a3_15') {
          t3_d2.rightSeat.studentId = 'hs_10a3_15';
          t4_d2.leftSeat.studentId = 'hs_10a3_44';
          changed = true;
        }
        if (t4) {
          if (t4.leftSeat.studentId !== 'hs_10a3_07' || t4.rightSeat.studentId !== 'hs_10a3_22') {
            t4.leftSeat.studentId = 'hs_10a3_07';
            t4.rightSeat.studentId = 'hs_10a3_22';
            changed = true;
          }
        }
        if (t9_d1 && t9_d1.leftSeat.studentId === 'hs_10a3_19') {
          t9_d1.leftSeat.studentId = 'hs_10a3_37';
          changed = true;
        }
        if (t10_d2 && t10_d2.rightSeat.studentId === 'hs_10a3_37') {
          t10_d2.rightSeat.studentId = 'hs_10a3_19';
          changed = true;
        }
        if (changed) {
          appState.seating = parsed;
          saveSeatingData();
          return;
        }
        appState.seating = parsed;
        return;
      }
    }
  } catch (err) {
    console.warn('Lỗi khi đọc sơ đồ chỗ ngồi từ storage:', err);
  }
  // Mặc định tạo mới
  appState.seating = getDefaultSeating();
  saveSeatingData();
}

/**
 * Lưu dữ liệu sơ đồ chỗ ngồi vào LocalStorage
 */
function saveSeatingData() {
  try {
    localStorage.setItem(STORAGE_KEYS.SEATING, JSON.stringify(appState.seating));
  } catch (err) {
    console.error('Không thể lưu sơ đồ lớp:', err);
  }
}

/**
 * Render toàn bộ sơ đồ lớp học 24 bàn (4 bàn / tổ, 3 tổ / dãy)
 */
function renderSeatingPlan() {
  if (!appState.seating || appState.seating.length !== 24) {
    loadSeatingData();
  }

  // Render 6 tổ: Bảng ở DƯỚI CÙNG. Cụm 2 ở TRÊN, Cụm 1 ở DƯỚI sát bảng
  for (let g = 1; g <= 6; g++) {
    const container = document.getElementById(`group-${g}-tables`);
    if (!container) continue;

    const groupTables = appState.seating.filter(t => t.groupNumber === g);
    container.innerHTML = '';

    // CỤM 2: Hàng sau (xa Bảng hơn, hiển thị ở trên)
    if (groupTables.length >= 4) {
      const pair2El = renderPairedDesksCluster(groupTables[2], groupTables[3], g);
      container.appendChild(pair2El);
    }

    // CỤM 1: Hàng trước (sát Bảng hơn, hiển thị ở dưới)
    if (groupTables.length >= 2) {
      const pair1El = renderPairedDesksCluster(groupTables[0], groupTables[1], g);
      container.appendChild(pair1El);
    }
  }

  applySeatingFilters();
}

/**
 * Tạo phần tử DOM cho 1 Cụm Bàn Ghép (2 bàn kê ghép sát nhau: Bàn 1 + Bàn 2; Bàn 3 + Bàn 4...)
 */
function renderPairedDesksCluster(table1, table2, groupNumber) {
  const cluster = document.createElement('div');
  cluster.className = 'paired-desk-cluster bg-white dark:bg-slate-800 p-2 sm:p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-teal-400 transition shadow-xs';

  const desksGrid = document.createElement('div');
  desksGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch';

  const desk1 = renderDeskElement(table1);
  const desk2 = renderDeskElement(table2);

  // Xoay 180 độ theo góc nhìn giáo viên: Bàn 2 bên trái, Bàn 1 bên phải
  desksGrid.appendChild(desk2);
  desksGrid.appendChild(desk1);
  cluster.appendChild(desksGrid);

  return cluster;
}

/**
 * Tạo phần tử DOM cho 1 bàn học (gồm 2 chỗ ngồi, chỉ để lại tên học sinh)
 */
function renderDeskElement(table) {
  const desk = document.createElement('div');
  desk.className = 'classroom-desk bg-slate-50/70 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center';
  desk.id = table.tableId;

  // 2 chỗ ngồi
  const seatsContainer = document.createElement('div');
  seatsContainer.className = 'grid grid-cols-2 gap-1.5';

  const leftSeatEl = renderSeatSlot(table, table.leftSeat);
  const rightSeatEl = renderSeatSlot(table, table.rightSeat);

  // Xoay 180 độ theo góc nhìn giáo viên: Ghế bên phải bàn ở bên trái, ghế bên trái bàn ở bên phải
  seatsContainer.appendChild(rightSeatEl);
  seatsContainer.appendChild(leftSeatEl);
  desk.appendChild(seatsContainer);

  return desk;
}

/**
 * Tạo phần tử DOM cho 1 chỗ ngồi (ghế học sinh hoặc ghế trống)
 */
function renderSeatSlot(table, seat) {
  const slot = document.createElement('div');
  slot.dataset.seatId = seat.seatId;

  // Drag & drop event listeners
  slot.ondragover = handleSeatDragOver;
  slot.ondragleave = handleSeatDragLeave;
  slot.ondrop = (e) => handleSeatDrop(e, seat.seatId);

  // Nếu là ghế trống
  if (!seat.studentId) {
    slot.className = 'seat-empty p-2.5 flex items-center justify-center text-center cursor-pointer min-h-[58px] rounded-xl';
    slot.innerHTML = `<span class="text-xs text-slate-400 font-semibold italic">(Trống)</span>`;
    slot.onclick = () => handleSeatClick(seat.seatId, null);
    return slot;
  }

  // Tìm học sinh
  const student = appState.students.find(s => s.id === seat.studentId);
  if (!student) {
    slot.className = 'seat-empty p-2.5 flex items-center justify-center text-center cursor-pointer min-h-[58px] rounded-xl';
    slot.innerHTML = `<span class="text-xs text-slate-400 font-semibold italic">(Trống)</span>`;
    return slot;
  }

  const score = calculateStudentScore(student.id);
  const tier = getRankingTier(score);

  // Kiểm tra nếu là ghế đang được chọn để swap
  const isSwapSource = appState.swapSourceSeatId === seat.seatId;

  // Styling ghế: Tập trung hiển thị Họ và Tên học sinh rõ nét, không bị co ngắn
  slot.className = `seat-card p-2 sm:p-2.5 min-h-[58px] flex flex-col justify-center items-center text-center relative rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs transition ${isSwapSource ? 'seat-swap-source' : ''}`;
  slot.draggable = true;
  slot.ondragstart = (e) => handleSeatDragStart(e, seat.seatId);

  // Chức danh nhỏ gọn (hỗ trợ kiêm nhiệm chức vụ)
  let roleBadgeHtml = '';
  if (student.role && student.role !== 'Thành viên') {
    const badges = [];
    if (student.role.includes('Lớp trưởng')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-lead">LT</span>');
    if (student.role.includes('Lớp phó Lao động')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-deputy">LP LĐ</span>');
    else if (student.role.includes('Lớp phó')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-deputy">LP</span>');
    if (student.role.includes('Bí thư')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-sec">BT</span>');
    if (student.role.includes('Tổ trưởng')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-group">TT</span>');
    if (student.role.includes('Sao đỏ')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-redstar">SĐ</span>');
    if (student.role.includes('Toán')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">Toán</span>');
    if (student.role.includes('Lý')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Lý</span>');
    if (student.role.includes('Hóa')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200">Hóa</span>');
    if (student.role.includes('Anh')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Anh</span>');
    if (student.role.includes('Sinh')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-teal-50 text-teal-700 border border-teal-200">Sinh</span>');
    if (student.role.includes('Văn')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-pink-50 text-pink-700 border border-pink-200">Văn</span>');
    roleBadgeHtml = badges.join('');
  }

  const isGVCN = (appState.currentUserRole === 'gvcn');
  const peerBadgeHtml = (isGVCN && student.isSpecialSupport) ? 
    '<span class="text-[9px] text-amber-600 font-bold ml-1" title="Diện kèm cặp (Chỉ GVCN thấy)">🤝</span>' : '';

  slot.innerHTML = `
    <div class="w-full flex items-center justify-between mb-0.5 px-0.5 text-[10px]">
      <span class="font-bold ${tier.color.split(' ')[0]}">${score}đ</span>
      <div class="flex items-center">
        ${roleBadgeHtml}
        ${peerBadgeHtml}
      </div>
    </div>
    <div class="font-extrabold text-slate-800 text-xs sm:text-[13px] leading-tight text-center w-full px-0.5" title="${student.fullName}">
      ${student.fullName}
    </div>
  `;

  slot.onclick = () => handleSeatClick(seat.seatId, student.id);
  return slot;
}

// ==================== XỬ LÝ CLICK & ĐỔI CHỖ (SWAP & ACTIONS) ====================

/**
 * Bật / Tắt chế độ đổi chỗ
 */
function toggleSwapMode(forceState) {
  if (appState.currentUserRole === 'member') {
    showToast('Bạn đang ở Chế độ Chỉ Xem! Vui lòng đăng nhập Cán sự hoặc GVCN để sắp xếp chỗ ngồi.', 'warning');
    return;
  }

  if (typeof forceState === 'boolean') {
    appState.isSwapMode = forceState;
  } else {
    appState.isSwapMode = !appState.isSwapMode;
  }

  appState.swapSourceSeatId = null;

  const btn = document.getElementById('btn-toggle-swap');
  const banner = document.getElementById('swap-mode-banner');
  const btnText = document.getElementById('btn-swap-text');

  if (appState.isSwapMode) {
    if (btn) btn.className = 'inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition';
    if (btnText) btnText.textContent = 'Thoát Đổi Chỗ';
    if (banner) banner.classList.remove('hidden');
    showToast('Đã BẬT Chế độ Đổi chỗ: Hãy chọn học sinh thứ nhất!', 'info');
  } else {
    if (btn) btn.className = 'inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition';
    if (btnText) btnText.textContent = 'Chế Độ Đổi Chỗ';
    if (banner) banner.classList.add('hidden');
  }

  renderSeatingPlan();
}

/**
 * Click vào ghế ngồi
 */
function handleSeatClick(seatId, studentId) {
  // Nếu đang ở Swap Mode
  if (appState.isSwapMode) {
    if (!appState.swapSourceSeatId) {
      // Chọn nguồn
      if (!studentId) {
        showToast('Vui lòng chọn một học sinh trước để hoán đổi chỗ!', 'warning');
        return;
      }
      appState.swapSourceSeatId = seatId;
      const student = appState.students.find(s => s.id === studentId);
      const bannerText = document.getElementById('swap-banner-text');
      if (bannerText && student) {
        bannerText.textContent = `Đang chọn: ${student.fullName}. Hãy bấm vào chỗ ngồi thứ hai (hoặc ghế trống) để đổi!`;
      }
      renderSeatingPlan();
    } else {
      // Đã có nguồn, chọn đích
      if (appState.swapSourceSeatId === seatId) {
        // Hủy chọn
        appState.swapSourceSeatId = null;
        renderSeatingPlan();
        return;
      }
      // Thực hiện đổi chỗ
      executeSeatSwap(appState.swapSourceSeatId, seatId);
      appState.swapSourceSeatId = null;
      renderSeatingPlan();
    }
    return;
  }

  // Nếu không ở Swap Mode
  if (studentId) {
    openSeatActionModal(seatId, studentId);
  } else {
    // Ghế trống: hỏi xem có muốn bật chế độ đổi chỗ để chuyển ai vào đây không
    if (confirm('Ghế này hiện đang trống. Bạn có muốn chọn một học sinh để chuyển vào vị trí này không?')) {
      toggleSwapMode(true);
    }
  }
}

/**
 * Hoán đổi 2 ghế ngồi
 */
function executeSeatSwap(seatId1, seatId2) {
  let seat1Ref = null;
  let seat2Ref = null;

  for (const table of appState.seating) {
    if (table.leftSeat.seatId === seatId1) seat1Ref = table.leftSeat;
    if (table.rightSeat.seatId === seatId1) seat1Ref = table.rightSeat;
    if (table.leftSeat.seatId === seatId2) seat2Ref = table.leftSeat;
    if (table.rightSeat.seatId === seatId2) seat2Ref = table.rightSeat;
  }

  if (!seat1Ref || !seat2Ref) {
    showToast('Lỗi: Không tìm thấy vị trí ghế ngồi!', 'error');
    return;
  }

  const tempStudentId = seat1Ref.studentId;
  seat1Ref.studentId = seat2Ref.studentId;
  seat2Ref.studentId = tempStudentId;

  saveSeatingData();

  const student1 = appState.students.find(s => s.id === seat1Ref.studentId);
  const student2 = appState.students.find(s => s.id === seat2Ref.studentId);

  const name1 = student1 ? student1.fullName : 'Ghế trống';
  const name2 = student2 ? student2.fullName : 'Ghế trống';

  showToast(`Đã hoán đổi chỗ ngồi giữa "${name1}" và "${name2}"!`, 'success');
}

// ==================== KÉO THẢ (DRAG & DROP) ====================

function handleSeatDragStart(e, seatId) {
  e.dataTransfer.setData('text/plain', seatId);
  e.target.classList.add('seat-dragging');
}

function handleSeatDragOver(e) {
  e.preventDefault();
  const slot = e.currentTarget;
  if (!slot.classList.contains('seat-drag-over')) {
    slot.classList.add('seat-drag-over');
  }
}

function handleSeatDragLeave(e) {
  e.currentTarget.classList.remove('seat-drag-over');
}

function handleSeatDrop(e, targetSeatId) {
  e.preventDefault();
  e.currentTarget.classList.remove('seat-drag-over');
  const sourceSeatId = e.dataTransfer.getData('text/plain');

  if (sourceSeatId && sourceSeatId !== targetSeatId) {
    executeSeatSwap(sourceSeatId, targetSeatId);
    renderSeatingPlan();
  }
}

// ==================== MODAL THAO TÁC NHANH TRÊN GHẾ ====================

function openSeatActionModal(seatId, studentId) {
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  appState.activeModalSeat = { seatId, studentId };

  // Tìm thông tin bàn
  let tableInfo = '';
  for (const t of appState.seating) {
    if (t.leftSeat.seatId === seatId) tableInfo = `${t.title} • Dãy ${t.row} • Vị trí Trái`;
    if (t.rightSeat.seatId === seatId) tableInfo = `${t.title} • Dãy ${t.row} • Vị trí Phải`;
  }

  const score = calculateStudentScore(student.id);
  const tier = getRankingTier(score);

  document.getElementById('seat-action-student-name').textContent = student.fullName;
  document.getElementById('seat-action-meta').textContent = tableInfo || `Tổ ${student.groupNumber} • ${student.role}`;
  document.getElementById('seat-action-score').textContent = `${score}đ`;
  
  const rankEl = document.getElementById('seat-action-rank');
  rankEl.textContent = tier.label;
  rankEl.className = `px-2 py-0.5 rounded-full font-bold text-[11px] ${tier.color}`;

  const badgeEl = document.getElementById('seat-action-role-badge');
  badgeEl.innerHTML = `<span class="px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">${student.role}</span>`;

  document.getElementById('modal-seat-action').classList.remove('hidden');
  document.getElementById('modal-seat-action').classList.add('flex');
}

function closeSeatActionModal() {
  document.getElementById('modal-seat-action').classList.add('hidden');
  document.getElementById('modal-seat-action').classList.remove('flex');
  appState.activeModalSeat = null;
}

/**
 * Chấm điểm nhanh từ ghế ngồi
 */
function quickSeatScoring(ruleKey) {
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bạn đang ở Chế độ Chỉ Xem! Vui lòng đăng nhập Cán sự hoặc GVCN để chấm điểm.', 'warning');
    return;
  }
  if (!appState.activeModalSeat) return;
  const { studentId, seatId } = appState.activeModalSeat;
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  if (appState.currentUserRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(appState.currentUserRole.replace('lead_t', ''), 10);
    if (Number(student.groupNumber) !== leaderGroup) {
      showToast(`Bạn là Tổ trưởng Tổ ${leaderGroup}, chỉ được chấm điểm cho học sinh Tổ ${leaderGroup}!`, 'warning');
      return;
    }
  }

  let rule = BONUS_RULES.find(r => r.key === ruleKey) || VIOLATION_RULES.find(r => r.key === ruleKey);
  if (!rule) return;

  const today = new Date().toISOString().split('T')[0];
  const newLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    date: today,
    studentId: student.id,
    studentName: student.fullName,
    groupNumber: student.groupNumber,
    ruleKey: rule.key,
    ruleLabel: rule.label,
    pointsChanged: rule.points,
    type: rule.points > 0 ? 'bonus' : 'violation',
    recordedBy: 'GVCN / Sơ đồ lớp',
    note: 'Chấm nhanh trên sơ đồ chỗ ngồi',
    timestamp: Date.now()
  };

  appState.dailyLogs.unshift(newLog);
  saveDataToStorage();

  const newScore = calculateStudentScore(student.id);
  const tier = getRankingTier(newScore);

  // Update modal score
  document.getElementById('seat-action-score').textContent = `${newScore}đ`;
  const rankEl = document.getElementById('seat-action-rank');
  rankEl.textContent = tier.label;
  rankEl.className = `px-2 py-0.5 rounded-full font-bold text-[11px] ${tier.color}`;

  showToast(`Đã ghi nhận: ${rule.label} (${rule.points > 0 ? '+' : ''}${rule.points}đ) cho ${student.fullName}!`, rule.points > 0 ? 'success' : 'warning');

  // Cập nhật lại sơ đồ và thống kê
  renderDashboardStats();
  renderSeatingPlan();
}

/**
 * Bắt đầu đổi chỗ từ Modal
 */
function startSwapFromModal() {
  if (!appState.activeModalSeat) return;
  const seatId = appState.activeModalSeat.seatId;
  closeSeatActionModal();

  appState.isSwapMode = true;
  appState.swapSourceSeatId = seatId;

  const btn = document.getElementById('btn-toggle-swap');
  const banner = document.getElementById('swap-mode-banner');
  const btnText = document.getElementById('btn-swap-text');

  if (btn) btn.className = 'inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition';
  if (btnText) btnText.textContent = 'Thoát Đổi Chỗ';
  if (banner) banner.classList.remove('hidden');

  const student = appState.students.find(s => s.id === appState.activeModalSeat?.studentId);
  const bannerText = document.getElementById('swap-banner-text');
  if (bannerText && student) {
    bannerText.textContent = `Đang chọn: ${student.fullName}. Bấm vào ghế thứ hai (hoặc ghế trống) để đổi!`;
  }

  showToast('Đang chọn học sinh. Hãy click vào vị trí bạn muốn hoán đổi!', 'info');
  renderSeatingPlan();
}

/**
 * Xem lịch sử học sinh từ Modal chỗ ngồi
 */
function viewStudentDetailsFromModal() {
  if (!appState.activeModalSeat) return;
  const studentId = appState.activeModalSeat.studentId;
  closeSeatActionModal();
  openDetailModal(studentId);
}

// ==================== TÌM KIẾM, BỘ LỌC & IN ẤN ====================

function handleSeatingSearch(query) {
  appState.seatingSearch = query.trim().toLowerCase();
  applySeatingFilters();
}

function handleSeatingFilter(filterType) {
  appState.seatingFilter = filterType;
  applySeatingFilters();
}

function applySeatingFilters() {
  const query = appState.seatingSearch;
  const filter = appState.seatingFilter;

  const seatElements = document.querySelectorAll('.seat-card');
  seatElements.forEach(el => {
    const seatId = el.dataset.seatId;
    if (!seatId) return;

    // Tìm học sinh
    let studentId = null;
    for (const t of appState.seating) {
      if (t.leftSeat.seatId === seatId) studentId = t.leftSeat.studentId;
      if (t.rightSeat.seatId === seatId) studentId = t.rightSeat.studentId;
    }

    if (!studentId) return;
    const student = appState.students.find(s => s.id === studentId);
    if (!student) return;

    const score = calculateStudentScore(student.id);

    // Kiểm tra search
    let matchSearch = true;
    if (query) {
      const matchName = student.fullName.toLowerCase().includes(query);
      const matchCode = (student.studentCode || '').toLowerCase().includes(query);
      matchSearch = matchName || matchCode;
    }

    // Kiểm tra filter
    let matchFilter = true;
    if (filter === 'leaders') {
      matchFilter = ['Lớp trưởng', 'Lớp phó', 'Bí thư', 'Tổ trưởng', 'Sao đỏ'].some(k => student.role && student.role.includes(k)) || (student.role && (student.role.includes('Cán sự') || student.role.includes('CS')));
    } else if (filter === 'special') {
      matchFilter = !!student.isSpecialSupport;
    } else if (filter === 'tutoring') {
      // Học sinh hỗ trợ hoặc cán sự ngồi cùng bàn
      matchFilter = !!student.isSpecialSupport || ['Lớp trưởng', 'Lớp phó', 'Tổ trưởng', 'Sao đỏ'].includes(student.role) || (student.role && student.role.startsWith('Cán sự'));
    } else if (filter === 'low-score') {
      matchFilter = score < 80;
    }

    // Áp dụng style
    if (matchSearch && matchFilter) {
      el.style.opacity = '1';
      if (query && matchSearch) {
        el.classList.add('seat-search-highlight');
      } else {
        el.classList.remove('seat-search-highlight');
      }
    } else {
      el.style.opacity = '0.25';
      el.classList.remove('seat-search-highlight');
    }
  });
}

/**
 * Khôi phục sơ đồ chuẩn theo mô hình Đôi bạn cùng tiến
 */
function confirmResetDefaultSeating() {
  if (confirm('Bạn có chắc chắn muốn khôi phục lại Sơ đồ chỗ ngồi chuẩn (Đôi bạn cùng tiến: 10 học sinh diện hỗ trợ ngồi cạnh Cán sự / Bạn học tốt)?')) {
    appState.seating = getDefaultSeating();
    saveSeatingData();
    renderSeatingPlan();
    showToast('Đã khôi phục Sơ đồ chỗ ngồi chuẩn thành công!', 'success');
  }
}

/**
 * In sơ đồ lớp học ra file A4
 */
/**
 * Sinh mã HTML cho Bản In Sơ Đồ Lớp Học Chuẩn A4 Khổ Ngang (Fit 1 Trang 100%)
 */
function generatePrintSeatingHTML() {
  if (!appState.seating || appState.seating.length !== 24) {
    loadSeatingData();
  }

  const getStudentRoleTag = (student) => {
    if (!student || !student.role || student.role === 'Thành viên') {
      return '';
    }
    const tags = [];
    if (student.role.includes('Lớp trưởng')) tags.push('LT');
    if (student.role.includes('Lớp phó Lao động')) tags.push('LP LĐ');
    else if (student.role.includes('Lớp phó')) tags.push('LP');
    if (student.role.includes('Bí thư')) tags.push('BT');
    if (student.role.includes('Tổ trưởng')) tags.push('TT');
    if (student.role.includes('Sao đỏ')) tags.push('SĐ');
    if (student.role.includes('Toán')) tags.push('CS Toán');
    if (student.role.includes('Lý')) tags.push('CS Lý');
    if (student.role.includes('Hóa')) tags.push('CS Hóa');
    if (student.role.includes('Anh')) tags.push('CS Anh');
    if (student.role.includes('Sinh')) tags.push('CS Sinh');
    if (student.role.includes('Văn')) tags.push('CS Văn');
    return tags.length > 0 ? ' (' + tags.join(', ') + ')' : '';
  };

  const renderPrintSeat = (seat) => {
    if (!seat || !seat.studentId) {
      return `<div class="print-seat-cell flex items-center justify-center p-1 border-2 border-slate-700 min-h-[38px] rounded bg-white"></div>`;
    }
    const student = appState.students.find(s => s.id === seat.studentId);
    if (!student) {
      return `<div class="print-seat-cell flex items-center justify-center p-1 border-2 border-slate-700 min-h-[38px] rounded bg-white"></div>`;
    }
    const roleTag = getStudentRoleTag(student);
    return `
      <div class="print-seat-cell flex flex-col justify-center items-center text-center p-1 border-2 border-slate-800 min-h-[38px] rounded bg-white shadow-2xs">
        <span class="font-bold text-[11px] leading-tight text-black">${escapeHtml(student.fullName)}${roleTag ? `<span class="text-[9px] text-blue-900 font-semibold block">${escapeHtml(roleTag)}</span>` : ''}</span>
      </div>
    `;
  };

  const renderClusterRow = (t1, t2) => {
    return `
      <div class="grid grid-cols-4 gap-1.5 w-full">
        ${renderPrintSeat(t2.rightSeat)}
        ${renderPrintSeat(t2.leftSeat)}
        ${renderPrintSeat(t1.rightSeat)}
        ${renderPrintSeat(t1.leftSeat)}
      </div>
    `;
  };

  const renderGroupBrace = (leftGroupNum, rightGroupNum) => `
    <div class="col-span-2 flex items-center justify-between px-1 h-full min-h-[82px] select-none">
      <div class="flex items-center space-x-1">
        <svg class="h-[80px] w-3 text-slate-700 shrink-0" viewBox="0 0 16 84" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="none">
          <path d="M 2,2 Q 8,2 8,18 T 8,34 Q 8,40 14,42 Q 8,44 8,50 T 8,66 Q 8,82 2,82" />
        </svg>
        <span class="font-extrabold text-[11px] text-slate-800 whitespace-nowrap">Tổ ${leftGroupNum}</span>
      </div>
      <div class="flex items-center space-x-1">
        <span class="font-extrabold text-[11px] text-slate-800 whitespace-nowrap">Tổ ${rightGroupNum}</span>
        <svg class="h-[80px] w-3 text-slate-700 shrink-0" viewBox="0 0 16 84" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="none">
          <path d="M 14,2 Q 8,2 8,18 T 8,34 Q 8,40 2,42 Q 8,44 8,50 T 8,66 Q 8,82 14,82" />
        </svg>
      </div>
    </div>
  `;

  const g1 = appState.seating.filter(t => t.groupNumber === 1);
  const g2 = appState.seating.filter(t => t.groupNumber === 2);
  const g3 = appState.seating.filter(t => t.groupNumber === 3);
  const g4 = appState.seating.filter(t => t.groupNumber === 4);
  const g5 = appState.seating.filter(t => t.groupNumber === 5);
  const g6 = appState.seating.filter(t => t.groupNumber === 6);

  return `
    <div class="print-page-box bg-white text-black font-sans text-[11px] leading-tight w-full max-w-[285mm] mx-auto p-2">
      <div class="text-center pb-2">
        <h1 class="text-base md:text-lg font-extrabold text-black">
          Sơ đồ lớp 10A3 (2026-2027). GVCN: Nguyễn Vỹ
        </h1>
        <p class="text-xs italic font-semibold text-blue-900 mt-0.5">
          &ldquo;Kỷ luật tạo sức mạnh - Tri thức dẫn tương lai&rdquo;
        </p>
      </div>

      <div class="space-y-2 my-2">
        <!-- KHỐI 3: TỔ 6 (BÊN TRÁI) & TỔ 3 (BÊN PHẢI) - HÀNG CUỐI LỚP -->
        <div class="grid grid-cols-12 gap-2 items-center">
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g6[2], g6[3])}
            ${renderClusterRow(g6[0], g6[1])}
          </div>
          ${renderGroupBrace(6, 3)}
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g3[2], g3[3])}
            ${renderClusterRow(g3[0], g3[1])}
          </div>
        </div>

        <!-- KHỐI 2: TỔ 5 (BÊN TRÁI) & TỔ 2 (BÊN PHẢI) - HÀNG GIỮA LỚP -->
        <div class="grid grid-cols-12 gap-2 items-center">
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g5[2], g5[3])}
            ${renderClusterRow(g5[0], g5[1])}
          </div>
          ${renderGroupBrace(5, 2)}
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g2[2], g2[3])}
            ${renderClusterRow(g2[0], g2[1])}
          </div>
        </div>

        <!-- KHỐI 1: TỔ 4 (BÊN TRÁI) & TỔ 1 (BÊN PHẢI) - HÀNG ĐẦU LỚP, SÁT BẢNG -->
        <div class="grid grid-cols-12 gap-2 items-center">
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g4[2], g4[3])}
            ${renderClusterRow(g4[0], g4[1])}
          </div>
          ${renderGroupBrace(4, 1)}
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g1[2], g1[3])}
            ${renderClusterRow(g1[0], g1[1])}
          </div>
        </div>
      </div>

      <div class="mt-4 pt-2 border-t border-slate-300">
        <div class="grid grid-cols-12 gap-3 items-center">
          <div class="col-span-3">
            <div class="border-2 border-slate-800 rounded px-3 py-2 text-center font-extrabold text-xs uppercase bg-white flex items-center justify-center space-x-2 min-h-[50px]">
              <span class="tracking-widest">CỬA VÀO</span>
              <span class="text-base font-black">&rArr;</span>
            </div>
          </div>
          <div class="col-span-6">
            <div class="border-2 border-slate-800 rounded py-2 text-center font-extrabold text-sm uppercase bg-white tracking-widest min-h-[50px] flex items-center justify-center">
              BẢNG
            </div>
          </div>
          <div class="col-span-3">
            <div class="border-2 border-slate-800 rounded px-3 py-1.5 bg-white min-h-[50px] flex items-center justify-center space-x-2.5 shadow-2xs">
              <svg class="h-10 w-9 shrink-0 drop-shadow-xs select-none" viewBox="0 0 64 74" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="32" cy="66" rx="14" ry="3.5" fill="#cbd5e1" stroke="#334155" stroke-width="1.6"/>
                <path d="M 19,43 C 15,51 16,62 19,66 C 22,68 42,68 45,66 C 48,62 49,51 45,43 C 42,39 37,38 32,38 C 27,38 22,39 19,43 Z" fill="url(#vaseGradPrint)" stroke="#334155" stroke-width="1.6"/>
                <path d="M 19,53 C 25,56 39,56 45,53 C 44,56 43,58 42,59 C 37,61 27,61 22,59 C 21,58 20,56 19,53 Z" fill="#d97706" stroke="#b45309" stroke-width="0.8"/>
                <ellipse cx="32" cy="54" rx="10" ry="2" fill="#fef08a" opacity="0.6"/>
                <ellipse cx="32" cy="39" rx="9" ry="2.8" fill="#f8fafc" stroke="#334155" stroke-width="1.6"/>
                <path d="M 32,39 C 18,37 8,43 4,41 C 4,35 12,30 24,35 Z" fill="#15803d" stroke="#14532d" stroke-width="1"/>
                <path d="M 32,39 C 46,37 56,43 60,41 C 60,35 52,30 40,35 Z" fill="#16a34a" stroke="#14532d" stroke-width="1"/>
                <path d="M 32,36 C 21,28 14,20 10,16 C 17,15 25,20 29,28 Z" fill="#15803d" stroke="#14532d" stroke-width="1"/>
                <path d="M 32,36 C 43,28 50,20 54,16 C 47,15 39,20 35,28 Z" fill="#16a34a" stroke="#14532d" stroke-width="1"/>
                <g transform="translate(18, 23)">
                  <path d="M 0,0 C -9,-6 -15,-3 -17,0 C -14,4 -8,5 0,0 Z" fill="#dc2626"/>
                  <path d="M 0,0 C -6,-11 -2,-15 0,-16 C 3,-13 4,-7 0,0 Z" fill="#ef4444"/>
                  <path d="M 0,0 C 7,-9 12,-6 13,-1 C 10,3 5,4 0,0 Z" fill="#b91c1c"/>
                  <path d="M 0,0 C -9,5 -11,11 -9,13 C -5,12 0,6 0,0 Z" fill="#dc2626"/>
                  <circle cx="0" cy="0" r="2.5" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
                </g>
                <g transform="translate(46, 23)">
                  <path d="M 0,0 C 9,-6 15,-3 17,0 C 14,4 8,5 0,0 Z" fill="#dc2626"/>
                  <path d="M 0,0 C 6,-11 2,-15 0,-16 C -3,-13 -4,-7 0,0 Z" fill="#ef4444"/>
                  <path d="M 0,0 C -7,-9 -12,-6 -13,-1 C -10,3 -5,4 0,0 Z" fill="#b91c1c"/>
                  <path d="M 0,0 C 9,5 11,11 9,13 C 5,12 0,6 0,0 Z" fill="#dc2626"/>
                  <circle cx="0" cy="0" r="2.5" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
                </g>
                <g transform="translate(32, 17)">
                  <path d="M 0,0 C -5,-17 -1,-23 0,-25 C 2,-23 6,-17 0,0 Z" fill="#b91c1c"/>
                  <path d="M 0,0 C -17,-13 -23,-9 -25,-6 C -21,-2 -14,0 0,0 Z" fill="#b91c1c"/>
                  <path d="M 0,0 C 17,-13 23,-9 25,-6 C 21,-2 14,0 0,0 Z" fill="#b91c1c"/>
                  <path d="M 0,0 C -17,11 -19,17 -17,20 C -12,18 -7,11 0,0 Z" fill="#991b1b"/>
                  <path d="M 0,0 C 17,11 19,17 17,20 C 12,18 7,11 0,0 Z" fill="#991b1b"/>
                  <path d="M 0,0 C -13,-17 -9,-21 -4,-22 C -1,-17 0,-11 0,0 Z" fill="#dc2626"/>
                  <path d="M 0,0 C 13,-17 9,-21 4,-22 C 1,-17 0,-11 0,0 Z" fill="#dc2626"/>
                  <path d="M 0,0 C -19,-5 -21,-1 -19,3 C -14,4 -7,2 0,0 Z" fill="#ef4444"/>
                  <path d="M 0,0 C 19,-5 21,-1 19,3 C 14,4 7,2 0,0 Z" fill="#ef4444"/>
                  <path d="M 0,0 C -11,13 -13,18 -10,19 C -5,16 -2,10 0,0 Z" fill="#dc2626"/>
                  <path d="M 0,0 C 11,13 13,18 10,19 C 5,16 2,10 0,0 Z" fill="#dc2626"/>
                  <path d="M 0,0 C -5,-12 0,-16 0,-16 C 2,-14 4,-10 0,0 Z" fill="#f87171"/>
                  <path d="M 0,0 C -12,-3 -14,0 -13,2 C -9,3 -4,1 0,0 Z" fill="#ef4444"/>
                  <path d="M 0,0 C 12,-3 14,0 13,2 C 9,3 4,1 0,0 Z" fill="#ef4444"/>
                  <circle cx="-2" cy="-2" r="2.2" fill="#fde047" stroke="#ca8a04" stroke-width="0.7"/>
                  <circle cx="2" cy="-2" r="2.2" fill="#facc15" stroke="#ca8a04" stroke-width="0.7"/>
                  <circle cx="0" cy="2" r="2.4" fill="#f59e0b" stroke="#b45309" stroke-width="0.7"/>
                  <circle cx="-3.2" cy="2" r="1.5" fill="#facc15"/>
                  <circle cx="3.2" cy="2" r="1.5" fill="#fde047"/>
                  <circle cx="0" cy="-4.2" r="1.6" fill="#facc15"/>
                </g>
                <path d="M 23,45 C 22,50 23,58 24,62" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
                <defs>
                  <linearGradient id="vaseGradPrint" x1="16" y1="39" x2="48" y2="66" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="35%" stop-color="#f8fafc"/>
                    <stop offset="70%" stop-color="#e2e8f0"/>
                    <stop offset="100%" stop-color="#cbd5e1"/>
                  </linearGradient>
                </defs>
              </svg>
              <span class="font-black text-xs uppercase tracking-wide text-slate-900">BÀN GIÁO VIÊN</span>
            </div>
          </div>
        </div>

        <div class="mt-3 py-1.5 px-3 bg-amber-50 border border-amber-300 rounded text-center font-bold text-[11px] text-amber-900 shadow-2xs">
          Kính nhờ thầy cô GVBM ghi tên học sinh đổi chỗ ngồi và lỗi vi phạm vào sổ đầu bài
        </div>
      </div>
    </div>
  `;
}

function openPrintPreviewModal() {
  if (appState.currentUserRole !== 'gvcn') {
    showToast('Chức năng Xuất / In sơ đồ lớp học chỉ dành riêng cho GVCN!', 'warning');
    appState.pendingRoleId = 'gvcn';
    openRolePinModal('gvcn');
    return;
  }
  const modal = document.getElementById('modal-print-preview');
  const content = document.getElementById('print-preview-content');
  if (!modal || !content) {
    // Nếu chưa có modal, in trực tiếp
    printSeatingChart();
    return;
  }

  // Cập nhật nội dung xem trước
  content.innerHTML = generatePrintSeatingHTML();

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePrintPreviewModal() {
  const modal = document.getElementById('modal-print-preview');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

/**
 * Thực hiện in sơ đồ lớp học: Đảm bảo thấy hết 100% lớp học trong 1 trang A4
 */
function printSeatingChart() {
  // Cập nhật khung in ẩn cho chế độ print của trình duyệt
  let printContainer = document.getElementById('print-seating-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'print-seating-container';
    printContainer.className = 'hidden print:block';
    const section = document.getElementById('section-seating');
    if (section) section.appendChild(printContainer);
  }
  printContainer.innerHTML = generatePrintSeatingHTML();

  // Đóng modal xem trước nếu đang mở để tránh in đè
  closePrintPreviewModal();

  // Kích hoạt in trình duyệt
  setTimeout(() => {
    window.print();
  }, 150);
}

// ==================== TRUNG TÂM BIỂU MẪU SƯ PHẠM (KỶ LUẬT TÍCH CỰC & GDPT 2018) ====================

function initFormsTab() {
  populateFormStudentSelect();
  selectPedagogicalForm(appState.activeFormId || 'form1');
}

function populateFormStudentSelect() {
  const select = document.getElementById('form-student-select');
  if (!select) return;

  const currentVal = appState.selectedFormStudentId || select.value || '';
  const sortedStudents = [...appState.students].sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));

  select.innerHTML = `
    <option value="">-- In Phôi Trống (Phát cho học sinh viết tay) --</option>
    ${sortedStudents.map(s => {
      const badge = s.isSpecialSupport ? ' 🤝' : '';
      const roleStr = s.role && s.role !== 'Thành viên' ? ` (${s.role})` : '';
      return `<option value="${s.id}" ${s.id === currentVal ? 'selected' : ''}>Tổ ${s.groupNumber}: ${s.fullName} • ${s.academicScore}đ${badge}${roleStr}</option>`;
    }).join('')}
  `;
}

function selectPedagogicalForm(formId) {
  appState.activeFormId = formId;

  const tabs = ['form1', 'form2', 'form3'];
  tabs.forEach(id => {
    const btn = document.getElementById(`tab-form-btn-${id}`);
    if (btn) {
      if (id === formId) {
        btn.className = 'form-nav-btn px-3 py-2 text-xs font-bold rounded-lg transition bg-white text-purple-700 shadow-xs border border-purple-200';
      } else {
        btn.className = 'form-nav-btn px-3 py-2 text-xs font-bold rounded-lg transition text-slate-600 hover:text-slate-900 border border-transparent';
      }
    }
  });

  renderPedagogicalForm();
}

function onFormStudentChange() {
  const select = document.getElementById('form-student-select');
  appState.selectedFormStudentId = select ? select.value : '';
  renderPedagogicalForm();
}

/**
 * Tìm bạn cùng bàn (Đôi bạn cùng tiến) của học sinh dựa trên Sơ đồ chỗ ngồi
 */
function getDeskMate(studentId) {
  if (!appState.seating || !studentId) return null;
  for (const tbl of appState.seating) {
    if (tbl.leftSeat && tbl.leftSeat.studentId === studentId) {
      return tbl.rightSeat && tbl.rightSeat.studentId 
        ? appState.students.find(s => s.id === tbl.rightSeat.studentId) 
        : null;
    }
    if (tbl.rightSeat && tbl.rightSeat.studentId === studentId) {
      return tbl.leftSeat && tbl.leftSeat.studentId 
        ? appState.students.find(s => s.id === tbl.leftSeat.studentId) 
        : null;
    }
  }
  return null;
}

function renderPedagogicalForm() {
  const container = document.getElementById('pedagogical-form-paper');
  if (!container) return;

  const student = appState.selectedFormStudentId 
    ? appState.students.find(s => s.id === appState.selectedFormStudentId) 
    : null;
  const deskMate = student ? getDeskMate(student.id) : null;

  let formHtml = '';
  if (appState.activeFormId === 'form1') {
    formHtml = generateForm1HTML(student);
  } else if (appState.activeFormId === 'form2') {
    formHtml = generateForm2HTML(student, deskMate);
  } else if (appState.activeFormId === 'form3') {
    formHtml = generateForm3HTML(student, deskMate);
  }

  container.innerHTML = formHtml;
}

/**
 * BIỂU MẪU 01: PHIẾU KHẢO SÁT TÂM TƯ & HỒ SƠ CÁ NHÂN HỌC SINH
 */
function generateForm1HTML(student) {
  const nameVal = student ? student.fullName : '....................................................................';
  const groupVal = student ? `Tổ ${student.groupNumber}` : '................';
  const dobVal = student ? student.dob : '....... / ....... / 2011';

  return `
    <div class="pedagogical-a4-document space-y-4 text-slate-800 leading-relaxed">
      <!-- Header Bộ GD&ĐT -->
      <div class="flex justify-between items-start border-b pb-3 border-slate-300">
        <div class="text-center font-bold text-xs uppercase leading-tight">
          SỞ GD&ĐT LÂM ĐỒNG<br>
          <span class="text-sm font-extrabold text-blue-900">TRƯỜNG THPT BÙI THỊ XUÂN - MŨI NÉ</span><br>
          <span class="font-normal text-[11px] text-slate-500">Lớp: 10A3 • Năm học 2026 - 2027</span>
        </div>
        <div class="text-center font-bold text-xs leading-tight">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          <span class="text-xs font-semibold underline">Độc lập — Tự do — Hạnh phúc</span><br>
          <span class="font-normal italic text-[11px] text-slate-500">Mũi Né, ngày ..... tháng ..... năm 2026</span>
        </div>
      </div>

      <!-- Tiêu đề chính -->
      <div class="text-center py-2">
        <h1 class="text-base sm:text-lg font-black uppercase text-purple-900 tracking-wide">
          PHIẾU KHẢO SÁT TÂM TƯ & NGUYỆN VỌNG HỌC SINH LỚP 10
        </h1>
        <p class="text-xs italic text-slate-600 mt-0.5">
          (Dành cho GVCN phát đầu năm hoặc làm việc riêng – Thông tin bảo mật tuyệt đối theo tinh thần Trường học hạnh phúc)
        </p>
      </div>

      <!-- Lời nhắn tâm huyết từ GVCN -->
      <div class="bg-purple-50/60 p-3 rounded-lg border border-purple-200 text-xs italic text-purple-950">
        <p><b>Thầy/Cô gửi các em:</b> Bước vào bậc THPT với môi trường học tập mới chắc hẳn các em có nhiều bỡ ngỡ, lo âu và áp lực. Phiếu này là cầu nối chân thành, cởi mở giữa em và Thầy/Cô chủ nhiệm. Mọi chia sẻ của em đều được giữ kín hoàn toàn để Thầy/Cô có thể thấu hiểu, đồng hành và hỗ trợ em tốt nhất trên hành trình 3 năm cấp 3 sắp tới.</p>
      </div>

      <!-- Thông tin cá nhân -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
        <div><b>Họ và tên:</b> <span class="text-blue-900 font-bold">${nameVal}</span></div>
        <div><b>Lớp:</b> <span class="font-bold">10A3</span> • <b>Tổ:</b> ${groupVal}</div>
        <div><b>Ngày sinh:</b> ${dobVal}</div>
      </div>

      <!-- Các câu hỏi khảo sát -->
      <div class="space-y-3.5 text-xs pt-2">
        <div>
          <p class="font-bold text-slate-900">1. Sở thích, đam mê hoặc năng khiếu nổi trội của em (thể thao, âm nhạc, đồ họa, công nghệ, đọc sách, hoạt động phong trào...):</p>
          <p class="border-b border-dotted border-slate-400 py-1 text-slate-600">&nbsp;</p>
        </div>

        <div>
          <p class="font-bold text-slate-900">2. Môn học em cảm thấy tự tin và hứng thú nhất hiện nay:</p>
          <div class="grid grid-cols-2 gap-2 mt-1">
            <p>• Môn học: ....................................................................</p>
            <p>• Lý do yêu thích: ............................................................</p>
          </div>
        </div>

        <div>
          <p class="font-bold text-slate-900">3. Môn học em cảm thấy gặp nhiều khó khăn, lo lắng nhất:</p>
          <p class="mt-1">• Tên môn học: .........................................................................................................................</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5 pl-2 text-[11px] text-slate-700">
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Mất gốc từ THCS</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Phương pháp học mới khó</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Bài tập quá nhiều</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Ngại hỏi thầy cô</span></label>
          </div>
        </div>

        <div>
          <p class="font-bold text-slate-900">4. Ước mơ nghề nghiệp hoặc định hướng của em sau khi tốt nghiệp THPT:</p>
          <p class="border-b border-dotted border-slate-400 py-1 text-slate-600">&nbsp;</p>
        </div>

        <div>
          <p class="font-bold text-slate-900">5. Ở gia đình, ai là người em cảm thấy tin tưởng và dễ tâm sự nhất?</p>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1.5 pl-2 text-[11px] text-slate-700">
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Bố</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Mẹ</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Anh / Chị / Em</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Bạn thân</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Không có ai</span></label>
          </div>
        </div>

        <div>
          <p class="font-bold text-slate-900">6. Áp lực hoặc lo lắng lớn nhất của em trong giai đoạn này là gì?</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 pl-2 text-[11px] text-slate-700">
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Điểm số & thi cử</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Kỳ vọng của cha mẹ</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Mối quan hệ bạn bè</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Cám dỗ game / MXH</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Khó khăn kinh tế / gia đình</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Áp lực khác...</span></label>
          </div>
        </div>

        <div>
          <p class="font-bold text-slate-900">7. Điều em mong muốn Thầy/Cô chủ nhiệm hỗ trợ hoặc lắng nghe nhất trong năm học này:</p>
          <p class="border-b border-dotted border-slate-400 py-1.5 text-slate-600">&nbsp;</p>
          <p class="border-b border-dotted border-slate-400 py-1.5 text-slate-600">&nbsp;</p>
        </div>
      </div>

      <!-- Chữ ký -->
      <div class="pt-6 flex justify-between text-xs text-center">
        <div class="w-1/2"></div>
        <div class="w-1/2">
          <p class="font-bold">HỌC SINH BÀY TỎ TÂM TƯ</p>
          <p class="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên - có thể để ẩn danh)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-slate-700">${student ? student.fullName : '........................................................'}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * BIỂU MẪU 02: BẢN GIAO ƯỚC HÀNH VI VÀ KẾ HOẠCH TIẾN BỘ CÁ NHÂN
 */
function generateForm2HTML(student, deskMate) {
  const nameVal = student ? student.fullName : '....................................................................';
  const groupVal = student ? `Tổ ${student.groupNumber}` : '................';
  const deskMateVal = deskMate ? `${deskMate.fullName}${deskMate.role !== 'Thành viên' ? ' (' + deskMate.role + ')' : ''}` : '....................................................................';

  return `
    <div class="pedagogical-a4-document space-y-4 text-slate-800 leading-relaxed">
      <!-- Header Bộ GD&ĐT -->
      <div class="flex justify-between items-start border-b pb-3 border-slate-300">
        <div class="text-center font-bold text-xs uppercase leading-tight">
          SỞ GD&ĐT LÂM ĐỒNG<br>
          <span class="text-sm font-extrabold text-blue-900">TRƯỜNG THPT BÙI THỊ XUÂN - MŨI NÉ</span><br>
          <span class="font-normal text-[11px] text-slate-500">Lớp: 10A3 • Năm học 2026 - 2027</span>
        </div>
        <div class="text-center font-bold text-xs leading-tight">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          <span class="text-xs font-semibold underline">Độc lập — Tự do — Hạnh phúc</span><br>
          <span class="font-normal italic text-[11px] text-slate-500">Mũi Né, ngày ..... tháng ..... năm 2026</span>
        </div>
      </div>

      <!-- Tiêu đề chính -->
      <div class="text-center py-2">
        <h1 class="text-base sm:text-lg font-black uppercase text-purple-900 tracking-wide">
          BẢN GIAO ƯỚC HÀNH VI & KẾ HOẠCH TIẾN BỘ CÁ NHÂN
        </h1>
        <p class="text-xs italic text-slate-600 mt-0.5">
          (Thực hiện theo định hướng Kỷ luật tích cực – Tự nguyện ký kết giữa Học sinh, Phụ huynh và GVCN)
        </p>
      </div>

      <!-- Thông tin & Cam kết mở đầu -->
      <div class="text-xs space-y-2">
        <p>Hôm nay, ngày ..... tháng ..... năm 2026, tại Trường THPT Bùi Thị Xuân - Mũi Né.</p>
        <p>Tôi tên là: <span class="text-blue-900 font-bold">${nameVal}</span> &nbsp;&nbsp;•&nbsp;&nbsp; Học sinh Lớp: <b>10A3</b> &nbsp;&nbsp;•&nbsp;&nbsp; ${groupVal}</p>
        <p class="italic text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
          "Nhận thức rõ trách nhiệm của bản thân đối với kết quả học tập và rèn luyện đạo đức tại trường, được sự lắng nghe và định hướng từ Thầy/Cô chủ nhiệm, tôi tự nguyện lập bản giao ước này và cam kết nỗ lực thực hiện nghiêm túc trong 4 tuần tới:"
        </p>
      </div>

      <!-- Các hạng mục giao ước -->
      <div class="space-y-3.5 text-xs pt-1">
        <div>
          <p class="font-bold text-rose-900 uppercase">I. 03 Hành vi em cam kết tự giác chấm dứt (Từ bỏ thói quen xấu):</p>
          <div class="space-y-1.5 mt-1 pl-2">
            <p>1. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">Không đi học muộn, không cúp tiết, không vắng không phép.</span></p>
            <p>2. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">Không sử dụng điện thoại tùy tiện / chơi game / làm việc riêng trong giờ học.</span></p>
            <p>3. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">........................................................................................................................................................</span></p>
          </div>
        </div>

        <div>
          <p class="font-bold text-emerald-900 uppercase">II. 03 Hành vi tích cực em cam kết thực hiện hàng ngày:</p>
          <div class="space-y-1.5 mt-1 pl-2">
            <p>1. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">Chuẩn bị đủ sách vở, làm bài tập về nhà trước khi đến lớp; chú ý lắng nghe bài giảng.</span></p>
            <p>2. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">Đồng phục, tác phong chuẩn mực; lễ phép với thầy cô và hòa nhã với bạn bè.</span></p>
            <p>3. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">........................................................................................................................................................</span></p>
          </div>
        </div>

        <div>
          <p class="font-bold text-blue-900 uppercase">III. Mục tiêu nỗ lực vi mô (Baby Steps) trong 4 tuần tới:</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pl-2">
            <p>• Chuyên cần 100%, không vi phạm nội quy.</p>
            <p>• Điểm kiểm tra các môn đạt tối thiểu: <span class="font-bold text-blue-900">.......... điểm</span>.</p>
          </div>
        </div>

        <div>
          <p class="font-bold text-indigo-900 uppercase">IV. Người đồng hành hỗ trợ tại lớp (Mô hình Đôi bạn cùng tiến):</p>
          <p class="mt-1 pl-2">• Bạn đồng hành: <span class="font-bold text-blue-900">${deskMateVal}</span></p>
          <p class="text-[11px] text-slate-600 pl-2">• Nhiệm vụ: Cùng ngồi học, kiểm tra chéo bài vở đầu giờ, đôn đốc nhắc nhở nề nếp và hỗ trợ nhau học tập.</p>
        </div>

        <div>
          <p class="font-bold text-purple-900 uppercase">V. Động lực ghi nhận & Biện pháp khắc phục hệ quả logic:</p>
          <div class="space-y-1 mt-1 pl-2 text-[11px]">
            <p><b>1. Phần thưởng / Sự ghi nhận mong muốn khi hoàn thành tốt cam kết:</b></p>
            <p class="border-b border-dotted border-slate-400 pb-0.5 w-[95%] italic text-slate-600">Được cộng 20 điểm rèn luyện, tuyên dương trước lớp, xếp loại Rèn luyện Tốt tháng.</p>
            <p class="pt-1"><b>2. Hình thức tự giác khắc phục hệ quả nếu tái vi phạm:</b></p>
            <p class="border-b border-dotted border-slate-400 pb-0.5 w-[95%] italic text-slate-600">Tự giác trực nhật bù 1 tuần, chăm sóc bồn hoa sân trường, bàn giao điện thoại cho GVCN cất tủ đầu giờ.</p>
          </div>
        </div>
      </div>

      <!-- Chữ ký 3 bên -->
      <div class="pt-6 grid grid-cols-3 gap-2 text-xs text-center border-t border-slate-300">
        <div>
          <p class="font-bold uppercase">ĐẠI DIỆN PHỤ HUYNH</p>
          <p class="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
        <div>
          <p class="font-bold uppercase">HỌC SINH CAM KẾT</p>
          <p class="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-blue-900">${student ? student.fullName : '................................................'}</p>
        </div>
        <div>
          <p class="font-bold uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
          <p class="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * BIỂU MẪU 03: SỔ THEO DÕI TIẾN BỘ HÀNG TUẦN (WEEKLY PROGRESS LOG)
 */
function generateForm3HTML(student, deskMate) {
  const nameVal = student ? student.fullName : '....................................................................';
  const groupVal = student ? `Tổ ${student.groupNumber}` : '................';
  const deskMateVal = deskMate ? `${deskMate.fullName}${deskMate.role !== 'Thành viên' ? ' (' + deskMate.role + ')' : ''}` : '....................................................................';

  return `
    <div class="pedagogical-a4-document space-y-4 text-slate-800 leading-relaxed">
      <!-- Header Bộ GD&ĐT -->
      <div class="flex justify-between items-start border-b pb-3 border-slate-300">
        <div class="text-center font-bold text-xs uppercase leading-tight">
          SỞ GD&ĐT LÂM ĐỒNG<br>
          <span class="text-sm font-extrabold text-blue-900">TRƯỜNG THPT BÙI THỊ XUÂN - MŨI NÉ</span><br>
          <span class="font-normal text-[11px] text-slate-500">Lớp: 10A3 • Năm học 2026 - 2027</span>
        </div>
        <div class="text-center font-bold text-xs leading-tight">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          <span class="text-xs font-semibold underline">Độc lập — Tự do — Hạnh phúc</span><br>
          <span class="font-normal italic text-[11px] text-slate-500">Mũi Né, ngày ..... tháng ..... năm 2026</span>
        </div>
      </div>

      <!-- Tiêu đề chính -->
      <div class="text-center py-2">
        <h1 class="text-base sm:text-lg font-black uppercase text-purple-900 tracking-wide">
          SỔ THEO DÕI TIẾN BỘ HÀNG TUẦN (WEEKLY PROGRESS LOG)
        </h1>
        <p class="text-xs italic text-slate-600 mt-0.5">
          (Dành cho Ban Cán sự lớp & GVCN phối hợp ghi nhận sự chuyển biến tích cực của học sinh)
        </p>
      </div>

      <!-- Thông tin học sinh -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
        <div><b>Học sinh:</b> <span class="text-blue-900 font-bold">${nameVal}</span></div>
        <div><b>Lớp:</b> <span class="font-bold">10A3</span> • <b>Tổ:</b> ${groupVal}</div>
        <div><b>Bạn đồng hành:</b> <span class="text-slate-800 font-bold">${deskMateVal}</span></div>
      </div>

      <!-- Bảng theo dõi 4 tuần -->
      <div class="overflow-x-auto pt-1">
        <table class="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr class="bg-purple-100/70 text-purple-950 font-bold text-center">
              <th class="border border-slate-400 p-2 w-16">Thời gian</th>
              <th class="border border-slate-400 p-2 w-48">Chuyên cần & Nền nếp</th>
              <th class="border border-slate-400 p-2 w-48">Ý thức học tập & Điểm số</th>
              <th class="border border-slate-400 p-2">Việc tốt / Nỗ lực vi mô ghi nhận</th>
              <th class="border border-slate-400 p-2 w-32">Đánh giá của GVCN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-slate-400 p-2.5 font-bold text-center bg-slate-50">Tuần 1</td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>• Đi muộn: ...... buổi</p>
                <p>• Đồng phục: ................</p>
                <p>• Giữ trật tự trong giờ: [ ] Tốt</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>• Vở ghi bài: [ ] Đầy đủ</p>
                <p>• Bài tập về nhà: ..............</p>
                <p>• Điểm kiểm tra: ...............</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p class="text-slate-500 italic">Ví dụ: Tích cực kê bàn ghế, chuẩn bị phấn bảng cho lớp, giúp bạn trực nhật...</p>
              </td>
              <td class="border border-slate-400 p-2 text-center text-[11px]">
                <div class="h-10"></div>
                <p class="text-[10px] text-slate-400">(Ký duyệt)</p>
              </td>
            </tr>
            <tr>
              <td class="border border-slate-400 p-2.5 font-bold text-center bg-slate-50">Tuần 2</td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>• Đi muộn: ...... buổi</p>
                <p>• Đồng phục: ................</p>
                <p>• Giữ trật tự trong giờ: [ ] Tốt</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>• Vở ghi bài: [ ] Đầy đủ</p>
                <p>• Bài tập về nhà: ..............</p>
                <p>• Điểm kiểm tra: ...............</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p class="text-slate-500 italic">Ví dụ: Có tiến bộ rõ rệt trong giờ Toán/Lý, phát biểu xây dựng bài 2 lần...</p>
              </td>
              <td class="border border-slate-400 p-2 text-center text-[11px]">
                <div class="h-10"></div>
                <p class="text-[10px] text-slate-400">(Ký duyệt)</p>
              </td>
            </tr>
            <tr>
              <td class="border border-slate-400 p-2.5 font-bold text-center bg-slate-50">Tuần 3</td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>• Đi muộn: ...... buổi</p>
                <p>• Đồng phục: ................</p>
                <p>• Giữ trật tự trong giờ: [ ] Tốt</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>• Vở ghi bài: [ ] Đầy đủ</p>
                <p>• Bài tập về nhà: ..............</p>
                <p>• Điểm kiểm tra: ...............</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p class="text-slate-500 italic">Ví dụ: Tự giác học bài, không dùng điện thoại, cùng bạn đạt điểm khá...</p>
              </td>
              <td class="border border-slate-400 p-2 text-center text-[11px]">
                <div class="h-10"></div>
                <p class="text-[10px] text-slate-400">(Ký duyệt)</p>
              </td>
            </tr>
            <tr>
              <td class="border border-slate-400 p-2.5 font-bold text-center bg-slate-50">Tuần 4</td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>• Đi muộn: ...... buổi</p>
                <p>• Đồng phục: ................</p>
                <p>• Giữ trật tự trong giờ: [ ] Tốt</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>• Vở ghi bài: [ ] Đầy đủ</p>
                <p>• Bài tập về nhà: ..............</p>
                <p>• Điểm kiểm tra: ...............</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p class="text-slate-500 italic">Ví dụ: Hoàn thành 100% mục tiêu cam kết, đạt danh hiệu Học sinh nỗ lực tuần...</p>
              </td>
              <td class="border border-slate-400 p-2 text-center text-[11px]">
                <div class="h-10"></div>
                <p class="text-[10px] text-slate-400">(Ký duyệt)</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Đánh giá tổng kết sau 4 tuần -->
      <div class="bg-purple-50/50 p-3 rounded border border-purple-200 text-xs space-y-2">
        <p class="font-bold text-purple-900">KẾT LUẬN CHUNG SAU 4 TUẦN CỦA GVCN:</p>
        <div class="flex flex-wrap gap-4 pl-2 text-[11px]">
          <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span><b>Đạt mục tiêu giao ước:</b> Tuyên dương trước lớp & ghi nhận điểm cộng</span></label>
          <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span><b>Có tiến bộ:</b> Cần tiếp tục duy trì và đôn đốc thêm</span></label>
          <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span><b>Chưa đạt:</b> Cần họp gia đình để điều chỉnh giải pháp</span></label>
        </div>
        <p class="pt-1"><b>Nhận xét cụ thể của GVCN:</b> <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[80%]">....................................................................................................</span></p>
      </div>

      <!-- Chữ ký xác nhận -->
      <div class="pt-4 grid grid-cols-3 gap-2 text-xs text-center border-t border-slate-300">
        <div>
          <p class="font-bold uppercase">BAN CÁN SỰ LỚP</p>
          <p class="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</p>
          <div class="h-14"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
        <div>
          <p class="font-bold uppercase">Ý KIẾN PHỤ HUYNH</p>
          <p class="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</p>
          <div class="h-14"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
        <div>
          <p class="font-bold uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
          <p class="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</p>
          <div class="h-14"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Thực hiện in biểu mẫu sư phạm hiện tại: Khổ dọc A4 (Portrait)
 */
function printCurrentPedagogicalForm() {
  const paper = document.getElementById('pedagogical-form-paper');
  if (!paper) {
    showToast('Không tìm thấy nội dung biểu mẫu để in!', 'error');
    return;
  }

  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Biểu Mẫu Sư Phạm Lớp 10A3</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 15mm;
        }
        * {
          box-sizing: border-box;
          font-family: 'Times New Roman', Times, serif, 'Plus Jakarta Sans', sans-serif;
        }
        body {
          margin: 0;
          padding: 0;
          color: #000;
          background: #fff;
          font-size: 11.5pt;
          line-height: 1.4;
        }
        .pedagogical-a4-document {
          width: 100%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          margin-bottom: 8px;
        }
        th, td {
          border: 1px solid #444;
          padding: 5px 6px;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }
        .border-dotted {
          border-bottom: 1px dotted #555 !important;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      ${paper.innerHTML}
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    printIframe.contentWindow.focus();
    printIframe.contentWindow.print();
    setTimeout(() => {
      printIframe.remove();
    }, 1500);
  }, 300);
}

// ==================== CHẾ ĐỘ SÁNG / TỐI & HIỆU ỨNG NGÔI SAO LẤP LÁNH ====================

let starfieldAnimationId = null;
let starfieldStars = [];
let activeShootingStar = null;
let starfieldClickBursts = [];

/**
 * Khởi tạo Theme (Dark/Light) và Bầu trời sao lấp lánh
 */
function initThemeAndStarfield() {
  const savedTheme = localStorage.getItem('dashboard10a3_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    applyTheme('dark', false);
  } else {
    applyTheme('light', false);
  }

  const savedStars = localStorage.getItem('dashboard10a3_stars');
  appState.starsEnabled = savedStars !== 'off';
  
  initStarfieldEngine();
  setupStarBurstOnClick();
}

/**
 * Áp dụng chế độ màu Sáng / Tối
 */
function applyTheme(theme, notify = true) {
  appState.theme = theme;
  try {
    localStorage.setItem('dashboard10a3_theme', theme);
  } catch (e) {}

  const htmlEl = document.documentElement;
  const toggleIcon = document.getElementById('theme-toggle-icon');
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const canvas = document.getElementById('starfield-canvas');

  if (theme === 'dark') {
    htmlEl.classList.add('dark');
    if (toggleIcon) {
      toggleIcon.className = 'fa-solid fa-sun text-amber-400 text-sm';
    }
    if (toggleBtn) {
      toggleBtn.title = 'Chế độ Sáng (Click để bật)';
    }
    if (canvas && appState.starsEnabled) {
      canvas.style.opacity = '0.75';
    }
    if (notify) showToast('Đã chuyển sang chế độ Tối (Dark Mode) 🌙', 'info');
  } else {
    htmlEl.classList.remove('dark');
    if (toggleIcon) {
      toggleIcon.className = 'fa-solid fa-moon text-slate-500 text-sm';
    }
    if (toggleBtn) {
      toggleBtn.title = 'Chế độ Tối (Click để bật)';
    }
    if (canvas && appState.starsEnabled) {
      canvas.style.opacity = '0.4';
    }
    if (notify) showToast('Đã chuyển sang chế độ Sáng (Light Mode) ☀️', 'info');
  }

  // Cập nhật lại biểu đồ nếu đang hiển thị
  if (appState.charts.groupsChart || appState.charts.ratingsChart) {
    try {
      renderCharts();
    } catch (e) {}
  }
}

/**
 * Bật / tắt chế độ Dark Mode
 */
function toggleDarkMode() {
  const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme, true);
}

/**
 * Bật / tắt hiệu ứng Bầu trời sao lấp lánh
 */
function toggleStarfield() {
  appState.starsEnabled = !appState.starsEnabled;
  try {
    localStorage.setItem('dashboard10a3_stars', appState.starsEnabled ? 'on' : 'off');
  } catch (e) {}

  const canvas = document.getElementById('starfield-canvas');
  const starsIcon = document.getElementById('stars-toggle-icon');

  if (canvas) {
    canvas.style.opacity = appState.starsEnabled ? (appState.theme === 'dark' ? '0.75' : '0.4') : '0';
  }
  if (starsIcon) {
    starsIcon.className = appState.starsEnabled 
      ? 'fa-solid fa-wand-magic-sparkles text-amber-500 text-sm' 
      : 'fa-solid fa-wand-magic-sparkles text-slate-400 text-sm';
  }

  showToast(
    appState.starsEnabled ? 'Đã bật hiệu ứng Bầu trời sao lấp lánh ✨' : 'Đã tắt hiệu ứng Bầu trời sao', 
    'info'
  );
}

/**
 * Động cơ vẽ Bầu trời sao và Sao băng (Starfield Canvas Engine)
 */
function initStarfieldEngine() {
  const canvas = document.getElementById('starfield-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Tạo 85 ngôi sao ngẫu nhiên
  const starColors = ['#ffffff', '#fef08a', '#93c5fd', '#c084fc', '#6ee7b7'];
  starfieldStars = [];
  const count = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 14000), 100);

  for (let i = 0; i < count; i++) {
    starfieldStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.8 + 0.5,
      baseAlpha: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.03 + 0.015,
      phase: Math.random() * Math.PI * 2,
      color: starColors[Math.floor(Math.random() * starColors.length)]
    });
  }

  // Khởi tạo sao băng ngẫu nhiên
  let lastShootingStarTime = Date.now();
  const shootingStarInterval = 9000; // ~9 giây có 1 sao băng lướt qua

  function spawnShootingStar() {
    activeShootingStar = {
      x: Math.random() * (canvas.width * 0.8),
      y: Math.random() * (canvas.height * 0.4),
      length: Math.random() * 90 + 70,
      speed: Math.random() * 12 + 10,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25,
      alpha: 1,
      decay: 0.018
    };
  }

  // Animation Loop
  function renderStarfield() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (appState.starsEnabled) {
      const now = Date.now();

      // Vẽ các ngôi sao lấp lánh
      starfieldStars.forEach(star => {
        star.phase += star.twinkleSpeed;
        const currentAlpha = star.baseAlpha + Math.sin(star.phase) * 0.35;
        const alphaClamped = Math.max(0.1, Math.min(currentAlpha, 1));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alphaClamped;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = star.radius > 1.2 ? 6 : 2;
        ctx.fill();
      });

      // Tạo sao băng định kỳ
      if (!activeShootingStar && now - lastShootingStarTime > shootingStarInterval) {
        if (Math.random() < 0.6) {
          spawnShootingStar();
        }
        lastShootingStarTime = now;
      }

      // Vẽ và cập nhật sao băng
      if (activeShootingStar) {
        const ss = activeShootingStar;
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${ss.alpha})`);
        grad.addColorStop(0.3, `rgba(254, 240, 138, ${ss.alpha * 0.7})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Di chuyển sao băng
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.alpha -= ss.decay;

        if (ss.alpha <= 0 || ss.x > canvas.width || ss.y > canvas.height) {
          activeShootingStar = null;
        }
      }

      // Vẽ các hạt lấp lánh khi click chuột
      for (let i = starfieldClickBursts.length - 1; i >= 0; i--) {
        const p = starfieldClickBursts[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
          starfieldClickBursts.splice(i, 1);
        }
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    starfieldAnimationId = requestAnimationFrame(renderStarfield);
  }

  if (starfieldAnimationId) {
    cancelAnimationFrame(starfieldAnimationId);
  }
  renderStarfield();
}

/**
 * Hiệu ứng bung hạt sao lấp lánh (Stardust) khi click chuột
 */
function setupStarBurstOnClick() {
  document.addEventListener('click', (e) => {
    // Không bắn hiệu ứng nếu click trúng input hoặc nút chỉnh sửa để tránh rối mắt
    if (e.target.closest('input, textarea, select')) return;

    const colors = ['#f59e0b', '#fbbf24', '#c084fc', '#60a5fa', '#34d399'];
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1;
      starfieldClickBursts.push({
        x: e.clientX,
        y: e.clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }
  });
}





// ==================== BẢNG XẾP HẠNG THI ĐUA THEO TUẦN (LEADERBOARD) ====================

function changeLeaderboardWeek(weekVal) {
  appState.activeLeaderboardWeek = weekVal;
  renderLeaderboard();
}

function calculateStudentWeeklyStats(studentId, weekFilter) {
  let bonusPts = 0;
  let violPts = 0;
  let hasPairedProgress = false;
  let hasBabySteps = false;
  let hasRestrictedViolation = false;

  const isCumulative = weekFilter === 'all' || weekFilter === 'all_hk1' || weekFilter === 'all_hk2' || weekFilter === 'all_year';

  if (!isCumulative) {
    // 1. TÍNH ĐIỂM CỦA 1 TUẦN CỤ THỂ (Điểm tự động về ban đầu 100đ nếu là tuần mới chưa có vi phạm/thưởng)
    const logs = appState.dailyLogs.filter(log => {
      if (log.studentId !== studentId) return false;
      const logWeek = log.week || '10';
      return String(logWeek) === String(weekFilter);
    });

    logs.forEach(log => {
      const pts = Number(log.pointsChanged) || 0;
      if (pts > 0) bonusPts += pts;
      else if (pts < 0) violPts += pts;

      if (log.ruleKey === 'bonus_paired_progress' || log.ruleKey === 'bonus_peer_tutoring') {
        hasPairedProgress = true;
      }
      if (log.ruleKey === 'bonus_baby_steps') {
        hasBabySteps = true;
      }
      const matchedRule = VIOLATION_RULES.find(r => r.key === log.ruleKey);
      if (matchedRule && matchedRule.isRestricted) {
        hasRestrictedViolation = true;
      }
    });

    const baseScore = BASE_WEEKLY_SCORE; // 100 điểm sàn tuần
    const totalScore = baseScore + bonusPts + violPts;

    return {
      baseScore,
      bonusPts,
      violPts,
      totalScore,
      hasPairedProgress,
      hasBabySteps,
      hasRestrictedViolation,
      logCount: logs.length,
      isCumulative: false
    };
  } else {
    // 2. TÍNH ĐIỂM CỘNG DỒN BẢNG XẾP HẠNG TỔNG (Lũy kế điểm số qua các tuần)
    let minW = 1, maxW = 16;
    if (weekFilter === 'all_hk2') { minW = 18; maxW = 35; }
    else if (weekFilter === 'all_year') { minW = 1; maxW = 35; }

    // Tìm các tuần đã hoàn thành / có điểm
    const weeksSet = new Set();
    appState.dailyLogs.forEach(l => {
      const w = Number(l.week) || 10;
      if (w >= minW && w <= maxW) weeksSet.add(w);
    });
    // Tối thiểu tuần 1 đến tuần 10 nếu ở HK1
    for (let w = minW; w <= Math.min(maxW, 10); w++) {
      weeksSet.add(w);
    }
    const numWeeks = Math.max(1, weeksSet.size);

    const logs = appState.dailyLogs.filter(log => {
      if (log.studentId !== studentId) return false;
      const w = Number(log.week) || 10;
      return w >= minW && w <= maxW;
    });

    logs.forEach(log => {
      const pts = Number(log.pointsChanged) || 0;
      if (pts > 0) bonusPts += pts;
      else if (pts < 0) violPts += pts;

      if (log.ruleKey === 'bonus_paired_progress' || log.ruleKey === 'bonus_peer_tutoring') {
        hasPairedProgress = true;
      }
      if (log.ruleKey === 'bonus_baby_steps') {
        hasBabySteps = true;
      }
      const matchedRule = VIOLATION_RULES.find(r => r.key === log.ruleKey);
      if (matchedRule && matchedRule.isRestricted) {
        hasRestrictedViolation = true;
      }
    });

    // Cộng dồn điểm các tuần: Mỗi tuần bắt đầu 100đ sàn
    const cumulativeBase = numWeeks * BASE_WEEKLY_SCORE;
    const totalScore = cumulativeBase + bonusPts + violPts;
    const avgScorePerWeek = (totalScore / numWeeks).toFixed(1);

    return {
      baseScore: cumulativeBase,
      bonusPts,
      violPts,
      totalScore,
      avgScorePerWeek,
      numWeeks,
      hasPairedProgress,
      hasBabySteps,
      hasRestrictedViolation,
      logCount: logs.length,
      isCumulative: true
    };
  }
}

function getRankedStudents(weekFilter) {
  const list = appState.students.map(s => {
    const stats = calculateStudentWeeklyStats(s.id, weekFilter);
    return {
      ...s,
      ...stats
    };
  });

  // PHƯƠNG ÁN 1: BẬC XẾP LOẠI ƯU TIÊN TRƯỚC (TIER-FIRST RANKING)
  // Nhóm Khống chế giữ điểm thực tế nhưng bị xếp ở đáy bảng thi đua (priority 0)
  function getTierPriority(item) {
    if (item.hasRestrictedViolation) return 0; // Đáy bảng thi đua
    if (item.totalScore >= RANKING_TIERS.GOOD.min) return 4; // Tốt (>= 95đ)
    if (item.totalScore >= RANKING_TIERS.FAIR.min) return 3; // Khá (80 - 94đ)
    if (item.totalScore >= RANKING_TIERS.PASS.min) return 2; // Đạt (60 - 79đ)
    return 1; // Chưa đạt do điểm thấp (< 60đ)
  }

  // Sắp xếp: Ưu tiên Bậc thi đua trước, sau đó điểm tuần từ cao xuống thấp
  list.sort((a, b) => {
    const tierA = getTierPriority(a);
    const tierB = getTierPriority(b);
    if (tierB !== tierA) {
      return tierB - tierA; // Bậc cao hơn xếp trên
    }
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (a.violPts !== b.violPts) return b.violPts - a.violPts; // violPts là số âm, lớn hơn tức là ít bị trừ hơn
    return (b.academicScore || 0) - (a.academicScore || 0);
  });

  // Gán thứ hạng (Rank 1 -> 45)
  list.forEach((item, index) => {
    item.rank = index + 1;
    item.tier = getRankingTier(item.totalScore, item.hasRestrictedViolation);
  });

  return list;
}

function renderLeaderboard() {
  const weekFilter = appState.activeLeaderboardWeek || '10';
  const weekSelect = document.getElementById('leaderboard-week-select');
  if (weekSelect && weekSelect.value !== weekFilter) {
    weekSelect.value = weekFilter;
  }

  const weekLabel = document.getElementById('podium-week-label');
  if (weekLabel) {
    if (weekFilter === 'all' || weekFilter === 'all_hk1') {
      weekLabel.textContent = 'Thành tích lũy kế cộng dồn toàn bộ Học kỳ 1 (Tuần 1 đến 16) của 45 học sinh Lớp 10A3';
    } else if (weekFilter === 'all_hk2') {
      weekLabel.textContent = 'Thành tích lũy kế cộng dồn toàn bộ Học kỳ 2 (Tuần 18 đến 35) của 45 học sinh Lớp 10A3';
    } else if (weekFilter === 'all_year') {
      weekLabel.textContent = 'Bảng vàng vinh danh cộng dồn Cả Năm Học 2026 - 2027 (Tuần 1 đến 35) của 45 học sinh Lớp 10A3';
    } else {
      const wNum = Number(weekFilter);
      const termName = wNum >= 18 ? 'Học kỳ 2' : 'Học kỳ 1';
      weekLabel.textContent = `Ghi nhận thành tích thi đua xuất sắc nhất trong Tuần ${weekFilter} (${termName})`;
    }
  }

  // Cập nhật trạng thái Khóa / Mở khóa tuần trên Leaderboard Toolbar
  updateLeaderboardLockStatusUI(weekFilter);

  const rankedList = getRankedStudents(weekFilter);

  renderLeaderboardPodium(rankedList);
  renderLeaderboardGroups(rankedList);
  renderLeaderboardTable(rankedList);
}

function updateLeaderboardLockStatusUI(weekFilter) {
  const badge = document.getElementById('leaderboard-lock-status-badge');
  const icon = document.getElementById('leaderboard-lock-status-icon');
  const text = document.getElementById('leaderboard-lock-status-text');
  const btnLock = document.getElementById('btn-toggle-lock-leaderboard');
  const btnLockText = document.getElementById('btn-toggle-lock-text');
  const btnLockIcon = document.getElementById('btn-toggle-lock-icon');

  if (!badge) return;

  const isCumulative = weekFilter === 'all' || weekFilter === 'all_hk1' || weekFilter === 'all_hk2' || weekFilter === 'all_year';
  if (isCumulative) {
    badge.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1';
    icon.className = 'fa-solid fa-chart-line text-xs';
    text.textContent = 'Bảng Cộng Dồn';
    if (btnLock) btnLock.classList.add('hidden');
    return;
  }

  if (btnLock) btnLock.classList.remove('hidden');

  const locked = isWeekLocked(weekFilter);
  if (locked) {
    badge.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center space-x-1';
    icon.className = 'fa-solid fa-lock text-xs';
    text.textContent = 'Đã Khóa Sổ';
    if (btnLockText) btnLockText.textContent = 'Mở Khóa Tuần';
    if (btnLockIcon) btnLockIcon.className = 'fa-solid fa-lock-open';
  } else {
    badge.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1';
    icon.className = 'fa-solid fa-lock-open text-xs';
    text.textContent = 'Đang Mở';
    if (btnLockText) btnLockText.textContent = 'Khóa Sổ Tuần';
    if (btnLockIcon) btnLockIcon.className = 'fa-solid fa-lock';
  }
}

function renderLeaderboardPodium(rankedList) {
  const container = document.getElementById('leaderboard-podium-container');
  if (!container) return;

  if (rankedList.length < 3) {
    container.innerHTML = '<p class="text-xs text-slate-400 col-span-3 text-center py-6">Đang tải dữ liệu học sinh...</p>';
    return;
  }

  const rank1 = rankedList[0];
  const rank2 = rankedList[1];
  const rank3 = rankedList[2];

  container.innerHTML = `
    <!-- Rank 2: Á Quân 1 (Bên Trái) -->
    <div class="order-2 md:order-1 bg-gradient-to-t from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-2xl p-4 text-center shadow-md flex flex-col items-center justify-end relative h-64 md:h-72 cursor-pointer hover:border-slate-400 transition" onclick="openStudentDetailModal('${rank2.id}')">
      <div class="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-slate-400 flex items-center justify-center font-black text-lg mb-2 shadow-inner">
        🥈 2
      </div>
      <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Á Quân 1 Tuần</span>
      <h4 class="font-black text-slate-900 dark:text-white text-base leading-tight mb-1">${escapeHtml(rank2.fullName)}</h4>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Tổ ${rank2.groupNumber} &bull; ${escapeHtml(rank2.role || 'Thành viên')}</p>
      <div class="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1 rounded-xl w-full">
        <span class="text-xl font-black text-blue-600 dark:text-blue-400">${rank2.totalScore}</span> <span class="text-xs font-bold text-slate-500">điểm</span>
      </div>
    </div>

    <!-- Rank 1: Quán Quân (Ở Giữa - Cao Nhất) -->
    <div class="order-1 md:order-2 bg-gradient-to-t from-amber-100 via-amber-50 to-white dark:from-amber-950/60 dark:via-slate-900 dark:to-slate-800 border-3 border-amber-400 dark:border-amber-500 rounded-2xl p-5 text-center shadow-xl flex flex-col items-center justify-end relative h-76 md:h-84 transform md:-translate-y-2 cursor-pointer hover:scale-[1.02] transition" onclick="openStudentDetailModal('${rank1.id}')">
      <div class="absolute -top-4 w-9 h-9 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-lg shadow-md border-2 border-white dark:border-slate-800">
        👑
      </div>
      <div class="w-14 h-14 rounded-full bg-amber-300 dark:bg-amber-600 text-amber-950 dark:text-white border-2 border-amber-500 flex items-center justify-center font-black text-2xl mb-2 shadow-lg">
        🥇 1
      </div>
      <span class="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
        <i class="fa-solid fa-star text-[10px]"></i> QUÁN QUÂN TUẦN <i class="fa-solid fa-star text-[10px]"></i>
      </span>
      <h4 class="font-black text-slate-900 dark:text-white text-lg leading-tight mb-1">${escapeHtml(rank1.fullName)}</h4>
      <p class="text-xs text-amber-800 dark:text-amber-300 font-semibold mb-3">Tổ ${rank1.groupNumber} &bull; ${escapeHtml(rank1.role || 'Thành viên')}</p>
      <div class="bg-amber-200/60 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-600 px-4 py-1.5 rounded-xl w-full">
        <span class="text-2xl font-black text-amber-700 dark:text-amber-300">${rank1.totalScore}</span> <span class="text-xs font-black text-amber-800 dark:text-amber-400">điểm</span>
      </div>
    </div>

    <!-- Rank 3: Á Quân 2 (Bên Phải) -->
    <div class="order-3 bg-gradient-to-t from-orange-100 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-amber-600/40 dark:border-amber-700/60 rounded-2xl p-4 text-center shadow-md flex flex-col items-center justify-end relative h-60 md:h-68 cursor-pointer hover:border-amber-600 transition" onclick="openStudentDetailModal('${rank3.id}')">
      <div class="w-12 h-12 rounded-full bg-amber-700/20 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-2 border-amber-600 flex items-center justify-center font-black text-lg mb-2 shadow-inner">
        🥉 3
      </div>
      <span class="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">Á Quân 2 Tuần</span>
      <h4 class="font-black text-slate-900 dark:text-white text-base leading-tight mb-1">${escapeHtml(rank3.fullName)}</h4>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Tổ ${rank3.groupNumber} &bull; ${escapeHtml(rank3.role || 'Thành viên')}</p>
      <div class="bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 px-3 py-1 rounded-xl w-full">
        <span class="text-xl font-black text-orange-600 dark:text-orange-400">${rank3.totalScore}</span> <span class="text-xs font-bold text-slate-500">điểm</span>
      </div>
    </div>
  `;
}

function renderLeaderboardGroups(rankedList) {
  const container = document.getElementById('leaderboard-groups-grid');
  if (!container) return;

  const groupStats = [];
  for (let g = 1; g <= 6; g++) {
    const mems = rankedList.filter(s => s.groupNumber === g);
    const count = mems.length;
    const sum = mems.reduce((acc, cur) => acc + cur.totalScore, 0);
    const avg = count > 0 ? (sum / count).toFixed(2) : '0';
    const totalBonus = mems.reduce((acc, cur) => acc + cur.bonusPts, 0);
    const totalViol = mems.reduce((acc, cur) => acc + cur.violPts, 0);
    groupStats.push({ groupNumber: g, count, sum, avg: Number(avg), totalBonus, totalViol });
  }

  // Sắp xếp tổ theo điểm trung bình tuần giảm dần
  groupStats.sort((a, b) => b.avg - a.avg);

  const winningGroup = groupStats[0];
  const winDisplay = document.getElementById('winning-group-name');
  if (winDisplay && winningGroup) {
    winDisplay.textContent = `Tổ ${winningGroup.groupNumber} (TB: ${winningGroup.avg}đ)`;
  }

  container.innerHTML = groupStats.map((g, idx) => {
    const isTop = idx === 0;
    const badgeColor = isTop ? 'bg-amber-500 text-slate-900 font-black' : idx === 1 ? 'bg-slate-300 text-slate-800 font-bold' : idx === 2 ? 'bg-amber-700 text-white font-bold' : 'bg-slate-100 text-slate-600';
    const cardBorder = isTop ? 'border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-md' : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';

    return `
      <div class="${cardBorder} rounded-xl p-3 flex flex-col justify-between text-center relative overflow-hidden">
        ${isTop ? '<div class="absolute -right-6 -top-6 w-14 h-14 bg-amber-400 rotate-45 flex items-end justify-center pb-0.5 text-xs">🚩</div>' : ''}
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${badgeColor}">${idx + 1}</span>
            <span class="text-[10px] font-bold text-slate-400">${g.count} HS</span>
          </div>
          <h5 class="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-1">Tổ ${g.groupNumber}</h5>
          <div class="text-lg font-black text-blue-600 dark:text-blue-400">${g.avg} <span class="text-[10px] font-bold text-slate-400">TB</span></div>
        </div>
        <div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 flex justify-between">
          <span class="text-emerald-600 dark:text-emerald-400 font-bold">+${g.totalBonus}</span>
          <span class="text-rose-600 dark:text-rose-400 font-bold">${g.totalViol}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderLeaderboardTable(preloadedList) {
  const tbody = document.getElementById('leaderboard-table-body');
  if (!tbody) return;

  const weekFilter = appState.activeLeaderboardWeek || '10';
  const list = preloadedList || getRankedStudents(weekFilter);

  const groupFilter = document.getElementById('leaderboard-group-filter')?.value || 'all';
  const tierFilter = document.getElementById('leaderboard-tier-filter')?.value || 'all';
  const searchVal = (document.getElementById('leaderboard-search')?.value || '').trim().toLowerCase();

  const filtered = list.filter(stu => {
    if (groupFilter !== 'all' && String(stu.groupNumber) !== String(groupFilter)) return false;
    if (tierFilter !== 'all' && stu.tier.label !== tierFilter) return false;
    if (searchVal && !stu.fullName.toLowerCase().includes(searchVal)) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="py-8 text-center text-slate-400 text-xs">Không tìm thấy học sinh nào phù hợp với bộ lọc</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(stu => {
    const rank = stu.rank;
    const isRestricted = stu.hasRestrictedViolation;
    const rankBadge = isRestricted 
      ? `<span class="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-black text-[11px] border border-rose-400 dark:border-rose-800 inline-flex items-center gap-1 shadow-2xs" title="Hạ bậc xuống cuối bảng do vi phạm Lỗi khống chế">⚠️ ${rank}</span>`
      : rank === 1 ? '<span class="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs inline-flex items-center justify-center shadow-xs">🥇</span>'
      : rank === 2 ? '<span class="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center justify-center">🥈</span>'
      : rank === 3 ? '<span class="w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs inline-flex items-center justify-center">🥉</span>'
      : `<span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs inline-flex items-center justify-center">${rank}</span>`;

    const tierBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${stu.tier.color}">${stu.tier.label}</span>`;

    const progressBadges = [];
    if (stu.hasPairedProgress) {
      progressBadges.push('<span class="text-[9px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-300/60 inline-flex items-center gap-1">🤝 Cùng tiến</span>');
    }
    if (stu.hasBabySteps) {
      progressBadges.push('<span class="text-[9px] bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold border border-purple-300/60 inline-flex items-center gap-1">🪜 Baby Steps</span>');
    }
    const isGVCN = (appState.currentUserRole === 'gvcn');
    if (isGVCN && stu.isSpecialSupport) {
      progressBadges.push('<span class="text-[9px] bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">Kèm cặp (GVCN)</span>');
    }

    const rowClass = isRestricted 
      ? 'hover:bg-rose-50/70 dark:hover:bg-rose-950/40 bg-rose-50/30 dark:bg-rose-950/20 transition border-b border-rose-200 dark:border-rose-900/60 cursor-pointer'
      : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition border-b border-slate-100 dark:border-slate-700/60 cursor-pointer';

    return `
      <tr class="${rowClass}" onclick="openStudentDetailModal('${stu.id}')">
        <td class="py-2.5 px-3 text-center">${rankBadge}</td>
        <td class="py-2.5 px-3">
          <div class="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
            <span>${escapeHtml(stu.fullName)}</span>
            ${getRoleBadgeHtml(stu.role)}
          </div>
          <div class="text-[10px] text-slate-400">Mã: ${stu.code} &bull; NS: ${stu.dob}</div>
        </td>
        <td class="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-300">Tổ ${stu.groupNumber}</td>
        <td class="py-2.5 px-3 text-center text-slate-500 font-semibold">${stu.baseScore}</td>
        <td class="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">+${stu.bonusPts}</td>
        <td class="py-2.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">${stu.violPts}</td>
        <td class="py-2.5 px-3 text-center">
          <span class="text-sm font-black text-slate-900 dark:text-white">${stu.totalScore}</span>
        </td>
        <td class="py-2.5 px-3 text-center">${tierBadge}</td>
        <td class="py-2.5 px-3">
          <div class="flex flex-wrap gap-1">
            ${progressBadges.length > 0 ? progressBadges.join(' ') : '<span class="text-slate-400 text-[10px]">Nề nếp ổn định</span>'}
          </div>
        </td>
        <td class="py-2.5 px-3 text-center" onclick="event.stopPropagation()">
          <button onclick="openStudentDetailModal('${stu.id}')" class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 rounded transition" title="Xem hồ sơ">
            <i class="fa-solid fa-eye text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// IN BẢNG XẾP HẠNG THI ĐUA TUẦN (A4)
function openPrintLeaderboardModal() {
  const modal = document.getElementById('modal-print-leaderboard');
  const content = document.getElementById('print-leaderboard-content');
  if (!modal || !content) return;

  content.innerHTML = generatePrintLeaderboardHTML();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePrintLeaderboardModal() {
  const modal = document.getElementById('modal-print-leaderboard');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function printLeaderboardDirectly() {
  let printContainer = document.getElementById('print-leaderboard-export-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'print-leaderboard-export-container';
    printContainer.className = 'hidden print:block';
    document.body.appendChild(printContainer);
  }
  printContainer.innerHTML = generatePrintLeaderboardHTML();
  closePrintLeaderboardModal();
  setTimeout(() => window.print(), 150);
}

function generatePrintLeaderboardHTML() {
  const weekFilter = appState.activeLeaderboardWeek || '10';
  const rankedList = getRankedStudents(weekFilter);
  let weekText = `TUẦN ${weekFilter}`;
  if (weekFilter === 'all' || weekFilter === 'all_hk1') {
    weekText = 'TỔNG KẾT THI ĐUA HỌC KỲ 1 (TUẦN 1 - 16)';
  } else if (weekFilter === 'all_hk2') {
    weekText = 'TỔNG KẾT THI ĐUA HỌC KỲ 2 (TUẦN 18 - 35)';
  } else if (weekFilter === 'all_year') {
    weekText = 'TỔNG KẾT THI ĐUA CẢ NĂM HỌC 2026 - 2027 (TUẦN 1 - 35)';
  } else {
    const wNum = Number(weekFilter);
    weekText = `TUẦN ${weekFilter} — ${wNum >= 18 ? 'HỌC KỲ 2' : 'HỌC KỲ 1'}`;
  }

  return `
    <div class="bg-white text-black font-sans text-[11px] leading-tight w-full max-w-[210mm] mx-auto p-4 space-y-3">
      <!-- QUỐC HIỆU & TIÊU NGỮ -->
      <div class="grid grid-cols-12 items-start pb-2 border-b-2 border-black">
        <div class="col-span-5 text-center">
          <p class="text-[9px] uppercase font-bold text-slate-700">SỞ GD&ĐT LÂM ĐỒNG</p>
          <p class="text-[10px] uppercase font-bold text-black tracking-wide">TRƯỜNG THPT BÙI THỊ XUÂN - MŨI NÉ</p>
        </div>
        <div class="col-span-7 text-center">
          <p class="text-[10px] uppercase font-bold text-black tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p class="text-[9px] italic font-semibold text-slate-800">Độc lập &mdash; Tự do &mdash; Hạnh phúc</p>
        </div>
      </div>

      <!-- TIÊU ĐỀ BẢNG THI ĐUA -->
      <div class="text-center my-2">
        <h1 class="text-base font-black tracking-wider uppercase text-black">
          BẢNG XẾP HẠNG THI ĐUA HỌC SINH &mdash; LỚP 10A3
        </h1>
        <p class="text-xs font-bold text-blue-900 mt-0.5">
          ${weekText} &bull; NĂM HỌC 2026 - 2027 &bull; SĨ SỐ: 45 HỌC SINH
        </p>
      </div>

      <!-- BẢNG TỔNG KẾT 45 HỌC SINH (2 CỘT GỌN GÀNG TRÊN 1 TRANG A4) -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr class="bg-slate-200 uppercase font-bold">
              <th class="border border-black p-1 text-center w-8">Hạng</th>
              <th class="border border-black p-1">Họ và Tên</th>
              <th class="border border-black p-1 text-center w-8">Tổ</th>
              <th class="border border-black p-1 text-center w-12">Điểm Sàn</th>
              <th class="border border-black p-1 text-center w-12">Điểm Cộng</th>
              <th class="border border-black p-1 text-center w-12">Điểm Trừ</th>
              <th class="border border-black p-1 text-center w-14 font-black">Tổng Điểm</th>
              <th class="border border-black p-1 text-center w-14">Xếp Loại</th>
            </tr>
          </thead>
          <tbody>
            ${rankedList.map(s => `
              <tr class="${s.hasRestrictedViolation ? 'bg-rose-50' : s.rank <= 3 ? 'bg-amber-50 font-semibold' : ''}">
                <td class="border border-black p-1 text-center font-bold">${s.hasRestrictedViolation ? `⚠️ ${s.rank}` : s.rank}</td>
                <td class="border border-black p-1">${s.fullName} ${s.role && s.role !== 'Thành viên' ? `(${s.role})` : ''}</td>
                <td class="border border-black p-1 text-center">T${s.groupNumber}</td>
                <td class="border border-black p-1 text-center">${s.baseScore}</td>
                <td class="border border-black p-1 text-center text-emerald-800">+${s.bonusPts}</td>
                <td class="border border-black p-1 text-center text-rose-800">${s.violPts}</td>
                <td class="border border-black p-1 text-center font-black">${s.totalScore}</td>
                <td class="border border-black p-1 text-center font-bold ${s.hasRestrictedViolation ? 'text-rose-900 font-black' : ''}">${s.tier.label}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- CHỮ KÝ GVCN VÀ LỚP TRƯỞNG -->
      <div class="grid grid-cols-2 pt-2 border-t border-slate-300 text-[10px] mt-3">
        <div class="text-center">
          <p class="font-bold uppercase">LỚP TRƯỞNG / BAN CÁN SỰ</p>
          <p class="text-[9px] italic text-slate-500 mt-8">(Ký và ghi rõ họ tên)</p>
        </div>
        <div class="text-center">
          <p class="italic">Mũi Né, ngày ... tháng ... năm 2026</p>
          <p class="font-bold uppercase mt-0.5">GIÁO VIÊN CHỦ NHIỆM</p>
          <p class="text-[9px] italic text-slate-500 mt-8">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  `;
}

// ==================== HÀM TIỆN ÍCH CHẤM ĐIỂM XỔ XUỐNG (DROPDOWN SCORING) ====================

function onDropdownRuleChange(type, ruleKey) {
  if (type === 'bonus') {
    // Reset violation dropdown & card
    const violSelect = document.getElementById('select-violation-rule');
    if (violSelect) violSelect.value = '';
    const violCard = document.getElementById('violation-preview-card');
    if (violCard) violCard.classList.add('hidden');

    if (!ruleKey) {
      appState.activeRule = null;
      updatePreviewBar();
      const bonusCard = document.getElementById('bonus-preview-card');
      if (bonusCard) bonusCard.classList.add('hidden');
      return;
    }

    const rule = BONUS_RULES.find(r => r.key === ruleKey);
    if (!rule) return;
    appState.activeRule = { ...rule, type: 'bonus' };

    const bonusCard = document.getElementById('bonus-preview-card');
    const cardTitle = document.getElementById('bonus-card-title');
    const cardBadge = document.getElementById('bonus-card-badge');
    if (bonusCard) {
      if (cardTitle) cardTitle.textContent = rule.label;
      if (cardBadge) cardBadge.textContent = `+${rule.points} điểm`;
      bonusCard.classList.remove('hidden');
    }
  } else {
    // Reset bonus dropdown & card
    const bonusSelect = document.getElementById('select-bonus-rule');
    if (bonusSelect) bonusSelect.value = '';
    const bonusCard = document.getElementById('bonus-preview-card');
    if (bonusCard) bonusCard.classList.add('hidden');

    if (!ruleKey) {
      appState.activeRule = null;
      updatePreviewBar();
      const violCard = document.getElementById('violation-preview-card');
      if (violCard) violCard.classList.add('hidden');
      return;
    }

    const rule = VIOLATION_RULES.find(r => r.key === ruleKey);
    if (!rule) return;
    appState.activeRule = { ...rule, type: 'violation' };

    const violCard = document.getElementById('violation-preview-card');
    const cardTitle = document.getElementById('violation-card-title');
    const cardBadge = document.getElementById('violation-card-badge');
    if (violCard) {
      if (cardTitle) cardTitle.textContent = rule.label;
      if (cardBadge) {
        if (rule.isRestricted) {
          cardBadge.textContent = 'Khống chế ⚠️ (-50đ)';
          cardBadge.className = 'px-2 py-0.5 bg-rose-600 text-white font-black text-xs rounded-full border border-rose-300';
        } else {
          cardBadge.textContent = `${rule.points} điểm`;
          cardBadge.className = 'px-2 py-0.5 bg-rose-500 text-white font-black text-xs rounded-full';
        }
      }
      violCard.classList.remove('hidden');
    }
  }

  // Update preview bar
  const ruleText = document.getElementById('preview-rule-text');
  const pointsBadge = document.getElementById('preview-points-badge');

  if (ruleText && appState.activeRule) {
    const isRestricted = appState.activeRule.isRestricted;
    ruleText.textContent = `[${isRestricted ? 'LỖI KHỐNG CHẾ ⚠️' : type === 'bonus' ? 'ĐIỂM CỘNG' : 'ĐIỂM TRỪ'}] ${appState.activeRule.label}`;
  }
  if (pointsBadge && appState.activeRule) {
    if (appState.activeRule.isRestricted) {
      pointsBadge.textContent = 'Khống chế ⚠️ (-50đ)';
      pointsBadge.className = 'font-black text-xs text-rose-300 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500';
    } else {
      pointsBadge.textContent = type === 'bonus' ? `+${appState.activeRule.points} điểm` : `${appState.activeRule.points} điểm`;
      pointsBadge.className = type === 'bonus' 
        ? 'font-black text-base text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600' 
        : 'font-black text-base text-rose-400 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-600';
    }
  }
}

function applyDropdownScore(type) {
  const currentWeek = document.getElementById('score-input-week')?.value || appState.activeLeaderboardWeek || '10';
  if (isWeekLocked(currentWeek)) {
    showToast(`Tuần ${currentWeek} đã chốt sổ và khóa điểm! Vui lòng chọn tuần đang mở hoặc liên hệ GVCN mở khóa.`, 'error');
    return;
  }

  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bạn đang ở Chế độ Chỉ Xem! Vui lòng nhập mã PIN GVCN hoặc Cán sự để ghi nhận điểm.', 'warning');
    openRolePinModal('gvcn');
    return;
  }
  const selectEl = document.getElementById(type === 'bonus' ? 'select-bonus-rule' : 'select-violation-rule');
  const ruleKey = selectEl ? selectEl.value : '';
  if (!ruleKey) {
    showToast(`Vui lòng chọn 1 mục từ danh sách xổ xuống ${type === 'bonus' ? 'Điểm cộng' : 'Điểm trừ'}!`, 'warning');
    return;
  }
  if (appState.selectedStudentIds.size === 0) {
    showToast('Vui lòng click chọn ít nhất 1 học sinh ở Danh sách bên dưới!', 'warning');
    return;
  }
  onDropdownRuleChange(type, ruleKey);
  submitScoringEntry();
}

function onQuickSelectStudentDropdown(studentId) {
  if (!studentId) return;
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bạn đang ở Chế độ Chỉ Xem! Vui lòng đăng nhập Cán sự hoặc GVCN để chọn học sinh.', 'warning');
    const quickSelect = document.getElementById('quick-select-student-dropdown');
    if (quickSelect) quickSelect.value = '';
    return;
  }
  if (appState.currentUserRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(appState.currentUserRole.replace('lead_t', ''), 10);
    const stu = appState.students.find(s => s.id === studentId);
    if (stu && Number(stu.groupNumber) !== leaderGroup) {
      showToast(`Bạn là Tổ trưởng Tổ ${leaderGroup}, chỉ được chọn học sinh Tổ ${leaderGroup}!`, 'warning');
      const quickSelect = document.getElementById('quick-select-student-dropdown');
      if (quickSelect) quickSelect.value = '';
      return;
    }
  }
  appState.selectedStudentIds.clear();
  appState.selectedStudentIds.add(studentId);
  renderScoringStudentPills();
  updateSelectedCountUI();
}

function onRecorderSelectChange(val) {
  const hiddenInput = document.getElementById('score-input-recorder');
  if (hiddenInput) hiddenInput.value = val;
}

// ==================== KHỞI TẠO DỮ LIỆU LỊCH SỬ THI ĐUA TUẦN 1 ĐẾN 8 ====================
function seedHistoricalWeeklyLogs() {
  const sampleLogs = [
    // Tuần 1
    { week: '1', date: '2026-09-08', studentId: 'hs_10a3_43', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự lớp làm tốt nhiệm vụ', pointsChanged: 20, recordedBy: 'Lớp trưởng', note: 'Tổ trưởng T1 điều hành tốt tuần đầu' },
    { week: '1', date: '2026-09-09', studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự lớp làm tốt nhiệm vụ', pointsChanged: 20, recordedBy: 'GVCN Lớp 10A3', note: 'Lớp trưởng điều hành ổn định nề nếp lớp' },
    { week: '1', date: '2026-09-10', studentId: 'hs_10a3_24', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong lên bảng đúng', pointsChanged: 10, recordedBy: 'Sao đỏ trực nhật', note: 'Giải bài tập Toán hình tốt' },
    { week: '1', date: '2026-09-11', studentId: 'hs_10a3_14', type: 'violation', ruleKey: 'viol_sleeping_eating', ruleLabel: 'Ngủ gục / nói chuyện', pointsChanged: -5, recordedBy: 'Sao đỏ trực nhật', note: 'Ngủ gục tiết 3' },
    { week: '1', date: '2026-09-12', studentId: 'hs_10a3_21', type: 'violation', ruleKey: 'viol_late_uniform', ruleLabel: 'Đi muộn / sai đồng phục', pointsChanged: -5, recordedBy: 'Sao đỏ trực nhật', note: 'Đi muộn 5 phút' },

    // Tuần 2
    { week: '2', date: '2026-09-15', studentId: 'hs_10a3_10', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự lớp làm tốt nhiệm vụ', pointsChanged: 20, recordedBy: 'Lớp trưởng', note: 'Tổ trưởng Tổ 3 bao quát tổ tốt' },
    { week: '2', date: '2026-09-16', studentId: 'hs_10a3_02', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: 'Đôi bạn cùng tiến', pointsChanged: 15, recordedBy: 'Tổ trưởng Tổ 3', note: 'Kèm bạn Kim Trúc học tập' },
    { week: '2', date: '2026-09-16', studentId: 'hs_10a3_36', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: 'Đôi bạn cùng tiến', pointsChanged: 15, recordedBy: 'Tổ trưởng Tổ 3', note: 'Chăm chú học tập cùng Mỹ Duyên' },
    { week: '2', date: '2026-09-17', studentId: 'hs_10a3_33', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Học sinh diện hỗ trợ có nỗ lực làm bài', pointsChanged: 10, recordedBy: 'Tổ trưởng Tổ 2', note: 'Làm đầy đủ bài tập Hóa' },
    { week: '2', date: '2026-09-18', studentId: 'hs_10a3_06', type: 'violation', ruleKey: 'viol_no_homework', ruleLabel: 'Không làm bài / không học bài', pointsChanged: -10, recordedBy: 'Sao đỏ trực nhật', note: 'Quên vở bài tập Văn' },

    // Tuần 3
    { week: '3', date: '2026-09-22', studentId: 'hs_10a3_35', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự làm tốt nhiệm vụ', pointsChanged: 20, recordedBy: 'GVCN Lớp 10A3', note: 'Tổ trưởng Tổ 4 duy trì kỷ luật xuất sắc' },
    { week: '3', date: '2026-09-23', studentId: 'hs_10a3_14', type: 'bonus', ruleKey: 'bonus_baby_steps', ruleLabel: 'Nỗ lực vi mô (Baby Steps)', pointsChanged: 10, recordedBy: 'Lớp trưởng', note: 'Hoàn thành cam kết tuần không vi phạm' },
    { week: '3', date: '2026-09-23', studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'Kèm bạn yếu Toán/Lý', pointsChanged: 10, recordedBy: 'GVCN Lớp 10A3', note: 'Hỗ trợ bạn Khang tiến bộ' },
    { week: '3', date: '2026-09-24', studentId: 'hs_10a3_01', type: 'violation', ruleKey: 'viol_late_uniform', ruleLabel: 'Đi muộn / sai đồng phục', pointsChanged: -5, recordedBy: 'Sao đỏ trực nhật', note: 'Thiếu phù hiệu' },
    { week: '3', date: '2026-09-25', studentId: 'hs_10a3_16', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: 'Đôi bạn cùng tiến', pointsChanged: 15, recordedBy: 'Tổ trưởng Tổ 2', note: 'Kèm Kim Bơ làm bài' },

    // Tuần 4
    { week: '4', date: '2026-09-29', studentId: 'hs_10a3_23', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự lớp làm tốt nhiệm vụ', pointsChanged: 20, recordedBy: 'GVCN Lớp 10A3', note: 'Tổ trưởng Tổ 6 bao quát nề nếp xuất sắc' },
    { week: '4', date: '2026-09-30', studentId: 'hs_10a3_09', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự lớp làm tốt nhiệm vụ', pointsChanged: 20, recordedBy: 'GVCN Lớp 10A3', note: 'Tổ trưởng Tổ 5 điều hành tốt' },
    { week: '4', date: '2026-10-01', studentId: 'hs_10a3_12', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong lên bảng đúng', pointsChanged: 10, recordedBy: 'Sao đỏ trực nhật', note: 'Giải bài tập Hóa học xuất sắc' },
    { week: '4', date: '2026-10-02', studentId: 'hs_10a3_41', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: 'Đôi bạn cùng tiến', pointsChanged: 15, recordedBy: 'Tổ trưởng Tổ 1', note: 'Giúp bạn Giàu cùng tiến bộ' },
    { week: '4', date: '2026-10-02', studentId: 'hs_10a3_06', type: 'bonus', ruleKey: 'bonus_baby_steps', ruleLabel: 'Nỗ lực vi mô (Baby Steps)', pointsChanged: 10, recordedBy: 'Tổ trưởng Tổ 1', note: 'Tiến bộ rõ rệt trong giờ Toán' },

    // Tuần 5
    { week: '5', date: '2026-10-06', studentId: 'hs_10a3_43', type: 'bonus', ruleKey: 'bonus_school_honors', ruleLabel: 'Đạt điểm Tốt toàn diện', pointsChanged: 50, recordedBy: 'GVCN Lớp 10A3', note: 'Khen thưởng thành tích phong trào cấp trường' },
    { week: '5', date: '2026-10-07', studentId: 'hs_10a3_03', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự lớp làm tốt nhiệm vụ', pointsChanged: 20, recordedBy: 'GVCN Lớp 10A3', note: 'Lớp phó & Cán sự Hóa tận tụy' },
    { week: '5', date: '2026-10-08', studentId: 'hs_10a3_44', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Học sinh diện hỗ trợ nỗ lực làm bài', pointsChanged: 10, recordedBy: 'Tổ trưởng Tổ 4', note: 'Chăm chú nghe giảng và làm bài' },
    { week: '5', date: '2026-10-09', studentId: 'hs_10a3_38', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: 'Đôi bạn cùng tiến', pointsChanged: 15, recordedBy: 'Tổ trưởng Tổ 4', note: 'Kèm Tường Vy tiến bộ' },

    // Tuần 6
    { week: '6', date: '2026-10-13', studentId: 'hs_10a3_10', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong lên bảng đúng', pointsChanged: 10, recordedBy: 'Sao đỏ trực nhật', note: 'Lên bảng giải bài Vật lý đạt điểm 10' },
    { week: '6', date: '2026-10-14', studentId: 'hs_10a3_20', type: 'bonus', ruleKey: 'bonus_group_homework', ruleLabel: 'Cả tổ 100% làm bài tập', pointsChanged: 10, recordedBy: 'Tổ trưởng Tổ 3', note: 'Tổ 3 chuẩn bị bài chu đáo' },
    { week: '6', date: '2026-10-14', studentId: 'hs_10a3_19', type: 'bonus', ruleKey: 'bonus_group_homework', ruleLabel: 'Cả tổ 100% làm bài tập', pointsChanged: 10, recordedBy: 'Tổ trưởng Tổ 3', note: 'Tổ 3 chuẩn bị bài chu đáo' },
    { week: '6', date: '2026-10-15', studentId: 'hs_10a3_21', type: 'bonus', ruleKey: 'bonus_logical_consequence', ruleLabel: 'Tự giác khắc phục hệ quả', pointsChanged: 5, recordedBy: 'Tổ trưởng Tổ 6', note: 'Tự giác trực nhật bù chu đáo' },
    { week: '6', date: '2026-10-16', studentId: 'hs_10a3_08', type: 'bonus', ruleKey: 'bonus_individual_effort', ruleLabel: 'Phát biểu xây dựng bài', pointsChanged: 5, recordedBy: 'Sao đỏ trực nhật', note: 'Phát biểu sôi nổi môn Lịch sử' },

    // Tuần 7
    { week: '7', date: '2026-10-20', studentId: 'hs_10a3_24', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự lớp làm tốt nhiệm vụ', pointsChanged: 20, recordedBy: 'GVCN Lớp 10A3', note: 'Tổ trưởng Tổ 2 hoàn thành xuất sắc' },
    { week: '7', date: '2026-10-21', studentId: 'hs_10a3_33', type: 'bonus', ruleKey: 'bonus_baby_steps', ruleLabel: 'Nỗ lực vi mô (Baby Steps)', pointsChanged: 10, recordedBy: 'Tổ trưởng Tổ 2', note: 'Nỗ lực học tập rõ rệt' },
    { week: '7', date: '2026-10-22', studentId: 'hs_10a3_14', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: 'Đôi bạn cùng tiến', pointsChanged: 15, recordedBy: 'Lớp trưởng', note: 'Đạt điểm 8 kiểm tra 15 phút Toán' },
    { week: '7', date: '2026-10-22', studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: 'Đôi bạn cùng tiến', pointsChanged: 15, recordedBy: 'GVCN Lớp 10A3', note: 'Kèm cặp bạn Khang tiến bộ vượt bậc' },

    // Tuần 8
    { week: '8', date: '2026-10-27', studentId: 'hs_10a3_23', type: 'bonus', ruleKey: 'bonus_school_honors', ruleLabel: 'Đạt điểm Tốt toàn diện', pointsChanged: 50, recordedBy: 'GVCN Lớp 10A3', note: 'Gương sáng việc tốt nhặt được của rơi trả lại' },
    { week: '8', date: '2026-10-28', studentId: 'hs_10a3_02', type: 'bonus', ruleKey: 'bonus_individual_effort', ruleLabel: 'Trực nhật tự giác', pointsChanged: 5, recordedBy: 'Tổ trưởng Tổ 3', note: 'Vệ sinh phòng học sạch sẽ' },
    { week: '8', date: '2026-10-29', studentId: 'hs_10a3_36', type: 'bonus', ruleKey: 'bonus_individual_effort', ruleLabel: 'Hoàn thành bài tập cá nhân', pointsChanged: 5, recordedBy: 'Tổ trưởng Tổ 3', note: 'Làm bài tập đầy đủ' },
    { week: '8', date: '2026-10-30', studentId: 'hs_10a3_16', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong lên bảng đúng', pointsChanged: 10, recordedBy: 'Sao đỏ trực nhật', note: 'Giải bài tập Toán hình chính xác' },

    // Tuần 10 (Hiện tại)
    { week: '10', date: '2026-11-06', studentId: 'hs_10a3_10', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự lớp làm tốt nhiệm vụ', pointsChanged: 20, recordedBy: 'GVCN Lớp 10A3', note: 'Tổ trưởng Tổ 3 quản lý nề nếp tổ nghiêm túc' },
    { week: '10', date: '2026-11-06', studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_individual_effort', ruleLabel: 'Phát biểu xây dựng bài', pointsChanged: 5, recordedBy: 'Sao đỏ trực nhật', note: 'Phát biểu bài học tích cực' }
  ];

  return sampleLogs.map(item => ({
    id: generateUUID(),
    ...item,
    timestamp: new Date(item.date).getTime()
  }));
}

// ==================== CƠ CHẾ KHÓA TUẦN, RESET ĐIỂM & PHÂN QUYỀN ====================

function isWeekLocked(weekVal) {
  if (!appState.lockedWeeks) return false;
  return appState.lockedWeeks.includes(String(weekVal));
}

function toggleCurrentLeaderboardWeekLock() {
  const currentRole = appState.currentUserRole || 'gvcn';
  if (currentRole !== 'gvcn') {
    showToast('Chỉ Giáo viên chủ nhiệm mới có quyền Khóa hoặc Mở khóa sổ điểm tuần!', 'error');
    return;
  }

  const weekVal = appState.activeLeaderboardWeek || '10';
  const isCumulative = weekVal === 'all' || weekVal === 'all_hk1' || weekVal === 'all_hk2' || weekVal === 'all_year';
  if (isCumulative) {
    showToast('Không thể khóa Bảng tổng hợp lũy kế! Vui lòng chọn 1 tuần cụ thể để khóa.', 'warning');
    return;
  }

  const wStr = String(weekVal);
  if (!appState.lockedWeeks) appState.lockedWeeks = [];

  const locked = appState.lockedWeeks.includes(wStr);
  if (locked) {
    appState.lockedWeeks = appState.lockedWeeks.filter(w => w !== wStr);
    showToast(`Đã MỞ KHÓA sổ điểm Tuần ${wStr}! Ban cán sự có thể cập nhật điểm.`, 'success');
  } else {
    appState.lockedWeeks.push(wStr);
    showToast(`Đã KHÓA SỔ điểm Tuần ${wStr}! Điểm số tuần này được bảo vệ an toàn.`, 'success');
  }

  saveDataToStorage();
  refreshAllUI();
}

function confirmResetWeekDiscipline() {
  const currentRole = appState.currentUserRole || 'gvcn';
  if (currentRole !== 'gvcn') {
    showToast('Chỉ Giáo viên chủ nhiệm mới có quyền Reset điểm thi đua của học sinh!', 'error');
    return;
  }

  const weekVal = appState.activeLeaderboardWeek || '10';
  let targetDesc = `Tuần ${weekVal}`;
  if (weekVal === 'all' || weekVal === 'all_hk1') targetDesc = 'toàn bộ Học kỳ 1 (Tuần 1 - 16)';
  else if (weekVal === 'all_hk2') targetDesc = 'toàn bộ Học kỳ 2 (Tuần 18 - 35)';
  else if (weekVal === 'all_year') targetDesc = 'CẢ NĂM HỌC (Tuần 1 - 35)';

  const confirmed = confirm(
    `[XÁC NHẬN RESET ĐIỂM THI ĐUA VỀ BAN ĐẦU]\n\nThầy/Cô có chắc chắn muốn đưa điểm của tất cả 45 học sinh trong ${targetDesc} về mốc 100 ĐIỂM SÀN BAN ĐẦU không?\n\n(Toàn bộ điểm cộng và điểm trừ của giai đoạn này sẽ được làm mới về 0)`
  );

  if (!confirmed) return;

  if (weekVal === 'all' || weekVal === 'all_hk1') {
    appState.dailyLogs = appState.dailyLogs.filter(l => {
      const w = Number(l.week) || 10;
      return !(w >= 1 && w <= 16);
    });
  } else if (weekVal === 'all_hk2') {
    appState.dailyLogs = appState.dailyLogs.filter(l => {
      const w = Number(l.week) || 10;
      return !(w >= 18 && w <= 35);
    });
  } else if (weekVal === 'all_year') {
    appState.dailyLogs = [];
  } else {
    appState.dailyLogs = appState.dailyLogs.filter(l => String(l.week) !== String(weekVal));
  }

  saveDataToStorage();
  refreshAllUI();
  showToast(`Đã reset thành công điểm thi đua của ${targetDesc} về 100 điểm ban đầu!`, 'success');
}

function onRoleSelectorChange(roleId) {
  if (roleId === 'member') {
    executeChangeRole('member');
    showToast('Đã chuyển về Chế độ Học sinh (Chỉ xem)', 'info');
    return;
  }

  if (isRoleAuthenticated(roleId)) {
    executeChangeRole(roleId);
  } else {
    // Tạm thời trả lại giá trị cũ của dropdown
    const sel = document.getElementById('header-user-role-selector');
    if (sel) sel.value = appState.currentUserRole || 'member';
    openRolePinModal(roleId);
  }
}

function openRolePinModal(targetRoleId) {
  appState.pendingRoleId = targetRoleId || 'gvcn';
  const roleMeta = ROLES[appState.pendingRoleId] || ROLES.gvcn;
  const isGVCN = appState.pendingRoleId === 'gvcn';

  const titleEl = document.getElementById('modal-pin-role-title');
  const subtitleEl = document.getElementById('modal-pin-role-subtitle');
  const bodyEl = document.getElementById('modal-pin-instruction-body');
  const hintEl = document.getElementById('modal-pin-hint');
  const inputEl = document.getElementById('input-role-pin');
  const errEl = document.getElementById('modal-pin-error');

  if (titleEl) titleEl.textContent = `Xác Thực Quyền: ${roleMeta.label}`;
  if (subtitleEl) subtitleEl.textContent = isGVCN ? 'Cần mã PIN Giáo viên chủ nhiệm để tiếp tục' : 'Cần mã PIN Cán sự (Lớp trưởng / Tổ trưởng)';
  if (bodyEl) {
    bodyEl.textContent = isGVCN 
      ? 'Chỉ Giáo viên chủ nhiệm mới có toàn quyền chấm điểm, khóa sổ điểm và reset điểm thi đua.' 
      : `Bạn đang chọn chuyển sang vai trò ${roleMeta.label} để chấm điểm thi đua. Vui lòng nhập mã PIN xác thực.`;
  }
  if (hintEl) {
    hintEl.innerHTML = isGVCN 
      ? '* Chỉ Giáo viên chủ nhiệm mới có mã xác thực quản trị này.' 
      : '* Mã PIN bảo mật nội bộ do GVCN Thầy Nguyễn Vỹ cấp riêng cho Ban Cán Sự.';
  }

  if (inputEl) {
    inputEl.value = '';
    inputEl.classList.remove('border-rose-500');
  }
  if (errEl) errEl.classList.add('hidden');

  const modal = document.getElementById('modal-role-pin');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => inputEl?.focus(), 150);
  }
}

function closeRolePinModal() {
  const modal = document.getElementById('modal-role-pin');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  appState.pendingRoleId = null;
  const sel = document.getElementById('header-user-role-selector');
  if (sel) sel.value = appState.currentUserRole || 'member';
}

function togglePinVisibility() {
  const input = document.getElementById('input-role-pin');
  const icon = document.getElementById('btn-pin-eye-icon');
  if (!input || !icon) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash text-sm';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye text-sm';
  }
}

function submitRolePin() {
  const input = document.getElementById('input-role-pin');
  const pinVal = input ? input.value.trim().toLowerCase() : '';
  const targetRole = appState.pendingRoleId || 'gvcn';
  const isGVCN = targetRole === 'gvcn';
  const errEl = document.getElementById('modal-pin-error');
  const errText = document.getElementById('modal-pin-error-text');

  const validGvcnPins = ['261030', '1030'];
  const validCadrePins = ['832610', 'cs10a3@26'];

  let isValid = false;
  if (isGVCN) {
    isValid = validGvcnPins.includes(pinVal);
  } else {
    isValid = validCadrePins.includes(pinVal) || validGvcnPins.includes(pinVal);
  }

  if (!isValid) {
    if (errEl) errEl.classList.remove('hidden');
    if (errText) errText.textContent = isGVCN 
      ? 'Sai mã PIN GVCN! Vui lòng kiểm tra lại mã quản trị của Thầy.' 
      : 'Sai mã PIN! Vui lòng nhập đúng mã bảo mật Ban Cán Sự do Thầy Vỹ cấp.';
    if (input) {
      input.classList.add('border-rose-500');
      input.focus();
      input.select();
    }
    return;
  }

  // Đúng PIN
  const remember = document.getElementById('checkbox-remember-pin')?.checked !== false;
  if (remember) {
    if (validGvcnPins.includes(pinVal)) {
      addAuthenticatedRole('gvcn');
    } else {
      addAuthenticatedRole(targetRole);
    }
  }

  const roleMeta = ROLES[targetRole] || ROLES.gvcn;
  closeRolePinModal();
  executeChangeRole(targetRole);
  showToast(`🎉 Xác thực thành công! Đã kích hoạt vai trò: ${roleMeta.label}`, 'success');
  if (targetRole === 'gvcn' && appState.targetTabAfterAuth) {
    const nextTab = appState.targetTabAfterAuth;
    appState.targetTabAfterAuth = null;
    setTimeout(() => switchTab(nextTab), 150);
  }
}

function executeChangeRole(roleId) {
  appState.currentUserRole = roleId;
  saveDataToStorage();

  const roleMeta = ROLES[roleId] || ROLES.member;

  // Header select sync
  const headerSelect = document.getElementById('header-user-role-selector');
  if (headerSelect && headerSelect.value !== roleId) {
    headerSelect.value = roleId;
  }

  // Header badge sync
  const roleBadge = document.getElementById('header-role-badge');
  if (roleBadge) {
    if (roleMeta.canScore) {
      roleBadge.textContent = 'Được chấm';
      roleBadge.className = 'px-1.5 py-0.5 rounded font-black text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    } else {
      roleBadge.textContent = 'Chỉ xem';
      roleBadge.className = 'px-1.5 py-0.5 rounded font-black text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  // Nút đăng xuất vai trò trong header
  const logoutBtn = document.getElementById('btn-header-logout-role');
  if (logoutBtn) {
    if (roleId !== 'member') logoutBtn.classList.remove('hidden');
    else logoutBtn.classList.add('hidden');
  }

  // Nếu là Tổ trưởng, tự động chọn người ghi nhận và lọc đúng tổ mình
  if (roleId.startsWith('lead_t')) {
    const groupNum = parseInt(roleId.replace('lead_t', ''), 10);
    if (!isNaN(groupNum)) {
      filterScoringGroup(groupNum);
      const recSelect = document.getElementById('score-recorder-select');
      if (recSelect) {
        recSelect.value = `Tổ trưởng Tổ ${groupNum}`;
      }
    }
  } else if (roleId === 'monitor') {
    const recSelect = document.getElementById('score-recorder-select');
    if (recSelect) {
      recSelect.value = 'Lớp trưởng (Trần Lê Hồng Nhung)';
      const hiddenRec = document.getElementById('score-input-recorder');
      if (hiddenRec) hiddenRec.value = 'Lớp trưởng (Trần Lê Hồng Nhung)';
    }
  } else if (roleId === 'redstar_phuc') {
    const recSelect = document.getElementById('score-recorder-select');
    if (recSelect) {
      recSelect.value = 'Sao đỏ (Trần Thị Ngọc Phúc)';
      const hiddenRec = document.getElementById('score-input-recorder');
      if (hiddenRec) hiddenRec.value = 'Sao đỏ (Trần Thị Ngọc Phúc)';
    }
    filterScoringGroup('all');
  } else if (roleId === 'redstar_tung') {
    const recSelect = document.getElementById('score-recorder-select');
    if (recSelect) {
      recSelect.value = 'Sao đỏ (Võ Bách Tùng)';
      const hiddenRec = document.getElementById('score-input-recorder');
      if (hiddenRec) hiddenRec.value = 'Sao đỏ (Võ Bách Tùng)';
    }
    filterScoringGroup('all');
  } else if (roleId === 'gvcn') {
    const recSelect = document.getElementById('score-recorder-select');
    if (recSelect) recSelect.value = 'GVCN Lớp 10A3';
  }

  refreshAllUI();
}

function changeCurrentUserRole(roleId) {
  onRoleSelectorChange(roleId);
}

function updateResetButtonsVisibility() {
  const isGVCN = (appState.currentUserRole === 'gvcn');
  const headerResetBtn = document.getElementById('btn-header-reset-discipline');
  const lbResetBtn = document.getElementById('btn-leaderboard-reset-discipline');
  const backupResetBtn = document.getElementById('btn-backup-reset-discipline');
  const toggleLockBtn = document.getElementById('btn-toggle-lock-leaderboard');

  if (headerResetBtn) {
    if (isGVCN) headerResetBtn.classList.remove('hidden');
    else headerResetBtn.classList.add('hidden');
  }
  if (lbResetBtn) {
    if (isGVCN) lbResetBtn.classList.remove('hidden');
    else lbResetBtn.classList.add('hidden');
  }
  if (backupResetBtn) {
    if (isGVCN) backupResetBtn.classList.remove('hidden');
    else backupResetBtn.classList.add('hidden');
  }
  if (toggleLockBtn) {
    if (isGVCN) toggleLockBtn.classList.remove('hidden');
    else toggleLockBtn.classList.add('hidden');
  }
}

function renderScoringPermissionsUI() {
  const currentRole = appState.currentUserRole || 'member';
  const roleMeta = ROLES[currentRole] || ROLES.member;
  const currentWeek = document.getElementById('score-input-week')?.value || appState.activeLeaderboardWeek || '10';
  const weekLocked = isWeekLocked(currentWeek);

  const roleBanner = document.getElementById('scoring-role-alert-banner');
  const lockedBanner = document.getElementById('scoring-locked-week-banner');
  const submitBtn = document.getElementById('btn-submit-scoring');
  const bonusSelect = document.getElementById('select-bonus-rule');
  const violSelect = document.getElementById('select-violation-rule');
  const btnBonus = document.getElementById('btn-apply-bonus-score');
  const btnViol = document.getElementById('btn-apply-violation-score');
  const quickSelect = document.getElementById('quick-select-student-dropdown');

  // Check Role Banner
  if (roleBanner) {
    if (!roleMeta.canScore) {
      roleBanner.classList.remove('hidden');
    } else {
      roleBanner.classList.add('hidden');
    }
  }

  // Check Locked Banner
  if (lockedBanner) {
    if (weekLocked) {
      lockedBanner.classList.remove('hidden');
    } else {
      lockedBanner.classList.add('hidden');
    }
  }

  // MENU XỔ XUỐNG CHỌN TIÊU CHÍ ĐIỂM CỘNG & ĐIỂM TRỪ LUÔN LUÔN MỞ ĐỂ MỌI NGƯỜI XEM & TRA CỨU
  if (bonusSelect) bonusSelect.disabled = false;
  if (violSelect) violSelect.disabled = false;
  if (quickSelect) quickSelect.disabled = false;

  // Nút ghi nhận điểm luôn cho phép bấm để nếu chưa đăng nhập thì hiển thị popup nhập PIN ngay
  if (btnBonus) {
    btnBonus.disabled = false;
    btnBonus.classList.remove('opacity-50', 'cursor-not-allowed');
    btnBonus.title = 'Ghi nhận điểm cộng cho các học sinh đã chọn';
  }

  if (btnViol) {
    btnViol.disabled = false;
    btnViol.classList.remove('opacity-50', 'cursor-not-allowed');
    btnViol.title = 'Ghi nhận điểm trừ cho các học sinh đã chọn';
  }

  if (submitBtn) {
    if (!roleMeta.canScore) {
      submitBtn.disabled = true;
      submitBtn.className = 'px-5 py-2.5 bg-slate-400 text-slate-800 rounded-xl font-bold text-xs cursor-not-allowed opacity-75';
      submitBtn.innerHTML = '<i class="fa-solid fa-lock mr-1.5"></i><span>Chỉ Xem (Chưa được cấp quyền chấm)</span>';
    } else if (weekLocked) {
      submitBtn.disabled = true;
      submitBtn.className = 'px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-xs cursor-not-allowed opacity-80';
      submitBtn.innerHTML = '<i class="fa-solid fa-lock mr-1.5"></i><span>Tuần Này Đã Khóa Sổ Điểm</span>';
    } else {
      submitBtn.disabled = false;
      submitBtn.className = 'px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 font-black text-xs text-slate-950 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition cursor-pointer whitespace-nowrap';
      submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk text-sm mr-1.5"></i><span>XÁC NHẬN GHI ĐIỂM NGAY</span>';
    }
  }
}

// ==================== CÁC HÀM XỬ LÝ RESET ĐIỂM THI ĐUA ====================

function openResetDisciplineModal() {
  const currentRole = appState.currentUserRole || 'member';
  if (currentRole !== 'gvcn') {
    showToast('Chỉ Giáo viên chủ nhiệm mới có quyền mở công cụ Reset điểm thi đua!', 'error');
    return;
  }

  const modal = document.getElementById('modal-reset-discipline');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const countEl = document.getElementById('reset-modal-log-count');
    if (countEl) countEl.textContent = `${appState.dailyLogs.length} logs`;
  }
}

function closeResetDisciplineModal() {
  const modal = document.getElementById('modal-reset-discipline');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function executeResetWeekOnly(weekVal) {
  if (appState.currentUserRole !== 'gvcn') {
    showToast('Chỉ Giáo viên chủ nhiệm mới có quyền Reset điểm thi đua!', 'error');
    return;
  }
  const wStr = String(weekVal || appState.activeLeaderboardWeek || '9');
  const countBefore = appState.dailyLogs.length;

  appState.dailyLogs = appState.dailyLogs.filter(l => String(l.week) !== wStr);
  const deletedCount = countBefore - appState.dailyLogs.length;

  saveDataToStorage();
  refreshAllUI();
  closeResetDisciplineModal();

  showToast(`Đã reset sạch sẽ điểm Tuần ${wStr}! Tất cả 45 học sinh ở Tuần ${wStr} đã về đúng 100 điểm ban đầu (đã xóa ${deletedCount} lượt điểm).`, 'success');
}

function executeResetAllToBaseline() {
  if (appState.currentUserRole !== 'gvcn') {
    showToast('Chỉ Giáo viên chủ nhiệm mới có quyền Reset điểm thi đua!', 'error');
    return;
  }
  const countBefore = appState.dailyLogs.length;
  appState.dailyLogs = [];
  appState.lockedWeeks = [];

  saveDataToStorage();
  refreshAllUI();
  closeResetDisciplineModal();

  showToast(`Đã xóa sạch toàn bộ ${countBefore} lượt điểm cũ! Tất cả 45 học sinh đã trở về đúng 100 điểm sàn ban đầu để bắt đầu từ Tuần 9.`, 'success');
}

function executeLoadSampleLogs() {
  if (appState.currentUserRole !== 'gvcn') {
    showToast('Chỉ Giáo viên chủ nhiệm mới có quyền nạp dữ liệu mẫu!', 'error');
    return;
  }
  appState.dailyLogs = seedHistoricalWeeklyLogs();
  saveDataToStorage();
  refreshAllUI();
  closeResetDisciplineModal();

  showToast(`Đã nạp thành công bộ dữ liệu thi đua mẫu để tham khảo!`, 'info');
}

// ==================== PWA INSTALL & SERVICE WORKER LOGIC ====================
let deferredPWAInstallPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker đăng ký thành công với scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Không thể đăng ký Service Worker:', err);
      });
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPWAInstallPrompt = e;
  const btn = document.getElementById('btn-install-pwa');
  if (btn) {
    btn.classList.add('animate-pulse');
  }
});

function promptPWAInstall() {
  if (deferredPWAInstallPrompt) {
    deferredPWAInstallPrompt.prompt();
    deferredPWAInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        showToast('Đang cài đặt Ứng dụng Lớp 10A3 vào máy...', 'success');
      }
      deferredPWAInstallPrompt = null;
    });
  } else {
    // Modal hướng dẫn cài đặt chi tiết cho từng loại thiết bị (iPhone, Android, Windows)
    showPWAInstallGuideModal();
  }
}

window.addEventListener('appinstalled', () => {
  showToast('Đã cài đặt thành công Ứng dụng Lớp 10A3! Bạn có thể mở trực tiếp từ màn hình chính.', 'success');
});

function showPWAInstallGuideModal() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let instructions = '';
  if (isIOS) {
    instructions = `
      <div class="space-y-3 text-slate-700 dark:text-slate-200">
        <p class="font-bold text-blue-600 dark:text-blue-400">📱 Hướng dẫn cài trên iPhone / iPad (Safari):</p>
        <ol class="list-decimal list-inside space-y-2 text-xs">
          <li>Bấm vào nút <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng Safari (biểu tượng <i class="fa-solid fa-arrow-up-from-bracket text-blue-500"></i> hình vuông có mũi tên lên).</li>
          <li>Cuộn xuống và chọn <strong>"Thêm vào MH chính"</strong> (hoặc <em>"Add to Home Screen"</em> <i class="fa-solid fa-plus-square text-blue-500"></i>).</li>
          <li>Bấm <strong>"Thêm" (Add)</strong> ở góc trên bên phải.</li>
          <li>Xong! Icon <strong>Lớp 10A3</strong> sẽ xuất hiện ngoài màn hình chính để mở toàn màn hình như App thật.</li>
        </ol>
      </div>
    `;
  } else if (isAndroid) {
    instructions = `
      <div class="space-y-3 text-slate-700 dark:text-slate-200">
        <p class="font-bold text-emerald-600 dark:text-emerald-400">🤖 Hướng dẫn cài trên Android (Chrome):</p>
        <ol class="list-decimal list-inside space-y-2 text-xs">
          <li>Bấm vào biểu tượng <strong>3 dấu chấm đứng (⋮)</strong> ở góc trên cùng bên phải Chrome.</li>
          <li>Chọn dòng <strong>"Cài đặt ứng dụng"</strong> (hoặc <em>"Thêm vào Màn hình chính"</em>).</li>
          <li>Bấm <strong>"Cài đặt"</strong> để xác nhận.</li>
          <li>Xong! App Lớp 10A3 sẽ xuất hiện trên màn hình điện thoại.</li>
        </ol>
      </div>
    `;
  } else {
    instructions = `
      <div class="space-y-3 text-slate-700 dark:text-slate-200">
        <p class="font-bold text-blue-600 dark:text-blue-400">💻 Hướng dẫn cài trên Máy tính (Chrome / Edge / Cốc Cốc):</p>
        <ol class="list-decimal list-inside space-y-2 text-xs">
          <li>Nhìn lên thanh nhập địa chỉ web (URL) ở trên cùng.</li>
          <li>Bấm vào biểu tượng <strong>Cài đặt (Install App <i class="fa-solid fa-download text-blue-500"></i>)</strong> ở góc phải thanh địa chỉ.</li>
          <li>Bấm nút <strong>"Cài đặt"</strong>.</li>
          <li>App sẽ tự động mở thành một cửa sổ phần mềm độc lập và tạo icon ngoài Desktop Windows.</li>
        </ol>
      </div>
    `;
  }

  const modalHtml = `
    <div id="modal-pwa-guide" class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
              <i class="fa-solid fa-mobile-screen-button"></i>
            </div>
            <h3 class="font-black text-sm text-slate-900 dark:text-white">Cài Đặt App Lớp 10A3</h3>
          </div>
          <button onclick="document.getElementById('modal-pwa-guide').remove()" class="text-slate-400 hover:text-slate-600 p-1">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        ${instructions}
        <div class="pt-2 flex justify-end">
          <button onclick="document.getElementById('modal-pwa-guide').remove()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition">
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById('modal-pwa-guide');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}



// ==================== QUẢN LÝ NHIỆM VỤ BAN CÁN SỰ & TỰ QUẢN (XUẤT WORD / IN A4) ====================

const CADRE_DUTIES_DATA = [
  {
    stt: 1,
    category: 'leadership',
    role: 'Lớp trưởng',
    studentId: 'hs_10a3_27', // Trần Lê Hồng Nhung
    badgeColor: 'amber',
    icon: 'fa-solid fa-crown',
    permissions: 'Toàn quyền điều hành học sinh • Chấm điểm thi đua toàn lớp • Quản lý mã PIN Lớp trưởng',
    duties: [
      'Chịu trách nhiệm toàn diện trước GVCN và Ban Giám hiệu về mọi mặt nề nếp học tập, kỷ luật và phong trào của lớp 10A3.',
      'Đại diện tiếng nói của tập thể lớp; tiếp nhận các kế hoạch, chỉ đạo từ nhà trường và GVCN để quán triệt, đôn đốc lớp thực hiện.',
      'Điều hành 15 phút truy bài đầu giờ mỗi ngày và chủ trì tiết Sinh hoạt lớp vào cuối tuần.',
      'Phối hợp với Lớp phó, 6 Tổ trưởng, Bí thư và Sao đỏ duy trì trật tự; xử lý bước đầu các bất đồng nội bộ; báo cáo ngay cho GVCN tình huống phát sinh vượt thẩm quyền.',
      'Thực hiện chấm điểm thi đua khách quan và bảo mật mã PIN điều hành.'
    ]
  },
  {
    stt: 2,
    category: 'leadership',
    role: 'Lớp phó Học tập & CS Vật lý',
    studentId: 'hs_10a3_42', // Lê Văn Vũ
    badgeColor: 'blue',
    icon: 'fa-solid fa-book-open-reader',
    permissions: 'Quản lý 15p truy bài • Chỉ đạo Cán sự bộ môn • Mô hình Đôi bạn cùng tiến',
    duties: [
      'Phụ trách nề nếp học tập, chuẩn bị bài tập về nhà và kiểm tra bài cũ 15 phút đầu giờ.',
      'Quản lý, đôn đốc mạng lưới Cán sự các bộ môn (Toán, Lý, Hóa, Sinh, Văn, Sử, Địa, Anh...); kiểm tra sổ đầu bài sau mỗi buổi học.',
      'Xây dựng và theo dõi mô hình "Đôi bạn cùng tiến", phân công các bạn học tốt hỗ trợ bạn gặp khó khăn kiến thức.',
      'Trực tiếp phụ trách bộ môn Vật lý: chuẩn bị dụng cụ thí nghiệm, hỗ trợ giáo viên bộ môn phát/thu đề cương.',
      'Thay mặt Lớp trưởng điều hành lớp khi Lớp trưởng vắng mặt.'
    ]
  },
  {
    stt: 3,
    category: 'leadership',
    role: 'Lớp phó Lao động',
    studentId: 'hs_10a3_11', // Nguyễn Quốc Huy
    badgeColor: 'emerald',
    icon: 'fa-solid fa-broom',
    permissions: 'Phân công & kiểm tra trực nhật • Quản lý cơ sở vật chất, hệ thống điện quạt',
    duties: [
      'Phụ trách toàn bộ công tác vệ sinh, cảnh quan phòng học và nếp sống văn minh học đường.',
      'Lập lịch và kiểm tra tổ trực nhật mỗi ngày (quét lớp, lau bảng, đổ rác, chuẩn bị nước uống và khăn lau bàn giáo viên).',
      'Kiểm tra và chịu trách nhiệm tắt toàn bộ đèn, quạt, máy chiếu/tivi, đóng then cửa sổ và khóa cửa phòng học khi tan trường.',
      'Quản lý, điều hành lực lượng lớp tham gia các đợt lao động toàn trường do Đoàn trường hoặc GVCN phân công.',
      'Kịp thời phát hiện và báo cáo GVCN các hư hỏng về cơ sở vật chất (bàn ghế, bóng điện, quạt, cửa kính).'
    ]
  },
  {
    stt: 4,
    category: 'leadership',
    role: 'Bí thư Chi đoàn',
    studentId: 'hs_10a3_07', // Tạ Thanh Ngọc Giàu
    badgeColor: 'rose',
    icon: 'fa-solid fa-flag',
    permissions: 'Lãnh đạo Chi đoàn TNCS • Công tác Đoàn trường • Phong trào thanh niên xung kích',
    duties: [
      'Lãnh đạo Chi đoàn TNCS Hồ Chí Minh Lớp 10A3; trực tiếp liên hệ và chịu sự chỉ đạo của Ban Chấp hành Đoàn trường và GVCN.',
      'Tổ chức sinh hoạt Chi đoàn định kỳ, phát động các phong trào xung kích, văn hóa văn nghệ, thể dục thể thao, đền ơn đáp nghĩa.',
      'Quản lý sổ Chi đoàn, sổ Đoàn viên, thu nộp đoàn phí định kỳ đúng hạn.',
      'Theo dõi, phát hiện và bồi dưỡng thanh niên ưu tú trong lớp để giới thiệu kết nạp Đoàn.',
      'Cùng Lớp trưởng và Sao đỏ uốn nắn tác phong, đạo đức, xây dựng văn hóa ứng xử lành mạnh, không bạo lực học đường.'
    ]
  },
  {
    stt: 5,
    category: 'leadership',
    role: 'Thủ quỹ & CS Lịch sử',
    studentId: 'hs_10a3_03', // Từ Diệu Yên Diễm
    badgeColor: 'cyan',
    icon: 'fa-solid fa-coins',
    permissions: 'Quản lý thu - chi quỹ lớp công khai • Quyết toán hàng tháng • Kiêm CS môn Sử',
    duties: [
      'Quản lý thu – chi quỹ lớp theo nguyên tắc công khai, minh bạch, tiết kiệm và đúng quy định.',
      'Chi tiêu cho các hoạt động thiết yếu: nước uống đóng bình, phấn viết, giẻ lau, dụng cụ vệ sinh, photo tài liệu, thăm hỏi bạn bè ốm đau, khen thưởng thi đua tuần.',
      'Ghi chép sổ quỹ chi tiết từng khoản thu - chi (có ngày tháng, chữ ký người nhận hoặc hóa đơn kèm theo).',
      'Báo cáo công khai tài chính định kỳ hàng tháng trước tập thể lớp và nộp báo cáo cho GVCN phê duyệt.',
      'Kiêm phụ trách môn Lịch sử: nhắc nhở ôn bài, tổng hợp thắc mắc kiến thức lịch sử gửi giáo viên.'
    ]
  },
  {
    stt: 6,
    category: 'team_leaders',
    role: 'Tổ trưởng Tổ 1',
    studentId: 'hs_10a3_43', // Dương Lục Yến Vy
    badgeColor: 'teal',
    icon: 'fa-solid fa-users',
    permissions: 'Chấm điểm thi đua Tổ 1 (mã PIN T1) • Quản lý nề nếp & chuyên cần 8 thành viên Tổ 1',
    duties: [
      'Quản lý nề nếp, chuyên cần, trang phục của 8 thành viên Tổ 1; điểm danh đầu giờ báo Lớp trưởng.',
      'Chấm điểm thi đua hàng ngày cho tổ viên trên hệ thống Dashboard (được cấp mã PIN Tổ 1).',
      'Kiểm tra sách vở, bài tập về nhà của thành viên trong tổ trong 15 phút đầu giờ.',
      'Phân công và giám sát các bạn trong tổ thực hiện trực nhật khi đến lượt Tổ 1.',
      'Báo cáo tổng kết thi đua, nhận xét sự tiến bộ của các thành viên tổ trong tiết sinh hoạt cuối tuần.'
    ]
  },
  {
    stt: 7,
    category: 'team_leaders',
    role: 'Tổ trưởng Tổ 2 & CS Hóa học',
    studentId: 'hs_10a3_25', // Nguyễn Hoàng Gia Nguyên
    badgeColor: 'teal',
    icon: 'fa-solid fa-flask',
    permissions: 'Chấm điểm thi đua Tổ 2 (mã PIN T2) • Quản lý 7 thành viên Tổ 2 • Kiêm CS môn Hóa',
    duties: [
      'Bao quát nề nếp, chuyên cần và thái độ học tập của 7 thành viên Tổ 2; chấm điểm thi đua tổ hàng ngày.',
      'Kiêm phụ trách môn Hóa học: liên hệ giáo viên bộ môn chuẩn bị tiết thí nghiệm, kiểm tra bài tập Hóa của lớp trước giờ học.',
      'Đôn đốc, hỗ trợ các thành viên học tập và rèn luyện; phân công trực nhật chu đáo khi đến phiên Tổ 2.',
      'Báo cáo kết quả rèn luyện tổ và gương tiến bộ cho GVCN.'
    ]
  },
  {
    stt: 8,
    category: 'team_leaders',
    role: 'Tổ trưởng Tổ 3',
    studentId: 'hs_10a3_36', // Lê Thị Kim Trúc
    badgeColor: 'teal',
    icon: 'fa-solid fa-users',
    permissions: 'Chấm điểm thi đua Tổ 3 (mã PIN T3) • Quản lý 8 thành viên Tổ 3 (Bàn 9-12 Dãy 1)',
    duties: [
      'Quản lý nề nếp, trật tự, tác phong của 8 thành viên Tổ 3; chấm điểm thi đua hàng ngày bằng mã PIN Tổ 3.',
      'Đôn đốc tổ viên học bài, làm bài nghiêm túc; quản lý các bạn ngồi tại Dãy 1 (Bàn 9 đến Bàn 12).',
      'Điều phối tổ viên trực nhật vệ sinh sạch sẽ, giữ gìn khu vực bàn ghế ngăn nắp.',
      'Tổng kết điểm số, xếp hạng thi đua nội bộ tổ và phát biểu nhận xét cuối tuần.'
    ]
  },
  {
    stt: 9,
    category: 'team_leaders',
    role: 'Tổ trưởng Tổ 4 & CS Tiếng Anh',
    studentId: 'hs_10a3_15', // Võ Quốc Duy Khôi
    badgeColor: 'teal',
    icon: 'fa-solid fa-language',
    permissions: 'Chấm điểm thi đua Tổ 4 (mã PIN T4) • Quản lý 8 thành viên Tổ 4 • Kiêm CS Tiếng Anh',
    duties: [
      'Quản lý nề nếp và chấm điểm thi đua 8 thành viên Tổ 4 hàng ngày; nhắc nhở giữ trật tự và chuyên cần.',
      'Kiêm phụ trách môn Tiếng Anh: hỗ trợ các bạn ôn từ vựng, ngữ pháp, phát đề kiểm tra, đôn đốc chuẩn bị bài trước khi giáo viên vào lớp.',
      'Chỉ đạo tổ viên trực nhật đúng quy định; báo cáo kịp thời các trường hợp vi phạm nề nếp cho GVCN.'
    ]
  },
  {
    stt: 10,
    category: 'team_leaders',
    role: 'Tổ trưởng Tổ 5 & CS Ngữ văn',
    studentId: 'hs_10a3_35', // Nguyễn Ngọc Trinh
    badgeColor: 'teal',
    icon: 'fa-solid fa-feather-pointed',
    permissions: 'Chấm điểm thi đua Tổ 5 (mã PIN T5) • Quản lý 7 thành viên Tổ 5 • Kiêm CS Ngữ văn',
    duties: [
      'Quản lý nề nếp, chuyên cần và chấm điểm thi đua 7 thành viên Tổ 5 hàng ngày.',
      'Kiêm phụ trách môn Ngữ văn: nhắc nhở soạn bài, đọc tác phẩm, thu vở bài tập nộp cho giáo viên Ngữ văn đúng hạn.',
      'Phân công tổ viên trực nhật; theo dõi, động viên các bạn học sinh có điểm rèn luyện thấp vươn lên.'
    ]
  },
  {
    stt: 11,
    category: 'team_leaders',
    role: 'Tổ trưởng Tổ 6 & CS Sinh học',
    studentId: 'hs_10a3_23', // Trương Thị Mỹ Ngân
    badgeColor: 'teal',
    icon: 'fa-solid fa-dna',
    permissions: 'Chấm điểm thi đua Tổ 6 (mã PIN T6) • Quản lý 7 thành viên Tổ 6 • Kiêm CS Sinh học',
    duties: [
      'Bao quát nề nếp, tác phong và chấm điểm thi đua 7 thành viên Tổ 6; quản lý trật tự khu vực cuối Dãy 2.',
      'Kiêm phụ trách môn Sinh học: liên hệ giáo viên chuẩn bị tranh ảnh, mẫu vật, đôn đốc làm bài tập Sinh học.',
      'Phân công trực nhật nghiêm túc khi đến lượt Tổ 6; nhận xét thi đua tổ vào tiết sinh hoạt cuối tuần.'
    ]
  },
  {
    stt: 12,
    category: 'red_star',
    role: 'Đội ngũ Sao đỏ (Trực tuần thi đua)',
    studentId: ['hs_10a3_30', 'hs_10a3_37'], // Trần Thị Ngọc Phúc & Võ Bách Tùng
    assignedNames: '1. Trần Thị Ngọc Phúc (Tổ 1)\n2. Võ Bách Tùng (Tổ 3)',
    badgeColor: 'rose',
    icon: 'fa-solid fa-star',
    permissions: 'Kiểm tra tác phong, đồng phục, nề nếp • Trực ban chéo theo Đoàn trường',
    duties: [
      'Kiểm tra nề nếp tác phong đầu giờ của lớp: đồng phục áo trắng/áo thể dục, phù hiệu, dép quai hậu/giày, đi học đúng giờ.',
      'Theo dõi, phát hiện các trường hợp sử dụng điện thoại sai mục đích, ăn quà vặt, làm việc riêng trong giờ học.',
      'Thực hiện nhiệm vụ chấm điểm trực ban chéo giữa các chi đoàn theo lịch phân công của Ban Thi đua Đoàn trường (đảm bảo công tâm, chính xác, trung thực).',
      'Ghi chép gương người tốt, việc tốt (nhặt của rơi, giúp đỡ bạn) để đề xuất tuyên dương, cộng điểm thi đua.'
    ]
  },
  {
    stt: 13,
    category: 'subject_cadres',
    role: 'Mạng lưới Cán sự các Bộ môn',
    studentId: null,
    assignedNames: '• Toán: Lê Tuấn Phát Tài\n• Lý: Lê Văn Vũ\n• Hóa: Nguyễn Hoàng Gia Nguyên\n• Sinh: Trương Thị Mỹ Ngân\n• Văn: Nguyễn Ngọc Trinh / Kim Bơ\n• Sử: Từ Diệu Yên Diễm\n• Anh: Võ Quốc Duy Khôi\n• Địa, Tin, GDCD: Phân công kiêm nhiệm',
    badgeColor: 'purple',
    icon: 'fa-solid fa-shapes',
    permissions: 'Cầu nối giữa GV bộ môn và lớp • Quản lý bài tập, sổ vở • Chuẩn bị đồ dùng, phòng thực hành',
    duties: [
      'Là cầu nối thông tin giữa thầy/cô giáo bộ môn và tập thể học sinh lớp 10A3.',
      'Nhắc nhở cả lớp chuẩn bị đồ dùng, sách vở, hoàn thành bài tập về nhà trước mỗi tiết học chuyên môn.',
      'Thu nhận, kiểm đếm và bàn giao bài kiểm tra, vở bài tập cho thầy/cô bộ môn đúng thời hạn.',
      'Hỗ trợ giáo viên chuẩn bị máy chiếu, phòng thí nghiệm thực hành, thiết bị dạy học chuyên dụng.',
      'Nhiệt tình hướng dẫn, giải đáp cho các bạn còn vướng mắc kiến thức môn học mình phụ trách.'
    ]
  },
  {
    stt: 14,
    category: 'members',
    role: 'Toàn thể Học sinh (Thành viên Lớp 10A3)',
    studentId: null,
    assignedNames: 'Tập thể 45 học sinh Lớp 10A3',
    badgeColor: 'slate',
    icon: 'fa-solid fa-user-group',
    permissions: 'Chấp hành nội quy • Tham gia học tập & thi đua • Xây dựng Lớp học Hạnh phúc',
    duties: [
      'Chấp hành nghiêm túc Điều lệ trường THPT, nội quy nhà trường và Quy chế thi đua nội bộ lớp 10A3.',
      'Đi học đúng giờ (có mặt trước 15 phút), mặc đồng phục chỉnh tề, giữ lễ phép với thầy cô và người lớn tuổi.',
      'Trung thực trong học tập và thi cử; tích cực thảo luận, phát biểu xây dựng bài trong các tiết học.',
      'Có ý thức giữ gìn vệ sinh chung, trực nhật đúng lịch, bảo quản bàn ghế và tài sản phòng học.',
      'Đoàn kết, yêu thương, giúp đỡ lẫn nhau; không tham gia bạo lực học đường; cam kết tiến bộ từng bước nhỏ (Baby Steps).'
    ]
  }
];

let cadreDutiesFilterKey = 'all';
let cadreDutiesSearchTerm = '';

function getCadreStudentInfo(item) {
  if (item.studentId && typeof item.studentId === 'string') {
    const s = appState.students.find(st => st.id === item.studentId);
    if (s) {
      // Find seat info
      let seatDesc = `Tổ ${s.groupNumber}`;
      if (appState.seating && Array.isArray(appState.seating)) {
        for (const tbl of appState.seating) {
          if (tbl.leftSeat && tbl.leftSeat.studentId === s.id) {
            seatDesc += ` • ${tbl.title} (${tbl.tableId.includes('d1') ? 'Dãy 1 - Trái' : 'Dãy 2 - Trái'})`;
            break;
          }
          if (tbl.rightSeat && tbl.rightSeat.studentId === s.id) {
            seatDesc += ` • ${tbl.title} (${tbl.tableId.includes('d1') ? 'Dãy 1 - Phải' : 'Dãy 2 - Phải'})`;
            break;
          }
        }
      }
      return {
        fullName: s.fullName,
        code: s.code || '',
        group: s.groupNumber,
        seatDesc: seatDesc,
        rawStudent: s
      };
    }
  } else if (Array.isArray(item.studentId)) {
    const names = item.studentId.map(id => {
      const s = appState.students.find(st => st.id === id);
      return s ? `${s.fullName} (Tổ ${s.groupNumber})` : id;
    }).join(' • ');
    return {
      fullName: names,
      code: '',
      group: '',
      seatDesc: 'Đội Sao Đỏ Trực Ban Toàn Trường',
      rawStudent: null
    };
  }

  return {
    fullName: item.assignedNames || 'Tập thể Lớp 10A3',
    code: '',
    group: '',
    seatDesc: item.category === 'members' ? 'Toàn bộ 45 học sinh' : 'Cán sự bộ môn',
    rawStudent: null
  };
}

function renderCadreDuties() {
  const container = document.getElementById('cadre-duties-grid');
  if (!container) return;

  const filtered = CADRE_DUTIES_DATA.filter(item => {
    // Category filter
    if (cadreDutiesFilterKey !== 'all' && item.category !== cadreDutiesFilterKey) {
      return false;
    }
    // Search keyword
    if (cadreDutiesSearchTerm) {
      const term = cadreDutiesSearchTerm.toLowerCase();
      const info = getCadreStudentInfo(item);
      const dutiesText = item.duties.join(' ').toLowerCase();
      const match = item.role.toLowerCase().includes(term) ||
                    info.fullName.toLowerCase().includes(term) ||
                    dutiesText.includes(term) ||
                    (item.permissions && item.permissions.toLowerCase().includes(term));
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <i class="fa-solid fa-folder-open text-3xl mb-2"></i>
        <p class="text-sm font-semibold">Không tìm thấy chức vụ hoặc nhiệm vụ phù hợp với từ khóa.</p>
      </div>
    `;
    return;
  }

  const badgeColorMap = {
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-300',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-300',
    rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-300',
    cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200 border-cyan-300',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 border-teal-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-300',
    slate: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300'
  };

  const cardHtml = filtered.map(item => {
    const info = getCadreStudentInfo(item);
    const badgeStyle = badgeColorMap[item.badgeColor] || badgeColorMap.slate;

    const dutiesListHtml = item.duties.map(d => `
      <li class="flex items-start space-x-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
        <span class="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0"><i class="fa-solid fa-angle-right text-[10px]"></i></span>
        <span>${escapeHtml(d)}</span>
      </li>
    `).join('');

    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between">
        <div class="space-y-3.5">
          <!-- Card Header: STT, Role Badge, Icon -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center space-x-2.5">
              <span class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-xs shrink-0">
                #${item.stt}
              </span>
              <div>
                <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${badgeStyle}">
                  <i class="${item.icon} mr-1"></i>${escapeHtml(item.role)}
                </span>
              </div>
            </div>
            <button type="button" onclick="copySingleCadreDuty(${item.stt})" class="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Sao chép nhiệm vụ này để gửi riêng cho học sinh">
              <i class="fa-solid fa-copy text-xs"></i>
            </button>
          </div>

          <!-- Assignee Name & Seat -->
          <div class="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
            <div class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Học sinh đảm nhiệm:</div>
            <div class="font-black text-slate-900 dark:text-white text-sm whitespace-pre-line leading-snug">
              ${escapeHtml(info.fullName)}
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 pt-0.5">
              <i class="fa-solid fa-location-dot text-slate-400 text-[10px]"></i>
              <span>${escapeHtml(info.seatDesc)}</span>
            </div>
          </div>

          <!-- Permissions Badge -->
          <div class="text-[11px] px-2.5 py-1.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 font-medium">
            <i class="fa-solid fa-shield-halved text-blue-600 dark:text-blue-400 mr-1"></i>
            <strong>Quyền hạn:</strong> ${escapeHtml(item.permissions)}
          </div>

          <!-- Duties Bullet List -->
          <div>
            <div class="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Nhiệm vụ & Chức trách cụ thể:
            </div>
            <ul class="space-y-1.5 pl-0.5">
              ${dutiesListHtml}
            </ul>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
          <span class="text-slate-400 dark:text-slate-500">
            <i class="fa-solid fa-star text-amber-500 mr-1"></i>Thưởng: +10 - 20đ/tuần
          </span>
          <button type="button" onclick="copySingleCadreDuty(${item.stt})" class="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center space-x-1">
            <span>Sao chép</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = cardHtml;
}

function filterCadreDuties(filterKey) {
  cadreDutiesFilterKey = filterKey;
  const buttons = document.querySelectorAll('#cadre-duties-filter-buttons .cadre-filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-filter') === filterKey) {
      btn.className = 'cadre-filter-btn active px-3 py-1.5 text-xs font-bold rounded-lg border bg-blue-600 text-white border-blue-600 transition';
    } else {
      btn.className = 'cadre-filter-btn px-3 py-1.5 text-xs font-bold rounded-lg border bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-500 transition';
    }
  });
  renderCadreDuties();
}

function searchCadreDuties(keyword) {
  cadreDutiesSearchTerm = keyword ? keyword.trim() : '';
  renderCadreDuties();
}

// Sao chép nhanh toàn bộ bảng phân công nhiệm vụ để gửi Zalo lớp
function copyCadreDutiesForZalo() {
  let text = `📋 BẢNG PHÂN CÔNG CHỨC TRÁCH & NHIỆM VỤ BAN CÁN SỰ LỚP 10A3\n`;
  text += `Năm học 2026 – 2027 • GVCN Lớp 10A3\n`;
  text += `=========================================\n\n`;

  CADRE_DUTIES_DATA.forEach(item => {
    const info = getCadreStudentInfo(item);
    text += `🔹 ${item.stt}. ${item.role.toUpperCase()}: ${info.fullName}\n`;
    text += `   • Đơn vị: ${info.seatDesc}\n`;
    text += `   • Quyền hạn: ${item.permissions}\n`;
    text += `   • Nhiệm vụ trọng tâm:\n`;
    item.duties.forEach(d => {
      text += `     - ${d}\n`;
    });
    text += `\n`;
  });

  text += `=========================================\n`;
  text += `🎁 CHẾ ĐỘ ĐÃI NGỘ & ĐIỂM THƯỞNG:\n`;
  text += `+ Cán sự hoàn thành tốt nhiệm vụ: Cộng +10 đến +20 điểm thi đua/tuần.\n`;
  text += `+ Ưu tiên xếp loại Rèn luyện Tốt/Xuất sắc và phần thưởng danh dự từ Quỹ lớp.\n`;
  text += `+ Ban cán sự cam kết nêu gương, đoàn kết, trung thực vì một tập thể 10A3 vững mạnh!\n`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Đã sao chép nội dung bảng phân công để gửi Zalo lớp!', 'success');
    }).catch(() => {
      fallbackCopyText(text, 'Đã sao chép nội dung bảng phân công để gửi Zalo lớp!');
    });
  } else {
    fallbackCopyText(text, 'Đã sao chép nội dung bảng phân công để gửi Zalo lớp!');
  }
}

// Sao chép nhiệm vụ của 1 cá nhân
function copySingleCadreDuty(stt) {
  const item = CADRE_DUTIES_DATA.find(d => d.stt === stt);
  if (!item) return;

  const info = getCadreStudentInfo(item);
  let text = `📌 NHIỆM VỤ CỦA ${item.role.toUpperCase()}: ${info.fullName}\n`;
  text += `Vị trí: ${info.seatDesc}\n`;
  text += `Quyền hạn: ${item.permissions}\n`;
  text += `Chức trách & Nhiệm vụ cụ thể:\n`;
  item.duties.forEach((d, idx) => {
    text += `${idx + 1}. ${d}\n`;
  });
  text += `\nThầy/Cô GVCN tin tưởng và chúc em hoàn thành xuất sắc nhiệm vụ!`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Đã sao chép nhiệm vụ của ${item.role}!`, 'success');
    }).catch(() => {
      fallbackCopyText(text, `Đã sao chép nhiệm vụ của ${item.role}!`);
    });
  } else {
    fallbackCopyText(text, `Đã sao chép nhiệm vụ của ${item.role}!`);
  }
}

function fallbackCopyText(text, successMsg) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
    showToast(successMsg, 'success');
  } catch (err) {
    showToast('Không thể sao chép văn bản tự động!', 'error');
  }
  document.body.removeChild(textarea);
}

// ==================== XUẤT FILE WORD (.DOC) CHUẨN THỂ THỨC HÀNH CHÍNH ====================
function exportCadreDutiesToWord() {
  try {
    showToast('Đang tạo file Word Bảng Phân Công Nhiệm Vụ...', 'info');

    let tableRowsHtml = '';
    CADRE_DUTIES_DATA.forEach(item => {
      const info = getCadreStudentInfo(item);
      const isEven = item.stt % 2 === 0;
      const bg = isEven ? '#f8fafc' : '#ffffff';

      const dutiesHtml = item.duties.map(d => `<div style="margin-bottom: 3pt;">• ${escapeHtml(d)}</div>`).join('');

      tableRowsHtml += `
        <tr style="background-color: ${bg};">
          <td style="text-align: center; font-weight: bold; padding: 6pt; border: 1px solid #1e3a8a;">${item.stt}</td>
          <td style="font-weight: bold; padding: 6pt; border: 1px solid #1e3a8a; color: #0f172a;">${escapeHtml(item.role)}</td>
          <td style="font-weight: bold; padding: 6pt; border: 1px solid #1e3a8a; color: #1e3a8a;">${escapeHtml(info.fullName).replace(/\n/g, '<br>')}</td>
          <td style="text-align: center; font-style: italic; padding: 6pt; border: 1px solid #1e3a8a;">${escapeHtml(info.seatDesc)}</td>
          <td style="padding: 6pt; border: 1px solid #1e3a8a; font-size: 10pt; line-height: 1.25;">
            <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 2pt;">Quyền hạn: ${escapeHtml(item.permissions)}</div>
            ${dutiesHtml}
          </td>
        </tr>
      `;
    });

    const docHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
      <meta charset="utf-8">
      <title>Bảng Phân Công Nhiệm Vụ Ban Cán Sự Lớp 10A3</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 595.3pt 841.9pt; /* A4: 210mm x 297mm */
          margin: 56.7pt 42.5pt 56.7pt 70.8pt; /* Trên 2cm, Dưới 2cm, Trái 2.5cm, Phải 1.5cm */
          mso-header-margin: 36pt;
          mso-footer-margin: 36pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 11.5pt;
          line-height: 1.22;
          color: #0f172a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8pt;
          margin-bottom: 12pt;
        }
        th {
          background-color: #1e3a8a;
          color: #ffffff;
          font-weight: bold;
          text-align: center;
          padding: 7pt;
          border: 1px solid #1e3a8a;
          font-size: 10.5pt;
        }
        td {
          padding: 6pt;
          border: 1px solid #1e3a8a;
          vertical-align: top;
        }
        .header-tbl td {
          border: none !important;
          padding: 2pt 4pt;
        }
        .sign-tbl td {
          border: none !important;
          padding: 4pt;
          text-align: center;
        }
      </style>
      </head>
      <body>
      <div class="Section1">
        <!-- Quốc hiệu & Tên trường -->
        <table class="header-tbl" style="width: 100%; margin-bottom: 10pt;">
          <tr>
            <td style="width: 45%; text-align: center; vertical-align: top;">
              <div style="font-size: 10pt; font-weight: bold;">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
              <div style="font-size: 10.5pt; font-weight: bold;">TRƯỜNG THPT NGUYỄN BỈNH KHIÊM</div>
              <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a; margin-top: 2pt;">TẬP THỂ LỚP 10A3</div>
              <div style="font-weight: bold;">***</div>
            </td>
            <td style="width: 55%; text-align: center; vertical-align: top;">
              <div style="font-size: 10.5pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style="font-size: 11pt; font-weight: bold; font-style: italic;">Độc lập – Tự do – Hạnh phúc</div>
              <div style="margin-top: 2pt;">-----------------------</div>
            </td>
          </tr>
        </table>

        <div style="text-align: right; font-style: italic; font-size: 11pt; margin-bottom: 8pt;">
          Lớp 10A3, ngày 09 tháng 11 năm 2026
        </div>

        <div style="text-align: center; margin-bottom: 4pt;">
          <h1 style="font-size: 15pt; font-weight: bold; color: #0f172a; margin: 0;">BẢNG PHÂN CÔNG CHỨC TRÁCH & NHIỆM VỤ</h1>
          <div style="font-size: 11.5pt; font-weight: bold; color: #1e3a8a; margin-top: 3pt;">BAN CÁN SỰ & ĐỘI NGŨ TỰ QUẢN LỚP 10A3 - NĂM HỌC 2026 – 2027</div>
          <div style="font-size: 10.5pt; font-style: italic; color: #475569;">(Ban hành kèm theo Quy chế thi đua nội bộ & Chương trình GDPT 2018)</div>
        </div>

        <p style="text-align: justify; text-indent: 20pt; margin-top: 10pt; margin-bottom: 8pt; font-size: 11pt;">
          Nhằm xây dựng tập thể Lớp 10A3 kỷ cương, đoàn kết, học tập tốt, hướng tới mô hình Trường học hạnh phúc; phát huy tính tự giác, tinh thần trách nhiệm và kỹ năng lãnh đạo bản thân của từng học sinh; Giáo viên chủ nhiệm công bố và phân công chức trách, nhiệm vụ cụ thể cho từng thành viên Ban Cán Sự, đội ngũ tự quản và toàn thể học sinh lớp 10A3 như sau:
        </p>

        <!-- Bảng danh sách nhiệm vụ -->
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">STT</th>
              <th style="width: 17%;">Chức Vụ</th>
              <th style="width: 18%;">Họ Và Tên Học Sinh</th>
              <th style="width: 12%;">Đơn Vị / Vị Trí</th>
              <th style="width: 48%;">Chức Trách & Nhiệm Vụ Trọng Tâm</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- Chế độ khen thưởng -->
        <div style="margin-top: 12pt; margin-bottom: 8pt;">
          <div style="font-size: 11.5pt; font-weight: bold; color: #1e3a8a; margin-bottom: 4pt;">
            CHẾ ĐỘ KHEN THƯỞNG, ĐÃI NGỘ & XỬ LÝ TRÁCH NHIỆM
          </div>
          <div style="font-size: 10.5pt; margin-bottom: 3pt; text-align: justify;">
            <strong>1. Khen thưởng định kỳ:</strong> Cán sự lớp, Tổ trưởng, Sao đỏ và Cán sự bộ môn hoàn thành xuất sắc nhiệm vụ trong tuần/tháng sẽ được cộng điểm thi đua cá nhân (+10 đến +20 điểm), được ưu tiên xếp loại Rèn luyện Xuất sắc/Tốt cuối học kỳ và được nhận phần thưởng danh dự từ Quỹ lớp.
          </div>
          <div style="font-size: 10.5pt; margin-bottom: 3pt; text-align: justify;">
            <strong>2. Quyền hạn tự quản:</strong> Ban Cán Sự và Tổ trưởng có toàn quyền ghi nhận, chấm điểm thi đua thành viên theo thang điểm quy định; có quyền nhắc nhở và đề xuất GVCN biểu dương hoặc kiểm điểm các trường hợp cụ thể.
          </div>
          <div style="font-size: 10.5pt; margin-bottom: 6pt; text-align: justify;">
            <strong>3. Xử lý trách nhiệm:</strong> Nếu cán sự bao che khuyết điểm, thiếu gương mẫu hoặc không hoàn thành nhiệm vụ được giao quá 02 tuần liên tiếp, lớp sẽ tiến hành góp ý trong tiết sinh hoạt và GVCN sẽ xem xét miễn nhiệm, điều chuyển vị trí phù hợp.
          </div>
        </div>

        <!-- Chữ ký -->
        <table class="sign-tbl" style="width: 100%; margin-top: 15pt;">
          <tr>
            <td style="width: 33%; font-weight: bold; font-size: 10.5pt;">
              ĐẠI DIỆN CHI ĐOÀN<br>
              BÍ THƯ<br>
              <span style="font-weight: normal; font-style: italic; font-size: 9.5pt;">(Ký và ghi rõ họ tên)</span>
              <br><br><br><br>
              Tạ Thanh Ngọc Giàu
            </td>
            <td style="width: 34%; font-weight: bold; font-size: 10.5pt;">
              ĐẠI DIỆN BAN CÁN SỰ<br>
              LỚP TRƯỞNG<br>
              <span style="font-weight: normal; font-style: italic; font-size: 9.5pt;">(Ký và ghi rõ họ tên)</span>
              <br><br><br><br>
              Trần Lê Hồng Nhung
            </td>
            <td style="width: 33%; font-weight: bold; font-size: 10.5pt; color: #b91c1c;">
              DUYỆT CỦA GVCN<br>
              GIÁO VIÊN CHỦ NHIỆM<br>
              <span style="font-weight: normal; font-style: italic; font-size: 9.5pt;">(Ký và ghi rõ họ tên)</span>
              <br><br><br><br>
              Thầy/Cô Chủ Nhiệm 10A3
            </td>
          </tr>
        </table>
      </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Bang_Phan_Cong_Nhiem_Vu_Ban_Can_Su_Lop_10A3.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    showToast('Xuất thành công file Word Bảng Phân Công Nhiệm Vụ!', 'success');
  } catch (error) {
    console.error('Lỗi khi xuất Word:', error);
    showToast('Lỗi khi tạo file Word: ' + error.message, 'error');
  }
}

// ==================== IN VÀ PREVIEW BẢNG PHÂN CÔNG NHIỆM VỤ (A4) ====================
function openPrintDutiesModal() {
  const modal = document.getElementById('modal-print-duties');
  const content = document.getElementById('print-duties-content');
  if (!modal || !content) return;

  content.innerHTML = generatePrintDutiesHTML();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePrintDutiesModal() {
  const modal = document.getElementById('modal-print-duties');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function generatePrintDutiesHTML() {
  let tableRowsHtml = '';
  CADRE_DUTIES_DATA.forEach(item => {
    const info = getCadreStudentInfo(item);
    const isEven = item.stt % 2 === 0;
    const bg = isEven ? '#f8fafc' : '#ffffff';

    const dutiesHtml = item.duties.map(d => `<div class="mb-1 text-[11px] leading-tight">• ${escapeHtml(d)}</div>`).join('');

    tableRowsHtml += `
      <tr style="background-color: ${bg};" class="border-b border-slate-300">
        <td class="text-center font-bold p-2 border border-slate-400 text-xs">${item.stt}</td>
        <td class="font-bold p-2 border border-slate-400 text-xs text-slate-900">${escapeHtml(item.role)}</td>
        <td class="font-bold p-2 border border-slate-400 text-xs text-blue-900 whitespace-pre-line">${escapeHtml(info.fullName)}</td>
        <td class="text-center italic p-2 border border-slate-400 text-[11px] text-slate-600">${escapeHtml(info.seatDesc)}</td>
        <td class="p-2 border border-slate-400 text-xs">
          <div class="font-bold text-blue-800 text-[11px] mb-1">Quyền hạn: ${escapeHtml(item.permissions)}</div>
          ${dutiesHtml}
        </td>
      </tr>
    `;
  });

  return `
    <div class="bg-white text-slate-900 p-8 sm:p-12 shadow-xl border border-slate-300 w-full max-w-[210mm] font-serif" style="min-height: 297mm; box-sizing: border-box;">
      <!-- Header -->
      <div class="flex justify-between items-start mb-4 border-b pb-3 border-slate-300">
        <div class="text-center w-5/12">
          <div class="text-xs font-bold uppercase">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
          <div class="text-xs font-bold uppercase">TRƯỜNG THPT NGUYỄN BỈNH KHIÊM</div>
          <div class="text-sm font-black text-blue-900 mt-1 uppercase">TẬP THỂ LỚP 10A3</div>
          <div class="text-xs font-bold mt-0.5">***</div>
        </div>
        <div class="text-center w-7/12">
          <div class="text-xs font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div class="text-xs font-bold italic">Độc lập – Tự do – Hạnh phúc</div>
          <div class="text-xs font-bold mt-1">-----------------------</div>
        </div>
      </div>

      <div class="text-right italic text-xs mb-3 text-slate-600">
        Lớp 10A3, ngày 09 tháng 11 năm 2026
      </div>

      <!-- Title -->
      <div class="text-center mb-5">
        <h2 class="text-lg font-black text-slate-900 uppercase tracking-wide">BẢNG PHÂN CÔNG CHỨC TRÁCH & NHIỆM VỤ</h2>
        <div class="text-sm font-bold text-blue-900 mt-1">BAN CÁN SỰ & ĐỘI NGŨ TỰ QUẢN LỚP 10A3 - NĂM HỌC 2026 – 2027</div>
        <div class="text-xs italic text-slate-500 mt-0.5">(Ban hành kèm theo Quy chế thi đua nội bộ & Chương trình GDPT 2018)</div>
      </div>

      <p class="text-justify indent-6 text-xs leading-relaxed mb-4 text-slate-700">
        Nhằm xây dựng tập thể Lớp 10A3 kỷ cương, đoàn kết, học tập tốt, hướng tới mô hình Trường học hạnh phúc; phát huy tính tự giác, tinh thần trách nhiệm và kỹ năng lãnh đạo bản thân của từng học sinh; Giáo viên chủ nhiệm công bố và phân công chức trách, nhiệm vụ cụ thể cho từng thành viên Ban Cán Sự, đội ngũ tự quản và toàn thể học sinh lớp 10A3 như sau:
      </p>

      <!-- Table -->
      <table class="w-full border-collapse border border-slate-400 mb-5 text-left">
        <thead>
          <tr class="bg-blue-900 text-white text-xs font-bold">
            <th class="p-2 border border-slate-400 text-center w-[5%]">STT</th>
            <th class="p-2 border border-slate-400 w-[18%]">Chức Vụ</th>
            <th class="p-2 border border-slate-400 w-[19%]">Họ Và Tên Học Sinh</th>
            <th class="p-2 border border-slate-400 text-center w-[13%]">Vị Trí / Tổ</th>
            <th class="p-2 border border-slate-400 w-[45%]">Chức Trách & Nhiệm Vụ Trọng Tâm</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <!-- Rules -->
      <div class="text-xs space-y-1.5 mb-6 text-slate-800">
        <div class="font-bold text-blue-900 uppercase">Chế độ khen thưởng, đãi ngộ & xử lý trách nhiệm:</div>
        <p class="leading-relaxed"><strong>1. Khen thưởng định kỳ:</strong> Cán sự hoàn thành tốt nhiệm vụ được cộng +10 đến +20 điểm thi đua/tuần, ưu tiên xếp loại Rèn luyện Tốt/Xuất sắc và nhận quà biểu dương từ Quỹ lớp.</p>
        <p class="leading-relaxed"><strong>2. Quyền hạn tự quản:</strong> Ban Cán Sự được cấp mã PIN bảo mật riêng để chấm điểm thi đua thành viên, đôn đốc nề nếp và đề xuất GVCN tuyên dương hoặc nhắc nhở.</p>
        <p class="leading-relaxed"><strong>3. Xử lý trách nhiệm:</strong> Cán sự vi phạm kỷ luật, bao che hoặc bỏ bê nhiệm vụ quá 02 tuần liên tiếp sẽ bị góp ý và xem xét điều chuyển hoặc miễn nhiệm.</p>
      </div>

      <!-- Signatures -->
      <div class="grid grid-cols-3 gap-4 text-center text-xs mt-6 pt-2">
        <div>
          <div class="font-bold uppercase">ĐẠI DIỆN CHI ĐOÀN<br>BÍ THƯ</div>
          <div class="text-[10px] italic text-slate-500">(Ký và ghi rõ họ tên)</div>
          <div class="h-16"></div>
          <div class="font-bold text-slate-900">Tạ Thanh Ngọc Giàu</div>
        </div>
        <div>
          <div class="font-bold uppercase">ĐẠI DIỆN BAN CÁN SỰ<br>LỚP TRƯỞNG</div>
          <div class="text-[10px] italic text-slate-500">(Ký và ghi rõ họ tên)</div>
          <div class="h-16"></div>
          <div class="font-bold text-slate-900">Trần Lê Hồng Nhung</div>
        </div>
        <div>
          <div class="font-bold uppercase text-rose-700">DUYỆT CỦA GVCN<br>GIÁO VIÊN CHỦ NHIỆM</div>
          <div class="text-[10px] italic text-slate-500">(Ký và ghi rõ họ tên)</div>
          <div class="h-16"></div>
          <div class="font-bold text-slate-900">Thầy/Cô Chủ Nhiệm 10A3</div>
        </div>
      </div>
    </div>
  `;
}

function printDutiesDirectly() {
  let printContainer = document.getElementById('print-duties-export-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'print-duties-export-container';
    printContainer.className = 'hidden print:block';
    document.body.appendChild(printContainer);
  }

  printContainer.innerHTML = generatePrintDutiesHTML();
  window.print();
}
