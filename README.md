# ระบบบันทึกค่าใช้จ่ายประจำวัน

## โครงสร้างไฟล์
```
├── index.html
├── css/style.css
├── js/config.js      ← ตั้งค่า GAS_API_URL ที่นี่
├── js/api.js
├── js/charts.js
└── js/app.js
```

## 1. Deploy Frontend บน GitHub Pages
1. สร้าง repo ใหม่บน GitHub (public)
2. Push ไฟล์ทั้งหมด
3. Settings → Pages → Source: `main` / `(root)` → Save
4. เข้าที่ `https://<username>.github.io/<repo>/`

## 2. Deploy Backend (Google Apps Script)
1. เปิด https://script.google.com → New Project
2. วางโค้ดจาก `Code.gs` (พร้อมเพิ่ม `doPost` ด้านล่าง)
3. Deploy → New deployment → Web app
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy URL

## 3. เพิ่ม `doPost` ใน Code.gs
```javascript
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const fn = payload.fn;
    const args = payload.args || {};

    if (typeof globalThis[fn] !== 'function') {
      return json_({ success: false, message: 'ไม่พบฟังก์ชัน: ' + fn });
    }

    const result = globalThis[fn].apply(null, Object.values(args));
    return json_(result);
  } catch (err) {
    return json_({ success: false, message: err.message });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 4. ตั้งค่า URL
แก้ `js/config.js`:
```javascript
const GAS_API_URL = 'https://script.google.com/macros/s/AKfyc.../exec';
```

## 5. Push ขึ้น GitHub อีกครั้ง — เสร็จแล้ว!

---

## Mobile Bottom Nav
ตอนนี้มี **5 ช่อง**:
1. ภาพรวม
2. ประวัติ
3. **FAB กลาง (+)** → เปิดหน้าบันทึก
4. **บันทึก** → เปิดหน้าบันทึก (ทางลัด)
5. ตั้งค่า

## ประสิทธิภาพ
| จุด | ก่อน | หลัง |
|-----|------|------|
| Request | 4 เรียงลำดับ | 4 ขนาน (Promise.all) |
| Cache | ❌ | ✅ 30 วินาที |
| โหลดซ้ำ | ~2-3s | ทันที |
