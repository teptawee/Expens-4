/**
 * app.js - รวมทุกอย่างไว้ในไฟล์เดียว
 * ✅ Dashboard + Expense + History + Master + Init
 */

console.log('✅ app.js loaded');

/* =====================================================
   GLOBAL STATE
   ===================================================== */
const APP_DATA = {
  categories: [],
  paymentTypes: [],
  expenses: [],
  dashboard: null,
  weeklyComparison: null
};

let loadingCount = 0;

const historyState = {
  range: 7,
  dateFrom: '',
  dateTo: '',
  category: '',
  page: 1,
  perPage: 5
};

/* =====================================================
   UTILS
   ===================================================== */
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
  const h = String(hex || '#6366f1').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function toISODate(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function getCategoryIcon(name) {
  const n = String(name || '');
  for (let i = 0; i < CATEGORY_ICONS.length; i++) {
    if (n.indexOf(CATEGORY_ICONS[i].key) !== -1) return CATEGORY_ICONS[i];
  }
  return { icon: 'fa-solid fa-receipt', color: '#6366f1' };
}

function setToday() {
  const el = document.getElementById('expense_date');
  if (!el) return;
  el.value = toISODate(new Date());
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

function formatThaiDate(isoDate) {
  const parts = String(isoDate).split('-').map(Number);
  const y = parts[0], m = parts[1], d = parts[2];
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return d + ' ' + months[m - 1] + ' ' + (y + 543);
}

function getDayName(isoDate) {
  const parts = String(isoDate).split('-').map(Number);
  const day = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
  return ['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'][day];
}

function showLoading(show, text) {
  const el = document.getElementById('loading');
  if (!el) return;
  if (show) {
    loadingCount++;
    const t = document.getElementById('loadingText');
    if (t) t.textContent = text || 'กำลังประมวลผล...';
    el.classList.add('show');
  } else {
    loadingCount = Math.max(0, loadingCount - 1);
    if (loadingCount === 0) el.classList.remove('show');
  }
}

function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = '<i class="fa-solid fa-sparkles text-pink-300"></i> ' + escapeHtml(message || '');
  el.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function () { el.classList.remove('show'); }, 3000);
}

