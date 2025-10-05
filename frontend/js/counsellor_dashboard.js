// /public/js/counsellor_dashboard.js

// helper: add Authorization header when token present
async function authFetch(url, opts = {}) {
  const token = localStorage.getItem('cw_token');
  const headers = Object.assign({}, opts.headers || {});
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  return res;
}

function gotoLogin() {
  localStorage.removeItem('cw_token');
  window.location.href = '/api/login';
}

async function loadProfile() {
  // Ensure user is authenticated and fetch profile from /api/auth/me
  const res = await authFetch('/api/auth/me');
  if (!res.ok) {
    // if unauthorized, send to login
    if (res.status === 401 || res.status === 403) return gotoLogin();
  }
  const body = await res.json().catch(()=>({}));
  if (!body.success) {
    // probably not found or invalid token
    return gotoLogin();
  }

  // If this token belongs to a user rather than a counsellor, redirect
  if (body.role && body.role !== 'counsellor') {
    // If it's a normal user, redirect to user dashboard
    return window.location.href = '/api/user/dashboard';
  }

  // Use the counsellor object returned by the endpoint
  const c = body.counsellor || body.user || {};

  // populate profile fields
  document.getElementById('cname').textContent = c.name || '—';
  document.getElementById('cemail').textContent = c.email || '—';
  document.getElementById('cqual').textContent = c.qualification || '—';
  document.getElementById('cexp').textContent = c.experience || '—';
  document.getElementById('cplace').textContent = c.place || '—';

  // also show username in nav
  const navUsername = document.getElementById('navUsername');
  if (navUsername) navUsername.textContent = c.name || c.email || 'You';
}

function wireNav() {
  const buttons = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');

  function showSection(id) {
    buttons.forEach(b => b.classList.toggle('active', b.dataset.section === id));
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    // scroll up for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.section;
      showSection(id);
    });
  });

  // clicking the nav user area or the small user icon goes to profile
  const navUser = document.getElementById('navUser');
  const navUserIcon = document.getElementById('navUserIcon');
  if (navUser) navUser.addEventListener('click', () => showSection('profile'));
  if (navUserIcon) navUserIcon.addEventListener('click', () => showSection('profile'));

  // logout button behavior
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('cw_token');
      // optional: show logout feedback then redirect
      window.location.href = '/api';
    });
  }
}

// placeholder demo data for other sections (replace with real API calls later)
function populateDemoLists() {
  const chats = [
    { who: 'Alex Smith', when: '10:45 AM' },
    { who: 'Maria Johnson', when: '9:10 AM' },
    { who: 'Ravi Kumar', when: 'Yesterday 7:30 PM' }
  ];
  const chatsList = document.getElementById('chatsList');
  chatsList.innerHTML = '';
  chats.forEach((c,i)=>{
    const div = document.createElement('div');
    div.className = `list-item ${i%2? 'alt':''}`;
    div.innerHTML = `<strong>${c.who}</strong> — ${c.when}`;
    chatsList.appendChild(div);
  });

  const subs = [
    { name: 'Alex Smith', text: 'Reported mild anxiety, currently in improvement phase.' },
    { name: 'Maria Johnson', text: 'Depression case under medication review.' }
  ];
  const subsList = document.getElementById('submissionsList');
  subsList.innerHTML = '';
  subs.forEach((s,i)=>{
    const item = document.createElement('div');
    item.className = `list-item editable ${i%2? 'alt':''}`;
    item.innerHTML = `<strong>${s.name}:</strong><textarea>${s.text}</textarea>`;
    subsList.appendChild(item);
  });

  const appts = [
    '3 Oct — Alex Smith — 4:00 PM',
    '4 Oct — Maria Johnson — 11:30 AM',
    '5 Oct — Ravi Kumar — 6:00 PM'
  ];
  const apptsList = document.getElementById('appointmentsList');
  apptsList.innerHTML = '';
  appts.forEach((a,i)=>{
    const d = document.createElement('div');
    d.className = `list-item ${i%2? 'alt':''}`;
    d.textContent = a;
    apptsList.appendChild(d);
  });

  const feedbacks = [
    '“Dr. Jane was extremely supportive and helped me understand my triggers.” — Alex',
    '“The session was calm and helpful. Thank you!” — Maria'
  ];
  const fbList = document.getElementById('feedbacksList');
  fbList.innerHTML = '';
  feedbacks.forEach((f,i)=>{
    const d = document.createElement('div');
    d.className = `list-item ${i%2? 'alt':''}`;
    d.textContent = f;
    fbList.appendChild(d);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  wireNav();
  // Ensure profile loads and user is authenticated
  await loadProfile();
  populateDemoLists();
});
