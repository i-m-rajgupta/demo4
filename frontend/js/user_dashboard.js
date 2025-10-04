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

// Sign out dropdown
const userIcon = document.getElementById('userIcon');
const signoutMenu = document.getElementById('signoutMenu');

userIcon.addEventListener('click', e => {
  e.stopPropagation();
  signoutMenu.style.display = signoutMenu.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', () => {
  signoutMenu.style.display = 'none';
});

document.getElementById('signoutBtn').addEventListener('click', () => {
  alert('Signed out successfully!');
  // redirect to login page if needed
});

// Create pie chart for analysis section
const ctx = document.getElementById('attendanceChart');
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
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#fff'
        }
      }
    }
  }
});