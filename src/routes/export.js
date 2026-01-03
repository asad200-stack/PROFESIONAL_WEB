const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { toCsv } = require('../utils/csv');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/products.csv', authMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { storeId: req.user.storeId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'id', 'name', 'slug', 'category', 'priceOriginal', 'priceDiscount',
      'discountActive', 'status', 'imageMainUrl', 'imageGallery',
    ];
    const rows = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category ? p.category.name : '',
      priceOriginal: p.priceOriginal,
      priceDiscount: p.priceDiscount ?? '',
      discountActive: p.discountActive ? 'true' : 'false',
      status: p.status,
      imageMainUrl: p.imageMainUrl ?? '',
      imageGallery: Array.isArray(p.imageGallery) ? p.imageGallery.join('|') : '',
    }));

    const csv = toCsv(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    return res.send(csv);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to export CSV' });
  }
});

module.exports = router;


