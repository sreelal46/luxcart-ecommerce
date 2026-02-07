document.addEventListener("DOMContentLoaded", () => {
  const adminLoginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPassword");

  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const alertDiv = document.getElementById("alert");

  /* =====================================
                  EYE TOGGLE
     ===================================== */
  document.querySelector(".toggle-eye").addEventListener("click", function () {
    const input = document.getElementById(this.dataset.target);

    if (input.type === "password") {
      input.type = "text";
      this.innerHTML = '<i class="bi bi-eye"></i>';
    } else {
      input.type = "password";
      this.innerHTML = '<i class="bi bi-eye-slash"></i>';
    }
  });

  /* =====================================
                VALIDATION
     ===================================== */

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function emailValidation() {
    const email = emailInput.value.trim();

    if (!email) {
      emailError.textContent = "Email is required";
      return false;
    } else if (!validateEmail(email)) {
      emailError.textContent = "Invalid email format.";
      return false;
    }

    emailError.textContent = "";
    return true;
  }

  function passwordValidation() {
    const password = passwordInput.value.trim();

    if (!password) {
      passwordError.textContent = "Password is required";
      return false;
    } else if (password.length < 8) {
      passwordError.textContent = "Password must be at least 8 characters.";
      return false;
    }

    passwordError.textContent = "";
    return true;
  }

  emailInput.addEventListener("input", emailValidation);
  passwordInput.addEventListener("input", passwordValidation);

  /* =====================================
                FORM SUBMIT
     ===================================== */

  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailValid = emailValidation();
    const passwordValid = passwordValidation();

    if (!emailValid || !passwordValid) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      const res = await axios.post(
        "/admin/login",
        { email, password },
        { withCredentials: true },
      );

      alertDiv.classList.remove("d-none");

      if (res.data.success) {
        alertDiv.className = "alert alert-success text-center";
        alertDiv.textContent = "Login successful! Redirecting...";
        setTimeout(() => (window.location.href = res.data.redirect), 400);
      } else {
        alertDiv.className = "alert alert-danger text-center";
        alertDiv.textContent = res.data.message || "Invalid credentials.";
      }
    } catch (err) {
      alertDiv.classList.remove("d-none");
      alertDiv.className = "alert alert-danger text-center";
      alertDiv.textContent =
        err.response?.data?.message || "Server error. Please try again.";
    }
  });
});
