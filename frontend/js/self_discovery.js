// Background color highlight effect that shifts over time
const body = document.body;
const colors = ["#e3f2fd", "#fff3e0", "#fce4ec", "#e8f5e9", "#ede7f6"];
let colorIndex = 0;

setInterval(() => {
  colorIndex = (colorIndex + 1) % colors.length;
  body.style.backgroundColor = colors[colorIndex];
}, 8000);