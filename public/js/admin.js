(function () {
  const state = { token: null, store: null };

  function authHeaders() {
    return state.token ? { Authorization: `Bearer ${state.token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  function setTab(name) {
    document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === name));
    ['settings','categories','products','banners','pages','analytics','activity'].forEach(t => {
      const el = document.getElementById(`tab-${t}`);
      if (el) el.style.display = t === name ? 'block' : 'none';
    });
    if (name === 'banners') loadBanners();
    if (name === 'analytics') loadAnalytics();
    if (name === 'activity') loadActivity();
  }

  function showApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
  }

  async function me() {
    if (!state.token) return null;
    const res = await fetch('/api/auth/me', { headers: authHeaders() });
    if (!res.ok) return null;
    const { store } = await res.json();
    state.store = store;
    return store;
  }

  async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      state.token = data.token;
      localStorage.setItem('admin_token', state.token);
      await me();
      showApp();
      loadSettings();
      loadCategories();
      loadProducts();
      loadBanners();
    } else {
      alert(data.error || 'Login failed');
    }
  }

  async function register() {
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const storeName = document.getElementById('reg-store').value.trim();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, storeName }),
    });
    const data = await res.json();
    if (res.ok) {
      state.token = data.token;
      localStorage.setItem('admin_token', state.token);
      await me();
      showApp();
      loadSettings();
    } else {
      alert(data.error || 'Registration failed');
    }
  }

  async function loadSettings() {
    const res = await fetch('/api/store', { headers: authHeaders() });
    const s = await res.json();
    if (!res.ok) return alert('Failed to load settings');
    state.store = s;
    document.getElementById('s-name').value = s.name || '';
    document.getElementById('s-description').value = s.description || '';
    document.getElementById('s-logo').value = s.logoUrl || '';
    document.getElementById('s-cover').value = s.coverUrl || '';
    document.getElementById('s-primary').value = s.primaryColor || '';
    document.getElementById('s-secondary').value = s.secondaryColor || '';
    document.getElementById('s-whatsapp').value = s.whatsappNumber || '';
    document.getElementById('s-theme').value = s.theme || 'minimal';
    document.getElementById('s-radius').value = s.borderRadius || 'rounded';
    document.getElementById('s-shadow').value = String(s.shadowLevel ?? 1);
    document.getElementById('s-card-size').value = s.cardSize || 'md';
    document.getElementById('s-layout').value = s.layoutMode || 'grid';
    const links = s.socialLinks || {};
    document.getElementById('s-instagram').value = links.instagram || '';
    document.getElementById('s-facebook').value = links.facebook || '';
    document.getElementById('s-tiktok').value = links.tiktok || '';
    document.getElementById('s-telegram').value = links.telegram || '';
    document.getElementById('s-website').value = links.website || '';
    document.getElementById('s-address').value = s.addressText || '';
    document.getElementById('s-maps').value = s.googleMapsUrl || '';

    document.getElementById('pg-about').value = s.aboutPage || '';
    document.getElementById('pg-contact').value = s.contactPage || '';
    document.getElementById('pg-return').value = s.returnPolicyPage || '';
    document.getElementById('pg-terms').value = s.termsPage || '';
  }

  async function saveSettings() {
    const body = {
      name: document.getElementById('s-name').value,
      description: document.getElementById('s-description').value,
      logoUrl: document.getElementById('s-logo').value,
      coverUrl: document.getElementById('s-cover').value,
      primaryColor: document.getElementById('s-primary').value,
      secondaryColor: document.getElementById('s-secondary').value,
      whatsappNumber: document.getElementById('s-whatsapp').value,
      theme: document.getElementById('s-theme').value,
      borderRadius: document.getElementById('s-radius').value,
      shadowLevel: Number(document.getElementById('s-shadow').value),
      cardSize: document.getElementById('s-card-size').value,
      layoutMode: document.getElementById('s-layout').value,
      socialLinks: {
        instagram: document.getElementById('s-instagram').value,
        facebook: document.getElementById('s-facebook').value,
        tiktok: document.getElementById('s-tiktok').value,
        telegram: document.getElementById('s-telegram').value,
        website: document.getElementById('s-website').value,
      },
      addressText: document.getElementById('s-address').value,
      googleMapsUrl: document.getElementById('s-maps').value,
    };
    const res = await fetch('/api/store', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) alert('Failed to save settings');
  }

  // Categories
  async function loadCategories() {
    const res = await fetch('/api/categories', { headers: authHeaders() });
    const cats = await res.json();
    if (!res.ok) return alert('Failed to load categories');
    const tbody = document.querySelector('#cat-table tbody');
    tbody.innerHTML = cats.map(c => `
      <tr>
        <td><input data-id="${c.id}" data-field="name" value="${c.name}" /></td>
        <td>${c.slug}</td>
        <td><button data-del="${c.id}" class="btn">Delete</button></td>
      </tr>
    `).join('');
    tbody.querySelectorAll('input[data-field="name"]').forEach(inp => {
      inp.addEventListener('change', async () => {
        const id = inp.getAttribute('data-id');
        const res = await fetch(`/api/categories/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify({ name: inp.value }) });
        if (!res.ok) alert('Failed to update category');
        loadCategories();
      });
    });
    tbody.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del');
        const res = await fetch(`/api/categories/${id}`, { method:'DELETE', headers: authHeaders() });
        if (!res.ok) alert('Failed to delete');
        loadCategories();
      });
    });
  }
  async function addCategory() {
    const name = document.getElementById('cat-name').value.trim();
    if (!name) return;
    const res = await fetch('/api/categories', { method:'POST', headers: authHeaders(), body: JSON.stringify({ name }) });
    if (!res.ok) alert('Failed to add category');
    document.getElementById('cat-name').value = '';
    loadCategories();
  }

  // Products
  async function loadProducts() {
    const res = await fetch('/api/products', { headers: authHeaders() });
    const list = await res.json();
    if (!res.ok) return alert('Failed to load products');
    const tbody = document.querySelector('#prod-table tbody');
    tbody.innerHTML = list.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.slug}</td>
        <td>${p.priceDiscount != null && p.discountActive ? `<s>${p.priceOriginal}</s> ${p.priceDiscount}` : p.priceOriginal}</td>
        <td>${p.status}</td>
        <td><button data-del="${p.id}" class="btn">Delete</button></td>
      </tr>
    `).join('');
    tbody.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del');
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) alert('Failed to delete');
        loadProducts();
      });
    });
  }
  async function addProduct() {
    const body = {
      name: document.getElementById('p-name').value.trim(),
      categorySlug: document.getElementById('p-category').value.trim() || undefined,
      priceOriginal: Number(document.getElementById('p-price').value),
      priceDiscount: document.getElementById('p-discount').value ? Number(document.getElementById('p-discount').value) : null,
      discountActive: document.getElementById('p-discount-active').checked,
      imageMainUrl: document.getElementById('p-image').value.trim(),
      imageGallery: document.getElementById('p-gallery').value.trim() ? document.getElementById('p-gallery').value.trim().split(',').map(s => s.trim()) : [],
      shortDescription: document.getElementById('p-short').value,
      description: document.getElementById('p-desc').value,
      status: document.getElementById('p-status').value || 'ACTIVE',
    };
    if (!body.name || isNaN(body.priceOriginal)) {
      return alert('Name and Price original are required');
    }
    const res = await fetch('/api/products', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    if (!res.ok) alert('Failed to add product');
    document.getElementById('p-name').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-discount').value = '';
    document.getElementById('p-image').value = '';
    document.getElementById('p-gallery').value = '';
    document.getElementById('p-short').value = '';
    document.getElementById('p-desc').value = '';
    document.getElementById('p-status').value = '';
    document.getElementById('p-discount-active').checked = false;
    loadProducts();
  }

  // Banners
  async function loadBanners() {
    const res = await fetch('/api/banners', { headers: authHeaders() });
    const banners = await res.json();
    if (!res.ok) return alert('Failed to load banners');
    const container = document.getElementById('banners-list');
    if (!container) return;
    container.innerHTML = banners.map(b => `
      <div style="border:1px solid #e2e8f0; padding:12px; border-radius:8px; margin-bottom:8px;">
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
          <strong>${b.type}</strong>
          <span style="color:#64748b;">${b.title || 'No title'}</span>
          <label style="margin-left:auto;">
            <input type="checkbox" data-id="${b.id}" data-field="active" ${b.active ? 'checked' : ''} />
            Active
          </label>
          <button data-del="${b.id}" class="btn" style="padding:4px 8px; font-size:12px;">Delete</button>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <input data-id="${b.id}" data-field="title" value="${b.title || ''}" placeholder="Title" />
          <input data-id="${b.id}" data-field="subtitle" value="${b.subtitle || ''}" placeholder="Subtitle" />
          <input data-id="${b.id}" data-field="ctaText" value="${b.ctaText || ''}" placeholder="CTA Text" />
          <input data-id="${b.id}" data-field="ctaLink" value="${b.ctaLink || ''}" placeholder="CTA Link" />
          <input data-id="${b.id}" data-field="imageUrl" value="${b.imageUrl || ''}" placeholder="Image URL" style="grid-column:1/-1;" />
          <input data-id="${b.id}" data-field="position" type="number" value="${b.position}" placeholder="Position" />
        </div>
      </div>
    `).join('');
    
    container.querySelectorAll('input[data-field]').forEach(inp => {
      const handler = () => {
        const id = inp.getAttribute('data-id');
        const field = inp.getAttribute('data-field');
        const value = inp.type === 'checkbox' ? inp.checked : inp.value;
        updateBanner(id, { [field]: value });
      };
      if (inp.type === 'checkbox') {
        inp.addEventListener('change', handler);
      } else {
        inp.addEventListener('blur', handler);
      }
    });
    
    container.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del');
        if (!confirm('Delete this banner?')) return;
        const res = await fetch(`/api/banners/${id}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) alert('Failed to delete');
        loadBanners();
      });
    });
  }
  
  async function updateBanner(id, data) {
    const res = await fetch(`/api/banners/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) alert('Failed to update banner');
  }
  
  async function addBanner() {
    const body = {
      type: document.getElementById('b-type').value || 'HERO',
      title: document.getElementById('b-title').value.trim() || null,
      subtitle: document.getElementById('b-subtitle').value.trim() || null,
      ctaText: document.getElementById('b-cta-text').value.trim() || null,
      ctaLink: document.getElementById('b-cta-link').value.trim() || null,
      imageUrl: document.getElementById('b-image').value.trim() || null,
      position: Number(document.getElementById('b-position').value) || 0,
      active: true,
    };
    const res = await fetch('/api/banners', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    if (!res.ok) alert('Failed to add banner');
    document.getElementById('b-title').value = '';
    document.getElementById('b-subtitle').value = '';
    document.getElementById('b-cta-text').value = '';
    document.getElementById('b-cta-link').value = '';
    document.getElementById('b-image').value = '';
    document.getElementById('b-position').value = '0';
    loadBanners();
  }

  // Analytics
  async function loadAnalytics() {
    const res = await fetch('/api/store/analytics', { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) return alert('Failed to load analytics');
    const container = document.getElementById('analytics-content');
    if (!container) return;
    container.innerHTML = `
      <div style="margin-bottom:24px;">
        <h4>Store Views</h4>
        <div style="font-size:32px; font-weight:700; color:var(--color-primary);">${data.storeViews || 0}</div>
      </div>
      <div>
        <h4>Top Products</h4>
        <table style="width:100%; margin-top:12px;">
          <thead><tr><th>Product</th><th>Views</th><th>WhatsApp Clicks</th></tr></thead>
          <tbody>
            ${data.topProducts && data.topProducts.length ? data.topProducts.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.viewsCount || 0}</td>
                <td>${p.whatsappClicks || 0}</td>
              </tr>
            `).join('') : '<tr><td colspan="3">No data yet</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // Activity Log
  async function loadActivity() {
    const res = await fetch('/api/store/activity', { headers: authHeaders() });
    const logs = await res.json();
    if (!res.ok) return alert('Failed to load activity');
    const container = document.getElementById('activity-content');
    if (!container) return;
    container.innerHTML = logs.length ? logs.map(log => {
      const date = new Date(log.createdAt).toLocaleString();
      const details = log.details ? JSON.stringify(log.details) : '';
      return `
        <div style="border-bottom:1px solid #e2e8f0; padding:8px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>${log.action}</strong>
            <span style="color:#64748b; font-size:12px;">${date}</span>
          </div>
          ${details ? `<div style="color:#64748b; font-size:12px; margin-top:4px;">${details}</div>` : ''}
        </div>
      `;
    }).join('') : '<p>No activity yet</p>';
  }

  // Pages
  async function savePages() {
    const res = await fetch('/api/store', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        aboutPage: document.getElementById('pg-about').value,
        contactPage: document.getElementById('pg-contact').value,
        returnPolicyPage: document.getElementById('pg-return').value,
        termsPage: document.getElementById('pg-terms').value,
      }),
    });
    if (!res.ok) alert('Failed to save pages');
  }

  function bindEvents() {
    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('reg-btn').addEventListener('click', register);
    document.querySelectorAll('.tabbar button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => setTab(btn.getAttribute('data-tab')));
    });
    document.getElementById('s-save').addEventListener('click', saveSettings);
    document.getElementById('cat-add').addEventListener('click', addCategory);
    document.getElementById('p-add').addEventListener('click', addProduct);
    document.getElementById('pg-save').addEventListener('click', savePages);
    const bAdd = document.getElementById('b-add');
    if (bAdd) bAdd.addEventListener('click', addBanner);
    const exportCsv = document.getElementById('export-csv');
    if (exportCsv) {
      exportCsv.addEventListener('click', () => {
        const url = '/api/export/products.csv';
        fetch(url, { headers: authHeaders() })
          .then(res => res.blob())
          .then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'products.csv';
            link.click();
          })
          .catch(() => alert('Failed to export CSV'));
      });
    }
  }

  async function init() {
    bindEvents();
    const saved = localStorage.getItem('admin_token');
    if (saved) {
      state.token = saved;
      const store = await me();
      if (store) {
        showApp();
        loadSettings();
        loadCategories();
        loadProducts();
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();


