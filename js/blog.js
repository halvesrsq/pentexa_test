/* ===== PENTEXA.IO — Blog Module ===== */

const BLOG_POSTS = [
  {
    id: 'post-1',
    title: 'Top 10 OWASP Vulnerabilities in 2026: What You Need to Know',
    excerpt: 'The OWASP Top 10 has been updated for 2026. Here\'s a deep dive into the most critical web application security risks and how to mitigate them.',
    author: 'Ahmet K.',
    date: '2026-02-15',
    category: 'Web Security',
    readTime: '8 min',
    image: 'img/blog_owasp.png',
    content: `<h2>Introduction</h2><p>The Open Web Application Security Project (OWASP) has released its updated Top 10 list for 2026, reflecting the evolving threat landscape. In this article, we break down each vulnerability and provide actionable remediation advice.</p><h2>1. Broken Access Control</h2><p>Access control enforces policy such that users cannot act outside their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of data. Always implement proper role-based access control (RBAC) and test authorization boundaries thoroughly.</p><h2>2. Cryptographic Failures</h2><p>Previously known as "Sensitive Data Exposure," this category focuses on failures related to cryptography which often lead to exposure of sensitive data. Ensure you're using strong, up-to-date encryption algorithms and proper key management practices.</p><h2>3. Injection Attacks</h2><p>SQL injection, NoSQL injection, OS command injection, and LDAP injection remain prevalent. Use parameterized queries, input validation, and prepared statements to protect against injection attacks.</p><h2>Key Takeaways</h2><p>Regular security assessments and staying updated with the latest vulnerability databases are essential. Consider implementing automated security scanning in your CI/CD pipeline for continuous protection.</p>`
  },
  {
    id: 'post-2',
    title: 'Building a Zero Trust Architecture: A Practical Guide',
    excerpt: 'Zero Trust is more than a buzzword. Learn how to implement a practical Zero Trust architecture for your organization step by step.',
    author: 'Elena R.',
    date: '2026-02-10',
    category: 'Architecture',
    readTime: '12 min',
    image: 'img/blog_zerotrust.png',
    content: `<h2>What is Zero Trust?</h2><p>Zero Trust is a security framework requiring all users, whether inside or outside the organization's network, to be authenticated, authorized, and continuously validated for security configuration before being granted access to applications and data.</p><h2>Core Principles</h2><p>The fundamental principle is "never trust, always verify." This means every access request is treated as if it originates from an untrusted network. Key pillars include identity verification, device validation, micro-segmentation, and least privilege access.</p><h2>Implementation Steps</h2><p>Start by mapping your protect surface — the critical data, assets, applications, and services (DAAS) most valuable to your organization. Then map transaction flows, architect a Zero Trust network, create Zero Trust policies, and monitor the environment.</p><h2>Tools and Technologies</h2><p>Implement multi-factor authentication (MFA), endpoint detection and response (EDR), identity governance, and software-defined perimeters. Cloud-native solutions from major providers can accelerate your Zero Trust journey.</p>`
  },
  {
    id: 'post-3',
    title: 'Automated Penetration Testing: Friend or Foe?',
    excerpt: 'As AI-powered security tools become mainstream, we examine the role of automated pentesting and how it complements manual testing.',
    author: 'Mehmet D.',
    date: '2026-02-05',
    category: 'Penetration Testing',
    readTime: '6 min',
    image: 'img/blog_pentest.png',
    content: `<h2>The Rise of Automation</h2><p>Automated penetration testing tools have matured significantly. Modern solutions can identify common vulnerabilities quickly and consistently, making them valuable for continuous security assessment.</p><h2>Strengths of Automation</h2><p>Automated tools excel at scanning large attack surfaces, identifying known vulnerabilities, checking configurations, and providing repeatable results. They're perfect for regression testing and CI/CD integration.</p><h2>Where Manual Testing Wins</h2><p>Human pentesters bring creativity, context awareness, and the ability to chain vulnerabilities in ways automated tools cannot. Business logic flaws, complex authentication bypasses, and social engineering assessments still require human expertise.</p><h2>The Best Approach</h2><p>The ideal security program combines both approaches. Use automated tools for broad coverage and continuous monitoring, while reserving manual penetration testing for deep-dive assessments and complex application testing.</p>`
  },
  {
    id: 'post-4',
    title: 'Cloud Security in 2026: Emerging Threats and Best Practices',
    excerpt: 'With cloud adoption at an all-time high, understanding the latest threats and protective measures is critical for every organization.',
    author: 'Ayşe T.',
    date: '2026-01-28',
    category: 'Cloud Security',
    readTime: '10 min',
    image: 'img/blog_cloud.png',
    content: `<h2>The Cloud Threat Landscape</h2><p>As organizations accelerate their cloud migrations, attackers are following. Misconfigurations, insecure APIs, and identity management failures are the leading cause of cloud breaches in 2026.</p><h2>Top Threats</h2><p>Key threats include misconfigured cloud storage buckets, overly permissive IAM roles, insecure serverless functions, container escape vulnerabilities, and supply chain attacks through compromised cloud dependencies.</p><h2>Best Practices</h2><p>Implement Cloud Security Posture Management (CSPM), use infrastructure-as-code with security guardrails, enforce least privilege access, enable comprehensive logging, and conduct regular cloud-specific penetration tests.</p><h2>Looking Ahead</h2><p>The future of cloud security lies in AI-driven anomaly detection, confidential computing, and automated remediation workflows that can respond to threats in real-time.</p>`
  },
  {
    id: 'post-5',
    title: 'API Security: The Hidden Attack Surface',
    excerpt: 'APIs are the backbone of modern applications. Learn about common API vulnerabilities and how to secure them effectively.',
    author: 'Ahmet K.',
    date: '2026-01-20',
    category: 'Web Security',
    readTime: '7 min',
    image: 'img/blog_api.png',
    content: `<h2>Why APIs are Vulnerable</h2><p>APIs expose application logic and sensitive data directly, making them attractive targets. The rapid growth of API-first architectures has outpaced security practices, creating a significant attack surface.</p><h2>Common API Vulnerabilities</h2><p>The most critical API security risks include: Broken Object Level Authorization (BOLA), broken authentication, excessive data exposure, lack of rate limiting, and mass assignment vulnerabilities.</p><h2>Securing Your APIs</h2><p>Implement strong authentication (OAuth 2.0 + JWT), input validation, rate limiting, proper error handling, and comprehensive logging. Use API gateways and regularly test your APIs with specialized security tools.</p>`
  },
  {
    id: 'post-6',
    title: 'Incident Response Playbook: From Detection to Recovery',
    excerpt: 'When a breach occurs, every second counts. Here\'s a comprehensive incident response playbook to minimize damage and accelerate recovery.',
    author: 'Elena R.',
    date: '2026-01-15',
    category: 'Incident Response',
    readTime: '15 min',
    image: 'img/blog_incident.png',
    content: `<h2>Preparation is Key</h2><p>An effective incident response starts long before a breach occurs. Establish an incident response team, create communication plans, document your network architecture, and conduct regular tabletop exercises.</p><h2>Detection and Analysis</h2><p>Implement robust monitoring and alerting. When an incident is detected, quickly determine its scope, severity, and potential impact. Preserve evidence and establish a timeline of events.</p><h2>Containment and Eradication</h2><p>Isolate affected systems, remove the attacker's access, patch vulnerabilities, and eliminate any persistence mechanisms. Document all actions taken during this phase.</p><h2>Recovery and Lessons Learned</h2><p>Restore systems from clean backups, verify system integrity, and gradually return to normal operations. Conduct a thorough post-incident review to improve your defenses and response procedures.</p>`
  }
];

