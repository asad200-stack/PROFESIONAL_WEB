const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/store/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const banners = await prisma.banner.findMany({
      where: { storeId: store.id, active: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });

    return res.json({
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logoUrl: store.logoUrl,
      coverUrl: store.coverUrl,
      theme: store.theme,
      primaryColor: store.primaryColor,
      secondaryColor: store.secondaryColor,
      borderRadius: store.borderRadius,
      shadowLevel: store.shadowLevel,
      cardSize: store.cardSize,
      layoutMode: store.layoutMode,
      whatsappNumber: store.whatsappNumber,
      socialLinks: store.socialLinks,
      addressText: store.addressText,
      googleMapsUrl: store.googleMapsUrl,
      aboutPage: store.aboutPage,
      contactPage: store.contactPage,
      returnPolicyPage: store.returnPolicyPage,
      termsPage: store.termsPage,
      viewsCount: store.viewsCount,
      banners,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch store' });
  }
});

router.get('/store/:slug/categories', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    const categories = await prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
    return res.json(categories);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/store/:slug/products', async (req, res) => {
  try {
    const { slug } = req.params;
    const { q, category, sort = 'newest', limit = '24', offset = '0' } = req.query;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const where = { storeId: store.id, status: { not: 'HIDDEN' } };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (category) {
      const cat = await prisma.category.findFirst({ where: { storeId: store.id, slug: category } });
      if (cat) where.categoryId = cat.id;
    }

    let orderBy = [{ createdAt: 'desc' }];
    if (sort === 'popular') orderBy = [{ viewsCount: 'desc' }];
    if (sort === 'price-asc') orderBy = [{ priceOriginal: 'asc' }];
    if (sort === 'price-desc') orderBy = [{ priceOriginal: 'desc' }];

    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: Number(offset) || 0,
      take: Math.min(Number(limit) || 24, 100),
      select: {
        id: true, name: true, slug: true, shortDescription: true,
        priceOriginal: true, priceDiscount: true, discountActive: true, status: true,
        imageMainUrl: true, viewsCount: true, whatsappClicks: true,
        category: { select: { id: true, slug: true, name: true } },
      },
    });
    return res.json(products);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/store/:slug/product/:productSlug', async (req, res) => {
  try {
    const { slug, productSlug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    const product = await prisma.product.findFirst({
      where: { storeId: store.id, slug: productSlug },
      include: { category: true },
    });
    if (!product || product.status === 'HIDDEN') {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/store/:slug/analytics/store-visit', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    await prisma.store.update({
      where: { id: store.id },
      data: { viewsCount: { increment: 1 } },
    });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed' });
  }
});

router.post('/store/:slug/analytics/product-view/:productId', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    const { productId } = req.params;
    const prod = await prisma.product.findUnique({ where: { id: productId } });
    if (!prod || prod.storeId !== store.id) return res.status(404).json({ error: 'Not found' });
    await prisma.product.update({ where: { id: productId }, data: { viewsCount: { increment: 1 } } });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed' });
  }
});

router.post('/store/:slug/analytics/whatsapp-click', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    const { productId } = req.body || {};
    if (productId) {
      const prod = await prisma.product.findUnique({ where: { id: productId } });
      if (!prod || prod.storeId !== store.id) return res.status(404).json({ error: 'Not found' });
      await prisma.product.update({ where: { id: productId }, data: { whatsappClicks: { increment: 1 } } });
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;


