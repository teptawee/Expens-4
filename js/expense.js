/**
 * expense.js - บันทึก / แก้ไข / ลบ รายการ
 */

console.log('✅ expense.js loaded');

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
  ids.forEach(id => {
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