function renderBlogList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = BLOG_POSTS.map(post => `
    <a href="post.html?id=${post.id}" class="card blog-card reveal">
      <div class="blog-img" style="display:flex; align-items:center; justify-content:center; background:var(--bg-card); border-bottom:1px solid var(--border-glass); overflow: hidden; height: 160px; padding: 0;">
        <img src="${post.image}" style="width: 100%; height: 100%; object-fit: cover; opacity: 1; filter: none;" alt="${sanitize(post.title)}">
      </div>
      <div class="blog-meta">
        <span>${post.date}</span>
        <span>${post.readTime}</span>
        <span>${sanitize(post.category)}</span>
      </div>
      <h3>${sanitize(post.title)}</h3>
      <p>${sanitize(post.excerpt)}</p>
    </a>
  `).join('');

  initScrollReveal();
}

function renderBlogPost() {
  const container = document.getElementById('postContent');
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const postId = params.get('id');
  const post = BLOG_POSTS.find(p => p.id === postId);

  if (!post) {
    container.innerHTML = `
      <div class="post-header" style="text-align:center; padding: 80px 0;">
        <h1 data-i18n="blog.notFound">${t('blog.notFound')}</h1>
        <p data-i18n="blog.notFoundDesc" style="color: var(--text-secondary); margin-top: 16px;">${t('blog.notFoundDesc')}</p>
        <a href="blog.html" class="btn btn-primary" style="margin-top: 24px;" data-i18n="blog.backToBlog">${t('blog.backToBlog')}</a>
      </div>`;
    return;
  }

  document.title = post.title + ' — Pentexa Blog';

  container.innerHTML = `
    <div class="post-header">
      <div class="blog-meta" style="display:flex; gap:16px; margin-bottom:16px; font-size:0.9rem; color: var(--text-muted);">
        <span><span data-i18n="blog.by">${t('blog.by')}</span> ${sanitize(post.author)}</span>
        <span>${post.date}</span>
        <span>${post.readTime} <span data-i18n="blog.read">${t('blog.read')}</span></span>
        <span class="card-badge">${sanitize(post.category)}</span>
      </div>
      <h1>${sanitize(post.title)}</h1>
    </div>
    <div style="width: 100%; height: 320px; border-radius: 12px; overflow: hidden; margin-bottom: 32px; border: 1px solid var(--border-glass);">
        <img src="${post.image}" style="width: 100%; height: 100%; object-fit: cover;" alt="${sanitize(post.title)}">
    </div>
    <div class="post-body">${post.content}</div>
    <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border-glass);">
      <a href="blog.html" class="btn btn-secondary">← <span data-i18n="blog.backToBlog">${t('blog.backToBlog')}</span></a>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderBlogList('blogGrid');
  renderBlogPost();
});
