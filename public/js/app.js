/* ===== PENTEXA.IO — App Core ===== */

// ---- API Config ----
const API_BASE_URL = '/api/v1';

async function apiRequest(endpoint, method = 'GET', body = null, isForm = false) {
  const token = localStorage.getItem('pentexa_token');
  const headers = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) {
    options.body = isForm ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('pentexa_token');
        localStorage.removeItem('pentexa_session');
      }
      throw new Error(await res.text());
    }
    return await res.json();
  } catch (e) {
    console.error('API Error:', e);
    throw e;
  }
}

// ---- Navbar Injection ----
function renderNavbar() {
  let session = null;
  try { session = JSON.parse(localStorage.getItem('pentexa_session')); } catch (e) { session = null; }

  const currentUser = session ? session.user : null;
  const currentPage = location.pathname.split('/').pop() || 'index.html';

  const navLinks = [
    { href: 'index.html', key: 'nav.home' },
    { href: 'tools.html', key: 'nav.tools' },
    { href: 'services.html', key: 'nav.services' },
    { href: 'services.html#quote', key: 'nav.contactSales' },
    { href: 'blog.html', key: 'nav.blog' },
    { href: 'about.html', key: 'nav.about' }
  ];

  const linksHTML = navLinks.map(l =>
    `<a href="${l.href}" class="${currentPage === l.href ? 'active' : ''}" data-i18n="${l.key}">${t(l.key)}</a>`
  ).join('');

  const langBtnText = getLang() === 'en' ? 'TR' : 'EN';
  const langBtnTitle = getLang() === 'en' ? 'Türkçeye geç' : 'Switch to English';

  let actionsHTML = '';
  if (currentUser) {
    actionsHTML = `
      <div class="nav-user">
        <button class="nav-user-btn" aria-label="User menu" onclick="toggleUserDropdown()">
          <span>👤</span> ${sanitize(currentUser.name)}
        </button>
        <div class="nav-user-dropdown" id="userDropdown">
          <a href="dashboard.html" data-i18n="nav.dashboard">${t('nav.dashboard')}</a>
          ${(currentUser.role && currentUser.role.name === "admin") ? `<a href="admin.html" data-i18n="nav.admin">${t('nav.admin')}</a>` : ''}
          <a href="#" onclick="logout(); return false;" data-i18n="nav.logout">${t('nav.logout')}</a>
        </div>
      </div>`;
  } else {
    actionsHTML = `<a href="auth.html" class="btn btn-sm btn-secondary" data-i18n="nav.login">${t('nav.login')}</a>`;
  }

  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML = `
    <div class="container">
      <a href="index.html" class="nav-logo" aria-label="Pentexa Home" style="display: flex; align-items: center; gap: 10px;">
        <img src="logo.png" alt="Pentexa Logo" style="height: 100%; max-height: 100px; width: auto; object-fit: contain;">
      </a>
      <div class="nav-links" id="navLinks">${linksHTML}</div>
      <div class="nav-actions">
        <button class="btn btn-sm btn-secondary" id="langToggleBtn" onclick="toggleLang()" title="${langBtnTitle}" style="padding:8px 14px; min-width:42px; font-weight:700;">${langBtnText}</button>
        ${actionsHTML}
        <a href="services.html#quote" class="btn btn-sm btn-primary btn-glow" data-i18n="nav.bookAudit">${t('nav.bookAudit')}</a>
        <button class="hamburger" aria-label="Toggle menu" onclick="toggleMobileMenu()">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>`;
  document.body.prepend(nav);
}

function toggleLang() {
  const current = getLang();
  setLang(current === 'en' ? 'tr' : 'en');
}

