'use strict';

/**
 * DASHBOARD QUẢN TRỊ LỚP HỌC TỰ QUẢN 10A3
 * Kiến trúc: Vanilla JavaScript ES6+, Strict Mode, LocalStorage Persistence
 */

// ==================== HẰNG SỐ & CẤU HÌNH QUY CHẾ ====================
const STORAGE_KEYS = {
  STUDENTS: 'dashboard10a3_official_45_students_v6',
  LOGS: 'dashboard10a3_official_45_logs_v6',
  SEATING: 'dashboard10a3_official_45_seating_v4'
};

const BASE_WEEKLY_SCORE = 100;

// Thang Xếp Loại Tháng: Tốt (>= 90), Khá (70-89), Đạt (50-69), Chưa đạt (<50)
const RANKING_TIERS = {
  GOOD: { label: 'Tốt', min: 90, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  FAIR: { label: 'Khá', min: 70, color: 'text-blue-700 bg-blue-50 border-blue-300' },
  PASS: { label: 'Đạt', min: 50, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  FAIL: { label: 'Chưa đạt', min: 0, color: 'text-rose-700 bg-rose-50 border-rose-300' }
};

// THANG ĐIỂM CỘNG
const BONUS_RULES = [
  { key: 'bonus_school_honors', label: 'Đạt điểm Tốt toàn diện / Thành tích cấp trường', points: 50, icon: 'fa-trophy' },
  { key: 'bonus_duty_excellent', label: 'Cán sự làm tốt nhiệm vụ tháng', points: 20, icon: 'fa-user-check' },
  { key: 'bonus_peer_tutoring', label: 'Kèm bạn yếu Toán/Lý (+10 cho cả hai)', points: 10, icon: 'fa-user-group' },
  { key: 'bonus_board_solution', label: 'Xung phong lên bảng đúng', points: 10, icon: 'fa-chalkboard-user' },
  { key: 'bonus_effort_support', label: 'Học sinh yếu có nỗ lực làm bài', points: 10, icon: 'fa-heart-circle-bolt' },
  { key: 'bonus_group_homework', label: 'Cả tổ 100% làm bài tập (+10/người)', points: 10, icon: 'fa-users' },
  { key: 'bonus_individual_effort', label: 'Hoàn thành bài tập cá nhân / Trực nhật tự giác / Bổ sung ý kiến', points: 5, icon: 'fa-hand-sparkles' }
];

// THANG ĐIỂM TRỪ
const VIOLATION_RULES = [
  { key: 'viol_absent_no_excuse', label: 'Vắng không phép', points: -20, icon: 'fa-user-xmark' },
  { key: 'viol_profanity', label: 'Nói tục / chửi thề', points: -15, icon: 'fa-comment-slash' },
  { key: 'viol_cheating', label: 'Chép bài / gian lận kiểm tra', points: -15, icon: 'fa-file-circle-xmark' },
  { key: 'viol_no_homework', label: 'Không làm bài / không học bài', points: -10, icon: 'fa-book-skull' },
  { key: 'viol_distraction_phone', label: 'Làm việc riêng / sử dụng ĐT / tự ý đổi chỗ', points: -10, icon: 'fa-mobile-screen-button' },
  { key: 'viol_sleeping_eating', label: 'Ngủ gục / nói chuyện / ăn vặt / thiếu đồ dùng', points: -5, icon: 'fa-bed' },
  { key: 'viol_late_uniform', label: 'Đi muộn / sai đồng phục', points: -5, icon: 'fa-clock' }
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
  activeModalSeat: null
};

// ==================== KHỞI TẠO HỆ THỐNG ====================
document.addEventListener('DOMContentLoaded', () => {
  initDateInputs();
  renderRuleButtons();
  loadDataFromStorage();

  // Đảm bảo luôn sử dụng đúng danh sách 45 học sinh chính thức theo ảnh sổ lớp
  const hasBalancedRoster = appState.students.length === 45 && 
                            appState.students.some(s => s.fullName === 'Trần Lê Hồng Nhung' && s.role === 'Lớp trưởng');
  if (!hasBalancedRoster) {
    injectOfficial45Students(false);
  }

  // Kiểm tra URL hash (vd: #scoring, #students) để mở tab tương ứng
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['dashboard', 'scoring', 'students', 'seating', 'logs', 'backup'].includes(initialHash)) {
    switchTab(initialHash);
  } else if (initialHash === 'print-preview') {
    switchTab('seating');
    setTimeout(() => openPrintPreviewModal(), 200);
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
function loadDataFromStorage() {
  try {
    const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);

    appState.students = rawStudents ? JSON.parse(rawStudents) : [];
    appState.dailyLogs = rawLogs ? JSON.parse(rawLogs) : [];
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

function getRankingTier(score) {
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
  const sections = {
    dashboard: document.getElementById('section-dashboard'),
    scoring: document.getElementById('section-scoring'),
    students: document.getElementById('section-students'),
    seating: document.getElementById('section-seating'),
    logs: document.getElementById('section-logs'),
    backup: document.getElementById('section-backup')
  };

  const navButtons = {
    dashboard: document.getElementById('nav-dashboard'),
    scoring: document.getElementById('nav-scoring'),
    students: document.getElementById('nav-students'),
    seating: document.getElementById('nav-seating'),
    logs: document.getElementById('nav-logs'),
    backup: document.getElementById('nav-backup')
  };

  const titles = {
    dashboard: 'Bảng Điều Khiển Tổng Quan Thi Đua Lớp 10A3',
    scoring: 'Phiếu Ghi Nhận Điểm Thi Đua Tự Quản (Ban Cán Sự / Sao Đỏ)',
    students: 'Danh Sách & Quản Trị Học Sinh Lớp 10A3',
    seating: 'Sơ Đồ Chỗ Ngồi Lớp Học 10A3 (2 Dãy • 6 Tổ • 24 Bàn)',
    logs: 'Sổ Tra Cứu & Nhật Ký Ghi Nhận Điểm',
    backup: 'Trung Tâm Dữ Liệu, Cài Đặt & Sao Lưu'
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
  } else if (tabName === 'scoring') {
    renderScoringStudentPills();
  } else if (tabName === 'students') {
    renderStudentsTable();
  } else if (tabName === 'seating') {
    renderSeatingPlan();
  } else if (tabName === 'logs') {
    renderLogsTable();
  }
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
  document.getElementById('kpi-avg-score').textContent = avgScore;
  document.getElementById('kpi-special-count').textContent = specialCount;

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
              ${stu.isSpecialSupport ? '<span class="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">Ưu tiên kèm</span>' : ''}
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

  // Lọc học sinh có điểm < 90 hoặc có điểm trừ hoặc học sinh yếu cần kèm
  const needAttention = studentScoreMap
    .filter(s => s.currentScore < 90 || s.isSpecialSupport)
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
            <i class="fa-solid ${stu.isSpecialSupport ? 'fa-handshake-angle text-amber-600' : 'fa-circle-exclamation'}"></i>
          </span>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-800 text-sm hover:text-blue-600 transition">${escapeHtml(stu.fullName)}</span>
              ${stu.isSpecialSupport ? '<span class="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded border border-amber-300">Cần theo dõi đặc biệt</span>' : ''}
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
      const tier = getRankingTier(score);
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
      <div onclick="selectRule('bonus', '${rule.key}')" id="rule-btn-${rule.key}" class="scoring-btn bg-white p-3 rounded-xl border border-emerald-200 hover:border-emerald-400 flex items-center justify-between text-xs">
        <div class="flex items-center space-x-2.5">
          <span class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <i class="fa-solid ${rule.icon}"></i>
          </span>
          <span class="font-semibold text-slate-800">${rule.label}</span>
        </div>
        <span class="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 border border-emerald-200">+${rule.points}</span>
      </div>
    `).join('');
  }

  // Violation buttons
  const violList = document.getElementById('violation-buttons-list');
  if (violList) {
    violList.innerHTML = VIOLATION_RULES.map(rule => `
      <div onclick="selectRule('violation', '${rule.key}')" id="rule-btn-${rule.key}" class="scoring-btn bg-white p-3 rounded-xl border border-rose-200 hover:border-rose-400 flex items-center justify-between text-xs">
        <div class="flex items-center space-x-2.5">
          <span class="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <i class="fa-solid ${rule.icon}"></i>
          </span>
          <span class="font-semibold text-slate-800">${rule.label}</span>
        </div>
        <span class="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md shrink-0 border border-rose-200">${rule.points}</span>
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

  if (filtered.length === 0) {
    container.innerHTML = '<p class="col-span-full text-center text-xs text-slate-400 py-4">Chưa có học sinh nào trong tổ này</p>';
    return;
  }

  filtered.forEach(stu => {
    const isSelected = appState.selectedStudentIds.has(stu.id);
    const pill = document.createElement('div');
    pill.className = `student-pill p-2 rounded-xl border text-xs flex flex-col justify-between ${isSelected ? 'active' : 'bg-white border-slate-200'}`;
    pill.onclick = () => toggleSelectStudent(stu.id);
    pill.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400">T${stu.groupNumber}</span>
        ${isSelected ? '<i class="fa-solid fa-circle-check text-blue-600 text-xs"></i>' : '<i class="fa-regular fa-circle text-slate-300 text-xs"></i>'}
      </div>
      <p class="font-bold text-slate-800 truncate my-1">${escapeHtml(stu.fullName)}</p>
      <div class="flex items-center justify-between text-[10px]">
        <span class="text-slate-500 truncate">${escapeHtml(stu.role)}</span>
        <span class="font-bold text-slate-700">${calculateStudentScore(stu.id)}đ</span>
      </div>
    `;
    container.appendChild(pill);
  });

  updateSelectedCountUI();
}

function toggleSelectStudent(studentId) {
  if (appState.selectedStudentIds.has(studentId)) {
    appState.selectedStudentIds.delete(studentId);
  } else {
    appState.selectedStudentIds.add(studentId);
  }
  renderScoringStudentPills();
}

function selectAllVisibleStudents() {
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
  if (appState.selectedStudentIds.size === 0) {
    showToast('Vui lòng click chọn ít nhất 1 học sinh cần chấm điểm!', 'warning');
    return;
  }
  if (!appState.activeRule) {
    showToast('Vui lòng chọn 1 tiêu chí điểm cộng hoặc điểm trừ!', 'warning');
    return;
  }

  const dateVal = document.getElementById('score-input-date').value || new Date().toISOString().split('T')[0];
  const recorderVal = document.getElementById('score-input-recorder').value.trim() || 'Cán sự lớp';
  const noteVal = document.getElementById('score-note').value.trim();

  const newLogs = [];
  const selectedIds = Array.from(appState.selectedStudentIds);

  selectedIds.forEach(stuId => {
    newLogs.push({
      id: generateUUID(),
      date: dateVal,
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

  // Reset form selection
  appState.selectedStudentIds.clear();
  document.getElementById('score-note').value = '';
  renderScoringStudentPills();
  refreshAllUI();

  showToast(`Đã ghi nhận thành công cho ${newLogs.length} học sinh!`, 'success');
}

// ==================== RENDERING: QUẢN LÝ DANH SÁCH HỌC SINH (TAB 3) ====================
function renderStudentsTable() {
  const tbody = document.getElementById('students-table-body');
  if (!tbody) return;

  const searchKeyword = (document.getElementById('search-student-input')?.value || '').toLowerCase().trim();
  const filterGroup = document.getElementById('filter-student-group')?.value || 'all';
  const filterSpecial = document.getElementById('filter-student-special')?.value || 'all';
  const filterRole = document.getElementById('filter-student-role')?.value || 'all';

  const filtered = appState.students.filter(s => {
    const matchName = s.fullName.toLowerCase().includes(searchKeyword);
    const matchGroup = filterGroup === 'all' || Number(s.groupNumber) === Number(filterGroup);
    let matchSpecial = true;
    if (filterSpecial === 'special') matchSpecial = s.isSpecialSupport === true;
    if (filterSpecial === 'normal') matchSpecial = !s.isSpecialSupport;
    let matchRole = true;
    if (filterRole !== 'all') matchRole = s.role === filterRole;
    return matchName && matchGroup && matchSpecial && matchRole;
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400 text-xs">Không tìm thấy học sinh nào phù hợp</td></tr>`;
    document.getElementById('students-table-summary').textContent = `Hiển thị 0 học sinh`;
    return;
  }

  filtered.forEach((stu, index) => {
    const score = calculateStudentScore(stu.id);
    const tier = getRankingTier(score);
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono text-xs text-slate-400">${index + 1}</td>
      <td class="py-3 px-4 cursor-pointer" onclick="openStudentDetailModal('${stu.id}')">
        <span class="font-bold text-slate-800 text-sm hover:text-blue-600 transition block">${escapeHtml(stu.fullName)}</span>
        <span class="text-[11px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
          <span><i class="fa-regular fa-id-card text-[10px] mr-1"></i>${stu.code || 'Chưa có mã'}</span>
          ${stu.dob ? `<span>• <i class="fa-regular fa-calendar text-[10px] mr-1"></i>${stu.dob}</span>` : ''}
          ${stu.academicScore ? `<span class="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px]"><i class="fa-solid fa-graduation-cap text-[9px] mr-1"></i>${stu.academicScore}đ</span>` : ''}
        </span>
      </td>
      <td class="py-3 px-4 text-center">
        <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Tổ ${stu.groupNumber}
        </span>
      </td>
      <td class="py-3 px-4">
        ${getRoleBadgeHtml(stu.role)}
      </td>
      <td class="py-3 px-4 text-center">
        ${stu.isSpecialSupport 
          ? '<span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300"><i class="fa-solid fa-shield-heart text-amber-600"></i><span>Cần theo dõi</span></span>' 
          : '<span class="text-slate-300 text-xs">—</span>'}
      </td>
      <td class="py-3 px-4 text-right">
        <span class="font-black text-sm ${score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-blue-600' : 'text-rose-600'}">${score} đ</span>
      </td>
      <td class="py-3 px-4 text-center">
        <span class="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${tier.color}">
          ${tier.label}
        </span>
      </td>
      <td class="py-3 px-4 text-center space-x-1">
        <button onclick="quickScoreSingle('${stu.id}')" title="Chấm điểm em này" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"><i class="fa-solid fa-star"></i></button>
        <button onclick="openEditStudentModal('${stu.id}')" title="Sửa thông tin" class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"><i class="fa-solid fa-pen"></i></button>
        <button onclick="deleteStudent('${stu.id}')" title="Xóa học sinh" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('students-table-summary').textContent = `Hiển thị ${filtered.length} / ${appState.students.length} học sinh`;
}

function getRoleBadgeHtml(role) {
  switch (role) {
    case 'Lớp trưởng':
      return `<span class="badge-role-lead px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-crown mr-1"></i>Lớp trưởng</span>`;
    case 'Lớp phó':
    case 'Lớp phó Học tập':
    case 'Lớp phó Lao động':
      return `<span class="badge-role-deputy px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-user-graduate mr-1"></i>${escapeHtml(role)}</span>`;
    case 'Bí thư':
      return `<span class="badge-role-sec px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-flag mr-1"></i>Bí thư</span>`;
    case 'Tổ trưởng':
      return `<span class="badge-role-group px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-sitemap mr-1"></i>Tổ trưởng</span>`;
    case 'Cán sự Toán':
      return `<span class="badge-role-math px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-calculator mr-1"></i>Cán sự Toán</span>`;
    case 'Cán sự Lý':
      return `<span class="badge-role-phys px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-atom mr-1"></i>Cán sự Lý</span>`;
    case 'Cán sự Hóa':
      return `<span class="badge-role-chem px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-flask mr-1"></i>Cán sự Hóa</span>`;
    case 'Cán sự Anh':
    case 'Cán sự Tiếng Anh':
      return `<span class="badge-role-eng px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-language mr-1"></i>Cán sự Anh</span>`;
    case 'Cán sự Sinh':
      return `<span class="badge-role-bio px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-dna mr-1"></i>Cán sự Sinh</span>`;
    case 'Cán sự Văn':
      return `<span class="badge-role-lit px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-book-open mr-1"></i>Cán sự Văn</span>`;
    case 'Sao đỏ':
      return `<span class="badge-role-redstar px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-star mr-1"></i>Sao đỏ</span>`;
    default:
      return `<span class="text-xs text-slate-500">${escapeHtml(role || 'Thành viên')}</span>`;
  }
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

function deleteLogEntry(logId) {
  if (confirm('Bạn có chắc chắn muốn xóa lượt ghi nhận điểm này không? Điểm số của học sinh sẽ tự động được hoàn lại.')) {
    appState.dailyLogs = appState.dailyLogs.filter(l => l.id !== logId);
    saveDataToStorage();
    refreshAllUI();
    showToast('Đã xóa bản ghi nhật ký và hoàn lại điểm cho học sinh.', 'info');
  }
}

// ==================== MODAL CHI TIẾT HỒ SƠ 1 HỌC SINH ====================
function openStudentDetailModal(studentId) {
  const stu = appState.students.find(s => s.id === studentId);
  if (!stu) return;

  const score = calculateStudentScore(studentId);
  const tier = getRankingTier(score);
  const stuLogs = appState.dailyLogs.filter(l => l.studentId === studentId);

  document.getElementById('detail-student-name').textContent = stu.fullName;
  document.getElementById('detail-student-meta').textContent = `Tổ ${stu.groupNumber} • ${stu.role}${stu.code ? ` • Mã: ${stu.code}` : ''}${stu.dob ? ` • NS: ${stu.dob}` : ''}${stu.academicScore ? ` • Điểm đầu vào: ${stu.academicScore}đ` : ''}${stu.isSpecialSupport ? ' • [Cần hỗ trợ đặc biệt]' : ''}`;
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
  // ===== TỔ 1 (8 học sinh • Điểm TB Lực Học: 34.44) =====
  { id: 'hs_10a3_43', code: '1704246671', fullName: 'Dương Lục Yến Vy', dob: '24/09/2011', academicScore: 34, groupNumber: 1, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_16', code: '1701502268', fullName: 'Nguyễn Tấn Kỳ', dob: '26/12/2011', academicScore: 37, groupNumber: 1, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_26', code: '1703554579', fullName: 'Cao Ngọc An Nhiên', dob: '14/12/2011', academicScore: 39, groupNumber: 1, role: 'Cán sự Anh', isSpecialSupport: false },
  { id: 'hs_10a3_30', code: '1701941035', fullName: 'Trần Thị Ngọc Phúc', dob: '09/09/2011', academicScore: 36, groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_20', code: '1702880874', fullName: 'Nguyễn Bảo Long', dob: '24/04/2011', academicScore: 25, groupNumber: 1, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_44', code: '2511977424', fullName: 'Phạm Ngọc Tường Vy', dob: '01/08/2010', academicScore: 34.5, groupNumber: 1, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_32', code: '1704379981', fullName: 'Lê Tuấn Phát Tài', dob: '17/07/2011', academicScore: 34, groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_28', code: '1805586438', fullName: 'Võ Thành Phát', dob: '14/11/2011', academicScore: 36, groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },

  // ===== TỔ 2 (8 học sinh • Điểm TB Lực Học: 34.50) =====
  { id: 'hs_10a3_24', code: '1805586434', fullName: 'Nguyễn Hoàng Gia Nguyên', dob: '06/01/2011', academicScore: 38, groupNumber: 2, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_08', code: '1702997106', fullName: 'Ngô Thị Diễm Hằng', dob: '18/11/2011', academicScore: 37, groupNumber: 2, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_38', code: '1704784854', fullName: 'Nguyễn Thị Thanh Tuyền', dob: '12/01/2011', academicScore: 31, groupNumber: 2, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_06', code: '1702759605', fullName: 'Trương Nguyễn Trường Giang', dob: '01/05/2011', academicScore: 35, groupNumber: 2, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_02', code: '1704683664', fullName: 'Nguyễn Thị Kim Bơ', dob: '10/08/2011', academicScore: 33, groupNumber: 2, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_25', code: '1702780397', fullName: 'Võ Thị Yến Nhi', dob: '16/04/2011', academicScore: 34, groupNumber: 2, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_03', code: '1805425255', fullName: 'Từ Diệu Yên Diễm', dob: '13/05/2011', academicScore: 33, groupNumber: 2, role: 'Lớp phó', isSpecialSupport: false },
  { id: 'hs_10a3_41', code: '1701472685', fullName: 'Lê Gia Vũ', dob: '08/03/2011', academicScore: 35, groupNumber: 2, role: 'Thành viên', isSpecialSupport: false },

  // ===== TỔ 3 (8 học sinh • Điểm TB Lực Học: 34.62) =====
  { id: 'hs_10a3_10', code: '1703554565', fullName: 'Trần Bảo Phi Hoàng', dob: '16/12/2011', academicScore: 39, groupNumber: 3, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_01', code: '1702997113', fullName: 'Phan Thị Ngọc Ẩn', dob: '09/04/2011', academicScore: 35, groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_33', code: '1703412028', fullName: 'Đỗ Quốc Thành', dob: '19/08/2011', academicScore: 35, groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_07', code: '1702780386', fullName: 'Tạ Thanh Ngọc Giàu', dob: '13/02/2011', academicScore: 26, groupNumber: 3, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_05', code: '2201723937', fullName: 'Trần Hữu Đồng', dob: '01/03/2011', academicScore: 33, groupNumber: 3, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_04', code: '1703398860', fullName: 'Võ Ngọc Mỹ Duyên', dob: '30/01/2011', academicScore: 37, groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_36', code: '1701981797', fullName: 'Lê Thị Kim Trúc', dob: '25/08/2011', academicScore: 34, groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_19', code: '1704303580', fullName: 'Bùi Nguyễn Hoàng Long', dob: '30/10/2011', academicScore: 38, groupNumber: 3, role: 'Sao đỏ', isSpecialSupport: false },

  // ===== TỔ 4 (7 học sinh • Điểm TB Lực Học: 34.71) =====
  { id: 'hs_10a3_35', code: '1703919858', fullName: 'Nguyễn Ngọc Trinh', dob: '18/04/2011', academicScore: 29, groupNumber: 4, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_14', code: '1704379491', fullName: 'Nguyễn Vinh Khang', dob: '16/10/2011', academicScore: 35, groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_39', code: '1702759627', fullName: 'Nguyễn Thị Thanh Tuyền', dob: '14/06/2011', academicScore: 38, groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_15', code: '1704121058', fullName: 'Võ Quốc Duy Khôi', dob: '06/07/2011', academicScore: 35, groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_22', code: '1701941028', fullName: 'Nguyễn Hữu Đan Mạch', dob: '01/01/2011', academicScore: 39, groupNumber: 4, role: 'Cán sự Toán', isSpecialSupport: false },
  { id: 'hs_10a3_34', code: '1704831627', fullName: 'Nguyễn Ngọc Anh Thư', dob: '24/10/2011', academicScore: 29, groupNumber: 4, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_29', code: '1702716688', fullName: 'Nguyễn Xuân Phúc', dob: '23/11/2011', academicScore: 38, groupNumber: 4, role: 'Cán sự Sinh', isSpecialSupport: false },

  // ===== TỔ 5 (7 học sinh • Điểm TB Lực Học: 34.57) =====
  { id: 'hs_10a3_27', code: '1702997079', fullName: 'Trần Lê Hồng Nhung', dob: '20/10/2011', academicScore: 36, groupNumber: 5, role: 'Lớp trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_42', code: '1702780409', fullName: 'Lê Văn Vũ', dob: '03/01/2011', academicScore: 39, groupNumber: 5, role: 'Cán sự Lý', isSpecialSupport: false },
  { id: 'hs_10a3_09', code: '1701980221', fullName: 'Nguyễn Vinh Hoa', dob: '15/07/2011', academicScore: 37, groupNumber: 5, role: 'Bí thư', isSpecialSupport: false },
  { id: 'hs_10a3_18', code: '1702780393', fullName: 'Nguyễn Đỗ Kim Yến Linh', dob: '19/06/2011', academicScore: 37, groupNumber: 5, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_31', code: '1704684848', fullName: 'Hoàng Thế Tài', dob: '04/10/2011', academicScore: 35, groupNumber: 5, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_12', code: '1701384874', fullName: 'Đỗ Tuấn Hưng', dob: '17/06/2011', academicScore: 29, groupNumber: 5, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_40', code: '1803521194', fullName: 'Trần Phúc Vinh', dob: '06/09/2011', academicScore: 29, groupNumber: 5, role: 'Thành viên', isSpecialSupport: true },

  // ===== TỔ 6 (7 học sinh • Điểm TB Lực Học: 34.57) =====
  { id: 'hs_10a3_23', code: '1704684195', fullName: 'Trương Thị Mỹ Ngân', dob: '23/02/2011', academicScore: 38, groupNumber: 6, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_21', code: '1703805924', fullName: 'Trần Minh Luân', dob: '25/12/2011', academicScore: 38, groupNumber: 6, role: 'Cán sự Hóa', isSpecialSupport: false },
  { id: 'hs_10a3_17', code: '1702780666', fullName: 'Lê Thị Mỹ Linh', dob: '15/10/2011', academicScore: 36, groupNumber: 6, role: 'Cán sự Văn', isSpecialSupport: false },
  { id: 'hs_10a3_13', code: '1701502384', fullName: 'Lê Minh Khải', dob: '25/06/2011', academicScore: 37, groupNumber: 6, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_45', code: '1703509575', fullName: 'Đỗ Khôi Vỹ', dob: '08/12/2011', academicScore: 36, groupNumber: 6, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_37', code: '1701981799', fullName: 'Võ Bách Tùng', dob: '19/08/2011', academicScore: 34, groupNumber: 6, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_11', code: '1701470035', fullName: 'Nguyễn Quốc Huy', dob: '19/09/2011', academicScore: 23, groupNumber: 6, role: 'Thành viên', isSpecialSupport: true }
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
  renderScoringStudentPills();
  renderStudentsTable();
  renderLogsTable();

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
    // [HÀNG 1: BÀN 1 GHÉP BÀN 2]
    {
      tableId: 'tbl_d1_t1',
      row: 1,
      groupNumber: 1,
      tableInGroup: 1,
      globalTable: 1,
      pairWithTable: 2,
      title: 'Bàn 1',
      subtitle: 'Ghép Bàn 2',
      leftSeat: { seatId: 'seat_r1_g1_t1_l', position: 'left', studentId: 'hs_10a3_43' }, // Dương Lục Yến Vy (Tổ trưởng - 34đ)
      rightSeat: { seatId: 'seat_r1_g1_t1_r', position: 'right', studentId: 'hs_10a3_20' } // Nguyễn Bảo Long (Hỗ trợ - 25đ) [Đôi bạn cùng tiến]
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
      leftSeat: { seatId: 'seat_r1_g1_t2_l', position: 'left', studentId: 'hs_10a3_26' }, // Cao Ngọc An Nhiên (Cán sự Anh - 39đ)
      rightSeat: { seatId: 'seat_r1_g1_t2_r', position: 'right', studentId: 'hs_10a3_44' } // Phạm Ngọc Tường Vy (Hỗ trợ - 34.5đ) [Đôi bạn cùng tiến]
    },
    // [HÀNG 2: BÀN 3 GHÉP BÀN 4]
    {
      tableId: 'tbl_d1_t3',
      row: 1,
      groupNumber: 1,
      tableInGroup: 3,
      globalTable: 3,
      pairWithTable: 4,
      title: 'Bàn 3',
      subtitle: 'Ghép Bàn 4',
      leftSeat: { seatId: 'seat_r1_g1_t3_l', position: 'left', studentId: 'hs_10a3_16' }, // Nguyễn Tấn Kỳ (Sao đỏ - 37đ)
      rightSeat: { seatId: 'seat_r1_g1_t3_r', position: 'right', studentId: 'hs_10a3_32' } // Lê Tuấn Phát Tài (34đ)
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
      leftSeat: { seatId: 'seat_r1_g1_t4_l', position: 'left', studentId: 'hs_10a3_30' }, // Trần Thị Ngọc Phúc (36đ)
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
      leftSeat: { seatId: 'seat_r1_g2_t1_l', position: 'left', studentId: 'hs_10a3_03' }, // Từ Diệu Yên Diễm (Lớp phó - 33đ)
      rightSeat: { seatId: 'seat_r1_g2_t1_r', position: 'right', studentId: 'hs_10a3_38' } // Nguyễn Thị Thanh Tuyền (12/01) (Hỗ trợ - 31đ) [Đôi bạn cùng tiến]
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
      leftSeat: { seatId: 'seat_r1_g2_t2_l', position: 'left', studentId: 'hs_10a3_24' }, // Nguyễn Hoàng Gia Nguyên (Tổ trưởng - 38đ)
      rightSeat: { seatId: 'seat_r1_g2_t2_r', position: 'right', studentId: 'hs_10a3_02' } // Nguyễn Thị Kim Bơ (Hỗ trợ - 33đ) [Đôi bạn cùng tiến]
    },
    // [HÀNG 4: BÀN 7 GHÉP BÀN 8]
    {
      tableId: 'tbl_d1_t7',
      row: 1,
      groupNumber: 2,
      tableInGroup: 3,
      globalTable: 7,
      pairWithTable: 8,
      title: 'Bàn 7',
      subtitle: 'Ghép Bàn 8',
      leftSeat: { seatId: 'seat_r1_g2_t3_l', position: 'left', studentId: 'hs_10a3_25' }, // Võ Thị Yến Nhi (Sao đỏ - 34đ)
      rightSeat: { seatId: 'seat_r1_g2_t3_r', position: 'right', studentId: 'hs_10a3_06' } // Trương Nguyễn Trường Giang (35đ)
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
      leftSeat: { seatId: 'seat_r1_g2_t4_l', position: 'left', studentId: 'hs_10a3_08' }, // Ngô Thị Diễm Hằng (37đ)
      rightSeat: { seatId: 'seat_r1_g2_t4_r', position: 'right', studentId: 'hs_10a3_41' } // Lê Gia Vũ (35đ)
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
      leftSeat: { seatId: 'seat_r1_g3_t1_l', position: 'left', studentId: 'hs_10a3_10' }, // Trần Bảo Phi Hoàng (Tổ trưởng - 39đ)
      rightSeat: { seatId: 'seat_r1_g3_t1_r', position: 'right', studentId: 'hs_10a3_07' } // Tạ Thanh Ngọc Giàu (Hỗ trợ - 26đ) [Đôi bạn cùng tiến]
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
      leftSeat: { seatId: 'seat_r1_g3_t2_l', position: 'left', studentId: 'hs_10a3_19' }, // Bùi Nguyễn Hoàng Long (Sao đỏ - 38đ)
      rightSeat: { seatId: 'seat_r1_g3_t2_r', position: 'right', studentId: 'hs_10a3_05' } // Trần Hữu Đồng (Hỗ trợ - 33đ) [Đôi bạn cùng tiến]
    },
    // [HÀNG 6: BÀN 11 GHÉP BÀN 12]
    {
      tableId: 'tbl_d1_t11',
      row: 1,
      groupNumber: 3,
      tableInGroup: 3,
      globalTable: 11,
      pairWithTable: 12,
      title: 'Bàn 11',
      subtitle: 'Ghép Bàn 12',
      leftSeat: { seatId: 'seat_r1_g3_t3_l', position: 'left', studentId: 'hs_10a3_01' }, // Phan Thị Ngọc Ẩn (35đ)
      rightSeat: { seatId: 'seat_r1_g3_t3_r', position: 'right', studentId: 'hs_10a3_04' } // Võ Ngọc Mỹ Duyên (37đ)
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
      leftSeat: { seatId: 'seat_r1_g3_t4_l', position: 'left', studentId: 'hs_10a3_33' }, // Đỗ Quốc Thành (35đ)
      rightSeat: { seatId: 'seat_r1_g3_t4_r', position: 'right', studentId: 'hs_10a3_36' } // Lê Thị Kim Trúc (34đ)
    },

    // ==================== DÃY 2 (Phía Cửa Ra Vào) - 12 BÀN (TỔ 4, 5, 6) ====================
    // --- TỔ 4 (Bàn 1 -> 4) ---
    // [HÀNG 1: BÀN 1 GHÉP BÀN 2]
    {
      tableId: 'tbl_d2_t1',
      row: 2,
      groupNumber: 4,
      tableInGroup: 1,
      globalTable: 1,
      pairWithTable: 2,
      title: 'Bàn 1',
      subtitle: 'Ghép Bàn 2',
      leftSeat: { seatId: 'seat_r2_g4_t1_l', position: 'left', studentId: 'hs_10a3_35' }, // Nguyễn Ngọc Trinh (Tổ trưởng - 29đ)
      rightSeat: { seatId: 'seat_r2_g4_t1_r', position: 'right', studentId: 'hs_10a3_34' } // Nguyễn Ngọc Anh Thư (Hỗ trợ - 29đ) [Đôi bạn cùng tiến]
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
      leftSeat: { seatId: 'seat_r2_g4_t2_l', position: 'left', studentId: 'hs_10a3_22' }, // Nguyễn Hữu Đan Mạch (CS Toán - 39đ)
      rightSeat: { seatId: 'seat_r2_g4_t2_r', position: 'right', studentId: 'hs_10a3_15' } // Võ Quốc Duy Khôi (35đ)
    },
    // [HÀNG 2: BÀN 3 GHÉP BÀN 4]
    {
      tableId: 'tbl_d2_t3',
      row: 2,
      groupNumber: 4,
      tableInGroup: 3,
      globalTable: 3,
      pairWithTable: 4,
      title: 'Bàn 3',
      subtitle: 'Ghép Bàn 4',
      leftSeat: { seatId: 'seat_r2_g4_t3_l', position: 'left', studentId: 'hs_10a3_29' }, // Nguyễn Xuân Phúc (CS Sinh - 38đ)
      rightSeat: { seatId: 'seat_r2_g4_t3_r', position: 'right', studentId: 'hs_10a3_14' } // Nguyễn Vinh Khang (35đ)
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
      leftSeat: { seatId: 'seat_r2_g4_t4_l', position: 'left', studentId: 'hs_10a3_39' }, // Nguyễn Thị Thanh Tuyền (14/06 - 38đ)
      rightSeat: { seatId: 'seat_r2_g4_t4_r', position: 'right', studentId: null } // Ghế trống dự phòng
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
      leftSeat: { seatId: 'seat_r2_g5_t1_l', position: 'left', studentId: 'hs_10a3_27' }, // Trần Lê Hồng Nhung (Lớp trưởng - 36đ)
      rightSeat: { seatId: 'seat_r2_g5_t1_r', position: 'right', studentId: 'hs_10a3_12' } // Đỗ Tuấn Hưng (Hỗ trợ - 29đ) [Đôi bạn cùng tiến]
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
      leftSeat: { seatId: 'seat_r2_g5_t2_l', position: 'left', studentId: 'hs_10a3_42' }, // Lê Văn Vũ (CS Lý - 39đ)
      rightSeat: { seatId: 'seat_r2_g5_t2_r', position: 'right', studentId: 'hs_10a3_40' } // Trần Phúc Vinh (Hỗ trợ - 29đ) [Đôi bạn cùng tiến]
    },
    // [HÀNG 4: BÀN 7 GHÉP BÀN 8]
    {
      tableId: 'tbl_d2_t7',
      row: 2,
      groupNumber: 5,
      tableInGroup: 3,
      globalTable: 7,
      pairWithTable: 8,
      title: 'Bàn 7',
      subtitle: 'Ghép Bàn 8',
      leftSeat: { seatId: 'seat_r2_g5_t3_l', position: 'left', studentId: 'hs_10a3_09' }, // Nguyễn Vinh Hoa (Bí thư - 37đ)
      rightSeat: { seatId: 'seat_r2_g5_t3_r', position: 'right', studentId: 'hs_10a3_18' } // Nguyễn Đỗ Kim Yến Linh (Sao đỏ - 37đ)
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
      leftSeat: { seatId: 'seat_r2_g5_t4_l', position: 'left', studentId: 'hs_10a3_31' }, // Hoàng Thế Tài (35đ)
      rightSeat: { seatId: 'seat_r2_g5_t4_r', position: 'right', studentId: null } // Ghế trống dự phòng
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
      leftSeat: { seatId: 'seat_r2_g6_t1_l', position: 'left', studentId: 'hs_10a3_23' }, // Trương Thị Mỹ Ngân (Tổ trưởng - 38đ)
      rightSeat: { seatId: 'seat_r2_g6_t1_r', position: 'right', studentId: 'hs_10a3_11' } // Nguyễn Quốc Huy (Hỗ trợ - 23đ) [Đôi bạn cùng tiến]
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
      leftSeat: { seatId: 'seat_r2_g6_t2_l', position: 'left', studentId: 'hs_10a3_21' }, // Trần Minh Luân (CS Hóa - 38đ)
      rightSeat: { seatId: 'seat_r2_g6_t2_r', position: 'right', studentId: 'hs_10a3_37' } // Võ Bách Tùng (34đ)
    },
    // [HÀNG 6: BÀN 11 GHÉP BÀN 12]
    {
      tableId: 'tbl_d2_t11',
      row: 2,
      groupNumber: 6,
      tableInGroup: 3,
      globalTable: 11,
      pairWithTable: 12,
      title: 'Bàn 11',
      subtitle: 'Ghép Bàn 12',
      leftSeat: { seatId: 'seat_r2_g6_t3_l', position: 'left', studentId: 'hs_10a3_17' }, // Lê Thị Mỹ Linh (CS Văn - 36đ)
      rightSeat: { seatId: 'seat_r2_g6_t3_r', position: 'right', studentId: 'hs_10a3_13' } // Lê Minh Khải (Sao đỏ - 37đ)
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
      leftSeat: { seatId: 'seat_r2_g6_t4_l', position: 'left', studentId: 'hs_10a3_45' }, // Đỗ Khôi Vỹ (Sao đỏ - 36đ)
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

  // Render 6 tổ: Mỗi tổ có 4 bàn, GHÉP ĐÔI thành 2 Cụm Bàn Ghép (Mỗi cụm gồm 2 bàn kê sát nhau = 4 học sinh)
  for (let g = 1; g <= 6; g++) {
    const container = document.getElementById(`group-${g}-tables`);
    if (!container) continue;

    const groupTables = appState.seating.filter(t => t.groupNumber === g);
    container.innerHTML = '';

    // CỤM 1: Bàn 1 ghép Bàn 2 (hoặc Bàn 5 ghép Bàn 6, Bàn 9 ghép Bàn 10)
    if (groupTables.length >= 2) {
      const pair1El = renderPairedDesksCluster(groupTables[0], groupTables[1], g);
      container.appendChild(pair1El);
    }

    // CỤM 2: Bàn 3 ghép Bàn 4 (hoặc Bàn 7 ghép Bàn 8, Bàn 11 ghép Bàn 12)
    if (groupTables.length >= 4) {
      const pair2El = renderPairedDesksCluster(groupTables[2], groupTables[3], g);
      container.appendChild(pair2El);
    }
  }

  // Áp dụng bộ lọc hoặc tìm kiếm nếu có
  applySeatingFilters();
}

/**
 * Tạo phần tử DOM cho 1 Cụm Bàn Ghép (2 bàn kê ghép sát nhau: Bàn 1 + Bàn 2; Bàn 3 + Bàn 4...)
 */
function renderPairedDesksCluster(table1, table2, groupNumber) {
  // Cụm 2 bàn ghép lại: Tạo thành 1 hàng bàn sạch sẽ, không có chữ tiêu đề thừa
  const cluster = document.createElement('div');
  cluster.className = 'paired-desk-cluster bg-white p-2 sm:p-2.5 rounded-2xl border-2 border-slate-200 hover:border-teal-400 transition shadow-xs';

  // Lưới chứa 2 bàn ghép sát nhau (Bàn 1 bên trái, Bàn 2 bên phải)
  const desksGrid = document.createElement('div');
  desksGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch';

  const desk1 = renderDeskElement(table1);
  const desk2 = renderDeskElement(table2);

  desksGrid.appendChild(desk1);
  desksGrid.appendChild(desk2);
  cluster.appendChild(desksGrid);

  return cluster;
}

/**
 * Tạo phần tử DOM cho 1 bàn học (gồm 2 chỗ ngồi, chỉ để lại tên học sinh)
 */
function renderDeskElement(table) {
  const desk = document.createElement('div');
  desk.className = 'classroom-desk bg-slate-50/70 p-1.5 rounded-xl border border-slate-200 flex flex-col justify-center';
  desk.id = table.tableId;

  // 2 chỗ ngồi
  const seatsContainer = document.createElement('div');
  seatsContainer.className = 'grid grid-cols-2 gap-1.5';

  const leftSeatEl = renderSeatSlot(table, table.leftSeat);
  const rightSeatEl = renderSeatSlot(table, table.rightSeat);

  seatsContainer.appendChild(leftSeatEl);
  seatsContainer.appendChild(rightSeatEl);
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

  // Chức danh nhỏ gọn
  let roleBadgeHtml = '';
  if (student.role === 'Lớp trưởng') {
    roleBadgeHtml = '<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-lead">LT</span>';
  } else if (student.role === 'Lớp phó') {
    roleBadgeHtml = '<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-deputy">LP</span>';
  } else if (student.role === 'Bí thư') {
    roleBadgeHtml = '<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-sec">BT</span>';
  } else if (student.role === 'Tổ trưởng') {
    roleBadgeHtml = '<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-group">TT</span>';
  } else if (student.role === 'Sao đỏ') {
    roleBadgeHtml = '<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-redstar">SĐ</span>';
  } else if (student.role && student.role.startsWith('Cán sự')) {
    roleBadgeHtml = `<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-teal-50 text-teal-700 border border-teal-200">${student.role.replace('Cán sự ', 'CS ')}</span>`;
  }

  const peerBadgeHtml = student.isSpecialSupport ? 
    '<span class="text-[9px] text-amber-600 font-bold ml-1" title="Diện kèm cặp">🤝</span>' : '';

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
  if (!appState.activeModalSeat) return;
  const { studentId, seatId } = appState.activeModalSeat;
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

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
      matchFilter = ['Lớp trưởng', 'Lớp phó', 'Bí thư', 'Tổ trưởng', 'Sao đỏ'].includes(student.role) || (student.role && student.role.startsWith('Cán sự'));
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
    if (!student) return '';
    let roleStr = '';
    if (student.role === 'Lớp trưởng') roleStr = ' (LT)';
    else if (student.role === 'Lớp phó') roleStr = ' (LP)';
    else if (student.role === 'Bí thư') roleStr = ' (BT)';
    else if (student.role === 'Tổ trưởng') roleStr = ' (TT)';
    else if (student.role === 'Sao đỏ') roleStr = ' (SĐ)';
    else if (student.role && student.role.startsWith('Cán sự')) {
      roleStr = ` (${student.role.replace('Cán sự ', 'CS ')})`;
    }
    const htStr = student.isSpecialSupport ? ' 🤝' : '';
    return `${roleStr}${htStr}`;
  };

  // Ô ghế ngồi: Nếu ghế trống, để trắng hoàn toàn (không in chữ "(Trống)")
  const renderPrintSeat = (seat) => {
    if (!seat || !seat.studentId) {
      return `<div class="print-seat-cell flex items-center justify-center p-1 border border-slate-300 min-h-[32px] rounded bg-white"></div>`;
    }
    const student = appState.students.find(s => s.id === seat.studentId);
    if (!student) {
      return `<div class="print-seat-cell flex items-center justify-center p-1 border border-slate-300 min-h-[32px] rounded bg-white"></div>`;
    }
    const roleTag = getStudentRoleTag(student);
    return `
      <div class="print-seat-cell flex flex-col justify-center items-center text-center p-1 border border-black min-h-[32px] rounded bg-white">
        <span class="font-bold text-[11px] leading-tight text-black">${student.fullName}${roleTag ? `<span class="text-[9px] text-blue-900 font-semibold">${roleTag}</span>` : ''}</span>
      </div>
    `;
  };

  const renderPrintCluster = (table1, table2) => {
    return `
      <div class="grid grid-cols-4 gap-1.5 w-full">
        ${renderPrintSeat(table1.leftSeat)}
        ${renderPrintSeat(table1.rightSeat)}
        ${renderPrintSeat(table2.leftSeat)}
        ${renderPrintSeat(table2.rightSeat)}
      </div>
    `;
  };

  // Hộp Tổ: Chỉ hiển thị tên Tổ (TỔ 1, TỔ 2...), bỏ các dòng chữ (Bàn 1 + 2...) và (8 HS / 7 HS + 1 Trống)
  const renderPrintGroup = (gNum, groupTitle) => {
    const groupTables = appState.seating.filter(t => t.groupNumber === gNum);
    if (groupTables.length < 4) return '';
    return `
      <div class="border border-slate-400 rounded p-1.5 bg-white space-y-1">
        <div class="text-[11px] font-bold border-b border-slate-300 pb-0.5 text-black uppercase tracking-wide">
          ${groupTitle}
        </div>
        <!-- Hàng 1 -->
        ${renderPrintCluster(groupTables[0], groupTables[1])}
        <!-- Hàng 2 -->
        ${renderPrintCluster(groupTables[2], groupTables[3])}
      </div>
    `;
  };

  return `
    <div class="print-page-box bg-white text-black font-sans text-[11px] leading-tight w-full max-w-[280mm] mx-auto p-2">
      <!-- QUỐC HIỆU & TIÊU NGỮ -->
      <div class="grid grid-cols-12 items-start pb-1 border-b-2 border-black mb-1.5">
        <div class="col-span-5 text-center">
          <p class="text-[10px] uppercase font-bold text-slate-700">SỞ GD&ĐT LÂM ĐỒNG</p>
          <p class="text-[11px] uppercase font-bold text-black tracking-wide">TRƯỜNG THPT BÙI THỊ XUÂN - MŨI NÉ</p>
        </div>
        <div class="col-span-7 text-center">
          <p class="text-[11px] uppercase font-bold text-black tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p class="text-[10px] italic font-semibold text-slate-800">Độc lập &mdash; Tự do &mdash; Hạnh phúc</p>
        </div>
      </div>

      <!-- TIÊU ĐỀ SƠ ĐỒ LỚP: Gọn gàng, trang trọng -->
      <div class="text-center my-1">
        <h1 class="text-base font-black tracking-wider uppercase text-black">
          SƠ ĐỒ CHỖ NGỒI HỌC SINH &mdash; LỚP 10A3
        </h1>
        <p class="text-[10px] italic text-slate-700">
          Năm học: 2026 - 2027 &bull; Sĩ số: 45 học sinh
        </p>
      </div>

      <!-- PHÍA TRƯỚC LỚP HỌC: BÀN GV & BẢNG ĐEN -->
      <div class="grid grid-cols-12 gap-2 items-center my-1 py-1 px-2 border border-black rounded bg-slate-100 text-center text-[10px]">
        <div class="col-span-3 border border-black bg-white py-0.5 rounded font-bold">
          [ BÀN GIÁO VIÊN ]
        </div>
        <div class="col-span-6 bg-slate-800 text-white py-0.5 rounded font-bold uppercase tracking-wider">
          BẢNG ĐEN LỚP 10A3 ("Tiên Học Lễ &mdash; Hậu Học Văn")
        </div>
        <div class="col-span-3 border border-black bg-white py-0.5 rounded font-bold">
          [ CỬA CHÍNH RA VÀO ]
        </div>
      </div>

      <!-- LƯỚI 2 DÃY BÀN HỌC ĐẶT SONG SONG -->
      <div class="grid grid-cols-12 gap-2 items-start my-1.5">
        <!-- DÃY 1: TỔ 1, TỔ 2, TỔ 3 (BÊN TRÁI - PHÍA CỬA SỔ) -->
        <div class="col-span-6 space-y-1.5">
          <div class="text-center font-bold text-[10px] bg-slate-200 py-0.5 border border-slate-400 rounded uppercase">
            DÃY 1 (PHÍA CỬA SỔ)
          </div>
          ${renderPrintGroup(1, 'TỔ 1')}
          ${renderPrintGroup(2, 'TỔ 2')}
          ${renderPrintGroup(3, 'TỔ 3')}
        </div>

        <!-- DÃY 2: TỔ 4, TỔ 5, TỔ 6 (BÊN PHẢI - PHÍA CỬA RA VÀO) -->
        <div class="col-span-6 space-y-1.5">
          <div class="text-center font-bold text-[10px] bg-slate-200 py-0.5 border border-slate-400 rounded uppercase">
            DÃY 2 (PHÍA CỬA RA VÀO)
          </div>
          ${renderPrintGroup(4, 'TỔ 4')}
          ${renderPrintGroup(5, 'TỔ 5')}
          ${renderPrintGroup(6, 'TỔ 6')}
        </div>
      </div>

      <!-- GHI CHÚ VÀ CHỮ KÝ GVCN -->
      <div class="grid grid-cols-12 pt-1 border-t border-slate-300 mt-1 items-end text-[10px]">
        <div class="col-span-7 italic text-slate-700">
          <p><strong>* Ghi chú chức danh:</strong> (LT): Lớp trưởng; (LP): Lớp phó; (BT): Bí thư; (TT): Tổ trưởng; (SĐ): Sao đỏ; (CS): Cán sự bộ môn; (🤝): Diện kèm cặp.</p>
        </div>
        <div class="col-span-5 text-center">
          <p class="italic text-[10px]">Mũi Né, ngày ... tháng ... năm 2026</p>
          <p class="font-bold text-[11px] uppercase mt-0.5">GIÁO VIÊN CHỦ NHIỆM</p>
          <p class="text-[9px] italic text-slate-500 mt-6">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  `;
}

function openPrintPreviewModal() {
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

