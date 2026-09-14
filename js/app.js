/**
 * app.js - Logic หลักของแอป
 * ✅ ปรับให้โหลดแบบ progressive + refresh เฉพาะที่จำเป็น
 */

const APP_DATA = {
  categories: [],
  paymentTypes: [],
  expenses: [],
  dashboard: null,
  weeklyComparison: null
};

let loadingCount = 0;
let currentExpensePage = 1;

/* =====================================================
   INIT
   ===================================================== */
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  setToday();
  setCurrentDate();
  showView('dashboard');
  loadAllData();
}

/* =====================================================
   LOAD DATA (progressive — แสดงทันทีที่แต่ละตัวเสร็จ)
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
        renderExpenseTable();
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
  }
}

/* =====================================================
   REFRESH AFTER CHANGE (โหลดเฉพาะ 3 ตัว — ไม่รวม master)
   ===================================================== */
async function refreshAfterChange() {
  clearCache();                            // เคลียร์ cache เก่า
  showLoading(true, 'กำลังอัปเดต...');
  try {
    const [expenses, dashboard, weekly] = await Promise.all([
      API.getExpenses(),
      API.getDashboard(),
      API.getWeeklyComparison()
    ]);

    if (expenses && expenses.success !== false) {
      APP_DATA.expenses = expenses.data || [];
      renderExpenseTable();
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

  if (view === 'history') renderExpenseTable();
  if (view === 'master') renderMasterTables();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =====================================================
   UI HELPERS
   ===================================================== */
function showLoading(show, text) {
  const el = document.getElementById('loading');
  if (show) {
    loadingCount++;
    document.getElementById('loadingText').textContent = text || 'กำลังประมวลผล...';
    el.classList.add('show');
  } else {
    loadingCount = Math.max(0, loadingCount - 1);
    if (loadingCount === 0) el.classList.remove('show');
  }
}

function toast(message) {
  const el = document.getElementById('toast');
  el.innerHTML = '<i class="fa-solid fa-sparkles text-pink-300"></i> ' + escapeHtml(message || '');
  el.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.remove('show'), 3000);
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function money(value) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency', currency: 'THB', minimumFractionDigits: 2
  }).format(Number(value || 0));
}

