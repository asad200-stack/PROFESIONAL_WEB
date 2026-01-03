const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { slugify } = require('../utils/slugify');

const prisma = new PrismaClient();
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, storeName } = req.body || {};
    if (!email || !password || !storeName) {
      return res.status(400).json({ error: 'email, password, storeName required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const storeSlugBase = slugify(storeName);
    let uniqueSlug = storeSlugBase || 'store';
    let i = 1;
    while (await prisma.store.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${storeSlugBase}-${i++}`;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    const store = await prisma.store.create({
      data: {
        ownerId: user.id,
        name: storeName,
        slug: uniqueSlug,
        theme: 'minimal',
        borderRadius: 'rounded',
        shadowLevel: 1,
        cardSize: 'md',
        layoutMode: 'grid',
      },
    });

    const token = jwt.sign({ userId: user.id, storeId: store.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    return res.json({ token, store, user: { id: user.id, email: user.email } });
  } catch (e) {
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const store = await prisma.store.findFirst({ where: { ownerId: user.id } });
    if (!store) return res.status(400).json({ error: 'No store found for this user' });
    const token = jwt.sign({ userId: user.id, storeId: store.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    return res.json({ token, store, user: { id: user.id, email: user.email } });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, createdAt: true },
    });
    const store = await prisma.store.findUnique({ where: { id: payload.storeId } });
    return res.json({ user, store });
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

module.exports = router;


