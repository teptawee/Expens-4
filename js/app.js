/**
 * app.js - Init + Navigation
 * โหลดเป็นไฟล์สุดท้าย
 */

console.log('✅ app.js loaded');

const APP_DATA = {
  categories: [],
  paymentTypes: [],
  expenses: [],
  dashboard: null,
  weeklyComparison: null
};

/* =====================================================
   HEADER SCROLL EFFECT
   ===================================================== */
function initHeaderScroll() {
  const header = document.querySelector('.app-header');
  if (!header) return;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > 8) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* =====================================================
   INIT
   ===================================================== */
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  console.log('🚀 initApp started');
  initHeaderScroll();          // ✅ เพิ่มบรรทัดนี้
  setToday();
  setCurrentDate();
  showView('dashboard');
  loadAllData();
  setHistoryRange(7);
}

/* ... ที่เหลือคงเดิม ... */

/* =====================================================
   LOAD DATA
   ===================================================== */
async function loadAllData() {
  showLoading(true, 'กำลังโหลดข้อมูล...');

  const tasks = [
    API.getMasterData().then(r => {
      if (r && r.success !== false) {
        APP_DATA.categories = r.categories || [];
        APP_DATA.paymentTypes = r.paymentTypes || [];
        renderMasterDropdowns();
        renderMasterTables();
      }
    }).catch(e => console.warn('master:', e)),

    API.getExpenses().then(r => {
      if (r && r.success !== false) {
        APP_DATA.expenses = r.data || [];
        renderHistoryGrouped();
        renderRecentTransactions();
      }
    }).catch(e => console.warn('expenses:', e)),

    API.getDashboard().then(r => {
      if (r && r.success !== false) {
        APP_DATA.dashboard = r.data || {};
        renderDashboard();
      }
    }).catch(e => console.warn('dashboard:', e)),

    API.getWeeklyComparison().then(r => {
      if (r && r.success !== false) {
        APP_DATA.weeklyComparison = r.data || {};
        renderWeeklyComparison();
      }
    }).catch(e => console.warn('weekly:', e))
  ];

  try {
    await Promise.allSettled(tasks);
  } finally {
    showLoading(false);
    console.log('✅ loadAllData finished');
  }
}

async function refreshAfterChange() {
  clearCache();
  showLoading(true, 'กำลังอัปเดต...');
  try {
    const [expenses, dashboard, weekly] = await Promise.all([
      API.getExpenses(),
      API.getDashboard(),
      API.getWeeklyComparison()
    ]);

    if (expenses && expenses.success !== false) {
      APP_DATA.expenses = expenses.data || [];
      renderHistoryGrouped();
      renderRecentTransactions();
    }
    if (dashboard && dashboard.success !== false) {
      APP_DATA.dashboard = dashboard.data || {};
      renderDashboard();
    }
    if (weekly && weekly.success !== false) {
      APP_DATA.weeklyComparison = weekly.data || {};
      renderWeeklyComparison();
    }
  } catch (err) {
    toast('อัปเดตไม่สำเร็จ: ' + (err.message || err));
  } finally {
    showLoading(false);
  }
}

/* =====================================================
   NAVIGATION
   ===================================================== */
function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1));
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const nav = document.getElementById('nav' + view.charAt(0).toUpperCase() + view.slice(1));
  if (nav) nav.classList.add('active');

  document.querySelectorAll('.bottom-nav-item').forEach(btn => btn.classList.remove('active'));
  const navMob = document.getElementById('nav' + view.charAt(0).toUpperCase() + view.slice(1) + 'Mob');
  if (navMob) navMob.classList.add('active');

  if (view === 'history') renderHistoryGrouped();
  if (view === 'master') renderMasterTables();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =====================================================
   MODAL CLOSE ON BACKDROP / ESC
   ===================================================== */
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
});
