document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ Elements ------------------ */

  const profileImg = document.getElementById("profileImg");
  const fileInput = document.getElementById("profileFileInput");
  const uploadHint = document.getElementById("uploadHint");

  const confirmModal = document.getElementById("confirmModal");
  const confirmTitle = document.getElementById("confirmModalTitle");
  const confirmText = document.getElementById("confirmModalText");
  const confirmCancel = document.getElementById("confirmCancel");
  const confirmOk = document.getElementById("confirmOk");

  /* ------------------ State ------------------ */
  let stagedImage = null;
  let confirmCallback = null;

  /* ------------------ Confirmation Modal ------------------ */
  function openConfirmModal(title, message, callback) {
    confirmTitle.textContent = title;
    confirmText.textContent = message;
    confirmCallback = callback;
    confirmModal.classList.remove("hidden");
  }

  function closeConfirmModal() {
    confirmCallback = null;
    confirmModal.classList.add("hidden");
  }

  confirmCancel.addEventListener("click", closeConfirmModal);
  confirmOk.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
  });

  /* ------------------ Image Preview ------------------ */
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Invalid image.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        stagedImage = ev.target.result;
        profileImg.src = stagedImage;
        uploadHint.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  /* ------------------ Edit Profile Info ------------------ */
  document.querySelectorAll("#editProfileBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openConfirmModal(
        "Edit Profile?",
        "Do you want to edit your Profile.",
        () => {
          window.location.href = "/account/profile/edit-profile";
        }
      );
    });
  });

  /* ------------------ Address Buttons ------------------ */
  document.querySelectorAll(".address-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openConfirmModal(
        "Delete Address?",
        "This address will be permanently removed.",
        () => console.log("Address deleted")
      );
    });
  });

  document.querySelectorAll(".address-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openConfirmModal("Edit Address?", "Proceed to edit this address?", () =>
        console.log("Open edit modal")
      );
    });
  });

  document.querySelectorAll(".address-set-default-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openConfirmModal(
        "Set as Default?",
        "This address will become your default.",
        () => console.log("Set default")
      );
    });
  });
});
