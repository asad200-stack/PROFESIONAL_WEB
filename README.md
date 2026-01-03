## Multi-Store SaaS (Express + Prisma + Vanilla JS)

A lightweight multi-tenant storefront platform with WhatsApp ordering, product/catalog management, themes, and simple analytics.

- Backend: Node.js (Express) + Prisma (PostgreSQL on Railway)
- Frontend: HTML, CSS, Vanilla JS
- Deployment: GitHub → Railway

### Live Features
- Multi-store isolation by `store.slug` (no cross-store data access)
- Public storefront with 3 themes: Minimal, Elegant, Dark
- EN/AR toggle (RTL ready)
- WhatsApp order button on product cards and details
- Search, Categories filter, Wishlist (LocalStorage), Recently viewed, Popular
- Simple analytics: store views, product views, WhatsApp clicks
- Admin dashboard (vanilla JS) to manage store, products, categories, banners, pages
- CSV export of products

---

## Quick Start (Local)

1) Clone & install

```bash
git clone <your-repo-url>
cd profesional_web
npm install
```

2) Configure environment

- Copy `env.example` → `.env` and adjust values:
  - `DATABASE_URL` (use local Postgres or Railway Postgres)
  - `JWT_SECRET`
  - `PORT` (optional, default 3000)

3) Initialize Prisma

```bash
npx prisma generate
npx prisma db push
npm run seed
```

4) Start

```bash
npm run dev
# Open http://localhost:3000/store/demo to view the demo store
# Admin dashboard: http://localhost:3000/admin
```

Demo credentials (from seed):
- Email: `admin@demo.com`
- Password: `admin123`

---

## Deploy on Railway

1) Push your repository to GitHub.
2) Create a new Railway project → Connect to GitHub.
3) Add a Postgres plugin (Railway will auto-inject `DATABASE_URL`).
4) Add environment variables:
   - `JWT_SECRET` (generate with: `openssl rand -base64 32`)
   - `PORT=3000` (optional, Railway may set this automatically)
   - (Optional) `BASE_URL` if you want absolute product links in WhatsApp messages
5) Deploy. The `start` script runs a Prisma setup (deploy or push) then starts the server.
6) Run seed: In Railway terminal, run `npm run seed` to add demo data.

Public store links:
`https://<your-railway-domain>/store/<STORE_SLUG>`

**For detailed Arabic deployment guide, see [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)**

---

## How It Works

### Multi-Store Isolation
- Each owner registers once and gets a unique store (slug).
- All admin requests are authenticated with JWT and bound to the owner's `storeId`.
- Public data is fetched via the store's slug. No cross-store data is ever returned.

### WhatsApp Ordering
- The frontend composes a pre-filled message:
  - Product name
  - Final price (discounted if active)
  - Product URL
  - Store name
- Opens WhatsApp (Web/Mobile) using `https://wa.me/<number>?text=<encoded>`.

### Themes
Three CSS themes in `public/themes`:
- `minimal.css` (Minimal Modern)
- `elegant.css` (Elegant Premium)
- `dark.css` (Dark Mode)

The store owner selects a theme in the admin. The storefront loads it dynamically.

### Customization
Owner can set:
- Primary/Secondary colors
- Border radius (rounded/sharp), shadow level, card size, layout (grid/large)
- Logo/Cover images
- Pages: About, Contact, Return Policy, Terms
- Social links in the footer

Changes are applied live on the storefront via CSS variables.

### Data Export
`GET /api/export/products.csv` (admin) exports basic product data.

---

## API Overview (Selected)

Auth:
- `POST /api/auth/register` → { email, password, storeName }
- `POST /api/auth/login` → { email, password }
- `GET /api/me` (JWT)

Admin (JWT):
- `GET/PUT /api/store`
- `GET /api/store/analytics` - Store analytics (views, top products)
- `GET /api/store/activity` - Activity log
- `GET/POST /api/categories`, `PUT/DELETE /api/categories/:id`
- `GET/POST /api/products`, `PUT/DELETE /api/products/:id`
- `GET/POST /api/banners`, `PUT/DELETE /api/banners/:id`
- `GET /api/export/products.csv`

Public:
- `GET /api/public/store/:slug`
- `GET /api/public/store/:slug/categories`
- `GET /api/public/store/:slug/products?q&category&sort&limit&offset`
- `GET /api/public/store/:slug/product/:productSlug`
- `POST /api/public/store/:slug/analytics/store-visit`
- `POST /api/public/store/:slug/analytics/product-view/:productId`
- `POST /api/public/store/:slug/analytics/whatsapp-click`

---

## Folder Structure

- `src/` Express app and routes
- `prisma/` Prisma schema and seed
- `public/` Frontend (storefront + admin) and themes
- `scripts/` Prisma deploy/push helper

---

## Guide (Arabic)

### إنشاء متجر جديد
1) افتح `/admin`
2) أنشئ حساب جديد (Register) مع اسم المتجر
3) سيتم إنشاء متجرك مع رابط ثابت: `/store/<slug>`

### إعداد واتساب
1) من لوحة التحكم → إعدادات المتجر
2) أدخل رقم الواتساب الدولي (بدون رموز) مثال: `966512345678`

### إضافة المنتجات والتصنيفات
1) أنشئ تصنيفات من تبويب Categories
2) أضف المنتجات وحدد السعر والخصم إن وجد
3) يمكن إدخال روابط الصور مباشرة (URL)

### الثيمات والتخصيص
- اختر الثيم من إعدادات المتجر (Minimal/Elegant/Dark)
- عدّل الألوان والحواف والظلال وحجم البطاقات

### تفعيل الخصومات
- فعّل الخصم وحدد `priceDiscount`
- يتم عرض السعر القديم مشطوباً والجديد بارزاً مع شارة خصم

### التصدير CSV
- من لوحة التحكم: زر Export Products CSV

---

## License
MIT


