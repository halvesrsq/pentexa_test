/* ===== PENTEXA.IO — Auth Module ===== */

function initAuth() {
    window._authInitialized = true;

    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (!loginTab) return;

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    // Switch links below forms
    const switchToRegLink = document.getElementById('switchToRegister');
    const switchToLoginLink = document.getElementById('switchToLogin');
    if (switchToRegLink) {
        switchToRegLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerTab.click();
        });
    }
    if (switchToLoginLink) {
        switchToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginTab.click();
        });
    }

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm.querySelector('#loginEmail').value.trim();
        const identifier = email || 'unknown';
        if (!checkRateLimit('login', identifier)) return;

        clearErrors(loginForm);
        const password = loginForm.querySelector('#loginPassword').value;

        let valid = true;
        if (!email || !isValidEmail(email)) {
            setError(loginForm.querySelector('#loginEmail'), 'Valid email required');
            valid = false;
        }
        if (!password) {
            setError(loginForm.querySelector('#loginPassword'), 'Password required');
            valid = false;
        }
        if (!valid) return;

        const btn = loginForm.querySelector('button[type="submit"]');
        const origText = btn.innerHTML;
        btn.innerHTML = '⏳ Processing...';
        btn.disabled = true;

        try {
            // FastAPI expects OAuth2PasswordRequestForm data for login
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const tokenData = await apiRequest('/auth/login', 'POST', formData, true);
            localStorage.setItem('pentexa_token', tokenData.access_token);

            // Fetch user profile to cache in session
            const user = await apiRequest('/auth/me');
            localStorage.setItem('pentexa_session', JSON.stringify({ user }));

            resetRateLimit('login', identifier);
            const displayName = user.full_name || user.email;
            showToast((t('auth.welcomeBack') || 'Welcome back, ') + displayName + '!');
            setTimeout(() => window.location.href = 'dashboard.html', 800);
        } catch (err) {
            const isLocked = incrementRateLimit('login', identifier);
            let msg = t('auth.invalidCredentials') || 'Invalid email or password';
            try { msg = JSON.parse(err.message).detail || msg; } catch (e) { }
            if (!isLocked) showToast(msg, 'error');
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    });

    // Register
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = registerForm.querySelector('#regEmail').value.trim();
        const identifier = email || 'unknown';
        if (!checkRateLimit('register', identifier)) return;

        clearErrors(registerForm);
        const name = registerForm.querySelector('#regName').value.trim();
        const password = registerForm.querySelector('#regPassword').value;
        const confirm = registerForm.querySelector('#regConfirm').value;

        let valid = true;
        if (!name || name.length < 2) {
            setError(registerForm.querySelector('#regName'), 'Name required (min 2 chars)');
            valid = false;
        }
        if (!email || !isValidEmail(email)) {
            setError(registerForm.querySelector('#regEmail'), 'Valid email required');
            valid = false;
        }
        if (!password || password.length < 8) {
            setError(registerForm.querySelector('#regPassword'), 'Min 8 characters');
            valid = false;
        }
        if (password !== confirm) {
            setError(registerForm.querySelector('#regConfirm'), 'Passwords do not match');
            valid = false;
        }
        if (!valid) return;

        const btn = registerForm.querySelector('button[type="submit"]');
        const origText = btn.innerHTML;
        btn.innerHTML = '⏳ Processing...';
        btn.disabled = true;

        try {
            // Register
            const newUser = await apiRequest('/auth/register', 'POST', {
                email: email,
                password: password,
                full_name: sanitize(name)
            });

            // Auto-login after register
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            const tokenData = await apiRequest('/auth/login', 'POST', formData, true);
            localStorage.setItem('pentexa_token', tokenData.access_token);

            // Cache user
            const user = await apiRequest('/auth/me');
            localStorage.setItem('pentexa_session', JSON.stringify({ user }));

            resetRateLimit('register', identifier);
            const displayName = user.full_name || user.email;
            showToast((t('auth.accountCreated') || 'Account created! Welcome, ') + displayName);
            setTimeout(() => window.location.href = 'dashboard.html', 800);
        } catch (err) {
            const isLocked = incrementRateLimit('register', identifier);
            let msg = t('auth.emailExists') || 'Email already exists';
            try { msg = JSON.parse(err.message).detail || msg; } catch (e) { }
            if (!isLocked) showToast(msg, 'error');
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    });

    // Password strength
    const pwInput = registerForm.querySelector('#regPassword');
    const strengthBar = document.getElementById('strengthBar');
    if (pwInput && strengthBar) {
        pwInput.addEventListener('input', () => {
            const val = pwInput.value;
            let score = 0;
            if (val.length >= 6) score++;
            if (val.length >= 10) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;
            const pct = (score / 5) * 100;
            strengthBar.style.width = pct + '%';
            strengthBar.style.background =
                score <= 1 ? '#ff3366' :
                    score <= 3 ? '#ff8c00' : '#39ff14';
        });
    }

    // Check if tab param
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'register') {
        registerTab.click();
    }
}

