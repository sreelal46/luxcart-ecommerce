document.addEventListener("DOMContentLoaded", () => {
  const userLoginForm = document.getElementById("userLoginFrom");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const serverMessage = document.getElementById("serverMessage");

  // Helper function to validate email
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Reset errors
  emailError.style.display = "none";
  passwordError.style.display = "none";

  function emailValidation() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      emailError.textContent = "Email is required";
      emailError.style.display = "block";
    } else if (!emailRegex.test(email)) {
      emailError.textContent = "Invalid email format.";
      emailError.style.display = "block";
    } else {
      emailError.textContent = "";
      emailError.style.display = "none";
      return true;
    }
  }

  function passwordVerification() {
    const password = passwordInput.value.trim();
    if (!password) {
      passwordError.textContent = "Password is required";
      passwordError.style.display = "block";
    } else if (password.length < 6) {
      passwordError.textContent = "Password must be at least 6 characters";
      passwordError.style.display = "block";
    } else {
      passwordError.textContent = "";
      passwordError.style.display = "none";
      return true;
    }
  }

  // Check if URL has alert message (from Google redirect)
  const params = new URLSearchParams(window.location.search);
  const alertMessage = params.get("alert");

  if (alertMessage) {
    serverMessage.textContent = decodeURIComponent(alertMessage);
    serverMessage.style.display = "block";

    // Optionally clear it from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  emailInput.addEventListener("input", emailValidation);
  passwordInput.addEventListener("input", passwordVerification);

  userLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset errors

    serverMessage.style.display = "none";
    serverMessage.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !validateEmail(email)) {
      emailError.style.display = "block";
      return;
    }

    if (!password || password.length < 6) {
      passwordError.style.display = "block";
      return;
    }

    try {
      const res = await axios.post(
        "/login",
        { email, password },
        { withCredentials: true }
      );

      if (res.data.success) {
        window.location.href = res.data.redirect;
      } else {
        serverMessage.textContent =
          res.data.alert || "Invalid email or password.";
        serverMessage.style.display = "block";
      }
    } catch (err) {
      serverMessage.textContent =
        err.response?.data?.alert || "Something went wrong!";
      serverMessage.style.display = "block";
    }
  });
});
