'use strict';

/**
 * DASHBOARD QUß║óN TRß╗è Lß╗ÜP Hß╗îC Tß╗░ QUß║óN 10A3
 * Kiß║┐n tr├║c: Vanilla JavaScript ES6+, Strict Mode, LocalStorage Persistence
 */

// ==================== Hß║░NG Sß╗É & Cß║ñU H├îNH QUY CHß║╛ ====================
const STORAGE_KEYS = {
  STUDENTS: 'dashboard10a3_official_45_students_v41_17h',
  LOGS: 'dashboard10a3_official_45_logs_v10',
  LOCKED_WEEKS: 'dashboard10a3_locked_weeks_v4',
  CURRENT_ROLE: 'dashboard10a3_current_role_v2',
  AUTH_ROLES: 'dashboard10a3_authenticated_roles_v1',
  SEATING: 'dashboard10a3_official_45_seating_v41_17h'
};

const DEFAULT_PINS = {
  gvcn: '1030',   // M├ú PIN GVCN: 1030 (To├án quyß╗ün quß║ún trß╗ï & reset ─æiß╗âm)
  cadre: '10a3'   // M├ú PIN C├ín sß╗▒: 10a3 (Lß╗¢p tr╞░ß╗ƒng & 6 Tß╗ò tr╞░ß╗ƒng ─æ╞░ß╗úc quyß╗ün chß║Ñm ─æiß╗âm)
};

// ==================== Hß╗å THß╗ÉNG PH├éN QUYß╗ÇN VAI TR├Æ (RBAC) ====================
const ROLES = {
  gvcn: { id: 'gvcn', label: '≡ƒææ GVCN Lß╗¢p 10A3', canScore: true, canLock: true, canReset: true, allowedGroups: 'all' },
  monitor: { id: 'monitor', label: '≡ƒÄû∩╕Å Lß╗¢p tr╞░ß╗ƒng (Hß╗ông Nhung)', canScore: true, canLock: false, canReset: false, allowedGroups: 'all' },
  lead_t1: { id: 'lead_t1', label: '≡ƒæñ Tß╗ò tr╞░ß╗ƒng T1 (Yß║┐n Vy)', canScore: true, canLock: false, canReset: false, allowedGroups: [1] },
  lead_t2: { id: 'lead_t2', label: '≡ƒæñ Tß╗ò tr╞░ß╗ƒng T2 (Gia Nguy├¬n)', canScore: true, canLock: false, canReset: false, allowedGroups: [2] },
  lead_t3: { id: 'lead_t3', label: '≡ƒæñ Tß╗ò tr╞░ß╗ƒng T3 (Kim Tr├║c)', canScore: true, canLock: false, canReset: false, allowedGroups: [3] },
  lead_t4: { id: 'lead_t4', label: '≡ƒæñ Tß╗ò tr╞░ß╗ƒng T4 (Duy Kh├┤i)', canScore: true, canLock: false, canReset: false, allowedGroups: [4] },
  lead_t5: { id: 'lead_t5', label: '≡ƒæñ Tß╗ò tr╞░ß╗ƒng T5 (Ngß╗ìc Trinh)', canScore: true, canLock: false, canReset: false, allowedGroups: [5] },
  lead_t6: { id: 'lead_t6', label: '≡ƒæñ Tß╗ò tr╞░ß╗ƒng T6 (Mß╗╣ Ng├ón)', canScore: true, canLock: false, canReset: false, allowedGroups: [6] },
  member: { id: 'member', label: '≡ƒæü∩╕Å Hß╗ìc sinh (Chß╗ë xem)', canScore: false, canLock: false, canReset: false, allowedGroups: [] }
};

const BASE_WEEKLY_SCORE = 100;

// Thang Xß║┐p Loß║íi Th├íng: Tß╗æt (>= 90), Kh├í (70-89), ─Éß║ít (50-69), Ch╞░a ─æß║ít (<50)
// Thang Xß║┐p Loß║íi: Tß╗æt (>= 95), Kh├í (80-94), ─Éß║ít (60-79), Ch╞░a ─æß║ít (<60)
const RANKING_TIERS = {
  GOOD: { label: 'Tß╗æt', min: 95, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  FAIR: { label: 'Kh├í', min: 80, color: 'text-blue-700 bg-blue-50 border-blue-300' },
  PASS: { label: '─Éß║ít', min: 60, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  FAIL: { label: 'Ch╞░a ─æß║ít', min: 0, color: 'text-rose-700 bg-rose-50 border-rose-300' },
  RESTRICTED: { label: 'Ch╞░a ─æß║ít (Khß╗æng chß║┐ ΓÜá∩╕Å)', min: 0, color: 'text-rose-900 bg-rose-100 dark:bg-rose-950/80 border-rose-500 dark:border-rose-700 font-black' }
};

// THANG ─ÉIß╗éM Cß╗ÿNG
const BONUS_RULES = [
  // IV. TH╞»ß╗₧NG CHUY├èN Cß║ªN & Tß║¼P THß╗é
  { key: 'bonus_class_attendance', group: 'attendance', label: 'Lß╗¢p / Tß╗ò ─æi hß╗ìc ─æß╗º 100% cß║ú tuß║ºn (Kh├┤ng vß║»ng, kh├┤ng trß╗à)', points: 50, icon: 'fa-trophy' },
  { key: 'bonus_individual_attendance', group: 'attendance', label: 'HS ─æi hß╗ìc ─æß╗º cß║ú tuß║ºn (Kh├┤ng vß║»ng, kh├┤ng trß╗à, ─æ├║ng ─æß╗ông phß╗Ñc, t├│c nghi├¬m t├║c)', points: 40, icon: 'fa-medal' },
  { key: 'bonus_full_10_lesson', group: 'lesson', label: 'Tiß║┐t hß╗ìc xß║┐p loß║íi Tß╗æt Full 10 ─æiß╗âm (Cß║ú tß╗ò/lß╗¢p)', points: 50, icon: 'fa-crown' },
  { key: 'bonus_good_lesson', group: 'lesson', label: 'Tiß║┐t hß╗ìc xß║┐p loß║íi Tß╗æt (Cß║ú tß╗ò)', points: 25, icon: 'fa-star' },

  // II. Hß╗îC Tß║¼P & PH├üT BIß╗éU
  { key: 'bonus_high_score', group: 'academic', label: '─Éiß╗âm 8, 9, 10 (Kiß╗âm tra miß╗çng, 15 ph├║t, l├¬n bß║úng)', points: 10, icon: 'fa-award' },
  { key: 'bonus_speech_multiple', group: 'academic', label: 'Ph├ít biß╗âu 3 lß║ºn trong 1 tiß║┐t hß╗ìc', points: 10, icon: 'fa-hand-sparkles' },
  { key: 'bonus_speech_single', group: 'academic', label: 'Ph├ít biß╗âu x├óy dß╗▒ng b├ái (1 lß║ºn)', points: 5, icon: 'fa-lightbulb' },
  { key: 'bonus_board_solution', group: 'academic', label: 'Xung phong l├¬n bß║úng giß║úi b├ái ─æ├║ng', points: 10, icon: 'fa-chalkboard-user' },

  // TIß║╛N Bß╗ÿ & PHONG TR├ÇO
  { key: 'bonus_duty_excellent', group: 'duty', label: 'C├ín sß╗▒ lß╗¢p / Tß╗ò tr╞░ß╗ƒng ho├án th├ánh xuß║Ñt sß║»c nhiß╗çm vß╗Ñ', points: 20, icon: 'fa-user-check' },
  { key: 'bonus_paired_progress', group: 'progress', label: '─É├┤i bß║ín c├╣ng tiß║┐n: C├╣ng tiß║┐n bß╗Ö / K├¿m bß║ín ─æß║ít kß║┐t quß║ú tß╗æt (+15 cho cß║ú hai)', points: 15, icon: 'fa-handshake-angle' },
  { key: 'bonus_baby_steps', group: 'progress', label: 'Nß╗ù lß╗▒c vi m├┤ (Baby Steps): Ho├án th├ánh cam kß║┐t giao ╞░ß╗¢c tuß║ºn', points: 10, icon: 'fa-stairs' },
  { key: 'bonus_effort_support', group: 'progress', label: 'Hß╗ìc sinh diß╗çn hß╗ù trß╗ú c├│ nß╗ù lß╗▒c l├ám b├ái', points: 10, icon: 'fa-heart-circle-bolt' },
  { key: 'bonus_group_homework', group: 'academic', label: 'Cß║ú tß╗ò 100% l├ám b├ái tß║¡p vß╗ü nh├á (+10/ng╞░ß╗¥i)', points: 10, icon: 'fa-users' },
  { key: 'bonus_logical_consequence', group: 'progress', label: 'Tß╗▒ gi├íc khß║»c phß╗Ñc hß╗ç quß║ú (Trß╗▒c nhß║¡t b├╣, l├ám b├ái b├╣, lao ─æß╗Öng t├¡ch cß╗▒c)', points: 10, icon: 'fa-broom' }
];

// THANG ─ÉIß╗éM TRß╗¬
const VIOLATION_RULES = [
  // I. Lß╗ûI KHß╗ÉNG CHß║╛ (Hß║á Bß║¼C / CH╞»A ─Éß║áT NGAY - ─Éß╗ÇU TRß╗¬ 50 ─ÉIß╗éM)
  { key: 'viol_cheating', group: 'restricted', isRestricted: true, label: 'ΓÜá∩╕Å [Lß╗ûI KHß╗ÉNG CHß║╛] Gian lß║¡n thi cß╗¡ / Ch├⌐p b├ái kiß╗âm tra', points: -50, icon: 'fa-file-circle-xmark' },
  { key: 'viol_fighting', group: 'restricted', isRestricted: true, label: '≡ƒÜ½ [Lß╗ûI KHß╗ÉNG CHß║╛] ─É├ính nhau / G├óy gß╗ò mß║Ñt ─æo├án kß║┐t', points: -50, icon: 'fa-hand-fist' },
  { key: 'viol_phone', group: 'restricted', isRestricted: true, label: '≡ƒô▒ [Lß╗ûI KHß╗ÉNG CHß║╛] Sß╗¡ dß╗Ñng ─æiß╗çn thoß║íi trong giß╗¥ hß╗ìc kh├┤ng xin ph├⌐p', points: -50, icon: 'fa-mobile-screen-button' },
  { key: 'viol_truancy', group: 'restricted', isRestricted: true, label: '≡ƒÅâ [Lß╗ûI KHß╗ÉNG CHß║╛] Trß╗æn tiß║┐t / Vß║»ng hß╗ìc kh├┤ng ph├⌐p', points: -50, icon: 'fa-user-xmark' },
  { key: 'viol_disrespect', group: 'restricted', isRestricted: true, label: 'ΓÜí [Lß╗ûI KHß╗ÉNG CHß║╛] N├│i tß╗Ñc, chß╗¡i thß╗ü / V├┤ lß╗à vß╗¢i thß║ºy c├┤', points: -50, icon: 'fa-triangle-exclamation' },

  // II. Hß╗îC Tß║¼P & Kß╗╢ LUß║¼T TIß║╛T Hß╗îC
  { key: 'viol_no_homework', group: 'academic', isRestricted: false, label: '≡ƒôÜ Kh├┤ng soß║ín b├ái / Kh├┤ng l├ám b├ái tß║¡p vß╗ü nh├á (1 lß║ºn)', points: -15, icon: 'fa-book-skull' },
  { key: 'viol_inattentive', group: 'academic', isRestricted: false, label: '≡ƒÆñ Kh├┤ng nghi├¬m t├║c, l├ám viß╗çc ri├¬ng, ngß╗º gß╗Ñc, n├│i chuyß╗çn', points: -15, icon: 'fa-bed' },
  { key: 'viol_low_score', group: 'academic', isRestricted: false, label: '≡ƒôë ─Éiß╗âm d╞░ß╗¢i 5 (Miß╗çng / 15 ph├║t / Giß╗»a kß╗│)', points: -15, icon: 'fa-chart-line-down' },
  { key: 'viol_seat_change', group: 'academic', isRestricted: false, label: '≡ƒöä Tß╗▒ ├╜ ─æß╗òi chß╗ù ngß╗ôi kh├┤ng xin ph├⌐p', points: -20, icon: 'fa-arrows-split-up-and-left' },

  // III. CHUY├èN Cß║ªN & Nß╗Ç Nß║╛P
  { key: 'viol_late', group: 'conduct', isRestricted: false, label: 'ΓÅ░ ─Éi hß╗ìc trß╗à (muß╗Ön giß╗¥)', points: -15, icon: 'fa-clock' },
  { key: 'viol_uniform', group: 'conduct', isRestricted: false, label: '≡ƒæö Vi phß║ím t├íc phong: T├│c d├ái, nhuß╗Öm t├│c, ─æß║íp quai hß║¡u, sai ─æß╗ông phß╗Ñc', points: -20, icon: 'fa-shirt' },
  { key: 'viol_eating_drawing', group: 'conduct', isRestricted: false, label: '≡ƒÑñ ─én qu├á vß║╖t trong giß╗¥ / Ghi vß║╜ bß║¡y l├¬n b├án hß╗ìc', points: -15, icon: 'fa-cookie-bite' },
  { key: 'viol_cleaning_trash', group: 'conduct', isRestricted: false, label: '≡ƒº╣ Trß╗▒c nhß║¡t bß║⌐n / Xß║ú r├íc bß╗½a b├úi', points: -10, icon: 'fa-trash-can' },
  { key: 'viol_late_docs', group: 'conduct', isRestricted: false, label: '≡ƒôæ Nß╗Öp trß╗à giß║Ñy tß╗¥ / Kh├┤ng tham gia phong tr├áo chung', points: -10, icon: 'fa-file-lines' },
  { key: 'viol_excused_absence', group: 'conduct', isRestricted: false, label: '≡ƒô¥ Vß║»ng c├│ ph├⌐p', points: -5, icon: 'fa-envelope-open-text' }
];

// ==================== STATE Hß╗å THß╗ÉNG ====================
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

// ==================== KHß╗₧I Tß║áO Hß╗å THß╗ÉNG ====================
document.addEventListener('DOMContentLoaded', () => {
  initThemeAndStarfield();
  initDateInputs();
  renderRuleButtons();
  loadDataFromStorage();

  // ─Éß║úm bß║úo lu├┤n sß╗¡ dß╗Ñng ─æ├║ng danh s├ích 45 hß╗ìc sinh ch├¡nh thß╗⌐c theo ß║únh sß╗ò lß╗¢p
  const hasBalancedRoster = appState.students.length === 45 && 
                            appState.students.some(s => s.fullName === 'Nguyß╗àn Ho├áng Gia Nguy├¬n' && s.role === 'Tß╗ò tr╞░ß╗ƒng') &&
                            appState.students.some(s => s.id === 'hs_10a3_36' && s.role === 'Tß╗ò tr╞░ß╗ƒng' && s.groupNumber === 3) &&
                            appState.students.some(s => s.id === 'hs_10a3_10' && s.role === 'Th├ánh vi├¬n' && s.groupNumber === 3) &&
                            appState.students.some(s => s.id === 'hs_10a3_14' && s.groupNumber === 1) &&
                            appState.students.some(s => s.id === 'hs_10a3_07' && s.groupNumber === 4) &&
                            appState.students.some(s => s.id === 'hs_10a3_37' && s.groupNumber === 3) &&
                            appState.students.some(s => s.id === 'hs_10a3_19' && s.groupNumber === 6) &&
                            appState.students.some(s => s.fullName === 'Ng├┤ Thß╗ï Diß╗àm Hß║▒ng' && s.groupNumber === 4);
  if (!hasBalancedRoster) {
    injectOfficial45Students(false);
  }

  // Kiß╗âm tra URL hash (vd: #scoring, #students, #forms, #duties) ─æß╗â mß╗ƒ tab t╞░╞íng ß╗⌐ng
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['dashboard', 'leaderboard', 'scoring', 'students', 'seating', 'logs', 'forms', 'backup', 'duties'].includes(initialHash)) {
    switchTab(initialHash);
  } else if (initialHash === 'print-preview') {
    switchTab('seating');
    setTimeout(() => openPrintPreviewModal(), 200);
  } else {
    refreshAllUI();
  }
});

// Cß║¡p nhß║¡t ng├áy th├íng h├┤m nay
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
  // GVCN c├│ to├án quyß╗ün x├íc thß╗▒c
  if (list.includes('gvcn')) return true;
  // C├ín sß╗▒ ─æ╞░ß╗úc quyß╗ün chß║Ñm ─æiß╗âm (Lß╗¢p tr╞░ß╗ƒng & 6 Tß╗ò tr╞░ß╗ƒng)
  if (roleId !== 'gvcn' && (list.includes('cadre') || list.includes(roleId))) return true;
  return false;
}

function addAuthenticatedRole(roleId) {
  try {
    let list = getAuthenticatedRoles();
    if (!list.includes(roleId)) list.push(roleId);
    if (roleId === 'gvcn') {
      list.push('cadre', 'monitor', 'lead_t1', 'lead_t2', 'lead_t3', 'lead_t4', 'lead_t5', 'lead_t6');
    } else if (roleId === 'monitor' || roleId.startsWith('lead_t')) {
      list.push('cadre');
    }
    list = Array.from(new Set(list));
    localStorage.setItem(STORAGE_KEYS.AUTH_ROLES, JSON.stringify(list));
  } catch (e) {
    console.error('Lß╗ùi khi l╞░u vai tr├▓ x├íc thß╗▒c:', e);
  }
}

function logoutAllRoles() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_ROLES);
  executeChangeRole('member');
  showToast('─É├ú ─æ─âng xuß║Ñt quyß╗ün c├ín sß╗▒! Bß║ín ─æang ß╗ƒ Chß║┐ ─æß╗Ö Hß╗ìc sinh (Chß╗ë xem).', 'info');
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

    // Chß╗ë duy tr├¼ vai tr├▓ quß║ún trß╗ï nß║┐u thiß║┐t bß╗ï n├áy ─æ├ú ─æ╞░ß╗úc x├íc thß╗▒c PIN
    if (rawRole && rawRole !== 'member' && isRoleAuthenticated(rawRole)) {
      appState.currentUserRole = rawRole;
    } else {
      appState.currentUserRole = 'member';
    }
    appState.activeLeaderboardWeek = '9';

    // ─Éß╗ông bß╗Ö nh├│m v├á vai tr├▓ khi ─æß╗òi vß╗ï tr├¡ hß╗ìc sinh
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
      if (ph && ph.role === 'Tß╗ò tr╞░ß╗ƒng') { ph.role = 'Th├ánh vi├¬n'; changed = true; }
      if (kt && kt.role !== 'Tß╗ò tr╞░ß╗ƒng') { kt.role = 'Tß╗ò tr╞░ß╗ƒng'; changed = true; }
      if (hl && hl.groupNumber !== 6) { hl.groupNumber = 6; changed = true; }
      if (bt && bt.groupNumber !== 3) { bt.groupNumber = 3; changed = true; }
      if (changed) saveDataToStorage();
    }

    loadSeatingData();
  } catch (err) {
    console.error('Lß╗ùi khi ─æß╗ìc LocalStorage:', err);
    showToast('Lß╗ùi khi tß║úi dß╗» liß╗çu tß╗½ bß╗Ö nhß╗¢ tr├¼nh duyß╗çt!', 'error');
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
    console.error('Lß╗ùi khi ghi LocalStorage:', err);
    showToast('Kh├┤ng thß╗â l╞░u dß╗» liß╗çu! H├úy kiß╗âm tra dung l╞░ß╗úng tr├¼nh duyß╗çt.', 'error');
  }
}

// ==================== T├ìNH TO├üN ─ÉIß╗éM Sß╗É & Xß║╛P LOß║áI ====================
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

