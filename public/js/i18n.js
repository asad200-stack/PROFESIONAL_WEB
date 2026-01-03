const I18N = {
  en: {
    search_placeholder: 'Search products...',
    filter_category: 'Category',
    sort_label: 'Sort',
    sort_newest: 'Newest',
    sort_popular: 'Popular',
    sort_price_asc: 'Price ↑',
    sort_price_desc: 'Price ↓',
    wishlist: 'My Wishlist',
    recently_viewed: 'Recently Viewed',
    popular: 'Popular',
    sale: 'SALE',
    new: 'NEW',
    out_of_stock: 'OUT OF STOCK',
    hot: 'HOT',
    contact_whatsapp: 'WhatsApp Order',
    view_details: 'View Details',
    no_results: 'No results found',
    similar_products: 'Similar Products',
    price: 'Price',
  },
  ar: {
    search_placeholder: 'ابحث عن منتجات...',
    filter_category: 'التصنيف',
    sort_label: 'الترتيب',
    sort_newest: 'الأحدث',
    sort_popular: 'الأكثر شهرة',
    sort_price_asc: 'السعر تصاعدياً',
    sort_price_desc: 'السعر تنازلياً',
    wishlist: 'المفضلة',
    recently_viewed: 'شوهد مؤخراً',
    popular: 'الأكثر مشاهدة',
    sale: 'خصم',
    new: 'جديد',
    out_of_stock: 'نفد من المخزون',
    hot: 'رائج',
    contact_whatsapp: 'طلب عبر واتساب',
    view_details: 'عرض التفاصيل',
    no_results: 'لا يوجد نتائج',
    similar_products: 'منتجات مشابهة',
    price: 'السعر',
  },
};

function applyLanguage(lang) {
  const dict = I18N[lang] || I18N.en;
  document.documentElement.setAttribute('lang', lang);
  document.body.classList.remove('rtl', 'ltr');
  document.body.classList.add(lang === 'ar' ? 'rtl' : 'ltr');
  const nodes = document.querySelectorAll('[data-i18n]');
  nodes.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.setAttribute('placeholder', dict[key]);
  });
}

window.SaasI18N = { I18N, applyLanguage };


