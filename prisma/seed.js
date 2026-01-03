/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function slugify(text) {
  return String(text || 'store')
    .toLowerCase()
    .trim()
    .replace(/[\s\_]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '');
}

async function main() {
  const email = 'admin@demo.com';
  const storeName = 'Demo Store';
  const storeSlug = 'demo';
  const password = 'admin123';

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
    console.log('Created user:', user.email);
  }

  let store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        ownerId: user.id,
        name: storeName,
        slug: storeSlug,
        description: 'A demo store with sample products.',
        theme: 'minimal',
        primaryColor: '#2563eb',
        secondaryColor: '#10b981',
        borderRadius: 'rounded',
        shadowLevel: 2,
        cardSize: 'md',
        layoutMode: 'grid',
        whatsappNumber: '15551234567',
        socialLinks: {
          instagram: 'https://instagram.com/yourstore',
          facebook: 'https://facebook.com/yourstore',
          tiktok: '',
          telegram: '',
          website: ''
        },
        aboutPage: 'We are a demo store showcasing the platform.',
        contactPage: 'Contact us via WhatsApp or email.',
        returnPolicyPage: '14-day returns policy for unopened items.',
        termsPage: 'Standard terms and conditions apply.',
      },
    });
    console.log('Created store:', store.slug);
  }

  const catNames = ['Electronics', 'Fashion', 'Home'];
  const categories = [];
  for (const name of catNames) {
    const slug = slugify(name);
    let category = await prisma.category.findFirst({
      where: { storeId: store.id, slug },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { storeId: store.id, name, slug },
      });
      console.log('Created category:', name);
    }
    categories.push(category);
  }

  const sampleProducts = [
    {
      name: 'Wireless Headphones',
      shortDescription: 'Comfortable and long battery life.',
      description: 'High quality sound with noise cancellation.',
      priceOriginal: 99.99,
      priceDiscount: 79.99,
      discountActive: true,
      status: 'HOT',
      imageMainUrl: 'https://images.unsplash.com/photo-1518441902113-c1d3c1f0bf68',
      imageGallery: [
        'https://images.unsplash.com/photo-1518441902113-c1d3c1f0bf68',
        'https://images.unsplash.com/photo-1516726817505-f5ed825624d8'
      ],
      categoryIdx: 0,
    },
    {
      name: 'Smart Watch',
      shortDescription: 'Track health and notifications.',
      description: 'Water-resistant with customizable watch faces.',
      priceOriginal: 129.99,
      priceDiscount: null,
      discountActive: false,
      status: 'NEW',
      imageMainUrl: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f',
      imageGallery: [
        'https://images.unsplash.com/photo-1517433456452-f9633a875f6f'
      ],
      categoryIdx: 0,
    },
    {
      name: 'Minimal T-Shirt',
      shortDescription: '100% cotton, premium fit.',
      description: 'Available in multiple colors and sizes.',
      priceOriginal: 24.99,
      priceDiscount: 19.99,
      discountActive: true,
      status: 'ACTIVE',
      imageMainUrl: 'https://images.unsplash.com/photo-1520975922284-9bcdaf9f563a',
      imageGallery: [
        'https://images.unsplash.com/photo-1520975922284-9bcdaf9f563a'
      ],
      categoryIdx: 1,
    },
    {
      name: 'Ceramic Mug',
      shortDescription: 'Matte finish, 300ml.',
      description: 'Dishwasher safe, perfect for coffee lovers.',
      priceOriginal: 14.99,
      priceDiscount: null,
      discountActive: false,
      status: 'ACTIVE',
      imageMainUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
      imageGallery: [
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f'
      ],
      categoryIdx: 2,
    }
  ];

  for (const p of sampleProducts) {
    const slug = slugify(p.name);
    const exists = await prisma.product.findFirst({
      where: { storeId: store.id, slug },
    });
    if (!exists) {
      await prisma.product.create({
        data: {
          storeId: store.id,
          categoryId: categories[p.categoryIdx]?.id,
          name: p.name,
          slug,
          shortDescription: p.shortDescription,
          description: p.description,
          priceOriginal: p.priceOriginal,
          priceDiscount: p.priceDiscount,
          discountActive: p.discountActive,
          status: p.status,
          imageMainUrl: p.imageMainUrl,
          imageGallery: p.imageGallery,
        },
      });
      console.log('Created product:', p.name);
    }
  }

  // Banners
  const hero = await prisma.banner.findFirst({
    where: { storeId: store.id, type: 'HERO' },
  });
  if (!hero) {
    await prisma.banner.create({
      data: {
        storeId: store.id,
        type: 'HERO',
        title: 'Welcome to Demo Store',
        subtitle: 'Explore our latest products and hot deals',
        ctaText: 'Shop Now',
        ctaLink: `/store/${store.slug}`,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        position: 0,
        active: true,
      },
    });
    console.log('Created hero banner');
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