// ---- Forgot Password Flow ----
function showForgotPassword() {
    document.getElementById('forgotModal').classList.add('show');
}

function closeForgotPassword() {
    document.getElementById('forgotModal').classList.remove('show');
    const form = document.getElementById('forgotForm');
    if (form) {
        form.reset();
        clearErrors(form);
    }
}

function handleForgotPw(e) {
    e.preventDefault();
    const form = document.getElementById('forgotForm');
    clearErrors(form);

    const emailInput = form.querySelector('#forgotEmail');
    const email = emailInput.value.trim();

    if (!email || !isValidEmail(email)) {
        setError(emailInput, 'Please enter a valid email address');
        return;
    }

    const btn = form.querySelector('#forgotBtn');
    btn.innerHTML = '<span style="display:inline-block; animation: spin 1s linear infinite;">⏳</span> Sending...';
    btn.disabled = true;

    // Ensure spin keyframes exist dynamically if not present
    if (!document.getElementById('spinKeyframes')) {
        const style = document.createElement('style');
        style.id = 'spinKeyframes';
        style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    setTimeout(() => {
        // We simulate sending an email regardless of whether the account exists 
        // to prevent email enumeration attacks.
        showToast('If the email is registered, a reset link will be sent.', 'success');
        closeForgotPassword();

        btn.innerHTML = '<span data-i18n="auth.sendReset">Send Reset Link</span>';
        btn.disabled = false;

        // Re-apply translations if needed
        if (typeof t === 'function') {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key === 'auth.sendReset') el.textContent = t(key);
            });
        }
    }, 1500);
}

// Expose these for inline HTML handlers
window.showForgotPassword = showForgotPassword;
window.closeForgotPassword = closeForgotPassword;
window.handleForgotPw = handleForgotPw;

// ---- Helpers ----
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setError(input, msg) {
    input.classList.add('error');
    let errEl = input.nextElementSibling;
    if (!errEl || !errEl.classList.contains('form-error')) {
        errEl = document.createElement('div');
        errEl.className = 'form-error';
        input.parentNode.insertBefore(errEl, input.nextSibling);
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
}

function clearErrors(form) {
    form.querySelectorAll('.form-input').forEach(i => i.classList.remove('error'));
    form.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
}

// ---- Rate Limiting ----
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(action, identifier) {
    const safeId = identifier ? identifier.replace(/[^a-zA-Z0-9@.-_]/g, '') : 'unknown';
    const key = `pentexa_${action}_${safeId}_attempts`;
    let data = JSON.parse(localStorage.getItem(key));
    if (!data) return true;

    if (data.lockedUntil && Date.now() < data.lockedUntil) {
        const remainingTime = Math.ceil((data.lockedUntil - Date.now()) / 60000);
        const msg = (t('auth.rateLimitExceeded') || 'Too many attempts. Please try again in {mins} minute(s).').replace('{mins}', remainingTime);
        showToast(msg, 'error');
        return false;
    }

    if (data.lockedUntil && Date.now() > data.lockedUntil) {
        localStorage.removeItem(key);
    }

    return true;
}

function incrementRateLimit(action, identifier) {
    const safeId = identifier ? identifier.replace(/[^a-zA-Z0-9@.-_]/g, '') : 'unknown';
    const key = `pentexa_${action}_${safeId}_attempts`;
    let data = JSON.parse(localStorage.getItem(key)) || { count: 0 };

    if (data.lockedUntil && Date.now() > data.lockedUntil) {
        data = { count: 0 };
    }

    data.count += 1;

    if (data.count >= MAX_ATTEMPTS) {
        data.lockedUntil = Date.now() + LOCKOUT_DURATION;
        const remainingTime = Math.ceil(LOCKOUT_DURATION / 60000);
        const msg = (t('auth.accountLocked') || 'Maximum attempts reached. Locked for {mins} minutes.').replace('{mins}', remainingTime);
        showToast(msg, 'error');
        localStorage.setItem(key, JSON.stringify(data));
        return true; // is locked
    }

    localStorage.setItem(key, JSON.stringify(data));
    return false;
}

function resetRateLimit(action, identifier) {
    const safeId = identifier ? identifier.replace(/[^a-zA-Z0-9@.-_]/g, '') : 'unknown';
    localStorage.removeItem(`pentexa_${action}_${safeId}_attempts`);
}

document.addEventListener('DOMContentLoaded', initAuth);
