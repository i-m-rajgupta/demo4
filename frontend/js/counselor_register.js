const form = document.getElementById("counsellorForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    role: "counsellor",
    name: document.getElementById("name").value,
    dob: document.getElementById("dob").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    qualification: document.getElementById("qualification").value,
    experience: document.getElementById("experience").value,
    password: document.getElementById("password").value
  };

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.success) {
      alert(result.message); // show "Registered successfully. Please login."
      window.location.href = "/api/login"; // redirect to login page
    } else {
      alert(result.error);
    }

  } catch (err) {
    console.error("Registration error:", err);
    alert("Something went wrong. Try again!");
  }
});
