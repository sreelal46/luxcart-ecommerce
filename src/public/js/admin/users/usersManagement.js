// Search functionality
document
  .getElementById("searchUserInput")
  .addEventListener("keyup", function () {
    const searchText = this.value.toLowerCase();
    const rows = document.querySelectorAll("#usersTableBody tr");
    rows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      row.style.display = rowText.includes(searchText) ? "" : "none";
    });
  });

// Populate Block/Unblock modal
const blockUserModal = document.getElementById("blockUserModal");
let currentAction = "";
let currentUser = "";
let currentUserId;

blockUserModal.addEventListener("show.bs.modal", function (event) {
  const button = event.relatedTarget;
  currentAction = button.getAttribute("data-action"); // block or unblock
  currentUser = button.getAttribute("data-user");
  currentUserId = button.getAttribute("data-id");

  document.getElementById("blockUserName").textContent = currentUser;
  document.getElementById("blockActionText").textContent = currentAction;
});

document
  .getElementById("confirmBlockUser")
  .addEventListener("click", async function () {
    try {
      // API request
      const res = await axios.patch(
        `/admin/users-management/block-unblock-user/${currentUserId}`
      );

      if (res.data.success) {
        await Swal.fire({
          title: `User ${
            res.data.status === "Block" ? "Blocked" : "Unblocked"
          }!`,
          text: `${currentUser} has been successfully ${
            res.data.status === "Block" ? "blocked" : "unblocked"
          }.`,
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
        });

        // Reload the page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);

      Swal.fire({
        title: "Error!",
        text: "Something went wrong while updating the user status.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }

    // Close modal after action
    const modal = bootstrap.Modal.getInstance(blockUserModal);
    modal.hide();
  });
