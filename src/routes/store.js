const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: req.user.storeId } });
    return res.json(store);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch store' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const allowed = [
      'name', 'description', 'logoUrl', 'coverUrl',
      'primaryColor', 'secondaryColor', 'borderRadius', 'shadowLevel', 'cardSize', 'layoutMode',
      'theme', 'whatsappNumber', 'socialLinks',
      'addressText', 'googleMapsUrl',
      'aboutPage', 'contactPage', 'returnPolicyPage', 'termsPage',
    ];
    const data = {};
    for (const key of allowed) {
      if (key in req.body) data[key] = req.body[key];
    }
    const store = await prisma.store.update({
      where: { id: req.user.storeId },
      data,
    });
    return res.json(store);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update store' });
  }
});

router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: req.user.storeId } });
    const topProducts = await prisma.product.findMany({
      where: { storeId: req.user.storeId },
      orderBy: [{ viewsCount: 'desc' }, { whatsappClicks: 'desc' }],
      take: 10,
      select: {
        id: true,
        name: true,
        viewsCount: true,
        whatsappClicks: true,
      },
    });
    return res.json({
      storeViews: store.viewsCount || 0,
      topProducts,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { storeId: req.user.storeId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true } } },
    });
    return res.json(logs);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

module.exports = router;