// ==================== GIAO DIß╗åN & ─ÉIß╗ÇU H╞»ß╗ÜNG TAB ====================
function switchTab(tabName) {
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
    dashboard: 'Bß║úng ─Éiß╗üu Khiß╗ân Tß╗òng Quan Thi ─Éua Lß╗¢p 10A3',
    leaderboard: 'Bß║úng Xß║┐p Hß║íng Thi ─Éua Hß╗ìc Sinh & Tß╗ò Xuß║Ñt Sß║»c Theo Tuß║ºn',
    scoring: 'Phiß║┐u Ghi Nhß║¡n ─Éiß╗âm Thi ─Éua Tß╗▒ Quß║ún (Ban C├ín Sß╗▒ / Sao ─Éß╗Å)',
    students: 'Danh S├ích & Quß║ún Trß╗ï Hß╗ìc Sinh Lß╗¢p 10A3',
    seating: 'S╞í ─Éß╗ô Chß╗ù Ngß╗ôi Lß╗¢p Hß╗ìc 10A3 (2 D├úy ΓÇó 6 Tß╗ò ΓÇó 24 B├án)',
    logs: 'Sß╗ò Tra Cß╗⌐u & Nhß║¡t K├╜ Ghi Nhß║¡n ─Éiß╗âm',
    forms: 'Trung T├óm Biß╗âu Mß║½u S╞░ Phß║ím & Kß║┐ Hoß║ích Tiß║┐n Bß╗Ö (GDPT 2018)',
    backup: 'Trung T├óm Dß╗» Liß╗çu, C├ái ─Éß║╖t & Sao L╞░u',
    duties: 'Bß║úng Ph├ón C├┤ng Nhiß╗çm Vß╗Ñ Ban C├ín Sß╗▒ & Tß╗▒ Quß║ún Lß╗¢p 10A3'
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

  // ─Éiß╗âm trung b├¼nh cß║ú lß╗¢p
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

  // Tß╗òng ─æiß╗âm cß╗Öng & trß╗½ trong nhß║¡t k├╜
  appState.dailyLogs.forEach(l => {
    const pts = Number(l.pointsChanged) || 0;
    if (pts > 0) totalBonusPoints += pts;
    else if (pts < 0) totalViolationPoints += pts;
  });

  document.getElementById('kpi-total-bonus').textContent = `+${totalBonusPoints}`;
  document.getElementById('kpi-total-violation').textContent = `${totalViolationPoints}`;

  // Ph├ón bß╗ò xß║┐p loß║íi
  let counts = { good: 0, fair: 0, pass: 0, fail: 0 };
  studentScoreMap.forEach(s => {
    const tier = getRankingTier(s.currentScore);
    if (tier.label === 'Tß╗æt') counts.good++;
    else if (tier.label === 'Kh├í') counts.fair++;
    else if (tier.label === '─Éß║ít') counts.pass++;
    else counts.fail++;
  });

  document.getElementById('stat-count-good').textContent = counts.good;
  document.getElementById('stat-count-fair').textContent = counts.fair;
  document.getElementById('stat-count-pass').textContent = counts.pass;
  document.getElementById('stat-count-fail').textContent = counts.fail;

  // Render Top 5 Xuß║Ñt Sß║»c
  const sortedDesc = [...studentScoreMap].sort((a, b) => b.currentScore - a.currentScore);
  const topContainer = document.getElementById('top-students-list');
  topContainer.innerHTML = '';

  if (sortedDesc.length === 0) {
    topContainer.innerHTML = '<p class="text-xs text-slate-400 p-4 text-center">Ch╞░a c├│ dß╗» liß╗çu hß╗ìc sinh</p>';
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
              ${stu.isSpecialSupport ? '<span class="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">╞»u ti├¬n k├¿m</span>' : ''}
            </div>
            <p class="text-[11px] text-slate-400">Tß╗ò ${stu.groupNumber} ΓÇó Quß╗╣ chuß║⌐n 100─æ</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-base font-black text-emerald-600">${stu.currentScore} ─æ</span>
          <span class="block text-[10px] text-emerald-700 font-bold uppercase">Hß║íng ${getRankingTier(stu.currentScore).label}</span>
        </div>
      `;
      topContainer.appendChild(item);
    });
  }

  // Render Cß║únh B├ío Vi Phß║ím & Cß║ºn Hß╗ù Trß╗ú
  const warningContainer = document.getElementById('warning-students-list');
  warningContainer.innerHTML = '';

  // Lß╗ìc hß╗ìc sinh c├│ ─æiß╗âm < 90 hoß║╖c c├│ ─æiß╗âm trß╗½ hoß║╖c hß╗ìc sinh yß║┐u cß║ºn k├¿m
  const needAttention = studentScoreMap
    .filter(s => s.currentScore < 90 || s.isSpecialSupport)
    .sort((a, b) => a.currentScore - b.currentScore)
    .slice(0, 5);

  if (needAttention.length === 0) {
    warningContainer.innerHTML = `
      <div class="p-6 text-center text-slate-400">
        <i class="fa-solid fa-circle-check text-2xl text-emerald-500 mb-1"></i>
        <p class="text-xs font-semibold text-slate-600">Tuyß╗çt vß╗¥i! Kh├┤ng c├│ hß╗ìc sinh n├áo bß╗ï cß║únh b├ío hoß║╖c tß╗Ñt ─æiß╗âm s├óu.</p>
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
              ${stu.isSpecialSupport ? '<span class="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded border border-amber-300">Cß║ºn theo d├╡i ─æß║╖c biß╗çt</span>' : ''}
            </div>
            <p class="text-[11px] text-slate-400">Tß╗ò ${stu.groupNumber} ΓÇó ${isDeducted ? `Bß╗ï trß╗½ ${100 - stu.currentScore} ─æiß╗âm` : '─Éang duy tr├¼ ß╗òn ─æß╗ïnh'}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-base font-black ${stu.currentScore < 70 ? 'text-rose-600' : 'text-amber-600'}">${stu.currentScore} ─æ</span>
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

  // 1. Biß╗âu ─æß╗ô cß╗Öt thi ─æua 6 Tß╗ò
  const ctxGroup = document.getElementById('groupsChart');
  if (ctxGroup) {
    const labels = groupStats.map(g => `Tß╗ò ${g.groupNumber}`);
    const dataValues = groupStats.map(g => g.avgScore);

    if (appState.charts.groupsChart) {
      appState.charts.groupsChart.destroy();
    }

    appState.charts.groupsChart = new Chart(ctxGroup, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '─Éiß╗âm Trung B├¼nh Tß╗ò',
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
              label: (item) => `─Éiß╗âm TB: ${item.raw} ─æiß╗âm`
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

  // 2. Biß╗âu ─æß╗ô Doughnut Xß║┐p Loß║íi Th├íng
  const ctxRating = document.getElementById('ratingsChart');
  if (ctxRating) {
    let counts = { good: 0, fair: 0, pass: 0, fail: 0 };
    appState.students.forEach(s => {
      const score = calculateStudentScore(s.id);
      const hasRestricted = violList.some(v => { const r = VIOLATION_RULES.find(vr => vr.key === v.ruleKey); return r && r.isRestricted; });
    const tier = getRankingTier(score, hasRestricted);
      if (tier.label === 'Tß╗æt') counts.good++;
      else if (tier.label === 'Kh├í') counts.fair++;
      else if (tier.label === '─Éß║ít') counts.pass++;
      else counts.fail++;
    });

    if (appState.charts.ratingsChart) {
      appState.charts.ratingsChart.destroy();
    }

    appState.charts.ratingsChart = new Chart(ctxRating, {
      type: 'doughnut',
      data: {
        labels: ['Tß╗æt (ΓëÑ90)', 'Kh├í (70-89)', '─Éß║ít (50-69)', 'Ch╞░a ─æß║ít (<50)'],
        datasets: [{
          data: [counts.good, counts.fair, counts.pass, counts.fail],
          backgroundColor: [
            '#10b981', // Tß╗æt: Emerald
            '#3b82f6', // Kh├í: Blue
            '#f59e0b', // ─Éß║ít: Amber
            '#ef4444'  // Ch╞░a ─æß║ít: Red
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

// ==================== RENDERING: FORM CHß║ñM ─ÉIß╗éM (TAB 2) ====================
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
    quickSelect.innerHTML = '<option value="">-- Chß╗ìn nhanh 1 hß╗ìc sinh theo t├¬n --</option>';
    const studentsForSelect = appState.activeScoringGroup === 'all' 
      ? appState.students 
      : filtered;
    studentsForSelect.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `T${s.groupNumber} ΓÇó ${s.fullName} (${s.role || 'Th├ánh vi├¬n'})`;
      quickSelect.appendChild(opt);
    });
    quickSelect.value = currentVal;
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p class="col-span-full text-center text-xs text-slate-400 py-4">Ch╞░a c├│ hß╗ìc sinh n├áo trong tß╗ò n├áy</p>';
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
        <span class="text-slate-500 dark:text-slate-400 truncate">${escapeHtml(stu.role || 'Th├ánh vi├¬n')}</span>
        <span class="font-bold text-slate-700 dark:text-slate-300">${calculateStudentScore(stu.id)}─æ</span>
      </div>
    `;
    container.appendChild(pill);
  });

  updateSelectedCountUI();
}

function toggleSelectStudent(studentId) {
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bß║ín ─æang ß╗ƒ Chß║┐ ─æß╗Ö Chß╗ë Xem! Vui l├▓ng ─æ─âng nhß║¡p C├ín sß╗▒ hoß║╖c GVCN ─æß╗â chß║Ñm ─æiß╗âm.', 'warning');
    return;
  }
  // Nß║┐u l├á Tß╗ò tr╞░ß╗ƒng, kiß╗âm tra hß╗ìc sinh c├│ thuß╗Öc tß╗ò m├¼nh kh├┤ng
  if (appState.currentUserRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(appState.currentUserRole.replace('lead_t', ''), 10);
    const stu = appState.students.find(s => s.id === studentId);
    if (stu && Number(stu.groupNumber) !== leaderGroup) {
      showToast(`Bß║ín l├á Tß╗ò tr╞░ß╗ƒng Tß╗ò ${leaderGroup}, chß╗ë ─æ╞░ß╗úc chß║Ñm ─æiß╗âm cho c├íc bß║ín thuß╗Öc Tß╗ò ${leaderGroup}!`, 'warning');
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
    showToast('Bß║ín ─æang ß╗ƒ Chß║┐ ─æß╗Ö Chß╗ë Xem! Kh├┤ng thß╗â chß╗ìn hß╗ìc sinh.', 'warning');
    return;
  }
  if (appState.currentUserRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(appState.currentUserRole.replace('lead_t', ''), 10);
    const groupStudents = appState.students.filter(s => Number(s.groupNumber) === leaderGroup);
    groupStudents.forEach(s => appState.selectedStudentIds.add(s.id));
    renderScoringStudentPills();
    showToast(`─É├ú chß╗ìn to├án bß╗Ö ${groupStudents.length} hß╗ìc sinh Tß╗ò ${leaderGroup}`, 'info');
    return;
  }

  const filtered = appState.students.filter(s => {
    if (appState.activeScoringGroup === 'all') return true;
    return Number(s.groupNumber) === Number(appState.activeScoringGroup);
  });
  filtered.forEach(s => appState.selectedStudentIds.add(s.id));
  renderScoringStudentPills();
  showToast(`─É├ú chß╗ìn to├án bß╗Ö ${filtered.length} hß╗ìc sinh ─æang hiß╗ân thß╗ï`, 'info');
}

function clearSelectedStudents() {
  appState.selectedStudentIds.clear();
  renderScoringStudentPills();
}

function updateSelectedCountUI() {
  const count = appState.selectedStudentIds.size;
  const countText = document.getElementById('selected-students-count-text');
  if (countText) countText.textContent = `─É├ú chß╗ìn: ${count} hß╗ìc sinh`;

  const badge = document.getElementById('preview-students-badge');
  if (badge) badge.textContent = `${count} hß╗ìc sinh ─æ╞░ß╗úc chß╗ìn`;
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

  if (ruleText) ruleText.textContent = `[${type === 'bonus' ? '─ÉIß╗éM Cß╗ÿNG' : '─ÉIß╗éM TRß╗¬'}] ${rule.label}`;
  if (pointsBadge) {
    pointsBadge.textContent = type === 'bonus' ? `+${rule.points} ─æiß╗âm` : `${rule.points} ─æiß╗âm`;
    pointsBadge.className = type === 'bonus' ? 'text-xl font-black text-emerald-400' : 'text-xl font-black text-rose-400';
  }
}

function submitScoringEntry() {
  // 1. Kiß╗âm tra quyß╗ün hß║ín vai tr├▓
  const currentRole = appState.currentUserRole || 'member';
  const roleMeta = ROLES[currentRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('T├ái khoß║ún cß╗ºa bß║ín ─æang ß╗ƒ Chß║┐ ─æß╗Ö Chß╗ë Xem! Chß╗ë GVCN, Lß╗¢p tr╞░ß╗ƒng v├á 6 Tß╗ò tr╞░ß╗ƒng mß╗¢i c├│ quyß╗ün ghi nhß║¡n ─æiß╗âm.', 'error');
    return;
  }

  // 2. Kiß╗âm tra tuß║ºn c├│ bß╗ï kh├│a kh├┤ng
  const currentWeek = document.getElementById('score-input-week')?.value || appState.activeLeaderboardWeek || '10';
  if (isWeekLocked(currentWeek)) {
    showToast(`Tuß║ºn ${currentWeek} ─æ├ú chß╗æt sß╗ò v├á kh├│a ─æiß╗âm! Vui l├▓ng chß╗ìn tuß║ºn ─æang mß╗ƒ hoß║╖c li├¬n hß╗ç GVCN mß╗ƒ kh├│a.`, 'error');
    return;
  }

  // 3. Nß║┐u l├á Tß╗ò tr╞░ß╗ƒng, chß╗ë ─æ╞░ß╗úc chß║Ñm ─æiß╗âm th├ánh vi├¬n trong tß╗ò m├¼nh
  if (currentRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(currentRole.replace('lead_t', ''), 10);
    const selectedStudents = appState.students.filter(s => appState.selectedStudentIds.has(s.id));
    const foreignStudents = selectedStudents.filter(s => Number(s.groupNumber) !== leaderGroup);
    if (foreignStudents.length > 0) {
      showToast(`Bß║ín l├á Tß╗ò tr╞░ß╗ƒng Tß╗ò ${leaderGroup}, chß╗ë ─æ╞░ß╗úc quyß╗ün chß║Ñm ─æiß╗âm cho c├íc bß║ín thuß╗Öc Tß╗ò ${leaderGroup}!`, 'warning');
      return;
    }
  }

  if (appState.selectedStudentIds.size === 0) {
    showToast('Vui l├▓ng click chß╗ìn ├¡t nhß║Ñt 1 hß╗ìc sinh ß╗ƒ Danh s├ích b├¬n tr├íi!', 'warning');
    return;
  }
  if (!appState.activeRule) {
    showToast('Vui l├▓ng chß╗ìn 1 ti├¬u ch├¡ ─æiß╗âm cß╗Öng hoß║╖c ─æiß╗âm trß╗½ tß╗½ danh s├ích xß╗ò xuß╗æng!', 'warning');
    return;
  }

  const dateVal = document.getElementById('score-input-date')?.value || new Date().toISOString().split('T')[0];
  const recorderVal = document.getElementById('score-input-recorder')?.value.trim() || 'Sao ─æß╗Å trß╗▒c nhß║¡t';
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
  if (ruleText) ruleText.textContent = 'H├úy chß╗ìn hß╗ìc sinh b├¬n tr├íi v├á chß╗ìn 1 ti├¬u ch├¡ tß╗½ menu xß╗ò xuß╗æng ─Éiß╗âm cß╗Öng hoß║╖c ─Éiß╗âm trß╗½.';
  
  const pointsBadge = document.getElementById('preview-points-badge');
  if (pointsBadge) {
    pointsBadge.textContent = '0 ─æiß╗âm';
    pointsBadge.className = 'font-black text-base text-white px-2 py-0.5 rounded bg-slate-800';
  }

  renderScoringStudentPills();
  refreshAllUI();

  showToast(`─É├ú ghi nhß║¡n th├ánh c├┤ng cho ${newLogs.length} hß╗ìc sinh (Tuß║ºn ${weekVal})!`, 'success');
}

// ==================== RENDERING: QUß║óN L├¥ DANH S├üCH Hß╗îC SINH (TAB 3) ====================
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
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-8 text-slate-400 text-xs">Kh├┤ng t├¼m thß║Ñy hß╗ìc sinh n├áo ph├╣ hß╗úp</td></tr>';
    document.getElementById('students-table-summary').textContent = 'Hiß╗ân thß╗ï 0 hß╗ìc sinh';
    return;
  }

  filtered.forEach((stu, index) => {
    const score = calculateStudentScore(stu.id);

    // T├¡nh ─æiß╗âm cß╗Öng v├á ─æiß╗âm trß╗½ cß╗ºa hß╗ìc sinh tß╗½ dailyLogs
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
        <div class="text-center cursor-pointer" onclick="openStudentDetailModal('${stu.id}')" title="Bß║Ñm ─æß╗â xem lß╗ïch sß╗¡ ─æiß╗âm cß╗Öng chi tiß║┐t">
          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 transition shadow-2xs">
            <i class="fa-solid fa-plus text-[10px]"></i>
            <span>${bonusPts} ─æ</span>
          </span>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[170px] mx-auto text-left space-y-0.5">
            ${bonusList.slice(0, 2).map(b => `
              <div class="truncate text-emerald-600 dark:text-emerald-400 font-semibold" title="${escapeHtml(b.ruleLabel)} (+${b.pointsChanged}─æ${b.week ? `, Tuß║ºn ${b.week}` : ''})">
                ΓÇó +${b.pointsChanged}─æ ${escapeHtml(b.ruleLabel)}
              </div>
            `).join('')}
            ${bonusList.length > 2 ? `<div class="text-[9px] text-emerald-600 dark:text-emerald-400 italic text-center hover:underline">+${bonusList.length - 2} khen th╞░ß╗ƒng kh├íc...</div>` : ''}
          </div>
        </div>
      `
      : '<span class="text-slate-300 dark:text-slate-600 text-xs font-semibold">0 ─æ</span>';

    const hasViolEntries = violPts < 0 || hasRestricted || violList.length > 0;
    const violBadgeText = hasRestricted 
      ? (violPts < 0 ? `ΓÜá∩╕Å Khß╗æng chß║┐ (${violPts}─æ)` : 'ΓÜá∩╕Å Khß╗æng chß║┐ (0─æ)')
      : `${Math.abs(violPts)} ─æ`;

    const violHtml = hasViolEntries 
      ? `
        <div class="text-center cursor-pointer" onclick="openStudentDetailModal('${stu.id}')" title="Bß║Ñm ─æß╗â xem chi tiß║┐t vi phß║ím">
          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700 hover:border-rose-400 transition shadow-2xs">
            <i class="fa-solid fa-minus text-[10px]"></i>
            <span>${violBadgeText}</span>
          </span>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[170px] mx-auto text-left space-y-0.5">
            ${violList.slice(0, 2).map(v => {
              const r = VIOLATION_RULES.find(vr => vr.key === v.ruleKey);
              const isRestrictedRule = r && r.isRestricted;
              const ptsLabel = isRestrictedRule ? 'ΓÜá∩╕Å' : `${v.pointsChanged}─æ`;
              return `
              <div class="truncate text-rose-600 dark:text-rose-400 font-semibold" title="${escapeHtml(v.ruleLabel)} (${ptsLabel}${v.week ? `, Tuß║ºn ${v.week}` : ''})">
                ΓÇó ${ptsLabel} ${escapeHtml(v.ruleLabel)}
              </div>`;
            }).join('')}
            ${violList.length > 2 ? `<div class="text-[9px] text-rose-600 dark:text-rose-400 italic text-center hover:underline">+${violList.length - 2} vi phß║ím kh├íc...</div>` : ''}
          </div>
        </div>
      `
      : '<span class="text-slate-300 dark:text-slate-600 text-xs font-semibold">0 ─æ</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-100 dark:border-slate-800';

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono text-xs text-slate-400">${index + 1}</td>
      <td class="py-3 px-4 cursor-pointer" onclick="openStudentDetailModal('${stu.id}')">
        <span class="font-bold text-slate-800 dark:text-slate-100 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition block">${escapeHtml(stu.fullName)}</span>
        <span class="text-[11px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
          <span><i class="fa-regular fa-id-card text-[10px] mr-1"></i>${stu.code || 'Ch╞░a c├│ m├ú'}</span>
          ${stu.dob ? `<span>ΓÇó <i class="fa-regular fa-calendar text-[10px] mr-1"></i>${stu.dob}</span>` : ''}
          ${stu.academicScore ? `<span class="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold rounded text-[10px]"><i class="fa-solid fa-graduation-cap text-[9px] mr-1"></i>${stu.academicScore}─æ</span>` : ''}
        </span>
      </td>
      <td class="py-3 px-4 text-center">
        <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Tß╗ò ${stu.groupNumber}
        </span>
      </td>
      <td class="py-3 px-4">
        ${getRoleBadgeHtml(stu.role)}
      </td>
      <td class="py-3 px-4 text-center">
        ${stu.isSpecialSupport 
          ? '<span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"><i class="fa-solid fa-shield-heart text-amber-600 dark:text-amber-400"></i><span>Cß║ºn theo d├╡i</span></span>' 
          : '<span class="text-slate-300 dark:text-slate-600 text-xs">ΓÇö</span>'}
      </td>
      <td class="py-3 px-3 text-center">
        ${bonusHtml}
      </td>
      <td class="py-3 px-3 text-center">
        ${violHtml}
      </td>
      <td class="py-3 px-4 text-right">
        <span class="font-black text-sm ${score >= 90 ? 'text-emerald-600 dark:text-emerald-400' : score >= 70 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}">${score} ─æ</span>
      </td>
      <td class="py-3 px-4 text-center">
        <span class="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${tier.color}">
          ${tier.label}
        </span>
      </td>
      <td class="py-3 px-4 text-center space-x-1">
        ${appState.currentUserRole === "member" 
          ? '<span class="text-xs text-slate-400 italic">Chß╗ë xem</span>' 
          : `<button onclick="quickScoreSingle('${stu.id}')" title="Chß║Ñm ─æiß╗âm em n├áy" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition"><i class="fa-solid fa-star"></i></button>
             <button onclick="openEditStudentModal('${stu.id}')" title="Sß╗¡a th├┤ng tin" class="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"><i class="fa-solid fa-pen"></i></button>
             <button onclick="deleteStudent('${stu.id}')" title="X├│a hß╗ìc sinh" class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition"><i class="fa-solid fa-trash-can"></i></button>`}
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('students-table-summary').textContent = `Hiß╗ân thß╗ï ${filtered.length} / ${appState.students.length} hß╗ìc sinh`;
}

function getRoleBadgeHtml(role) {
  if (!role || role === 'Th├ánh vi├¬n') {
    return `<span class="text-xs text-slate-500">Th├ánh vi├¬n</span>`;
  }

  // Hß╗ù trß╗ú c├ín sß╗▒ ki├¬m nhiß╗çm nhiß╗üu chß╗⌐c danh (nß╗æi bß║▒ng '&')
  const parts = role.split('&').map(p => p.trim());
  return parts.map(part => {
    switch (part) {
      case 'Lß╗¢p tr╞░ß╗ƒng':
        return `<span class="badge-role-lead px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-crown mr-1"></i>Lß╗¢p tr╞░ß╗ƒng</span>`;
      case 'Lß╗¢p ph├│':
      case 'Lß╗¢p ph├│ Hß╗ìc tß║¡p':
        return `<span class="badge-role-deputy px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-user-graduate mr-1"></i>Lß╗¢p ph├│</span>`;
      case 'Lß╗¢p ph├│ Lao ─æß╗Öng':
        return `<span class="badge-role-deputy px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-broom mr-1"></i>Lß╗¢p ph├│ L─É</span>`;
      case 'B├¡ th╞░':
        return `<span class="badge-role-sec px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-flag mr-1"></i>B├¡ th╞░</span>`;
      case 'Tß╗ò tr╞░ß╗ƒng':
        return `<span class="badge-role-group px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-sitemap mr-1"></i>Tß╗ò tr╞░ß╗ƒng</span>`;
      case 'C├ín sß╗▒ To├ín':
      case 'CS To├ín':
        return `<span class="badge-role-math px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-calculator mr-1"></i>CS To├ín</span>`;
      case 'C├ín sß╗▒ L├╜':
      case 'CS L├╜':
        return `<span class="badge-role-phys px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-atom mr-1"></i>CS L├╜</span>`;
      case 'C├ín sß╗▒ H├│a':
      case 'CS H├│a':
        return `<span class="badge-role-chem px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-flask mr-1"></i>CS H├│a</span>`;
      case 'C├ín sß╗▒ Anh':
      case 'CS Anh':
      case 'C├ín sß╗▒ Tiß║┐ng Anh':
        return `<span class="badge-role-eng px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-language mr-1"></i>CS Anh</span>`;
      case 'C├ín sß╗▒ Sinh':
      case 'CS Sinh':
        return `<span class="badge-role-bio px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-dna mr-1"></i>CS Sinh</span>`;
      case 'C├ín sß╗▒ V─ân':
      case 'CS V─ân':
        return `<span class="badge-role-lit px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-book-open mr-1"></i>CS V─ân</span>`;
      case 'Sao ─æß╗Å':
        return `<span class="badge-role-redstar px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center"><i class="fa-solid fa-star mr-1"></i>Sao ─æß╗Å</span>`;
      default:
        return `<span class="text-xs text-slate-500">${escapeHtml(part)}</span>`;
    }
  }).join(' ');
}

// ==================== MODAL TH├èM / Sß╗¼A Hß╗îC SINH ====================
function openAddStudentModal() {
  document.getElementById('modal-student-title').textContent = 'Th├¬m Hß╗ìc Sinh Mß╗¢i';
  document.getElementById('student-form-id').value = '';
  document.getElementById('student-form-name').value = '';
  document.getElementById('student-form-code').value = '';
  document.getElementById('student-form-dob').value = '';
  document.getElementById('student-form-academic').value = '';
  document.getElementById('student-form-group').value = '1';
  document.getElementById('student-form-role').value = 'Th├ánh vi├¬n';
  document.getElementById('student-form-special').checked = false;

  const modal = document.getElementById('modal-student');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function openEditStudentModal(id) {
  const stu = appState.students.find(s => s.id === id);
  if (!stu) return;

  document.getElementById('modal-student-title').textContent = 'Chß╗ënh Sß╗¡a Th├┤ng Tin Hß╗ìc Sinh';
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
    showToast('Hß╗ì v├á t├¬n hß╗ìc sinh kh├┤ng ─æ╞░ß╗úc ─æß╗â trß╗æng!', 'warning');
    return;
  }

  if (id) {
    // Sß╗¡a hß╗ìc sinh hiß╗çn c├│
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
      showToast('Cß║¡p nhß║¡t th├┤ng tin hß╗ìc sinh th├ánh c├┤ng!', 'success');
    }
  } else {
    // Th├¬m mß╗¢i
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
    showToast(`─É├ú th├¬m hß╗ìc sinh ${fullName} v├áo Tß╗ò ${groupNumber}!`, 'success');
  }

  saveDataToStorage();
  closeStudentModal();
  refreshAllUI();
}

function deleteStudent(id) {
  const stu = appState.students.find(s => s.id === id);
  if (!stu) return;

  if (confirm(`Bß║ín c├│ chß║»c chß║»n muß╗æn x├│a hß╗ìc sinh "${stu.fullName}" khß╗Åi danh s├ích lß╗¢p 10A3 kh├┤ng? C├íc nhß║¡t k├╜ li├¬n quan c┼⌐ng sß║╜ ─æ╞░ß╗úc x├│a.`)) {
    appState.students = appState.students.filter(s => s.id !== id);
    appState.dailyLogs = appState.dailyLogs.filter(l => l.studentId !== id);
    appState.selectedStudentIds.delete(id);
    saveDataToStorage();
    refreshAllUI();
    showToast(`─É├ú x├│a hß╗ìc sinh "${stu.fullName}".`, 'info');
  }
}

function quickScoreSingle(studentId) {
  appState.selectedStudentIds.clear();
  appState.selectedStudentIds.add(studentId);
  switchTab('scoring');
  showToast('─É├ú chß╗ìn hß╗ìc sinh v├áo phiß║┐u chß║Ñm ─æiß╗âm', 'info');
}

// ==================== RENDERING: Sß╗ö NHß║¼T K├¥ THI ─ÉUA (TAB 4) ====================
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
  document.getElementById('logs-count-display').textContent = `${filteredLogs.length} bß║ún ghi nhß║¡t k├╜`;

  if (filteredLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400 text-xs">Kh├┤ng c├│ bß║ún ghi nhß║¡t k├╜ n├áo ph├╣ hß╗úp</td></tr>`;
    return;
  }

  filteredLogs.forEach(log => {
    const student = appState.students.find(s => s.id === log.studentId) || { fullName: 'Hß╗ìc sinh ─æ├ú x├│a', groupNumber: '?' };
    const isBonus = Number(log.pointsChanged) > 0;
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition border-b border-slate-100 text-xs';

    tr.innerHTML = `
      <td class="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">${log.date}</td>
      <td class="py-2.5 px-4 font-bold text-slate-800">${escapeHtml(student.fullName)}</td>
      <td class="py-2.5 px-4 text-center">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Tß╗ò ${student.groupNumber}</span>
      </td>
      <td class="py-2.5 px-4">
        <span class="inline-flex items-center space-x-1.5 font-medium ${isBonus ? 'text-emerald-800' : 'text-rose-800'}">
          <i class="fa-solid ${isBonus ? 'fa-plus text-emerald-600' : 'fa-minus text-rose-600'} text-[10px]"></i>
          <span>${escapeHtml(log.ruleLabel)}</span>
        </span>
      </td>
      <td class="py-2.5 px-4 text-right font-black ${isBonus ? 'text-emerald-600' : 'text-rose-600'} whitespace-nowrap">
        ${isBonus ? `+${log.pointsChanged}` : log.pointsChanged} ─æ
      </td>
      <td class="py-2.5 px-4 text-slate-500">${escapeHtml(log.recordedBy || 'C├ín sß╗▒')}</td>
      <td class="py-2.5 px-4 text-slate-400 italic">${escapeHtml(log.note || 'ΓÇö')}</td>
      <td class="py-2.5 px-4 text-center">
        <button onclick="deleteLogEntry('${log.id}')" title="X├│a bß║ún ghi n├áy (ho├án lß║íi ─æiß╗âm)" class="p-1 text-slate-400 hover:text-rose-600 transition">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteLogEntry(logId) {
  if (confirm('Bß║ín c├│ chß║»c chß║»n muß╗æn x├│a l╞░ß╗út ghi nhß║¡n ─æiß╗âm n├áy kh├┤ng? ─Éiß╗âm sß╗æ cß╗ºa hß╗ìc sinh sß║╜ tß╗▒ ─æß╗Öng ─æ╞░ß╗úc ho├án lß║íi.')) {
    appState.dailyLogs = appState.dailyLogs.filter(l => l.id !== logId);
    saveDataToStorage();
    refreshAllUI();
    showToast('─É├ú x├│a bß║ún ghi nhß║¡t k├╜ v├á ho├án lß║íi ─æiß╗âm cho hß╗ìc sinh.', 'info');
  }
}

// ==================== MODAL CHI TIß║╛T Hß╗Æ S╞á 1 Hß╗îC SINH ====================
function openStudentDetailModal(studentId) {
  const stu = appState.students.find(s => s.id === studentId);
  if (!stu) return;

  const score = calculateStudentScore(studentId);
  const tier = getRankingTier(score);
  const stuLogs = appState.dailyLogs.filter(l => l.studentId === studentId);

  document.getElementById('detail-student-name').textContent = stu.fullName;
  document.getElementById('detail-student-meta').textContent = `Tß╗ò ${stu.groupNumber} ΓÇó ${stu.role}${stu.code ? ` ΓÇó M├ú: ${stu.code}` : ''}${stu.dob ? ` ΓÇó NS: ${stu.dob}` : ''}${stu.academicScore ? ` ΓÇó ─Éiß╗âm ─æß║ºu v├áo: ${stu.academicScore}─æ` : ''}${stu.isSpecialSupport ? ' ΓÇó [Cß║ºn hß╗ù trß╗ú ─æß║╖c biß╗çt]' : ''}`;
  document.getElementById('detail-student-score').textContent = `${score} ─æ`;
  document.getElementById('detail-student-rank').textContent = tier.label;
  document.getElementById('detail-student-rank').className = `text-sm font-bold ${tier.color} px-2 py-0.5 rounded border inline-block`;

  let bonusCount = 0;
  let violCount = 0;
  stuLogs.forEach(l => {
    if (Number(l.pointsChanged) > 0) bonusCount++;
    else violCount++;
  });
  document.getElementById('detail-student-counts').textContent = `-${violCount} vi phß║ím / +${bonusCount} khen th╞░ß╗ƒng`;

  const logsContainer = document.getElementById('detail-student-logs');
  logsContainer.innerHTML = '';

  if (stuLogs.length === 0) {
    logsContainer.innerHTML = '<p class="text-xs text-slate-400 py-4 text-center">Ch╞░a c├│ bß║ún ghi ─æiß╗âm th╞░ß╗ƒng hoß║╖c phß║ít n├áo.</p>';
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
          <p class="text-[11px] text-slate-500 mt-0.5">${log.recordedBy ? `Ghi bß╗ƒi: ${escapeHtml(log.recordedBy)}` : ''} ${log.note ? `ΓÇó Ghi ch├║: ${escapeHtml(log.note)}` : ''}</p>
        </div>
        <span class="font-black text-sm ${isBonus ? 'text-emerald-700' : 'text-rose-700'} shrink-0 ml-3">
          ${isBonus ? `+${log.pointsChanged}` : log.pointsChanged} ─æ
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

// ==================== Dß╗« LIß╗åU Mß║¬U & SAO L╞»U ====================

// Protocol Phase 3: Nß║íp 10 hß╗ìc sinh mß║½u (c├│ ─æß╗º c├íc chß╗⌐c vß╗Ñ v├á ─æiß╗âm sß╗æ giß║ú lß║¡p)
function inject10SampleStudents(notify = true) {
  const sampleStudents = [
    { id: 'hs_01', fullName: 'Trß║ºn Minh Khang', groupNumber: 1, role: 'Lß╗¢p tr╞░ß╗ƒng', isSpecialSupport: false },
    { id: 'hs_02', fullName: 'L├¬ Nguyß╗àn Quß╗│nh Anh', groupNumber: 1, role: 'B├¡ th╞░', isSpecialSupport: false },
    { id: 'hs_03', fullName: 'Nguyß╗àn Ho├áng Long', groupNumber: 2, role: 'Lß╗¢p ph├│ Hß╗ìc tß║¡p', isSpecialSupport: false },
    { id: 'hs_04', fullName: 'Phß║ím ─Éß╗⌐c Trß╗ìng', groupNumber: 2, role: 'Tß╗ò tr╞░ß╗ƒng', isSpecialSupport: false },
    { id: 'hs_05', fullName: '─Éß║╖ng Tuß║Ñn Kiß╗çt', groupNumber: 3, role: 'Sao ─æß╗Å', isSpecialSupport: false },
    { id: 'hs_06', fullName: 'V┼⌐ Hß║úi ─É─âng', groupNumber: 3, role: 'Th├ánh vi├¬n', isSpecialSupport: true }, // Cß║ºn theo d├╡i
    { id: 'hs_07', fullName: 'Ho├áng Quß╗æc Bß║úo', groupNumber: 4, role: 'Th├ánh vi├¬n', isSpecialSupport: true }, // Cß║ºn theo d├╡i
    { id: 'hs_08', fullName: 'Ng├┤ Thß║úo Nguy├¬n', groupNumber: 4, role: 'Tß╗ò tr╞░ß╗ƒng', isSpecialSupport: false },
    { id: 'hs_09', fullName: 'B├╣i Gia Huy', groupNumber: 5, role: 'Th├ánh vi├¬n', isSpecialSupport: true }, // Cß║ºn theo d├╡i
    { id: 'hs_10', fullName: '─Éß╗ù Th├╣y Linh', groupNumber: 6, role: 'Tß╗ò tr╞░ß╗ƒng', isSpecialSupport: false }
  ];

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const sampleLogs = [
    // Lß╗¢p tr╞░ß╗ƒng ho├án th├ánh xuß║Ñt sß║»c
    { id: 'log_01', date: today, studentId: 'hs_01', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ l├ám tß╗æt nhiß╗çm vß╗Ñ th├íng', pointsChanged: 20, recordedBy: 'GVCN', note: 'Quß║ún l├╜ 15 ph├║t ─æß║ºu giß╗¥ nghi├¬m t├║c', timestamp: Date.now() - 1000 },
    // B├¡ th╞░ k├¿m bß║ín yß║┐u To├ín
    { id: 'log_02', date: today, studentId: 'hs_02', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'K├¿m bß║ín yß║┐u To├ín/L├╜ (+10 cho cß║ú hai)', pointsChanged: 10, recordedBy: 'Lß╗¢p tr╞░ß╗ƒng', note: 'K├¿m bß║ín V┼⌐ Hß║úi ─É─âng giß║úi b├ái tß║¡p ─Éß║íi sß╗æ', timestamp: Date.now() - 2000 },
    // V┼⌐ Hß║úi ─É─âng (diß╗çn hß╗ù trß╗ú) ─æ╞░ß╗úc cß╗Öng ─æiß╗âm k├¿m v├á nß╗ù lß╗▒c
    { id: 'log_03', date: today, studentId: 'hs_06', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'K├¿m bß║ín yß║┐u To├ín/L├╜ (+10 cho cß║ú hai)', pointsChanged: 10, recordedBy: 'Lß╗¢p tr╞░ß╗ƒng', note: 'C├╣ng bß║ín Quß╗│nh Anh hß╗ìc nh├│m', timestamp: Date.now() - 3000 },
    { id: 'log_04', date: yesterday, studentId: 'hs_06', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Hß╗ìc sinh yß║┐u c├│ nß╗ù lß╗▒c l├ám b├ái', pointsChanged: 10, recordedBy: 'GV Bß╗Ö m├┤n To├ín', note: 'Chß╗º ─æß╗Öng l├¬n chß╗»a b├ái tß║¡p vß╗ü nh├á', timestamp: Date.now() - 4000 },
    // Nguyß╗àn Ho├áng Long xung phong l├¬n bß║úng
    { id: 'log_05', date: today, studentId: 'hs_03', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong l├¬n bß║úng ─æ├║ng', pointsChanged: 10, recordedBy: 'Sao ─æß╗Å Tß╗ò 2', note: 'Tiß║┐t H├│a hß╗ìc', timestamp: Date.now() - 5000 },
    // Ho├áng Quß╗æc Bß║úo (diß╗çn hß╗ù trß╗ú) vi phß║ím n├│i chuyß╗çn & kh├┤ng l├ám b├ái
    { id: 'log_06', date: yesterday, studentId: 'hs_07', type: 'violation', ruleKey: 'viol_no_homework', ruleLabel: 'Kh├┤ng l├ám b├ái / kh├┤ng hß╗ìc b├ái', pointsChanged: -10, recordedBy: 'Sao ─æß╗Å Tß╗ò 4', note: 'Thiß║┐u b├ái tß║¡p Tiß║┐ng Anh', timestamp: Date.now() - 6000 },
    { id: 'log_07', date: today, studentId: 'hs_07', type: 'violation', ruleKey: 'viol_distraction_phone', ruleLabel: 'L├ám viß╗çc ri├¬ng / sß╗¡ dß╗Ñng ─ÉT / tß╗▒ ├╜ ─æß╗òi chß╗ù', pointsChanged: -10, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 4', note: 'D├╣ng ─æiß╗çn thoß║íi trong giß╗¥ Sinh hß╗ìc', timestamp: Date.now() - 7000 },
    // B├╣i Gia Huy ─æi muß╗Ön
    { id: 'log_08', date: today, studentId: 'hs_09', type: 'violation', ruleKey: 'viol_late_uniform', ruleLabel: '─Éi muß╗Ön / sai ─æß╗ông phß╗Ñc', pointsChanged: -5, recordedBy: 'Sao ─æß╗Å trß╗▒c cß╗òng', note: 'Muß╗Ön 10 ph├║t tiß║┐t 1', timestamp: Date.now() - 8000 }
  ];

  appState.students = sampleStudents;
  appState.dailyLogs = sampleLogs;
  saveDataToStorage();
  refreshAllUI();

  if (notify) {
    showToast('─É├ú nß║íp th├ánh c├┤ng 10 hß╗ìc sinh mß║½u v├á nhß║¡t k├╜ thi ─æua thß╗▒c tß║┐!', 'success');
  }
}

// ==================== Dß╗« LIß╗åU CH├ìNH THß╗¿C 45 Hß╗îC SINH 10A3 ====================
// Tr╞░ß╗¥ng THPT B├╣i Thß╗ï Xu├ón - M┼⌐i N├⌐ (Sß╗ƒ GD&─ÉT L├óm ─Éß╗ông)
// Danh s├ích chuß║⌐n x├íc 100% theo ß║únh chß╗Ñp sß╗ò ─æiß╗âm lß╗¢p 10A3 (STT 1 ─æß║┐n 45)
// Ph├ón bß╗æ ─æß╗üu 6 tß╗ò theo ─æiß╗âm lß╗▒c hß╗ìc ─æß║ºu v├áo, ─æ├ú loß║íi c├íc hß╗ìc sinh chuyß╗ân lß╗¢p/nghß╗ë hß╗ìc
const OFFICIAL_10A3_STUDENTS = [
  // ===== Tß╗ö 1 (8 hß╗ìc sinh ΓÇó ─Éiß╗âm TB Lß╗▒c Hß╗ìc: 34.75) =====
  { id: 'hs_10a3_43', code: '1704246671', fullName: 'D╞░╞íng Lß╗Ñc Yß║┐n Vy', dob: '24/09/2011', academicScore: 34, groupNumber: 1, role: 'Tß╗ò tr╞░ß╗ƒng', isSpecialSupport: false },
  { id: 'hs_10a3_41', code: '1701472685', fullName: 'L├¬ Gia V┼⌐', dob: '08/03/2011', academicScore: 35, groupNumber: 1, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_26', code: '1703554579', fullName: 'Cao Ngß╗ìc An Nhi├¬n', dob: '14/12/2011', academicScore: 39, groupNumber: 1, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_30', code: '1701941035', fullName: 'Trß║ºn Thß╗ï Ngß╗ìc Ph├║c', dob: '09/09/2011', academicScore: 36, groupNumber: 1, role: 'Sao ─æß╗Å', isSpecialSupport: false },
  { id: 'hs_10a3_14', code: '1704379491', fullName: 'Nguyß╗àn Vinh Khang', dob: '16/10/2011', academicScore: 28, groupNumber: 1, role: 'Th├ánh vi├¬n', isSpecialSupport: true },
  { id: 'hs_10a3_25', code: '1702780397', fullName: 'V├╡ Thß╗ï Yß║┐n Nhi', dob: '16/04/2011', academicScore: 34, groupNumber: 1, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_32', code: '1704379981', fullName: 'L├¬ Tuß║Ñn Ph├ít T├ái', dob: '17/07/2011', academicScore: 34, groupNumber: 1, role: 'C├ín sß╗▒ To├ín', isSpecialSupport: false },
  { id: 'hs_10a3_28', code: '1805586438', fullName: 'V├╡ Th├ánh Ph├ít', dob: '14/11/2011', academicScore: 36, groupNumber: 1, role: 'Th├ánh vi├¬n', isSpecialSupport: false },

  // ===== Tß╗ö 2 (8 hß╗ìc sinh ΓÇó ─Éiß╗âm TB Lß╗▒c Hß╗ìc: 33.56) =====
  { id: 'hs_10a3_24', code: '1805586434', fullName: 'Nguyß╗àn Ho├áng Gia Nguy├¬n', dob: '06/01/2011', academicScore: 38, groupNumber: 2, role: 'Tß╗ò tr╞░ß╗ƒng & CS H├│a', isSpecialSupport: false },
  { id: 'hs_10a3_33', code: '1703412028', fullName: '─Éß╗ù Quß╗æc Th├ánh', dob: '19/08/2011', academicScore: 35, groupNumber: 2, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_34', code: '1704831627', fullName: 'Nguyß╗àn Ngß╗ìc Anh Th╞░', dob: '24/10/2011', academicScore: 29, groupNumber: 2, role: 'Th├ánh vi├¬n', isSpecialSupport: true },
  { id: 'hs_10a3_38', code: '1704784854', fullName: 'Nguyß╗àn Thß╗ï Thanh Tuyß╗ün (12/01)', dob: '12/01/2011', academicScore: 31, groupNumber: 2, role: 'Th├ánh vi├¬n', isSpecialSupport: true },
  { id: 'hs_10a3_06', code: '1702759605', fullName: 'Tr╞░╞íng Nguyß╗àn Tr╞░ß╗¥ng Giang', dob: '01/05/2011', academicScore: 35, groupNumber: 2, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_02', code: '1704683664', fullName: 'Nguyß╗àn Thß╗ï Kim B╞í', dob: '10/08/2011', academicScore: 33, groupNumber: 2, role: 'C├ín sß╗▒ V─ân', isSpecialSupport: false },
  { id: 'hs_10a3_03', code: '1805425255', fullName: 'Tß╗½ Diß╗çu Y├¬n Diß╗àm', dob: '13/05/2011', academicScore: 33, groupNumber: 2, role: 'Thß╗º quß╗╣ & CS Sß╗¡', isSpecialSupport: false },
  { id: 'hs_10a3_16', code: '1701502268', fullName: 'Nguyß╗àn Tß║Ñn Kß╗│', dob: '26/12/2011', academicScore: 37, groupNumber: 2, role: 'Th├ánh vi├¬n', isSpecialSupport: false },

  // ===== Tß╗ö 3 (8 hß╗ìc sinh ΓÇó ─Éiß╗âm TB Lß╗▒c Hß╗ìc: 34.00) =====
  { id: 'hs_10a3_10', code: '1703554565', fullName: 'Trß║ºn Bß║úo Phi Ho├áng', dob: '16/12/2011', academicScore: 39, groupNumber: 3, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_01', code: '1702997113', fullName: 'Phan Thß╗ï Ngß╗ìc ß║¿n', dob: '09/04/2011', academicScore: 35, groupNumber: 3, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_20', code: '1702880874', fullName: 'Nguyß╗àn Bß║úo Long', dob: '24/04/2011', academicScore: 38, groupNumber: 3, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_05', code: '2201723937', fullName: 'Trß║ºn Hß╗»u ─Éß╗ông', dob: '01/03/2011', academicScore: 33, groupNumber: 3, role: 'Th├ánh vi├¬n', isSpecialSupport: true },
  { id: 'hs_10a3_04', code: '1703398860', fullName: 'V├╡ Ngß╗ìc Mß╗╣ Duy├¬n', dob: '30/01/2011', academicScore: 37, groupNumber: 3, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_36', code: '1701981797', fullName: 'L├¬ Thß╗ï Kim Tr├║c', dob: '25/08/2011', academicScore: 34, groupNumber: 3, role: 'Tß╗ò tr╞░ß╗ƒng', isSpecialSupport: false },
  { id: 'hs_10a3_37', code: '1701981799', fullName: 'V├╡ B├ích T├╣ng', dob: '19/08/2011', academicScore: 34, groupNumber: 3, role: 'Sao ─æß╗Å', isSpecialSupport: false },

  // ===== Tß╗ö 4 (8 hß╗ìc sinh ΓÇó ─Éiß╗âm TB Lß╗▒c Hß╗ìc: 35.31) =====
  { id: 'hs_10a3_15', code: '1704121058', fullName: 'V├╡ Quß╗æc Duy Kh├┤i', dob: '06/07/2011', academicScore: 35, groupNumber: 4, role: 'Tß╗ò tr╞░ß╗ƒng & CS Anh', isSpecialSupport: false },
  { id: 'hs_10a3_07', code: '1702780386', fullName: 'Tß║í Thanh Ngß╗ìc Gi├áu', dob: '13/02/2011', academicScore: 26, groupNumber: 4, role: 'B├¡ th╞░', isSpecialSupport: true },
  { id: 'hs_10a3_45', code: '1703509575', fullName: '─Éß╗ù Kh├┤i Vß╗╣', dob: '08/12/2011', academicScore: 36, groupNumber: 4, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_44', code: '2511977424', fullName: 'Phß║ím Ngß╗ìc T╞░ß╗¥ng Vy', dob: '01/08/2010', academicScore: 34.5, groupNumber: 4, role: 'Th├ánh vi├¬n', isSpecialSupport: true },
  { id: 'hs_10a3_39', code: '1702759627', fullName: 'Nguyß╗àn Thß╗ï Thanh Tuyß╗ün (14/06)', dob: '14/06/2011', academicScore: 38, groupNumber: 4, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_22', code: '1701941028', fullName: 'Nguyß╗àn Hß╗»u ─Éan Mß║ích', dob: '01/01/2011', academicScore: 39, groupNumber: 4, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_08', code: '1702997106', fullName: 'Ng├┤ Thß╗ï Diß╗àm Hß║▒ng', dob: '18/11/2011', academicScore: 37, groupNumber: 4, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_09', code: '1701980221', fullName: 'Nguyß╗àn Vinh Hoa', dob: '15/07/2011', academicScore: 37, groupNumber: 4, role: 'Th├ánh vi├¬n', isSpecialSupport: false },

  // ===== Tß╗ö 5 (7 hß╗ìc sinh ΓÇó ─Éiß╗âm TB Lß╗▒c Hß╗ìc: 33.43) =====
  { id: 'hs_10a3_35', code: '1703919858', fullName: 'Nguyß╗àn Ngß╗ìc Trinh', dob: '18/04/2011', academicScore: 29, groupNumber: 5, role: 'Tß╗ò tr╞░ß╗ƒng', isSpecialSupport: false },
  { id: 'hs_10a3_27', code: '1702997079', fullName: 'Trß║ºn L├¬ Hß╗ông Nhung', dob: '20/10/2011', academicScore: 36, groupNumber: 5, role: 'Lß╗¢p tr╞░ß╗ƒng', isSpecialSupport: false },
  { id: 'hs_10a3_42', code: '1702780409', fullName: 'L├¬ V─ân V┼⌐', dob: '03/01/2011', academicScore: 39, groupNumber: 5, role: 'Lß╗¢p ph├│ Hß╗ìc tß║¡p & CS L├╜', isSpecialSupport: false },
  { id: 'hs_10a3_18', code: '1702780393', fullName: 'Nguyß╗àn ─Éß╗ù Kim Yß║┐n Linh', dob: '19/06/2011', academicScore: 37, groupNumber: 5, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_31', code: '1704684848', fullName: 'Ho├áng Thß║┐ T├ái', dob: '04/10/2011', academicScore: 35, groupNumber: 5, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_12', code: '1701384874', fullName: '─Éß╗ù Tuß║Ñn H╞░ng', dob: '17/06/2011', academicScore: 29, groupNumber: 5, role: 'Th├ánh vi├¬n', isSpecialSupport: true },
  { id: 'hs_10a3_40', code: '1803521194', fullName: 'Trß║ºn Ph├║c Vinh', dob: '06/09/2011', academicScore: 29, groupNumber: 5, role: 'Th├ánh vi├¬n', isSpecialSupport: true },

  // ===== Tß╗ö 6 (7 hß╗ìc sinh ΓÇó ─Éiß╗âm TB Lß╗▒c Hß╗ìc: 35.43) =====
  { id: 'hs_10a3_23', code: '1704684195', fullName: 'Tr╞░╞íng Thß╗ï Mß╗╣ Ng├ón', dob: '23/02/2011', academicScore: 38, groupNumber: 6, role: 'Tß╗ò tr╞░ß╗ƒng & CS Sinh', isSpecialSupport: false },
  { id: 'hs_10a3_21', code: '1703805924', fullName: 'Trß║ºn Minh Lu├ón', dob: '25/12/2011', academicScore: 25, groupNumber: 6, role: 'Th├ánh vi├¬n', isSpecialSupport: true },
  { id: 'hs_10a3_29', code: '1702716688', fullName: 'Nguyß╗àn Xu├ón Ph├║c', dob: '23/11/2011', academicScore: 38, groupNumber: 6, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_17', code: '1702780666', fullName: 'L├¬ Thß╗ï Mß╗╣ Linh', dob: '15/10/2011', academicScore: 36, groupNumber: 6, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_13', code: '1701502384', fullName: 'L├¬ Minh Khß║úi', dob: '25/06/2011', academicScore: 37, groupNumber: 6, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_19', code: '1704303580', fullName: 'B├╣i Nguyß╗àn Ho├áng Long', dob: '30/10/2011', academicScore: 38, groupNumber: 6, role: 'Th├ánh vi├¬n', isSpecialSupport: false },
  { id: 'hs_10a3_11', code: '1701470035', fullName: 'Nguyß╗àn Quß╗æc Huy', dob: '19/09/2011', academicScore: 23, groupNumber: 6, role: 'Lß╗¢p ph├│ Lao ─æß╗Öng', isSpecialSupport: true }
];

// Khß╗ƒi tß║ío to├án bß╗Ö 45 hß╗ìc sinh lß╗¢p 10A3 chuß║⌐n c├ón bß║▒ng 6 tß╗ò
function injectFull45StudentsPrompt() {
  if (confirm('Thao t├íc n├áy sß║╜ tß║úi danh s├ích 45 hß╗ìc sinh ch├¡nh thß╗⌐c Lß╗¢p 10A3 ph├ón bß╗ò c├ón bß║▒ng 6 tß╗ò theo ─æiß╗âm lß╗▒c hß╗ìc (Trß║ºn L├¬ Hß╗ông Nhung l├ám Lß╗¢p tr╞░ß╗ƒng, Tß╗½ Diß╗çu Y├¬n Diß╗àm l├ám Lß╗¢p ph├│). Tiß║┐p tß╗Ñc?')) {
    injectOfficial45Students(true);
  }
}

function injectOfficial45Students(notify = true) {
  // Tß╗▒ ─æß╗Öng dß╗ìn dß║╣p c├íc kh├│a l╞░u trß╗» c┼⌐ nß║┐u c├│
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
    // Lß╗¢p tr╞░ß╗ƒng Trß║ºn L├¬ Hß╗ông Nhung ho├án th├ánh xuß║Ñt sß║»c
    { id: 'log_01', date: today, studentId: 'hs_10a3_27', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ l├ám tß╗æt nhiß╗çm vß╗Ñ th├íng', pointsChanged: 20, recordedBy: 'GVCN', note: 'Quß║ún l├╜ nß╗ün nß║┐p tß╗▒ quß║ún lß╗¢p 10A3 rß║Ñt nghi├¬m t├║c', timestamp: Date.now() - 1000 },
    // Lß╗¢p ph├│ Tß╗½ Diß╗çu Y├¬n Diß╗àm k├¿m bß║ín hß╗ìc
    { id: 'log_02', date: today, studentId: 'hs_10a3_03', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'K├¿m bß║ín yß║┐u To├ín/L├╜ (+10 cho cß║ú hai)', pointsChanged: 10, recordedBy: 'Lß╗¢p tr╞░ß╗ƒng', note: 'K├¿m bß║ín Nguyß╗àn Thß╗ï Kim B╞í ├┤n tß║¡p', timestamp: Date.now() - 2000 },
    { id: 'log_03', date: today, studentId: 'hs_10a3_02', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'K├¿m bß║ín yß║┐u To├ín/L├╜ (+10 cho cß║ú hai)', pointsChanged: 10, recordedBy: 'Lß╗¢p tr╞░ß╗ƒng', note: 'C├│ tiß║┐n bß╗Ö r├╡ rß╗çt trong giß╗¥ To├ín', timestamp: Date.now() - 3000 },
    // C├ín sß╗▒ To├ín Nguyß╗àn Hß╗»u ─Éan Mß║ích l├¬n bß║úng giß║úi b├ái
    { id: 'log_04', date: yesterday, studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong l├¬n bß║úng ─æ├║ng', pointsChanged: 10, recordedBy: 'Sao ─æß╗Å Tß╗ò 1', note: 'Giß║úi b├ái tß║¡p n├óng cao ─Éß║íi sß╗æ', timestamp: Date.now() - 4000 },
    // Tß╗ò tr╞░ß╗ƒng Tß╗ò 1 D╞░╞íng Lß╗Ñc Yß║┐n Vy l├ám tß╗æt nhiß╗çm vß╗Ñ
    { id: 'log_05', date: today, studentId: 'hs_10a3_43', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ l├ám tß╗æt nhiß╗çm vß╗Ñ th├íng', pointsChanged: 20, recordedBy: 'GVCN', note: '─É├┤n ─æß╗æc Tß╗ò 1 ho├án th├ánh 100% b├ái tß║¡p', timestamp: Date.now() - 5000 },
    // Tß╗ò tr╞░ß╗ƒng Tß╗ò 4 Nguyß╗àn Ngß╗ìc Trinh nß╗ù lß╗▒c
    { id: 'log_06', date: today, studentId: 'hs_10a3_35', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Hß╗ìc sinh yß║┐u c├│ nß╗ù lß╗▒c l├ám b├ái', pointsChanged: 10, recordedBy: 'GV Bß╗Ö m├┤n', note: 'Ho├án th├ánh tß╗æt nhiß╗çm vß╗Ñ tß╗ò tr╞░ß╗ƒng', timestamp: Date.now() - 6000 },
    // Tß╗ò tr╞░ß╗ƒng Tß╗ò 6 Tr╞░╞íng Thß╗ï Mß╗╣ Ng├ón
    { id: 'log_07', date: today, studentId: 'hs_10a3_23', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ l├ám tß╗æt nhiß╗çm vß╗Ñ th├íng', pointsChanged: 20, recordedBy: 'GVCN', note: 'Tß╗ò 6 xß║┐p hß║íng nhß║Ñt tuß║ºn', timestamp: Date.now() - 7000 },
    // Nguyß╗àn Quß╗æc Huy nß╗ù lß╗▒c
    { id: 'log_08', date: today, studentId: 'hs_10a3_11', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Hß╗ìc sinh yß║┐u c├│ nß╗ù lß╗▒c l├ám b├ái', pointsChanged: 10, recordedBy: 'GVCN', note: 'Tiß║┐n bß╗Ö r├╡ rß╗çt', timestamp: Date.now() - 8000 }
  ];

  // Nh├ón bß║ún dß╗» liß╗çu ─æß╗â tr├ính xung ─æß╗Öt
  appState.students = JSON.parse(JSON.stringify(OFFICIAL_10A3_STUDENTS));
  appState.dailyLogs = sampleLogs;
  saveDataToStorage();
  refreshAllUI();

  if (notify) {
    showToast('─É├ú nß║íp danh s├ích 45 hß╗ìc sinh ch├¡nh thß╗⌐c ph├ón bß╗ò c├ón bß║▒ng lß╗▒c hß╗ìc 6 tß╗ò!', 'success');
  }
}

// Reset to├án bß╗Ö vß╗ü trß║»ng
function resetAllData() {
  if (confirm('Cß║óNH B├üO: Bß║ín c├│ chß║»c chß║»n muß╗æn x├│a TO├ÇN Bß╗ÿ dß╗» liß╗çu hß╗ìc sinh v├á nhß║¡t k├╜ thi ─æua kh├┤ng?')) {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    appState.students = [];
    appState.dailyLogs = [];
    appState.selectedStudentIds.clear();
    refreshAllUI();
    showToast('─É├ú ─æß║╖t lß║íi to├án bß╗Ö hß╗ç thß╗æng vß╗ü trß║íng th├íi ban ─æß║ºu.', 'info');
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

  showToast('─É├ú xuß║Ñt file dß╗▒ ph├▓ng JSON th├ánh c├┤ng!', 'success');
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
        showToast(`─É├ú phß╗Ñc hß╗ôi th├ánh c├┤ng ${appState.students.length} hß╗ìc sinh v├á ${appState.dailyLogs.length} nhß║¡t k├╜!`, 'success');
      } else {
        showToast('File JSON kh├┤ng ─æ├║ng ─æß╗ïnh dß║íng dß╗» liß╗çu Lß╗¢p 10A3!', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lß╗ùi khi ─æß╗ìc file JSON!', 'error');
    }
  };
  reader.readAsText(file);
}

// ==================== TIß╗åN ├ìCH Hß╗å THß╗ÉNG ====================
function refreshAllUI() {
  renderDashboardStats();
  renderCharts();
  renderLeaderboard();
  renderScoringStudentPills();
  renderStudentsTable();
  renderLogsTable();
  renderScoringPermissionsUI();
  updateResetButtonsVisibility();
  if (typeof renderCadreDuties === 'function') {
    renderCadreDuties();
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
// ==================== CHß╗¿C N─éNG S╞á ─Éß╗Æ Lß╗ÜP Hß╗îC (SEATING PLAN) ====================
// ==================== 2 D├âY ΓÇó 6 Tß╗ö ΓÇó 24 B├ÇN ─É├öI ΓÇó 48 Vß╗è TR├ì NGß╗ÆI ====================
// ==========================================================================

/**
 * Tß║ío danh s├ích s╞í ─æß╗ô chß╗ù ngß╗ôi chuß║⌐n ban ─æß║ºu
 * Ph├ón bß╗ò ─æ├┤i bß║ín c├╣ng tiß║┐n (10 HS diß╗çn hß╗ù trß╗ú ngß╗ôi cß║ính Lß╗¢p tr╞░ß╗ƒng, Tß╗ò tr╞░ß╗ƒng, Sao ─æß╗Å, C├ín sß╗▒)
 */
function getDefaultSeating() {
  return [
    // ==================== D├âY 1 (Ph├¡a Cß╗¡a Sß╗ò) - 12 B├ÇN (Tß╗ö 1, 2, 3) ====================
    // --- Tß╗ö 1 (B├án 1 -> 4) ---
    // [H├ÇNG 1: B├ÇN 1 GH├ëP B├ÇN 2 - B├ÇN ─Éß║ªU TI├èN S├üT Bß╗ñC GIß║óNG]
    {
      tableId: 'tbl_d1_t1',
      row: 1,
      groupNumber: 1,
      tableInGroup: 1,
      globalTable: 1,
      pairWithTable: 2,
      title: 'B├án 1',
      subtitle: 'Gh├⌐p B├án 2',
      leftSeat: { seatId: 'seat_r1_g1_t1_l', position: 'left', studentId: 'hs_10a3_41' }, // L├¬ Gia V┼⌐ (35─æ)
      rightSeat: { seatId: 'seat_r1_g1_t1_r', position: 'right', studentId: 'hs_10a3_25' } // V├╡ Thß╗ï Yß║┐n Nhi (34─æ) [─Éß╗òi chß╗ù vß╗¢i Vinh Khang - B├án 1 D├úy 1 s├ít bß╗Ñc giß║úng]
    },
    {
      tableId: 'tbl_d1_t2',
      row: 1,
      groupNumber: 1,
      tableInGroup: 2,
      globalTable: 2,
      pairWithTable: 1,
      title: 'B├án 2',
      subtitle: 'Gh├⌐p B├án 1',
      leftSeat: { seatId: 'seat_r1_g1_t2_l', position: 'left', studentId: 'hs_10a3_26' }, // Cao Ngß╗ìc An Nhi├¬n (39─æ, hß╗ìc rß║Ñt giß╗Åi, g╞░╞íng mß║½u)
      rightSeat: { seatId: 'seat_r1_g1_t2_r', position: 'right', studentId: 'hs_10a3_14' } // Nguyß╗àn Vinh Khang (Hß╗ù trß╗ú - 28─æ) [─Éß╗òi chß╗ù vß╗¢i Yß║┐n Nhi - An Nhi├¬n k├¿m Vinh Khang]
    },
    // [H├ÇNG 2: B├ÇN 3 GH├ëP B├ÇN 4 - Tß╗ö TR╞»ß╗₧NG NGß╗ÆI H├ÇNG SAU ─Éß╗é BAO QU├üT Tß╗ö]
    {
      tableId: 'tbl_d1_t3',
      row: 1,
      groupNumber: 1,
      tableInGroup: 3,
      globalTable: 3,
      pairWithTable: 4,
      title: 'B├án 3',
      subtitle: 'Gh├⌐p B├án 4',
      leftSeat: { seatId: 'seat_r1_g1_t3_l', position: 'left', studentId: 'hs_10a3_30' }, // Trß║ºn Thß╗ï Ngß╗ìc Ph├║c (Sao ─æß╗Å - 36─æ) [─Éß╗òi chß╗ù vß╗¢i Yß║┐n Vy]
      rightSeat: { seatId: 'seat_r1_g1_t3_r', position: 'right', studentId: 'hs_10a3_32' } // L├¬ Tuß║Ñn Ph├ít T├ái (C├ín sß╗▒ To├ín - 34─æ)
    },
    {
      tableId: 'tbl_d1_t4',
      row: 1,
      groupNumber: 1,
      tableInGroup: 4,
      globalTable: 4,
      pairWithTable: 3,
      title: 'B├án 4',
      subtitle: 'Gh├⌐p B├án 3',
      leftSeat: { seatId: 'seat_r1_g1_t4_l', position: 'left', studentId: 'hs_10a3_43' }, // D╞░╞íng Lß╗Ñc Yß║┐n Vy (Tß╗ö TR╞»ß╗₧NG Tß╗ö 1 - 34─æ) [─Éß╗òi chß╗ù vß╗¢i Ngß╗ìc Ph├║c]
      rightSeat: { seatId: 'seat_r1_g1_t4_r', position: 'right', studentId: 'hs_10a3_28' } // V├╡ Th├ánh Ph├ít (36─æ)
    },

    // --- Tß╗ö 2 (B├án 5 -> 8) ---
    // [H├ÇNG 3: B├ÇN 5 GH├ëP B├ÇN 6]
    {
      tableId: 'tbl_d1_t5',
      row: 1,
      groupNumber: 2,
      tableInGroup: 1,
      globalTable: 5,
      pairWithTable: 6,
      title: 'B├án 5',
      subtitle: 'Gh├⌐p B├án 6',
      leftSeat: { seatId: 'seat_r1_g2_t1_l', position: 'left', studentId: 'hs_10a3_03' }, // Tß╗½ Diß╗çu Y├¬n Diß╗àm (33─æ)
      rightSeat: { seatId: 'seat_r1_g2_t1_r', position: 'right', studentId: 'hs_10a3_42' } // L├¬ V─ân V┼⌐ (Lß╗¢p ph├│ Hß╗ìc tß║¡p & CS L├╜ - 39─æ) [─Éß╗òi chß╗ù vß╗¢i Thanh Tuyß╗ün 12/01]
    },
    {
      tableId: 'tbl_d1_t6',
      row: 1,
      groupNumber: 2,
      tableInGroup: 2,
      globalTable: 6,
      pairWithTable: 5,
      title: 'B├án 6',
      subtitle: 'Gh├⌐p B├án 5',
      leftSeat: { seatId: 'seat_r1_g2_t2_l', position: 'left', studentId: 'hs_10a3_33' }, // ─Éß╗ù Quß╗æc Th├ánh (35─æ) [─Éß╗òi chß╗ù vß╗¢i Ngß╗ìc Trinh]
      rightSeat: { seatId: 'seat_r1_g2_t2_r', position: 'right', studentId: 'hs_10a3_06' } // Tr╞░╞íng Nguyß╗àn Tr╞░ß╗¥ng Giang (35─æ)
    },
    // [H├ÇNG 4: B├ÇN 7 GH├ëP B├ÇN 8 - T├üCH GIA NGUY├èN & GIA V┼¿ Vß╗Ç 2 PH├ìA NGO├ÇI C├ÖNG]
    {
      tableId: 'tbl_d1_t7',
      row: 1,
      groupNumber: 2,
      tableInGroup: 3,
      globalTable: 7,
      pairWithTable: 8,
      title: 'B├án 7',
      subtitle: 'Gh├⌐p B├án 8',
      leftSeat: { seatId: 'seat_r1_g2_t3_l', position: 'left', studentId: 'hs_10a3_38' }, // Nguyß╗àn Thß╗ï Thanh Tuyß╗ün (12/01) (Hß╗ù trß╗ú - 31─æ) [─Éß╗òi chß╗ù vß╗¢i V─ân V┼⌐]
      rightSeat: { seatId: 'seat_r1_g2_t3_r', position: 'right', studentId: 'hs_10a3_35' } // Nguyß╗àn Ngß╗ìc Trinh (Tß╗ò tr╞░ß╗ƒng T5 - 29─æ) [─Éß╗òi chß╗ù vß╗¢i Quß╗æc Th├ánh]
    },
    {
      tableId: 'tbl_d1_t8',
      row: 1,
      groupNumber: 2,
      tableInGroup: 4,
      globalTable: 8,
      pairWithTable: 7,
      title: 'B├án 8',
      subtitle: 'Gh├⌐p B├án 7',
      leftSeat: { seatId: 'seat_r1_g2_t4_l', position: 'left', studentId: 'hs_10a3_02' }, // Nguyß╗àn Thß╗ï Kim B╞í (C├ín sß╗▒ V─ân - 33─æ) [Hß╗ìc tß╗æt]
      rightSeat: { seatId: 'seat_r1_g2_t4_r', position: 'right', studentId: 'hs_10a3_16' } // Nguyß╗àn Tß║Ñn Kß╗│ (37─æ)
    },

    // --- Tß╗ö 3 (B├án 9 -> 12) ---
    // [H├ÇNG 5: B├ÇN 9 GH├ëP B├ÇN 10]
    {
      tableId: 'tbl_d1_t9',
      row: 1,
      groupNumber: 3,
      tableInGroup: 1,
      globalTable: 9,
      pairWithTable: 10,
      title: 'B├án 9',
      subtitle: 'Gh├⌐p B├án 10',
      leftSeat: { seatId: 'seat_r1_g3_t1_l', position: 'left', studentId: 'hs_10a3_37' }, // V├╡ B├ích T├╣ng (Sao ─æß╗Å - 34─æ) [─Éß╗òi chß╗ù vß╗¢i Ho├áng Long]
      rightSeat: { seatId: 'seat_r1_g3_t1_r', position: 'right', studentId: 'hs_10a3_20' } // Nguyß╗àn Bß║úo Long (38─æ) [B├án 9 Tß╗ò 3: B├ích T├╣ng & Bß║úo Long]
    },
    {
      tableId: 'tbl_d1_t10',
      row: 1,
      groupNumber: 3,
      tableInGroup: 2,
      globalTable: 10,
      pairWithTable: 9,
      title: 'B├án 10',
      subtitle: 'Gh├⌐p B├án 9',
      leftSeat: { seatId: 'seat_r1_g3_t2_l', position: 'left', studentId: 'hs_10a3_01' }, // Phan Thß╗ï Ngß╗ìc ß║¿n (35─æ)
      rightSeat: { seatId: 'seat_r1_g3_t2_r', position: 'right', studentId: 'hs_10a3_05' } // Trß║ºn Hß╗»u ─Éß╗ông (Hß╗ù trß╗ú - 33─æ) [─É├┤i bß║ín c├╣ng tiß║┐n]
    },
    // [H├ÇNG 6: B├ÇN 11 GH├ëP B├ÇN 12 - Tß╗ö TR╞»ß╗₧NG NGß╗ÆI H├ÇNG SAU ─Éß╗é BAO QU├üT Tß╗ö]
    {
      tableId: 'tbl_d1_t11',
      row: 1,
      groupNumber: 3,
      tableInGroup: 3,
      globalTable: 11,
      pairWithTable: 12,
      title: 'B├án 11',
      subtitle: 'Gh├⌐p B├án 12',
      leftSeat: { seatId: 'seat_r1_g3_t3_l', position: 'left', studentId: null }, // Ghß║┐ trß╗æng dß╗▒ ph├▓ng
      rightSeat: { seatId: 'seat_r1_g3_t3_r', position: 'right', studentId: 'hs_10a3_10' } // Trß║ºn Bß║úo Phi Ho├áng (39─æ) [Ngß╗ôi b├án gh├⌐p s├ít ph├¡a tr├¬n Kim Tr├║c]
    },
    {
      tableId: 'tbl_d1_t12',
      row: 1,
      groupNumber: 3,
      tableInGroup: 4,
      globalTable: 12,
      pairWithTable: 11,
      title: 'B├án 12',
      subtitle: 'Gh├⌐p B├án 11',
      leftSeat: { seatId: 'seat_r1_g3_t4_l', position: 'left', studentId: 'hs_10a3_04' }, // V├╡ Ngß╗ìc Mß╗╣ Duy├¬n (37─æ) [Ngß╗ôi s├ít cß║ính Kim Tr├║c]
      rightSeat: { seatId: 'seat_r1_g3_t4_r', position: 'right', studentId: 'hs_10a3_36' } // L├¬ Thß╗ï Kim Tr├║c (Tß╗ò tr╞░ß╗ƒng T3 - 34─æ)
    },

    // ==================== D├âY 2 (Ph├¡a Cß╗¡a Ra V├áo) - 12 B├ÇN (Tß╗ö 4, 5, 6) ====================
    // --- Tß╗ö 4 (B├án 1 -> 4) ---
    // [H├ÇNG 1: B├ÇN 1 GH├ëP B├ÇN 2 - B├ÇN ─Éß║ªU TI├èN S├üT Bß╗ñC GIß║óNG]
    {
      tableId: 'tbl_d2_t1',
      row: 2,
      groupNumber: 4,
      tableInGroup: 1,
      globalTable: 1,
      pairWithTable: 2,
      title: 'B├án 1',
      subtitle: 'Gh├⌐p B├án 2',
      leftSeat: { seatId: 'seat_r2_g4_t1_l', position: 'left', studentId: 'hs_10a3_07' }, // Tß║í Thanh Ngß╗ìc Gi├áu (B├¡ th╞░ - 26─æ, nhß╗Å con) [─Éß╗òi chß╗ù vß╗¢i ─Éan Mß║ích - B├án 1 D├úy 2 ghß║┐ tr├íi]
      rightSeat: { seatId: 'seat_r2_g4_t1_r', position: 'right', studentId: 'hs_10a3_22' } // Nguyß╗àn Hß╗»u ─Éan Mß║ích (39─æ, hß╗ìc giß╗Åi, nghi├¬m t├║c) [─Éß╗òi chß╗ù vß╗¢i Ngß╗ìc Gi├áu - B├án 1 D├úy 2 ghß║┐ phß║úi]
    },
    {
      tableId: 'tbl_d2_t2',
      row: 2,
      groupNumber: 4,
      tableInGroup: 2,
      globalTable: 2,
      pairWithTable: 1,
      title: 'B├án 2',
      subtitle: 'Gh├⌐p B├án 1',
      leftSeat: { seatId: 'seat_r2_g4_t2_l', position: 'left', studentId: 'hs_10a3_39' }, // Nguyß╗àn Thß╗ï Thanh Tuyß╗ün (14/06) (38─æ)
      rightSeat: { seatId: 'seat_r2_g4_t2_r', position: 'right', studentId: 'hs_10a3_45' } // ─Éß╗ù Kh├┤i Vß╗╣ (36─æ) [Kh├┤i Vß╗╣ l├¬n b├án ─æß║ºu s├ít bß╗Ñc giß║úng, kh├┤ng c├▓n l├ám viß╗çc ri├¬ng]
    },
    // [H├ÇNG 2: B├ÇN 3 GH├ëP B├ÇN 4 - Tß╗ö TR╞»ß╗₧NG NGß╗ÆI H├ÇNG SAU ─Éß╗é BAO QU├üT Tß╗ö]
    {
      tableId: 'tbl_d2_t3',
      row: 2,
      groupNumber: 4,
      tableInGroup: 3,
      globalTable: 3,
      pairWithTable: 4,
      title: 'B├án 3',
      subtitle: 'Gh├⌐p B├án 4',
      leftSeat: { seatId: 'seat_r2_g4_t3_l', position: 'left', studentId: 'hs_10a3_34' }, // Nguyß╗àn Ngß╗ìc Anh Th╞░ (Hß╗ù trß╗ú - 29─æ)
      rightSeat: { seatId: 'seat_r2_g4_t3_r', position: 'right', studentId: 'hs_10a3_15' } // V├╡ Quß╗æc Duy Kh├┤i (Tß╗ò tr╞░ß╗ƒng T4 & CS Anh - 35─æ) [─Éß╗òi chß╗ù vß╗¢i T╞░ß╗¥ng Vy]
    },
    {
      tableId: 'tbl_d2_t4',
      row: 2,
      groupNumber: 4,
      tableInGroup: 4,
      globalTable: 4,
      pairWithTable: 3,
      title: 'B├án 4',
      subtitle: 'Gh├⌐p B├án 3',
      leftSeat: { seatId: 'seat_r2_g4_t4_l', position: 'left', studentId: 'hs_10a3_44' }, // Phß║ím Ngß╗ìc T╞░ß╗¥ng Vy (34.5─æ, Hß╗ù trß╗ú) [─Éß╗òi chß╗ù vß╗¢i Duy Kh├┤i - ngß╗ôi cß║ính Diß╗àm Hß║▒ng]
      rightSeat: { seatId: 'seat_r2_g4_t4_r', position: 'right', studentId: 'hs_10a3_08' } // Ng├┤ Thß╗ï Diß╗àm Hß║▒ng (37─æ)
    },

    // --- Tß╗ö 5 (B├án 5 -> 8) ---
    // [H├ÇNG 3: B├ÇN 5 GH├ëP B├ÇN 6]
    {
      tableId: 'tbl_d2_t5',
      row: 2,
      groupNumber: 5,
      tableInGroup: 1,
      globalTable: 5,
      pairWithTable: 6,
      title: 'B├án 5',
      subtitle: 'Gh├⌐p B├án 6',
      leftSeat: { seatId: 'seat_r2_g5_t1_l', position: 'left', studentId: 'hs_10a3_18' }, // Nguyß╗àn ─Éß╗ù Kim Yß║┐n Linh (37─æ)
      rightSeat: { seatId: 'seat_r2_g5_t1_r', position: 'right', studentId: 'hs_10a3_40' } // Trß║ºn Ph├║c Vinh (Hß╗ù trß╗ú - 29─æ) [─É├┤i bß║ín c├╣ng tiß║┐n: Yß║┐n Linh k├¿m Ph├║c Vinh]
    },
    {
      tableId: 'tbl_d2_t6',
      row: 2,
      groupNumber: 5,
      tableInGroup: 2,
      globalTable: 6,
      pairWithTable: 5,
      title: 'B├án 6',
      subtitle: 'Gh├⌐p B├án 5',
      leftSeat: { seatId: 'seat_r2_g5_t2_l', position: 'left', studentId: 'hs_10a3_31' }, // Ho├áng Thß║┐ T├ái (35─æ)
      rightSeat: { seatId: 'seat_r2_g5_t2_r', position: 'right', studentId: null } // Ghß║┐ trß╗æng dß╗▒ ph├▓ng
    },
    // [H├ÇNG 4: B├ÇN 7 GH├ëP B├ÇN 8 - Tß╗ö TR╞»ß╗₧NG & Lß╗ÜP TR╞»ß╗₧NG NGß╗ÆI H├ÇNG SAU BAO QU├üT Tß╗ö]
    {
      tableId: 'tbl_d2_t7',
      row: 2,
      groupNumber: 5,
      tableInGroup: 3,
      globalTable: 7,
      pairWithTable: 8,
      title: 'B├án 7',
      subtitle: 'Gh├⌐p B├án 8',
      leftSeat: { seatId: 'seat_r2_g5_t3_l', position: 'left', studentId: 'hs_10a3_27' }, // Trß║ºn L├¬ Hß╗ông Nhung (Lß╗¢p tr╞░ß╗ƒng - 36─æ)
      rightSeat: { seatId: 'seat_r2_g5_t3_r', position: 'right', studentId: 'hs_10a3_12' } // ─Éß╗ù Tuß║Ñn H╞░ng (Hß╗ù trß╗ú - 29─æ) [─É├┤i bß║ín c├╣ng tiß║┐n: Hß╗ông Nhung k├¿m Tuß║Ñn H╞░ng]
    },
    {
      tableId: 'tbl_d2_t8',
      row: 2,
      groupNumber: 5,
      tableInGroup: 4,
      globalTable: 8,
      pairWithTable: 7,
      title: 'B├án 8',
      subtitle: 'Gh├⌐p B├án 7',
      leftSeat: { seatId: 'seat_r2_g5_t4_l', position: 'left', studentId: 'hs_10a3_09' }, // Nguyß╗àn Vinh Hoa (37─æ)
      rightSeat: { seatId: 'seat_r2_g5_t4_r', position: 'right', studentId: 'hs_10a3_24' } // Nguyß╗àn Ho├áng Gia Nguy├¬n (38─æ) [─Éß╗òi chß╗ù vß╗¢i Vinh Hoa]
    },

    // --- Tß╗ö 6 (B├án 9 -> 12) ---
    // [H├ÇNG 5: B├ÇN 9 GH├ëP B├ÇN 10]
    {
      tableId: 'tbl_d2_t9',
      row: 2,
      groupNumber: 6,
      tableInGroup: 1,
      globalTable: 9,
      pairWithTable: 10,
      title: 'B├án 9',
      subtitle: 'Gh├⌐p B├án 10',
      leftSeat: { seatId: 'seat_r2_g6_t1_l', position: 'left', studentId: 'hs_10a3_21' }, // Trß║ºn Minh Lu├ón (Hß╗ù trß╗ú - 25─æ) [B├án ─æß║ºu Tß╗ò 6]
      rightSeat: { seatId: 'seat_r2_g6_t1_r', position: 'right', studentId: 'hs_10a3_11' } // Nguyß╗àn Quß╗æc Huy (Lß╗¢p ph├│ Lao ─æß╗Öng - 23─æ) [─É├┤i bß║ín c├╣ng tiß║┐n: Bß║úo Long k├¿m Quß╗æc Huy]
    },
    {
      tableId: 'tbl_d2_t10',
      row: 2,
      groupNumber: 6,
      tableInGroup: 2,
      globalTable: 10,
      pairWithTable: 9,
      title: 'B├án 10',
      subtitle: 'Gh├⌐p B├án 9',
      leftSeat: { seatId: 'seat_r2_g6_t2_l', position: 'left', studentId: 'hs_10a3_17' }, // L├¬ Thß╗ï Mß╗╣ Linh (36─æ)
      rightSeat: { seatId: 'seat_r2_g6_t2_r', position: 'right', studentId: 'hs_10a3_19' } // B├╣i Nguyß╗àn Ho├áng Long (38─æ) [─Éß╗òi chß╗ù vß╗¢i B├ích T├╣ng]
    },
    // [H├ÇNG 6: B├ÇN 11 GH├ëP B├ÇN 12 - Tß╗ö TR╞»ß╗₧NG NGß╗ÆI H├ÇNG SAU ─Éß╗é BAO QU├üT Tß╗ö]
    {
      tableId: 'tbl_d2_t11',
      row: 2,
      groupNumber: 6,
      tableInGroup: 3,
      globalTable: 11,
      pairWithTable: 12,
      title: 'B├án 11',
      subtitle: 'Gh├⌐p B├án 12',
      leftSeat: { seatId: 'seat_r2_g6_t3_l', position: 'left', studentId: 'hs_10a3_23' }, // Tr╞░╞íng Thß╗ï Mß╗╣ Ng├ón (Tß╗ö TR╞»ß╗₧NG Tß╗ö 6 & CS Sinh - 38─æ)
      rightSeat: { seatId: 'seat_r2_g6_t3_r', position: 'right', studentId: 'hs_10a3_29' } // Nguyß╗àn Xu├ón Ph├║c (38─æ) [─É├┤i bß║ín hß╗ìc tß╗æt 38─æ ß╗ƒ h├áng sau]
    },
    {
      tableId: 'tbl_d2_t12',
      row: 2,
      groupNumber: 6,
      tableInGroup: 4,
      globalTable: 12,
      pairWithTable: 11,
      title: 'B├án 12',
      subtitle: 'Gh├⌐p B├án 11',
      leftSeat: { seatId: 'seat_r2_g6_t4_l', position: 'left', studentId: 'hs_10a3_13' }, // L├¬ Minh Khß║úi (37─æ) [Hß╗ìc sinh giß╗Åi 37─æ, tß╗▒ gi├íc tß╗æt ngß╗ôi b├án cuß╗æi]
      rightSeat: { seatId: 'seat_r2_g6_t4_r', position: 'right', studentId: null } // Ghß║┐ trß╗æng dß╗▒ ph├▓ng
    }
  ];
}

/**
 * Tß║úi dß╗» liß╗çu s╞í ─æß╗ô chß╗ù ngß╗ôi tß╗½ LocalStorage
 */
function loadSeatingData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEATING);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Kiß╗âm tra t├¡nh to├án vß║╣n (─æß╗º 24 b├án v├á chß╗⌐a c├íc hß╗ìc sinh cß╗ºa lß╗¢p)
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
    console.warn('Lß╗ùi khi ─æß╗ìc s╞í ─æß╗ô chß╗ù ngß╗ôi tß╗½ storage:', err);
  }
  // Mß║╖c ─æß╗ïnh tß║ío mß╗¢i
  appState.seating = getDefaultSeating();
  saveSeatingData();
}

/**
 * L╞░u dß╗» liß╗çu s╞í ─æß╗ô chß╗ù ngß╗ôi v├áo LocalStorage
 */
function saveSeatingData() {
  try {
    localStorage.setItem(STORAGE_KEYS.SEATING, JSON.stringify(appState.seating));
  } catch (err) {
    console.error('Kh├┤ng thß╗â l╞░u s╞í ─æß╗ô lß╗¢p:', err);
  }
}

/**
 * Render to├án bß╗Ö s╞í ─æß╗ô lß╗¢p hß╗ìc 24 b├án (4 b├án / tß╗ò, 3 tß╗ò / d├úy)
 */
function renderSeatingPlan() {
  if (!appState.seating || appState.seating.length !== 24) {
    loadSeatingData();
  }

  // Render 6 tổ: Mỗi tổ có 4 bàn.
  // Chiều chuẩn theo Thầy Vỹ: Bảng ở DƯỚI CÙNG.
  // Cụm 2 (Hàng sau, xa Bảng hơn) ở TRÊN.
  // Cụm 1 (Hàng trước, sát Bảng hơn) ở DƯỚI.
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

  // Áp dụng bộ lọc hoặc tìm kiếm nếu có
  applySeatingFilters();
}

/**
 * Tß║ío phß║ºn tß╗¡ DOM cho 1 Cß╗Ñm B├án Gh├⌐p (2 b├án k├¬ gh├⌐p s├ít nhau: B├án 1 + B├án 2; B├án 3 + B├án 4...)
 */
function renderPairedDesksCluster(table1, table2, groupNumber) {
  const cluster = document.createElement('div');
  cluster.className = 'paired-desk-cluster bg-white dark:bg-slate-800 p-2 sm:p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-teal-400 transition shadow-xs';

  const desksGrid = document.createElement('div');
  desksGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch';

  const desk1 = renderDeskElement(table1);
  const desk2 = renderDeskElement(table2);

  // Xoay chuẩn 180 độ theo góc nhìn giáo viên ngồi bàn giáo viên: Bàn 2 bên trái, Bàn 1 bên phải
  desksGrid.appendChild(desk2);
  desksGrid.appendChild(desk1);
  cluster.appendChild(desksGrid);

  return cluster;
}

/**
 * Tß║ío phß║ºn tß╗¡ DOM cho 1 b├án hß╗ìc (gß╗ôm 2 chß╗ù ngß╗ôi, chß╗ë ─æß╗â lß║íi t├¬n hß╗ìc sinh)
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

  // Xoay chuẩn 180 độ theo góc nhìn giáo viên: Ghế bên phải bàn ở bên trái, ghế bên trái bàn ở bên phải
  seatsContainer.appendChild(rightSeatEl);
  seatsContainer.appendChild(leftSeatEl);
  desk.appendChild(seatsContainer);

  return desk;
}

/**
 * Tß║ío phß║ºn tß╗¡ DOM cho 1 chß╗ù ngß╗ôi (ghß║┐ hß╗ìc sinh hoß║╖c ghß║┐ trß╗æng)
 */
function renderSeatSlot(table, seat) {
  const slot = document.createElement('div');
  slot.dataset.seatId = seat.seatId;

  // Drag & drop event listeners
  slot.ondragover = handleSeatDragOver;
  slot.ondragleave = handleSeatDragLeave;
  slot.ondrop = (e) => handleSeatDrop(e, seat.seatId);

  // Nß║┐u l├á ghß║┐ trß╗æng
  if (!seat.studentId) {
    slot.className = 'seat-empty p-2.5 flex items-center justify-center text-center cursor-pointer min-h-[58px] rounded-xl';
    slot.innerHTML = `<span class="text-xs text-slate-400 font-semibold italic">(Trß╗æng)</span>`;
    slot.onclick = () => handleSeatClick(seat.seatId, null);
    return slot;
  }

  // T├¼m hß╗ìc sinh
  const student = appState.students.find(s => s.id === seat.studentId);
  if (!student) {
    slot.className = 'seat-empty p-2.5 flex items-center justify-center text-center cursor-pointer min-h-[58px] rounded-xl';
    slot.innerHTML = `<span class="text-xs text-slate-400 font-semibold italic">(Trß╗æng)</span>`;
    return slot;
  }

  const score = calculateStudentScore(student.id);
  const tier = getRankingTier(score);

  // Kiß╗âm tra nß║┐u l├á ghß║┐ ─æang ─æ╞░ß╗úc chß╗ìn ─æß╗â swap
  const isSwapSource = appState.swapSourceSeatId === seat.seatId;

  // Styling ghß║┐: Tß║¡p trung hiß╗ân thß╗ï Hß╗ì v├á T├¬n hß╗ìc sinh r├╡ n├⌐t, kh├┤ng bß╗ï co ngß║»n
  slot.className = `seat-card p-2 sm:p-2.5 min-h-[58px] flex flex-col justify-center items-center text-center relative rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs transition ${isSwapSource ? 'seat-swap-source' : ''}`;
  slot.draggable = true;
  slot.ondragstart = (e) => handleSeatDragStart(e, seat.seatId);

  // Chß╗⌐c danh nhß╗Å gß╗ìn (hß╗ù trß╗ú ki├¬m nhiß╗çm chß╗⌐c vß╗Ñ)
  let roleBadgeHtml = '';
  if (student.role && student.role !== 'Th├ánh vi├¬n') {
    const badges = [];
    if (student.role.includes('Lß╗¢p tr╞░ß╗ƒng')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-lead">LT</span>');
    if (student.role.includes('Lß╗¢p ph├│ Lao ─æß╗Öng')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-deputy">LP L─É</span>');
    else if (student.role.includes('Lß╗¢p ph├│')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-deputy">LP</span>');
    if (student.role.includes('B├¡ th╞░')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-sec">BT</span>');
    if (student.role.includes('Tß╗ò tr╞░ß╗ƒng')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-group">TT</span>');
    if (student.role.includes('Sao ─æß╗Å')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold badge-role-redstar">S─É</span>');
    if (student.role.includes('To├ín')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">To├ín</span>');
    if (student.role.includes('L├╜')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">L├╜</span>');
    if (student.role.includes('H├│a')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200">H├│a</span>');
    if (student.role.includes('Anh')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Anh</span>');
    if (student.role.includes('Sinh')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-teal-50 text-teal-700 border border-teal-200">Sinh</span>');
    if (student.role.includes('V─ân')) badges.push('<span class="text-[9px] px-1 py-0.2 rounded font-bold bg-pink-50 text-pink-700 border border-pink-200">V─ân</span>');
    roleBadgeHtml = badges.join('');
  }

  const peerBadgeHtml = student.isSpecialSupport ? 
    '<span class="text-[9px] text-amber-600 font-bold ml-1" title="Diß╗çn k├¿m cß║╖p">≡ƒñ¥</span>' : '';

  slot.innerHTML = `
    <div class="w-full flex items-center justify-between mb-0.5 px-0.5 text-[10px]">
      <span class="font-bold ${tier.color.split(' ')[0]}">${score}─æ</span>
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

// ==================== Xß╗¼ L├¥ CLICK & ─Éß╗öI CHß╗û (SWAP & ACTIONS) ====================

/**
 * Bß║¡t / Tß║»t chß║┐ ─æß╗Ö ─æß╗òi chß╗ù
 */
function toggleSwapMode(forceState) {
  if (appState.currentUserRole === 'member') {
    showToast('Bß║ín ─æang ß╗ƒ Chß║┐ ─æß╗Ö Chß╗ë Xem! Vui l├▓ng ─æ─âng nhß║¡p C├ín sß╗▒ hoß║╖c GVCN ─æß╗â sß║»p xß║┐p chß╗ù ngß╗ôi.', 'warning');
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
    if (btnText) btnText.textContent = 'Tho├ít ─Éß╗òi Chß╗ù';
    if (banner) banner.classList.remove('hidden');
    showToast('─É├ú Bß║¼T Chß║┐ ─æß╗Ö ─Éß╗òi chß╗ù: H├úy chß╗ìn hß╗ìc sinh thß╗⌐ nhß║Ñt!', 'info');
  } else {
    if (btn) btn.className = 'inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition';
    if (btnText) btnText.textContent = 'Chß║┐ ─Éß╗Ö ─Éß╗òi Chß╗ù';
    if (banner) banner.classList.add('hidden');
  }

  renderSeatingPlan();
}

/**
 * Click v├áo ghß║┐ ngß╗ôi
 */
function handleSeatClick(seatId, studentId) {
  // Nß║┐u ─æang ß╗ƒ Swap Mode
  if (appState.isSwapMode) {
    if (!appState.swapSourceSeatId) {
      // Chß╗ìn nguß╗ôn
      if (!studentId) {
        showToast('Vui l├▓ng chß╗ìn mß╗Öt hß╗ìc sinh tr╞░ß╗¢c ─æß╗â ho├ín ─æß╗òi chß╗ù!', 'warning');
        return;
      }
      appState.swapSourceSeatId = seatId;
      const student = appState.students.find(s => s.id === studentId);
      const bannerText = document.getElementById('swap-banner-text');
      if (bannerText && student) {
        bannerText.textContent = `─Éang chß╗ìn: ${student.fullName}. H├úy bß║Ñm v├áo chß╗ù ngß╗ôi thß╗⌐ hai (hoß║╖c ghß║┐ trß╗æng) ─æß╗â ─æß╗òi!`;
      }
      renderSeatingPlan();
    } else {
      // ─É├ú c├│ nguß╗ôn, chß╗ìn ─æ├¡ch
      if (appState.swapSourceSeatId === seatId) {
        // Hß╗ºy chß╗ìn
        appState.swapSourceSeatId = null;
        renderSeatingPlan();
        return;
      }
      // Thß╗▒c hiß╗çn ─æß╗òi chß╗ù
      executeSeatSwap(appState.swapSourceSeatId, seatId);
      appState.swapSourceSeatId = null;
      renderSeatingPlan();
    }
    return;
  }

  // Nß║┐u kh├┤ng ß╗ƒ Swap Mode
  if (studentId) {
    openSeatActionModal(seatId, studentId);
  } else {
    // Ghß║┐ trß╗æng: hß╗Åi xem c├│ muß╗æn bß║¡t chß║┐ ─æß╗Ö ─æß╗òi chß╗ù ─æß╗â chuyß╗ân ai v├áo ─æ├óy kh├┤ng
    if (confirm('Ghß║┐ n├áy hiß╗çn ─æang trß╗æng. Bß║ín c├│ muß╗æn chß╗ìn mß╗Öt hß╗ìc sinh ─æß╗â chuyß╗ân v├áo vß╗ï tr├¡ n├áy kh├┤ng?')) {
      toggleSwapMode(true);
    }
  }
}

/**
 * Ho├ín ─æß╗òi 2 ghß║┐ ngß╗ôi
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
    showToast('Lß╗ùi: Kh├┤ng t├¼m thß║Ñy vß╗ï tr├¡ ghß║┐ ngß╗ôi!', 'error');
    return;
  }

  const tempStudentId = seat1Ref.studentId;
  seat1Ref.studentId = seat2Ref.studentId;
  seat2Ref.studentId = tempStudentId;

  saveSeatingData();

  const student1 = appState.students.find(s => s.id === seat1Ref.studentId);
  const student2 = appState.students.find(s => s.id === seat2Ref.studentId);

  const name1 = student1 ? student1.fullName : 'Ghß║┐ trß╗æng';
  const name2 = student2 ? student2.fullName : 'Ghß║┐ trß╗æng';

  showToast(`─É├ú ho├ín ─æß╗òi chß╗ù ngß╗ôi giß╗»a "${name1}" v├á "${name2}"!`, 'success');
}

// ==================== K├ëO THß║ó (DRAG & DROP) ====================

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

// ==================== MODAL THAO T├üC NHANH TR├èN GHß║╛ ====================

function openSeatActionModal(seatId, studentId) {
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  appState.activeModalSeat = { seatId, studentId };

  // T├¼m th├┤ng tin b├án
  let tableInfo = '';
  for (const t of appState.seating) {
    if (t.leftSeat.seatId === seatId) tableInfo = `${t.title} ΓÇó D├úy ${t.row} ΓÇó Vß╗ï tr├¡ Tr├íi`;
    if (t.rightSeat.seatId === seatId) tableInfo = `${t.title} ΓÇó D├úy ${t.row} ΓÇó Vß╗ï tr├¡ Phß║úi`;
  }

  const score = calculateStudentScore(student.id);
  const tier = getRankingTier(score);

  document.getElementById('seat-action-student-name').textContent = student.fullName;
  document.getElementById('seat-action-meta').textContent = tableInfo || `Tß╗ò ${student.groupNumber} ΓÇó ${student.role}`;
  document.getElementById('seat-action-score').textContent = `${score}─æ`;
  
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
 * Chß║Ñm ─æiß╗âm nhanh tß╗½ ghß║┐ ngß╗ôi
 */
function quickSeatScoring(ruleKey) {
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bß║ín ─æang ß╗ƒ Chß║┐ ─æß╗Ö Chß╗ë Xem! Vui l├▓ng ─æ─âng nhß║¡p C├ín sß╗▒ hoß║╖c GVCN ─æß╗â chß║Ñm ─æiß╗âm.', 'warning');
    return;
  }
  if (!appState.activeModalSeat) return;
  const { studentId, seatId } = appState.activeModalSeat;
  const student = appState.students.find(s => s.id === studentId);
  if (!student) return;

  if (appState.currentUserRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(appState.currentUserRole.replace('lead_t', ''), 10);
    if (Number(student.groupNumber) !== leaderGroup) {
      showToast(`Bß║ín l├á Tß╗ò tr╞░ß╗ƒng Tß╗ò ${leaderGroup}, chß╗ë ─æ╞░ß╗úc chß║Ñm ─æiß╗âm cho hß╗ìc sinh Tß╗ò ${leaderGroup}!`, 'warning');
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
    recordedBy: 'GVCN / S╞í ─æß╗ô lß╗¢p',
    note: 'Chß║Ñm nhanh tr├¬n s╞í ─æß╗ô chß╗ù ngß╗ôi',
    timestamp: Date.now()
  };

  appState.dailyLogs.unshift(newLog);
  saveDataToStorage();

  const newScore = calculateStudentScore(student.id);
  const tier = getRankingTier(newScore);

  // Update modal score
  document.getElementById('seat-action-score').textContent = `${newScore}─æ`;
  const rankEl = document.getElementById('seat-action-rank');
  rankEl.textContent = tier.label;
  rankEl.className = `px-2 py-0.5 rounded-full font-bold text-[11px] ${tier.color}`;

  showToast(`─É├ú ghi nhß║¡n: ${rule.label} (${rule.points > 0 ? '+' : ''}${rule.points}─æ) cho ${student.fullName}!`, rule.points > 0 ? 'success' : 'warning');

  // Cß║¡p nhß║¡t lß║íi s╞í ─æß╗ô v├á thß╗æng k├¬
  renderDashboardStats();
  renderSeatingPlan();
}

/**
 * Bß║»t ─æß║ºu ─æß╗òi chß╗ù tß╗½ Modal
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
  if (btnText) btnText.textContent = 'Tho├ít ─Éß╗òi Chß╗ù';
  if (banner) banner.classList.remove('hidden');

  const student = appState.students.find(s => s.id === appState.activeModalSeat?.studentId);
  const bannerText = document.getElementById('swap-banner-text');
  if (bannerText && student) {
    bannerText.textContent = `─Éang chß╗ìn: ${student.fullName}. Bß║Ñm v├áo ghß║┐ thß╗⌐ hai (hoß║╖c ghß║┐ trß╗æng) ─æß╗â ─æß╗òi!`;
  }

  showToast('─Éang chß╗ìn hß╗ìc sinh. H├úy click v├áo vß╗ï tr├¡ bß║ín muß╗æn ho├ín ─æß╗òi!', 'info');
  renderSeatingPlan();
}

/**
 * Xem lß╗ïch sß╗¡ hß╗ìc sinh tß╗½ Modal chß╗ù ngß╗ôi
 */
function viewStudentDetailsFromModal() {
  if (!appState.activeModalSeat) return;
  const studentId = appState.activeModalSeat.studentId;
  closeSeatActionModal();
  openDetailModal(studentId);
}

// ==================== T├îM KIß║╛M, Bß╗ÿ Lß╗îC & IN ß║ñN ====================

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

    // T├¼m hß╗ìc sinh
    let studentId = null;
    for (const t of appState.seating) {
      if (t.leftSeat.seatId === seatId) studentId = t.leftSeat.studentId;
      if (t.rightSeat.seatId === seatId) studentId = t.rightSeat.studentId;
    }

    if (!studentId) return;
    const student = appState.students.find(s => s.id === studentId);
    if (!student) return;

    const score = calculateStudentScore(student.id);

    // Kiß╗âm tra search
    let matchSearch = true;
    if (query) {
      const matchName = student.fullName.toLowerCase().includes(query);
      const matchCode = (student.studentCode || '').toLowerCase().includes(query);
      matchSearch = matchName || matchCode;
    }

    // Kiß╗âm tra filter
    let matchFilter = true;
    if (filter === 'leaders') {
      matchFilter = ['Lß╗¢p tr╞░ß╗ƒng', 'Lß╗¢p ph├│', 'B├¡ th╞░', 'Tß╗ò tr╞░ß╗ƒng', 'Sao ─æß╗Å'].some(k => student.role && student.role.includes(k)) || (student.role && (student.role.includes('C├ín sß╗▒') || student.role.includes('CS')));
    } else if (filter === 'special') {
      matchFilter = !!student.isSpecialSupport;
    } else if (filter === 'tutoring') {
      // Hß╗ìc sinh hß╗ù trß╗ú hoß║╖c c├ín sß╗▒ ngß╗ôi c├╣ng b├án
      matchFilter = !!student.isSpecialSupport || ['Lß╗¢p tr╞░ß╗ƒng', 'Lß╗¢p ph├│', 'Tß╗ò tr╞░ß╗ƒng', 'Sao ─æß╗Å'].includes(student.role) || (student.role && student.role.startsWith('C├ín sß╗▒'));
    } else if (filter === 'low-score') {
      matchFilter = score < 80;
    }

    // ├üp dß╗Ñng style
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
 * Kh├┤i phß╗Ñc s╞í ─æß╗ô chuß║⌐n theo m├┤ h├¼nh ─É├┤i bß║ín c├╣ng tiß║┐n
 */
function confirmResetDefaultSeating() {
  if (confirm('Bß║ín c├│ chß║»c chß║»n muß╗æn kh├┤i phß╗Ñc lß║íi S╞í ─æß╗ô chß╗ù ngß╗ôi chuß║⌐n (─É├┤i bß║ín c├╣ng tiß║┐n: 10 hß╗ìc sinh diß╗çn hß╗ù trß╗ú ngß╗ôi cß║ính C├ín sß╗▒ / Bß║ín hß╗ìc tß╗æt)?')) {
    appState.seating = getDefaultSeating();
    saveSeatingData();
    renderSeatingPlan();
    showToast('─É├ú kh├┤i phß╗Ñc S╞í ─æß╗ô chß╗ù ngß╗ôi chuß║⌐n th├ánh c├┤ng!', 'success');
  }
}

/**
 * In s╞í ─æß╗ô lß╗¢p hß╗ìc ra file A4
 */
/**
 * Sinh m├ú HTML cho Bß║ún In S╞í ─Éß╗ô Lß╗¢p Hß╗ìc Chuß║⌐n A4 Khß╗ò Ngang (Fit 1 Trang 100%)
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
    if (student.role.includes('Lớp trưởng')) tags.push('Lớp trưởng');
    if (student.role.includes('Lớp phó Học tập') || student.role.includes('LPHT')) tags.push('LPHT');
    if (student.role.includes('Thủ quỹ') || student.role.includes('TQ')) tags.push('TQ');
    if (student.role.includes('Lớp phó Lao động') || student.role.includes('LPLĐ')) tags.push('LPLĐ');
    if (student.role.includes('Bí thư')) tags.push('Bí thư');
    if (student.role.includes('Tổ trưởng')) tags.push('TT');
    if (student.role.includes('Sao đỏ')) tags.push('Sao đỏ');
    return tags.length > 0 ? ' (' + tags.join(', ') + ')' : '';
  };

  // Ô ghế ngồi: Nếu ghế trống, để trắng hoàn toàn
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

  // Cụm 4 ghế xoay chuẩn 180 độ theo góc nhìn giáo viên: t2.right -> t2.left -> t1.right -> t1.left
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

  const g1 = appState.seating.filter(t => t.groupNumber === 1);
  const g2 = appState.seating.filter(t => t.groupNumber === 2);
  const g3 = appState.seating.filter(t => t.groupNumber === 3);
  const g4 = appState.seating.filter(t => t.groupNumber === 4);
  const g5 = appState.seating.filter(t => t.groupNumber === 5);
  const g6 = appState.seating.filter(t => t.groupNumber === 6);

  return `
    <div class="print-page-box bg-white text-black font-sans text-[11px] leading-tight w-full max-w-[285mm] mx-auto p-2">
      <!-- HEADER CHUẨN THEO GVCN THẦY NGUYỄN VỸ -->
      <div class="text-center pb-2">
        <h1 class="text-sm md:text-base font-extrabold uppercase tracking-wide text-black">
          GVCN: Thầy Nguyễn Vỹ | Năm học: 2026 – 2027
        </h1>
        <p class="text-xs italic font-semibold text-blue-900 mt-0.5">
          &ldquo;Kỷ luật tạo sức mạnh - Tri thức dẫn tương lai&rdquo;
        </p>
      </div>

      <!-- SƠ ĐỒ CHỖ NGỒI: 6 HÀNG XẾP TỪ TRÊN (CUỐI LỚP) XUỐNG DƯỚI (SÁT BẢNG) -->
      <div class="space-y-2 my-2">

        <!-- KHỐI 3: TỔ 6 (BÊN TRÁI) & TỔ 3 (BÊN PHẢI) - HÀNG 6 & HÀNG 5 (CUỐI LỚP) -->
        <div class="grid grid-cols-12 gap-2 items-center">
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g6[2], g6[3])} <!-- Hàng 6 (Bàn 11+12) -->
            ${renderClusterRow(g6[0], g6[1])} <!-- Hàng 5 (Bàn 9+10) -->
          </div>
          <div class="col-span-2 flex items-center justify-center space-x-1 font-bold text-xs text-slate-800">
            <span>Tổ 6</span>
            <span class="text-lg text-slate-600 font-serif font-black">}</span>
            <span class="text-lg text-slate-600 font-serif font-black">{</span>
            <span>Tổ 3</span>
          </div>
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g3[2], g3[3])} <!-- Hàng 6 (Bàn 11+12) -->
            ${renderClusterRow(g3[0], g3[1])} <!-- Hàng 5 (Bàn 9+10) -->
          </div>
        </div>

        <!-- KHỐI 2: TỔ 5 (BÊN TRÁI) & TỔ 2 (BÊN PHẢI) - HÀNG 4 & HÀNG 3 (GIỮA LỚP) -->
        <div class="grid grid-cols-12 gap-2 items-center">
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g5[2], g5[3])} <!-- Hàng 4 (Bàn 7+8) -->
            ${renderClusterRow(g5[0], g5[1])} <!-- Hàng 3 (Bàn 5+6) -->
          </div>
          <div class="col-span-2 flex items-center justify-center space-x-1 font-bold text-xs text-slate-800">
            <span>Tổ 5</span>
            <span class="text-lg text-slate-600 font-serif font-black">}</span>
            <span class="text-lg text-slate-600 font-serif font-black">{</span>
            <span>Tổ 2</span>
          </div>
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g2[2], g2[3])} <!-- Hàng 4 (Bàn 7+8) -->
            ${renderClusterRow(g2[0], g2[1])} <!-- Hàng 3 (Bàn 5+6) -->
          </div>
        </div>

        <!-- KHỐI 1: TỔ 4 (BÊN TRÁI) & TỔ 1 (BÊN PHẢI) - HÀNG 2 & HÀNG 1 (SÁT BẢNG) -->
        <div class="grid grid-cols-12 gap-2 items-center">
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g4[2], g4[3])} <!-- Hàng 2 (Bàn 3+4) -->
            ${renderClusterRow(g4[0], g4[1])} <!-- Hàng 1 (Bàn 1+2) -->
          </div>
          <div class="col-span-2 flex items-center justify-center space-x-1 font-bold text-xs text-slate-800">
            <span>Tổ 4</span>
            <span class="text-lg text-slate-600 font-serif font-black">}</span>
            <span class="text-lg text-slate-600 font-serif font-black">{</span>
            <span>Tổ 1</span>
          </div>
          <div class="col-span-5 space-y-1.5">
            ${renderClusterRow(g1[2], g1[3])} <!-- Hàng 2 (Bàn 3+4) -->
            ${renderClusterRow(g1[0], g1[1])} <!-- Hàng 1 (Bàn 1+2) -->
          </div>
        </div>

      </div>

      <!-- KHU VỰC ĐẦU LỚP (BẢNG, CỬA VÀO, BÀN GIÁO VIÊN) THEO GÓC NHÌN GIÁO VIÊN -->
      <div class="mt-4 pt-2 border-t border-slate-300">
        <div class="grid grid-cols-12 gap-3 items-center">
          <!-- CỬA RA VÀO (Bên trái dưới cùng kèm mũi tên vào bảng) -->
          <div class="col-span-3">
            <div class="border-2 border-slate-800 rounded px-3 py-2 text-center font-extrabold text-xs uppercase bg-white flex items-center justify-center space-x-2">
              <span class="tracking-widest">CỬA VÀO</span>
              <span class="text-base font-black">&rArr;</span>
            </div>
          </div>

          <!-- BẢNG ĐEN TRUNG TÂM -->
          <div class="col-span-6">
            <div class="border-2 border-slate-800 rounded py-2 text-center font-extrabold text-sm uppercase bg-white tracking-widest">
              BẢNG
            </div>
          </div>

          <!-- BÀN GIÁO VIÊN (Bên phải dưới cùng) -->
          <div class="col-span-3">
            <div class="border-2 border-slate-800 rounded py-2 text-center font-extrabold text-xs uppercase bg-white">
              BÀN GIÁO VIÊN
            </div>
          </div>
        </div>

        <!-- DÒNG NHẮC NHỞ GVBM -->
        <div class="mt-3 py-1.5 px-3 bg-amber-50 border border-amber-300 rounded text-center font-bold text-[11px] text-amber-900 shadow-2xs">
          Kính nhờ thầy cô GVBM ghi tên học sinh đổi chỗ ngồi và lỗi vi phạm vào sổ đầu bài
        </div>
      </div>
    </div>
  `;
}

function openPrintPreviewModal() {
  const modal = document.getElementById('modal-print-preview');
  const content = document.getElementById('print-preview-content');
  if (!modal || !content) {
    // Nß║┐u ch╞░a c├│ modal, in trß╗▒c tiß║┐p
    printSeatingChart();
    return;
  }

  // Cß║¡p nhß║¡t nß╗Öi dung xem tr╞░ß╗¢c
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
 * Thß╗▒c hiß╗çn in s╞í ─æß╗ô lß╗¢p hß╗ìc: ─Éß║úm bß║úo thß║Ñy hß║┐t 100% lß╗¢p hß╗ìc trong 1 trang A4
 */
function printSeatingChart() {
  // Cß║¡p nhß║¡t khung in ß║⌐n cho chß║┐ ─æß╗Ö print cß╗ºa tr├¼nh duyß╗çt
  let printContainer = document.getElementById('print-seating-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'print-seating-container';
    printContainer.className = 'hidden print:block';
    const section = document.getElementById('section-seating');
    if (section) section.appendChild(printContainer);
  }
  printContainer.innerHTML = generatePrintSeatingHTML();

  // ─É├│ng modal xem tr╞░ß╗¢c nß║┐u ─æang mß╗ƒ ─æß╗â tr├ính in ─æ├¿
  closePrintPreviewModal();

  // K├¡ch hoß║ít in tr├¼nh duyß╗çt
  setTimeout(() => {
    window.print();
  }, 150);
}

// ==================== TRUNG T├éM BIß╗éU Mß║¬U S╞» PHß║áM (Kß╗╢ LUß║¼T T├ìCH Cß╗░C & GDPT 2018) ====================

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
    <option value="">-- In Ph├┤i Trß╗æng (Ph├ít cho hß╗ìc sinh viß║┐t tay) --</option>
    ${sortedStudents.map(s => {
      const badge = s.isSpecialSupport ? ' ≡ƒñ¥' : '';
      const roleStr = s.role && s.role !== 'Th├ánh vi├¬n' ? ` (${s.role})` : '';
      return `<option value="${s.id}" ${s.id === currentVal ? 'selected' : ''}>Tß╗ò ${s.groupNumber}: ${s.fullName} ΓÇó ${s.academicScore}─æ${badge}${roleStr}</option>`;
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
 * T├¼m bß║ín c├╣ng b├án (─É├┤i bß║ín c├╣ng tiß║┐n) cß╗ºa hß╗ìc sinh dß╗▒a tr├¬n S╞í ─æß╗ô chß╗ù ngß╗ôi
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
 * BIß╗éU Mß║¬U 01: PHIß║╛U KHß║óO S├üT T├éM T╞» & Hß╗Æ S╞á C├ü NH├éN Hß╗îC SINH
 */
function generateForm1HTML(student) {
  const nameVal = student ? student.fullName : '....................................................................';
  const groupVal = student ? `Tß╗ò ${student.groupNumber}` : '................';
  const dobVal = student ? student.dob : '....... / ....... / 2011';

  return `
    <div class="pedagogical-a4-document space-y-4 text-slate-800 leading-relaxed">
      <!-- Header Bß╗Ö GD&─ÉT -->
      <div class="flex justify-between items-start border-b pb-3 border-slate-300">
        <div class="text-center font-bold text-xs uppercase leading-tight">
          Sß╗₧ GD&─ÉT L├éM ─Éß╗ÆNG<br>
          <span class="text-sm font-extrabold text-blue-900">TR╞»ß╗£NG THPT B├ÖI THß╗è XU├éN - M┼¿I N├ë</span><br>
          <span class="font-normal text-[11px] text-slate-500">Lß╗¢p: 10A3 ΓÇó N─âm hß╗ìc 2026 - 2027</span>
        </div>
        <div class="text-center font-bold text-xs leading-tight">
          Cß╗ÿNG H├ÆA X├â Hß╗ÿI CHß╗ª NGH─¿A VIß╗åT NAM<br>
          <span class="text-xs font-semibold underline">─Éß╗Öc lß║¡p ΓÇö Tß╗▒ do ΓÇö Hß║ính ph├║c</span><br>
          <span class="font-normal italic text-[11px] text-slate-500">M┼⌐i N├⌐, ng├áy ..... th├íng ..... n─âm 2026</span>
        </div>
      </div>

      <!-- Ti├¬u ─æß╗ü ch├¡nh -->
      <div class="text-center py-2">
        <h1 class="text-base sm:text-lg font-black uppercase text-purple-900 tracking-wide">
          PHIß║╛U KHß║óO S├üT T├éM T╞» & NGUYß╗åN Vß╗îNG Hß╗îC SINH Lß╗ÜP 10
        </h1>
        <p class="text-xs italic text-slate-600 mt-0.5">
          (D├ánh cho GVCN ph├ít ─æß║ºu n─âm hoß║╖c l├ám viß╗çc ri├¬ng ΓÇô Th├┤ng tin bß║úo mß║¡t tuyß╗çt ─æß╗æi theo tinh thß║ºn Tr╞░ß╗¥ng hß╗ìc hß║ính ph├║c)
        </p>
      </div>

      <!-- Lß╗¥i nhß║»n t├óm huyß║┐t tß╗½ GVCN -->
      <div class="bg-purple-50/60 p-3 rounded-lg border border-purple-200 text-xs italic text-purple-950">
        <p><b>Thß║ºy/C├┤ gß╗¡i c├íc em:</b> B╞░ß╗¢c v├áo bß║¡c THPT vß╗¢i m├┤i tr╞░ß╗¥ng hß╗ìc tß║¡p mß╗¢i chß║»c hß║│n c├íc em c├│ nhiß╗üu bß╗í ngß╗í, lo ├óu v├á ├íp lß╗▒c. Phiß║┐u n├áy l├á cß║ºu nß╗æi ch├ón th├ánh, cß╗ƒi mß╗ƒ giß╗»a em v├á Thß║ºy/C├┤ chß╗º nhiß╗çm. Mß╗ìi chia sß║╗ cß╗ºa em ─æß╗üu ─æ╞░ß╗úc giß╗» k├¡n ho├án to├án ─æß╗â Thß║ºy/C├┤ c├│ thß╗â thß║Ñu hiß╗âu, ─æß╗ông h├ánh v├á hß╗ù trß╗ú em tß╗æt nhß║Ñt tr├¬n h├ánh tr├¼nh 3 n─âm cß║Ñp 3 sß║»p tß╗¢i.</p>
      </div>

      <!-- Th├┤ng tin c├í nh├ón -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
        <div><b>Hß╗ì v├á t├¬n:</b> <span class="text-blue-900 font-bold">${nameVal}</span></div>
        <div><b>Lß╗¢p:</b> <span class="font-bold">10A3</span> ΓÇó <b>Tß╗ò:</b> ${groupVal}</div>
        <div><b>Ng├áy sinh:</b> ${dobVal}</div>
      </div>

      <!-- C├íc c├óu hß╗Åi khß║úo s├ít -->
      <div class="space-y-3.5 text-xs pt-2">
        <div>
          <p class="font-bold text-slate-900">1. Sß╗ƒ th├¡ch, ─æam m├¬ hoß║╖c n─âng khiß║┐u nß╗òi trß╗Öi cß╗ºa em (thß╗â thao, ├óm nhß║íc, ─æß╗ô hß╗ìa, c├┤ng nghß╗ç, ─æß╗ìc s├ích, hoß║ít ─æß╗Öng phong tr├áo...):</p>
          <p class="border-b border-dotted border-slate-400 py-1 text-slate-600">&nbsp;</p>
        </div>

        <div>
          <p class="font-bold text-slate-900">2. M├┤n hß╗ìc em cß║úm thß║Ñy tß╗▒ tin v├á hß╗⌐ng th├║ nhß║Ñt hiß╗çn nay:</p>
          <div class="grid grid-cols-2 gap-2 mt-1">
            <p>ΓÇó M├┤n hß╗ìc: ....................................................................</p>
            <p>ΓÇó L├╜ do y├¬u th├¡ch: ............................................................</p>
          </div>
        </div>

        <div>
          <p class="font-bold text-slate-900">3. M├┤n hß╗ìc em cß║úm thß║Ñy gß║╖p nhiß╗üu kh├│ kh─ân, lo lß║»ng nhß║Ñt:</p>
          <p class="mt-1">ΓÇó T├¬n m├┤n hß╗ìc: .........................................................................................................................</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5 pl-2 text-[11px] text-slate-700">
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Mß║Ñt gß╗æc tß╗½ THCS</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Ph╞░╞íng ph├íp hß╗ìc mß╗¢i kh├│</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>B├ái tß║¡p qu├í nhiß╗üu</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Ngß║íi hß╗Åi thß║ºy c├┤</span></label>
          </div>
        </div>

        <div>
          <p class="font-bold text-slate-900">4. ╞»ß╗¢c m╞í nghß╗ü nghiß╗çp hoß║╖c ─æß╗ïnh h╞░ß╗¢ng cß╗ºa em sau khi tß╗æt nghiß╗çp THPT:</p>
          <p class="border-b border-dotted border-slate-400 py-1 text-slate-600">&nbsp;</p>
        </div>

        <div>
          <p class="font-bold text-slate-900">5. ß╗₧ gia ─æ├¼nh, ai l├á ng╞░ß╗¥i em cß║úm thß║Ñy tin t╞░ß╗ƒng v├á dß╗à t├óm sß╗▒ nhß║Ñt?</p>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1.5 pl-2 text-[11px] text-slate-700">
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Bß╗æ</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Mß║╣</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Anh / Chß╗ï / Em</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Bß║ín th├ón</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Kh├┤ng c├│ ai</span></label>
          </div>
        </div>

        <div>
          <p class="font-bold text-slate-900">6. ├üp lß╗▒c hoß║╖c lo lß║»ng lß╗¢n nhß║Ñt cß╗ºa em trong giai ─æoß║ín n├áy l├á g├¼?</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 pl-2 text-[11px] text-slate-700">
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>─Éiß╗âm sß╗æ & thi cß╗¡</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Kß╗│ vß╗ìng cß╗ºa cha mß║╣</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Mß╗æi quan hß╗ç bß║ín b├¿</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>C├ím dß╗ù game / MXH</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>Kh├│ kh─ân kinh tß║┐ / gia ─æ├¼nh</span></label>
            <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span>├üp lß╗▒c kh├íc...</span></label>
          </div>
        </div>

        <div>
          <p class="font-bold text-slate-900">7. ─Éiß╗üu em mong muß╗æn Thß║ºy/C├┤ chß╗º nhiß╗çm hß╗ù trß╗ú hoß║╖c lß║»ng nghe nhß║Ñt trong n─âm hß╗ìc n├áy:</p>
          <p class="border-b border-dotted border-slate-400 py-1.5 text-slate-600">&nbsp;</p>
          <p class="border-b border-dotted border-slate-400 py-1.5 text-slate-600">&nbsp;</p>
        </div>
      </div>

      <!-- Chß╗» k├╜ -->
      <div class="pt-6 flex justify-between text-xs text-center">
        <div class="w-1/2"></div>
        <div class="w-1/2">
          <p class="font-bold">Hß╗îC SINH B├ÇY Tß╗Ä T├éM T╞»</p>
          <p class="italic text-[11px] text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n - c├│ thß╗â ─æß╗â ß║⌐n danh)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-slate-700">${student ? student.fullName : '........................................................'}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * BIß╗éU Mß║¬U 02: Bß║óN GIAO ╞»ß╗ÜC H├ÇNH VI V├Ç Kß║╛ HOß║áCH TIß║╛N Bß╗ÿ C├ü NH├éN
 */
function generateForm2HTML(student, deskMate) {
  const nameVal = student ? student.fullName : '....................................................................';
  const groupVal = student ? `Tß╗ò ${student.groupNumber}` : '................';
  const deskMateVal = deskMate ? `${deskMate.fullName}${deskMate.role !== 'Th├ánh vi├¬n' ? ' (' + deskMate.role + ')' : ''}` : '....................................................................';

  return `
    <div class="pedagogical-a4-document space-y-4 text-slate-800 leading-relaxed">
      <!-- Header Bß╗Ö GD&─ÉT -->
      <div class="flex justify-between items-start border-b pb-3 border-slate-300">
        <div class="text-center font-bold text-xs uppercase leading-tight">
          Sß╗₧ GD&─ÉT L├éM ─Éß╗ÆNG<br>
          <span class="text-sm font-extrabold text-blue-900">TR╞»ß╗£NG THPT B├ÖI THß╗è XU├éN - M┼¿I N├ë</span><br>
          <span class="font-normal text-[11px] text-slate-500">Lß╗¢p: 10A3 ΓÇó N─âm hß╗ìc 2026 - 2027</span>
        </div>
        <div class="text-center font-bold text-xs leading-tight">
          Cß╗ÿNG H├ÆA X├â Hß╗ÿI CHß╗ª NGH─¿A VIß╗åT NAM<br>
          <span class="text-xs font-semibold underline">─Éß╗Öc lß║¡p ΓÇö Tß╗▒ do ΓÇö Hß║ính ph├║c</span><br>
          <span class="font-normal italic text-[11px] text-slate-500">M┼⌐i N├⌐, ng├áy ..... th├íng ..... n─âm 2026</span>
        </div>
      </div>

      <!-- Ti├¬u ─æß╗ü ch├¡nh -->
      <div class="text-center py-2">
        <h1 class="text-base sm:text-lg font-black uppercase text-purple-900 tracking-wide">
          Bß║óN GIAO ╞»ß╗ÜC H├ÇNH VI & Kß║╛ HOß║áCH TIß║╛N Bß╗ÿ C├ü NH├éN
        </h1>
        <p class="text-xs italic text-slate-600 mt-0.5">
          (Thß╗▒c hiß╗çn theo ─æß╗ïnh h╞░ß╗¢ng Kß╗╖ luß║¡t t├¡ch cß╗▒c ΓÇô Tß╗▒ nguyß╗çn k├╜ kß║┐t giß╗»a Hß╗ìc sinh, Phß╗Ñ huynh v├á GVCN)
        </p>
      </div>

      <!-- Th├┤ng tin & Cam kß║┐t mß╗ƒ ─æß║ºu -->
      <div class="text-xs space-y-2">
        <p>H├┤m nay, ng├áy ..... th├íng ..... n─âm 2026, tß║íi Tr╞░ß╗¥ng THPT B├╣i Thß╗ï Xu├ón - M┼⌐i N├⌐.</p>
        <p>T├┤i t├¬n l├á: <span class="text-blue-900 font-bold">${nameVal}</span> &nbsp;&nbsp;ΓÇó&nbsp;&nbsp; Hß╗ìc sinh Lß╗¢p: <b>10A3</b> &nbsp;&nbsp;ΓÇó&nbsp;&nbsp; ${groupVal}</p>
        <p class="italic text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
          "Nhß║¡n thß╗⌐c r├╡ tr├ích nhiß╗çm cß╗ºa bß║ún th├ón ─æß╗æi vß╗¢i kß║┐t quß║ú hß╗ìc tß║¡p v├á r├¿n luyß╗çn ─æß║ío ─æß╗⌐c tß║íi tr╞░ß╗¥ng, ─æ╞░ß╗úc sß╗▒ lß║»ng nghe v├á ─æß╗ïnh h╞░ß╗¢ng tß╗½ Thß║ºy/C├┤ chß╗º nhiß╗çm, t├┤i tß╗▒ nguyß╗çn lß║¡p bß║ún giao ╞░ß╗¢c n├áy v├á cam kß║┐t nß╗ù lß╗▒c thß╗▒c hiß╗çn nghi├¬m t├║c trong 4 tuß║ºn tß╗¢i:"
        </p>
      </div>

      <!-- C├íc hß║íng mß╗Ñc giao ╞░ß╗¢c -->
      <div class="space-y-3.5 text-xs pt-1">
        <div>
          <p class="font-bold text-rose-900 uppercase">I. 03 H├ánh vi em cam kß║┐t tß╗▒ gi├íc chß║Ñm dß╗⌐t (Tß╗½ bß╗Å th├│i quen xß║Ñu):</p>
          <div class="space-y-1.5 mt-1 pl-2">
            <p>1. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">Kh├┤ng ─æi hß╗ìc muß╗Ön, kh├┤ng c├║p tiß║┐t, kh├┤ng vß║»ng kh├┤ng ph├⌐p.</span></p>
            <p>2. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">Kh├┤ng sß╗¡ dß╗Ñng ─æiß╗çn thoß║íi t├╣y tiß╗çn / ch╞íi game / l├ám viß╗çc ri├¬ng trong giß╗¥ hß╗ìc.</span></p>
            <p>3. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">........................................................................................................................................................</span></p>
          </div>
        </div>

        <div>
          <p class="font-bold text-emerald-900 uppercase">II. 03 H├ánh vi t├¡ch cß╗▒c em cam kß║┐t thß╗▒c hiß╗çn h├áng ng├áy:</p>
          <div class="space-y-1.5 mt-1 pl-2">
            <p>1. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">Chuß║⌐n bß╗ï ─æß╗º s├ích vß╗ƒ, l├ám b├ái tß║¡p vß╗ü nh├á tr╞░ß╗¢c khi ─æß║┐n lß╗¢p; ch├║ ├╜ lß║»ng nghe b├ái giß║úng.</span></p>
            <p>2. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">─Éß╗ông phß╗Ñc, t├íc phong chuß║⌐n mß╗▒c; lß╗à ph├⌐p vß╗¢i thß║ºy c├┤ v├á h├▓a nh├ú vß╗¢i bß║ín b├¿.</span></p>
            <p>3. <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[95%]">........................................................................................................................................................</span></p>
          </div>
        </div>

        <div>
          <p class="font-bold text-blue-900 uppercase">III. Mß╗Ñc ti├¬u nß╗ù lß╗▒c vi m├┤ (Baby Steps) trong 4 tuß║ºn tß╗¢i:</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pl-2">
            <p>ΓÇó Chuy├¬n cß║ºn 100%, kh├┤ng vi phß║ím nß╗Öi quy.</p>
            <p>ΓÇó ─Éiß╗âm kiß╗âm tra c├íc m├┤n ─æß║ít tß╗æi thiß╗âu: <span class="font-bold text-blue-900">.......... ─æiß╗âm</span>.</p>
          </div>
        </div>

        <div>
          <p class="font-bold text-indigo-900 uppercase">IV. Ng╞░ß╗¥i ─æß╗ông h├ánh hß╗ù trß╗ú tß║íi lß╗¢p (M├┤ h├¼nh ─É├┤i bß║ín c├╣ng tiß║┐n):</p>
          <p class="mt-1 pl-2">ΓÇó Bß║ín ─æß╗ông h├ánh: <span class="font-bold text-blue-900">${deskMateVal}</span></p>
          <p class="text-[11px] text-slate-600 pl-2">ΓÇó Nhiß╗çm vß╗Ñ: C├╣ng ngß╗ôi hß╗ìc, kiß╗âm tra ch├⌐o b├ái vß╗ƒ ─æß║ºu giß╗¥, ─æ├┤n ─æß╗æc nhß║»c nhß╗ƒ nß╗ü nß║┐p v├á hß╗ù trß╗ú nhau hß╗ìc tß║¡p.</p>
        </div>

        <div>
          <p class="font-bold text-purple-900 uppercase">V. ─Éß╗Öng lß╗▒c ghi nhß║¡n & Biß╗çn ph├íp khß║»c phß╗Ñc hß╗ç quß║ú logic:</p>
          <div class="space-y-1 mt-1 pl-2 text-[11px]">
            <p><b>1. Phß║ºn th╞░ß╗ƒng / Sß╗▒ ghi nhß║¡n mong muß╗æn khi ho├án th├ánh tß╗æt cam kß║┐t:</b></p>
            <p class="border-b border-dotted border-slate-400 pb-0.5 w-[95%] italic text-slate-600">─É╞░ß╗úc cß╗Öng 20 ─æiß╗âm r├¿n luyß╗çn, tuy├¬n d╞░╞íng tr╞░ß╗¢c lß╗¢p, xß║┐p loß║íi R├¿n luyß╗çn Tß╗æt th├íng.</p>
            <p class="pt-1"><b>2. H├¼nh thß╗⌐c tß╗▒ gi├íc khß║»c phß╗Ñc hß╗ç quß║ú nß║┐u t├íi vi phß║ím:</b></p>
            <p class="border-b border-dotted border-slate-400 pb-0.5 w-[95%] italic text-slate-600">Tß╗▒ gi├íc trß╗▒c nhß║¡t b├╣ 1 tuß║ºn, ch─âm s├│c bß╗ôn hoa s├ón tr╞░ß╗¥ng, b├án giao ─æiß╗çn thoß║íi cho GVCN cß║Ñt tß╗º ─æß║ºu giß╗¥.</p>
          </div>
        </div>
      </div>

      <!-- Chß╗» k├╜ 3 b├¬n -->
      <div class="pt-6 grid grid-cols-3 gap-2 text-xs text-center border-t border-slate-300">
        <div>
          <p class="font-bold uppercase">─Éß║áI DIß╗åN PHß╗ñ HUYNH</p>
          <p class="italic text-[11px] text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
        <div>
          <p class="font-bold uppercase">Hß╗îC SINH CAM Kß║╛T</p>
          <p class="italic text-[11px] text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-blue-900">${student ? student.fullName : '................................................'}</p>
        </div>
        <div>
          <p class="font-bold uppercase">GI├üO VI├èN CHß╗ª NHIß╗åM</p>
          <p class="italic text-[11px] text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * BIß╗éU Mß║¬U 03: Sß╗ö THEO D├òI TIß║╛N Bß╗ÿ H├ÇNG TUß║ªN (WEEKLY PROGRESS LOG)
 */
function generateForm3HTML(student, deskMate) {
  const nameVal = student ? student.fullName : '....................................................................';
  const groupVal = student ? `Tß╗ò ${student.groupNumber}` : '................';
  const deskMateVal = deskMate ? `${deskMate.fullName}${deskMate.role !== 'Th├ánh vi├¬n' ? ' (' + deskMate.role + ')' : ''}` : '....................................................................';

  return `
    <div class="pedagogical-a4-document space-y-4 text-slate-800 leading-relaxed">
      <!-- Header Bß╗Ö GD&─ÉT -->
      <div class="flex justify-between items-start border-b pb-3 border-slate-300">
        <div class="text-center font-bold text-xs uppercase leading-tight">
          Sß╗₧ GD&─ÉT L├éM ─Éß╗ÆNG<br>
          <span class="text-sm font-extrabold text-blue-900">TR╞»ß╗£NG THPT B├ÖI THß╗è XU├éN - M┼¿I N├ë</span><br>
          <span class="font-normal text-[11px] text-slate-500">Lß╗¢p: 10A3 ΓÇó N─âm hß╗ìc 2026 - 2027</span>
        </div>
        <div class="text-center font-bold text-xs leading-tight">
          Cß╗ÿNG H├ÆA X├â Hß╗ÿI CHß╗ª NGH─¿A VIß╗åT NAM<br>
          <span class="text-xs font-semibold underline">─Éß╗Öc lß║¡p ΓÇö Tß╗▒ do ΓÇö Hß║ính ph├║c</span><br>
          <span class="font-normal italic text-[11px] text-slate-500">M┼⌐i N├⌐, ng├áy ..... th├íng ..... n─âm 2026</span>
        </div>
      </div>

      <!-- Ti├¬u ─æß╗ü ch├¡nh -->
      <div class="text-center py-2">
        <h1 class="text-base sm:text-lg font-black uppercase text-purple-900 tracking-wide">
          Sß╗ö THEO D├òI TIß║╛N Bß╗ÿ H├ÇNG TUß║ªN (WEEKLY PROGRESS LOG)
        </h1>
        <p class="text-xs italic text-slate-600 mt-0.5">
          (D├ánh cho Ban C├ín sß╗▒ lß╗¢p & GVCN phß╗æi hß╗úp ghi nhß║¡n sß╗▒ chuyß╗ân biß║┐n t├¡ch cß╗▒c cß╗ºa hß╗ìc sinh)
        </p>
      </div>

      <!-- Th├┤ng tin hß╗ìc sinh -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
        <div><b>Hß╗ìc sinh:</b> <span class="text-blue-900 font-bold">${nameVal}</span></div>
        <div><b>Lß╗¢p:</b> <span class="font-bold">10A3</span> ΓÇó <b>Tß╗ò:</b> ${groupVal}</div>
        <div><b>Bß║ín ─æß╗ông h├ánh:</b> <span class="text-slate-800 font-bold">${deskMateVal}</span></div>
      </div>

      <!-- Bß║úng theo d├╡i 4 tuß║ºn -->
      <div class="overflow-x-auto pt-1">
        <table class="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr class="bg-purple-100/70 text-purple-950 font-bold text-center">
              <th class="border border-slate-400 p-2 w-16">Thß╗¥i gian</th>
              <th class="border border-slate-400 p-2 w-48">Chuy├¬n cß║ºn & Nß╗ün nß║┐p</th>
              <th class="border border-slate-400 p-2 w-48">├¥ thß╗⌐c hß╗ìc tß║¡p & ─Éiß╗âm sß╗æ</th>
              <th class="border border-slate-400 p-2">Viß╗çc tß╗æt / Nß╗ù lß╗▒c vi m├┤ ghi nhß║¡n</th>
              <th class="border border-slate-400 p-2 w-32">─É├ính gi├í cß╗ºa GVCN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-slate-400 p-2.5 font-bold text-center bg-slate-50">Tuß║ºn 1</td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>ΓÇó ─Éi muß╗Ön: ...... buß╗òi</p>
                <p>ΓÇó ─Éß╗ông phß╗Ñc: ................</p>
                <p>ΓÇó Giß╗» trß║¡t tß╗▒ trong giß╗¥: [ ] Tß╗æt</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>ΓÇó Vß╗ƒ ghi b├ái: [ ] ─Éß║ºy ─æß╗º</p>
                <p>ΓÇó B├ái tß║¡p vß╗ü nh├á: ..............</p>
                <p>ΓÇó ─Éiß╗âm kiß╗âm tra: ...............</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p class="text-slate-500 italic">V├¡ dß╗Ñ: T├¡ch cß╗▒c k├¬ b├án ghß║┐, chuß║⌐n bß╗ï phß║Ñn bß║úng cho lß╗¢p, gi├║p bß║ín trß╗▒c nhß║¡t...</p>
              </td>
              <td class="border border-slate-400 p-2 text-center text-[11px]">
                <div class="h-10"></div>
                <p class="text-[10px] text-slate-400">(K├╜ duyß╗çt)</p>
              </td>
            </tr>
            <tr>
              <td class="border border-slate-400 p-2.5 font-bold text-center bg-slate-50">Tuß║ºn 2</td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>ΓÇó ─Éi muß╗Ön: ...... buß╗òi</p>
                <p>ΓÇó ─Éß╗ông phß╗Ñc: ................</p>
                <p>ΓÇó Giß╗» trß║¡t tß╗▒ trong giß╗¥: [ ] Tß╗æt</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>ΓÇó Vß╗ƒ ghi b├ái: [ ] ─Éß║ºy ─æß╗º</p>
                <p>ΓÇó B├ái tß║¡p vß╗ü nh├á: ..............</p>
                <p>ΓÇó ─Éiß╗âm kiß╗âm tra: ...............</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p class="text-slate-500 italic">V├¡ dß╗Ñ: C├│ tiß║┐n bß╗Ö r├╡ rß╗çt trong giß╗¥ To├ín/L├╜, ph├ít biß╗âu x├óy dß╗▒ng b├ái 2 lß║ºn...</p>
              </td>
              <td class="border border-slate-400 p-2 text-center text-[11px]">
                <div class="h-10"></div>
                <p class="text-[10px] text-slate-400">(K├╜ duyß╗çt)</p>
              </td>
            </tr>
            <tr>
              <td class="border border-slate-400 p-2.5 font-bold text-center bg-slate-50">Tuß║ºn 3</td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>ΓÇó ─Éi muß╗Ön: ...... buß╗òi</p>
                <p>ΓÇó ─Éß╗ông phß╗Ñc: ................</p>
                <p>ΓÇó Giß╗» trß║¡t tß╗▒ trong giß╗¥: [ ] Tß╗æt</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>ΓÇó Vß╗ƒ ghi b├ái: [ ] ─Éß║ºy ─æß╗º</p>
                <p>ΓÇó B├ái tß║¡p vß╗ü nh├á: ..............</p>
                <p>ΓÇó ─Éiß╗âm kiß╗âm tra: ...............</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p class="text-slate-500 italic">V├¡ dß╗Ñ: Tß╗▒ gi├íc hß╗ìc b├ái, kh├┤ng d├╣ng ─æiß╗çn thoß║íi, c├╣ng bß║ín ─æß║ít ─æiß╗âm kh├í...</p>
              </td>
              <td class="border border-slate-400 p-2 text-center text-[11px]">
                <div class="h-10"></div>
                <p class="text-[10px] text-slate-400">(K├╜ duyß╗çt)</p>
              </td>
            </tr>
            <tr>
              <td class="border border-slate-400 p-2.5 font-bold text-center bg-slate-50">Tuß║ºn 4</td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>ΓÇó ─Éi muß╗Ön: ...... buß╗òi</p>
                <p>ΓÇó ─Éß╗ông phß╗Ñc: ................</p>
                <p>ΓÇó Giß╗» trß║¡t tß╗▒ trong giß╗¥: [ ] Tß╗æt</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p>ΓÇó Vß╗ƒ ghi b├ái: [ ] ─Éß║ºy ─æß╗º</p>
                <p>ΓÇó B├ái tß║¡p vß╗ü nh├á: ..............</p>
                <p>ΓÇó ─Éiß╗âm kiß╗âm tra: ...............</p>
              </td>
              <td class="border border-slate-400 p-2 text-[11px]">
                <p class="text-slate-500 italic">V├¡ dß╗Ñ: Ho├án th├ánh 100% mß╗Ñc ti├¬u cam kß║┐t, ─æß║ít danh hiß╗çu Hß╗ìc sinh nß╗ù lß╗▒c tuß║ºn...</p>
              </td>
              <td class="border border-slate-400 p-2 text-center text-[11px]">
                <div class="h-10"></div>
                <p class="text-[10px] text-slate-400">(K├╜ duyß╗çt)</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─É├ính gi├í tß╗òng kß║┐t sau 4 tuß║ºn -->
      <div class="bg-purple-50/50 p-3 rounded border border-purple-200 text-xs space-y-2">
        <p class="font-bold text-purple-900">Kß║╛T LUß║¼N CHUNG SAU 4 TUß║ªN Cß╗ªA GVCN:</p>
        <div class="flex flex-wrap gap-4 pl-2 text-[11px]">
          <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span><b>─Éß║ít mß╗Ñc ti├¬u giao ╞░ß╗¢c:</b> Tuy├¬n d╞░╞íng tr╞░ß╗¢c lß╗¢p & ghi nhß║¡n ─æiß╗âm cß╗Öng</span></label>
          <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span><b>C├│ tiß║┐n bß╗Ö:</b> Cß║ºn tiß║┐p tß╗Ñc duy tr├¼ v├á ─æ├┤n ─æß╗æc th├¬m</span></label>
          <label class="flex items-center space-x-1.5"><input type="checkbox" class="rounded"> <span><b>Ch╞░a ─æß║ít:</b> Cß║ºn hß╗ìp gia ─æ├¼nh ─æß╗â ─æiß╗üu chß╗ënh giß║úi ph├íp</span></label>
        </div>
        <p class="pt-1"><b>Nhß║¡n x├⌐t cß╗Ñ thß╗â cß╗ºa GVCN:</b> <span class="border-b border-dotted border-slate-400 pb-0.5 inline-block w-[80%]">....................................................................................................</span></p>
      </div>

      <!-- Chß╗» k├╜ x├íc nhß║¡n -->
      <div class="pt-4 grid grid-cols-3 gap-2 text-xs text-center border-t border-slate-300">
        <div>
          <p class="font-bold uppercase">BAN C├üN Sß╗░ Lß╗ÜP</p>
          <p class="italic text-[11px] text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</p>
          <div class="h-14"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
        <div>
          <p class="font-bold uppercase">├¥ KIß║╛N PHß╗ñ HUYNH</p>
          <p class="italic text-[11px] text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</p>
          <div class="h-14"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
        <div>
          <p class="font-bold uppercase">GI├üO VI├èN CHß╗ª NHIß╗åM</p>
          <p class="italic text-[11px] text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</p>
          <div class="h-14"></div>
          <p class="font-semibold text-slate-600">................................................</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Thß╗▒c hiß╗çn in biß╗âu mß║½u s╞░ phß║ím hiß╗çn tß║íi: Khß╗ò dß╗ìc A4 (Portrait)
 */
function printCurrentPedagogicalForm() {
  const paper = document.getElementById('pedagogical-form-paper');
  if (!paper) {
    showToast('Kh├┤ng t├¼m thß║Ñy nß╗Öi dung biß╗âu mß║½u ─æß╗â in!', 'error');
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
      <title>Biß╗âu Mß║½u S╞░ Phß║ím Lß╗¢p 10A3</title>
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

// ==================== CHß║╛ ─Éß╗ÿ S├üNG / Tß╗ÉI & HIß╗åU ß╗¿NG NG├öI SAO Lß║ñP L├üNH ====================

let starfieldAnimationId = null;
let starfieldStars = [];
let activeShootingStar = null;
let starfieldClickBursts = [];

/**
 * Khß╗ƒi tß║ío Theme (Dark/Light) v├á Bß║ºu trß╗¥i sao lß║Ñp l├ính
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
 * ├üp dß╗Ñng chß║┐ ─æß╗Ö m├áu S├íng / Tß╗æi
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
      toggleBtn.title = 'Chß║┐ ─æß╗Ö S├íng (Click ─æß╗â bß║¡t)';
    }
    if (canvas && appState.starsEnabled) {
      canvas.style.opacity = '0.75';
    }
    if (notify) showToast('─É├ú chuyß╗ân sang chß║┐ ─æß╗Ö Tß╗æi (Dark Mode) ≡ƒîÖ', 'info');
  } else {
    htmlEl.classList.remove('dark');
    if (toggleIcon) {
      toggleIcon.className = 'fa-solid fa-moon text-slate-500 text-sm';
    }
    if (toggleBtn) {
      toggleBtn.title = 'Chß║┐ ─æß╗Ö Tß╗æi (Click ─æß╗â bß║¡t)';
    }
    if (canvas && appState.starsEnabled) {
      canvas.style.opacity = '0.4';
    }
    if (notify) showToast('─É├ú chuyß╗ân sang chß║┐ ─æß╗Ö S├íng (Light Mode) ΓÿÇ∩╕Å', 'info');
  }

  // Cß║¡p nhß║¡t lß║íi biß╗âu ─æß╗ô nß║┐u ─æang hiß╗ân thß╗ï
  if (appState.charts.groupsChart || appState.charts.ratingsChart) {
    try {
      renderCharts();
    } catch (e) {}
  }
}

/**
 * Bß║¡t / tß║»t chß║┐ ─æß╗Ö Dark Mode
 */
function toggleDarkMode() {
  const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme, true);
}

/**
 * Bß║¡t / tß║»t hiß╗çu ß╗⌐ng Bß║ºu trß╗¥i sao lß║Ñp l├ính
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
    appState.starsEnabled ? '─É├ú bß║¡t hiß╗çu ß╗⌐ng Bß║ºu trß╗¥i sao lß║Ñp l├ính Γ£¿' : '─É├ú tß║»t hiß╗çu ß╗⌐ng Bß║ºu trß╗¥i sao', 
    'info'
  );
}

/**
 * ─Éß╗Öng c╞í vß║╜ Bß║ºu trß╗¥i sao v├á Sao b─âng (Starfield Canvas Engine)
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

  // Tß║ío 85 ng├┤i sao ngß║½u nhi├¬n
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

  // Khß╗ƒi tß║ío sao b─âng ngß║½u nhi├¬n
  let lastShootingStarTime = Date.now();
  const shootingStarInterval = 9000; // ~9 gi├óy c├│ 1 sao b─âng l╞░ß╗¢t qua

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

      // Vß║╜ c├íc ng├┤i sao lß║Ñp l├ính
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

      // Tß║ío sao b─âng ─æß╗ïnh kß╗│
      if (!activeShootingStar && now - lastShootingStarTime > shootingStarInterval) {
        if (Math.random() < 0.6) {
          spawnShootingStar();
        }
        lastShootingStarTime = now;
      }

      // Vß║╜ v├á cß║¡p nhß║¡t sao b─âng
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

        // Di chuyß╗ân sao b─âng
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.alpha -= ss.decay;

        if (ss.alpha <= 0 || ss.x > canvas.width || ss.y > canvas.height) {
          activeShootingStar = null;
        }
      }

      // Vß║╜ c├íc hß║ít lß║Ñp l├ính khi click chuß╗Öt
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
 * Hiß╗çu ß╗⌐ng bung hß║ít sao lß║Ñp l├ính (Stardust) khi click chuß╗Öt
 */
function setupStarBurstOnClick() {
  document.addEventListener('click', (e) => {
    // Kh├┤ng bß║»n hiß╗çu ß╗⌐ng nß║┐u click tr├║ng input hoß║╖c n├║t chß╗ënh sß╗¡a ─æß╗â tr├ính rß╗æi mß║»t
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





// ==================== Bß║óNG Xß║╛P Hß║áNG THI ─ÉUA THEO TUß║ªN (LEADERBOARD) ====================

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
    // 1. T├ìNH ─ÉIß╗éM Cß╗ªA 1 TUß║ªN Cß╗ñ THß╗é (─Éiß╗âm tß╗▒ ─æß╗Öng vß╗ü ban ─æß║ºu 100─æ nß║┐u l├á tuß║ºn mß╗¢i ch╞░a c├│ vi phß║ím/th╞░ß╗ƒng)
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

    const baseScore = BASE_WEEKLY_SCORE; // 100 ─æiß╗âm s├án tuß║ºn
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
    // 2. T├ìNH ─ÉIß╗éM Cß╗ÿNG Dß╗ÆN Bß║óNG Xß║╛P Hß║áNG Tß╗öNG (L┼⌐y kß║┐ ─æiß╗âm sß╗æ qua c├íc tuß║ºn)
    let minW = 1, maxW = 16;
    if (weekFilter === 'all_hk2') { minW = 18; maxW = 35; }
    else if (weekFilter === 'all_year') { minW = 1; maxW = 35; }

    // T├¼m c├íc tuß║ºn ─æ├ú ho├án th├ánh / c├│ ─æiß╗âm
    const weeksSet = new Set();
    appState.dailyLogs.forEach(l => {
      const w = Number(l.week) || 10;
      if (w >= minW && w <= maxW) weeksSet.add(w);
    });
    // Tß╗æi thiß╗âu tuß║ºn 1 ─æß║┐n tuß║ºn 10 nß║┐u ß╗ƒ HK1
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

    // Cß╗Öng dß╗ôn ─æiß╗âm c├íc tuß║ºn: Mß╗ùi tuß║ºn bß║»t ─æß║ºu 100─æ s├án
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

  // PH╞»╞áNG ├üN 1: Bß║¼C Xß║╛P LOß║áI ╞»U TI├èN TR╞»ß╗ÜC (TIER-FIRST RANKING)
  // Nh├│m Khß╗æng chß║┐ giß╗» ─æiß╗âm thß╗▒c tß║┐ nh╞░ng bß╗ï xß║┐p ß╗ƒ ─æ├íy bß║úng thi ─æua (priority 0)
  function getTierPriority(item) {
    if (item.hasRestrictedViolation) return 0; // ─É├íy bß║úng thi ─æua
    if (item.totalScore >= RANKING_TIERS.GOOD.min) return 4; // Tß╗æt (>= 95─æ)
    if (item.totalScore >= RANKING_TIERS.FAIR.min) return 3; // Kh├í (80 - 94─æ)
    if (item.totalScore >= RANKING_TIERS.PASS.min) return 2; // ─Éß║ít (60 - 79─æ)
    return 1; // Ch╞░a ─æß║ít do ─æiß╗âm thß║Ñp (< 60─æ)
  }

  // Sß║»p xß║┐p: ╞»u ti├¬n Bß║¡c thi ─æua tr╞░ß╗¢c, sau ─æ├│ ─æiß╗âm tuß║ºn tß╗½ cao xuß╗æng thß║Ñp
  list.sort((a, b) => {
    const tierA = getTierPriority(a);
    const tierB = getTierPriority(b);
    if (tierB !== tierA) {
      return tierB - tierA; // Bß║¡c cao h╞ín xß║┐p tr├¬n
    }
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (a.violPts !== b.violPts) return b.violPts - a.violPts; // violPts l├á sß╗æ ├óm, lß╗¢n h╞ín tß╗⌐c l├á ├¡t bß╗ï trß╗½ h╞ín
    return (b.academicScore || 0) - (a.academicScore || 0);
  });

  // G├ín thß╗⌐ hß║íng (Rank 1 -> 45)
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
      weekLabel.textContent = 'Th├ánh t├¡ch l┼⌐y kß║┐ cß╗Öng dß╗ôn to├án bß╗Ö Hß╗ìc kß╗│ 1 (Tuß║ºn 1 ─æß║┐n 16) cß╗ºa 45 hß╗ìc sinh Lß╗¢p 10A3';
    } else if (weekFilter === 'all_hk2') {
      weekLabel.textContent = 'Th├ánh t├¡ch l┼⌐y kß║┐ cß╗Öng dß╗ôn to├án bß╗Ö Hß╗ìc kß╗│ 2 (Tuß║ºn 18 ─æß║┐n 35) cß╗ºa 45 hß╗ìc sinh Lß╗¢p 10A3';
    } else if (weekFilter === 'all_year') {
      weekLabel.textContent = 'Bß║úng v├áng vinh danh cß╗Öng dß╗ôn Cß║ú N─âm Hß╗ìc 2026 - 2027 (Tuß║ºn 1 ─æß║┐n 35) cß╗ºa 45 hß╗ìc sinh Lß╗¢p 10A3';
    } else {
      const wNum = Number(weekFilter);
      const termName = wNum >= 18 ? 'Hß╗ìc kß╗│ 2' : 'Hß╗ìc kß╗│ 1';
      weekLabel.textContent = `Ghi nhß║¡n th├ánh t├¡ch thi ─æua xuß║Ñt sß║»c nhß║Ñt trong Tuß║ºn ${weekFilter} (${termName})`;
    }
  }

  // Cß║¡p nhß║¡t trß║íng th├íi Kh├│a / Mß╗ƒ kh├│a tuß║ºn tr├¬n Leaderboard Toolbar
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
    text.textContent = 'Bß║úng Cß╗Öng Dß╗ôn';
    if (btnLock) btnLock.classList.add('hidden');
    return;
  }

  if (btnLock) btnLock.classList.remove('hidden');

  const locked = isWeekLocked(weekFilter);
  if (locked) {
    badge.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center space-x-1';
    icon.className = 'fa-solid fa-lock text-xs';
    text.textContent = '─É├ú Kh├│a Sß╗ò';
    if (btnLockText) btnLockText.textContent = 'Mß╗ƒ Kh├│a Tuß║ºn';
    if (btnLockIcon) btnLockIcon.className = 'fa-solid fa-lock-open';
  } else {
    badge.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1';
    icon.className = 'fa-solid fa-lock-open text-xs';
    text.textContent = '─Éang Mß╗ƒ';
    if (btnLockText) btnLockText.textContent = 'Kh├│a Sß╗ò Tuß║ºn';
    if (btnLockIcon) btnLockIcon.className = 'fa-solid fa-lock';
  }
}

function renderLeaderboardPodium(rankedList) {
  const container = document.getElementById('leaderboard-podium-container');
  if (!container) return;

  if (rankedList.length < 3) {
    container.innerHTML = '<p class="text-xs text-slate-400 col-span-3 text-center py-6">─Éang tß║úi dß╗» liß╗çu hß╗ìc sinh...</p>';
    return;
  }

  const rank1 = rankedList[0];
  const rank2 = rankedList[1];
  const rank3 = rankedList[2];

  container.innerHTML = `
    <!-- Rank 2: ├ü Qu├ón 1 (B├¬n Tr├íi) -->
    <div class="order-2 md:order-1 bg-gradient-to-t from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-2xl p-4 text-center shadow-md flex flex-col items-center justify-end relative h-64 md:h-72 cursor-pointer hover:border-slate-400 transition" onclick="openStudentDetailModal('${rank2.id}')">
      <div class="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-slate-400 flex items-center justify-center font-black text-lg mb-2 shadow-inner">
        ≡ƒÑê 2
      </div>
      <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">├ü Qu├ón 1 Tuß║ºn</span>
      <h4 class="font-black text-slate-900 dark:text-white text-base leading-tight mb-1">${escapeHtml(rank2.fullName)}</h4>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Tß╗ò ${rank2.groupNumber} &bull; ${escapeHtml(rank2.role || 'Th├ánh vi├¬n')}</p>
      <div class="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1 rounded-xl w-full">
        <span class="text-xl font-black text-blue-600 dark:text-blue-400">${rank2.totalScore}</span> <span class="text-xs font-bold text-slate-500">─æiß╗âm</span>
      </div>
    </div>

    <!-- Rank 1: Qu├ín Qu├ón (ß╗₧ Giß╗»a - Cao Nhß║Ñt) -->
    <div class="order-1 md:order-2 bg-gradient-to-t from-amber-100 via-amber-50 to-white dark:from-amber-950/60 dark:via-slate-900 dark:to-slate-800 border-3 border-amber-400 dark:border-amber-500 rounded-2xl p-5 text-center shadow-xl flex flex-col items-center justify-end relative h-76 md:h-84 transform md:-translate-y-2 cursor-pointer hover:scale-[1.02] transition" onclick="openStudentDetailModal('${rank1.id}')">
      <div class="absolute -top-4 w-9 h-9 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-lg shadow-md border-2 border-white dark:border-slate-800">
        ≡ƒææ
      </div>
      <div class="w-14 h-14 rounded-full bg-amber-300 dark:bg-amber-600 text-amber-950 dark:text-white border-2 border-amber-500 flex items-center justify-center font-black text-2xl mb-2 shadow-lg">
        ≡ƒÑç 1
      </div>
      <span class="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
        <i class="fa-solid fa-star text-[10px]"></i> QU├üN QU├éN TUß║ªN <i class="fa-solid fa-star text-[10px]"></i>
      </span>
      <h4 class="font-black text-slate-900 dark:text-white text-lg leading-tight mb-1">${escapeHtml(rank1.fullName)}</h4>
      <p class="text-xs text-amber-800 dark:text-amber-300 font-semibold mb-3">Tß╗ò ${rank1.groupNumber} &bull; ${escapeHtml(rank1.role || 'Th├ánh vi├¬n')}</p>
      <div class="bg-amber-200/60 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-600 px-4 py-1.5 rounded-xl w-full">
        <span class="text-2xl font-black text-amber-700 dark:text-amber-300">${rank1.totalScore}</span> <span class="text-xs font-black text-amber-800 dark:text-amber-400">─æiß╗âm</span>
      </div>
    </div>

    <!-- Rank 3: ├ü Qu├ón 2 (B├¬n Phß║úi) -->
    <div class="order-3 bg-gradient-to-t from-orange-100 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-amber-600/40 dark:border-amber-700/60 rounded-2xl p-4 text-center shadow-md flex flex-col items-center justify-end relative h-60 md:h-68 cursor-pointer hover:border-amber-600 transition" onclick="openStudentDetailModal('${rank3.id}')">
      <div class="w-12 h-12 rounded-full bg-amber-700/20 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-2 border-amber-600 flex items-center justify-center font-black text-lg mb-2 shadow-inner">
        ≡ƒÑë 3
      </div>
      <span class="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">├ü Qu├ón 2 Tuß║ºn</span>
      <h4 class="font-black text-slate-900 dark:text-white text-base leading-tight mb-1">${escapeHtml(rank3.fullName)}</h4>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Tß╗ò ${rank3.groupNumber} &bull; ${escapeHtml(rank3.role || 'Th├ánh vi├¬n')}</p>
      <div class="bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 px-3 py-1 rounded-xl w-full">
        <span class="text-xl font-black text-orange-600 dark:text-orange-400">${rank3.totalScore}</span> <span class="text-xs font-bold text-slate-500">─æiß╗âm</span>
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

  // Sß║»p xß║┐p tß╗ò theo ─æiß╗âm trung b├¼nh tuß║ºn giß║úm dß║ºn
  groupStats.sort((a, b) => b.avg - a.avg);

  const winningGroup = groupStats[0];
  const winDisplay = document.getElementById('winning-group-name');
  if (winDisplay && winningGroup) {
    winDisplay.textContent = `Tß╗ò ${winningGroup.groupNumber} (TB: ${winningGroup.avg}─æ)`;
  }

  container.innerHTML = groupStats.map((g, idx) => {
    const isTop = idx === 0;
    const badgeColor = isTop ? 'bg-amber-500 text-slate-900 font-black' : idx === 1 ? 'bg-slate-300 text-slate-800 font-bold' : idx === 2 ? 'bg-amber-700 text-white font-bold' : 'bg-slate-100 text-slate-600';
    const cardBorder = isTop ? 'border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-md' : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';

    return `
      <div class="${cardBorder} rounded-xl p-3 flex flex-col justify-between text-center relative overflow-hidden">
        ${isTop ? '<div class="absolute -right-6 -top-6 w-14 h-14 bg-amber-400 rotate-45 flex items-end justify-center pb-0.5 text-xs">≡ƒÜ⌐</div>' : ''}
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${badgeColor}">${idx + 1}</span>
            <span class="text-[10px] font-bold text-slate-400">${g.count} HS</span>
          </div>
          <h5 class="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-1">Tß╗ò ${g.groupNumber}</h5>
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
    tbody.innerHTML = '<tr><td colspan="10" class="py-8 text-center text-slate-400 text-xs">Kh├┤ng t├¼m thß║Ñy hß╗ìc sinh n├áo ph├╣ hß╗úp vß╗¢i bß╗Ö lß╗ìc</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(stu => {
    const rank = stu.rank;
    const isRestricted = stu.hasRestrictedViolation;
    const rankBadge = isRestricted 
      ? `<span class="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-black text-[11px] border border-rose-400 dark:border-rose-800 inline-flex items-center gap-1 shadow-2xs" title="Hß║í bß║¡c xuß╗æng cuß╗æi bß║úng do vi phß║ím Lß╗ùi khß╗æng chß║┐">ΓÜá∩╕Å ${rank}</span>`
      : rank === 1 ? '<span class="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs inline-flex items-center justify-center shadow-xs">≡ƒÑç</span>'
      : rank === 2 ? '<span class="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center justify-center">≡ƒÑê</span>'
      : rank === 3 ? '<span class="w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs inline-flex items-center justify-center">≡ƒÑë</span>'
      : `<span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs inline-flex items-center justify-center">${rank}</span>`;

    const tierBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${stu.tier.color}">${stu.tier.label}</span>`;

    const progressBadges = [];
    if (stu.hasPairedProgress) {
      progressBadges.push('<span class="text-[9px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-300/60 inline-flex items-center gap-1">≡ƒñ¥ C├╣ng tiß║┐n</span>');
    }
    if (stu.hasBabySteps) {
      progressBadges.push('<span class="text-[9px] bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold border border-purple-300/60 inline-flex items-center gap-1">≡ƒ¬£ Baby Steps</span>');
    }
    if (stu.isSpecialSupport) {
      progressBadges.push('<span class="text-[9px] bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">K├¿m cß║╖p</span>');
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
          <div class="text-[10px] text-slate-400">M├ú: ${stu.code} &bull; NS: ${stu.dob}</div>
        </td>
        <td class="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-300">Tß╗ò ${stu.groupNumber}</td>
        <td class="py-2.5 px-3 text-center text-slate-500 font-semibold">${stu.baseScore}</td>
        <td class="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">+${stu.bonusPts}</td>
        <td class="py-2.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">${stu.violPts}</td>
        <td class="py-2.5 px-3 text-center">
          <span class="text-sm font-black text-slate-900 dark:text-white">${stu.totalScore}</span>
        </td>
        <td class="py-2.5 px-3 text-center">${tierBadge}</td>
        <td class="py-2.5 px-3">
          <div class="flex flex-wrap gap-1">
            ${progressBadges.length > 0 ? progressBadges.join(' ') : '<span class="text-slate-400 text-[10px]">Nß╗ü nß║┐p ß╗òn ─æß╗ïnh</span>'}
          </div>
        </td>
        <td class="py-2.5 px-3 text-center" onclick="event.stopPropagation()">
          <button onclick="openStudentDetailModal('${stu.id}')" class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 rounded transition" title="Xem hß╗ô s╞í">
            <i class="fa-solid fa-eye text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// IN Bß║óNG Xß║╛P Hß║áNG THI ─ÉUA TUß║ªN (A4)
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
  let weekText = `TUß║ªN ${weekFilter}`;
  if (weekFilter === 'all' || weekFilter === 'all_hk1') {
    weekText = 'Tß╗öNG Kß║╛T THI ─ÉUA Hß╗îC Kß╗▓ 1 (TUß║ªN 1 - 16)';
  } else if (weekFilter === 'all_hk2') {
    weekText = 'Tß╗öNG Kß║╛T THI ─ÉUA Hß╗îC Kß╗▓ 2 (TUß║ªN 18 - 35)';
  } else if (weekFilter === 'all_year') {
    weekText = 'Tß╗öNG Kß║╛T THI ─ÉUA Cß║ó N─éM Hß╗îC 2026 - 2027 (TUß║ªN 1 - 35)';
  } else {
    const wNum = Number(weekFilter);
    weekText = `TUß║ªN ${weekFilter} ΓÇö ${wNum >= 18 ? 'Hß╗îC Kß╗▓ 2' : 'Hß╗îC Kß╗▓ 1'}`;
  }

  return `
    <div class="bg-white text-black font-sans text-[11px] leading-tight w-full max-w-[210mm] mx-auto p-4 space-y-3">
      <!-- QUß╗ÉC HIß╗åU & TI├èU NGß╗« -->
      <div class="grid grid-cols-12 items-start pb-2 border-b-2 border-black">
        <div class="col-span-5 text-center">
          <p class="text-[9px] uppercase font-bold text-slate-700">Sß╗₧ GD&─ÉT L├éM ─Éß╗ÆNG</p>
          <p class="text-[10px] uppercase font-bold text-black tracking-wide">TR╞»ß╗£NG THPT B├ÖI THß╗è XU├éN - M┼¿I N├ë</p>
        </div>
        <div class="col-span-7 text-center">
          <p class="text-[10px] uppercase font-bold text-black tracking-wide">Cß╗ÿNG H├ÆA X├â Hß╗ÿI CHß╗ª NGH─¿A VIß╗åT NAM</p>
          <p class="text-[9px] italic font-semibold text-slate-800">─Éß╗Öc lß║¡p &mdash; Tß╗▒ do &mdash; Hß║ính ph├║c</p>
        </div>
      </div>

      <!-- TI├èU ─Éß╗Ç Bß║óNG THI ─ÉUA -->
      <div class="text-center my-2">
        <h1 class="text-base font-black tracking-wider uppercase text-black">
          Bß║óNG Xß║╛P Hß║áNG THI ─ÉUA Hß╗îC SINH &mdash; Lß╗ÜP 10A3
        </h1>
        <p class="text-xs font-bold text-blue-900 mt-0.5">
          ${weekText} &bull; N─éM Hß╗îC 2026 - 2027 &bull; S─¿ Sß╗É: 45 Hß╗îC SINH
        </p>
      </div>

      <!-- Bß║óNG Tß╗öNG Kß║╛T 45 Hß╗îC SINH (2 Cß╗ÿT Gß╗îN G├ÇNG TR├èN 1 TRANG A4) -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr class="bg-slate-200 uppercase font-bold">
              <th class="border border-black p-1 text-center w-8">Hß║íng</th>
              <th class="border border-black p-1">Hß╗ì v├á T├¬n</th>
              <th class="border border-black p-1 text-center w-8">Tß╗ò</th>
              <th class="border border-black p-1 text-center w-12">─Éiß╗âm S├án</th>
              <th class="border border-black p-1 text-center w-12">─Éiß╗âm Cß╗Öng</th>
              <th class="border border-black p-1 text-center w-12">─Éiß╗âm Trß╗½</th>
              <th class="border border-black p-1 text-center w-14 font-black">Tß╗òng ─Éiß╗âm</th>
              <th class="border border-black p-1 text-center w-14">Xß║┐p Loß║íi</th>
            </tr>
          </thead>
          <tbody>
            ${rankedList.map(s => `
              <tr class="${s.hasRestrictedViolation ? 'bg-rose-50' : s.rank <= 3 ? 'bg-amber-50 font-semibold' : ''}">
                <td class="border border-black p-1 text-center font-bold">${s.hasRestrictedViolation ? `ΓÜá∩╕Å ${s.rank}` : s.rank}</td>
                <td class="border border-black p-1">${s.fullName} ${s.role && s.role !== 'Th├ánh vi├¬n' ? `(${s.role})` : ''}</td>
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

      <!-- CHß╗« K├¥ GVCN V├Ç Lß╗ÜP TR╞»ß╗₧NG -->
      <div class="grid grid-cols-2 pt-2 border-t border-slate-300 text-[10px] mt-3">
        <div class="text-center">
          <p class="font-bold uppercase">Lß╗ÜP TR╞»ß╗₧NG / BAN C├üN Sß╗░</p>
          <p class="text-[9px] italic text-slate-500 mt-8">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</p>
        </div>
        <div class="text-center">
          <p class="italic">M┼⌐i N├⌐, ng├áy ... th├íng ... n─âm 2026</p>
          <p class="font-bold uppercase mt-0.5">GI├üO VI├èN CHß╗ª NHIß╗åM</p>
          <p class="text-[9px] italic text-slate-500 mt-8">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</p>
        </div>
      </div>
    </div>
  `;
}

// ==================== H├ÇM TIß╗åN ├ìCH CHß║ñM ─ÉIß╗éM Xß╗ö XUß╗ÉNG (DROPDOWN SCORING) ====================

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
      if (cardBadge) cardBadge.textContent = `+${rule.points} ─æiß╗âm`;
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
          cardBadge.textContent = 'Khß╗æng chß║┐ ΓÜá∩╕Å (-50─æ)';
          cardBadge.className = 'px-2 py-0.5 bg-rose-600 text-white font-black text-xs rounded-full border border-rose-300';
        } else {
          cardBadge.textContent = `${rule.points} ─æiß╗âm`;
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
    ruleText.textContent = `[${isRestricted ? 'Lß╗ûI KHß╗ÉNG CHß║╛ ΓÜá∩╕Å' : type === 'bonus' ? '─ÉIß╗éM Cß╗ÿNG' : '─ÉIß╗éM TRß╗¬'}] ${appState.activeRule.label}`;
  }
  if (pointsBadge && appState.activeRule) {
    if (appState.activeRule.isRestricted) {
      pointsBadge.textContent = 'Khß╗æng chß║┐ ΓÜá∩╕Å (-50─æ)';
      pointsBadge.className = 'font-black text-xs text-rose-300 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500';
    } else {
      pointsBadge.textContent = type === 'bonus' ? `+${appState.activeRule.points} ─æiß╗âm` : `${appState.activeRule.points} ─æiß╗âm`;
      pointsBadge.className = type === 'bonus' 
        ? 'font-black text-base text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600' 
        : 'font-black text-base text-rose-400 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-600';
    }
  }
}

function applyDropdownScore(type) {
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bß║ín ─æang ß╗ƒ Chß║┐ ─æß╗Ö Chß╗ë Xem! Chß╗ë Tß╗ò tr╞░ß╗ƒng, Lß╗¢p tr╞░ß╗ƒng v├á GVCN mß╗¢i c├│ quyß╗ün chß║Ñm ─æiß╗âm.', 'error');
    return;
  }
  const selectEl = document.getElementById(type === 'bonus' ? 'select-bonus-rule' : 'select-violation-rule');
  const ruleKey = selectEl ? selectEl.value : '';
  if (!ruleKey) {
    showToast(`Vui l├▓ng chß╗ìn 1 mß╗Ñc tß╗½ danh s├ích xß╗ò xuß╗æng ${type === 'bonus' ? '─Éiß╗âm cß╗Öng' : '─Éiß╗âm trß╗½'}!`, 'warning');
    return;
  }
  if (appState.selectedStudentIds.size === 0) {
    showToast('Vui l├▓ng click chß╗ìn ├¡t nhß║Ñt 1 hß╗ìc sinh ß╗ƒ Danh s├ích b├¬n d╞░ß╗¢i!', 'warning');
    return;
  }
  onDropdownRuleChange(type, ruleKey);
  submitScoringEntry();
}

function onQuickSelectStudentDropdown(studentId) {
  if (!studentId) return;
  const roleMeta = ROLES[appState.currentUserRole] || ROLES.member;
  if (!roleMeta.canScore) {
    showToast('Bß║ín ─æang ß╗ƒ Chß║┐ ─æß╗Ö Chß╗ë Xem! Vui l├▓ng ─æ─âng nhß║¡p C├ín sß╗▒ hoß║╖c GVCN ─æß╗â chß╗ìn hß╗ìc sinh.', 'warning');
    const quickSelect = document.getElementById('quick-select-student-dropdown');
    if (quickSelect) quickSelect.value = '';
    return;
  }
  if (appState.currentUserRole.startsWith('lead_t')) {
    const leaderGroup = parseInt(appState.currentUserRole.replace('lead_t', ''), 10);
    const stu = appState.students.find(s => s.id === studentId);
    if (stu && Number(stu.groupNumber) !== leaderGroup) {
      showToast(`Bß║ín l├á Tß╗ò tr╞░ß╗ƒng Tß╗ò ${leaderGroup}, chß╗ë ─æ╞░ß╗úc chß╗ìn hß╗ìc sinh Tß╗ò ${leaderGroup}!`, 'warning');
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

// ==================== KHß╗₧I Tß║áO Dß╗« LIß╗åU Lß╗èCH Sß╗¼ THI ─ÉUA TUß║ªN 1 ─Éß║╛N 8 ====================
function seedHistoricalWeeklyLogs() {
  const sampleLogs = [
    // Tuß║ºn 1
    { week: '1', date: '2026-09-08', studentId: 'hs_10a3_43', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ lß╗¢p l├ám tß╗æt nhiß╗çm vß╗Ñ', pointsChanged: 20, recordedBy: 'Lß╗¢p tr╞░ß╗ƒng', note: 'Tß╗ò tr╞░ß╗ƒng T1 ─æiß╗üu h├ánh tß╗æt tuß║ºn ─æß║ºu' },
    { week: '1', date: '2026-09-09', studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ lß╗¢p l├ám tß╗æt nhiß╗çm vß╗Ñ', pointsChanged: 20, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'Lß╗¢p tr╞░ß╗ƒng ─æiß╗üu h├ánh ß╗òn ─æß╗ïnh nß╗ü nß║┐p lß╗¢p' },
    { week: '1', date: '2026-09-10', studentId: 'hs_10a3_24', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong l├¬n bß║úng ─æ├║ng', pointsChanged: 10, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: 'Giß║úi b├ái tß║¡p To├ín h├¼nh tß╗æt' },
    { week: '1', date: '2026-09-11', studentId: 'hs_10a3_14', type: 'violation', ruleKey: 'viol_sleeping_eating', ruleLabel: 'Ngß╗º gß╗Ñc / n├│i chuyß╗çn', pointsChanged: -5, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: 'Ngß╗º gß╗Ñc tiß║┐t 3' },
    { week: '1', date: '2026-09-12', studentId: 'hs_10a3_21', type: 'violation', ruleKey: 'viol_late_uniform', ruleLabel: '─Éi muß╗Ön / sai ─æß╗ông phß╗Ñc', pointsChanged: -5, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: '─Éi muß╗Ön 5 ph├║t' },

    // Tuß║ºn 2
    { week: '2', date: '2026-09-15', studentId: 'hs_10a3_10', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ lß╗¢p l├ám tß╗æt nhiß╗çm vß╗Ñ', pointsChanged: 20, recordedBy: 'Lß╗¢p tr╞░ß╗ƒng', note: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 3 bao qu├ít tß╗ò tß╗æt' },
    { week: '2', date: '2026-09-16', studentId: 'hs_10a3_02', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: '─É├┤i bß║ín c├╣ng tiß║┐n', pointsChanged: 15, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 3', note: 'K├¿m bß║ín Kim Tr├║c hß╗ìc tß║¡p' },
    { week: '2', date: '2026-09-16', studentId: 'hs_10a3_36', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: '─É├┤i bß║ín c├╣ng tiß║┐n', pointsChanged: 15, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 3', note: 'Ch─âm ch├║ hß╗ìc tß║¡p c├╣ng Mß╗╣ Duy├¬n' },
    { week: '2', date: '2026-09-17', studentId: 'hs_10a3_33', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Hß╗ìc sinh diß╗çn hß╗ù trß╗ú c├│ nß╗ù lß╗▒c l├ám b├ái', pointsChanged: 10, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 2', note: 'L├ám ─æß║ºy ─æß╗º b├ái tß║¡p H├│a' },
    { week: '2', date: '2026-09-18', studentId: 'hs_10a3_06', type: 'violation', ruleKey: 'viol_no_homework', ruleLabel: 'Kh├┤ng l├ám b├ái / kh├┤ng hß╗ìc b├ái', pointsChanged: -10, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: 'Qu├¬n vß╗ƒ b├ái tß║¡p V─ân' },

    // Tuß║ºn 3
    { week: '3', date: '2026-09-22', studentId: 'hs_10a3_35', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ l├ám tß╗æt nhiß╗çm vß╗Ñ', pointsChanged: 20, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 4 duy tr├¼ kß╗╖ luß║¡t xuß║Ñt sß║»c' },
    { week: '3', date: '2026-09-23', studentId: 'hs_10a3_14', type: 'bonus', ruleKey: 'bonus_baby_steps', ruleLabel: 'Nß╗ù lß╗▒c vi m├┤ (Baby Steps)', pointsChanged: 10, recordedBy: 'Lß╗¢p tr╞░ß╗ƒng', note: 'Ho├án th├ánh cam kß║┐t tuß║ºn kh├┤ng vi phß║ím' },
    { week: '3', date: '2026-09-23', studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_peer_tutoring', ruleLabel: 'K├¿m bß║ín yß║┐u To├ín/L├╜', pointsChanged: 10, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'Hß╗ù trß╗ú bß║ín Khang tiß║┐n bß╗Ö' },
    { week: '3', date: '2026-09-24', studentId: 'hs_10a3_01', type: 'violation', ruleKey: 'viol_late_uniform', ruleLabel: '─Éi muß╗Ön / sai ─æß╗ông phß╗Ñc', pointsChanged: -5, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: 'Thiß║┐u ph├╣ hiß╗çu' },
    { week: '3', date: '2026-09-25', studentId: 'hs_10a3_16', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: '─É├┤i bß║ín c├╣ng tiß║┐n', pointsChanged: 15, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 2', note: 'K├¿m Kim B╞í l├ám b├ái' },

    // Tuß║ºn 4
    { week: '4', date: '2026-09-29', studentId: 'hs_10a3_23', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ lß╗¢p l├ám tß╗æt nhiß╗çm vß╗Ñ', pointsChanged: 20, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 6 bao qu├ít nß╗ü nß║┐p xuß║Ñt sß║»c' },
    { week: '4', date: '2026-09-30', studentId: 'hs_10a3_09', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ lß╗¢p l├ám tß╗æt nhiß╗çm vß╗Ñ', pointsChanged: 20, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 5 ─æiß╗üu h├ánh tß╗æt' },
    { week: '4', date: '2026-10-01', studentId: 'hs_10a3_12', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong l├¬n bß║úng ─æ├║ng', pointsChanged: 10, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: 'Giß║úi b├ái tß║¡p H├│a hß╗ìc xuß║Ñt sß║»c' },
    { week: '4', date: '2026-10-02', studentId: 'hs_10a3_41', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: '─É├┤i bß║ín c├╣ng tiß║┐n', pointsChanged: 15, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 1', note: 'Gi├║p bß║ín Gi├áu c├╣ng tiß║┐n bß╗Ö' },
    { week: '4', date: '2026-10-02', studentId: 'hs_10a3_06', type: 'bonus', ruleKey: 'bonus_baby_steps', ruleLabel: 'Nß╗ù lß╗▒c vi m├┤ (Baby Steps)', pointsChanged: 10, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 1', note: 'Tiß║┐n bß╗Ö r├╡ rß╗çt trong giß╗¥ To├ín' },

    // Tuß║ºn 5
    { week: '5', date: '2026-10-06', studentId: 'hs_10a3_43', type: 'bonus', ruleKey: 'bonus_school_honors', ruleLabel: '─Éß║ít ─æiß╗âm Tß╗æt to├án diß╗çn', pointsChanged: 50, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'Khen th╞░ß╗ƒng th├ánh t├¡ch phong tr├áo cß║Ñp tr╞░ß╗¥ng' },
    { week: '5', date: '2026-10-07', studentId: 'hs_10a3_03', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ lß╗¢p l├ám tß╗æt nhiß╗çm vß╗Ñ', pointsChanged: 20, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'Lß╗¢p ph├│ & C├ín sß╗▒ H├│a tß║¡n tß╗Ñy' },
    { week: '5', date: '2026-10-08', studentId: 'hs_10a3_44', type: 'bonus', ruleKey: 'bonus_effort_support', ruleLabel: 'Hß╗ìc sinh diß╗çn hß╗ù trß╗ú nß╗ù lß╗▒c l├ám b├ái', pointsChanged: 10, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 4', note: 'Ch─âm ch├║ nghe giß║úng v├á l├ám b├ái' },
    { week: '5', date: '2026-10-09', studentId: 'hs_10a3_38', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: '─É├┤i bß║ín c├╣ng tiß║┐n', pointsChanged: 15, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 4', note: 'K├¿m T╞░ß╗¥ng Vy tiß║┐n bß╗Ö' },

    // Tuß║ºn 6
    { week: '6', date: '2026-10-13', studentId: 'hs_10a3_10', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong l├¬n bß║úng ─æ├║ng', pointsChanged: 10, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: 'L├¬n bß║úng giß║úi b├ái Vß║¡t l├╜ ─æß║ít ─æiß╗âm 10' },
    { week: '6', date: '2026-10-14', studentId: 'hs_10a3_20', type: 'bonus', ruleKey: 'bonus_group_homework', ruleLabel: 'Cß║ú tß╗ò 100% l├ám b├ái tß║¡p', pointsChanged: 10, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 3', note: 'Tß╗ò 3 chuß║⌐n bß╗ï b├ái chu ─æ├ío' },
    { week: '6', date: '2026-10-14', studentId: 'hs_10a3_19', type: 'bonus', ruleKey: 'bonus_group_homework', ruleLabel: 'Cß║ú tß╗ò 100% l├ám b├ái tß║¡p', pointsChanged: 10, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 3', note: 'Tß╗ò 3 chuß║⌐n bß╗ï b├ái chu ─æ├ío' },
    { week: '6', date: '2026-10-15', studentId: 'hs_10a3_21', type: 'bonus', ruleKey: 'bonus_logical_consequence', ruleLabel: 'Tß╗▒ gi├íc khß║»c phß╗Ñc hß╗ç quß║ú', pointsChanged: 5, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 6', note: 'Tß╗▒ gi├íc trß╗▒c nhß║¡t b├╣ chu ─æ├ío' },
    { week: '6', date: '2026-10-16', studentId: 'hs_10a3_08', type: 'bonus', ruleKey: 'bonus_individual_effort', ruleLabel: 'Ph├ít biß╗âu x├óy dß╗▒ng b├ái', pointsChanged: 5, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: 'Ph├ít biß╗âu s├┤i nß╗òi m├┤n Lß╗ïch sß╗¡' },

    // Tuß║ºn 7
    { week: '7', date: '2026-10-20', studentId: 'hs_10a3_24', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ lß╗¢p l├ám tß╗æt nhiß╗çm vß╗Ñ', pointsChanged: 20, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 2 ho├án th├ánh xuß║Ñt sß║»c' },
    { week: '7', date: '2026-10-21', studentId: 'hs_10a3_33', type: 'bonus', ruleKey: 'bonus_baby_steps', ruleLabel: 'Nß╗ù lß╗▒c vi m├┤ (Baby Steps)', pointsChanged: 10, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 2', note: 'Nß╗ù lß╗▒c hß╗ìc tß║¡p r├╡ rß╗çt' },
    { week: '7', date: '2026-10-22', studentId: 'hs_10a3_14', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: '─É├┤i bß║ín c├╣ng tiß║┐n', pointsChanged: 15, recordedBy: 'Lß╗¢p tr╞░ß╗ƒng', note: '─Éß║ít ─æiß╗âm 8 kiß╗âm tra 15 ph├║t To├ín' },
    { week: '7', date: '2026-10-22', studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_paired_progress', ruleLabel: '─É├┤i bß║ín c├╣ng tiß║┐n', pointsChanged: 15, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'K├¿m cß║╖p bß║ín Khang tiß║┐n bß╗Ö v╞░ß╗út bß║¡c' },

    // Tuß║ºn 8
    { week: '8', date: '2026-10-27', studentId: 'hs_10a3_23', type: 'bonus', ruleKey: 'bonus_school_honors', ruleLabel: '─Éß║ít ─æiß╗âm Tß╗æt to├án diß╗çn', pointsChanged: 50, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'G╞░╞íng s├íng viß╗çc tß╗æt nhß║╖t ─æ╞░ß╗úc cß╗ºa r╞íi trß║ú lß║íi' },
    { week: '8', date: '2026-10-28', studentId: 'hs_10a3_02', type: 'bonus', ruleKey: 'bonus_individual_effort', ruleLabel: 'Trß╗▒c nhß║¡t tß╗▒ gi├íc', pointsChanged: 5, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 3', note: 'Vß╗ç sinh ph├▓ng hß╗ìc sß║ích sß║╜' },
    { week: '8', date: '2026-10-29', studentId: 'hs_10a3_36', type: 'bonus', ruleKey: 'bonus_individual_effort', ruleLabel: 'Ho├án th├ánh b├ái tß║¡p c├í nh├ón', pointsChanged: 5, recordedBy: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 3', note: 'L├ám b├ái tß║¡p ─æß║ºy ─æß╗º' },
    { week: '8', date: '2026-10-30', studentId: 'hs_10a3_16', type: 'bonus', ruleKey: 'bonus_board_solution', ruleLabel: 'Xung phong l├¬n bß║úng ─æ├║ng', pointsChanged: 10, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: 'Giß║úi b├ái tß║¡p To├ín h├¼nh ch├¡nh x├íc' },

    // Tuß║ºn 10 (Hiß╗çn tß║íi)
    { week: '10', date: '2026-11-06', studentId: 'hs_10a3_10', type: 'bonus', ruleKey: 'bonus_duty_excellent', ruleLabel: 'C├ín sß╗▒ lß╗¢p l├ám tß╗æt nhiß╗çm vß╗Ñ', pointsChanged: 20, recordedBy: 'GVCN Lß╗¢p 10A3', note: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 3 quß║ún l├╜ nß╗ü nß║┐p tß╗ò nghi├¬m t├║c' },
    { week: '10', date: '2026-11-06', studentId: 'hs_10a3_22', type: 'bonus', ruleKey: 'bonus_individual_effort', ruleLabel: 'Ph├ít biß╗âu x├óy dß╗▒ng b├ái', pointsChanged: 5, recordedBy: 'Sao ─æß╗Å trß╗▒c nhß║¡t', note: 'Ph├ít biß╗âu b├ái hß╗ìc t├¡ch cß╗▒c' }
  ];

  return sampleLogs.map(item => ({
    id: generateUUID(),
    ...item,
    timestamp: new Date(item.date).getTime()
  }));
}

// ==================== C╞á CHß║╛ KH├ôA TUß║ªN, RESET ─ÉIß╗éM & PH├éN QUYß╗ÇN ====================

function isWeekLocked(weekVal) {
  if (!appState.lockedWeeks) return false;
  return appState.lockedWeeks.includes(String(weekVal));
}

function toggleCurrentLeaderboardWeekLock() {
  const currentRole = appState.currentUserRole || 'gvcn';
  if (currentRole !== 'gvcn') {
    showToast('Chß╗ë Gi├ío vi├¬n chß╗º nhiß╗çm mß╗¢i c├│ quyß╗ün Kh├│a hoß║╖c Mß╗ƒ kh├│a sß╗ò ─æiß╗âm tuß║ºn!', 'error');
    return;
  }

  const weekVal = appState.activeLeaderboardWeek || '10';
  const isCumulative = weekVal === 'all' || weekVal === 'all_hk1' || weekVal === 'all_hk2' || weekVal === 'all_year';
  if (isCumulative) {
    showToast('Kh├┤ng thß╗â kh├│a Bß║úng tß╗òng hß╗úp l┼⌐y kß║┐! Vui l├▓ng chß╗ìn 1 tuß║ºn cß╗Ñ thß╗â ─æß╗â kh├│a.', 'warning');
    return;
  }

  const wStr = String(weekVal);
  if (!appState.lockedWeeks) appState.lockedWeeks = [];

  const locked = appState.lockedWeeks.includes(wStr);
  if (locked) {
    appState.lockedWeeks = appState.lockedWeeks.filter(w => w !== wStr);
    showToast(`─É├ú Mß╗₧ KH├ôA sß╗ò ─æiß╗âm Tuß║ºn ${wStr}! Ban c├ín sß╗▒ c├│ thß╗â cß║¡p nhß║¡t ─æiß╗âm.`, 'success');
  } else {
    appState.lockedWeeks.push(wStr);
    showToast(`─É├ú KH├ôA Sß╗ö ─æiß╗âm Tuß║ºn ${wStr}! ─Éiß╗âm sß╗æ tuß║ºn n├áy ─æ╞░ß╗úc bß║úo vß╗ç an to├án.`, 'success');
  }

  saveDataToStorage();
  refreshAllUI();
}

function confirmResetWeekDiscipline() {
  const currentRole = appState.currentUserRole || 'gvcn';
  if (currentRole !== 'gvcn') {
    showToast('Chß╗ë Gi├ío vi├¬n chß╗º nhiß╗çm mß╗¢i c├│ quyß╗ün Reset ─æiß╗âm thi ─æua cß╗ºa hß╗ìc sinh!', 'error');
    return;
  }

  const weekVal = appState.activeLeaderboardWeek || '10';
  let targetDesc = `Tuß║ºn ${weekVal}`;
  if (weekVal === 'all' || weekVal === 'all_hk1') targetDesc = 'to├án bß╗Ö Hß╗ìc kß╗│ 1 (Tuß║ºn 1 - 16)';
  else if (weekVal === 'all_hk2') targetDesc = 'to├án bß╗Ö Hß╗ìc kß╗│ 2 (Tuß║ºn 18 - 35)';
  else if (weekVal === 'all_year') targetDesc = 'Cß║ó N─éM Hß╗îC (Tuß║ºn 1 - 35)';

  const confirmed = confirm(
    `[X├üC NHß║¼N RESET ─ÉIß╗éM THI ─ÉUA Vß╗Ç BAN ─Éß║ªU]\n\nThß║ºy/C├┤ c├│ chß║»c chß║»n muß╗æn ─æ╞░a ─æiß╗âm cß╗ºa tß║Ñt cß║ú 45 hß╗ìc sinh trong ${targetDesc} vß╗ü mß╗æc 100 ─ÉIß╗éM S├ÇN BAN ─Éß║ªU kh├┤ng?\n\n(To├án bß╗Ö ─æiß╗âm cß╗Öng v├á ─æiß╗âm trß╗½ cß╗ºa giai ─æoß║ín n├áy sß║╜ ─æ╞░ß╗úc l├ám mß╗¢i vß╗ü 0)`
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
  showToast(`─É├ú reset th├ánh c├┤ng ─æiß╗âm thi ─æua cß╗ºa ${targetDesc} vß╗ü 100 ─æiß╗âm ban ─æß║ºu!`, 'success');
}

function onRoleSelectorChange(roleId) {
  if (roleId === 'member') {
    executeChangeRole('member');
    showToast('─É├ú chuyß╗ân vß╗ü Chß║┐ ─æß╗Ö Hß╗ìc sinh (Chß╗ë xem)', 'info');
    return;
  }

  if (isRoleAuthenticated(roleId)) {
    executeChangeRole(roleId);
  } else {
    // Tß║ím thß╗¥i trß║ú lß║íi gi├í trß╗ï c┼⌐ cß╗ºa dropdown
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

  if (titleEl) titleEl.textContent = `X├íc Thß╗▒c Quyß╗ün: ${roleMeta.label}`;
  if (subtitleEl) subtitleEl.textContent = isGVCN ? 'Cß║ºn m├ú PIN Gi├ío vi├¬n chß╗º nhiß╗çm ─æß╗â tiß║┐p tß╗Ñc' : 'Cß║ºn m├ú PIN C├ín sß╗▒ (Lß╗¢p tr╞░ß╗ƒng / Tß╗ò tr╞░ß╗ƒng)';
  if (bodyEl) {
    bodyEl.textContent = isGVCN 
      ? 'Chß╗ë Gi├ío vi├¬n chß╗º nhiß╗çm mß╗¢i c├│ to├án quyß╗ün chß║Ñm ─æiß╗âm, kh├│a sß╗ò ─æiß╗âm v├á reset ─æiß╗âm thi ─æua.' 
      : `Bß║ín ─æang chß╗ìn chuyß╗ân sang vai tr├▓ ${roleMeta.label} ─æß╗â chß║Ñm ─æiß╗âm thi ─æua. Vui l├▓ng nhß║¡p m├ú PIN x├íc thß╗▒c.`;
  }
  if (hintEl) {
    hintEl.innerHTML = isGVCN 
      ? '* M├ú PIN GVCN mß║╖c ─æß╗ïnh: <strong>1030</strong>' 
      : '* M├ú PIN C├ín sß╗▒ mß║╖c ─æß╗ïnh: <strong>10a3</strong> (hoß║╖c d├╣ng PIN GVCN <strong>1030</strong>)';
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

  let isValid = false;
  if (isGVCN) {
    isValid = (pinVal === DEFAULT_PINS.gvcn);
  } else {
    isValid = (pinVal === DEFAULT_PINS.cadre || pinVal === DEFAULT_PINS.gvcn);
  }

  if (!isValid) {
    if (errEl) errEl.classList.remove('hidden');
    if (errText) errText.textContent = isGVCN ? 'Sai m├ú PIN GVCN! Vui l├▓ng nhß║¡p ─æ├║ng PIN 1030.' : 'Sai m├ú PIN! Vui l├▓ng nhß║¡p ─æ├║ng PIN 10a3 hoß║╖c PIN GVCN 1030.';
    if (input) {
      input.classList.add('border-rose-500');
      input.focus();
      input.select();
    }
    return;
  }

  // ─É├║ng PIN
  const remember = document.getElementById('checkbox-remember-pin')?.checked !== false;
  if (remember) {
    if (pinVal === DEFAULT_PINS.gvcn) {
      addAuthenticatedRole('gvcn');
    } else {
      addAuthenticatedRole(targetRole);
    }
  }

  const roleMeta = ROLES[targetRole] || ROLES.gvcn;
  closeRolePinModal();
  executeChangeRole(targetRole);
  showToast(`≡ƒÄë X├íc thß╗▒c th├ánh c├┤ng! ─É├ú k├¡ch hoß║ít vai tr├▓: ${roleMeta.label}`, 'success');
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
      roleBadge.textContent = '─É╞░ß╗úc chß║Ñm';
      roleBadge.className = 'px-1.5 py-0.5 rounded font-black text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    } else {
      roleBadge.textContent = 'Chß╗ë xem';
      roleBadge.className = 'px-1.5 py-0.5 rounded font-black text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  // N├║t ─æ─âng xuß║Ñt vai tr├▓ trong header
  const logoutBtn = document.getElementById('btn-header-logout-role');
  if (logoutBtn) {
    if (roleId !== 'member') logoutBtn.classList.remove('hidden');
    else logoutBtn.classList.add('hidden');
  }

  // Nß║┐u l├á Tß╗ò tr╞░ß╗ƒng, tß╗▒ ─æß╗Öng chß╗ìn ng╞░ß╗¥i ghi nhß║¡n v├á lß╗ìc ─æ├║ng tß╗ò m├¼nh
  if (roleId.startsWith('lead_t')) {
    const groupNum = parseInt(roleId.replace('lead_t', ''), 10);
    if (!isNaN(groupNum)) {
      filterScoringGroup(groupNum);
      const recSelect = document.getElementById('score-recorder-select');
      if (recSelect) {
        recSelect.value = `Tß╗ò tr╞░ß╗ƒng Tß╗ò ${groupNum}`;
      }
    }
  } else if (roleId === 'monitor') {
    const recSelect = document.getElementById('score-recorder-select');
    if (recSelect) recSelect.value = 'Lß╗¢p tr╞░ß╗ƒng (Trß║ºn L├¬ Hß╗ông Nhung)';
  } else if (roleId === 'gvcn') {
    const recSelect = document.getElementById('score-recorder-select');
    if (recSelect) recSelect.value = 'GVCN Lß╗¢p 10A3';
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

  // Check button & select disabling
  const canOperate = roleMeta.canScore && !weekLocked;

  if (bonusSelect) bonusSelect.disabled = !canOperate;
  if (violSelect) violSelect.disabled = !canOperate;
  if (quickSelect) quickSelect.disabled = !canOperate;

  if (btnBonus) {
    btnBonus.disabled = !canOperate;
    if (!canOperate) {
      btnBonus.classList.add('opacity-50', 'cursor-not-allowed');
      btnBonus.title = 'Bß║ín kh├┤ng c├│ quyß╗ün chß║Ñm ─æiß╗âm (Chß║┐ ─æß╗Ö Chß╗ë Xem)';
    } else {
      btnBonus.classList.remove('opacity-50', 'cursor-not-allowed');
      btnBonus.title = 'Ghi nhß║¡n ─æiß╗âm cß╗Öng cho c├íc hß╗ìc sinh ─æ├ú chß╗ìn';
    }
  }

  if (btnViol) {
    btnViol.disabled = !canOperate;
    if (!canOperate) {
      btnViol.classList.add('opacity-50', 'cursor-not-allowed');
      btnViol.title = 'Bß║ín kh├┤ng c├│ quyß╗ün chß║Ñm ─æiß╗âm (Chß║┐ ─æß╗Ö Chß╗ë Xem)';
    } else {
      btnViol.classList.remove('opacity-50', 'cursor-not-allowed');
      btnViol.title = 'Ghi nhß║¡n ─æiß╗âm trß╗½ cho c├íc hß╗ìc sinh ─æ├ú chß╗ìn';
    }
  }

  if (submitBtn) {
    if (!roleMeta.canScore) {
      submitBtn.disabled = true;
      submitBtn.className = 'px-5 py-2.5 bg-slate-400 text-slate-800 rounded-xl font-bold text-xs cursor-not-allowed opacity-75';
      submitBtn.innerHTML = '<i class="fa-solid fa-lock mr-1.5"></i><span>Chß╗ë Xem (Ch╞░a ─æ╞░ß╗úc cß║Ñp quyß╗ün chß║Ñm)</span>';
    } else if (weekLocked) {
      submitBtn.disabled = true;
      submitBtn.className = 'px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-xs cursor-not-allowed opacity-80';
      submitBtn.innerHTML = '<i class="fa-solid fa-lock mr-1.5"></i><span>Tuß║ºn N├áy ─É├ú Kh├│a Sß╗ò ─Éiß╗âm</span>';
    } else {
      submitBtn.disabled = false;
      submitBtn.className = 'px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 font-black text-xs text-slate-950 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition cursor-pointer whitespace-nowrap';
      submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk text-sm mr-1.5"></i><span>X├üC NHß║¼N GHI ─ÉIß╗éM NGAY</span>';
    }
  }
}

// ==================== C├üC H├ÇM Xß╗¼ L├¥ RESET ─ÉIß╗éM THI ─ÉUA ====================

function openResetDisciplineModal() {
  const currentRole = appState.currentUserRole || 'member';
  if (currentRole !== 'gvcn') {
    showToast('Chß╗ë Gi├ío vi├¬n chß╗º nhiß╗çm mß╗¢i c├│ quyß╗ün mß╗ƒ c├┤ng cß╗Ñ Reset ─æiß╗âm thi ─æua!', 'error');
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
    showToast('Chß╗ë Gi├ío vi├¬n chß╗º nhiß╗çm mß╗¢i c├│ quyß╗ün Reset ─æiß╗âm thi ─æua!', 'error');
    return;
  }
  const wStr = String(weekVal || appState.activeLeaderboardWeek || '9');
  const countBefore = appState.dailyLogs.length;

  appState.dailyLogs = appState.dailyLogs.filter(l => String(l.week) !== wStr);
  const deletedCount = countBefore - appState.dailyLogs.length;

  saveDataToStorage();
  refreshAllUI();
  closeResetDisciplineModal();

  showToast(`─É├ú reset sß║ích sß║╜ ─æiß╗âm Tuß║ºn ${wStr}! Tß║Ñt cß║ú 45 hß╗ìc sinh ß╗ƒ Tuß║ºn ${wStr} ─æ├ú vß╗ü ─æ├║ng 100 ─æiß╗âm ban ─æß║ºu (─æ├ú x├│a ${deletedCount} l╞░ß╗út ─æiß╗âm).`, 'success');
}

function executeResetAllToBaseline() {
  if (appState.currentUserRole !== 'gvcn') {
    showToast('Chß╗ë Gi├ío vi├¬n chß╗º nhiß╗çm mß╗¢i c├│ quyß╗ün Reset ─æiß╗âm thi ─æua!', 'error');
    return;
  }
  const countBefore = appState.dailyLogs.length;
  appState.dailyLogs = [];
  appState.lockedWeeks = [];

  saveDataToStorage();
  refreshAllUI();
  closeResetDisciplineModal();

  showToast(`─É├ú x├│a sß║ích to├án bß╗Ö ${countBefore} l╞░ß╗út ─æiß╗âm c┼⌐! Tß║Ñt cß║ú 45 hß╗ìc sinh ─æ├ú trß╗ƒ vß╗ü ─æ├║ng 100 ─æiß╗âm s├án ban ─æß║ºu ─æß╗â bß║»t ─æß║ºu tß╗½ Tuß║ºn 9.`, 'success');
}

function executeLoadSampleLogs() {
  if (appState.currentUserRole !== 'gvcn') {
    showToast('Chß╗ë Gi├ío vi├¬n chß╗º nhiß╗çm mß╗¢i c├│ quyß╗ün nß║íp dß╗» liß╗çu mß║½u!', 'error');
    return;
  }
  appState.dailyLogs = seedHistoricalWeeklyLogs();
  saveDataToStorage();
  refreshAllUI();
  closeResetDisciplineModal();

  showToast(`─É├ú nß║íp th├ánh c├┤ng bß╗Ö dß╗» liß╗çu thi ─æua mß║½u ─æß╗â tham khß║úo!`, 'info');
}

// ==================== PWA INSTALL & SERVICE WORKER LOGIC ====================
let deferredPWAInstallPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker ─æ─âng k├╜ th├ánh c├┤ng vß╗¢i scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Kh├┤ng thß╗â ─æ─âng k├╜ Service Worker:', err);
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
        showToast('─Éang c├ái ─æß║╖t ß╗¿ng dß╗Ñng Lß╗¢p 10A3 v├áo m├íy...', 'success');
      }
      deferredPWAInstallPrompt = null;
    });
  } else {
    // Modal h╞░ß╗¢ng dß║½n c├ái ─æß║╖t chi tiß║┐t cho tß╗½ng loß║íi thiß║┐t bß╗ï (iPhone, Android, Windows)
    showPWAInstallGuideModal();
  }
}

window.addEventListener('appinstalled', () => {
  showToast('─É├ú c├ái ─æß║╖t th├ánh c├┤ng ß╗¿ng dß╗Ñng Lß╗¢p 10A3! Bß║ín c├│ thß╗â mß╗ƒ trß╗▒c tiß║┐p tß╗½ m├án h├¼nh ch├¡nh.', 'success');
});

function showPWAInstallGuideModal() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let instructions = '';
  if (isIOS) {
    instructions = `
      <div class="space-y-3 text-slate-700 dark:text-slate-200">
        <p class="font-bold text-blue-600 dark:text-blue-400">≡ƒô▒ H╞░ß╗¢ng dß║½n c├ái tr├¬n iPhone / iPad (Safari):</p>
        <ol class="list-decimal list-inside space-y-2 text-xs">
          <li>Bß║Ñm v├áo n├║t <strong>Chia sß║╗ (Share)</strong> ß╗ƒ thanh d╞░ß╗¢i c├╣ng Safari (biß╗âu t╞░ß╗úng <i class="fa-solid fa-arrow-up-from-bracket text-blue-500"></i> h├¼nh vu├┤ng c├│ m┼⌐i t├¬n l├¬n).</li>
          <li>Cuß╗Ön xuß╗æng v├á chß╗ìn <strong>"Th├¬m v├áo MH ch├¡nh"</strong> (hoß║╖c <em>"Add to Home Screen"</em> <i class="fa-solid fa-plus-square text-blue-500"></i>).</li>
          <li>Bß║Ñm <strong>"Th├¬m" (Add)</strong> ß╗ƒ g├│c tr├¬n b├¬n phß║úi.</li>
          <li>Xong! Icon <strong>Lß╗¢p 10A3</strong> sß║╜ xuß║Ñt hiß╗çn ngo├ái m├án h├¼nh ch├¡nh ─æß╗â mß╗ƒ to├án m├án h├¼nh nh╞░ App thß║¡t.</li>
        </ol>
      </div>
    `;
  } else if (isAndroid) {
    instructions = `
      <div class="space-y-3 text-slate-700 dark:text-slate-200">
        <p class="font-bold text-emerald-600 dark:text-emerald-400">≡ƒñû H╞░ß╗¢ng dß║½n c├ái tr├¬n Android (Chrome):</p>
        <ol class="list-decimal list-inside space-y-2 text-xs">
          <li>Bß║Ñm v├áo biß╗âu t╞░ß╗úng <strong>3 dß║Ñu chß║Ñm ─æß╗⌐ng (Γï«)</strong> ß╗ƒ g├│c tr├¬n c├╣ng b├¬n phß║úi Chrome.</li>
          <li>Chß╗ìn d├▓ng <strong>"C├ái ─æß║╖t ß╗⌐ng dß╗Ñng"</strong> (hoß║╖c <em>"Th├¬m v├áo M├án h├¼nh ch├¡nh"</em>).</li>
          <li>Bß║Ñm <strong>"C├ái ─æß║╖t"</strong> ─æß╗â x├íc nhß║¡n.</li>
          <li>Xong! App Lß╗¢p 10A3 sß║╜ xuß║Ñt hiß╗çn tr├¬n m├án h├¼nh ─æiß╗çn thoß║íi.</li>
        </ol>
      </div>
    `;
  } else {
    instructions = `
      <div class="space-y-3 text-slate-700 dark:text-slate-200">
        <p class="font-bold text-blue-600 dark:text-blue-400">≡ƒÆ╗ H╞░ß╗¢ng dß║½n c├ái tr├¬n M├íy t├¡nh (Chrome / Edge / Cß╗æc Cß╗æc):</p>
        <ol class="list-decimal list-inside space-y-2 text-xs">
          <li>Nh├¼n l├¬n thanh nhß║¡p ─æß╗ïa chß╗ë web (URL) ß╗ƒ tr├¬n c├╣ng.</li>
          <li>Bß║Ñm v├áo biß╗âu t╞░ß╗úng <strong>C├ái ─æß║╖t (Install App <i class="fa-solid fa-download text-blue-500"></i>)</strong> ß╗ƒ g├│c phß║úi thanh ─æß╗ïa chß╗ë.</li>
          <li>Bß║Ñm n├║t <strong>"C├ái ─æß║╖t"</strong>.</li>
          <li>App sß║╜ tß╗▒ ─æß╗Öng mß╗ƒ th├ánh mß╗Öt cß╗¡a sß╗ò phß║ºn mß╗üm ─æß╗Öc lß║¡p v├á tß║ío icon ngo├ái Desktop Windows.</li>
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
            <h3 class="font-black text-sm text-slate-900 dark:text-white">C├ái ─Éß║╖t App Lß╗¢p 10A3</h3>
          </div>
          <button onclick="document.getElementById('modal-pwa-guide').remove()" class="text-slate-400 hover:text-slate-600 p-1">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        ${instructions}
        <div class="pt-2 flex justify-end">
          <button onclick="document.getElementById('modal-pwa-guide').remove()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition">
            ─É├ú Hiß╗âu
          </button>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById('modal-pwa-guide');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}



// ==================== QUß║óN L├¥ NHIß╗åM Vß╗ñ BAN C├üN Sß╗░ & Tß╗░ QUß║óN (XUß║ñT WORD / IN A4) ====================

const CADRE_DUTIES_DATA = [
  {
    stt: 1,
    category: 'leadership',
    role: 'Lß╗¢p tr╞░ß╗ƒng',
    studentId: 'hs_10a3_27', // Trß║ºn L├¬ Hß╗ông Nhung
    badgeColor: 'amber',
    icon: 'fa-solid fa-crown',
    permissions: 'To├án quyß╗ün ─æiß╗üu h├ánh hß╗ìc sinh ΓÇó Chß║Ñm ─æiß╗âm thi ─æua to├án lß╗¢p ΓÇó Quß║ún l├╜ m├ú PIN Lß╗¢p tr╞░ß╗ƒng',
    duties: [
      'Chß╗ïu tr├ích nhiß╗çm to├án diß╗çn tr╞░ß╗¢c GVCN v├á Ban Gi├ím hiß╗çu vß╗ü mß╗ìi mß║╖t nß╗ü nß║┐p hß╗ìc tß║¡p, kß╗╖ luß║¡t v├á phong tr├áo cß╗ºa lß╗¢p 10A3.',
      '─Éß║íi diß╗çn tiß║┐ng n├│i cß╗ºa tß║¡p thß╗â lß╗¢p; tiß║┐p nhß║¡n c├íc kß║┐ hoß║ích, chß╗ë ─æß║ío tß╗½ nh├á tr╞░ß╗¥ng v├á GVCN ─æß╗â qu├ín triß╗çt, ─æ├┤n ─æß╗æc lß╗¢p thß╗▒c hiß╗çn.',
      '─Éiß╗üu h├ánh 15 ph├║t truy b├ái ─æß║ºu giß╗¥ mß╗ùi ng├áy v├á chß╗º tr├¼ tiß║┐t Sinh hoß║ít lß╗¢p v├áo cuß╗æi tuß║ºn.',
      'Phß╗æi hß╗úp vß╗¢i Lß╗¢p ph├│, 6 Tß╗ò tr╞░ß╗ƒng, B├¡ th╞░ v├á Sao ─æß╗Å duy tr├¼ trß║¡t tß╗▒; xß╗¡ l├╜ b╞░ß╗¢c ─æß║ºu c├íc bß║Ñt ─æß╗ông nß╗Öi bß╗Ö; b├ío c├ío ngay cho GVCN t├¼nh huß╗æng ph├ít sinh v╞░ß╗út thß║⌐m quyß╗ün.',
      'Thß╗▒c hiß╗çn chß║Ñm ─æiß╗âm thi ─æua kh├ích quan v├á bß║úo mß║¡t m├ú PIN ─æiß╗üu h├ánh.'
    ]
  },
  {
    stt: 2,
    category: 'leadership',
    role: 'Lß╗¢p ph├│ Hß╗ìc tß║¡p & CS Vß║¡t l├╜',
    studentId: 'hs_10a3_42', // L├¬ V─ân V┼⌐
    badgeColor: 'blue',
    icon: 'fa-solid fa-book-open-reader',
    permissions: 'Quß║ún l├╜ 15p truy b├ái ΓÇó Chß╗ë ─æß║ío C├ín sß╗▒ bß╗Ö m├┤n ΓÇó M├┤ h├¼nh ─É├┤i bß║ín c├╣ng tiß║┐n',
    duties: [
      'Phß╗Ñ tr├ích nß╗ü nß║┐p hß╗ìc tß║¡p, chuß║⌐n bß╗ï b├ái tß║¡p vß╗ü nh├á v├á kiß╗âm tra b├ái c┼⌐ 15 ph├║t ─æß║ºu giß╗¥.',
      'Quß║ún l├╜, ─æ├┤n ─æß╗æc mß║íng l╞░ß╗¢i C├ín sß╗▒ c├íc bß╗Ö m├┤n (To├ín, L├╜, H├│a, Sinh, V─ân, Sß╗¡, ─Éß╗ïa, Anh...); kiß╗âm tra sß╗ò ─æß║ºu b├ái sau mß╗ùi buß╗òi hß╗ìc.',
      'X├óy dß╗▒ng v├á theo d├╡i m├┤ h├¼nh "─É├┤i bß║ín c├╣ng tiß║┐n", ph├ón c├┤ng c├íc bß║ín hß╗ìc tß╗æt hß╗ù trß╗ú bß║ín gß║╖p kh├│ kh─ân kiß║┐n thß╗⌐c.',
      'Trß╗▒c tiß║┐p phß╗Ñ tr├ích bß╗Ö m├┤n Vß║¡t l├╜: chuß║⌐n bß╗ï dß╗Ñng cß╗Ñ th├¡ nghiß╗çm, hß╗ù trß╗ú gi├ío vi├¬n bß╗Ö m├┤n ph├ít/thu ─æß╗ü c╞░╞íng.',
      'Thay mß║╖t Lß╗¢p tr╞░ß╗ƒng ─æiß╗üu h├ánh lß╗¢p khi Lß╗¢p tr╞░ß╗ƒng vß║»ng mß║╖t.'
    ]
  },
  {
    stt: 3,
    category: 'leadership',
    role: 'Lß╗¢p ph├│ Lao ─æß╗Öng',
    studentId: 'hs_10a3_11', // Nguyß╗àn Quß╗æc Huy
    badgeColor: 'emerald',
    icon: 'fa-solid fa-broom',
    permissions: 'Ph├ón c├┤ng & kiß╗âm tra trß╗▒c nhß║¡t ΓÇó Quß║ún l├╜ c╞í sß╗ƒ vß║¡t chß║Ñt, hß╗ç thß╗æng ─æiß╗çn quß║ít',
    duties: [
      'Phß╗Ñ tr├ích to├án bß╗Ö c├┤ng t├íc vß╗ç sinh, cß║únh quan ph├▓ng hß╗ìc v├á nß║┐p sß╗æng v─ân minh hß╗ìc ─æ╞░ß╗¥ng.',
      'Lß║¡p lß╗ïch v├á kiß╗âm tra tß╗ò trß╗▒c nhß║¡t mß╗ùi ng├áy (qu├⌐t lß╗¢p, lau bß║úng, ─æß╗ò r├íc, chuß║⌐n bß╗ï n╞░ß╗¢c uß╗æng v├á kh─ân lau b├án gi├ío vi├¬n).',
      'Kiß╗âm tra v├á chß╗ïu tr├ích nhiß╗çm tß║»t to├án bß╗Ö ─æ├¿n, quß║ít, m├íy chiß║┐u/tivi, ─æ├│ng then cß╗¡a sß╗ò v├á kh├│a cß╗¡a ph├▓ng hß╗ìc khi tan tr╞░ß╗¥ng.',
      'Quß║ún l├╜, ─æiß╗üu h├ánh lß╗▒c l╞░ß╗úng lß╗¢p tham gia c├íc ─æß╗út lao ─æß╗Öng to├án tr╞░ß╗¥ng do ─Éo├án tr╞░ß╗¥ng hoß║╖c GVCN ph├ón c├┤ng.',
      'Kß╗ïp thß╗¥i ph├ít hiß╗çn v├á b├ío c├ío GVCN c├íc h╞░ hß╗Ång vß╗ü c╞í sß╗ƒ vß║¡t chß║Ñt (b├án ghß║┐, b├│ng ─æiß╗çn, quß║ít, cß╗¡a k├¡nh).'
    ]
  },
  {
    stt: 4,
    category: 'leadership',
    role: 'B├¡ th╞░ Chi ─æo├án',
    studentId: 'hs_10a3_07', // Tß║í Thanh Ngß╗ìc Gi├áu
    badgeColor: 'rose',
    icon: 'fa-solid fa-flag',
    permissions: 'L├únh ─æß║ío Chi ─æo├án TNCS ΓÇó C├┤ng t├íc ─Éo├án tr╞░ß╗¥ng ΓÇó Phong tr├áo thanh ni├¬n xung k├¡ch',
    duties: [
      'L├únh ─æß║ío Chi ─æo├án TNCS Hß╗ô Ch├¡ Minh Lß╗¢p 10A3; trß╗▒c tiß║┐p li├¬n hß╗ç v├á chß╗ïu sß╗▒ chß╗ë ─æß║ío cß╗ºa Ban Chß║Ñp h├ánh ─Éo├án tr╞░ß╗¥ng v├á GVCN.',
      'Tß╗ò chß╗⌐c sinh hoß║ít Chi ─æo├án ─æß╗ïnh kß╗│, ph├ít ─æß╗Öng c├íc phong tr├áo xung k├¡ch, v─ân h├│a v─ân nghß╗ç, thß╗â dß╗Ñc thß╗â thao, ─æß╗ün ╞ín ─æ├íp ngh─⌐a.',
      'Quß║ún l├╜ sß╗ò Chi ─æo├án, sß╗ò ─Éo├án vi├¬n, thu nß╗Öp ─æo├án ph├¡ ─æß╗ïnh kß╗│ ─æ├║ng hß║ín.',
      'Theo d├╡i, ph├ít hiß╗çn v├á bß╗ôi d╞░ß╗íng thanh ni├¬n ╞░u t├║ trong lß╗¢p ─æß╗â giß╗¢i thiß╗çu kß║┐t nß║íp ─Éo├án.',
      'C├╣ng Lß╗¢p tr╞░ß╗ƒng v├á Sao ─æß╗Å uß╗æn nß║»n t├íc phong, ─æß║ío ─æß╗⌐c, x├óy dß╗▒ng v─ân h├│a ß╗⌐ng xß╗¡ l├ánh mß║ính, kh├┤ng bß║ío lß╗▒c hß╗ìc ─æ╞░ß╗¥ng.'
    ]
  },
  {
    stt: 5,
    category: 'leadership',
    role: 'Thß╗º quß╗╣ & CS Lß╗ïch sß╗¡',
    studentId: 'hs_10a3_03', // Tß╗½ Diß╗çu Y├¬n Diß╗àm
    badgeColor: 'cyan',
    icon: 'fa-solid fa-coins',
    permissions: 'Quß║ún l├╜ thu - chi quß╗╣ lß╗¢p c├┤ng khai ΓÇó Quyß║┐t to├ín h├áng th├íng ΓÇó Ki├¬m CS m├┤n Sß╗¡',
    duties: [
      'Quß║ún l├╜ thu ΓÇô chi quß╗╣ lß╗¢p theo nguy├¬n tß║»c c├┤ng khai, minh bß║ích, tiß║┐t kiß╗çm v├á ─æ├║ng quy ─æß╗ïnh.',
      'Chi ti├¬u cho c├íc hoß║ít ─æß╗Öng thiß║┐t yß║┐u: n╞░ß╗¢c uß╗æng ─æ├│ng b├¼nh, phß║Ñn viß║┐t, giß║╗ lau, dß╗Ñng cß╗Ñ vß╗ç sinh, photo t├ái liß╗çu, th─âm hß╗Åi bß║ín b├¿ ß╗æm ─æau, khen th╞░ß╗ƒng thi ─æua tuß║ºn.',
      'Ghi ch├⌐p sß╗ò quß╗╣ chi tiß║┐t tß╗½ng khoß║ún thu - chi (c├│ ng├áy th├íng, chß╗» k├╜ ng╞░ß╗¥i nhß║¡n hoß║╖c h├│a ─æ╞ín k├¿m theo).',
      'B├ío c├ío c├┤ng khai t├ái ch├¡nh ─æß╗ïnh kß╗│ h├áng th├íng tr╞░ß╗¢c tß║¡p thß╗â lß╗¢p v├á nß╗Öp b├ío c├ío cho GVCN ph├¬ duyß╗çt.',
      'Ki├¬m phß╗Ñ tr├ích m├┤n Lß╗ïch sß╗¡: nhß║»c nhß╗ƒ ├┤n b├ái, tß╗òng hß╗úp thß║»c mß║»c kiß║┐n thß╗⌐c lß╗ïch sß╗¡ gß╗¡i gi├ío vi├¬n.'
    ]
  },
  {
    stt: 6,
    category: 'team_leaders',
    role: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 1',
    studentId: 'hs_10a3_43', // D╞░╞íng Lß╗Ñc Yß║┐n Vy
    badgeColor: 'teal',
    icon: 'fa-solid fa-users',
    permissions: 'Chß║Ñm ─æiß╗âm thi ─æua Tß╗ò 1 (m├ú PIN T1) ΓÇó Quß║ún l├╜ nß╗ü nß║┐p & chuy├¬n cß║ºn 8 th├ánh vi├¬n Tß╗ò 1',
    duties: [
      'Quß║ún l├╜ nß╗ü nß║┐p, chuy├¬n cß║ºn, trang phß╗Ñc cß╗ºa 8 th├ánh vi├¬n Tß╗ò 1; ─æiß╗âm danh ─æß║ºu giß╗¥ b├ío Lß╗¢p tr╞░ß╗ƒng.',
      'Chß║Ñm ─æiß╗âm thi ─æua h├áng ng├áy cho tß╗ò vi├¬n tr├¬n hß╗ç thß╗æng Dashboard (─æ╞░ß╗úc cß║Ñp m├ú PIN Tß╗ò 1).',
      'Kiß╗âm tra s├ích vß╗ƒ, b├ái tß║¡p vß╗ü nh├á cß╗ºa th├ánh vi├¬n trong tß╗ò trong 15 ph├║t ─æß║ºu giß╗¥.',
      'Ph├ón c├┤ng v├á gi├ím s├ít c├íc bß║ín trong tß╗ò thß╗▒c hiß╗çn trß╗▒c nhß║¡t khi ─æß║┐n l╞░ß╗út Tß╗ò 1.',
      'B├ío c├ío tß╗òng kß║┐t thi ─æua, nhß║¡n x├⌐t sß╗▒ tiß║┐n bß╗Ö cß╗ºa c├íc th├ánh vi├¬n tß╗ò trong tiß║┐t sinh hoß║ít cuß╗æi tuß║ºn.'
    ]
  },
  {
    stt: 7,
    category: 'team_leaders',
    role: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 2 & CS H├│a hß╗ìc',
    studentId: 'hs_10a3_25', // Nguyß╗àn Ho├áng Gia Nguy├¬n
    badgeColor: 'teal',
    icon: 'fa-solid fa-flask',
    permissions: 'Chß║Ñm ─æiß╗âm thi ─æua Tß╗ò 2 (m├ú PIN T2) ΓÇó Quß║ún l├╜ 7 th├ánh vi├¬n Tß╗ò 2 ΓÇó Ki├¬m CS m├┤n H├│a',
    duties: [
      'Bao qu├ít nß╗ü nß║┐p, chuy├¬n cß║ºn v├á th├íi ─æß╗Ö hß╗ìc tß║¡p cß╗ºa 7 th├ánh vi├¬n Tß╗ò 2; chß║Ñm ─æiß╗âm thi ─æua tß╗ò h├áng ng├áy.',
      'Ki├¬m phß╗Ñ tr├ích m├┤n H├│a hß╗ìc: li├¬n hß╗ç gi├ío vi├¬n bß╗Ö m├┤n chuß║⌐n bß╗ï tiß║┐t th├¡ nghiß╗çm, kiß╗âm tra b├ái tß║¡p H├│a cß╗ºa lß╗¢p tr╞░ß╗¢c giß╗¥ hß╗ìc.',
      '─É├┤n ─æß╗æc, hß╗ù trß╗ú c├íc th├ánh vi├¬n hß╗ìc tß║¡p v├á r├¿n luyß╗çn; ph├ón c├┤ng trß╗▒c nhß║¡t chu ─æ├ío khi ─æß║┐n phi├¬n Tß╗ò 2.',
      'B├ío c├ío kß║┐t quß║ú r├¿n luyß╗çn tß╗ò v├á g╞░╞íng tiß║┐n bß╗Ö cho GVCN.'
    ]
  },
  {
    stt: 8,
    category: 'team_leaders',
    role: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 3',
    studentId: 'hs_10a3_36', // L├¬ Thß╗ï Kim Tr├║c
    badgeColor: 'teal',
    icon: 'fa-solid fa-users',
    permissions: 'Chß║Ñm ─æiß╗âm thi ─æua Tß╗ò 3 (m├ú PIN T3) ΓÇó Quß║ún l├╜ 8 th├ánh vi├¬n Tß╗ò 3 (B├án 9-12 D├úy 1)',
    duties: [
      'Quß║ún l├╜ nß╗ü nß║┐p, trß║¡t tß╗▒, t├íc phong cß╗ºa 8 th├ánh vi├¬n Tß╗ò 3; chß║Ñm ─æiß╗âm thi ─æua h├áng ng├áy bß║▒ng m├ú PIN Tß╗ò 3.',
      '─É├┤n ─æß╗æc tß╗ò vi├¬n hß╗ìc b├ái, l├ám b├ái nghi├¬m t├║c; quß║ún l├╜ c├íc bß║ín ngß╗ôi tß║íi D├úy 1 (B├án 9 ─æß║┐n B├án 12).',
      '─Éiß╗üu phß╗æi tß╗ò vi├¬n trß╗▒c nhß║¡t vß╗ç sinh sß║ích sß║╜, giß╗» g├¼n khu vß╗▒c b├án ghß║┐ ng─ân nß║»p.',
      'Tß╗òng kß║┐t ─æiß╗âm sß╗æ, xß║┐p hß║íng thi ─æua nß╗Öi bß╗Ö tß╗ò v├á ph├ít biß╗âu nhß║¡n x├⌐t cuß╗æi tuß║ºn.'
    ]
  },
  {
    stt: 9,
    category: 'team_leaders',
    role: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 4 & CS Tiß║┐ng Anh',
    studentId: 'hs_10a3_15', // V├╡ Quß╗æc Duy Kh├┤i
    badgeColor: 'teal',
    icon: 'fa-solid fa-language',
    permissions: 'Chß║Ñm ─æiß╗âm thi ─æua Tß╗ò 4 (m├ú PIN T4) ΓÇó Quß║ún l├╜ 8 th├ánh vi├¬n Tß╗ò 4 ΓÇó Ki├¬m CS Tiß║┐ng Anh',
    duties: [
      'Quß║ún l├╜ nß╗ü nß║┐p v├á chß║Ñm ─æiß╗âm thi ─æua 8 th├ánh vi├¬n Tß╗ò 4 h├áng ng├áy; nhß║»c nhß╗ƒ giß╗» trß║¡t tß╗▒ v├á chuy├¬n cß║ºn.',
      'Ki├¬m phß╗Ñ tr├ích m├┤n Tiß║┐ng Anh: hß╗ù trß╗ú c├íc bß║ín ├┤n tß╗½ vß╗▒ng, ngß╗» ph├íp, ph├ít ─æß╗ü kiß╗âm tra, ─æ├┤n ─æß╗æc chuß║⌐n bß╗ï b├ái tr╞░ß╗¢c khi gi├ío vi├¬n v├áo lß╗¢p.',
      'Chß╗ë ─æß║ío tß╗ò vi├¬n trß╗▒c nhß║¡t ─æ├║ng quy ─æß╗ïnh; b├ío c├ío kß╗ïp thß╗¥i c├íc tr╞░ß╗¥ng hß╗úp vi phß║ím nß╗ü nß║┐p cho GVCN.'
    ]
  },
  {
    stt: 10,
    category: 'team_leaders',
    role: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 5 & CS Ngß╗» v─ân',
    studentId: 'hs_10a3_35', // Nguyß╗àn Ngß╗ìc Trinh
    badgeColor: 'teal',
    icon: 'fa-solid fa-feather-pointed',
    permissions: 'Chß║Ñm ─æiß╗âm thi ─æua Tß╗ò 5 (m├ú PIN T5) ΓÇó Quß║ún l├╜ 7 th├ánh vi├¬n Tß╗ò 5 ΓÇó Ki├¬m CS Ngß╗» v─ân',
    duties: [
      'Quß║ún l├╜ nß╗ü nß║┐p, chuy├¬n cß║ºn v├á chß║Ñm ─æiß╗âm thi ─æua 7 th├ánh vi├¬n Tß╗ò 5 h├áng ng├áy.',
      'Ki├¬m phß╗Ñ tr├ích m├┤n Ngß╗» v─ân: nhß║»c nhß╗ƒ soß║ín b├ái, ─æß╗ìc t├íc phß║⌐m, thu vß╗ƒ b├ái tß║¡p nß╗Öp cho gi├ío vi├¬n Ngß╗» v─ân ─æ├║ng hß║ín.',
      'Ph├ón c├┤ng tß╗ò vi├¬n trß╗▒c nhß║¡t; theo d├╡i, ─æß╗Öng vi├¬n c├íc bß║ín hß╗ìc sinh c├│ ─æiß╗âm r├¿n luyß╗çn thß║Ñp v╞░╞ín l├¬n.'
    ]
  },
  {
    stt: 11,
    category: 'team_leaders',
    role: 'Tß╗ò tr╞░ß╗ƒng Tß╗ò 6 & CS Sinh hß╗ìc',
    studentId: 'hs_10a3_23', // Tr╞░╞íng Thß╗ï Mß╗╣ Ng├ón
    badgeColor: 'teal',
    icon: 'fa-solid fa-dna',
    permissions: 'Chß║Ñm ─æiß╗âm thi ─æua Tß╗ò 6 (m├ú PIN T6) ΓÇó Quß║ún l├╜ 7 th├ánh vi├¬n Tß╗ò 6 ΓÇó Ki├¬m CS Sinh hß╗ìc',
    duties: [
      'Bao qu├ít nß╗ü nß║┐p, t├íc phong v├á chß║Ñm ─æiß╗âm thi ─æua 7 th├ánh vi├¬n Tß╗ò 6; quß║ún l├╜ trß║¡t tß╗▒ khu vß╗▒c cuß╗æi D├úy 2.',
      'Ki├¬m phß╗Ñ tr├ích m├┤n Sinh hß╗ìc: li├¬n hß╗ç gi├ío vi├¬n chuß║⌐n bß╗ï tranh ß║únh, mß║½u vß║¡t, ─æ├┤n ─æß╗æc l├ám b├ái tß║¡p Sinh hß╗ìc.',
      'Ph├ón c├┤ng trß╗▒c nhß║¡t nghi├¬m t├║c khi ─æß║┐n l╞░ß╗út Tß╗ò 6; nhß║¡n x├⌐t thi ─æua tß╗ò v├áo tiß║┐t sinh hoß║ít cuß╗æi tuß║ºn.'
    ]
  },
  {
    stt: 12,
    category: 'red_star',
    role: '─Éß╗Öi ng┼⌐ Sao ─æß╗Å (Trß╗▒c tuß║ºn thi ─æua)',
    studentId: ['hs_10a3_28', 'hs_10a3_37'], // Trß║ºn Thß╗ï Ngß╗ìc Ph├║c & V├╡ B├ích T├╣ng
    assignedNames: '1. Trß║ºn Thß╗ï Ngß╗ìc Ph├║c (Tß╗ò 1)\n2. V├╡ B├ích T├╣ng (Tß╗ò 3)',
    badgeColor: 'rose',
    icon: 'fa-solid fa-star',
    permissions: 'Kiß╗âm tra t├íc phong, ─æß╗ông phß╗Ñc, nß╗ü nß║┐p ΓÇó Trß╗▒c ban ch├⌐o theo ─Éo├án tr╞░ß╗¥ng',
    duties: [
      'Kiß╗âm tra nß╗ü nß║┐p t├íc phong ─æß║ºu giß╗¥ cß╗ºa lß╗¢p: ─æß╗ông phß╗Ñc ├ío trß║»ng/├ío thß╗â dß╗Ñc, ph├╣ hiß╗çu, d├⌐p quai hß║¡u/gi├áy, ─æi hß╗ìc ─æ├║ng giß╗¥.',
      'Theo d├╡i, ph├ít hiß╗çn c├íc tr╞░ß╗¥ng hß╗úp sß╗¡ dß╗Ñng ─æiß╗çn thoß║íi sai mß╗Ñc ─æ├¡ch, ─ân qu├á vß║╖t, l├ám viß╗çc ri├¬ng trong giß╗¥ hß╗ìc.',
      'Thß╗▒c hiß╗çn nhiß╗çm vß╗Ñ chß║Ñm ─æiß╗âm trß╗▒c ban ch├⌐o giß╗»a c├íc chi ─æo├án theo lß╗ïch ph├ón c├┤ng cß╗ºa Ban Thi ─æua ─Éo├án tr╞░ß╗¥ng (─æß║úm bß║úo c├┤ng t├óm, ch├¡nh x├íc, trung thß╗▒c).',
      'Ghi ch├⌐p g╞░╞íng ng╞░ß╗¥i tß╗æt, viß╗çc tß╗æt (nhß║╖t cß╗ºa r╞íi, gi├║p ─æß╗í bß║ín) ─æß╗â ─æß╗ü xuß║Ñt tuy├¬n d╞░╞íng, cß╗Öng ─æiß╗âm thi ─æua.'
    ]
  },
  {
    stt: 13,
    category: 'subject_cadres',
    role: 'Mß║íng l╞░ß╗¢i C├ín sß╗▒ c├íc Bß╗Ö m├┤n',
    studentId: null,
    assignedNames: 'ΓÇó To├ín: L├¬ Tuß║Ñn Ph├ít T├ái\nΓÇó L├╜: L├¬ V─ân V┼⌐\nΓÇó H├│a: Nguyß╗àn Ho├áng Gia Nguy├¬n\nΓÇó Sinh: Tr╞░╞íng Thß╗ï Mß╗╣ Ng├ón\nΓÇó V─ân: Nguyß╗àn Ngß╗ìc Trinh / Kim B╞í\nΓÇó Sß╗¡: Tß╗½ Diß╗çu Y├¬n Diß╗àm\nΓÇó Anh: V├╡ Quß╗æc Duy Kh├┤i\nΓÇó ─Éß╗ïa, Tin, GDCD: Ph├ón c├┤ng ki├¬m nhiß╗çm',
    badgeColor: 'purple',
    icon: 'fa-solid fa-shapes',
    permissions: 'Cß║ºu nß╗æi giß╗»a GV bß╗Ö m├┤n v├á lß╗¢p ΓÇó Quß║ún l├╜ b├ái tß║¡p, sß╗ò vß╗ƒ ΓÇó Chuß║⌐n bß╗ï ─æß╗ô d├╣ng, ph├▓ng thß╗▒c h├ánh',
    duties: [
      'L├á cß║ºu nß╗æi th├┤ng tin giß╗»a thß║ºy/c├┤ gi├ío bß╗Ö m├┤n v├á tß║¡p thß╗â hß╗ìc sinh lß╗¢p 10A3.',
      'Nhß║»c nhß╗ƒ cß║ú lß╗¢p chuß║⌐n bß╗ï ─æß╗ô d├╣ng, s├ích vß╗ƒ, ho├án th├ánh b├ái tß║¡p vß╗ü nh├á tr╞░ß╗¢c mß╗ùi tiß║┐t hß╗ìc chuy├¬n m├┤n.',
      'Thu nhß║¡n, kiß╗âm ─æß║┐m v├á b├án giao b├ái kiß╗âm tra, vß╗ƒ b├ái tß║¡p cho thß║ºy/c├┤ bß╗Ö m├┤n ─æ├║ng thß╗¥i hß║ín.',
      'Hß╗ù trß╗ú gi├ío vi├¬n chuß║⌐n bß╗ï m├íy chiß║┐u, ph├▓ng th├¡ nghiß╗çm thß╗▒c h├ánh, thiß║┐t bß╗ï dß║íy hß╗ìc chuy├¬n dß╗Ñng.',
      'Nhiß╗çt t├¼nh h╞░ß╗¢ng dß║½n, giß║úi ─æ├íp cho c├íc bß║ín c├▓n v╞░ß╗¢ng mß║»c kiß║┐n thß╗⌐c m├┤n hß╗ìc m├¼nh phß╗Ñ tr├ích.'
    ]
  },
  {
    stt: 14,
    category: 'members',
    role: 'To├án thß╗â Hß╗ìc sinh (Th├ánh vi├¬n Lß╗¢p 10A3)',
    studentId: null,
    assignedNames: 'Tß║¡p thß╗â 45 hß╗ìc sinh Lß╗¢p 10A3',
    badgeColor: 'slate',
    icon: 'fa-solid fa-user-group',
    permissions: 'Chß║Ñp h├ánh nß╗Öi quy ΓÇó Tham gia hß╗ìc tß║¡p & thi ─æua ΓÇó X├óy dß╗▒ng Lß╗¢p hß╗ìc Hß║ính ph├║c',
    duties: [
      'Chß║Ñp h├ánh nghi├¬m t├║c ─Éiß╗üu lß╗ç tr╞░ß╗¥ng THPT, nß╗Öi quy nh├á tr╞░ß╗¥ng v├á Quy chß║┐ thi ─æua nß╗Öi bß╗Ö lß╗¢p 10A3.',
      '─Éi hß╗ìc ─æ├║ng giß╗¥ (c├│ mß║╖t tr╞░ß╗¢c 15 ph├║t), mß║╖c ─æß╗ông phß╗Ñc chß╗ënh tß╗ü, giß╗» lß╗à ph├⌐p vß╗¢i thß║ºy c├┤ v├á ng╞░ß╗¥i lß╗¢n tuß╗òi.',
      'Trung thß╗▒c trong hß╗ìc tß║¡p v├á thi cß╗¡; t├¡ch cß╗▒c thß║úo luß║¡n, ph├ít biß╗âu x├óy dß╗▒ng b├ái trong c├íc tiß║┐t hß╗ìc.',
      'C├│ ├╜ thß╗⌐c giß╗» g├¼n vß╗ç sinh chung, trß╗▒c nhß║¡t ─æ├║ng lß╗ïch, bß║úo quß║ún b├án ghß║┐ v├á t├ái sß║ún ph├▓ng hß╗ìc.',
      '─Éo├án kß║┐t, y├¬u th╞░╞íng, gi├║p ─æß╗í lß║½n nhau; kh├┤ng tham gia bß║ío lß╗▒c hß╗ìc ─æ╞░ß╗¥ng; cam kß║┐t tiß║┐n bß╗Ö tß╗½ng b╞░ß╗¢c nhß╗Å (Baby Steps).'
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
      let seatDesc = `Tß╗ò ${s.groupNumber}`;
      if (appState.seating && Array.isArray(appState.seating)) {
        for (const tbl of appState.seating) {
          if (tbl.leftSeat && tbl.leftSeat.studentId === s.id) {
            seatDesc += ` ΓÇó ${tbl.title} (${tbl.tableId.includes('d1') ? 'D├úy 1 - Tr├íi' : 'D├úy 2 - Tr├íi'})`;
            break;
          }
          if (tbl.rightSeat && tbl.rightSeat.studentId === s.id) {
            seatDesc += ` ΓÇó ${tbl.title} (${tbl.tableId.includes('d1') ? 'D├úy 1 - Phß║úi' : 'D├úy 2 - Phß║úi'})`;
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
      return s ? `${s.fullName} (Tß╗ò ${s.groupNumber})` : id;
    }).join(' ΓÇó ');
    return {
      fullName: names,
      code: '',
      group: '',
      seatDesc: '─Éß╗Öi Sao ─Éß╗Å Trß╗▒c Ban To├án Tr╞░ß╗¥ng',
      rawStudent: null
    };
  }

  return {
    fullName: item.assignedNames || 'Tß║¡p thß╗â Lß╗¢p 10A3',
    code: '',
    group: '',
    seatDesc: item.category === 'members' ? 'To├án bß╗Ö 45 hß╗ìc sinh' : 'C├ín sß╗▒ bß╗Ö m├┤n',
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
        <p class="text-sm font-semibold">Kh├┤ng t├¼m thß║Ñy chß╗⌐c vß╗Ñ hoß║╖c nhiß╗çm vß╗Ñ ph├╣ hß╗úp vß╗¢i tß╗½ kh├│a.</p>
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
            <button type="button" onclick="copySingleCadreDuty(${item.stt})" class="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Sao ch├⌐p nhiß╗çm vß╗Ñ n├áy ─æß╗â gß╗¡i ri├¬ng cho hß╗ìc sinh">
              <i class="fa-solid fa-copy text-xs"></i>
            </button>
          </div>

          <!-- Assignee Name & Seat -->
          <div class="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
            <div class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hß╗ìc sinh ─æß║úm nhiß╗çm:</div>
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
            <strong>Quyß╗ün hß║ín:</strong> ${escapeHtml(item.permissions)}
          </div>

          <!-- Duties Bullet List -->
          <div>
            <div class="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Nhiß╗çm vß╗Ñ & Chß╗⌐c tr├ích cß╗Ñ thß╗â:
            </div>
            <ul class="space-y-1.5 pl-0.5">
              ${dutiesListHtml}
            </ul>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
          <span class="text-slate-400 dark:text-slate-500">
            <i class="fa-solid fa-star text-amber-500 mr-1"></i>Th╞░ß╗ƒng: +10 - 20─æ/tuß║ºn
          </span>
          <button type="button" onclick="copySingleCadreDuty(${item.stt})" class="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center space-x-1">
            <span>Sao ch├⌐p</span>
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

// Sao ch├⌐p nhanh to├án bß╗Ö bß║úng ph├ón c├┤ng nhiß╗çm vß╗Ñ ─æß╗â gß╗¡i Zalo lß╗¢p
function copyCadreDutiesForZalo() {
  let text = `≡ƒôï Bß║óNG PH├éN C├öNG CHß╗¿C TR├üCH & NHIß╗åM Vß╗ñ BAN C├üN Sß╗░ Lß╗ÜP 10A3\n`;
  text += `N─âm hß╗ìc 2026 ΓÇô 2027 ΓÇó GVCN Lß╗¢p 10A3\n`;
  text += `=========================================\n\n`;

  CADRE_DUTIES_DATA.forEach(item => {
    const info = getCadreStudentInfo(item);
    text += `≡ƒö╣ ${item.stt}. ${item.role.toUpperCase()}: ${info.fullName}\n`;
    text += `   ΓÇó ─É╞ín vß╗ï: ${info.seatDesc}\n`;
    text += `   ΓÇó Quyß╗ün hß║ín: ${item.permissions}\n`;
    text += `   ΓÇó Nhiß╗çm vß╗Ñ trß╗ìng t├óm:\n`;
    item.duties.forEach(d => {
      text += `     - ${d}\n`;
    });
    text += `\n`;
  });

  text += `=========================================\n`;
  text += `≡ƒÄü CHß║╛ ─Éß╗ÿ ─É├âI NGß╗ÿ & ─ÉIß╗éM TH╞»ß╗₧NG:\n`;
  text += `+ C├ín sß╗▒ ho├án th├ánh tß╗æt nhiß╗çm vß╗Ñ: Cß╗Öng +10 ─æß║┐n +20 ─æiß╗âm thi ─æua/tuß║ºn.\n`;
  text += `+ ╞»u ti├¬n xß║┐p loß║íi R├¿n luyß╗çn Tß╗æt/Xuß║Ñt sß║»c v├á phß║ºn th╞░ß╗ƒng danh dß╗▒ tß╗½ Quß╗╣ lß╗¢p.\n`;
  text += `+ Ban c├ín sß╗▒ cam kß║┐t n├¬u g╞░╞íng, ─æo├án kß║┐t, trung thß╗▒c v├¼ mß╗Öt tß║¡p thß╗â 10A3 vß╗»ng mß║ính!\n`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('─É├ú sao ch├⌐p nß╗Öi dung bß║úng ph├ón c├┤ng ─æß╗â gß╗¡i Zalo lß╗¢p!', 'success');
    }).catch(() => {
      fallbackCopyText(text, '─É├ú sao ch├⌐p nß╗Öi dung bß║úng ph├ón c├┤ng ─æß╗â gß╗¡i Zalo lß╗¢p!');
    });
  } else {
    fallbackCopyText(text, '─É├ú sao ch├⌐p nß╗Öi dung bß║úng ph├ón c├┤ng ─æß╗â gß╗¡i Zalo lß╗¢p!');
  }
}

// Sao ch├⌐p nhiß╗çm vß╗Ñ cß╗ºa 1 c├í nh├ón
function copySingleCadreDuty(stt) {
  const item = CADRE_DUTIES_DATA.find(d => d.stt === stt);
  if (!item) return;

  const info = getCadreStudentInfo(item);
  let text = `≡ƒôî NHIß╗åM Vß╗ñ Cß╗ªA ${item.role.toUpperCase()}: ${info.fullName}\n`;
  text += `Vß╗ï tr├¡: ${info.seatDesc}\n`;
  text += `Quyß╗ün hß║ín: ${item.permissions}\n`;
  text += `Chß╗⌐c tr├ích & Nhiß╗çm vß╗Ñ cß╗Ñ thß╗â:\n`;
  item.duties.forEach((d, idx) => {
    text += `${idx + 1}. ${d}\n`;
  });
  text += `\nThß║ºy/C├┤ GVCN tin t╞░ß╗ƒng v├á ch├║c em ho├án th├ánh xuß║Ñt sß║»c nhiß╗çm vß╗Ñ!`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`─É├ú sao ch├⌐p nhiß╗çm vß╗Ñ cß╗ºa ${item.role}!`, 'success');
    }).catch(() => {
      fallbackCopyText(text, `─É├ú sao ch├⌐p nhiß╗çm vß╗Ñ cß╗ºa ${item.role}!`);
    });
  } else {
    fallbackCopyText(text, `─É├ú sao ch├⌐p nhiß╗çm vß╗Ñ cß╗ºa ${item.role}!`);
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
    showToast('Kh├┤ng thß╗â sao ch├⌐p v─ân bß║ún tß╗▒ ─æß╗Öng!', 'error');
  }
  document.body.removeChild(textarea);
}

// ==================== XUß║ñT FILE WORD (.DOC) CHUß║¿N THß╗é THß╗¿C H├ÇNH CH├ìNH ====================
function exportCadreDutiesToWord() {
  try {
    showToast('─Éang tß║ío file Word Bß║úng Ph├ón C├┤ng Nhiß╗çm Vß╗Ñ...', 'info');

    let tableRowsHtml = '';
    CADRE_DUTIES_DATA.forEach(item => {
      const info = getCadreStudentInfo(item);
      const isEven = item.stt % 2 === 0;
      const bg = isEven ? '#f8fafc' : '#ffffff';

      const dutiesHtml = item.duties.map(d => `<div style="margin-bottom: 3pt;">ΓÇó ${escapeHtml(d)}</div>`).join('');

      tableRowsHtml += `
        <tr style="background-color: ${bg};">
          <td style="text-align: center; font-weight: bold; padding: 6pt; border: 1px solid #1e3a8a;">${item.stt}</td>
          <td style="font-weight: bold; padding: 6pt; border: 1px solid #1e3a8a; color: #0f172a;">${escapeHtml(item.role)}</td>
          <td style="font-weight: bold; padding: 6pt; border: 1px solid #1e3a8a; color: #1e3a8a;">${escapeHtml(info.fullName).replace(/\n/g, '<br>')}</td>
          <td style="text-align: center; font-style: italic; padding: 6pt; border: 1px solid #1e3a8a;">${escapeHtml(info.seatDesc)}</td>
          <td style="padding: 6pt; border: 1px solid #1e3a8a; font-size: 10pt; line-height: 1.25;">
            <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 2pt;">Quyß╗ün hß║ín: ${escapeHtml(item.permissions)}</div>
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
      <title>Bß║úng Ph├ón C├┤ng Nhiß╗çm Vß╗Ñ Ban C├ín Sß╗▒ Lß╗¢p 10A3</title>
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
          margin: 56.7pt 42.5pt 56.7pt 70.8pt; /* Tr├¬n 2cm, D╞░ß╗¢i 2cm, Tr├íi 2.5cm, Phß║úi 1.5cm */
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
        <!-- Quß╗æc hiß╗çu & T├¬n tr╞░ß╗¥ng -->
        <table class="header-tbl" style="width: 100%; margin-bottom: 10pt;">
          <tr>
            <td style="width: 45%; text-align: center; vertical-align: top;">
              <div style="font-size: 10pt; font-weight: bold;">Sß╗₧ GI├üO Dß╗ñC V├Ç ─É├ÇO Tß║áO</div>
              <div style="font-size: 10.5pt; font-weight: bold;">TR╞»ß╗£NG THPT NGUYß╗äN Bß╗êNH KHI├èM</div>
              <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a; margin-top: 2pt;">Tß║¼P THß╗é Lß╗ÜP 10A3</div>
              <div style="font-weight: bold;">***</div>
            </td>
            <td style="width: 55%; text-align: center; vertical-align: top;">
              <div style="font-size: 10.5pt; font-weight: bold;">Cß╗ÿNG H├ÆA X├â Hß╗ÿI CHß╗ª NGH─¿A VIß╗åT NAM</div>
              <div style="font-size: 11pt; font-weight: bold; font-style: italic;">─Éß╗Öc lß║¡p ΓÇô Tß╗▒ do ΓÇô Hß║ính ph├║c</div>
              <div style="margin-top: 2pt;">-----------------------</div>
            </td>
          </tr>
        </table>

        <div style="text-align: right; font-style: italic; font-size: 11pt; margin-bottom: 8pt;">
          Lß╗¢p 10A3, ng├áy 09 th├íng 11 n─âm 2026
        </div>

        <div style="text-align: center; margin-bottom: 4pt;">
          <h1 style="font-size: 15pt; font-weight: bold; color: #0f172a; margin: 0;">Bß║óNG PH├éN C├öNG CHß╗¿C TR├üCH & NHIß╗åM Vß╗ñ</h1>
          <div style="font-size: 11.5pt; font-weight: bold; color: #1e3a8a; margin-top: 3pt;">BAN C├üN Sß╗░ & ─Éß╗ÿI NG┼¿ Tß╗░ QUß║óN Lß╗ÜP 10A3 - N─éM Hß╗îC 2026 ΓÇô 2027</div>
          <div style="font-size: 10.5pt; font-style: italic; color: #475569;">(Ban h├ánh k├¿m theo Quy chß║┐ thi ─æua nß╗Öi bß╗Ö & Ch╞░╞íng tr├¼nh GDPT 2018)</div>
        </div>

        <p style="text-align: justify; text-indent: 20pt; margin-top: 10pt; margin-bottom: 8pt; font-size: 11pt;">
          Nhß║▒m x├óy dß╗▒ng tß║¡p thß╗â Lß╗¢p 10A3 kß╗╖ c╞░╞íng, ─æo├án kß║┐t, hß╗ìc tß║¡p tß╗æt, h╞░ß╗¢ng tß╗¢i m├┤ h├¼nh Tr╞░ß╗¥ng hß╗ìc hß║ính ph├║c; ph├ít huy t├¡nh tß╗▒ gi├íc, tinh thß║ºn tr├ích nhiß╗çm v├á kß╗╣ n─âng l├únh ─æß║ío bß║ún th├ón cß╗ºa tß╗½ng hß╗ìc sinh; Gi├ío vi├¬n chß╗º nhiß╗çm c├┤ng bß╗æ v├á ph├ón c├┤ng chß╗⌐c tr├ích, nhiß╗çm vß╗Ñ cß╗Ñ thß╗â cho tß╗½ng th├ánh vi├¬n Ban C├ín Sß╗▒, ─æß╗Öi ng┼⌐ tß╗▒ quß║ún v├á to├án thß╗â hß╗ìc sinh lß╗¢p 10A3 nh╞░ sau:
        </p>

        <!-- Bß║úng danh s├ích nhiß╗çm vß╗Ñ -->
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">STT</th>
              <th style="width: 17%;">Chß╗⌐c Vß╗Ñ</th>
              <th style="width: 18%;">Hß╗ì V├á T├¬n Hß╗ìc Sinh</th>
              <th style="width: 12%;">─É╞ín Vß╗ï / Vß╗ï Tr├¡</th>
              <th style="width: 48%;">Chß╗⌐c Tr├ích & Nhiß╗çm Vß╗Ñ Trß╗ìng T├óm</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- Chß║┐ ─æß╗Ö khen th╞░ß╗ƒng -->
        <div style="margin-top: 12pt; margin-bottom: 8pt;">
          <div style="font-size: 11.5pt; font-weight: bold; color: #1e3a8a; margin-bottom: 4pt;">
            CHß║╛ ─Éß╗ÿ KHEN TH╞»ß╗₧NG, ─É├âI NGß╗ÿ & Xß╗¼ L├¥ TR├üCH NHIß╗åM
          </div>
          <div style="font-size: 10.5pt; margin-bottom: 3pt; text-align: justify;">
            <strong>1. Khen th╞░ß╗ƒng ─æß╗ïnh kß╗│:</strong> C├ín sß╗▒ lß╗¢p, Tß╗ò tr╞░ß╗ƒng, Sao ─æß╗Å v├á C├ín sß╗▒ bß╗Ö m├┤n ho├án th├ánh xuß║Ñt sß║»c nhiß╗çm vß╗Ñ trong tuß║ºn/th├íng sß║╜ ─æ╞░ß╗úc cß╗Öng ─æiß╗âm thi ─æua c├í nh├ón (+10 ─æß║┐n +20 ─æiß╗âm), ─æ╞░ß╗úc ╞░u ti├¬n xß║┐p loß║íi R├¿n luyß╗çn Xuß║Ñt sß║»c/Tß╗æt cuß╗æi hß╗ìc kß╗│ v├á ─æ╞░ß╗úc nhß║¡n phß║ºn th╞░ß╗ƒng danh dß╗▒ tß╗½ Quß╗╣ lß╗¢p.
          </div>
          <div style="font-size: 10.5pt; margin-bottom: 3pt; text-align: justify;">
            <strong>2. Quyß╗ün hß║ín tß╗▒ quß║ún:</strong> Ban C├ín Sß╗▒ v├á Tß╗ò tr╞░ß╗ƒng c├│ to├án quyß╗ün ghi nhß║¡n, chß║Ñm ─æiß╗âm thi ─æua th├ánh vi├¬n theo thang ─æiß╗âm quy ─æß╗ïnh; c├│ quyß╗ün nhß║»c nhß╗ƒ v├á ─æß╗ü xuß║Ñt GVCN biß╗âu d╞░╞íng hoß║╖c kiß╗âm ─æiß╗âm c├íc tr╞░ß╗¥ng hß╗úp cß╗Ñ thß╗â.
          </div>
          <div style="font-size: 10.5pt; margin-bottom: 6pt; text-align: justify;">
            <strong>3. Xß╗¡ l├╜ tr├ích nhiß╗çm:</strong> Nß║┐u c├ín sß╗▒ bao che khuyß║┐t ─æiß╗âm, thiß║┐u g╞░╞íng mß║½u hoß║╖c kh├┤ng ho├án th├ánh nhiß╗çm vß╗Ñ ─æ╞░ß╗úc giao qu├í 02 tuß║ºn li├¬n tiß║┐p, lß╗¢p sß║╜ tiß║┐n h├ánh g├│p ├╜ trong tiß║┐t sinh hoß║ít v├á GVCN sß║╜ xem x├⌐t miß╗àn nhiß╗çm, ─æiß╗üu chuyß╗ân vß╗ï tr├¡ ph├╣ hß╗úp.
          </div>
        </div>

        <!-- Chß╗» k├╜ -->
        <table class="sign-tbl" style="width: 100%; margin-top: 15pt;">
          <tr>
            <td style="width: 33%; font-weight: bold; font-size: 10.5pt;">
              ─Éß║áI DIß╗åN CHI ─ÉO├ÇN<br>
              B├ì TH╞»<br>
              <span style="font-weight: normal; font-style: italic; font-size: 9.5pt;">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</span>
              <br><br><br><br>
              Tß║í Thanh Ngß╗ìc Gi├áu
            </td>
            <td style="width: 34%; font-weight: bold; font-size: 10.5pt;">
              ─Éß║áI DIß╗åN BAN C├üN Sß╗░<br>
              Lß╗ÜP TR╞»ß╗₧NG<br>
              <span style="font-weight: normal; font-style: italic; font-size: 9.5pt;">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</span>
              <br><br><br><br>
              Trß║ºn L├¬ Hß╗ông Nhung
            </td>
            <td style="width: 33%; font-weight: bold; font-size: 10.5pt; color: #b91c1c;">
              DUYß╗åT Cß╗ªA GVCN<br>
              GI├üO VI├èN CHß╗ª NHIß╗åM<br>
              <span style="font-weight: normal; font-style: italic; font-size: 9.5pt;">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</span>
              <br><br><br><br>
              Thß║ºy/C├┤ Chß╗º Nhiß╗çm 10A3
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

    showToast('Xuß║Ñt th├ánh c├┤ng file Word Bß║úng Ph├ón C├┤ng Nhiß╗çm Vß╗Ñ!', 'success');
  } catch (error) {
    console.error('Lß╗ùi khi xuß║Ñt Word:', error);
    showToast('Lß╗ùi khi tß║ío file Word: ' + error.message, 'error');
  }
}

// ==================== IN V├Ç PREVIEW Bß║óNG PH├éN C├öNG NHIß╗åM Vß╗ñ (A4) ====================
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

    const dutiesHtml = item.duties.map(d => `<div class="mb-1 text-[11px] leading-tight">ΓÇó ${escapeHtml(d)}</div>`).join('');

    tableRowsHtml += `
      <tr style="background-color: ${bg};" class="border-b border-slate-300">
        <td class="text-center font-bold p-2 border border-slate-400 text-xs">${item.stt}</td>
        <td class="font-bold p-2 border border-slate-400 text-xs text-slate-900">${escapeHtml(item.role)}</td>
        <td class="font-bold p-2 border border-slate-400 text-xs text-blue-900 whitespace-pre-line">${escapeHtml(info.fullName)}</td>
        <td class="text-center italic p-2 border border-slate-400 text-[11px] text-slate-600">${escapeHtml(info.seatDesc)}</td>
        <td class="p-2 border border-slate-400 text-xs">
          <div class="font-bold text-blue-800 text-[11px] mb-1">Quyß╗ün hß║ín: ${escapeHtml(item.permissions)}</div>
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
          <div class="text-xs font-bold uppercase">Sß╗₧ GI├üO Dß╗ñC V├Ç ─É├ÇO Tß║áO</div>
          <div class="text-xs font-bold uppercase">TR╞»ß╗£NG THPT NGUYß╗äN Bß╗êNH KHI├èM</div>
          <div class="text-sm font-black text-blue-900 mt-1 uppercase">Tß║¼P THß╗é Lß╗ÜP 10A3</div>
          <div class="text-xs font-bold mt-0.5">***</div>
        </div>
        <div class="text-center w-7/12">
          <div class="text-xs font-bold uppercase">Cß╗ÿNG H├ÆA X├â Hß╗ÿI CHß╗ª NGH─¿A VIß╗åT NAM</div>
          <div class="text-xs font-bold italic">─Éß╗Öc lß║¡p ΓÇô Tß╗▒ do ΓÇô Hß║ính ph├║c</div>
          <div class="text-xs font-bold mt-1">-----------------------</div>
        </div>
      </div>

      <div class="text-right italic text-xs mb-3 text-slate-600">
        Lß╗¢p 10A3, ng├áy 09 th├íng 11 n─âm 2026
      </div>

      <!-- Title -->
      <div class="text-center mb-5">
        <h2 class="text-lg font-black text-slate-900 uppercase tracking-wide">Bß║óNG PH├éN C├öNG CHß╗¿C TR├üCH & NHIß╗åM Vß╗ñ</h2>
        <div class="text-sm font-bold text-blue-900 mt-1">BAN C├üN Sß╗░ & ─Éß╗ÿI NG┼¿ Tß╗░ QUß║óN Lß╗ÜP 10A3 - N─éM Hß╗îC 2026 ΓÇô 2027</div>
        <div class="text-xs italic text-slate-500 mt-0.5">(Ban h├ánh k├¿m theo Quy chß║┐ thi ─æua nß╗Öi bß╗Ö & Ch╞░╞íng tr├¼nh GDPT 2018)</div>
      </div>

      <p class="text-justify indent-6 text-xs leading-relaxed mb-4 text-slate-700">
        Nhß║▒m x├óy dß╗▒ng tß║¡p thß╗â Lß╗¢p 10A3 kß╗╖ c╞░╞íng, ─æo├án kß║┐t, hß╗ìc tß║¡p tß╗æt, h╞░ß╗¢ng tß╗¢i m├┤ h├¼nh Tr╞░ß╗¥ng hß╗ìc hß║ính ph├║c; ph├ít huy t├¡nh tß╗▒ gi├íc, tinh thß║ºn tr├ích nhiß╗çm v├á kß╗╣ n─âng l├únh ─æß║ío bß║ún th├ón cß╗ºa tß╗½ng hß╗ìc sinh; Gi├ío vi├¬n chß╗º nhiß╗çm c├┤ng bß╗æ v├á ph├ón c├┤ng chß╗⌐c tr├ích, nhiß╗çm vß╗Ñ cß╗Ñ thß╗â cho tß╗½ng th├ánh vi├¬n Ban C├ín Sß╗▒, ─æß╗Öi ng┼⌐ tß╗▒ quß║ún v├á to├án thß╗â hß╗ìc sinh lß╗¢p 10A3 nh╞░ sau:
      </p>

      <!-- Table -->
      <table class="w-full border-collapse border border-slate-400 mb-5 text-left">
        <thead>
          <tr class="bg-blue-900 text-white text-xs font-bold">
            <th class="p-2 border border-slate-400 text-center w-[5%]">STT</th>
            <th class="p-2 border border-slate-400 w-[18%]">Chß╗⌐c Vß╗Ñ</th>
            <th class="p-2 border border-slate-400 w-[19%]">Hß╗ì V├á T├¬n Hß╗ìc Sinh</th>
            <th class="p-2 border border-slate-400 text-center w-[13%]">Vß╗ï Tr├¡ / Tß╗ò</th>
            <th class="p-2 border border-slate-400 w-[45%]">Chß╗⌐c Tr├ích & Nhiß╗çm Vß╗Ñ Trß╗ìng T├óm</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <!-- Rules -->
      <div class="text-xs space-y-1.5 mb-6 text-slate-800">
        <div class="font-bold text-blue-900 uppercase">Chß║┐ ─æß╗Ö khen th╞░ß╗ƒng, ─æ├úi ngß╗Ö & xß╗¡ l├╜ tr├ích nhiß╗çm:</div>
        <p class="leading-relaxed"><strong>1. Khen th╞░ß╗ƒng ─æß╗ïnh kß╗│:</strong> C├ín sß╗▒ ho├án th├ánh tß╗æt nhiß╗çm vß╗Ñ ─æ╞░ß╗úc cß╗Öng +10 ─æß║┐n +20 ─æiß╗âm thi ─æua/tuß║ºn, ╞░u ti├¬n xß║┐p loß║íi R├¿n luyß╗çn Tß╗æt/Xuß║Ñt sß║»c v├á nhß║¡n qu├á biß╗âu d╞░╞íng tß╗½ Quß╗╣ lß╗¢p.</p>
        <p class="leading-relaxed"><strong>2. Quyß╗ün hß║ín tß╗▒ quß║ún:</strong> Ban C├ín Sß╗▒ ─æ╞░ß╗úc cß║Ñp m├ú PIN bß║úo mß║¡t ri├¬ng ─æß╗â chß║Ñm ─æiß╗âm thi ─æua th├ánh vi├¬n, ─æ├┤n ─æß╗æc nß╗ü nß║┐p v├á ─æß╗ü xuß║Ñt GVCN tuy├¬n d╞░╞íng hoß║╖c nhß║»c nhß╗ƒ.</p>
        <p class="leading-relaxed"><strong>3. Xß╗¡ l├╜ tr├ích nhiß╗çm:</strong> C├ín sß╗▒ vi phß║ím kß╗╖ luß║¡t, bao che hoß║╖c bß╗Å b├¬ nhiß╗çm vß╗Ñ qu├í 02 tuß║ºn li├¬n tiß║┐p sß║╜ bß╗ï g├│p ├╜ v├á xem x├⌐t ─æiß╗üu chuyß╗ân hoß║╖c miß╗àn nhiß╗çm.</p>
      </div>

      <!-- Signatures -->
      <div class="grid grid-cols-3 gap-4 text-center text-xs mt-6 pt-2">
        <div>
          <div class="font-bold uppercase">─Éß║áI DIß╗åN CHI ─ÉO├ÇN<br>B├ì TH╞»</div>
          <div class="text-[10px] italic text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</div>
          <div class="h-16"></div>
          <div class="font-bold text-slate-900">Tß║í Thanh Ngß╗ìc Gi├áu</div>
        </div>
        <div>
          <div class="font-bold uppercase">─Éß║áI DIß╗åN BAN C├üN Sß╗░<br>Lß╗ÜP TR╞»ß╗₧NG</div>
          <div class="text-[10px] italic text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</div>
          <div class="h-16"></div>
          <div class="font-bold text-slate-900">Trß║ºn L├¬ Hß╗ông Nhung</div>
        </div>
        <div>
          <div class="font-bold uppercase text-rose-700">DUYß╗åT Cß╗ªA GVCN<br>GI├üO VI├èN CHß╗ª NHIß╗åM</div>
          <div class="text-[10px] italic text-slate-500">(K├╜ v├á ghi r├╡ hß╗ì t├¬n)</div>
          <div class="h-16"></div>
          <div class="font-bold text-slate-900">Thß║ºy/C├┤ Chß╗º Nhiß╗çm 10A3</div>
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