function moneyShort(v) {
  const n = Number(v || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + '฿' + new Intl.NumberFormat('th-TH').format(Math.round(abs));
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getCategoryIcon(name) {
  const n = String(name || '');
  for (const c of CATEGORY_ICONS) {
    if (n.indexOf(c.key) !== -1) return c;
  }
  return { icon: 'fa-solid fa-receipt', color: '#6366f1' };
}

function setToday() {
  const el = document.getElementById('expense_date');
  if (!el) return;
  const now = new Date();
  el.value = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
}

function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const now = new Date();
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  el.textContent = 'วัน' + days[now.getDay()] + 'ที่ ' + now.getDate() + ' ' +
    months[now.getMonth()] + ' ' + (now.getFullYear() + 543);
}

/* =====================================================
   DASHBOARD
   ===================================================== */
function renderDashboard() {
  const d = APP_DATA.dashboard || {};
  document.getElementById('heroMonth').textContent = money(d.month);
  document.getElementById('heroBudget').textContent = money(d.totalBudget).replace(/\.00$/, '');
  document.getElementById('heroRemain').textContent = money(d.totalBudgetRemaining).replace(/\.00$/, '');
  document.getElementById('heroPercent').textContent = (d.budgetUsagePercent || 0) + '%';
  document.getElementById('heroProgress').style.width = Math.min(100, d.budgetUsagePercent || 0) + '%';
  document.getElementById('heroCompare').textContent = '-3.1%';

  document.getElementById('pillToday').textContent = money(d.today).replace(/\.00$/, '');
  document.getElementById('pillWeek').textContent = money(d.week).replace(/\.00$/, '');
  document.getElementById('pillYear').textContent = money(d.year).replace(/\.00$/, '');

  renderBudgetGrid(d);
  renderPaymentChart(d);
  renderCategoryChart(d);
}

function renderBudgetGrid(d) {
  const el = document.getElementById('budgetGrid');
  if (!el) return;
  const rows = d.categoryBudget || [];

  if (!rows.length) {
    el.innerHTML = '<div class="text-sm text-slate-400 py-6 text-center col-span-full">ไม่มีข้อมูล</div>';
    return;
  }

  el.innerHTML = rows.map(item => {
    const percent = Math.min(100, Math.max(0, Number(item.usage_percent || 0)));
    const remainPct = Math.max(0, Math.round(100 - percent));

    let cardClass = 'budget-card-normal';
    let percentColor = '#10b981';
    let progressColor = 'linear-gradient(90deg, #34d399 0%, #10b981 100%)';

    if (item.status === 'warning') {
      cardClass = 'budget-card-warning';
      percentColor = '#f59e0b';
      progressColor = 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)';
    }
    if (item.status === 'over') {
      cardClass = 'budget-card-over';
      percentColor = '#f43f5e';
      progressColor = 'linear-gradient(90deg, #fb7185 0%, #e11d48 100%)';
    }

    const iconMeta = getCategoryIcon(item.category_name);
    const iconBg = hexToRgba(iconMeta.color, 0.15);

    return `
      <div class="budget-card ${cardClass}">
        <div class="flex items-start gap-3">
          <div class="budget-icon" style="background:${iconBg};color:${iconMeta.color}">
            <i class="${iconMeta.icon}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold text-[#1e1b4b] truncate">${escapeHtml(item.category_name)}</div>
            <div class="text-[11px] text-slate-500 mt-0.5">คงเหลือ ${remainPct}%</div>
          </div>
          <div class="text-lg font-bold num" style="color:${percentColor}">${item.usage_percent || 0}%</div>
        </div>
        <div class="budget-stats-row">
          <div class="budget-stat-item">
            <div class="budget-stat-label"><i class="fa-solid fa-arrow-down text-[8px]" style="color:#3b82f6"></i> ใช้ไป</div>
            <div class="budget-stat-value budget-stat-used">${moneyShort(item.spent_amount)}</div>
          </div>
          <div class="budget-stat-item">
            <div class="budget-stat-label"><i class="fa-solid fa-wallet text-[8px]" style="color:#8b5cf6"></i> วงเงิน</div>
            <div class="budget-stat-value budget-stat-total">${moneyShort(item.budget_amount)}</div>
          </div>
          <div class="budget-stat-item">
            <div class="budget-stat-label"><i class="fa-solid fa-coins text-[8px]" style="color:#f59e0b"></i> คงเหลือ</div>
            <div class="budget-stat-value ${item.remaining_amount < 0 ? 'budget-stat-remain-negative' : 'budget-stat-remain'}">${moneyShort(item.remaining_amount)}</div>
          </div>
        </div>
        <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
          <div class="h-full rounded-full transition-all duration-500" style="width:${percent}%;background:${progressColor}"></div>
        </div>
      </div>
    `;
  }).join('');
}

/* =====================================================
   RECENT TRANSACTIONS
   ===================================================== */
function renderRecentTransactions() {
  const el = document.getElementById('recentTransactions');
  if (!el) return;
  const expenses = (APP_DATA.expenses || []).slice(0, 3);
  if (!expenses.length) {
    el.innerHTML = '<div class="text-sm text-slate-400 py-6 text-center">ยังไม่มีรายการ</div>';
    return;
  }

  el.innerHTML = expenses.map(e => {
    const meta = getCategoryIcon(e.category_name);
    const bg = hexToRgba(meta.color, 0.15);
    return `
      <div class="tx-item">
        <div class="tx-icon" style="background:${bg};color:${meta.color}">
          <i class="${meta.icon}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-base font-semibold text-[#1e1b4b] truncate">${escapeHtml(e.description)}</div>
          <div class="text-xs text-slate-400 mt-0.5 truncate">${escapeHtml(e.category_name)} · ${escapeHtml(e.expense_date)}</div>
        </div>
        <div class="text-base font-bold num text-rose-600 shrink-0">-${money(e.amount).replace(/\.00$/, '')}</div>
      </div>
    `;
  }).join('');
}

/* =====================================================
   WEEKLY COMPARISON
   ===================================================== */
