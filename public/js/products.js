/* ===== PENTEXA.IO — Products Module ===== */

const DEFAULT_PRODUCTS = [
    {
        id: 'tool_1', type: 'tool', name: 'ReconX Scanner', category: 'Recon',
        price: 0, shortDesc: 'Advanced reconnaissance and OSINT framework for deep target profiling.',
        features: ['Subdomain enumeration', 'DNS analysis', 'WHOIS lookup', 'Technology stack detection', 'Email harvesting'],
        badge: 'Free', updatedAt: '2026-01-15'
    },
    {
        id: 'tool_2', type: 'tool', name: 'WebVault Pro', category: 'Web Security',
        price: 49, shortDesc: 'Comprehensive web application vulnerability scanner with OWASP Top 10 coverage.',
        features: ['SQL injection testing', 'XSS detection', 'CSRF analysis', 'Authentication bypass', 'API security testing'],
        badge: 'Popular', updatedAt: '2026-02-01'
    },
    {
        id: 'tool_3', type: 'tool', name: 'NetShield Analyzer', category: 'Network Security',
        price: 79, shortDesc: 'Network infrastructure security assessment and continuous monitoring.',
        features: ['Port scanning', 'Service fingerprinting', 'Firewall testing', 'IDS/IPS evasion', 'Network topology mapping'],
        badge: 'Pro', updatedAt: '2026-01-28'
    },
    {
        id: 'tool_4', type: 'tool', name: 'AutoPentest Suite', category: 'Automation',
        price: 99, shortDesc: 'Automated penetration testing pipeline for CI/CD security integration.',
        features: ['Scheduled scans', 'CI/CD plugins', 'Custom rulesets', 'Slack/Teams alerts', 'Compliance reporting'],
        badge: 'Enterprise', updatedAt: '2026-02-10'
    },
    {
        id: 'tool_5', type: 'tool', name: 'CryptoGuard', category: 'Web Security',
        price: 29, shortDesc: 'SSL/TLS configuration analyzer and cryptographic weakness detector.',
        features: ['Certificate analysis', 'Protocol testing', 'Cipher suite audit', 'HSTS checking', 'Mixed content detection'],
        badge: 'New', updatedAt: '2026-02-18'
    },
    {
        id: 'tool_6', type: 'tool', name: 'PhishNet Detector', category: 'Recon',
        price: 0, shortDesc: 'AI-powered phishing campaign detection and brand impersonation tracking.',
        features: ['Domain monitoring', 'Lookalike detection', 'Email header analysis', 'URL reputation check', 'Real-time alerts'],
        badge: 'Free', updatedAt: '2026-01-20'
    },
    {
        id: 'tool_7', type: 'tool', name: 'CloudAudit360', category: 'Network Security',
        price: 129, shortDesc: 'Cloud infrastructure security posture management for AWS, Azure, GCP.',
        features: ['IAM analysis', 'S3 bucket auditing', 'Security group review', 'Compliance mapping', 'Cost optimization'],
        badge: 'Enterprise', updatedAt: '2026-02-05'
    },
    {
        id: 'tool_8', type: 'tool', name: 'BotForge', category: 'Automation',
        price: 59, shortDesc: 'Security automation workflows and custom bot builder for repetitive tasks.',
        features: ['Visual workflow builder', 'API integrations', 'Conditional logic', 'Report generation', 'Team collaboration'],
        badge: 'Popular', updatedAt: '2026-02-12'
    },
    {
        id: 'svc_1', type: 'service', name: 'Security Audit — Starter', category: 'Audit',
        price: 499, shortDesc: 'Basic security assessment for small businesses and startups.',
        features: ['External vulnerability scan', 'OWASP Top 10 check', 'Executive summary report', '1 re-test included', 'Email support'],
        badge: 'Starter', updatedAt: '2026-01-01'
    },
    {
        id: 'svc_2', type: 'service', name: 'Security Audit — Pro', category: 'Audit',
        price: 1999, shortDesc: 'Comprehensive penetration test with manual testing and detailed reporting.',
        features: ['Full penetration test', 'Source code review', 'API security assessment', 'Detailed technical report', 'Remediation guidance', '3 re-tests included', 'Priority support'],
        badge: 'Pro', updatedAt: '2026-01-01'
    },
    {
        id: 'svc_3', type: 'service', name: 'Security Audit — Enterprise', category: 'Audit',
        price: 4999, shortDesc: 'Enterprise-grade security program with continuous monitoring and red team exercises.',
        features: ['Red team assessment', 'Social engineering tests', 'Physical security review', 'Compliance mapping (SOC2/ISO)', 'Custom security training', 'Dedicated account manager', '24/7 incident response', 'Unlimited re-tests'],
        badge: 'Enterprise', updatedAt: '2026-01-01'
    }
];

