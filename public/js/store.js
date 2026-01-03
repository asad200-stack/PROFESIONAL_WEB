/* global SaasUtils, SaasI18N */
(function () {
  const storeSlug = window.__STORE_SLUG__ || 'demo';
  const state = {
    store: null,
    lang: 'en',
    products: [],
    categories: [],
    popular: [],
  };

  function setTheme(theme) {
    const link = document.getElementById('theme-css');
    const map = { minimal: '/themes/minimal.css', elegant: '/themes/elegant.css', dark: '/themes/dark.css' };
    link.href = map[theme] || map.minimal;
  }

  function applyCustomization(store) {
    const root = document.documentElement;
    if (store.primaryColor) root.style.setProperty('--color-primary', store.primaryColor);
    if (store.secondaryColor) root.style.setProperty('--color-secondary', store.secondaryColor);
    if (store.borderRadius === 'sharp') root.style.setProperty('--card-radius', '4px');
    const sizes = { sm: 0.95, md: 1, lg: 1.06 };
    if (store.cardSize && sizes[store.cardSize]) root.style.setProperty('--card-size', sizes[store.cardSize]);
    const shadows = { 0: 0, 1: 1, 2: 2, 3: 3 };
    if (store.shadowLevel != null) root.style.setProperty('--shadow-level', shadows[store.shadowLevel] ?? 1);
  }

  function setLang(lang) {
    state.lang = lang;
    SaasI18N.applyLanguage(lang);
    localStorage.setItem(`lang_${storeSlug}`, lang);
    document.getElementById('lang-toggle').textContent = lang === 'ar' ? 'EN' : 'AR';
  }

  function renderHero(banners) {
    const hero = banners.find(b => b.type === 'HERO');
    const sec = document.getElementById('hero-section');
    if (!hero) {
      sec.style.display = 'none';
      return;
    }
    sec.style.display = 'block';
    document.getElementById('hero-image').src = hero.imageUrl || '';
    document.getElementById('hero-title').textContent = hero.title || '';
    document.getElementById('hero-subtitle').textContent = hero.subtitle || '';
    const cta = document.getElementById('hero-cta');
    cta.textContent = hero.ctaText || 'Shop Now';
    cta.href = hero.ctaLink || '#';
  }

  function badgeForStatus(status) {
    const map = {
      NEW: 'new',
      OUT_OF_STOCK: 'out_of_stock',
      HOT: 'hot',
    };
    const key = map[status];
    if (!key) return '';
    return `<span class="status-badge" data-i18n="${key}">${SaasI18N.I18N[state.lang][key]}</span>`;
  }

  function renderProductCard(p) {
    const finalPrice = p.discountActive && p.priceDiscount != null ? p.priceDiscount : p.priceOriginal;
    const discount = p.discountActive && p.priceDiscount != null && p.priceDiscount < p.priceOriginal;
    const discountPercent = discount ? Math.round((1 - p.priceDiscount / p.priceOriginal) * 100) : 0;
    const priceHtml = `
      <div class="price-row">
        ${discount ? `<span class="price-old">${SaasUtils.formatCurrency(p.priceOriginal)}</span>` : ''}
        <strong>${SaasUtils.formatCurrency(finalPrice)}</strong>
        ${discount ? `<span class="discount-badge" data-i18n="sale">${SaasI18N.I18N[state.lang].sale}</span>` : ''}
        ${discount && discountPercent > 0 ? `<span style="color:#ef4444; font-weight:700;">-${discountPercent}%</span>` : ''}
      </div>
    `;
    const status = badgeForStatus(p.status);
    return `
      <div class="product-card">
        <img class="product-image" src="${p.imageMainUrl || ''}" alt="${p.name}" />
        <div class="product-title">${p.name}</div>
        <div class="product-desc">${p.shortDescription || ''}</div>
        ${status}
        ${priceHtml}
        <div class="card-actions">
          <a class="link" data-i18n="view_details" href="/store/${state.store.slug}/product/${p.slug}">${SaasI18N.I18N[state.lang].view_details}</a>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="wishlist-btn" data-id="${p.id}" aria-label="wishlist">♥</button>
            <button class="btn" data-wa="${p.id}" data-i18n="contact_whatsapp">${SaasI18N.I18N[state.lang].contact_whatsapp}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderGrid(el, list) {
    el.innerHTML = list.map(renderProductCard).join('');
    bindCardButtons(el, list);
  }

  function bindCardButtons(container, list) {
    container.querySelectorAll('button[data-wa]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-wa');
        const p = list.find(x => String(x.id) === String(id));
        if (!p) return;
        const finalPrice = p.discountActive && p.priceDiscount != null ? p.priceDiscount : p.priceOriginal;
        const msg = [
          'Hello, I am interested in this product:',
          `Product: ${p.name}`,
          `Price: ${SaasUtils.formatCurrency(finalPrice)}`,
          `Link: ${SaasUtils.productUrl(state.store.slug, p.slug)}`,
          `Store: ${state.store.name}`,
        ].join('\n');
        const url = SaasUtils.buildWhatsAppUrl(state.store.whatsappNumber, msg);
        try {
          await fetch(`/api/public/store/${state.store.slug}/analytics/whatsapp-click`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: p.id }),
          });
        } catch {}
        window.open(url, '_blank');
      });
    });
    container.querySelectorAll('button.wishlist-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const p = list.find(x => String(x.id) === String(id));
        if (!p) return;
        SaasUtils.toggleWishlist(state.store.slug, p);
      });
    });
  }

  async function loadStore() {
    const res = await fetch(`/api/public/store/${storeSlug}`);
    if (!res.ok) throw new Error('Store not found');
    const store = await res.json();
    state.store = store;

    document.getElementById('store-title').textContent = store.name;
    document.getElementById('store-desc').textContent = store.description || '';
    document.getElementById('store-logo').src = store.logoUrl || 'https://dummyimage.com/80x80/eee/aaa&text=Logo';

    setTheme(store.theme || 'minimal');
    applyCustomization(store);
    renderHero(store.banners || []);

    const socialDiv = document.getElementById('footer-social');
    const links = store.socialLinks || {};
    const list = [];
    for (const key of ['instagram', 'facebook', 'tiktok', 'telegram', 'website']) {
      if (links[key]) list.push(`<a class="link" href="${links[key]}" target="_blank" rel="noopener">${key}</a>`);
    }
    socialDiv.innerHTML = list.join(' • ');

    document.getElementById('footer-address').innerHTML = store.addressText ? `${store.addressText}` : '';

    // store visit
    fetch(`/api/public/store/${store.slug}/analytics/store-visit`, { method: 'POST' }).catch(() => {});
  }

  async function loadCategories() {
    const res = await fetch(`/api/public/store/${storeSlug}/categories`);
    const cats = await res.json();
    state.categories = cats;
    const sel = document.getElementById('category');
    sel.innerHTML = `<option value="">${state.lang === 'ar' ? 'الكل' : 'All'}</option>` + cats.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  }

  async function loadProducts() {
    const q = document.getElementById('search').value.trim();
    const category = document.getElementById('category').value;
    const sort = document.getElementById('sort').value;
    const url = new URL(window.location.origin + `/api/public/store/${storeSlug}/products`);
    if (q) url.searchParams.set('q', q);
    if (category) url.searchParams.set('category', category);
    if (sort) url.searchParams.set('sort', sort);
    const res = await fetch(url);
    const list = await res.json();
    state.products = list;
    const grid = document.getElementById('products-grid');
    const noRes = document.getElementById('no-results');
    if (!list.length) {
      grid.innerHTML = '';
      noRes.style.display = 'block';
    } else {
      noRes.style.display = 'none';
      renderGrid(grid, list);
    }
  }

  async function loadPopular() {
    const url = new URL(window.location.origin + `/api/public/store/${storeSlug}/products`);
    url.searchParams.set('sort', 'popular');
    url.searchParams.set('limit', '8');
    const res = await fetch(url);
    const list = await res.json();
    state.popular = list;
    renderGrid(document.getElementById('popular-grid'), list);
  }

  function loadRecentlyViewed() {
    const recent = SaasUtils.localGet(`recent_${storeSlug}`, []);
    if (recent.length) {
      const sec = document.getElementById('recently-viewed-section');
      sec.style.display = 'block';
      renderGrid(document.getElementById('recently-viewed-grid'), recent);
    }
  }

  function toggleWishlistSection() {
    const sec = document.getElementById('wishlist-section');
    const isVisible = sec.style.display !== 'none';
    if (isVisible) {
      sec.style.display = 'none';
    } else {
      sec.style.display = 'block';
      const items = SaasUtils.getWishlist(state.store.slug);
      renderGrid(document.getElementById('wishlist-grid'), items);
    }
  }

  async function init() {
    const savedLang = localStorage.getItem(`lang_${storeSlug}`) || 'en';
    setLang(savedLang);

    await loadStore();
    await loadCategories();
    await Promise.all([loadProducts(), loadPopular()]);
    loadRecentlyViewed();

    document.getElementById('lang-toggle').addEventListener('click', () => {
      setLang(state.lang === 'ar' ? 'en' : 'ar');
      // re-apply translations on visible nodes
      SaasI18N.applyLanguage(state.lang);
    });
    document.getElementById('search').addEventListener('input', debounce(loadProducts, 300));
    document.getElementById('category').addEventListener('change', loadProducts);
    document.getElementById('sort').addEventListener('change', loadProducts);
    document.getElementById('wishlist-button').addEventListener('click', toggleWishlistSection);
  }

  function debounce(fn, ms) {
    let id; return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
  }

  document.addEventListener('DOMContentLoaded', init);
})();