function renderWeeklyComparison() {
  const d = APP_DATA.weeklyComparison || {};
  const cur = d.currentWeek || { total: 0, start: '', end: '' };
  const prev = d.previousWeek || { total: 0, start: '', end: '' };
  const diff = Number(d.diff || 0);
  const diffPercent = Number(d.diffPercent || 0);

  document.getElementById('weekCurrentTotal').textContent = money(cur.total).replace(/\.00$/, '');
  document.getElementById('weekCurrentRange').textContent = (cur.start || '') + ' - ' + (cur.end || '');
  document.getElementById('weekPrevTotal').textContent = money(prev.total).replace(/\.00$/, '');
  document.getElementById('weekPrevRange').textContent = (prev.start || '') + ' - ' + (prev.end || '');

  const badge = document.getElementById('weekDiffBadge');
  if (badge) {
    let bg = 'bg-slate-100 text-slate-700 border border-slate-200';
    let icon = '<i class="fa-solid fa-minus"></i>';
    if (d.trend === 'up') {
      bg = 'bg-rose-50 text-rose-700 border border-rose-200';
      icon = '<i class="fa-solid fa-arrow-up"></i>';
    } else if (d.trend === 'down') {
      bg = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      icon = '<i class="fa-solid fa-arrow-down"></i>';
    }
    badge.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ' + bg;
    badge.innerHTML = icon + ' <span>' + money(Math.abs(diff)).replace(/\.00$/, '') + '</span> <span class="opacity-75">(' +
      (diffPercent > 0 ? '+' : '') + diffPercent + '%)</span>';
  }

  renderWeekCompareChart(d);
  renderWeekCompareCategoryTable(d);
}

