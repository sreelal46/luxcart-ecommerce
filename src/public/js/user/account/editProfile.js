(function ProfileBundle() {
  // -----------------------
  // Utils (shared)
  // -----------------------
  function el(id) {
    return document.getElementById(id);
  }

  function createFieldErrorEl(msg) {
    const span = document.createElement("span");
    span.className = "field-error";
    span.style.color = "#b00020";
    span.style.fontSize = "0.85rem";
    span.textContent = msg;
    return span;
  }

  function showFieldError(inputEl, msg) {
    if (!inputEl) return;
    removeFieldError(inputEl);
    const err = createFieldErrorEl(msg);
    inputEl.insertAdjacentElement("afterend", err);
    inputEl.setAttribute("aria-invalid", "true");
  }

  function removeFieldError(inputEl) {
    if (!inputEl) return;
    inputEl.removeAttribute("aria-invalid");
    const next = inputEl.nextElementSibling;
    if (next && next.classList.contains("field-error")) next.remove();
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

    if (!emailInput || !emailVerifiedInput) {
      console.warn("EmailOtpModule: email inputs missing; skipping.");
      return;
    }

    const OTP_LENGTH = 6;
    const RESEND_COOLDOWN = 60;
    let resendTimer = 0;

    // local field-error helpers (uses shared helpers)
    function showEmailError(msg) {
      showFieldError(emailInput, msg);
    }
    function clearEmailError() {
      removeFieldError(emailInput);
    }

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
        input.dataset.idx = i;
        otpInputsWrapper.appendChild(input);
      }
      setupOtpInputBehavior();
    }

    function setupOtpInputBehavior() {
      if (!otpInputsWrapper) return;
      const inputs = Array.from(otpInputsWrapper.querySelectorAll("input"));

      inputs.forEach((inp, idx) => {
        inp.addEventListener("keydown", (e) => {
          // Backspace behavior
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

          // Arrow navigation
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

          // Allow digits
          if (/^[0-9]$/.test(e.key)) return;

          // Allow Ctrl+V / Cmd+V (paste)
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") return;

          // Allow tab
          if (e.key === "Tab") return;

          // Block everything else
          e.preventDefault();
        });

        // Input behavior
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

        // Paste behavior
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

    // --- check if email is taken on server (new email) ---
    async function checkEmailExists(email) {
      if (!email) return true; // treat as taken if empty
      if (typeof axios === "undefined") {
        // fallback to fetch if axios not present
        try {
          const res = await fetch("/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          return !!data.exists;
        } catch (e) {
          console.error("checkEmailExists(fetch) failed:", e);
          return true;
        }
      }
      try {
        const res = await axios.post(
          "/check-email",
          { email },
          { withCredentials: true }
        );
        return !!res.data?.exists;
      } catch (err) {
        console.error("checkEmailExists:", err);
        return true; // fail-safe: treat as taken
      }
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
      // send OTP to ORIGINAL email (backend does the routing)
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

    // Disable backdrop-click closing: remove any listener that closes modal on backdrop
    // (Do nothing here — modal should only close via cancel/close buttons or Escape)
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        otpModal &&
        otpModal.classList.contains("show") &&
        cancelBtn
      )
        cancelBtn.click();
    });

    // email blur: check availability first, then open modal (if available)
    if (emailInput) {
      emailInput.addEventListener("blur", async () => {
        const newEmail = (emailInput.value || "").trim();
        const orig = (emailInput.dataset.originalEmail || "").trim();

        clearEmailError();

        // unchanged
        if (!newEmail || newEmail === orig) {
          emailVerifiedInput.value = "true";
          return;
        }

        emailVerifiedInput.value = "false";

        // basic email validation
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!re.test(newEmail)) {
          showEmailError("Enter a valid email address.");
          return;
        }

        // CHECK WITH SERVER first
        const taken = await checkEmailExists(newEmail);
        if (taken) {
          showEmailError("This email is already registered.");
          emailVerifiedInput.value = "false";
          return; // don't open modal
        }

        // available → open modal and send OTP to original email
        openModalForEmail(newEmail);
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
    const emailInput = el("emailInput"); // local reference
    const emailVerifiedInput = el("emailVerifiedInput"); // local reference
    const phoneInput = form.querySelector('input[name="phone"]');
    const dobInput = form.querySelector('input[name="dob"]');
    const submitBtn = el("openConfirm");

    // -------------------------------
    // Error Handling Helpers (use shared helpers)
    // -------------------------------
    function showError(elm, msg) {
      showFieldError(elm, msg);
    }

    function removeError(elm) {
      removeFieldError(elm);
    }

    function showImageError(msg) {
      if (!profileImageError) return;
      profileImageError.innerHTML = `<span class="field-error" style="
        color:#b00020;
        font-size:0.85rem;
        display:block;
        margin-top:4px;
      ">${msg}</span>`;
    }

    function clearImageError() {
      if (!profileImageError) return;
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
      if (!/^[6-9]\d{9}$/.test(v))
        return (
          showError(phoneInput, "Enter valid 10-digit Indian mobile number."),
          false
        );
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

      const age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      const exactAge =
        age - (m < 0 || (m === 0 && today.getDate() < d.getDate()) ? 1 : 0);
      if (exactAge < 18)
        return showError(dobInput, "You must be at least 18 years old."), false;
      removeError(dobInput);
      return true;
    }

    submitBtn.addEventListener("click", () => {
      // If any input has an error, do NOT open confirmation modal
      if (document.querySelector(".input-error")) {
        return;
      }

      // Also check email must be verified
      if (emailVerifiedInput.value !== "true") {
        showError(emailInput, "Please verify your email before submitting.");
        return;
      }

      // All good → open confirmation modal
      openConfirmModal();
    });

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
    // Email Verification Logic (hooked, but actual flow lives in EmailOtpModule)
    // -------------------------------
    // emailInput blur listener is handled in EmailOtpModule (to avoid duplicates)
    emailInput?.addEventListener("input", () => {
      const orig = emailInput.dataset.originalEmail?.trim() || "";
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

  /* ------------------------------------------------------------------
     PROFILE IMAGE CROPPER + PREVIEW + FORM SUBMISSION WITH AXIOS
  ------------------------------------------------------------------- */

  let cropper;
  let croppedImageFile = null;

  // DOM elements
  const profileInput = el("profileInput");
  const cropperModal = el("cropperModal");
  const cropImage = el("cropImage");
  const applyCrop = el("applyCrop");
  const cancelCrop = el("cancelCrop");
  const cropClose = el("cropClose");
  const previewImg = el("profilePreview");

  const deleteBtn = el("deleteProfileBtn");
  const deleteModal = el("deletePhotoModal");
  const cancelDelete = el("cancelDeletePhoto");
  const confirmDelete = el("confirmDeletePhoto");
  const deleteFlag = el("deleteProfileImage");

  const openConfirm = el("openConfirm");
  const confirmModal = el("confirmModal");
  const cancelBtn = el("cancelBtn");
  const confirmBtn = el("confirmBtn");

  /* ---------------------------------------------------------------
     1. OPEN CROPPER WHEN USER SELECTS IMAGE
  ---------------------------------------------------------------- */
  if (profileInput) {
    profileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        cropImage.src = event.target.result;
        if (cropper) cropper.destroy();
        cropperModal.style.display = "flex";
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
  }

  /* ---------------------------------------------------------------
     2. CLOSE CROPPER
  ---------------------------------------------------------------- */
  [cancelCrop, cropClose].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      cropperModal.style.display = "none";
      if (cropper) cropper.destroy();
    });
  });

  /* ---------------------------------------------------------------
     3. APPLY CROP → CONVERT TO FILE → SHOW PREVIEW
     (IMPORTANT FIX: remove original file so multer doesn't upload 2 files)
  ---------------------------------------------------------------- */
  if (applyCrop) {
    applyCrop.addEventListener("click", () => {
      if (!cropper) return;

      const canvas = cropper.getCroppedCanvas({ width: 600, height: 600 });

      canvas.toBlob(
        (blob) => {
          croppedImageFile = new File([blob], "croppedImage.jpg", {
            type: "image/jpeg",
          });
          const previewUrl = URL.createObjectURL(croppedImageFile);
          previewImg.src = previewUrl;

          // Remove original un-cropped file
          if (profileInput) profileInput.value = "";

          cropperModal.style.display = "none";
          cropper.destroy();
        },
        "image/jpeg",
        0.9
      );
    });
  }

  /* ---------------------------------------------------------------
     4. DELETE PHOTO
  ---------------------------------------------------------------- */
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (deleteModal) deleteModal.style.display = "flex";
    });
  }

  if (cancelDelete) {
    cancelDelete.addEventListener("click", () => {
      if (deleteModal) deleteModal.style.display = "none";
    });
  }

  if (confirmDelete) {
    confirmDelete.addEventListener("click", () => {
      if (deleteFlag) deleteFlag.value = "true";
      croppedImageFile = null;
      if (profileInput) profileInput.value = "";
      if (previewImg) previewImg.src = "/images/people.png";
      if (deleteModal) deleteModal.style.display = "none";
    });
  }

  /* ---------------------------------------------------------------
     5. OPEN CONFIRM SAVE MODAL
  ---------------------------------------------------------------- */
  if (openConfirm) {
    openConfirm.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirmModal) confirmModal.style.display = "flex";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (confirmModal) confirmModal.style.display = "none";
    });
  }

  const CustomSwal = {
    show: (title = "Please wait...", text = "Processing...") => {
      const box = el("customSwal");
      if (!box) return;
      el("customSwalTitle").textContent = title;
      el("customSwalText").textContent = text;
      box.classList.add("show");
    },
    hide: () => {
      const box = el("customSwal");
      if (!box) return;
      box.classList.remove("show");
    },
  };

  /* ---------------------------------------------------------------
     6. FINAL SAVE USING AXIOS (ONLY CROPPED FILE SENT)
  ---------------------------------------------------------------- */
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      // Prevent bad submission
      if (!window.__profileFormValidation.validateAll()) {
        CustomSwal.hide();
        return;
      }

      // Email must be verified
      const emailInputEl = el("emailInput");
      if (!window.__profileFormValidation.isEmailVerified()) {
        showFieldError(emailInputEl, "Email must be verified before saving.");
        CustomSwal.hide();
        return;
      }

      if (confirmModal) confirmModal.style.display = "none";

      const form = document.querySelector(".edit-form");
      const formData = new FormData(form);
      const userIdEl = el("userId");
      const userId = userIdEl ? userIdEl.value : "";

      if (croppedImageFile) {
        formData.append("profileImage", croppedImageFile);
      }

      CustomSwal.show("Saving Profile...", "Please wait...");

      try {
        const res = await axios.post(
          `/account/profile/edit-profile/${userId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (res.data && res.data.success) {
          CustomSwal.hide();
          window.location.href = res.data.redirect;
        } else {
          CustomSwal.hide();
          console.error("Save response:", res.data);
        }
      } catch (err) {
        CustomSwal.hide();
        console.error("Profile update failed:", err);
      }
    });
  }
})();
