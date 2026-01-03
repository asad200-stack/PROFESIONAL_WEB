/* global SaasUtils, SaasI18N */
(function () {
  const storeSlug = window.__STORE_SLUG__ || 'demo';
  const productSlug = window.__PRODUCT_SLUG__ || '';
  const state = { store: null, product: null, lang: 'en' };

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

  async function loadStore() {
    const res = await fetch(`/api/public/store/${storeSlug}`);
    const store = await res.json();
    state.store = store;
    document.getElementById('store-title').textContent = store.name;
    document.getElementById('store-logo').src = store.logoUrl || 'https://dummyimage.com/80x80/eee/aaa&text=Logo';
    setTheme(store.theme || 'minimal');
    applyCustomization(store);
    document.getElementById('back-to-store').href = `/store/${store.slug}`;
  }

  function badgeForStatus(status) {
    const map = { NEW: 'new', OUT_OF_STOCK: 'out_of_stock', HOT: 'hot' };
    const key = map[status];
    if (!key) return '';
    return `<span class="status-badge" data-i18n="${key}">${SaasI18N.I18N[state.lang][key]}</span>`;
  }

  function renderSimilar(list) {
    const grid = document.getElementById('similar-grid');
    grid.innerHTML = list.map(p => {
      const finalPrice = p.discountActive && p.priceDiscount != null ? p.priceDiscount : p.priceOriginal;
      const discount = p.discountActive && p.priceDiscount != null && p.priceDiscount < p.priceOriginal;
      const status = badgeForStatus(p.status);
      return `
        <div class="product-card">
          <img class="product-image" src="${p.imageMainUrl || ''}" alt="${p.name}" />
          <div class="product-title">${p.name}</div>
          ${status}
          <div class="price-row">
            ${discount ? `<span class="price-old">${SaasUtils.formatCurrency(p.priceOriginal)}</span>` : ''}
            <strong>${SaasUtils.formatCurrency(finalPrice)}</strong>
          </div>
          <div class="card-actions">
            <a class="link" href="/store/${state.store.slug}/product/${p.slug}">${SaasI18N.I18N[state.lang].view_details}</a>
          </div>
        </div>
      `;
    }).join('');
  }

  async function loadProduct() {
    const res = await fetch(`/api/public/store/${storeSlug}/product/${productSlug}`);
    if (!res.ok) throw new Error('Product not found');
    const product = await res.json();
    state.product = product;
    document.getElementById('p-title').textContent = product.name;
    document.getElementById('p-desc').textContent = product.description || '';
    const finalPrice = product.discountActive && product.priceDiscount != null ? product.priceDiscount : product.priceOriginal;
    const discount = product.discountActive && product.priceDiscount != null && product.priceDiscount < product.priceOriginal;
    document.getElementById('p-price').innerHTML = `
      ${discount ? `<span class="price-old">${SaasUtils.formatCurrency(product.priceOriginal)}</span>` : ''}
      <strong>${SaasUtils.formatCurrency(finalPrice)}</strong>
    `;
    document.getElementById('p-status').innerHTML = badgeForStatus(product.status);
    document.getElementById('p-category').textContent = product.category ? product.category.name : '';

    const images = Array.isArray(product.imageGallery) && product.imageGallery.length ? product.imageGallery : [product.imageMainUrl].filter(Boolean);
    const main = document.getElementById('gallery-main');
    const thumbs = document.getElementById('thumbs');
    main.src = images[0] || '';
    thumbs.innerHTML = images.map((src, i) => `<img class="thumb ${i===0?'active':''}" data-src="${src}" src="${src}" />`).join('');
    thumbs.querySelectorAll('.thumb').forEach((img) => {
      img.addEventListener('click', () => {
        thumbs.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
        img.classList.add('active');
        main.src = img.getAttribute('data-src');
      });
    });

    SaasUtils.addRecentlyViewed(state.store.slug, product);

    // track view
    fetch(`/api/public/store/${state.store.slug}/analytics/product-view/${product.id}`, { method: 'POST' }).catch(() => {});

    // load similar
    const url = new URL(window.location.origin + `/api/public/store/${storeSlug}/products`);
    if (product.category) url.searchParams.set('category', product.category.slug);
    url.searchParams.set('limit', '8');
    const res2 = await fetch(url);
    const similar = (await res2.json()).filter(p => p.slug !== product.slug);
    renderSimilar(similar);

    document.getElementById('wa-btn').addEventListener('click', async () => {
      const msg = [
        'Hello, I am interested in this product:',
        `Product: ${product.name}`,
        `Price: ${SaasUtils.formatCurrency(finalPrice)}`,
        `Link: ${SaasUtils.productUrl(state.store.slug, product.slug)}`,
        `Store: ${state.store.name}`,
      ].join('\n');
      const url = SaasUtils.buildWhatsAppUrl(state.store.whatsappNumber, msg);
      try {
        await fetch(`/api/public/store/${state.store.slug}/analytics/whatsapp-click`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        });
      } catch {}
      window.open(url, '_blank');
    });
    document.getElementById('wish-btn').addEventListener('click', () => {
      SaasUtils.toggleWishlist(state.store.slug, product);
    });
  }

  async function init() {
    const savedLang = localStorage.getItem(`lang_${storeSlug}`) || 'en';
    setLang(savedLang);
    await loadStore();
    await loadProduct();
    document.getElementById('lang-toggle').addEventListener('click', () => {
      setLang(state.lang === 'ar' ? 'en' : 'ar');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(); 


