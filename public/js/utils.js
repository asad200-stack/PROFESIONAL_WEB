function sanitizePhone(number) {
  if (!number) return '';
  return String(number).replace(/[^\d]/g, '');
}

function formatCurrency(amount, locale = 'en-US', currency = 'USD') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
}

function buildWhatsAppUrl(phone, message) {
  const num = sanitizePhone(phone);
  const text = encodeURIComponent(message || '');
  return `https://wa.me/${num}?text=${text}`;
}

function getBaseUrl() {
  const envBase = window.__BASE_URL__;
  if (envBase) return envBase;
  return window.location.origin;
}

function productUrl(storeSlug, productSlug) {
  return `${getBaseUrl()}/store/${storeSlug}/product/${productSlug}`;
}

function localGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}
function localSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function toggleWishlist(storeSlug, product) {
  const key = `wishlist_${storeSlug}`;
  const current = localGet(key, []);
  const exists = current.find((p) => p.id === product.id);
  let next = current;
  if (exists) {
    next = current.filter((p) => p.id !== product.id);
  } else {
    next = [{ id: product.id, name: product.name, slug: product.slug, imageMainUrl: product.imageMainUrl, priceOriginal: product.priceOriginal, priceDiscount: product.priceDiscount, discountActive: product.discountActive }, ...current].slice(0, 100);
  }
  localSet(key, next);
  return next;
}

function getWishlist(storeSlug) {
  return localGet(`wishlist_${storeSlug}`, []);
}

function addRecentlyViewed(storeSlug, product) {
  const key = `recent_${storeSlug}`;
  const current = localGet(key, []);
  const filtered = current.filter((p) => p.id !== product.id);
  const next = [{ id: product.id, name: product.name, slug: product.slug, imageMainUrl: product.imageMainUrl }, ...filtered].slice(0, 12);
  localSet(key, next);
  return next;
}

window.SaasUtils = {
  sanitizePhone,
  formatCurrency,
  buildWhatsAppUrl,
  productUrl,
  localGet,
  localSet,
  toggleWishlist,
  getWishlist,
  addRecentlyViewed,
};


