// public/js/user_dashboard.js

// Ensure Chart.js is loaded from CDN in your HTML before this script runs

const token = localStorage.getItem("cw_token");
if (!token) {
  alert("Please login first.");
  window.location.href = "/api/login";
}

// Load user info and update profile title & display name
async function loadUser() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
    });
    const body = await res.json().catch(() => ({}));
    // The /api/auth/me returns { success:true, user } or { success:true, counsellor }
    if (!res.ok || !body.success) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("cw_token");
      window.location.href = "/api/login";
      return;
    }

    // prefer user, then counsellor
    const person = body.user || body.counsellor || {};
    const displayName = person.name || person.email || "You";

    const profileTitle = document.getElementById("profileTitle");
    const displayNameEl = document.getElementById("displayName");
    if (profileTitle) profileTitle.textContent = `${displayName}'s Profile / Medical History`;
    if (displayNameEl) displayNameEl.textContent = displayName;

  } catch (err) {
    console.error(err);
    // If network error, do not forcibly log out — show message and let user retry
  }
}

loadUser();

// Section switching
const buttons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const sectionId = btn.dataset.section;
    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === sectionId);
    });
  });
});

// 👤 icon click → show Profile section
const userIcon = document.getElementById('userIcon');
userIcon.addEventListener('click', () => {
  // highlight "Profile" nav button
  buttons.forEach(b => b.classList.remove('active'));
  const profileBtn = document.querySelector('.nav-btn[data-section="profile"]');
  if (profileBtn) profileBtn.classList.add('active');

  // show profile section
  sections.forEach(sec => {
    sec.classList.toggle('active', sec.id === "profile");
  });

  // scroll to top of content (optional, improves UX on small screens)
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Create pie chart for analysis section
// Use getContext and disable maintainAspectRatio so chart fills wrapper size.
const canvas = document.getElementById('attendanceChart');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const attendanceChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Attended', 'Missed', 'Improvement'],
      datasets: [{
        label: 'Sessions & Improvement',
        data: [8, 2, 6],
        backgroundColor: ['#4cc763', '#d32f2f', '#f2e8cf'],
        borderColor: '#000',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // allow chart to match wrapper height/width
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#fff',
            boxWidth: 16,
            padding: 12
          }
        }
      }
    }
  });
}
