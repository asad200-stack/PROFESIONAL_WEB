const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { slugify } = require('../utils/slugify');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, category } = req.query;
    const where = { storeId: req.user.storeId };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (category) {
      const cat = await prisma.category.findFirst({
        where: { storeId: req.user.storeId, slug: category },
      });
      if (cat) where.categoryId = cat.id;
    }
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
    return res.json(products);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list products' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name, shortDescription, description, priceOriginal, priceDiscount,
      discountActive, status, imageMainUrl, imageGallery, categorySlug,
    } = req.body || {};
    if (!name || priceOriginal == null) {
      return res.status(400).json({ error: 'name and priceOriginal required' });
    }
    let categoryId = null;
    if (categorySlug) {
      const cat = await prisma.category.findFirst({
        where: { storeId: req.user.storeId, slug: categorySlug },
      });
      if (cat) categoryId = cat.id;
    }
    const productSlugBase = slugify(name);
    let productSlug = productSlugBase || 'product';
    let i = 1;
    while (await prisma.product.findFirst({ where: { storeId: req.user.storeId, slug: productSlug } })) {
      productSlug = `${productSlugBase}-${i++}`;
    }
    const product = await prisma.product.create({
      data: {
        storeId: req.user.storeId,
        categoryId,
        name,
        slug: productSlug,
        shortDescription: shortDescription || null,
        description: description || null,
        priceOriginal: Number(priceOriginal),
        priceDiscount: priceDiscount != null ? Number(priceDiscount) : null,
        discountActive: Boolean(discountActive),
        status: status || 'ACTIVE',
        imageMainUrl: imageMainUrl || null,
        imageGallery: Array.isArray(imageGallery) ? imageGallery : (imageGallery ? [imageGallery] : []),
      },
    });

    await prisma.activityLog.create({
      data: {
        storeId: req.user.storeId,
        userId: req.user.userId,
        action: 'PRODUCT_ADD',
        details: { productId: product.id, name: product.name },
      },
    });

    return res.json(product);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const exist = await prisma.product.findUnique({ where: { id } });
    if (!exist || exist.storeId !== req.user.storeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    const {
      name, shortDescription, description, priceOriginal, priceDiscount,
      discountActive, status, imageMainUrl, imageGallery, categorySlug,
    } = req.body || {};

    let categoryId = exist.categoryId;
    if (categorySlug !== undefined) {
      if (categorySlug === null || categorySlug === '') {
        categoryId = null;
      } else {
        const cat = await prisma.category.findFirst({
          where: { storeId: req.user.storeId, slug: categorySlug },
        });
        categoryId = cat ? cat.id : null;
      }
    }

    const data = {
      categoryId,
    };
    if (name !== undefined && name !== exist.name) {
      const base = slugify(name);
      let nextSlug = base || exist.slug;
      let i = 1;
      while (
        await prisma.product.findFirst({
          where: { storeId: req.user.storeId, slug: nextSlug, NOT: { id: exist.id } },
        })
      ) {
        nextSlug = `${base}-${i++}`;
      }
      data.name = name;
      data.slug = nextSlug;
    }
    if (shortDescription !== undefined) data.shortDescription = shortDescription;
    if (description !== undefined) data.description = description;
    if (priceOriginal !== undefined) data.priceOriginal = Number(priceOriginal);
    if (priceDiscount !== undefined) data.priceDiscount = priceDiscount != null ? Number(priceDiscount) : null;
    if (discountActive !== undefined) data.discountActive = Boolean(discountActive);
    if (status !== undefined) data.status = status;
    if (imageMainUrl !== undefined) data.imageMainUrl = imageMainUrl;
    if (imageGallery !== undefined) data.imageGallery = Array.isArray(imageGallery) ? imageGallery : (imageGallery ? [imageGallery] : []);

    const updated = await prisma.product.update({ where: { id }, data });

    await prisma.activityLog.create({
      data: {
        storeId: req.user.storeId,
        userId: req.user.userId,
        action: 'PRODUCT_UPDATE',
        details: { productId: updated.id },
      },
    });

    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const exist = await prisma.product.findUnique({ where: { id } });
    if (!exist || exist.storeId !== req.user.storeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    await prisma.product.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        storeId: req.user.storeId,
        userId: req.user.userId,
        action: 'PRODUCT_DELETE',
        details: { productId: id },
      },
    });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;


