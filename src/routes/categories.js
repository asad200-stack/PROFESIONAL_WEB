const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { slugify } = require('../utils/slugify');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { storeId: req.user.storeId },
      orderBy: { name: 'asc' },
    });
    return res.json(categories);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list categories' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const slug = slugify(name);
    const exists = await prisma.category.findFirst({
      where: { storeId: req.user.storeId, slug },
    });
    if (exists) return res.status(409).json({ error: 'Category exists' });
    const category = await prisma.category.create({
      data: { storeId: req.user.storeId, name, slug },
    });
    return res.json(category);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat || cat.storeId !== req.user.storeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    const slug = slugify(name);
    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat || cat.storeId !== req.user.storeId) {
      return res.status(404).json({ error: 'Not found' });
    }
    await prisma.category.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;


