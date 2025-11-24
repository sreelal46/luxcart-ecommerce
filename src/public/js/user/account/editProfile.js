/**
 * profile.js
 * Single-file bundle for:
 *  - Confirm modal
 *  - Image cropper modal (Cropper.js)
 *  - Email OTP verification
 *
 * Each feature lives in its own IIFE and gracefully checks for required DOM elements.
 */

"use strict";

/* =========================
     CONFIRM MODAL
     ========================= */
(function ConfirmModalModule() {
  const modal = document.getElementById("confirmModal");
  const openBtn = document.getElementById("openConfirm");
  const cancelBtn = document.getElementById("cancelBtn");
  const confirmBtn = document.getElementById("confirmBtn");
  const form = document.querySelector("form");

  if (!modal || !openBtn || !cancelBtn || !confirmBtn || !form) {
    // If not present, silently skip but log for developer visibility.
    // (No hard failure so other modules still run.)
    console.warn(
      "ConfirmModalModule: missing one or more required elements (confirmModal/openConfirm/cancelBtn/confirmBtn/form)."
    );
    return;
  }

  openBtn.addEventListener("click", () => modal.classList.add("show"));
  cancelBtn.addEventListener("click", () => modal.classList.remove("show"));
  confirmBtn.addEventListener("click", () => form.submit());
})();

/* =========================
     IMAGE CROPPER (Cropper.js)
     ========================= */
(function ImageCropperModule() {
  // Required IDs
  const fileInput = document.getElementById("profileInput");
  const modal = document.getElementById("cropperModal");
  const cropImage = document.getElementById("cropImage");
  const profilePreview = document.getElementById("profilePreview");
  const croppedInput = document.getElementById("croppedImageInput");
  const applyCrop = document.getElementById("applyCrop");

  if (!fileInput || !modal || !cropImage || !profilePreview || !croppedInput) {
    console.warn(
      "ImageCropperModule: missing required DOM nodes. Expected IDs: profileInput, cropperModal, cropImage, profilePreview, croppedImageInput."
    );
    return;
  }

  if (!applyCrop) {
    console.error(
      'ImageCropperModule: missing Apply button with id="applyCrop". Module cannot function without it.'
    );
    return;
  }

  if (typeof Cropper === "undefined") {
    console.error(
      "ImageCropperModule: Cropper.js not loaded. Include Cropper.js and its CSS before profile.js."
    );
    return;
  }

  // Optional controls (may be absent)
  const cropClose = document.getElementById("cropClose");
  const cancelCrop = document.getElementById("cancelCrop");
  const rotateLeft = document.getElementById("rotateLeft");
  const rotateRight = document.getElementById("rotateRight");
  const zoomIn = document.getElementById("zoomIn");
  const zoomOut = document.getElementById("zoomOut");
  const resetCrop = document.getElementById("resetCrop");

  const OPEN_CLASS = "show";
  let cropper = null;
  let currentBlobURL = null;
  let cropperReady = false;

  // disable apply until cropper ready
  applyCrop.disabled = true;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // revoke old URL
    if (currentBlobURL) {
      try {
        URL.revokeObjectURL(currentBlobURL);
      } catch (err) {}
      currentBlobURL = null;
    }

    currentBlobURL = URL.createObjectURL(file);
    cropImage.src = currentBlobURL;

    // destroy previous cropper if any
    if (cropper) {
      try {
        cropper.destroy();
      } catch (err) {}
      cropper = null;
      cropperReady = false;
      applyCrop.disabled = true;
    }

    cropImage.onload = () => openModalAndInitCropper();
    cropImage.onerror = () => {
      console.error("ImageCropperModule: failed to load selected image.");
      if (currentBlobURL) {
        try {
          URL.revokeObjectURL(currentBlobURL);
        } catch (e) {}
        currentBlobURL = null;
      }
    };
  });

  function openModalAndInitCropper() {
    modal.classList.add(OPEN_CLASS);

    // small delay ensures layout is ready
    setTimeout(() => {
      try {
        cropper = new Cropper(cropImage, {
          aspectRatio: 1,
          viewMode: 1,
          autoCropArea: 0.85,
          background: false,
          movable: true,
          zoomable: true,
          rotatable: true,
          responsive: true,
          minContainerWidth: 200,
          minContainerHeight: 200,
          ready() {
            cropperReady = true;
            applyCrop.disabled = false;
          },
        });
      } catch (err) {
        console.error(
          "ImageCropperModule: failed to instantiate Cropper:",
          err
        );
        cropper = null;
      }
    }, 50);
  }

  function closeModalAndCleanup() {
    modal.classList.remove(OPEN_CLASS);
    if (cropper) {
      try {
        cropper.destroy();
      } catch (err) {}
      cropper = null;
    }
    cropperReady = false;
    applyCrop.disabled = true;

    if (currentBlobURL) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(currentBlobURL);
        } catch (e) {}
        currentBlobURL = null;
      }, 80);
    }

    try {
      fileInput.value = "";
    } catch (err) {}
  }

  if (cropClose) cropClose.addEventListener("click", closeModalAndCleanup);
  if (cancelCrop) cancelCrop.addEventListener("click", closeModalAndCleanup);

  if (rotateLeft)
    rotateLeft.addEventListener("click", () => {
      if (cropper) cropper.rotate(-90);
    });
  if (rotateRight)
    rotateRight.addEventListener("click", () => {
      if (cropper) cropper.rotate(90);
    });
  if (zoomIn)
    zoomIn.addEventListener("click", () => {
      if (cropper) cropper.zoom(0.1);
    });
  if (zoomOut)
    zoomOut.addEventListener("click", () => {
      if (cropper) cropper.zoom(-0.1);
    });
  if (resetCrop)
    resetCrop.addEventListener("click", () => {
      if (cropper) cropper.reset();
    });

  applyCrop.addEventListener("click", () => {
    if (!cropper) {
      console.error(
        "ImageCropperModule: apply clicked but cropper is not available."
      );
      return;
    }
    if (!cropperReady) {
      console.warn("ImageCropperModule: cropper not ready yet.");
      return;
    }

    let canvas = null;
    try {
      canvas = cropper.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingQuality: "high",
      });
    } catch (err) {
      console.error("ImageCropperModule: getCroppedCanvas() error:", err);
      return;
    }

    if (!canvas || !canvas.width || !canvas.height) {
      console.error("ImageCropperModule: invalid cropped canvas.");
      return;
    }

    try {
      const dataURL = canvas.toDataURL("image/jpeg", 0.9);
      profilePreview.src = dataURL;
      croppedInput.value = dataURL;
      closeModalAndCleanup();
    } catch (err) {
      console.error(
        "ImageCropperModule: failed to convert canvas to data URL:",
        err
      );
    }
  });

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains(OPEN_CLASS))
      closeModalAndCleanup();
  });

  // backdrop click closes
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModalAndCleanup();
  });

  // debug exposure
  window.__profileCropper = {
    getCropper: () => cropper,
    isReady: () => cropperReady,
  };
})();

