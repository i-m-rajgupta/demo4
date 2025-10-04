const form = document.getElementById("loginForm");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const body = await res.json();

    if (body.success) {
      localStorage.setItem("cw_token", body.token);
      if (body.user.role === "user") {
        window.location.href = "/api/user/dashboard";
      } else {
        window.location.href = "/api/counsellor/dashboard";
      }
    } else {
      alert(body.error || "Login failed");
    }
  } catch (err) {
    console.error(err);
    alert("Network error. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
});
