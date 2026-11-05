'use strict';

/**
 * DASHBOARD QUẢN TRỊ LỚP HỌC TỰ QUẢN 10A3
 * Kiến trúc: Vanilla JavaScript ES6+, Strict Mode, LocalStorage Persistence
 */

// ==================== HẰNG SỐ & CẤU HÌNH QUY CHẾ ====================
const STORAGE_KEYS = {
  STUDENTS: 'dashboard10a3_official_students_v3',
  LOGS: 'dashboard10a3_official_logs_v3'
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
  }
};

// ==================== KHỞI TẠO HỆ THỐNG ====================
document.addEventListener('DOMContentLoaded', () => {
  initDateInputs();
  renderRuleButtons();
  loadDataFromStorage();

  // Đảm bảo luôn sử dụng đúng danh sách chính thức 45 học sinh Trường THPT Bùi Thị Xuân - Mũi Né
  const hasOfficialRoster = appState.students.length === 45 && 
                            appState.students.some(s => s.code === '1702997113' && s.fullName === 'Phan Thị Ngọc Ẩn');
  if (!hasOfficialRoster) {
    injectOfficial45Students(false);
  }

  // Kiểm tra URL hash (vd: #scoring, #students) để mở tab tương ứng
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['dashboard', 'scoring', 'students', 'logs', 'backup'].includes(initialHash)) {
    switchTab(initialHash);
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
    logs: document.getElementById('section-logs'),
    backup: document.getElementById('section-backup')
  };

  const navButtons = {
    dashboard: document.getElementById('nav-dashboard'),
    scoring: document.getElementById('nav-scoring'),
    students: document.getElementById('nav-students'),
    logs: document.getElementById('nav-logs'),
    backup: document.getElementById('nav-backup')
  };

  const titles = {
    dashboard: 'Bảng Điều Khiển Tổng Quan Thi Đua Lớp 10A3',
    scoring: 'Phiếu Ghi Nhận Điểm Thi Đua Tự Quản (Ban Cán Sự / Sao Đỏ)',
    students: 'Danh Sách & Quản Trị Học Sinh Lớp 10A3',
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

  const filtered = appState.students.filter(s => {
    const matchName = s.fullName.toLowerCase().includes(searchKeyword);
    const matchGroup = filterGroup === 'all' || Number(s.groupNumber) === Number(filterGroup);
    let matchSpecial = true;
    if (filterSpecial === 'special') matchSpecial = s.isSpecialSupport === true;
    if (filterSpecial === 'normal') matchSpecial = !s.isSpecialSupport;
    return matchName && matchGroup && matchSpecial;
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
    case 'Bí thư':
      return `<span class="badge-role-sec px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-flag mr-1"></i>Bí thư</span>`;
    case 'Tổ trưởng':
      return `<span class="badge-role-group px-2.5 py-0.5 rounded-full text-xs font-bold"><i class="fa-solid fa-sitemap mr-1"></i>Tổ trưởng</span>`;
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
  document.getElementById('detail-student-meta').textContent = `Tổ ${stu.groupNumber} • ${stu.role}${stu.code ? ` • Mã: ${stu.code}` : ''}${stu.dob ? ` • NS: ${stu.dob}` : ''}${stu.isSpecialSupport ? ' • [Cần hỗ trợ đặc biệt]' : ''}`;
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
const OFFICIAL_10A3_STUDENTS = [
  // Tổ 1 (8 học sinh, 2 diện hỗ trợ)
  { id: 'hs_10a3_01', code: '1702997113', fullName: 'Phan Thị Ngọc Ẩn', dob: '09/04/2011', groupNumber: 1, role: 'Lớp trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_02', code: '1704683664', fullName: 'Nguyễn Thị Kim Bơ', dob: '10/08/2011', groupNumber: 1, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_03', code: '1805425255', fullName: 'Từ Diệu Yên Diễm', dob: '13/05/2011', groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_04', code: '1703398860', fullName: 'Võ Ngọc Mỹ Duyên', dob: '30/01/2011', groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_05', code: '2201723937', fullName: 'Trần Hữu Đồng', dob: '01/03/2011', groupNumber: 1, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_06', code: '1702759605', fullName: 'Trương Nguyễn Trường Giang', dob: '01/05/2011', groupNumber: 1, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_07', code: '1702780386', fullName: 'Tạ Thanh Ngọc Giàu', dob: '13/02/2011', groupNumber: 1, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_08', code: '1702997106', fullName: 'Ngô Thị Diễm Hằng', dob: '18/11/2011', groupNumber: 1, role: 'Thành viên', isSpecialSupport: false },

  // Tổ 2 (8 học sinh, 2 diện hỗ trợ)
  { id: 'hs_10a3_09', code: '1701980221', fullName: 'Nguyễn Vinh Hoa', dob: '15/07/2011', groupNumber: 2, role: 'Bí thư', isSpecialSupport: false },
  { id: 'hs_10a3_10', code: '1703554565', fullName: 'Trần Bảo Phi Hoàng', dob: '16/12/2011', groupNumber: 2, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_11', code: '1701470035', fullName: 'Nguyễn Quốc Huy', dob: '19/09/2011', groupNumber: 2, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_12', code: '1701384874', fullName: 'Đỗ Tuấn Hưng', dob: '17/06/2011', groupNumber: 2, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_13', code: '1701502384', fullName: 'Lê Minh Khải', dob: '25/06/2011', groupNumber: 2, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_14', code: '1704379491', fullName: 'Nguyễn Vinh Khang', dob: '16/10/2011', groupNumber: 2, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_15', code: '1704121058', fullName: 'Võ Quốc Duy Khôi', dob: '06/07/2011', groupNumber: 2, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_16', code: '1701502268', fullName: 'Nguyễn Tấn Kỳ', dob: '26/12/2011', groupNumber: 2, role: 'Thành viên', isSpecialSupport: false },

  // Tổ 3 (8 học sinh, 1 diện hỗ trợ)
  { id: 'hs_10a3_17', code: '1702780666', fullName: 'Lê Thị Mỹ Linh', dob: '15/10/2011', groupNumber: 3, role: 'Lớp phó Học tập', isSpecialSupport: false },
  { id: 'hs_10a3_18', code: '1702780393', fullName: 'Nguyễn Đỗ Kim Yến Linh', dob: '19/06/2011', groupNumber: 3, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_19', code: '1704303580', fullName: 'Bùi Nguyễn Hoàng Long', dob: '30/10/2011', groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_20', code: '1702880874', fullName: 'Nguyễn Bảo Long', dob: '24/04/2011', groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_21', code: '1703805924', fullName: 'Trần Minh Luân', dob: '25/12/2011', groupNumber: 3, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_22', code: '1701941028', fullName: 'Nguyễn Hữu Đan Mạch', dob: '01/01/2011', groupNumber: 3, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_23', code: '1704684195', fullName: 'Trương Thị Mỹ Ngân', dob: '23/02/2011', groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_24', code: '1805586434', fullName: 'Nguyễn Hoàng Gia Nguyên', dob: '06/01/2011', groupNumber: 3, role: 'Thành viên', isSpecialSupport: false },

  // Tổ 4 (7 học sinh, 2 diện hỗ trợ)
  { id: 'hs_10a3_25', code: '1702780397', fullName: 'Võ Thị Yến Nhi', dob: '16/04/2011', groupNumber: 4, role: 'Lớp phó Lao động', isSpecialSupport: false },
  { id: 'hs_10a3_26', code: '1703554579', fullName: 'Cao Ngọc An Nhiên', dob: '14/12/2011', groupNumber: 4, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_27', code: '1702997079', fullName: 'Trần Lê Hồng Nhung', dob: '20/10/2011', groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_28', code: '1805586438', fullName: 'Võ Thành Phát', dob: '14/11/2011', groupNumber: 4, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_29', code: '1702716688', fullName: 'Nguyễn Xuân Phúc', dob: '23/11/2011', groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_30', code: '1701941035', fullName: 'Trần Thị Ngọc Phúc', dob: '09/09/2011', groupNumber: 4, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_31', code: '1704684848', fullName: 'Hoàng Thế Tài', dob: '04/10/2011', groupNumber: 4, role: 'Thành viên', isSpecialSupport: false },

  // Tổ 5 (7 học sinh, 1 diện hỗ trợ)
  { id: 'hs_10a3_32', code: '1704379981', fullName: 'Lê Tuấn Phát Tài', dob: '17/07/2011', groupNumber: 5, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_33', code: '1703412028', fullName: 'Đỗ Quốc Thành', dob: '19/08/2011', groupNumber: 5, role: 'Sao đỏ', isSpecialSupport: false },
  { id: 'hs_10a3_34', code: '1704831627', fullName: 'Nguyễn Ngọc Anh Thư', dob: '24/10/2011', groupNumber: 5, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_35', code: '1703919858', fullName: 'Nguyễn Ngọc Trinh', dob: '18/04/2011', groupNumber: 5, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_36', code: '1701981797', fullName: 'Lê Thị Kim Trúc', dob: '25/08/2011', groupNumber: 5, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_37', code: '1701981799', fullName: 'Võ Bách Tùng', dob: '19/08/2011', groupNumber: 5, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_38', code: '1704784854', fullName: 'Nguyễn Thị Thanh Tuyền', dob: '12/01/2011', groupNumber: 5, role: 'Thành viên', isSpecialSupport: false },

  // Tổ 6 (7 học sinh, 2 diện hỗ trợ)
  { id: 'hs_10a3_39', code: '1702759627', fullName: 'Nguyễn Thị Thanh Tuyền', dob: '14/06/2011', groupNumber: 6, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_40', code: '1803521194', fullName: 'Trần Phúc Vinh', dob: '06/09/2011', groupNumber: 6, role: 'Tổ trưởng', isSpecialSupport: false },
  { id: 'hs_10a3_41', code: '1701472685', fullName: 'Lê Gia Vũ', dob: '08/03/2011', groupNumber: 6, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_42', code: '1702780409', fullName: 'Lê Văn Vũ', dob: '03/01/2011', groupNumber: 6, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_43', code: '1704246671', fullName: 'Dương Lục Yến Vy', dob: '24/09/2011', groupNumber: 6, role: 'Thành viên', isSpecialSupport: false },
  { id: 'hs_10a3_44', code: '2511977424', fullName: 'Phạm Ngọc Tường Vy', dob: '01/08/2010', groupNumber: 6, role: 'Thành viên', isSpecialSupport: true },
  { id: 'hs_10a3_45', code: '1703509575', fullName: 'Đỗ Khôi Vỹ', dob: '08/12/2011', groupNumber: 6, role: 'Thành viên', isSpecialSupport: false }
];

// Khởi tạo toàn bộ 45 học sinh lớp 10A3 chuẩn
function injectFull45StudentsPrompt() {
  if (confirm('Thao tác này sẽ tải danh sách chính thức 45 học sinh Lớp 10A3 Trường THPT Bùi Thị Xuân - Mũi Né (chia đều 6 tổ, 10 em diện theo dõi đặc biệt). Tiếp tục?')) {
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
  } catch (e) {}

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const sampleLogs = [
    // Lớp trưởng Phan Thị Ngọc Ẩn hoàn thành xuất sắc
    { id: 'log_01', date: today, studentId: 'hs_10a3_01', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'Cán sự làm tốt nhiệm vụ tháng', pointsChanged: 20, recordedBy: 'GVCN', note: 'Quản lý 15 phút đầu giờ nghiêm túc', timestamp: Date.now() - 1000 },
    // Bí thư Nguyễn Vinh Hoa kèm bạn yếu Toán
    { id: 'log_02', date: today, studentId: 'hs_10a3_09', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'Kèm bạn yếu Toán/Lý (+10 cho cả hai)', pointsChanged: 10, recordedBy: 'Lớp trưởng', note: 'Kèm bạn Trương Nguyễn Trường Giang', timestamp: Date.now() - 2000 },
    // Trương Nguyễn Trường Giang (diện hỗ trợ) được cộng điểm kèm và nỗ lực
    { id: 'log_03', date: today, studentId: 'hs_10a3_06', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'Kèm bạn yếu Toán/Lý (+10 cho cả hai)', pointsChanged: 10, recordedBy: 'Lớp trưởng', note: 'Học nhóm tiến bộ cùng bạn Hoa', timestamp: Date.now() - 3000 },
    { id: 'log_04', date: yesterday, studentId: 'hs_10a3_06', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Học sinh yếu có nỗ lực làm bài', pointsChanged: 10, recordedBy: 'GV Bộ môn Toán', note: 'Chủ động lên chữa bài tập về nhà', timestamp: Date.now() - 4000 },
    // Nguyễn Đỗ Kim Yến Linh (Tổ trưởng 3)
    { id: 'log_05', date: today, studentId: 'hs_10a3_18', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong lên bảng đúng', pointsChanged: 10, recordedBy: 'Sao đỏ Tổ 2', note: 'Tiết Hóa học', timestamp: Date.now() - 5000 },
    // Nguyễn Quốc Huy (diện hỗ trợ) vi phạm và nỗ lực gỡ điểm
    { id: 'log_06', date: yesterday, studentId: 'hs_10a3_11', type: 'violation', ruleKey: 'viol_no_homework', ruleLabel: 'Không làm bài / không học bài', pointsChanged: -10, recordedBy: 'Sao đỏ Tổ 4', note: 'Thiếu bài tập Tiếng Anh', timestamp: Date.now() - 6000 },
    { id: 'log_07', date: today, studentId: 'hs_10a3_11', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Học sinh yếu có nỗ lực làm bài', pointsChanged: 10, recordedBy: 'GVCN', note: 'Làm lại đầy đủ bài tập bù', timestamp: Date.now() - 7000 },
    // Võ Thành Phát (diện hỗ trợ) đi muộn
    { id: 'log_08', date: today, studentId: 'hs_10a3_28', type: 'violation', ruleKey: 'viol_late_uniform', ruleLabel: 'Đi muộn / sai đồng phục', pointsChanged: -5, recordedBy: 'Sao đỏ trực cổng', note: 'Muộn 10 phút tiết 1', timestamp: Date.now() - 8000 }
  ];

  // Nhân bản dữ liệu để tránh xung đột
  appState.students = JSON.parse(JSON.stringify(OFFICIAL_10A3_STUDENTS));
  appState.dailyLogs = sampleLogs;
  saveDataToStorage();
  refreshAllUI();

  if (notify) {
    showToast('Đã nạp chính thức danh sách 45 học sinh THPT Bùi Thị Xuân - Mũi Né!', 'success');
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