function renderWeekCompareChart(d) {
  const el = document.getElementById('weekCompareChart');
  const curDaily = (d.currentWeek && d.currentWeek.daily) || [];
  const prevDaily = (d.previousWeek && d.previousWeek.daily) || [];

  if (!curDaily.length && !prevDaily.length) {
    el.innerHTML = '<div class="text-sm text-slate-400 py-6 text-center">ไม่มีข้อมูล</div>';
    return;
  }

  const amounts = curDaily.map(x => Number(x.amount || 0))
    .concat(prevDaily.map(x => Number(x.amount || 0)));
  const max = Math.max(1, ...amounts);

  let cols = '';
  for (let i = 0; i < 7; i++) {
    const cur = curDaily[i] || { amount: 0, label: '' };
    const prev = prevDaily[i] || { amount: 0, label: '' };
    const curHeight = Math.max(6, Math.round((Number(cur.amount || 0) / max) * 100));
    const prevHeight = Math.max(6, Math.round((Number(prev.amount || 0) / max) * 100));
    cols += `
      <div class="flex-1 flex flex-col items-center gap-2 min-w-0">
        <div class="w-full flex items-end justify-center gap-1.5 h-28">
          <div class="w-3 bg-gradient-to-t from-purple-200 to-indigo-200 rounded-t-full" style="height:${prevHeight}%"></div>
          <div class="w-3 bg-gradient-to-t from-emerald-400 to-cyan-400 rounded-t-full" style="height:${curHeight}%"></div>
        </div>
        <span class="text-xs font-semibold text-slate-600">${escapeHtml(cur.label || prev.label)}</span>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="flex items-end gap-1 h-36 pt-2">${cols}</div>
    <div class="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-indigo-100/60 text-xs text-slate-600">
      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-md bg-gradient-to-r from-purple-200 to-indigo-200 inline-block"></span><span>สัปดาห์ก่อน</span></div>
      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-md bg-gradient-to-r from-emerald-400 to-cyan-400 inline-block"></span><span class="text-[#1e1b4b] font-bold">สัปดาห์นี้</span></div>
    </div>
  `;
}

function getTrendMeta(trend) {
  if (trend === 'up') return { icon: '<i class="fa-solid fa-arrow-up text-xs"></i>', cls: 'text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full' };
  if (trend === 'down') return { icon: '<i class="fa-solid fa-arrow-down text-xs"></i>', cls: 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full' };
  return { icon: '<i class="fa-solid fa-minus text-xs"></i>', cls: 'text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full' };
}

function renderWeekCompareCategoryTable(d) {
  const el = document.getElementById('weekCompareCategoryTable');
  const rows = d.categoryComparison || [];
  if (!rows.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="table-wrap">
      <table class="w-full zen-table text-left">
        <thead><tr><th>หมวดหมู่</th><th class="text-right">สัปดาห์นี้</th><th class="text-right">สัปดาห์ก่อน</th><th class="text-right">ผลต่าง</th></tr></thead>
        <tbody>
        ${rows.map(x => {
          const trendMeta = getTrendMeta(x.trend);
          const diffPercent = Number(x.diffPercent || 0);
          return `<tr>
            <td data-label="หมวดหมู่"><span class="font-bold text-[#1e1b4b]">${escapeHtml(x.category_name)}</span></td>
            <td data-label="สัปดาห์นี้" class="text-right num font-semibold text-[#1e1b4b]">${money(x.current).replace(/\.00$/, '')}</td>
            <td data-label="สัปดาห์ก่อน" class="text-right num text-slate-500">${money(x.previous).replace(/\.00$/, '')}</td>
            <td data-label="ผลต่าง" class="text-right num font-semibold">
              <span class="inline-flex items-center gap-1 ${trendMeta.cls}">
                ${trendMeta.icon} ${money(Math.abs(x.diff)).replace(/\.00$/, '')}
                <span class="text-xs font-normal">(${diffPercent > 0 ? '+' : ''}${diffPercent}%)</span>
              </span>
            </td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* =====================================================
   EXPENSE
   ===================================================== */
async function saveExpense() {
  const data = {
    expense_id: val('expense_id'),
    expense_date: val('expense_date'),
    description: val('description'),
    category_id: val('category_id'),
    amount: val('amount'),
    payment_type_id: val('payment_type_id'),
    note: val('note')
  };
  if (!data.expense_date) return toast('กรุณาเลือกวันที่');
  if (!data.description) return toast('กรุณาระบุรายละเอียด');
  if (!data.category_id) return toast('กรุณาเลือกหมวดหมู่');
  if (!data.payment_type_id) return toast('กรุณาเลือกประเภทชำระ');
  if (Number(data.amount) <= 0) return toast('กรุณาระบุจำนวนเงิน');

  showLoading(true, 'กำลังบันทึก...');
  try {
    const result = await API.saveExpense(data);
    if (!result || result.success === false) {
      toast(result?.message || 'ไม่สำเร็จ');
      return;
    }
    toast(result.message || 'บันทึกสำเร็จ');
    resetExpenseForm();
    await refreshAfterChange();     // ✅ เปลี่ยนจาก loadAllData()
    showView('history');
  } catch (err) {
    toast('Error: ' + (err.message || err));
  } finally {
    showLoading(false);
  }
}

function resetExpenseForm() {
  document.getElementById('expense_id').value = '';
  document.getElementById('description').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('note').value = '';
  document.getElementById('category_id').value = '';
  document.getElementById('payment_type_id').value = '';
  setToday();
}

async function removeExpense(id) {
  if (!confirm('ลบรายการนี้หรือไม่?')) return;
  showLoading(true, 'กำลังลบ...');
  try {
    const result = await API.deleteExpense(id);
    if (!result || result.success === false) {
      toast(result?.message || 'ไม่สำเร็จ');
      return;
    }
    toast(result.message || 'ลบสำเร็จ');
    await refreshAfterChange();     // ✅ เปลี่ยน
  } catch (err) {
    toast('Error: ' + (err.message || err));
  } finally {
    showLoading(false);
  }
}

function editExpense(id) {
  const e = APP_DATA.expenses.find(x => x.expense_id === id);
  if (!e) return toast('ไม่พบรายการ');
  document.getElementById('expense_id').value = e.expense_id;
  document.getElementById('expense_date').value = e.expense_date;
  document.getElementById('description').value = e.description;
  document.getElementById('category_id').value = e.category_id;
  document.getElementById('amount').value = e.amount;
  document.getElementById('payment_type_id').value = e.payment_type_id;
  document.getElementById('note').value = e.note || '';
  showView('expense');
}

/* =====================================================
   EXPENSE TABLE
   ===================================================== */
function renderExpenseTable() {
  const tbody = document.getElementById('expenseTableBody');
  if (!tbody) return;
  const search = (val('searchExpense') || '').toLowerCase();
  const category = val('filterCategory');

  const rows = APP_DATA.expenses.filter(e => {
    const mS = !search || String(e.description || '').toLowerCase().includes(search);
    const mC = !category || e.category_id === category;
    return mS && mC;
  });

  const pageSize = Number(val('pageSize')) || 10;
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  if (currentExpensePage > totalPages) currentExpensePage = totalPages;
  if (currentExpensePage < 1) currentExpensePage = 1;

  if (!totalRows) {
    tbody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-sm text-slate-400">ไม่พบรายการ</td></tr>';
    renderExpensePagination(0, 0, pageSize);
    return;
  }

  const startIndex = (currentExpensePage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  tbody.innerHTML = pageRows.map(e => `
    <tr>
      <td data-label="วันที่"><span class="num text-sm font-semibold text-slate-500">${escapeHtml(e.expense_date)}</span></td>
      <td data-label="รายละเอียด">
        <div class="font-bold text-[#1e1b4b]">${escapeHtml(e.description)}</div>
        ${e.note ? '<div class="text-xs text-slate-400 mt-0.5">' + escapeHtml(e.note) + '</div>' : ''}
      </td>
      <td data-label="หมวดหมู่"><span class="badge badge-active">${escapeHtml(e.category_name)}</span></td>
      <td data-label="การชำระเงิน"><span class="text-sm text-slate-600 font-medium">${escapeHtml(e.payment_type_name)}</span></td>
      <td data-label="จำนวนเงิน" class="text-right num"><span class="font-bold text-rose-600">-${money(e.amount).replace(/\.00$/, '')}</span></td>
      <td data-label="จัดการ" class="text-right">
        <div class="inline-flex items-center gap-1">
          <button class="touch-btn text-indigo-600" onclick="editExpense('${e.expense_id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="touch-btn text-rose-500" onclick="removeExpense('${e.expense_id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  renderExpensePagination(totalRows, totalPages, pageSize);
}

function resetExpensePage() { currentExpensePage = 1; renderExpenseTable(); }

function goToExpensePage(page) {
  currentExpensePage = page;
  renderExpenseTable();
  const wrap = document.querySelector('#viewHistory .table-wrap');
  if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildPageNumbers_(current, total) {
  const pages = [];
  if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); return pages; }
  pages.push(1);
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function renderExpensePagination(totalRows, totalPages, pageSize) {
  const el = document.getElementById('expensePagination');
  if (!el) return;
  if (!totalRows) { el.innerHTML = '<div class="text-sm text-slate-400">ไม่พบข้อมูล</div>'; return; }

  const startItem = (currentExpensePage - 1) * pageSize + 1;
  const endItem = Math.min(currentExpensePage * pageSize, totalRows);
  const pageNumbers = buildPageNumbers_(currentExpensePage, totalPages);

  const pageButtons = pageNumbers.map(p => {
    if (p === '...') return '<span class="px-2 text-sm text-slate-400">...</span>';
    const activeClass = p === currentExpensePage ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-indigo-50';
    return `<button class="w-9 h-9 text-sm rounded-lg font-semibold ${activeClass}" onclick="goToExpensePage(${p})">${p}</button>`;
  }).join('');

  el.innerHTML = `
    <div class="text-sm text-slate-500 font-medium">แสดง <span class="num font-bold text-[#1e1b4b]">${startItem}-${endItem}</span> จาก <span class="num font-bold text-[#1e1b4b]">${totalRows}</span></div>
    <div class="flex items-center gap-1">
      <button class="touch-btn border border-indigo-100 text-slate-500 disabled:opacity-30" onclick="goToExpensePage(${currentExpensePage - 1})" ${currentExpensePage <= 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left text-xs"></i></button>
      <div class="hidden sm:flex items-center gap-1">${pageButtons}</div>
      <span class="sm:hidden text-sm font-semibold text-indigo-600 px-3">${currentExpensePage} / ${totalPages}</span>
      <button class="touch-btn border border-indigo-100 text-slate-500 disabled:opacity-30" onclick="goToExpensePage(${currentExpensePage + 1})" ${currentExpensePage >= totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right text-xs"></i></button>
    </div>
  `;
}

/* =====================================================
   MASTER DATA
   ===================================================== */
function renderMasterDropdowns() {
  const categorySelect = document.getElementById('category_id');
  const filterCategory = document.getElementById('filterCategory');
  const paymentSelect = document.getElementById('payment_type_id');

  const activeCategories = APP_DATA.categories.filter(c => String(c.status).toLowerCase() !== 'inactive');
  const activePayments = APP_DATA.paymentTypes.filter(p => String(p.status).toLowerCase() !== 'inactive');

  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">-- เลือก --</option>' +
      activeCategories.map(c => `<option value="${c.category_id}">${escapeHtml(c.category_name)}</option>`).join('');
  }
  if (filterCategory) {
    filterCategory.innerHTML = '<option value="">ทุกหมวดหมู่</option>' +
      activeCategories.map(c => `<option value="${c.category_id}">${escapeHtml(c.category_name)}</option>`).join('');
  }
  if (paymentSelect) {
    paymentSelect.innerHTML = '<option value="">-- เลือก --</option>' +
      activePayments.map(p => `<option value="${p.payment_type_id}">${escapeHtml(p.payment_type_name)}</option>`).join('');
  }
}

function renderMasterTables() { renderCategoryTable(); renderPaymentTable(); }

function renderCategoryTable() {
  const tbody = document.getElementById('categoryTableBody');
  if (!tbody) return;
  const rows = APP_DATA.categories || [];
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-sm text-slate-400">ไม่พบข้อมูล</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(c => `
    <tr>
      <td data-label="หมวดหมู่"><span class="font-bold text-[#1e1b4b]">${escapeHtml(c.category_name)}</span></td>
      <td data-label="รายละเอียด" class="text-sm text-slate-500">${escapeHtml(c.description || '-')}</td>
      <td data-label="วงเงิน" class="text-right num font-bold text-indigo-900">${money(c.budget_amount).replace(/\.00$/, '')}</td>
      <td data-label="สถานะ">${String(c.status).toLowerCase() === 'active' ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Inactive</span>'}</td>
      <td data-label="จัดการ" class="text-right">
        <div class="inline-flex items-center gap-1">
          <button class="touch-btn text-indigo-600" onclick="editCategory('${c.category_id}')"><i class="fa-solid fa-pen"></i></button>
          ${String(c.status).toLowerCase() === 'active' ? `<button class="touch-btn text-rose-500" onclick="removeCategory('${c.category_id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function renderPaymentTable() {
  const tbody = document.getElementById('paymentTableBody');
  if (!tbody) return;
  const rows = APP_DATA.paymentTypes || [];
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-sm text-slate-400">ไม่พบข้อมูล</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(p => `
    <tr>
      <td data-label="ประเภท"><span class="font-bold text-[#1e1b4b]">${escapeHtml(p.payment_type_name)}</span></td>
      <td data-label="รายละเอียด" class="text-sm text-slate-500">${escapeHtml(p.description || '-')}</td>
      <td data-label="สถานะ">${String(p.status).toLowerCase() === 'active' ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Inactive</span>'}</td>
      <td data-label="จัดการ" class="text-right">
        <div class="inline-flex items-center gap-1">
          <button class="touch-btn text-indigo-600" onclick="editPayment('${p.payment_type_id}')"><i class="fa-solid fa-pen"></i></button>
          ${String(p.status).toLowerCase() === 'active' ? `<button class="touch-btn text-rose-500" onclick="removePayment('${p.payment_type_id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

/* =====================================================
   CATEGORY MODAL
   ===================================================== */
function openCategoryModal(data) {
  document.getElementById('categoryModalTitle').textContent = data ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่';
  document.getElementById('categoryModalId').value = (data && data.category_id) || '';
  document.getElementById('categoryModalName').value = (data && data.category_name) || '';
  document.getElementById('categoryModalDescription').value = (data && data.description) || '';
  document.getElementById('categoryModalBudget').value = (data && data.budget_amount) || 0;
  document.getElementById('categoryModalStatus').value = (data && data.status) || 'active';
  document.getElementById('categoryModal').classList.add('show');
}
function closeCategoryModal() { document.getElementById('categoryModal').classList.remove('show'); }
function editCategory(id) {
  const data = APP_DATA.categories.find(x => x.category_id === id);
  if (!data) return toast('ไม่พบ');
  openCategoryModal(data);
}

async function saveCategory() {
  const data = {
    category_id: val('categoryModalId'),
    category_name: val('categoryModalName'),
    description: val('categoryModalDescription'),
    budget_amount: val('categoryModalBudget'),
    status: val('categoryModalStatus')
  };
  if (!data.category_name) return toast('กรุณาระบุชื่อ');

  showLoading(true, 'กำลังบันทึก...');
  try {
    const result = data.category_id
      ? await API.updateCategory(data)
      : await API.addCategory(data);

    if (!result || result.success === false) {
      toast(result?.message || 'ไม่สำเร็จ');
      return;
    }
    toast(result.message || 'บันทึกสำเร็จ');
    closeCategoryModal();
    await loadAllData();    // master เปลี่ยน → โหลดใหม่ทั้งหมด
  } catch (err) {
    toast('Error: ' + (err.message || err));
  } finally {
    showLoading(false);
  }
}

async function removeCategory(id) {
  if (!confirm('ปิดการใช้งาน?')) return;
  showLoading(true, 'กำลังดำเนินการ...');
  try {
    const result = await API.deleteCategory(id);
    if (!result || result.success === false) {
      toast(result?.message || 'ไม่สำเร็จ');
      return;
    }
    toast(result.message || 'สำเร็จ');
    await loadAllData();
  } catch (err) {
    toast('Error: ' + (err.message || err));
  } finally {
    showLoading(false);
  }
}

/* =====================================================
   PAYMENT MODAL
   ===================================================== */
function openPaymentModal(data) {
  document.getElementById('paymentModalTitle').textContent = data ? 'แก้ไข' : 'เพิ่มประเภทชำระเงิน';
  document.getElementById('paymentModalId').value = (data && data.payment_type_id) || '';
  document.getElementById('paymentModalName').value = (data && data.payment_type_name) || '';
  document.getElementById('paymentModalDescription').value = (data && data.description) || '';
  document.getElementById('paymentModalStatus').value = (data && data.status) || 'active';
  document.getElementById('paymentModal').classList.add('show');
}
function closePaymentModal() { document.getElementById('paymentModal').classList.remove('show'); }
function editPayment(id) {
  const data = APP_DATA.paymentTypes.find(x => x.payment_type_id === id);
  if (!data) return toast('ไม่พบ');
  openPaymentModal(data);
}

async function savePaymentType() {
  const data = {
    payment_type_id: val('paymentModalId'),
    payment_type_name: val('paymentModalName'),
    description: val('paymentModalDescription'),
    status: val('paymentModalStatus')
  };
  if (!data.payment_type_name) return toast('กรุณาระบุ');

  showLoading(true, 'กำลังบันทึก...');
  try {
    const result = data.payment_type_id
      ? await API.updatePaymentType(data)
      : await API.addPaymentType(data);

    if (!result || result.success === false) {
      toast(result?.message || 'ไม่สำเร็จ');
      return;
    }
    toast(result.message || 'บันทึกสำเร็จ');
    closePaymentModal();
    await loadAllData();
  } catch (err) {
    toast('Error: ' + (err.message || err));
  } finally {
    showLoading(false);
  }
}

async function removePayment(id) {
  if (!confirm('ปิดการใช้งาน?')) return;
  showLoading(true, 'กำลังดำเนินการ...');
  try {
    const result = await API.deletePaymentType(id);
    if (!result || result.success === false) {
      toast(result?.message || 'ไม่สำเร็จ');
      return;
    }
    toast(result.message || 'สำเร็จ');
    await loadAllData();
  } catch (err) {
    toast('Error: ' + (err.message || err));
  } finally {
    showLoading(false);
  }
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
