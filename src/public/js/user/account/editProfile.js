(function ProfileBundle() {
  // -----------------------
  // Utils
  // -----------------------
  function el(id) {
    return document.getElementById(id);
  }

  // -----------------------
  // EMAIL OTP MODULE (original email receives OTP)
  // -----------------------
  (function EmailOtpModule() {
    const emailInput = el("emailInput");
    const emailVerifiedInput = el("emailVerifiedInput");
    const otpModal = el("otpModal");
    const otpTargetEmail = el("otpTargetEmail");
    const otpInputsWrapper = el("otpInputs");
    const verifyBtn = el("verifyOtpBtn");
    const cancelBtn = el("cancelOtpBtn");
    const closeBtn = el("otpClose");
    const resendBtn = el("resendBtn");
    const resendTimerEl = el("resendTimer");
    const otpMessage = el("otpMessage");
    const form = document.querySelector("form.edit-form");

    if (!emailInput || !emailVerifiedInput) {
      console.warn("EmailOtpModule: email inputs missing; skipping.");
      return;
    }

    const OTP_LENGTH = 6;
    const RESEND_COOLDOWN = 60;
    let resendTimer = 0;

    function showMessage(msg, ok) {
      if (!otpMessage) return;
      otpMessage.textContent = msg || "";
      otpMessage.style.color = ok === undefined ? "" : ok ? "green" : "#b00020";
    }

    function clearOtpInputs() {
      if (!otpInputsWrapper) return;
      otpInputsWrapper.querySelectorAll("input").forEach((i) => (i.value = ""));
    }

    function getEnteredOtp() {
      if (!otpInputsWrapper) return "";
      return Array.from(otpInputsWrapper.querySelectorAll("input"))
        .map((i) => i.value)
        .join("");
    }

    function buildOtpInputs() {
      if (!otpInputsWrapper) return;
      otpInputsWrapper.innerHTML = "";
      for (let i = 0; i < OTP_LENGTH; i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.inputMode = "numeric";
        input.maxLength = 1;
        input.autocomplete = "one-time-code";
        input.className = "otp-digit";
        otpInputsWrapper.appendChild(input);
      }
      setupOtpInputBehavior();
    }

    function setupOtpInputBehavior() {
      if (!otpInputsWrapper) return;
      const inputs = Array.from(otpInputsWrapper.querySelectorAll("input"));
      inputs.forEach((inp, idx) => {
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Backspace") {
            if (inp.value === "") {
              const prev = inputs[idx - 1];
              if (prev) {
                prev.focus();
                prev.value = "";
              }
            } else {
              inp.value = "";
            }
            e.preventDefault();
            return;
          }
          if (e.key === "ArrowLeft") {
            const prev = inputs[idx - 1];
            if (prev) prev.focus();
            e.preventDefault();
            return;
          }
          if (e.key === "ArrowRight") {
            const next = inputs[idx + 1];
            if (next) next.focus();
            e.preventDefault();
            return;
          }
          if (e.key && e.key.match(/^[0-9]$/)) return;
          if (e.key === "Tab") return;
          e.preventDefault();
        });

        inp.addEventListener("input", () => {
          const v = inp.value.replace(/\D/g, "").slice(0, 1);
          inp.value = v;
          if (v && idx < inputs.length - 1) {
            inputs[idx + 1].focus();
            try {
              inputs[idx + 1].select();
            } catch (e) {}
          }
        });

        inp.addEventListener("paste", (e) => {
          e.preventDefault();
          const paste =
            (e.clipboardData || window.clipboardData).getData("text") || "";
          const digits = paste
            .replace(/\D/g, "")
            .slice(0, OTP_LENGTH)
            .split("");
          digits.forEach((d, i) => {
            if (inputs[i]) inputs[i].value = d;
          });
          const firstEmpty = inputs.find((i) => !i.value);
          if (firstEmpty) firstEmpty.focus();
          else inputs[inputs.length - 1].focus();
        });
      });
    }

    function updateResendUI() {
      if (!resendTimerEl) return;
      resendTimerEl.textContent =
        resendTimer > 0 ? "(" + resendTimer + "s)" : "";
      if (resendBtn) {
        resendBtn.style.opacity = resendTimer > 0 ? "0.6" : "1";
        resendBtn.disabled = resendTimer > 0;
      }
    }

    function startResendCooldown() {
      resendTimer = RESEND_COOLDOWN;
      updateResendUI();
      if (window.__otpResendInterval) clearInterval(window.__otpResendInterval);
      window.__otpResendInterval = setInterval(() => {
        resendTimer -= 1;
        updateResendUI();
        if (resendTimer <= 0) {
          clearInterval(window.__otpResendInterval);
          window.__otpResendInterval = null;
          resendTimer = 0;
          updateResendUI();
        }
      }, 1000);
    }

    function stopResendCooldown() {
      if (window.__otpResendInterval) {
        clearInterval(window.__otpResendInterval);
        window.__otpResendInterval = null;
      }
      resendTimer = 0;
      updateResendUI();
    }

    async function sendOtpRequest(targetEmail, origEmail) {
      if (!origEmail) {
        showMessage("Original email missing.", false);
        return false;
      }
      if (typeof axios === "undefined") {
        showMessage("axios missing.", false);
        return false;
      }
      try {
        showMessage("Sending verification code…", false);
        const res = await axios.post(
          "/send-otp",
          { email: origEmail, targetEmail, verification: "emailChanging" },
          { withCredentials: true }
        );
        if (res.data && res.data.success) {
          showMessage("Verification code sent to original email.", true);
          return true;
        }
        showMessage(res.data?.message || "Failed to send OTP.", false);
        return false;
      } catch (err) {
        console.error("sendOtpRequest:", err);
        showMessage(
          err?.response?.data?.message || "Failed to send OTP.",
          false
        );
        return false;
      }
    }

    async function verifyOtpRequest(targetEmail, origEmail, code) {
      if (!origEmail || !code) {
        showMessage("Missing original email or code.", false);
        return false;
      }
      if (typeof axios === "undefined") {
        showMessage("axios missing.", false);
        return false;
      }
      try {
        showMessage("Verifying…", false);
        const res = await axios.post(
          "/verify-otp",
          { email: origEmail, targetEmail, code },
          { withCredentials: true }
        );
        if (res.data && (res.data.ok || res.data.success)) {
          showMessage("Email verified successfully.", true);
          emailVerifiedInput.value = "true";
          setTimeout(() => closeModal(), 700);
          return true;
        }
        showMessage(
          res.data?.message || res.data?.alert || "Invalid code.",
          false
        );
        return false;
      } catch (err) {
        console.error("verifyOtpRequest:", err);
        showMessage(
          err?.response?.data?.message || "OTP verification failed.",
          false
        );
        return false;
      }
    }

    // Modal control
    function openModalForEmail(newEmail) {
      if (!otpModal || !otpTargetEmail) return;
      const origEmail = (emailInput.dataset.originalEmail || "").trim();
      otpTargetEmail.textContent = origEmail || "";
      buildOtpInputs();
      showMessage("");
      emailVerifiedInput.value = "false";
      otpModal.classList.add("show");
      sendOtpRequest(newEmail, origEmail).then((ok) => {
        if (ok) startResendCooldown();
      });
    }

    function closeModal() {
      if (!otpModal) return;
      otpModal.classList.remove("show");
      stopResendCooldown();
      clearOtpInputs();
    }

    // Event wiring
    if (verifyBtn) {
      verifyBtn.addEventListener("click", async () => {
        const code = getEnteredOtp();
        if (code.length !== OTP_LENGTH) {
          showMessage("Enter full code.", false);
          return;
        }
        const newEmail = (emailInput.value || "").trim();
        const origEmail = (emailInput.dataset.originalEmail || "").trim();
        if (!origEmail) {
          showMessage("Original email missing.", false);
          return;
        }
        await verifyOtpRequest(newEmail, origEmail, code);
      });
    }

    if (resendBtn) {
      resendBtn.addEventListener("click", async () => {
        if (resendTimer > 0) return;
        const newEmail = (emailInput.value || "").trim();
        const origEmail = (emailInput.dataset.originalEmail || "").trim();
        if (!origEmail) {
          showMessage("Original email missing.", false);
          return;
        }
        const ok = await sendOtpRequest(newEmail, origEmail);
        if (ok) startResendCooldown();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (emailInput)
          emailInput.value = emailInput.dataset.originalEmail || "";
        if (emailVerifiedInput) emailVerifiedInput.value = "true";
        clearOtpInputs();
        closeModal();
      });
    }
    if (closeBtn)
      closeBtn.addEventListener("click", () => {
        if (cancelBtn) cancelBtn.click();
      });
    if (otpModal)
      otpModal.addEventListener("click", (e) => {
        if (e.target === otpModal && cancelBtn) cancelBtn.click();
      });
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        otpModal &&
        otpModal.classList.contains("show") &&
        cancelBtn
      )
        cancelBtn.click();
    });

    if (emailInput) {
      emailInput.addEventListener("blur", () => {
        const newEmail = (emailInput.value || "").trim();
        const orig = (emailInput.dataset.originalEmail || "").trim();
        if (!newEmail || newEmail === orig) {
          emailVerifiedInput.value = "true";
          return;
        }
        emailVerifiedInput.value = "false";
        // basic email validation
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!re.test(newEmail)) return;
        if (
          window.__emailVerification &&
          typeof window.__emailVerification.openModal === "function"
        ) {
          // open modal (module uses original email for sending)
          window.__emailVerification.openModal();
        } else {
          openModalForEmail(newEmail);
        }
      });

      emailInput.addEventListener("input", () => {
        const orig = (emailInput.dataset.originalEmail || "").trim();
        if ((emailInput.value || "").trim() === orig)
          emailVerifiedInput.value = "true";
        else emailVerifiedInput.value = "false";
      });
    }

    // startup
    buildOtpInputs();
    if (emailVerifiedInput) emailVerifiedInput.value = "true";

    // expose API
    window.__emailVerification = {
      openModal: () => {
        if (emailInput) openModalForEmail(emailInput.value || "");
      },
      triggerSendForEmail: async (email) => {
        const orig = (emailInput.dataset.originalEmail || "").trim();
        return await sendOtpRequest(email, orig);
      },
      triggerVerifyForEmail: async (email, code) => {
        const orig = (emailInput.dataset.originalEmail || "").trim();
        return await verifyOtpRequest(email, orig, code);
      },
    };
  })();

  // -----------------------
  // LIVE VALIDATION
  // -----------------------
  (function LiveProfileValidation() {
    const form = document.querySelector(".edit-form");
    if (!form) return;

    const profileInput = el("profileInput");
    const profilePreview = el("profilePreview");
    const profileImageError = el("profileImageError");
    const deleteProfileBtn = el("deleteProfileBtn");
    const deleteProfileImage = el("deleteProfileImage");

    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = el("emailInput");
    const emailVerifiedInput = el("emailVerifiedInput");
    const phoneInput = form.querySelector('input[name="phone"]');
    const dobInput = form.querySelector('input[name="dob"]');
    const submitBtn = el("openConfirm");

    // -------------------------------
    // Error Handling Helpers
    // -------------------------------
    function showError(elm, msg) {
      if (!elm) return;
      removeError(elm);

      const span = document.createElement("span");
      span.className = "field-error";
      span.style.color = "#b00020";
      span.style.fontSize = "0.85rem";
      span.textContent = msg;

      elm.insertAdjacentElement("afterend", span);
      elm.setAttribute("aria-invalid", "true");
    }

    function removeError(elm) {
      if (!elm) return;
      elm.removeAttribute("aria-invalid");

      const next = elm.nextElementSibling;
      if (next && next.classList.contains("field-error")) next.remove();
    }

    function showImageError(msg) {
      profileImageError.innerHTML = `<span class="field-error" style="
      color:#b00020;
      font-size:0.85rem;
      display:block;
      margin-top:4px;
    ">${msg}</span>`;
    }

    function clearImageError() {
      profileImageError.innerHTML = "";
    }

    // -------------------------------
    // Field Validations
    // -------------------------------
    function validateName() {
      const v = (nameInput.value || "").trim();
      if (!v) return showError(nameInput, "Name is required."), false;
      if (v.length < 2)
        return (
          showError(nameInput, "Name must be at least 2 characters."), false
        );
      removeError(nameInput);
      return true;
    }

    function validateEmail() {
      const v = (emailInput.value || "").trim();
      if (!v) return showError(emailInput, "Email is required."), false;

      const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!re.test(v))
        return showError(emailInput, "Enter a valid email address."), false;

      removeError(emailInput);
      return true;
    }

    function validatePhone() {
      const v = (phoneInput.value || "").trim();

      if (!v) return showError(phoneInput, "Phone number is required."), false;

      // Strict India phone validation
      if (!/^[6-9]\d{9}$/.test(v))
        return (
          showError(phoneInput, "Enter valid 10-digit Indian mobile number."),
          false
        );

      // Reject repeated digits (0000000000, 1111111111, ...)
      if (/^(\d)\1{9}$/.test(v))
        return (
          showError(phoneInput, "Phone number cannot be all repeating digits."),
          false
        );

      removeError(phoneInput);
      return true;
    }

    function validateDob() {
      const v = dobInput.value;
      if (!v) {
        removeError(dobInput);
        return true;
      }

      const d = new Date(v);
      if (Number.isNaN(d.getTime()))
        return showError(dobInput, "Enter a valid date."), false;

      const today = new Date();
      if (d > today)
        return showError(dobInput, "DOB can't be in the future."), false;

      // Age validation (must be >= 18)
      const age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      const exactAge =
        age - (m < 0 || (m === 0 && today.getDate() < d.getDate()) ? 1 : 0);

      if (exactAge < 18)
        return showError(dobInput, "You must be at least 18 years old."), false;

      removeError(dobInput);
      return true;
    }

    // -------------------------------
    // Image Validation
    // -------------------------------
    if (profileInput && profilePreview) {
      profileInput.addEventListener("change", () => {
        clearImageError();

        const file = profileInput.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
          showImageError("Please select a valid image file.");
          profileInput.value = "";
          return;
        }

        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
          showImageError("Image too large (max 5MB).");
          profileInput.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          profilePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);

        if (deleteProfileImage) deleteProfileImage.value = "false";
      });
    }

    // -------------------------------
    // Delete/Undo Image
    // -------------------------------
    if (deleteProfileBtn) {
      deleteProfileBtn.addEventListener("click", () => {
        const isDelete = deleteProfileImage.value === "true";

        if (!isDelete) {
          profilePreview.dataset.prevSrc = profilePreview.src || "";
          profilePreview.src = "/images/people.png";
          profileInput.value = "";
          deleteProfileImage.value = "true";
          deleteProfileBtn.textContent = "Undo Delete";
          deleteProfileBtn.classList.add("btn--toggled");
        } else {
          profilePreview.src = profilePreview.dataset.prevSrc;
          delete profilePreview.dataset.prevSrc;
          deleteProfileImage.value = "false";
          deleteProfileBtn.textContent = "Delete Photo";
          deleteProfileBtn.classList.remove("btn--toggled");
        }
      });
    }

    // -------------------------------
    // Email Verification Logic
    // -------------------------------
    emailInput?.addEventListener("blur", () => {
      const newEmail = emailInput.value.trim();
      const orig = emailInput.dataset.originalEmail.trim();

      if (!newEmail || newEmail === orig) {
        emailVerifiedInput.value = "true";
        removeError(emailInput);
        return;
      }

      emailVerifiedInput.value = "false";

      if (!validateEmail()) return;

      if (window.__emailVerification?.openModal) {
        window.__emailVerification.openModal();
      } else {
        showError(emailInput, "Email changed — verification required.");
      }
    });

    emailInput?.addEventListener("input", () => {
      const orig = emailInput.dataset.originalEmail.trim();
      emailVerifiedInput.value =
        emailInput.value.trim() === orig ? "true" : "false";

      validateEmail();
    });

    nameInput?.addEventListener("input", validateName);
    phoneInput?.addEventListener("input", validatePhone);
    dobInput?.addEventListener("change", validateDob);

    // Public API
    window.__profileFormValidation = {
      validateAll: () =>
        validateName() && validateEmail() && validatePhone() && validateDob(),
      isEmailVerified: () => emailVerifiedInput?.value === "true",
    };
  })();
})();

