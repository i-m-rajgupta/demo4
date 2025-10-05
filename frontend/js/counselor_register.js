// /public/js/counsellor_register.js
const form = document.getElementById("counsellorForm");
const submitBtn = document.getElementById("submitBtn");
const formMsg = document.getElementById("formMsg");

function setMsg(text, opts = {}) {
  formMsg.textContent = text || "";
  formMsg.style.color = opts.error ? "#c53030" : "#0b6b3a";
}

// Basic frontend validation helper
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validPhone(phone) {
  // allow digits, spaces, + and - and min 7 digits
  return /[0-9]/.test(phone) && phone.replace(/\D/g, "").length >= 7;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("");

  const data = {
    role: "counsellor",
    name: document.getElementById("name").value.trim(),
    dob: document.getElementById("dob").value,
    email: document.getElementById("email").value.trim().toLowerCase(),
    phone: document.getElementById("phone").value.trim(),
    qualification: document.getElementById("qualification").value.trim(),
    experience: Number(document.getElementById("experience").value || 0),
    place: document.getElementById("place").value.trim(),
    password: document.getElementById("password").value
  };

  // Frontend checks
  if (!data.name) return setMsg("Please enter your name.", { error: true });
  if (!data.dob) return setMsg("Please enter your date of birth.", { error: true });
  if (!validEmail(data.email)) return setMsg("Please enter a valid email.", { error: true });
  if (!validPhone(data.phone)) return setMsg("Please enter a valid phone number.", { error: true });
  if (!data.qualification) return setMsg("Please enter your qualification.", { error: true });
  if (isNaN(data.experience) || data.experience < 0) return setMsg("Please enter valid years of experience.", { error: true });
  if (!data.password || data.password.length < 6) return setMsg("Password must be at least 6 characters.", { error: true });

  // disable UI while request in progress
  submitBtn.disabled = true;
  submitBtn.textContent = "Registering...";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(()=>({}));

    if (res.ok && result.success) {
      setMsg(result.message || "Registered. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 900);
    } else {
      setMsg(result.error || "Registration failed", { error: true });
    }
  } catch (err) {
    console.error("Registration error:", err);
    setMsg("Network error — please try again.", { error: true });
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create account";
  }
});
