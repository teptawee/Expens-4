/**
 * charts.js - จัดการ Chart.js
 */

let paymentChart = null;
let categoryChart = null;

const TOOLTIP_CONFIG = {
  backgroundColor: '#1e1b4b',
  padding: 12,
  cornerRadius: 10,
  titleFont: { family: 'Noto Sans Thai', size: 13, weight: '600' },
  bodyFont: { family: 'Noto Sans Thai', size: 13 }
};

function renderDoughnut(canvasId, legendId, rows, chartRef) {
  const canvas = document.getElementById(canvasId);
  const legendEl = document.getElementById(legendId);
  if (!canvas) return chartRef;

  if (!rows || !rows.length) {
    const wrap = canvas.parentElement;
    wrap.innerHTML = '<div class="text-sm text-slate-400 py-6 text-center">ไม่มีข้อมูล</div>';
    if (legendEl) legendEl.innerHTML = '';
    return chartRef;
  }

  const labels = rows.map(x => x.name);
  const data = rows.map(x => Number(x.amount || 0));
  const total = data.reduce((s, v) => s + v, 0) || 1;

  if (chartRef) chartRef.destroy();

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: THEME_COLORS.slice(0, data.length),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP_CONFIG,
          callbacks: {
            label(ctx) {
              const v = Number(ctx.raw || 0);
              const pct = ((v / total) * 100).toFixed(1);
              return ' ฿' + new Intl.NumberFormat('th-TH').format(v) + ' (' + pct + '%)';
            }
          }
        }
      }
    }
  });

  if (legendEl) {
    legendEl.innerHTML = labels.map((l, i) =>
      '<div class="flex items-center gap-1.5 text-xs">' +
        '<span class="w-2.5 h-2.5 rounded-full" style="background:' + THEME_COLORS[i % THEME_COLORS.length] + '"></span>' +
        '<span class="text-slate-600 truncate max-w-[100px]">' + escapeHtml(l) + '</span>' +
      '</div>'
    ).join('');
  }

  return chart;
}

function renderPaymentChart(d) {
  paymentChart = renderDoughnut('paymentChart', 'paymentLegend', d.paymentSummary, paymentChart);
}

function renderCategoryChart(d) {
  const rows = (d.categorySummary || []).slice(0, 8);
  categoryChart = renderDoughnut('categoryChart', 'categoryLegend', rows, categoryChart);
}
