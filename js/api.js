/**
 * api.js - จัดการเรียก API ไปยัง Google Apps Script
 * ✅ persistent cache (sessionStorage) + TTL 5 นาที + in-flight dedupe
 */

const API_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_PREFIX = 'exp_cache_';
const INFLIGHT = new Map();

function cacheKey(fn, args) {
  return fn + ':' + JSON.stringify(args || {});
}

function getCached(key) {
  const item = API_CACHE.get(key);
  if (item && Date.now() - item.time <= CACHE_TTL) return item.data;

  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.time <= CACHE_TTL) {
        API_CACHE.set(key, parsed);
        return parsed.data;
      }
      sessionStorage.removeItem(CACHE_PREFIX + key);
    }
  } catch (e) { /* ignore */ }

  return null;
}

function setCache(key, data) {
  const entry = { data, time: Date.now() };
  API_CACHE.set(key, entry);
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) { /* quota */ }
}

function clearCache(prefix) {
  if (!prefix) {
    API_CACHE.clear();
    try {
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
      });
    } catch (e) {}
    return;
  }
  for (const k of [...API_CACHE.keys()]) {
    if (k.startsWith(prefix)) API_CACHE.delete(k);
  }
  try {
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith(CACHE_PREFIX + prefix)) sessionStorage.removeItem(k);
    });
  } catch (e) {}
}

async function callGAS(fn, args) {
  if (!GAS_API_URL) {
    throw new Error('ยังไม่ได้ตั้งค่า GAS_API_URL ใน js/config.js');
  }

  const res = await fetch(GAS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, args: args || {} }),
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

  if (INFLIGHT.has(key)) return INFLIGHT.get(key);

  const promise = (async () => {
    try {
      const result = await callGAS(fn, args);
      if (useCache && result && result.success !== false) {
        setCache(key, result);
      }
      return result;
    } finally {
      INFLIGHT.delete(key);
    }
  })();

  INFLIGHT.set(key, promise);
  return promise;
}

const API = {
  getMasterData: () => apiCall('getMasterData'),
  getExpenses: () => apiCall('getExpenses'),
  getDashboard: () => apiCall('getDashboard'),
  getWeeklyComparison: () => apiCall('getWeeklyComparison'),

  saveExpense: (data) => apiCall('saveExpense', { data }, false).then(r => { clearCache(); return r; }),
  deleteExpense: (id) => apiCall('deleteExpense', { expenseId: id }, false).then(r => { clearCache(); return r; }),

  addCategory: (data) => apiCall('addCategory', { data }, false).then(r => { clearCache(); return r; }),
  updateCategory: (data) => apiCall('updateCategory', { data }, false).then(r => { clearCache(); return r; }),
  deleteCategory: (id) => apiCall('deleteCategory', { categoryId: id }, false).then(r => { clearCache(); return r; }),

  addPaymentType: (data) => apiCall('addPaymentType', { data }, false).then(r => { clearCache(); return r; }),
  updatePaymentType: (data) => apiCall('updatePaymentType', { data }, false).then(r => { clearCache(); return r; }),
  deletePaymentType: (id) => apiCall('deletePaymentType', { paymentTypeId: id }, false).then(r => { clearCache(); return r; })
};
