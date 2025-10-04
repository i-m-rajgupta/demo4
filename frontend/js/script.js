// public/js/script.js

// ---- Modal helpers ----
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');
const userInfo = document.getElementById('userInfo');
const usernameLabel = document.getElementById('usernameLabel');
const logoutBtn = document.getElementById('logoutBtn');

function openLogin() {
  loginModal.style.display = 'block';
  loginModal.setAttribute('aria-hidden', 'false');
  loginMsg.textContent = '';
  document.getElementById('loginId').focus();
}
function closeLoginModal() {
  loginModal.style.display = 'none';
  loginModal.setAttribute('aria-hidden', 'true');
  loginForm.reset();
  loginMsg.textContent = '';
}

// Event listeners
if (loginBtn) loginBtn.addEventListener('click', openLogin);
if (closeLogin) closeLogin.addEventListener('click', closeLoginModal);
window.addEventListener('click', (e) => {
  if (e.target === loginModal) closeLoginModal();
});

// ---- Auth helpers ----
function saveToken(token) {
  localStorage.setItem('cw_token', token);
}
function getToken() {
  return localStorage.getItem('cw_token');
}
function clearToken() {
  localStorage.removeItem('cw_token');
}

// Call backend login: POST /api/auth/login
async function login(credentials) {
  loginMsg.textContent = 'Signing in...';
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      loginMsg.style.color = '#c53030';
      loginMsg.textContent = body.error || 'Login failed';
      return false;
    }
    if (body.token) {
      saveToken(body.token);
      loginMsg.style.color = '#15803d';
      loginMsg.textContent = 'Signed in!';
      updateAuthUI();
      setTimeout(closeLoginModal, 500);
      return true;
    } else {
      loginMsg.style.color = '#c53030';
      loginMsg.textContent = 'Login failed (no token)';
      return false;
    }
  } catch (err) {
    console.error('Login error', err);
    loginMsg.style.color = '#c53030';
    loginMsg.textContent = 'Network error';
    return false;
  }
}

async function logout() {
  clearToken();
  updateAuthUI();
  // Optional: redirect to home
  // window.location.href = '/';
}

// Submit login form
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginId = document.getElementById('loginId').value.trim();
    const loginPassword = document.getElementById('loginPassword').value;
    if (!loginId || !loginPassword) {
      loginMsg.style.color = '#c53030';
      loginMsg.textContent = 'Please enter credentials';
      return;
    }
    await login({ usernameOrEmail: loginId, password: loginPassword });
  });
}

// Helper: fetch with Authorization header if token present
async function authFetch(url, opts = {}) {
  const token = getToken();
  const headers = (opts.headers) ? opts.headers : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  return res;
}

// Update UI based on auth state
async function updateAuthUI() {
  const token = getToken();
  if (token) {
    // Optionally fetch user info from server
    try {
      const res = await authFetch('/api/auth/me'); // optional endpoint to get user details
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        usernameLabel.textContent = body.user?.name || body.user?.username || 'You';
      } else {
        // if endpoint not present or token invalid, simply show 'You'
        usernameLabel.textContent = 'You';
      }
    } catch (err) {
      usernameLabel.textContent = 'You';
    }
    loginBtn.style.display = 'none';
    userInfo.style.display = 'inline-flex';
  } else {
    loginBtn.style.display = 'inline-block';
    userInfo.style.display = 'none';
  }
}

// wire logout button
if (logoutBtn) logoutBtn.addEventListener('click', logout);

// Initialize UI
document.addEventListener('DOMContentLoaded', updateAuthUI);
