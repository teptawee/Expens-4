/**
 * utils.js - Helper functions ทั้งหมด
 * ต้องโหลดก่อนไฟล์อื่น ๆ ที่เรียกใช้
 */

console.log('✅ utils.js loaded');

/* =====================================================
   FORMATTING
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
  return `rgba(${r},${g},${b},${alpha})`;
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

/* =====================================================
   CATEGORY ICON
   ===================================================== */
function getCategoryIcon(name) {
  const n = String(name || '');
  for (const c of CATEGORY_ICONS) {
    if (n.indexOf(c.key) !== -1) return c;
  }
  return { icon: 'fa-solid fa-receipt', color: '#6366f1' };
}

/* =====================================================
   THAI DATE
   ===================================================== */
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
  const [y, m, d] = String(isoDate).split('-').map(Number);
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `${d} ${months[m - 1]} ${y + 543}`;
}

function getDayName(isoDate) {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return ['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'][day];
}

/* =====================================================
   UI FEEDBACK
   ===================================================== */
let _loadingCount = 0;

function showLoading(show, text) {
  const el = document.getElementById('loading');
  if (!el) return;
  if (show) {
    _loadingCount++;
    const t = document.getElementById('loadingText');
    if (t) t.textContent = text || 'กำลังประมวลผล...';
    el.classList.add('show');
  } else {
    _loadingCount = Math.max(0, _loadingCount - 1);
    if (_loadingCount === 0) el.classList.remove('show');
  }
}

function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = '<i class="fa-solid fa-sparkles text-pink-300"></i> ' + escapeHtml(message || '');
  el.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* =====================================================
   NUMBER ANIMATION
   ===================================================== */
function animateNumber(el, target, duration = 800, formatter = (v) => money(v)) {
  if (!el) return;
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