/* =========================
   DELETE PROFILE PHOTO MODAL
   ========================= */
(function DeletePhotoModule() {
  const deleteBtn = document.getElementById("deleteProfileBtn");
  const modal = document.getElementById("deletePhotoModal");
  const cancelBtn = document.getElementById("cancelDeletePhoto");
  const confirmBtn = document.getElementById("confirmDeletePhoto");

  const profilePreview = document.getElementById("profilePreview");
  const fileInput = document.getElementById("profileInput");
  const croppedInput = document.getElementById("croppedImageInput");
  const deleteFlag = document.getElementById("deleteProfileImage");

  if (!deleteBtn || !modal || !cancelBtn || !confirmBtn) return;

  const PLACEHOLDER = "/assets/images/avatar-placeholder.png"; // change as needed

  // Open modal
  deleteBtn.addEventListener("click", () => {
    modal.classList.add("show");
  });

  // Close modal
  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  // Confirm delete
  confirmBtn.addEventListener("click", () => {
    // Reset image to placeholder
    if (profilePreview) profilePreview.src = PLACEHOLDER;

    // Clear file input so browser doesn't keep old file
    if (fileInput) {
      try {
        fileInput.value = "";
      } catch (e) {}
    }

    // Clear cropped value
    if (croppedInput) croppedInput.value = "";

    // Set delete flag for server
    if (deleteFlag) deleteFlag.value = "true";

    modal.classList.remove("show");
  });

  // Close if clicking backdrop
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });
})();

/* =========================
     EMAIL OTP VERIFICATION
     ========================= */
