document.addEventListener("DOMContentLoaded", () => {
  /* =====================================
            FULL CUSTOM SWAL LOGIC
       ===================================== */
  const CustomSwal = {
    timer: null,

    show(title = "Alert", text = "", type = "error", autoClose = 0) {
      const backdrop = document.getElementById("customSwalError");
      const box = document.getElementById("customSwalBox");

      // remove previous types
      box.className = "custom-swal-box";
      box.classList.add(type); // error | success | loading

      document.getElementById("customSwalTitle").textContent = title;
      document.getElementById("customSwalText").textContent = text;

      // Hide OK button for loaders
      document.getElementById("customSwalBtn").style.display =
        type === "loading" ? "none" : "inline-block";

      backdrop.classList.add("show");

      // Auto close
      if (autoClose > 0) {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.hide(), autoClose);
      }
    },

    hide() {
      document.getElementById("customSwalError").classList.remove("show");
      if (this.timer) clearTimeout(this.timer);
    },
  };

  document.getElementById("customSwalBtn").addEventListener("click", () => {
    window.location.href = "/account/change-password";
    CustomSwal.hide();
  });

  /* =====================================
                FORM VALIDATION
       ===================================== */
  const form = document.getElementById("changePasswordForm");
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const userId = document.getElementById("userId").value;
  const submitBtn = form.querySelector("button[type='submit']");

  // Create inline error <small>
  function createMessage(input) {
    const small = document.createElement("small");
    small.style.color = "red";
    small.style.fontSize = "12px";
    small.style.display = "none";
    input.parentNode.appendChild(small);
    return small;
  }

  const msg = {
    current: createMessage(currentPassword),
    new: createMessage(newPassword),
    confirm: createMessage(confirmPassword),
  };

  // Validators
  function validateCurrent() {
    if (currentPassword.value.trim().length < 3) {
      msg.current.textContent = "Invalid current password.";
      msg.current.style.display = "block";
      return false;
    }
    msg.current.style.display = "none";
    return true;
  }

  function validateNew() {
    if (newPassword.value.trim().length < 8) {
      msg.new.textContent = "Password must be at least 8 characters.";
      msg.new.style.display = "block";
      return false;
    }
    msg.new.style.display = "none";
    return true;
  }

  function validateConfirm() {
    if (confirmPassword.value !== newPassword.value) {
      msg.confirm.textContent = "Passwords do not match.";
      msg.confirm.style.display = "block";
      return false;
    }
    msg.confirm.style.display = "none";
    return true;
  }

  // Live validation
  function liveValidate() {
    validateCurrent();
    validateNew();
    validateConfirm();
  }

  currentPassword.addEventListener("input", liveValidate);
  newPassword.addEventListener("input", liveValidate);
  confirmPassword.addEventListener("input", liveValidate);

  /* =====================================
                    SUBMIT
       ===================================== */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const validCurrent = validateCurrent();
    const validNew = validateNew();
    const validConfirm = validateConfirm();

    if (!validCurrent || !validNew || !validConfirm) {
      validateCurrent();
      validateNew();
      validateConfirm();
      return;
    }

    // Loader
    submitBtn.textContent = "Updating...";
    CustomSwal.show("Updating Password", "Please wait...", "loading");

    try {
      const res = await axios.post(`/account/change-password/${userId}`, {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      });

      if (res.data.success) {
        CustomSwal.show(
          "Success!",
          "Password updated successfully!",
          "success"
        );
      } else {
        CustomSwal.show("Error!", `${res.data.alert}`, "error");
      }

      form.reset();
    } catch (err) {
      const message = err.response?.data?.alert || "Failed to update password";
      CustomSwal.show("Error!", message, "error");
    }
  });

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
});
