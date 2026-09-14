/**
 * master.js - จัดการหมวดหมู่ + ประเภทชำระเงิน
 */

console.log('✅ master.js loaded');

function renderMasterDropdowns() {
  const categorySelect = document.getElementById('category_id');
  const filterCategory = document.getElementById('filterCategory');
  const paymentSelect = document.getElementById('payment_type_id');

  const activeCategories = APP_DATA.categories.filter(c => String(c.status).toLowerCase() !== 'inactive');
  const activePayments = APP_DATA.paymentTypes.filter(p => String(p.status).toLowerCase() !== 'inactive');

  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">-- เลือก --</option>' +
      activeCategories.map(c => '<option value="' + c.category_id + '">' + escapeHtml(c.category_name) + '</option>').join('');
  }
  if (filterCategory) {
    filterCategory.innerHTML = '<option value="">ทุกหมวดหมู่</option>' +
      activeCategories.map(c => '<option value="' + c.category_id + '">' + escapeHtml(c.category_name) + '</option>').join('');
  }
  if (paymentSelect) {
    paymentSelect.innerHTML = '<option value="">-- เลือก --</option>' +
      activePayments.map(p => '<option value="' + p.payment_type_id + '">' + escapeHtml(p.payment_type_name) + '</option>').join('');
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

  tbody.innerHTML = rows.map(c => {
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

  tbody.innerHTML = rows.map(p => {
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
