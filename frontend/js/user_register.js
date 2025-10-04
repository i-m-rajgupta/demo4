// Handle form submission
document.getElementById('userForm').addEventListener('submit',async function (event) {
  event.preventDefault(); // Prevent page refresh

  // Collect user input values
  const userData = {
    name: document.getElementById('name').value.trim(),
    dob: document.getElementById('dob').value,
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    place: document.getElementById('place').value.trim()
  };

  // Simple validation check
  if (!userData.name || !userData.email || !userData.phone || !userData.place) {
    alert('Please fill in all required fields.');
    return;
  }
console.log(userData);
  try {
    // ✅ use await safely inside async function
    const res = await fetch("/api/user/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    if (res.status == 201) {
      alert("Counselor registered successfully!");
      this.reset();
      window.location.href = "/userDashboard.html";
    } else {
      const error = await res.json();
      alert("Error: " + (error.message || "Failed to register"));
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong!");
  }
});