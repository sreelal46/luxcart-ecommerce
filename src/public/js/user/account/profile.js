document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ Elements ------------------ */

  const confirmModal = document.getElementById("confirmModal");
  const confirmTitle = document.getElementById("confirmModalTitle");
  const confirmText = document.getElementById("confirmModalText");
  const confirmCancel = document.getElementById("confirmCancel");
  const confirmOk = document.getElementById("confirmOk");

  /* ------------------ State ------------------ */
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

  /* ------------------ Edit Profile Info ------------------ */
  document.querySelectorAll("[data-user-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const userId = e.currentTarget.dataset.userId;
      console.log(userId);

      openConfirmModal(
        "Edit Profile?",
        "Do you want to edit your Profile.",
        () => {
          window.location.href = `/account/profile/edit-profile/${userId}`;
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
