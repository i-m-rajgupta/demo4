// Section switching
const buttons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    // Highlight clicked tab
    buttons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Show relevant section
    const sectionId = btn.dataset.section;
    sections.forEach((sec) => {
      sec.classList.toggle('active', sec.id === sectionId);
    });
  });
});

// Sign out dropdown
const userIcon = document.getElementById('userIcon');
const signoutMenu = document.getElementById('signoutMenu');

userIcon.addEventListener('click', (e) => {
  e.stopPropagation();
  signoutMenu.style.display = signoutMenu.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', () => {
  signoutMenu.style.display = 'none';
});

document.getElementById('signoutBtn').addEventListener('click', () => {
  alert('You have signed out successfully.');
  // You could redirect to login page if needed
});