// ---- Footer Injection ----
function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="nav-logo" style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;"><img src="logo.png" alt="Pentexa Logo" style="height: 100%; max-height: 240px; width: auto; object-fit: contain;"></a>
          <p data-i18n="footer.desc">${t('footer.desc')}</p>
        </div>
        <div class="footer-col">
          <h4 data-i18n="footer.product">${t('footer.product')}</h4>
          <a href="tools.html" data-i18n="footer.securityTools">${t('footer.securityTools')}</a>
          <a href="services.html" data-i18n="nav.services">${t('nav.services')}</a>
          <a href="services.html#quote" data-i18n="nav.contactSales">${t('nav.contactSales')}</a>
          <a href="blog.html" data-i18n="nav.blog">${t('nav.blog')}</a>
        </div>
        <div class="footer-col">
          <h4 data-i18n="footer.company">${t('footer.company')}</h4>
          <a href="about.html" data-i18n="footer.aboutUs">${t('footer.aboutUs')}</a>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" data-i18n="footer.careers">${t('footer.careers')}</a>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" data-i18n="footer.contact">${t('footer.contact')}</a>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" data-i18n="footer.partners">${t('footer.partners')}</a>
        </div>
        <div class="footer-col">
          <h4 data-i18n="footer.legal">${t('footer.legal')}</h4>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" data-i18n="footer.privacy">${t('footer.privacy')}</a>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" data-i18n="footer.terms">${t('footer.terms')}</a>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" data-i18n="footer.cookies">${t('footer.cookies')}</a>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" data-i18n="footer.gdpr">${t('footer.gdpr')}</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Pentexa.io — <span data-i18n="footer.rights">${t('footer.rights')}</span></p>
        <div class="footer-socials">
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" aria-label="Twitter">𝕏</a>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" aria-label="GitHub">GH</a>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" aria-label="LinkedIn">in</a>
          <a href="javascript:void(0)" onclick="showToast(t('footer.comingSoon'), 'info')" aria-label="Discord">DC</a>
        </div>
      </div>
    </div>`;
  document.body.appendChild(footer);
}

// ---- Toast System ----
function initToastContainer() {
  if (!document.getElementById('toastContainer')) {
    const c = document.createElement('div');
    c.className = 'toast-container';
    c.id = 'toastContainer';
    document.body.appendChild(c);
  }
}

function showToast(message, type = 'success') {
  initToastContainer();
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span><span>${sanitize(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---- Sanitization ----
function sanitize(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Navigation Helpers ----
function toggleMobileMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('show');
}

async function logout() {
  try {
    await apiRequest('/auth/logout', 'POST');
  } catch (e) { }
  localStorage.removeItem('pentexa_token');
  localStorage.removeItem('pentexa_session');
  showToast(t('auth.loggedOut') || 'Logged out successfully');
  setTimeout(() => location.href = 'index.html', 500);
}

// ---- Auth Guard ----
async function checkAuthStatus() {
  const token = localStorage.getItem('pentexa_token');
  if (!token) return null;
  try {
    const user = await apiRequest('/auth/me');
    localStorage.setItem('pentexa_session', JSON.stringify({ user }));
    return user;
  } catch (e) {
    localStorage.removeItem('pentexa_token');
    localStorage.removeItem('pentexa_session');
    return null;
  }
}

async function requireAuth() {
  const user = await checkAuthStatus();
  if (!user) {
    location.href = 'auth.html';
    return null;
  }
  return user;
}

async function requireAdmin() {
  const user = await requireAuth();
  if (user && (!user.role || user.role.name !== 'admin')) {
    location.href = 'index.html';
    return null;
  }
  return user;
}

// ---- Scrolled Navbar ----
function initScrollEffects() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ---- Click Outside Dropdown ----
function initDropdownClose() {
  document.addEventListener('click', (e) => {
    const dd = document.getElementById('userDropdown');
    if (dd && !e.target.closest('.nav-user')) dd.classList.remove('show');
  });
}

// ---- FAQ Accordion ----
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

// ---- Scroll Reveal (CSS-based fallback) ----
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => observer.observe(el));
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  initScrollEffects();
  initDropdownClose();
  initFAQ();
  initScrollReveal();
  try { if (typeof seedDefaultData === 'function') seedDefaultData(); } catch (e) { console.warn('seedDefaultData:', e); }
});
