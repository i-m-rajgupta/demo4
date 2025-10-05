// ---- Elements ----
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal'); // optional
const closeLogin = document.getElementById('closeLogin'); // optional
const loginForm = document.getElementById('loginForm'); // optional
const loginMsg = document.getElementById('loginMsg'); // optional
const userInfo = document.getElementById('userInfo');
const usernameLabel = document.getElementById('usernameLabel');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardLink = document.getElementById('dashboardLink');
const panicBtn = document.getElementById('panicBtn');
const registerButtons = document.querySelectorAll('.btn.register');

// ---- Token helpers ----
function saveToken(token) { localStorage.setItem('cw_token', token); }
function getToken() { return localStorage.getItem('cw_token'); }
function clearToken() { localStorage.removeItem('cw_token'); }

function parseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(payload).split('').map(c => '%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch { return null; }
}

// ---- Login / Modal behavior ----
function openLogin() {
  if (loginModal) {
    loginModal.style.display = 'block';
    loginModal.setAttribute('aria-hidden', 'false');
    if (loginMsg) loginMsg.textContent = '';
    const idInput = document.getElementById('loginId');
    if (idInput) idInput.focus();
  } else {
    window.location.href = '/api/login';
  }
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.style.display = 'none';
  loginModal.setAttribute('aria-hidden', 'true');
  if (loginForm) loginForm.reset();
  if (loginMsg) loginMsg.textContent = '';
}

// ---- Auth fetch ----
async function authFetch(url, opts = {}) {
  const token = getToken();
  const headers = Object.assign({}, opts.headers || {});
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return await fetch(url, Object.assign({}, opts, { headers }));
}

// ---- Login / Logout ----
async function login(credentials) {
  if (loginMsg) { loginMsg.textContent = 'Signing in...'; loginMsg.style.color = ''; }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (loginMsg) { loginMsg.style.color = '#c53030'; loginMsg.textContent = body.error || 'Login failed'; }
      return false;
    }
    if (body.token) {
      saveToken(body.token);
      if (loginMsg) { loginMsg.style.color = '#15803d'; loginMsg.textContent = 'Signed in!'; }
      await updateAuthUI();
      if (loginModal) setTimeout(closeLoginModal, 500);
      return true;
    } else {
      if (loginMsg) { loginMsg.style.color = '#c53030'; loginMsg.textContent = 'Login failed (no token)'; }
      return false;
    }
  } catch (err) {
    console.error('Login error', err);
    if (loginMsg) { loginMsg.style.color = '#c53030'; loginMsg.textContent = 'Network error'; }
    return false;
  }
}

async function logout() {
  clearToken();
  await updateAuthUI();
  window.location.href = '/api';
}

// ---- Login form submit ----
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const loginId = document.getElementById('loginId').value.trim();
    const loginPassword = document.getElementById('loginPassword').value;
    if (!loginId || !loginPassword) {
      if (loginMsg) { loginMsg.style.color = '#c53030'; loginMsg.textContent = 'Please enter credentials'; }
      return;
    }
    await login({ email: loginId, password: loginPassword });
  });
}

// ---- Update Auth UI ----
async function updateAuthUI() {
  const token = getToken();
  if (token) {
    let name = 'You', role = null;
    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.user) { name = body.user.name || body.user.username || body.user.email || name; role = body.user.role || role; }
        else if (body.counsellor) { name = body.counsellor.name || name; role = 'counsellor'; }
      } else {
        const payload = parseJwt(token);
        if (payload) { name = payload.name || payload.email || payload.username || name; role = payload.role || role; }
      }
    } catch {
      const payload = parseJwt(token);
      if (payload) { name = payload.name || payload.email || payload.username || name; role = payload.role || role; }
    }
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'inline-flex';
    if (usernameLabel) usernameLabel.textContent = name;
    if (dashboardLink) {
      dashboardLink.href = role === 'counsellor' ? '/api/counsellor/dashboard' : '/api/user/dashboard';
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (userInfo) userInfo.style.display = 'none';
    if (usernameLabel) usernameLabel.textContent = '';
    if (dashboardLink) dashboardLink.href = '/api/user/dashboard';
  }
}

// ---- Animate cards, counsellors, and buttons on load ----
function animateElements() {
  const items = document.querySelectorAll('.card, .slide, .btn.register, .panic-btn');
  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    setTimeout(() => {
      el.style.transition = 'all 0.8s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * 100);
  });
}

// ---- Panic button click ----
if (panicBtn) {
  panicBtn.addEventListener('click', () => {
    alert("Panic button activated! Take deep breaths and call your emergency contact.");
  });
}

// ---- Event wiring ----
if (loginBtn) loginBtn.addEventListener('click', openLogin);
if (closeLogin) closeLogin.addEventListener('click', closeLoginModal);
if (logoutBtn) logoutBtn.addEventListener('click', logout);
window.addEventListener('click', e => { if (loginModal && e.target === loginModal) closeLoginModal(); });

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  animateElements();
});
