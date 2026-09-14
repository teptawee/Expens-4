/**
 * history.js - หน้า History แบบ Group by Date
 */

console.log('✅ history.js loaded');

let historyState = {
  range: 7,
  dateFrom: '',
  dateTo: '',
  category: '',
  page: 1,
  perPage: 5
};

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

  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.classList.toggle('active', String(btn.dataset.range) === String(range));
  });

  renderHistoryGrouped();
}

function applyHistoryFilter() {
  historyState.dateFrom = (document.getElementById('historyDateFrom') || {}).value || '';
  historyState.dateTo = (document.getElementById('historyDateTo') || {}).value || '';
  historyState.category = (document.getElementById('filterCategory') || {}).value || '';
  historyState.page = 1;

  document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));

  renderHistoryGrouped();
}

function renderHistoryGrouped() {
  const el = document.getElementById('historyGroupedList');
  if (!el) return;

  const rows = (APP_DATA.expenses || []).filter(e => {
    if (historyState.dateFrom && e.expense_date < historyState.dateFrom) return false;
    if (historyState.dateTo && e.expense_date > historyState.dateTo) return false;
    if (historyState.category && e.category_id !== historyState.category) return false;
    return true;
  });

  rows.sort((a, b) => String(b.expense_date).localeCompare(String(a.expense_date)));

  if (!rows.length) {
    el.innerHTML = '<div class="history-empty"><i class="fa-regular fa-folder-open text-3xl mb-2 block"></i>ไม่พบรายการ</div>';
    const pag = document.getElementById('expensePagination');
    if (pag) pag.innerHTML = '';
    return;
  }

  const groups = {};
  rows.forEach(e => {
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

  el.innerHTML = pageKeys.map(key => {
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
      g.items.map(e => renderHistoryItem(e)).join('') +
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
