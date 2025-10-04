const form = document.getElementById("userForm");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userData = {
    role: "user",
    name: document.getElementById("name").value.trim(),
    dob: document.getElementById("dob").value,
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    place: document.getElementById("place").value.trim(),
    password: document.getElementById("password")?.value || "default123" // optional password field
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Registering...";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const body = await res.json();

    if (body.success) {
      alert(body.message);
      window.location.href = "/api/login"; // redirect to login page
    } else {
      alert(body.error || "Failed to register");
    }
  } catch (err) {
    console.error(err);
    alert("Network error. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});
