document.addEventListener("DOMContentLoaded", () => {
  const emailVerifyForm = document.getElementById("emailVerifyForm");
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("emailError");
  const alert = document.getElementById("alert");

  // Helper function
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Email validation
  function emailValidation() {
    const email = emailInput.value.trim();
    if (!email) {
      emailError.textContent = "Email is required";
      return false;
    } else if (!validateEmail(email)) {
      emailError.textContent = "Invalid email format.";
      return false;
    } else {
      emailError.textContent = "";
      return true;
    }
  }

  emailInput.addEventListener("input", emailValidation);

  emailVerifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(emailVerifyForm);
    const data = Object.fromEntries(formData.entries());

    alert.className = "alert alert-info text-center";
    alert.textContent = "Email verifing......";
    alert.classList.remove("d-none");

    try {
      const res = await axios.post("/admin/verify-email", data, {
        withCredentials: true,
      });

      if (res.data.success) {
        alert.className = "alert alert-success text-center";
        alert.textContent = "Email verified...Redirecting...";
        alert.classList.remove("d-none");
        setTimeout(() => (window.location.href = res.data.redirect), 800);
      }
    } catch (error) {
      const message = error.response?.data?.alert || "Invalid Email.";
      alert.className = "alert alert-danger text-center";
      alert.textContent = message;
      alert.classList.remove("d-none");
    }
  });
});
