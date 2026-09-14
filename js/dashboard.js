/**
 * dashboard.js - หน้า Dashboard + Weekly Comparison
 */

console.log('✅ dashboard.js loaded');

/* =====================================================
   DASHBOARD
   ===================================================== */
function renderDashboard() {
  const d = APP_DATA.dashboard || {};

  animateNumber(document.getElementById('heroMonth'), Number(d.month || 0));
  animateNumber(document.getElementById('heroBudget'),
    Number(d.totalBudget || 0), 800,
    (v) => money(v).replace(/\.00$/, ''));
  animateNumber(document.getElementById('heroRemain'),
    Number(d.totalBudgetRemaining || 0), 800,
    (v) => money(v).replace(/\.00$/, ''));

  document.getElementById('heroPercent').textContent = (d.budgetUsagePercent || 0) + '%';
  const progressEl = document.getElementById('heroProgress');
  if (progressEl) {
    progressEl.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
    progressEl.style.width = Math.min(100, d.budgetUsagePercent || 0) + '%';
  }
  document.getElementById('heroCompare').textContent = '-3.1%';

  animateNumber(document.getElementById('pillToday'), Number(d.today || 0), 800,
    (v) => money(v).replace(/\.00$/, ''));
  animateNumber(document.getElementById('pillWeek'), Number(d.week || 0), 800,
    (v) => money(v).replace(/\.00$/, ''));
  animateNumber(document.getElementById('pillYear'), Number(d.year || 0), 800,
    (v) => money(v).replace(/\.00$/, ''));

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

  rows.forEach(x => {
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