function seedDefaultData() {
    if (!localStorage.getItem('pentexa_products')) {
        localStorage.setItem('pentexa_products', JSON.stringify(DEFAULT_PRODUCTS));
    }
}

function getProducts() {
    return JSON.parse(localStorage.getItem('pentexa_products')) || [];
}

function getTools() {
    return getProducts().filter(p => p.type === 'tool');
}

function getServices() {
    return getProducts().filter(p => p.type === 'service');
}

function getProductById(id) {
    return getProducts().find(p => p.id === id);
}

function saveProduct(product) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
        products[idx] = { ...products[idx], ...product, updatedAt: new Date().toISOString().split('T')[0] };
    } else {
        product.id = product.type + '_' + Date.now();
        product.updatedAt = new Date().toISOString().split('T')[0];
        products.push(product);
    }
    localStorage.setItem('pentexa_products', JSON.stringify(products));
    return product;
}

function deleteProduct(id) {
    const products = getProducts().filter(p => p.id !== id);
    localStorage.setItem('pentexa_products', JSON.stringify(products));
}

// ---- Render Tool Cards ----
function renderToolCards(containerId, categoryFilter = 'all', limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const tools = getTools();
    let filtered = categoryFilter === 'all'
        ? tools
        : tools.filter(t => t.category.toLowerCase().includes(categoryFilter.toLowerCase()));

    if (limit) {
        filtered = filtered.slice(0, limit);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted); grid-column: 1/-1; padding: 60px 0;" data-i18n="tools.noResults">' + t('tools.noTools', 'No tools found in this category.') + '</p>';
        return;
    }

    container.innerHTML = filtered.map(tool => `
    <div class="card reveal" data-id="${tool.id}">
      <span class="card-badge">${sanitize(t(`prod_${tool.id}_badge`, tool.badge))}</span>
      <div class="card-icon">${getCategoryIcon(tool.category)}</div>
      <h3>${sanitize(t(`prod_${tool.id}_name`, tool.name))}</h3>
      <p>${sanitize(t(`prod_${tool.id}_desc`, tool.shortDesc))}</p>
      <div class="card-tags">
        <span>${sanitize(t(`cat_${tool.category.toLowerCase().replace(' ', '_')}`, tool.category))}</span>
        <span>${t('nav.contactSales', 'Contact Sales')}</span>
      </div>
      <button class="btn btn-secondary btn-sm" style="margin-top:16px; width:100%;" onclick="openToolModal('${tool.id}')">${t('tools.learnMore', 'Learn More')}</button>
    </div>
  `).join('');

    initScrollReveal();
}

window.reRenderProducts = function () {
    if (document.getElementById('homeToolsGrid')) {
        renderToolCards('homeToolsGrid', 'all', 4);
    }
    if (document.getElementById('toolsGrid')) {
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const filter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
        renderToolCards('toolsGrid', filter);
    }
    if (document.getElementById('homeServicesGrid')) {
        renderServiceCards('homeServicesGrid');
    }
    if (document.getElementById('servicesGrid')) {
        renderServiceCards('servicesGrid');
    }
};

// ---- Render Service Cards ----
function renderServiceCards(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const services = getServices();

    container.innerHTML = services.map((svc, i) => `
    <div class="card pricing-card ${i === 1 ? 'featured' : ''} reveal">
      <span class="card-badge">${sanitize(t(`prod_${svc.id}_badge`, svc.badge))}</span>
      <h3>${sanitize(t(`prod_${svc.id}_name`, svc.name))}</h3>
      <p>${sanitize(t(`prod_${svc.id}_desc`, svc.shortDesc))}</p>
      <div class="price" style="font-size: 1.5rem; color: var(--cyan);">
        ${t('nav.contactSales', 'Contact Sales')}
      </div>
      <ul class="features-list">
        ${svc.features.map((f, j) => `<li>${sanitize(t(`prod_${svc.id}_f${j}`, f))}</li>`).join('')}
      </ul>
      <a href="services.html#quote" class="btn btn-primary" style="width:100%;">${t('quote.requestQuote', 'Request Quote')}</a>
    </div>
  `).join('');

    initScrollReveal();
}

