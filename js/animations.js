/* ===== PENTEXA.IO — Animations ===== */

// ---- Particle Field ----
function initParticles(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const count = 80;

    function resize() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 0.5;
            this.alpha = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 200, ${this.alpha})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < count; i++) particles.push(new Particle());

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 255, 200, ${0.08 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        connectParticles();
        requestAnimationFrame(animate);
    }
    animate();
}

// ---- Animated Counter ----
function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.floor(current).toLocaleString() + suffix;
        }, 25);
    });
}

function initCounterObserver() {
    const statsSection = document.querySelector('.hero-stats');
    if (!statsSection) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    observer.observe(statsSection);
}

// ---- Terminal Typing ----
function initTerminal(containerId, commands) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const defaultCommands = [
        { prompt: '$ ', command: 'pentexa scan --target example.com', delay: 50 },
        { output: '[*] Initializing reconnaissance modules...', delay: 800 },
        { output: '[*] Running port scan on 93.184.216.34...', delay: 600 },
        { output: '[+] Found 3 open ports: 80, 443, 8080', delay: 400 },
        { output: '[*] Checking SSL/TLS configuration...', delay: 700 },
        { output: '[!] WARNING: TLS 1.0 enabled (deprecated)', delay: 300 },
        { output: '[*] Scanning for web vulnerabilities...', delay: 900 },
        { output: '[+] XSS vulnerability found in /search?q=', delay: 400 },
        { output: '[+] SQL injection potential in /api/users', delay: 500 },
        { output: '[*] Generating security report...', delay: 600 },
        { output: '[✓] Report saved: report_example_com.pdf', delay: 200 },
        { prompt: '$ ', command: '', delay: 0 }
    ];

    const cmds = commands || defaultCommands;
    let lineIndex = 0;
    let charIndex = 0;

    function typeNext() {
        if (lineIndex >= cmds.length) {
            // Add blinking cursor at end
            const cursor = document.createElement('span');
            cursor.className = 'terminal-cursor';
            container.appendChild(cursor);
            return;
        }

        const cmd = cmds[lineIndex];
        const lineEl = document.createElement('div');
        lineEl.className = 'terminal-line';

        if (cmd.prompt) {
            lineEl.innerHTML = `<span class="prompt">${cmd.prompt}</span><span class="command"></span>`;
            container.appendChild(lineEl);
            const cmdSpan = lineEl.querySelector('.command');
            charIndex = 0;

            function typeChar() {
                if (charIndex < cmd.command.length) {
                    cmdSpan.textContent += cmd.command[charIndex];
                    charIndex++;
                    setTimeout(typeChar, cmd.delay || 50);
                } else {
                    lineIndex++;
                    setTimeout(typeNext, 300);
                }
            }
            typeChar();
        } else if (cmd.output) {
            lineEl.innerHTML = `<span class="output">${cmd.output}</span>`;
            container.appendChild(lineEl);
            lineIndex++;
            setTimeout(typeNext, cmd.delay || 400);
        }
    }

    // Start after a short delay
    setTimeout(typeNext, 500);
}

// ---- Data Stream Background ----
function initDataStream(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = '01アイウエオカキクケコ<>/{}[]';
    const columns = Math.floor(canvas.width / 16);
    const drops = Array(columns).fill(0).map(() => Math.random() * canvas.height);

    function draw() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 255, 200, 0.08)';
        ctx.font = '12px JetBrains Mono, monospace';

        for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(char, i * 16, drops[i]);
            if (drops[i] > canvas.height && Math.random() > 0.98) {
                drops[i] = 0;
            }
            drops[i] += 14;
        }
        requestAnimationFrame(draw);
    }
    draw();
}

// ---- Interactive Scan Demo ----
function initScanDemo() {
    const startBtn = document.getElementById('startScan');
    if (!startBtn) return;

    startBtn.addEventListener('click', () => {
        const targetInput = document.getElementById('scanTarget');
        const target = targetInput ? targetInput.value.trim() || 'example.com' : 'example.com';
        const progressBar = document.getElementById('scanProgress');
        const terminalBody = document.getElementById('scanTerminal');
        const reportSection = document.getElementById('scanReport');

        if (progressBar) progressBar.style.width = '0%';
        if (terminalBody) terminalBody.innerHTML = '';
        if (reportSection) reportSection.style.display = 'none';
        startBtn.disabled = true;
        startBtn.textContent = 'Scanning...';

        const steps = [
            { msg: `[*] Target: ${sanitize(target)}`, pct: 5 },
            { msg: '[*] Resolving DNS...', pct: 10 },
            { msg: `[+] IP: ${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, pct: 15 },
            { msg: '[*] Running port scan (top 1000)...', pct: 25 },
            { msg: '[+] Open: 22/SSH, 80/HTTP, 443/HTTPS', pct: 35 },
            { msg: '[*] Fingerprinting services...', pct: 45 },
            { msg: '[+] nginx/1.24.0, OpenSSH 8.9p1', pct: 50 },
            { msg: '[*] Checking SSL/TLS...', pct: 60 },
            { msg: '[!] TLS 1.0 supported (weak)', pct: 65 },
            { msg: '[*] Scanning web vulnerabilities...', pct: 75 },
            { msg: '[!] Potential XSS in /search endpoint', pct: 80 },
            { msg: '[!] Missing CSP header', pct: 85 },
            { msg: '[*] Checking security headers...', pct: 90 },
            { msg: '[!] X-Frame-Options not set', pct: 92 },
            { msg: '[*] Compiling results...', pct: 97 },
            { msg: '[✓] Scan complete! 4 findings.', pct: 100 }
        ];

        let i = 0;
        function nextStep() {
            if (i >= steps.length) {
                startBtn.disabled = false;
                startBtn.textContent = 'Run Scan';
                if (reportSection) reportSection.style.display = 'block';
                return;
            }
            const step = steps[i];
            if (progressBar) progressBar.style.width = step.pct + '%';
            if (terminalBody) {
                const line = document.createElement('div');
                line.className = 'terminal-line';
                const color = step.msg.startsWith('[!]') ? 'color: #ff8c00' : step.msg.startsWith('[+]') ? 'color: #39ff14' : step.msg.startsWith('[✓]') ? 'color: #00ffc8' : '';
                line.innerHTML = `<span class="output" style="${color}">${step.msg}</span>`;
                terminalBody.appendChild(line);
                terminalBody.scrollTop = terminalBody.scrollHeight;
            }
            i++;
            setTimeout(nextStep, 300 + Math.random() * 500);
        }
        nextStep();
    });
}

// ---- Scroll Reveal with GSAP if available, else CSS ----
function initGSAPAnimations() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        gsap.utils.toArray('.reveal').forEach(el => {
            gsap.from(el, {
                y: 40,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            });
        });
    }
    // CSS fallback already handled in app.js initScrollReveal
}

// ---- Init All Animations ----
document.addEventListener('DOMContentLoaded', () => {
    initParticles('hero-canvas');
    initCounterObserver();
    initGSAPAnimations();
    initScanDemo();

    // Init terminal on homepage
    const termBody = document.getElementById('heroTerminal');
    if (termBody) initTerminal('heroTerminal');
});
