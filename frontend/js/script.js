// profile sign in/out toggle
const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
const authBtn = document.getElementById('authBtn');

let signedIn = false;

profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileMenu.style.display = profileMenu.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', () => {
  profileMenu.style.display = 'none';
});


// Panic button behaviour (simple demo)
const panicBtn = document.getElementById('panicBtn');
panicBtn.addEventListener('click', () => {
  alert('Panic button pressed. Calling emergency contact...\nIf this is a real emergency, please call your local emergency services.');
});

// Simple slider controls
const slider = document.getElementById('slider');
const prev = document.getElementById('prev');
const next = document.getElementById('next');

const slideWidth = 252; // matches min-width + gap approximations

prev.addEventListener('click', () => {
  slider.scrollBy({ left: -slideWidth, behavior: 'smooth' });
});
next.addEventListener('click', () => {
  slider.scrollBy({ left: slideWidth, behavior: 'smooth' });
});

// keyboard accessibility for profile
profileBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    profileBtn.click();
  }
});