/* ------------------------------------------------------------------
   PROFILE IMAGE CROPPER + PREVIEW + FORM SUBMISSION WITH AXIOS
------------------------------------------------------------------- */

let cropper;
let croppedImageFile = null;

// DOM elements
const profileInput = document.getElementById("profileInput");
const cropperModal = document.getElementById("cropperModal");
const cropImage = document.getElementById("cropImage");
const applyCrop = document.getElementById("applyCrop");
const cancelCrop = document.getElementById("cancelCrop");
const cropClose = document.getElementById("cropClose");
const previewImg = document.getElementById("profilePreview");

const deleteBtn = document.getElementById("deleteProfileBtn");
const deleteModal = document.getElementById("deletePhotoModal");
const cancelDelete = document.getElementById("cancelDeletePhoto");
const confirmDelete = document.getElementById("confirmDeletePhoto");
const deleteFlag = document.getElementById("deleteProfileImage");

const openConfirm = document.getElementById("openConfirm");
const confirmModal = document.getElementById("confirmModal");
const cancelBtn = document.getElementById("cancelBtn");
const confirmBtn = document.getElementById("confirmBtn");

/* ---------------------------------------------------------------
   1. OPEN CROPPER WHEN USER SELECTS IMAGE
---------------------------------------------------------------- */
profileInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    cropImage.src = event.target.result;
    cropperModal.style.display = "flex";

    if (cropper) cropper.destroy();
    cropper = new Cropper(cropImage, {
      aspectRatio: 1,
      viewMode: 2,
      movable: true,
      zoomable: true,
      scalable: true,
      rotatable: true,
    });
  };

  reader.readAsDataURL(file);
});

