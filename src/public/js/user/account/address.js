document.addEventListener("DOMContentLoaded", () => {
  const confirmModal = document.getElementById("confirmModal");
  const confirmTitle = document.getElementById("confirmTitle");
  const confirmText = document.getElementById("confirmText");
  const confirmCancel = document.getElementById("confirmCancel");
  const confirmOk = document.getElementById("confirmOk");

  let confirmCallback = null;
  let prevFocus = null;

  /* ---- OPEN MODAL ---- */
  function openConfirmModal(title, message, callback) {
    confirmTitle.textContent = title;
    confirmText.textContent = message;
    confirmCallback = callback;

    confirmModal.classList.add("active");
    document.body.classList.add("modal-open");

    prevFocus = document.activeElement;
    confirmCancel.focus();
  }

  /* ---- CLOSE MODAL ---- */
  function closeConfirmModal() {
    confirmModal.classList.remove("active");
    document.body.classList.remove("modal-open");
    confirmCallback = null;

    if (prevFocus) prevFocus.focus();
  }

  confirmCancel.addEventListener("click", closeConfirmModal);

  confirmOk.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
  });

  // Click outside closes modal
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) closeConfirmModal();
  });

  // ESC key closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && confirmModal.classList.contains("active")) {
      closeConfirmModal();
    }
  });

  /* =============================
         ADDRESS BUTTON HANDLERS
       ============================= */

  // DELETE
  document.querySelectorAll(".address-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openConfirmModal(
        "Delete Address?",
        "This address will be permanently removed.",
        () => {
          axios
            .delete(`/account/address/delete/${btn.dataset.addressId}`)
            .then(() => location.reload())
            .catch((err) => console.error(err));
        }
      );
    });
  });

  // EDIT
  document.querySelectorAll(".address-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openConfirmModal(
        "Edit Address?",
        "Do you want to edit this address?",
        () => {
          window.location.href = `/account/address/edit/${btn.dataset.addressId}`;
        }
      );
    });
  });

  // SET AS DEFAULT
  document.querySelectorAll(".address-set-default-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openConfirmModal(
        "Set As Default?",
        "This address will become your default address.",
        () => {
          axios
            .post(`/account/address/set-default/${btn.dataset.addressId}`)
            .then(() => location.reload())
            .catch((err) => console.error(err));
        }
      );
    });
  });
});
