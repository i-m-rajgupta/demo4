// /public/js/counsellorDashboard.js

async function authFetch(url, opts = {}) {
  const token = localStorage.getItem('cw_token');
  const headers = Object.assign({}, opts.headers || {});
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  return res;
}

async function bootstrap() {
  const contentEl = document.getElementById('dashboardContent'); // create a container in HTML
  try {
    const res = await authFetch('/api/counsellor/me');
    if (res.status === 401 || res.status === 403) {
      // token missing/invalid - redirect to login
      window.location.href = '/login.html'; // your login route
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(()=>({}));
      contentEl.innerHTML = `<p>Error: ${body.error || 'Unable to load data'}</p>`;
      return;
    }
    const body = await res.json();
    const c = body.counsellor;
    // Render counsellor info into page
    contentEl.innerHTML = `
      <h2>Welcome, ${c.name}</h2>
      <p><strong>Username:</strong> ${c.username}</p>
      <p><strong>Email:</strong> ${c.email}</p>
      <p><strong>Experience:</strong> ${c.experience || 'N/A'} years</p>
    `;
  } catch (err) {
    console.error(err);
    contentEl.innerHTML = '<p>Network error - try again later</p>';
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