/* ---------------------------------------------------------------
   2. CLOSE CROPPER
---------------------------------------------------------------- */
[cancelCrop, cropClose].forEach((btn) => {
  btn.addEventListener("click", () => {
    cropperModal.style.display = "none";
    if (cropper) cropper.destroy();
  });
});

/* ---------------------------------------------------------------
   3. APPLY CROP → CONVERT TO FILE → SHOW PREVIEW
   (IMPORTANT FIX: remove original file so multer doesn't upload 2 files)
---------------------------------------------------------------- */
applyCrop.addEventListener("click", () => {
  if (!cropper) return;

  const canvas = cropper.getCroppedCanvas({
    width: 600,
    height: 600,
  });

  canvas.toBlob(
    (blob) => {
      croppedImageFile = new File([blob], "croppedImage.jpg", {
        type: "image/jpeg",
      });

      // Show preview
      const previewUrl = URL.createObjectURL(croppedImageFile);
      previewImg.src = previewUrl;

      // ❗ FIX: Remove original un-cropped file
      profileInput.value = ""; // prevents multer receiving 2 files

      cropperModal.style.display = "none";
      cropper.destroy();
    },
    "image/jpeg",
    0.9
  );
});

/* ---------------------------------------------------------------
   4. DELETE PHOTO
---------------------------------------------------------------- */
deleteBtn.addEventListener("click", () => {
  deleteModal.style.display = "flex";
});

