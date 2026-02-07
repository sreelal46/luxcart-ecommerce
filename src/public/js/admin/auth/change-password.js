document.addEventListener("DOMContentLoaded", () => {
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const toggleNewPassword = document.getElementById("toggleNewPassword");
  const toggleConfirmPassword = document.getElementById(
    "toggleConfirmPassword",
  );

  function togglePassword(input, icon) {
    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("bi-eye-slash");
      icon.classList.add("bi-eye");
    } else {
      input.type = "password";
      icon.classList.remove("bi-eye");
      icon.classList.add("bi-eye-slash");
    }
  }

  toggleNewPassword.addEventListener("click", () => {
    const icon = toggleNewPassword.querySelector("i");
    togglePassword(newPasswordInput, icon);
  });

  toggleConfirmPassword.addEventListener("click", () => {
    const icon = toggleConfirmPassword.querySelector("i");
    togglePassword(confirmPasswordInput, icon);
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const newPasswordForm = document.getElementById("passwordChange");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const newPasswordError = document.getElementById("newPasswordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");
  const alert = document.getElementById("alert");
  const submitBtn = document.getElementById("submitBtn");

  function validateNewPassword() {
    const password = newPasswordInput.value.trim();
    if (!password) {
      newPasswordError.textContent = "Password is required";
      newPasswordInput.classList.add("is-invalid");
      return false;
    } else if (password.length < 8) {
      newPasswordError.textContent = "Password must be at least 8 characters";
      newPasswordInput.classList.add("is-invalid");
      return false;
    } else {
      newPasswordError.textContent = "";
      newPasswordInput.classList.remove("is-invalid");
      newPasswordInput.classList.add("is-valid");
      return true;
    }
  }

  function validateConfirmPassword() {
    const password = newPasswordInput.value.trim();
    const confirm = confirmPasswordInput.value.trim();
    if (!confirm) {
      confirmPasswordError.textContent = "Please confirm your password.";
      confirmPasswordInput.classList.add("is-invalid");
      return false;
    } else if (password !== confirm) {
      confirmPasswordError.textContent = "Passwords do not match.";
      confirmPasswordInput.classList.add("is-invalid");
      return false;
    } else {
      confirmPasswordError.textContent = "";
      confirmPasswordInput.classList.remove("is-invalid");
      confirmPasswordInput.classList.add("is-valid");
      return true;
    }
  }

  // Live validation
  newPasswordInput.addEventListener("input", () => {
    validateNewPassword();
    validateConfirmPassword();
  });

  confirmPasswordInput.addEventListener("input", () => {
    validateConfirmPassword();
  });

  newPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(newPasswordForm);
    const data = Object.fromEntries(formData.entries());

    alert.className = "alert alert-info text-center";
    alert.textContent = "Processing...";
    alert.classList.remove("d-none");

    try {
      const res = await axios.post("/admin/change-password", data);
      if (res.data.success) {
        alert.className = "alert alert-success text-center";
        alert.textContent = "Password changed successfully!";
        setTimeout(() => (window.location.href = res.data.redirect), 1000);
      }
    } catch (error) {
      const message = error.response?.data?.alert || "Something went wrong!";
      alert.className = "alert alert-danger text-center";
      alert.textContent = message;
    }
  });
});
