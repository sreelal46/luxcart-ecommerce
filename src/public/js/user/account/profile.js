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

  /* ==========================
    CUSTOM ERROR POPUP
  ========================== */
  const CustomSwal = {};

  CustomSwal.error = (title = "Error", text = "Something went wrong.") => {
    const box = document.getElementById("customSwalError");
    document.getElementById("customSwalErrorTitle").textContent = title;
    document.getElementById("customSwalErrorText").textContent = text;

    box.classList.add("show");

    document.getElementById("customSwalErrorBtn").onclick = () => {
      box.classList.remove("show");
      window.location.reload(); // <-- reload after closing
    };
  };

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
        async () => {
          try {
            const res = await axios.delete(
              `/account/addresses/delete-address/${btn.dataset.addressId}`
            );
            if (res.data.success) {
              window.location.reload();
            } else {
              CustomSwal.error(
                "Save Failed",
                res.data.alert || "Server error occurred."
              );
            }
          } catch (error) {
            CustomSwal.error(
              "Save Failed",
              error.response?.data.alert || "Server error occurred."
            );
          }
        }
      );
    });
  });

  document.querySelectorAll(".address-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openConfirmModal("Edit Address?", "Proceed to edit this address?", () => {
        window.location.href = `/account/addresses/edit-address/${btn.dataset.addressId}`;
      });
    });
  });

  document.querySelectorAll(".address-set-default-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openConfirmModal(
        "Set as Default?",
        "This address will become your default.",
        async () => {
          try {
            const res = await axios.patch(
              `/account/addresses/set-default-address/${btn.dataset.addressId}`
            );
            if (res.data.success) {
              window.location.reload();
            } else {
              CustomSwal.error(
                "Save Failed",
                res.data.alert || "Server error occurred."
              );
            }
          } catch (error) {
            CustomSwal.error(
              "Save Failed",
              error.response?.data.alert || "Server error occurred."
            );
          }
        }
      );
    });
  });
});