cancelDelete.addEventListener("click", () => {
  deleteModal.style.display = "none";
});

confirmDelete.addEventListener("click", () => {
  deleteFlag.value = "true"; // backend flag
  croppedImageFile = null; // no cropped image
  profileInput.value = ""; // remove file input
  previewImg.src = "/img/default-user.png";
  deleteModal.style.display = "none";
});

/* ---------------------------------------------------------------
   5. OPEN CONFIRM SAVE MODAL
---------------------------------------------------------------- */
openConfirm.addEventListener("click", (e) => {
  e.preventDefault();
  confirmModal.style.display = "flex";
});

cancelBtn.addEventListener("click", () => {
  confirmModal.style.display = "none";
});

const CustomSwal = {
  show: (title = "Please wait...", text = "Processing...") => {
    const box = document.getElementById("customSwal");
    document.getElementById("customSwalTitle").textContent = title;
    document.getElementById("customSwalText").textContent = text;
    box.classList.add("show");
  },

  hide: () => {
    document.getElementById("customSwal").classList.remove("show");
  },
};

/* ---------------------------------------------------------------
   6. FINAL SAVE USING AXIOS (ONLY CROPPED FILE SENT)
---------------------------------------------------------------- */
confirmBtn.addEventListener("click", async () => {
  // 🔥 Prevent bad submission
  if (!window.__profileFormValidation.validateAll()) {
    CustomSwal.hide();
    return;
  }

  if (!window.__profileFormValidation.isEmailVerified()) {
    showError(emailInput, "Email must be verified before saving.");
    CustomSwal.hide();
    return;
  }

  confirmModal.style.display = "none";

  const form = document.querySelector(".edit-form");
  const formData = new FormData(form);

  const userId = document.getElementById("userId").value;

  if (croppedImageFile) {
    formData.append("profileImage", croppedImageFile);
  }

  CustomSwal.show("Saving Profile...", "Please wait...");

  try {
    const res = await axios.post(
      `/account/profile/edit-profile/${userId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    if (res.data.success) {
      CustomSwal.hide();
      window.location.href = res.data.redirect;
    }
  } catch (err) {
    console.error("Profile update failed:", err);
  }
});
