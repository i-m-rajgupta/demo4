const token = localStorage.getItem("cw_token");
if (!token) {
  alert("Please login first.");
  window.location.href = "/api/login";
}

async function loadUser() {
  try {
    const res = await fetch("/api/user/me", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const body = await res.json();
    if (!body.success) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("cw_token");
      window.location.href = "/api/login";
      return;
    }
    document.getElementById("username").textContent = body.user.name;
  } catch(err) {
    console.error(err);
    alert("Failed to load user info.");
  }
}

loadUser();
