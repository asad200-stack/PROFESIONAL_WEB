const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { storeId: req.user.storeId },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
    return res.json(banners);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list banners' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, title, subtitle, ctaText, ctaLink, imageUrl, position, active } = req.body || {};
    if (!type) return res.status(400).json({ error: 'type required (HERO or SLIDER)' });
    
    const banner = await prisma.banner.create({
      data: {
        storeId: req.user.storeId,
        type: type.toUpperCase(),
        title: title || null,
        subtitle: subtitle || null,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        imageUrl: imageUrl || null,
        position: position != null ? Number(position) : 0,
        active: active !== false,
      },
    });
    return res.json(banner);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create banner' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner || banner.storeId !== req.user.storeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    const { type, title, subtitle, ctaText, ctaLink, imageUrl, position, active } = req.body || {};
    const data = {};
    if (type !== undefined) data.type = type.toUpperCase();
    if (title !== undefined) data.title = title || null;
    if (subtitle !== undefined) data.subtitle = subtitle || null;
    if (ctaText !== undefined) data.ctaText = ctaText || null;
    if (ctaLink !== undefined) data.ctaLink = ctaLink || null;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    if (position !== undefined) data.position = Number(position);
    if (active !== undefined) data.active = Boolean(active);
    
    const updated = await prisma.banner.update({ where: { id }, data });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update banner' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner || banner.storeId !== req.user.storeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    await prisma.banner.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete banner' });
  }
});

module.exports = router;