// ---- Tool Modal ----
function openToolModal(id) {
    const tool = getProductById(id);
    if (!tool) {
        showToast('Product not found', 'error');
        return;
    }

    let overlay = document.getElementById('toolModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'toolModal';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" onclick="closeModal('toolModal')" aria-label="Close">&times;</button>
      <span class="card-badge">${sanitize(t(`prod_${tool.id}_badge`, tool.badge))}</span>
      <h2 style="margin: 16px 0 8px;">${sanitize(t(`prod_${tool.id}_name`, tool.name))}</h2>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">${sanitize(t(`prod_${tool.id}_desc`, tool.shortDesc))}</p>
      <div style="margin-bottom: 20px;">
        <strong style="color: var(--cyan); font-size: 1.5rem;">${t('nav.contactSales', 'Contact Sales')}</strong>
      </div>
      <h4 style="margin-bottom: 12px;">${t('tools.features', 'Features')}</h4>
      <ul class="features-list">
        ${tool.features.map((f, i) => `<li>${sanitize(t(`prod_${tool.id}_f${i}`, f))}</li>`).join('')}
      </ul>
      <div style="margin-top: 24px; display: flex; gap: 12px;">
        <a href="services.html#quote" class="btn btn-primary">${t('tools.getStarted', 'Get Started')}</a>
        <button class="btn btn-secondary" onclick="closeModal('toolModal')">${t('close', 'Close')}</button>
      </div>
    </div>`;

    requestAnimationFrame(() => overlay.classList.add('show'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal('toolModal'); });
}

function closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function getCategoryIcon(cat) {
    const icons = {
        'Recon': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
        'Web Security': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
        'Network Security': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
        'Automation': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
        'Audit': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    };
    return icons[cat] || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>`;
}

// ---- Filter Init ----
function initToolFilters(containerId) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderToolCards(containerId, btn.dataset.filter);
        });
    });
}

// ---- Admin CRUD ----
function renderAdminProducts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const products = getProducts();

    container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Name</th><th>Type</th><th>Category</th><th>Price</th><th>Badge</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td>${sanitize(p.name)}</td>
            <td>${p.type}</td>
            <td>${sanitize(p.category)}</td>
            <td>$${p.price}</td>
            <td><span class="card-badge">${sanitize(p.badge)}</span></td>
            <td class="actions">
              <button class="btn-edit" onclick="editProduct('${p.id}')">Edit</button>
              <button class="btn-delete" onclick="removeProduct('${p.id}')">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function editProduct(id) {
    const product = getProductById(id);
    if (!product) return;
    document.getElementById('prodId').value = product.id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodType').value = product.type;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodBadge').value = product.badge;
    document.getElementById('prodDesc').value = product.shortDesc;
    document.getElementById('prodFeatures').value = product.features.join('\n');
    document.getElementById('adminFormTitle').textContent = 'Edit Product';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function removeProduct(id) {
    if (confirm('Delete this product?')) {
        deleteProduct(id);
        renderAdminProducts('adminTableWrapper');
        showToast('Product deleted');
    }
}

function initAdminForm() {
    const form = document.getElementById('adminProductForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('prodId').value;
        const product = {
            id: id || undefined,
            name: document.getElementById('prodName').value.trim(),
            type: document.getElementById('prodType').value,
            category: document.getElementById('prodCategory').value.trim(),
            price: parseFloat(document.getElementById('prodPrice').value) || 0,
            badge: document.getElementById('prodBadge').value.trim(),
            shortDesc: document.getElementById('prodDesc').value.trim(),
            features: document.getElementById('prodFeatures').value.split('\n').map(f => f.trim()).filter(Boolean)
        };

        if (!product.name || !product.category) {
            showToast('Name and Category are required', 'error');
            return;
        }

        saveProduct(product);
        renderAdminProducts('adminTableWrapper');
        form.reset();
        document.getElementById('prodId').value = '';
        document.getElementById('adminFormTitle').textContent = 'Add Product';
        showToast(id ? 'Product updated!' : 'Product added!');
    });
}

// ---- Pricing Toggle ----
function initPricingToggle() {
    const toggle = document.getElementById('pricingToggle');
    if (!toggle) return;
    const monthlyLabel = document.getElementById('monthlyLabel');
    const yearlyLabel = document.getElementById('yearlyLabel');

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        const isYearly = toggle.classList.contains('active');
        monthlyLabel.classList.toggle('active', !isYearly);
        yearlyLabel.classList.toggle('active', isYearly);

        document.querySelectorAll('[data-monthly]').forEach(el => {
            const monthly = parseFloat(el.dataset.monthly);
            const yearly = parseFloat(el.dataset.yearly);
            el.textContent = isYearly ? yearly.toLocaleString() : monthly.toLocaleString();
        });

        document.querySelectorAll('.price .period').forEach(el => {
            el.textContent = isYearly ? '/year' : '/month';
        });
    });
}