(function EmailOtpModule() {
  const emailInput = document.getElementById("emailInput");
  const emailVerifiedInput = document.getElementById("emailVerifiedInput");
  const otpModal = document.getElementById("otpModal");
  const otpTargetEmail = document.getElementById("otpTargetEmail");
  const otpInputsWrapper = document.getElementById("otpInputs");
  const verifyBtn = document.getElementById("verifyOtpBtn");
  const cancelBtn = document.getElementById("cancelOtpBtn");
  const closeBtn = document.getElementById("otpClose");
  const resendBtn = document.getElementById("resendBtn");
  const resendTimerEl = document.getElementById("resendTimer");
  const otpMessage = document.getElementById("otpMessage");
  const form = document.querySelector("form");

  // Basic presence checks
  if (
    !emailInput ||
    !emailVerifiedInput ||
    !otpModal ||
    !otpTargetEmail ||
    !otpInputsWrapper ||
    !verifyBtn ||
    !cancelBtn ||
    !closeBtn ||
    !resendBtn ||
    !resendTimerEl ||
    !otpMessage ||
    !form
  ) {
    console.warn(
      "EmailOtpModule: some OTP-related DOM nodes are missing. Expected IDs: emailInput, emailVerifiedInput, otpModal, otpTargetEmail, otpInputs, verifyOtpBtn, cancelOtpBtn, otpClose, resendBtn, resendTimer, otpMessage."
    );
    // If form exists, we leave form submit behavior intact (module optional)
    // But we still try to build inputs if wrapper exists.
  }

  const originalEmail = emailInput
    ? emailInput.dataset.originalEmail || ""
    : "";

  const OTP_LENGTH = 6;
  let expectedOtp = null;
  let resendCooldown = 60; // seconds
  let resendTimer = 0;

  function generateDevOtp() {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    expectedOtp = code;
    console.log("[DEV] Generated OTP for verification:", code);
    showMessage("A verification code was generated (dev). Check console.");
  }

  window.setExpectedOtp = function (code) {
    expectedOtp = String(code || "").trim();
    console.log("[INFO] expectedOtp set via setExpectedOtp()");
  };

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
      input.setAttribute("aria-label", "OTP digit " + (i + 1));
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
        const digits = paste.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
        digits.forEach((d, i) => {
          if (inputs[i]) inputs[i].value = d;
        });

        const firstEmpty = inputs.find((i) => !i.value);
        if (firstEmpty) firstEmpty.focus();
        else inputs[inputs.length - 1].focus();
      });
    });
  }

  function openModalForEmail(newEmail) {
    if (!otpModal || !otpTargetEmail) return;
    otpTargetEmail.textContent = newEmail;
    buildOtpInputs();
    showMessage("");
    if (emailVerifiedInput) emailVerifiedInput.value = "false";
    otpModal.classList.add("show");
    // Developer: comment/uncomment as needed.
    // generateDevOtp();
    startResendCooldown();
  }

  function closeModal() {
    if (!otpModal) return;
    otpModal.classList.remove("show");
    stopResendCooldown();
    clearOtpInputs();
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

  function showMessage(msg, success) {
    if (!otpMessage) return;
    otpMessage.textContent = msg || "";
    otpMessage.style.color = success ? "green" : "";
  }

  if (verifyBtn) {
    verifyBtn.addEventListener("click", () => {
      const code = getEnteredOtp();
      if (code.length !== OTP_LENGTH) {
        showMessage("Enter the full " + OTP_LENGTH + "-digit code.", false);
        return;
      }
      if (!expectedOtp) {
        showMessage(
          "No verification code available. Ask server to send code or use dev OTP.",
          false
        );
        return;
      }

      if (String(code) === String(expectedOtp)) {
        showMessage("Email verified successfully", true);
        if (emailVerifiedInput) emailVerifiedInput.value = "true";
        setTimeout(closeModal, 800);
      } else {
        showMessage("Incorrect code — try again.", false);
      }
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener("click", () => {
      if (resendTimer > 0) return;
      // In real flow: call backend to resend and set expectedOtp via setExpectedOtp()
      generateDevOtp();
      startResendCooldown();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (emailInput) emailInput.value = emailInput.dataset.originalEmail || "";
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

  function startResendCooldown() {
    resendTimer = resendCooldown;
    updateResendUI();
    if (resendBtn) resendBtn.disabled = true;

    if (window.__otpResendInterval) clearInterval(window.__otpResendInterval);
    window.__otpResendInterval = setInterval(() => {
      resendTimer -= 1;
      updateResendUI();
      if (resendTimer <= 0) {
        clearInterval(window.__otpResendInterval);
        window.__otpResendInterval = null;
        if (resendBtn) resendBtn.disabled = false;
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
    if (resendBtn) resendBtn.disabled = false;
  }

  function updateResendUI() {
    if (!resendTimerEl) return;
    resendTimerEl.textContent = resendTimer > 0 ? "(" + resendTimer + "s)" : "";
    if (resendBtn) {
      resendBtn.style.opacity = resendTimer > 0 ? "0.6" : "1";
    }
  }

  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      const newEmail = (emailInput.value || "").trim();
      const orig = (emailInput.dataset.originalEmail || "").trim();

      if (!newEmail || newEmail === orig) {
        if (emailVerifiedInput) emailVerifiedInput.value = "true";
        return;
      }

      if (emailVerifiedInput) emailVerifiedInput.value = "false";
      openModalForEmail(newEmail);
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      const verified =
        emailVerifiedInput && emailVerifiedInput.value === "true";
      if (!verified) {
        e.preventDefault();
        openModalForEmail(emailInput ? emailInput.value.trim() : "");
        showMessage("Please verify your new email before saving.", false);
        return false;
      }
      // else allow submit
    });
  }

  // initial setup
  buildOtpInputs();
  if (emailVerifiedInput) emailVerifiedInput.value = "true";

  window.__emailVerification = {
    setExpectedOtp: (c) => {
      window.setExpectedOtp(c);
    },
    openModal: () => {
      if (emailInput) openModalForEmail(emailInput.value || "");
    },
  };
})();
