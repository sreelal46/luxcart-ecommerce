document.addEventListener("DOMContentLoaded", () => {
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const newPasswordInput = document.getElementById("newPassword");
  const newPasswordError = document.getElementById("newPasswordError");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const confirmPasswordError = document.getElementById("confirmPasswordError");
  const serverMessage = document.getElementById("serverMessage");

  /* =====================================
                 EYE TOGGLE LOGIC
       ===================================== */
  document.querySelectorAll(".toggle-eye").forEach((eye) => {
    eye.addEventListener("click", () => {
      const input = document.getElementById(eye.dataset.target);

      if (input.type === "password") {
        input.type = "text";
        eye.innerHTML = '<i class="bi bi-eye"></i>';
      } else {
        input.type = "password";
        eye.innerHTML = '<i class="bi bi-eye-slash"></i>';
      }
    });
  });

  //reset message
  newPasswordError.textContent = "";
  confirmPasswordError.textContent = "";

  //new password validation
  function newPasswordValidation() {
    const password = newPasswordInput.value.trim();

    if (!password) {
      newPasswordError.textContent = "New password is requied";
      newPasswordError.style.display = "block";
    } else if (password.length < 8) {
      newPasswordError.textContent = "Password length atleast 8 letters.";
      newPasswordError.style.display = "block";
    } else {
      newPasswordError.style.display = "none";
    }
  }

  //confirm password validation
  function confirmPasswordValidation() {
    const confirmPassword = confirmPasswordInput.value.trim();
    const password = newPasswordInput.value.trim();

    if (!confirmPassword) {
      confirmPasswordError.textContent = "Confirm password is requied.";
      confirmPasswordError.style.display = "block";
    } else if (confirmPassword.length < 8) {
      confirmPasswordError.textContent =
        "Confirm Password length atleast 8 letters.";
      confirmPasswordError.style.display = "block";
    } else if (confirmPassword !== password) {
      confirmPasswordError.textContent =
        "New password and Confirm password Mismatch.";
      confirmPasswordError.style.display = "block";
    } else {
      confirmPasswordError.textContent = "";
      confirmPasswordError.style.display = "none";
    }
  }

  //live validation
  newPasswordInput.addEventListener("input", newPasswordValidation);
  confirmPasswordInput.addEventListener("input", confirmPasswordValidation);

  //Form submiting
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    //reset messgae
    serverMessage.textContent = "";
    serverMessage.style.display = "none";

    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    function validationRmove() {
      //final validation
      if (!newPassword || newPassword.length < 8) {
        newPasswordError.style.display = "block";
        return;
      }

      if (!confirmPassword || confirmPassword != newPassword) {
        confirmPasswordError.style.display = "block";
      }
    }

    try {
      const res = await axios.post(
        "/forgot-password",
        {
          newPassword,
          confirmPassword,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        window.location.href = res.data.redirect;
      } else {
        serverMessage.textContent = res.data.alert || "Somthing Went Wrong";
        serverMessage.style.display = "block";
      }
    } catch (error) {}
    serverMessage.textContent =
      error.response?.data?.alert || "Somthing Went Wrong";
    serverMessage.style.display = "block";
  });
});