function animateNumber(el, target, duration, formatter) {
  if (!el) return;
  duration = duration || 800;
  formatter = formatter || function (v) { return money(v); };
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    el.textContent = formatter(current);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = formatter(target);
  }
  requestAnimationFrame(tick);
}

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
    requestAnimationFrame(function () {
      if (window.scrollY > 8) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* =====================================================
   DASHBOARD
   ===================================================== */
function renderDashboard() {
  const d = APP_DATA.dashboard || {};

  animateNumber(document.getElementById('heroMonth'), Number(d.month || 0));
  animateNumber(document.getElementById('heroBudget'), Number(d.totalBudget || 0), 800, function (v) {
    return money(v).replace(/\.00$/, '');
  });
  animateNumber(document.getElementById('heroRemain'), Number(d.totalBudgetRemaining || 0), 800, function (v) {
    return money(v).replace(/\.00$/, '');
  });

  const percentEl = document.getElementById('heroPercent');
  if (percentEl) percentEl.textContent = (d.budgetUsagePercent || 0) + '%';

  const progressEl = document.getElementById('heroProgress');
  if (progressEl) {
    progressEl.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
    progressEl.style.width = Math.min(100, d.budgetUsagePercent || 0) + '%';
  }

  const compareEl = document.getElementById('heroCompare');
  if (compareEl) compareEl.textContent = '-3.1%';

  animateNumber(document.getElementById('pillToday'), Number(d.today || 0), 800, function (v) {
    return money(v).replace(/\.00$/, '');
  });
  animateNumber(document.getElementById('pillWeek'), Number(d.week || 0), 800, function (v) {
    return money(v).replace(/\.00$/, '');
  });
  animateNumber(document.getElementById('pillYear'), Number(d.year || 0), 800, function (v) {
    return money(v).replace(/\.00$/, '');
  });

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

  el.innerHTML = rows.map(function (item) {
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

    return '<div class="budget-card ' + cardClass + '">' +
      '<div class="flex items-start gap-3">' +
        '<div class="budget-icon" style="background:' + iconBg + ';color:' + iconMeta.color + '">' +
          '<i class="' + iconMeta.icon + '"></i>' +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="text-sm font-bold text-[#1e1b4b] truncate">' + escapeHtml(item.category_name) + '</div>' +
          '<div class="text-[11px] text-slate-500 mt-0.5">คงเหลือ ' + remainPct + '%</div>' +
        '</div>' +
        '<div class="text-lg font-bold num" style="color:' + percentColor + '">' + (item.usage_percent || 0) + '%</div>' +
      '</div>' +
      '<div class="budget-stats-row">' +
        '<div class="budget-stat-item">' +
          '<div class="budget-stat-label"><i class="fa-solid fa-arrow-down text-[8px]" style="color:#3b82f6"></i> ใช้ไป</div>' +
          '<div class="budget-stat-value budget-stat-used">' + moneyShort(item.spent_amount) + '</div>' +
        '</div>' +
        '<div class="budget-stat-item">' +
          '<div class="budget-stat-label"><i class="fa-solid fa-wallet text-[8px]" style="color:#8b5cf6"></i> วงเงิน</div>' +
          '<div class="budget-stat-value budget-stat-total">' + moneyShort(item.budget_amount) + '</div>' +
        '</div>' +
        '<div class="budget-stat-item">' +
          '<div class="budget-stat-label"><i class="fa-solid fa-coins text-[8px]" style="color:#f59e0b"></i> คงเหลือ</div>' +
          '<div class="budget-stat-value ' + (item.remaining_amount < 0 ? 'budget-stat-remain-negative' : 'budget-stat-remain') + '">' + moneyShort(item.remaining_amount) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">' +
        '<div class="h-full rounded-full transition-all duration-500" style="width:' + percent + '%;background:' + progressColor + '"></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderRecentTransactions() {
  const el = document.getElementById('recentTransactions');
  if (!el) return;
  const expenses = (APP_DATA.expenses || []).slice(0, 3);
  if (!expenses.length) {
    el.innerHTML = '<div class="text-sm text-slate-400 py-6 text-center">ยังไม่มีรายการ</div>';
    return;
  }

  el.innerHTML = expenses.map(function (e) {
    const meta = getCategoryIcon(e.category_name);
    const bg = hexToRgba(meta.color, 0.15);
    return '<div class="tx-item">' +
      '<div class="tx-icon" style="background:' + bg + ';color:' + meta.color + '">' +
        '<i class="' + meta.icon + '"></i>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<div class="text-base font-semibold text-[#1e1b4b] truncate">' + escapeHtml(e.description) + '</div>' +
        '<div class="text-xs text-slate-400 mt-0.5 truncate">' + escapeHtml(e.category_name) + ' · ' + escapeHtml(e.expense_date) + '</div>' +
      '</div>' +
      '<div class="text-base font-bold num text-rose-600 shrink-0">-' + money(e.amount).replace(/\.00$/, '') + '</div>' +
    '</div>';
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

  const curEl = document.getElementById('weekCurrentTotal');
  if (curEl) curEl.textContent = money(cur.total).replace(/\.00$/, '');
  const curRangeEl = document.getElementById('weekCurrentRange');
  if (curRangeEl) curRangeEl.textContent = (cur.start || '') + ' - ' + (cur.end || '');
  const prevEl = document.getElementById('weekPrevTotal');
  if (prevEl) prevEl.textContent = money(prev.total).replace(/\.00$/, '');
  const prevRangeEl = document.getElementById('weekPrevRange');
  if (prevRangeEl) prevRangeEl.textContent = (prev.start || '') + ' - ' + (prev.end || '');

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
  if (!el) return;
  const curDaily = (d.currentWeek && d.currentWeek.daily) || [];
  const prevDaily = (d.previousWeek && d.previousWeek.daily) || [];

  if (!curDaily.length && !prevDaily.length) {
    el.innerHTML = '<div class="text-sm text-slate-400 py-6 text-center">ไม่มีข้อมูล</div>';
    return;
  }

  const amounts = curDaily.map(function (x) { return Number(x.amount || 0); })
    .concat(prevDaily.map(function (x) { return Number(x.amount || 0); }));
  const max = Math.max(1, Math.max.apply(null, amounts));

  let cols = '';
  for (let i = 0; i < 7; i++) {
    const cur = curDaily[i] || { amount: 0, label: '' };
    const prev = prevDaily[i] || { amount: 0, label: '' };
    const curHeight = Math.max(6, Math.round((Number(cur.amount || 0) / max) * 100));
    const prevHeight = Math.max(6, Math.round((Number(prev.amount || 0) / max) * 100));
    cols += '<div class="flex-1 flex flex-col items-center gap-2 min-w-0">' +
      '<div class="w-full flex items-end justify-center gap-1.5 h-28">' +
        '<div class="w-3 bg-gradient-to-t from-purple-200 to-indigo-200 rounded-t-full" style="height:' + prevHeight + '%"></div>' +
        '<div class="w-3 bg-gradient-to-t from-emerald-400 to-cyan-400 rounded-t-full" style="height:' + curHeight + '%"></div>' +
      '</div>' +
      '<span class="text-xs font-semibold text-slate-600">' + escapeHtml(cur.label || prev.label) + '</span>' +
    '</div>';
  }

  el.innerHTML = '<div class="flex items-end gap-1 h-36 pt-2">' + cols + '</div>' +
    '<div class="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-indigo-100/60 text-xs text-slate-600">' +
      '<div class="flex items-center gap-2"><span class="w-3 h-3 rounded-md bg-gradient-to-r from-purple-200 to-indigo-200 inline-block"></span><span>สัปดาห์ก่อน</span></div>' +
      '<div class="flex items-center gap-2"><span class="w-3 h-3 rounded-md bg-gradient-to-r from-emerald-400 to-cyan-400 inline-block"></span><span class="text-[#1e1b4b] font-bold">สัปดาห์นี้</span></div>' +
    '</div>';
}

function getTrendMeta(trend) {
  if (trend === 'up') return { icon: '<i class="fa-solid fa-arrow-up text-xs"></i>', cls: 'text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full' };
  if (trend === 'down') return { icon: '<i class="fa-solid fa-arrow-down text-xs"></i>', cls: 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full' };
  return { icon: '<i class="fa-solid fa-minus text-xs"></i>', cls: 'text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full' };
}

function renderWeekCompareCategoryTable(d) {
  const el = document.getElementById('weekCompareCategoryTable');
  if (!el) return;
  const rows = d.categoryComparison || [];
  if (!rows.length) { el.innerHTML = ''; return; }

  let html = '<div class="table-wrap">' +
    '<table class="w-full zen-table text-left">' +
      '<thead><tr>' +
        '<th>หมวดหมู่</th>' +
        '<th class="text-right">สัปดาห์นี้</th>' +
        '<th class="text-right">สัปดาห์ก่อน</th>' +
        '<th class="text-right">ผลต่าง</th>' +
      '</tr></thead><tbody>';

  rows.forEach(function (x) {
    const trendMeta = getTrendMeta(x.trend);
    const diffPercent = Number(x.diffPercent || 0);
    html += '<tr>' +
      '<td data-label="หมวดหมู่"><span class="font-bold text-[#1e1b4b]">' + escapeHtml(x.category_name) + '</span></td>' +
      '<td data-label="สัปดาห์นี้" class="text-right num font-semibold text-[#1e1b4b]">' + money(x.current).replace(/\.00$/, '') + '</td>' +
      '<td data-label="สัปดาห์ก่อน" class="text-right num text-slate-500">' + money(x.previous).replace(/\.00$/, '') + '</td>' +
      '<td data-label="ผลต่าง" class="text-right num font-semibold">' +
        '<span class="inline-flex items-center gap-1 ' + trendMeta.cls + '">' +
          trendMeta.icon + ' ' + money(Math.abs(x.diff)).replace(/\.00$/, '') +
          ' <span class="text-xs font-normal">(' + (diffPercent > 0 ? '+' : '') + diffPercent + '%)</span>' +
        '</span>' +
      '</td>' +
    '</tr>';
  });

  html += '</tbody></table></div>';
  el.innerHTML = html;
}

/* =====================================================
   EXPENSE — SAVE / EDIT / DELETE
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
      toast((result && result.message) || 'ไม่สำเร็จ');
      return;
    }
    toast(result.message || 'บันทึกสำเร็จ');
    resetExpenseForm();
    await refreshAfterChange();
    showView('history');
  } catch (err) {
    toast('Error: ' + (err.message || err));
  } finally {
    showLoading(false);
  }
}

function resetExpenseForm() {
  const ids = ['expense_id', 'description', 'amount', 'note', 'category_id', 'payment_type_id'];
  ids.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setToday();
}

async function removeExpense(id) {
  if (!confirm('ลบรายการนี้หรือไม่?')) return;
  showLoading(true, 'กำลังลบ...');
  try {
    const result = await API.deleteExpense(id);
    if (!result || result.success === false) {
      toast((result && result.message) || 'ไม่สำเร็จ');
      return;
    }
    toast(result.message || 'ลบสำเร็จ');
    await refreshAfterChange();
  } catch (err) {
    toast('Error: ' + (err.message || err));
  } finally {
    showLoading(false);
  }
}

function editExpense(id) {
  const e = APP_DATA.expenses.find(function (x) { return x.expense_id === id; });
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
   HISTORY — FILTER + RENDER
   ===================================================== */
function setHistoryRange(range) {
  historyState.range = range;
  historyState.page = 1;

  const fromEl = document.getElementById('historyDateFrom');
  const toEl = document.getElementById('historyDateTo');

  if (range !== 'all') {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (range - 1));

    if (fromEl) fromEl.value = toISODate(from);
    if (toEl) toEl.value = toISODate(to);
    historyState.dateFrom = toISODate(from);
    historyState.dateTo = toISODate(to);
  } else {
    if (fromEl) fromEl.value = '';
    if (toEl) toEl.value = '';
    historyState.dateFrom = '';
    historyState.dateTo = '';
  }

  document.querySelectorAll('.filter-tab').forEach(function (btn) {
    btn.classList.toggle('active', String(btn.dataset.range) === String(range));
  });

  renderHistoryGrouped();
}

function applyHistoryFilter() {
  const fromEl = document.getElementById('historyDateFrom');
  const toEl = document.getElementById('historyDateTo');
  const catEl = document.getElementById('filterCategory');
  historyState.dateFrom = (fromEl && fromEl.value) || '';
  historyState.dateTo = (toEl && toEl.value) || '';
  historyState.category = (catEl && catEl.value) || '';
  historyState.page = 1;

  document.querySelectorAll('.filter-tab').forEach(function (btn) {
    btn.classList.remove('active');
  });

  renderHistoryGrouped();
}

function renderHistoryGrouped() {
  const el = document.getElementById('historyGroupedList');
  if (!el) return;

  const rows = (APP_DATA.expenses || []).filter(function (e) {
    if (historyState.dateFrom && e.expense_date < historyState.dateFrom) return false;
    if (historyState.dateTo && e.expense_date > historyState.dateTo) return false;
    if (historyState.category && e.category_id !== historyState.category) return false;
    return true;
  });

  rows.sort(function (a, b) {
    return String(b.expense_date).localeCompare(String(a.expense_date));
  });

  if (!rows.length) {
    el.innerHTML = '<div class="history-empty"><i class="fa-regular fa-folder-open text-3xl mb-2 block"></i>ไม่พบรายการ</div>';
    const pag = document.getElementById('expensePagination');
    if (pag) pag.innerHTML = '';
    return;
  }

  const groups = {};
  rows.forEach(function (e) {
    const key = e.expense_date;
    if (!groups[key]) groups[key] = { date: key, items: [], total: 0 };
    groups[key].items.push(e);
    groups[key].total += Number(e.amount || 0);
  });

  const groupKeys = Object.keys(groups);
  const totalGroups = groupKeys.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / historyState.perPage));
  if (historyState.page > totalPages) historyState.page = totalPages;
  if (historyState.page < 1) historyState.page = 1;

  const start = (historyState.page - 1) * historyState.perPage;
  const pageKeys = groupKeys.slice(start, start + historyState.perPage);

  el.innerHTML = pageKeys.map(function (key) {
    const g = groups[key];
    const thaiDate = formatThaiDate(key);
    const dayName = getDayName(key);

    return '<div class="history-date-group">' +
      '<div class="history-date-header">' +
        '<div class="history-date-label">' +
          '<i class="fa-regular fa-calendar"></i>' +
          '<span>' + dayName + 'ที่ ' + thaiDate + '</span>' +
        '</div>' +
        '<div class="history-date-total">' + money(g.total).replace(/\.00$/, '') + '</div>' +
      '</div>' +
      g.items.map(function (e) { return renderHistoryItem(e); }).join('') +
    '</div>';
  }).join('');

  renderHistoryPagination(totalGroups, totalPages);
}

function renderHistoryItem(e) {
  const meta = getCategoryIcon(e.category_name);
  const note = (e.description || '').trim();

  return '<div class="history-item" style="--item-color:' + meta.color + '">' +
    '<div class="history-item-icon" style="background:' + meta.color + '">' +
      '<i class="' + meta.icon + '"></i>' +
    '</div>' +
    '<div class="history-item-main">' +
      '<div class="history-item-title">' + escapeHtml(e.category_name) + '</div>' +
      '<div class="history-item-meta">' +
        '<span class="history-badge history-badge-payment">' +
          '<i class="fa-solid fa-money-bill-wave text-[9px]"></i> ' +
          escapeHtml(e.payment_type_name || '-') +
        '</span>' +
        '<span class="history-badge-note">' +
          '<i class="fa-solid fa-pen text-[9px]"></i> ' +
          escapeHtml(note || '-') +
        '</span>' +
      '</div>' +
    '</div>' +
    '<div class="history-item-right">' +
      '<div class="history-item-amount">' + money(e.amount).replace(/\.00$/, '') + '</div>' +
      '<div class="history-item-actions">' +
        '<button class="history-action-btn history-action-btn-edit" onclick="editExpense(\'' + e.expense_id + '\')" aria-label="แก้ไข">' +
          '<i class="fa-solid fa-pen"></i>' +
        '</button>' +
        '<button class="history-action-btn history-action-btn-delete" onclick="removeExpense(\'' + e.expense_id + '\')" aria-label="ลบ">' +
          '<i class="fa-solid fa-trash"></i>' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function renderHistoryPagination(totalGroups, totalPages) {
  const el = document.getElementById('expensePagination');
  if (!el) return;

  const start = (historyState.page - 1) * historyState.perPage + 1;
  const end = Math.min(historyState.page * historyState.perPage, totalGroups);

  el.innerHTML = '<div class="text-sm text-slate-500 font-medium">' +
      'แสดงวันที่ <span class="num font-bold text-[#1e1b4b]">' + start + '-' + end + '</span> ' +
      'จาก <span class="num font-bold text-[#1e1b4b]">' + totalGroups + '</span> วัน' +
    '</div>' +
    '<div class="flex items-center gap-1">' +
      '<button class="touch-btn border border-indigo-100 text-slate-500 disabled:opacity-30" ' +
        'onclick="goToHistoryPage(' + (historyState.page - 1) + ')" ' +
        (historyState.page <= 1 ? 'disabled' : '') + '>' +
        '<i class="fa-solid fa-chevron-left text-xs"></i>' +
      '</button>' +
      '<span class="text-sm font-semibold text-indigo-600 px-3">' + historyState.page + ' / ' + totalPages + '</span>' +
      '<button class="touch-btn border border-indigo-100 text-slate-500 disabled:opacity-30" ' +
        'onclick="goToHistoryPage(' + (historyState.page + 1) + ')" ' +
        (historyState.page >= totalPages ? 'disabled' : '') + '>' +
        '<i class="fa-solid fa-chevron-right text-xs"></i>' +
      '</button>' +
    '</div>';
}

function goToHistoryPage(page) {
  historyState.page = page;
  renderHistoryGrouped();
  const v = document.getElementById('viewHistory');
  if (v) v.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =====================================================
   MASTER DATA — DROPDOWNS + TABLES
   ===================================================== */
function renderMasterDropdowns() {
  const categorySelect = document.getElementById('category_id');
  const filterCategory = document.getElementById('filterCategory');
  const paymentSelect = document.getElementById('payment_type_id');

  const activeCategories = APP_DATA.categories.filter(function (c) {
    return String(c.status).toLowerCase() !== 'inactive';
  });
  const activePayments = APP_DATA.paymentTypes.filter(function (p) {
    return String(p.status).toLowerCase() !== 'inactive';
  });

  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">-- เลือก --</option>' +
      activeCategories.map(function (c) {
        return '<option value="' + c.category_id + '">' + escapeHtml(c.category_name) + '</option>';
      }).join('');
  }
  if (filterCategory) {
    filterCategory.innerHTML = '<option value="">ทุกหมวดหมู่</option>' +
      activeCategories.map(function (c) {
        return '<option value="' + c.category_id + '">' + escapeHtml(c.category_name) + '</option>';
      }).join('');
  }
  if (paymentSelect) {
    paymentSelect.innerHTML = '<option value="">-- เลือก --</option>' +
      activePayments.map(function (p) {
        return '<option value="' + p.payment_type_id + '">' + escapeHtml(p.payment_type_name) + '</option>';
      }).join('');
  }
}

function renderMasterTables() {
  renderCategoryTable();
  renderPaymentTable();
}

function renderCategoryTable() {
  const tbody = document.getElementById('categoryTableBody');
  if (!tbody) return;
  const rows = APP_DATA.categories || [];
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-sm text-slate-400">ไม่พบข้อมูล</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(function (c) {
    const isActive = String(c.status).toLowerCase() === 'active';
    return '<tr>' +
      '<td data-label="หมวดหมู่"><span class="font-bold text-[#1e1b4b]">' + escapeHtml(c.category_name) + '</span></td>' +
      '<td data-label="รายละเอียด" class="text-sm text-slate-500">' + escapeHtml(c.description || '-') + '</td>' +
      '<td data-label="วงเงิน" class="text-right num font-bold text-indigo-900">' + money(c.budget_amount).replace(/\.00$/, '') + '</td>' +
      '<td data-label="สถานะ">' + (isActive
        ? '<span class="badge badge-active">Active</span>'
        : '<span class="badge badge-inactive">Inactive</span>') + '</td>' +
      '<td data-label="จัดการ" class="text-right">' +
        '<div class="inline-flex items-center gap-1">' +
          '<button class="touch-btn text-indigo-600" onclick="editCategory(\'' + c.category_id + '\')"><i class="fa-solid fa-pen"></i></button>' +
          (isActive ? '<button class="touch-btn text-rose-500" onclick="removeCategory(\'' + c.category_id + '\')"><i class="fa-solid fa-trash"></i></button>' : '') +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function renderPaymentTable() {
  const tbody = document.getElementById('paymentTableBody');
  if (!tbody) return;
  const rows = APP_DATA.paymentTypes || [];
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-sm text-slate-400">ไม่พบข้อมูล</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(function (p) {
    const isActive = String(p.status).toLowerCase() === 'active';
    return '<tr>' +
      '<td data-label="ประเภท"><span class="font-bold text-[#1e1b4b]">' + escapeHtml(p.payment_type_name) + '</span></td>' +
      '<td data-label="รายละเอียด" class="text-sm text-slate-500">' + escapeHtml(p.description || '-') + '</td>' +
      '<td data-label="สถานะ">' + (isActive
        ? '<span class="badge badge-active">Active</span>'
        : '<span class="badge badge-inactive">Inactive</span>') + '</td>' +
      '<td data-label="จัดการ" class="text-right">' +
        '<div class="inline-flex items-center gap-1">' +
          '<button class="touch-btn text-indigo-600" onclick="editPayment(\'' + p.payment_type_id + '\')"><i class="fa-solid fa-pen"></i></button>' +
          (isActive ? '<button class="touch-btn text-rose-500" onclick="removePayment(\'' + p.payment_type_id + '\')"><i class="fa-solid fa-trash"></i></button>' : '') +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
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

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.remove('show');
}

function editCategory(id) {
  const data = APP_DATA.categories.find(function (x) { return x.category_id === id; });
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
      toast((result && result.message) || 'ไม่สำเร็จ');
      return;
    }
    toast(result.message || 'บันทึกสำเร็จ');
    closeCategoryModal();
    await loadAllData();
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
      toast((result && result.message) || 'ไม่สำเร็จ');
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

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('show');
}

function editPayment(id) {
  const data = APP_DATA.paymentTypes.find(function (x) { return x.payment_type_id === id; });
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
      toast((result && result.message) || 'ไม่สำเร็จ');
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
      toast((result && result.message) || 'ไม่สำเร็จ');
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
   LOAD DATA
   ===================================================== */
async function loadAllData() {
  showLoading(true, 'กำลังโหลดข้อมูล...');

  const tasks = [
    API.getMasterData().then(function (r) {
      if (r && r.success !== false) {
        APP_DATA.categories = r.categories || [];
        APP_DATA.paymentTypes = r.paymentTypes || [];
        renderMasterDropdowns();
        renderMasterTables();
      }
    }).catch(function (e) { console.warn('master:', e); }),

    API.getExpenses().then(function (r) {
      if (r && r.success !== false) {
        APP_DATA.expenses = r.data || [];
        renderHistoryGrouped();
        renderRecentTransactions();
      }
    }).catch(function (e) { console.warn('expenses:', e); }),

    API.getDashboard().then(function (r) {
      if (r && r.success !== false) {
        APP_DATA.dashboard = r.data || {};
        renderDashboard();
      }
    }).catch(function (e) { console.warn('dashboard:', e); }),

    API.getWeeklyComparison().then(function (r) {
      if (r && r.success !== false) {
        APP_DATA.weeklyComparison = r.data || {};
        renderWeeklyComparison();
      }
    }).catch(function (e) { console.warn('weekly:', e); })
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
    const results = await Promise.all([
      API.getExpenses(),
      API.getDashboard(),
      API.getWeeklyComparison()
    ]);
    const expenses = results[0];
    const dashboard = results[1];
    const weekly = results[2];

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
  document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
  const el = document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1));
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(function (btn) { btn.classList.remove('active'); });
  const nav = document.getElementById('nav' + view.charAt(0).toUpperCase() + view.slice(1));
  if (nav) nav.classList.add('active');

  document.querySelectorAll('.bottom-nav-item').forEach(function (btn) { btn.classList.remove('active'); });
  const navMob = document.getElementById('nav' + view.charAt(0).toUpperCase() + view.slice(1) + 'Mob');
  if (navMob) navMob.classList.add('active');

  if (view === 'history') renderHistoryGrouped();
  if (view === 'master') renderMasterTables();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =====================================================
   INIT
   ===================================================== */
document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 initApp started');
  initHeaderScroll();
  setToday();
  setCurrentDate();
  showView('dashboard');
  loadAllData();
  setHistoryRange(7);
});

/* =====================================================
   MODAL CLOSE ON BACKDROP / ESC
   ===================================================== */
document.querySelectorAll('.modal').forEach(function (m) {
  m.addEventListener('click', function (e) {
    if (e.target === m) m.classList.remove('show');
  });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(function (m) {
      m.classList.remove('show');
    });
  }
});
