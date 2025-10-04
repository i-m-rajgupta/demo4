// Populate experience dropdown dynamically (1 to 40 years)
const experienceSelect = document.getElementById("experience");
for (let i = 1; i <= 40; i++) {
  const option = document.createElement("option");
  option.value = i;
  option.textContent = `${i} year${i > 1 ? "s" : ""}`; // ✅ use backticks
  experienceSelect.appendChild(option);
}

// Handle form submission
document.getElementById("counselorForm").addEventListener("submit",async function (event) {
  event.preventDefault(); // prevent page reload

  const counselorData = {
    name: document.getElementById("name").value.trim(),
    dob: document.getElementById("dob").value,
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    qualification: document.getElementById("qualification").value.trim(),
    experience: document.getElementById("experience").value
  };

  // Simple validation
  if (
    !counselorData.name ||
    !counselorData.email ||
    !counselorData.phone ||
    !counselorData.qualification ||
    !counselorData.experience
  ) {
    alert("Please fill in all required fields.");
    return;
  }

console.log(counselorData);
  try {
    // ✅ use await safely inside async function
    const res = await fetch("/api/counsellor/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(counselorData)
    });

    if (res.status == 201) {
      alert("Counselor registered successfully!");
      this.reset();
      window.location.href = "/counsellorDashboard.html";
    } else {
      const error = await res.json();
      alert("Error: " + (error.message || "Failed to register"));
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong!");
  }

  // Clear form
  this.reset();
});
