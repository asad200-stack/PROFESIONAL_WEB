require('dotenv').config();
const path = require('node:path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const bannerRoutes = require('./routes/banners');
const publicRoutes = require('./routes/public');
const exportRoutes = require('./routes/export');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/export', exportRoutes);

// Static frontend
const staticDir = path.join(__dirname, '..', 'public');
app.use(express.static(staticDir));

// Dynamic storefront routes
app.get('/store/:slug', (req, res) => {
  res.sendFile(path.join(staticDir, 'store.html'));
});
app.get('/store/:slug/product/:productSlug', (req, res) => {
  res.sendFile(path.join(staticDir, 'product.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(staticDir, 'admin', 'index.html'));
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


