# دليل النشر على Railway

## خطوات النشر على Railway

### 1. إعداد المشروع على GitHub

1. **أنشئ مستودع جديد على GitHub:**
   - اذهب إلى [GitHub](https://github.com)
   - اضغط على "New repository"
   - اختر اسم للمستودع (مثلاً: `multi-store-saas`)
   - اختر Public أو Private
   - **لا** تضع علامة على "Initialize with README"

2. **ارفع المشروع إلى GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### 2. إنشاء حساب على Railway

1. اذهب إلى [Railway.app](https://railway.app)
2. سجل دخول باستخدام GitHub
3. وافق على الصلاحيات المطلوبة

### 3. إنشاء مشروع جديد على Railway

1. **من لوحة التحكم:**
   - اضغط على "New Project"
   - اختر "Deploy from GitHub repo"
   - اختر المستودع الذي أنشأته

2. **إضافة قاعدة البيانات PostgreSQL:**
   - في صفحة المشروع، اضغط على "+ New"
   - اختر "Database" → "Add PostgreSQL"
   - Railway سيقوم تلقائياً بإنشاء قاعدة بيانات وإضافة متغير `DATABASE_URL` في Environment Variables

### 4. إعداد Environment Variables

1. **في صفحة المشروع على Railway:**
   - اضغط على المشروع
   - اضغط على "Variables" في القائمة الجانبية

2. **أضف المتغيرات التالية:**
   ```
   JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
   PORT=3000
   BASE_URL=https://your-app-name.railway.app
   ```
   
   **ملاحظات:**
   - `JWT_SECRET`: استخدم مفتاح عشوائي قوي (يمكنك استخدام: `openssl rand -base64 32`)
   - `DATABASE_URL`: سيتم إضافتها تلقائياً من PostgreSQL plugin - **لا تحتاج لإضافتها يدوياً**
   - `BASE_URL`: استبدل `your-app-name` باسم المشروع الفعلي (سيظهر بعد النشر)

### 5. النشر التلقائي

1. **Railway سيقوم تلقائياً بـ:**
   - اكتشاف أن المشروع Node.js
   - تشغيل `npm install`
   - تشغيل `npm run postinstall` (Prisma generate)
   - تشغيل `npm start` (الذي يشغل prisma-setup.js ثم server.js)

2. **راقب عملية النشر:**
   - في صفحة المشروع، اضغط على "Deployments"
   - ستشاهد سجلات البناء والنشر
   - انتظر حتى تظهر "Deploy successful"

### 6. الحصول على الرابط العام

1. **بعد نجاح النشر:**
   - اضغط على "Settings" في المشروع
   - في قسم "Networking"، اضغط على "Generate Domain"
   - أو استخدم Custom Domain إذا كان لديك

2. **الرابط سيكون مثل:**
   ```
   https://your-app-name.up.railway.app
   ```

### 7. تحديث BASE_URL (اختياري)

1. بعد الحصول على الرابط النهائي:
   - اذهب إلى "Variables"
   - حدث `BASE_URL` بالرابط الصحيح
   - Railway سيعيد النشر تلقائياً

### 8. تشغيل Seed (إضافة بيانات تجريبية)

**خيار 1: من Railway Dashboard (Terminal)**
1. في صفحة المشروع، اضغط على "Deployments"
2. اضغط على آخر deployment
3. اضغط على "View Logs" ثم "Open Shell"
4. في Terminal، اكتب:
   ```bash
   npm run seed
   ```

**خيار 2: من محرك الأوامر المحلي**
```bash
# تأكد من أن DATABASE_URL في .env يشير لقاعدة بيانات Railway
npm run seed
```

### 9. اختبار التطبيق

1. **افتح الرابط العام:**
   ```
   https://your-app-name.up.railway.app
   ```

2. **اختبر:**
   - `/admin` - لوحة التحكم
   - `/store/demo` - المتجر التجريبي (بعد تشغيل seed)
   - `/health` - للتحقق من أن الخادم يعمل

### 10. إنشاء متجر جديد

1. اذهب إلى: `https://your-app-name.up.railway.app/admin`
2. اضغط على "Register"
3. أدخل:
   - Email
   - Password
   - Store Name
4. سيتم إنشاء متجر جديد برابط: `/store/YOUR_STORE_SLUG`

---

## استكشاف الأخطاء

### المشكلة: خطأ في Prisma
**الحل:**
- تأكد من أن `DATABASE_URL` موجود في Environment Variables
- تحقق من السجلات (Logs) لرؤية الخطأ بالتفصيل

### المشكلة: التطبيق لا يعمل
**الحل:**
1. تحقق من السجلات في Railway
2. تأكد من أن `PORT` موجود (Railway قد يضيفه تلقائياً)
3. تأكد من أن جميع Environment Variables موجودة

### المشكلة: قاعدة البيانات فارغة
**الحل:**
- شغل `npm run seed` من Terminal في Railway

### المشكلة: خطأ في JWT
**الحل:**
- تأكد من أن `JWT_SECRET` موجود وله قيمة عشوائية قوية

---

## نصائح مهمة

1. **لا ترفع ملف `.env` إلى GitHub** - يحتوي على معلومات حساسة
2. **استخدم Railway Environment Variables** - آمنة ومشفرة
3. **راقب السجلات (Logs)** - تساعد في اكتشاف المشاكل
4. **استخدم Custom Domain** - للحصول على رابط احترافي
5. **احتفظ بنسخة احتياطية** - من قاعدة البيانات المهمة

---

## التكلفة

- **الخطة المجانية:** متاحة مع قيود معينة
- **الخطة المدفوعة:** تبدأ من $5/شهر للمزيد من الموارد

---

## روابط مفيدة

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

---

## مثال على Environment Variables الكاملة

```
DATABASE_URL=postgresql://user:password@host:port/dbname?schema=public
JWT_SECRET=your_super_secret_jwt_key_here
PORT=3000
BASE_URL=https://your-app-name.up.railway.app
NODE_ENV=production
```

**ملاحظة:** `DATABASE_URL` يتم إضافتها تلقائياً من PostgreSQL plugin - لا تحتاج لإضافتها يدوياً!

