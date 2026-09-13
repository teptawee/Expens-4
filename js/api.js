/**
 * api.js - จัดการเรียก API ไปยัง Google Apps Script
 * ใช้ fetch + POST และ cache ในหน่วยความจำ
 */

const API_CACHE = new Map();
const CACHE_TTL = 30000; // 30 วินาที

function cacheKey(fn, args) {
  return fn + ':' + JSON.stringify(args || {});
}

function getCached(key) {
  const item = API_CACHE.get(key);
  if (!item) return null;
  if (Date.now() - item.time > CACHE_TTL) {
    API_CACHE.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  API_CACHE.set(key, { data, time: Date.now() });
}

function clearCache(prefix) {
  if (!prefix) { API_CACHE.clear(); return; }
  for (const k of API_CACHE.keys()) {
    if (k.startsWith(prefix)) API_CACHE.delete(k);
  }
}

async function callGAS(fn, args) {
  if (!GAS_API_URL) {
    throw new Error('ยังไม่ได้ตั้งค่า GAS_API_URL ใน js/config.js');
  }

  const payload = { fn, args: args || {} };

  const res = await fetch(GAS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  if (!res.ok) throw new Error('Network error: ' + res.status);
  return await res.json();
}

async function apiCall(fn, args, useCache = true) {
  const key = cacheKey(fn, args);
  if (useCache) {
    const cached = getCached(key);
    if (cached) return cached;
  }

  const result = await callGAS(fn, args);
  if (useCache && result && result.success !== false) {
    setCache(key, result);
  }
  return result;
}

const API = {
  getMasterData: () => apiCall('getMasterData', {}, true),
  getExpenses: () => apiCall('getExpenses', {}, true),
  getDashboard: () => apiCall('getDashboard', {}, true),
  getWeeklyComparison: () => apiCall('getWeeklyComparison', {}, true),

  saveExpense: (data) => apiCall('saveExpense', { data }, false).then(r => { clearCache('get'); return r; }),
  deleteExpense: (id) => apiCall('deleteExpense', { expenseId: id }, false).then(r => { clearCache('get'); return r; }),

  addCategory: (data) => apiCall('addCategory', { data }, false).then(r => { clearCache('get'); return r; }),
  updateCategory: (data) => apiCall('updateCategory', { data }, false).then(r => { clearCache('get'); return r; }),
  deleteCategory: (id) => apiCall('deleteCategory', { categoryId: id }, false).then(r => { clearCache('get'); return r; }),

  addPaymentType: (data) => apiCall('addPaymentType', { data }, false).then(r => { clearCache('get'); return r; }),
  updatePaymentType: (data) => apiCall('updatePaymentType', { data }, false).then(r => { clearCache('get'); return r; }),
  deletePaymentType: (id) => apiCall('deletePaymentType', { paymentTypeId: id }, false).then(r => { clearCache('get'); return r; })
};
