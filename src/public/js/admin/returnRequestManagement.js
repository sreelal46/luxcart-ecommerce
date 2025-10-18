// Search functionality
document
  .getElementById("searchReturnInput")
  .addEventListener("keyup", function () {
    const searchText = this.value.toLowerCase();
    const rows = document.querySelectorAll("#returnTableBody tr");
    rows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      row.style.display = rowText.includes(searchText) ? "" : "none";
    });
  });

// Populate Approve modal
const approveModal = document.getElementById("approveModal");
approveModal.addEventListener("show.bs.modal", function (event) {
  const button = event.relatedTarget;
  const orderId = button.getAttribute("data-orderid");
  document.getElementById("approveOrderId").textContent = orderId;
});

// Populate Reject modal
const rejectModal = document.getElementById("rejectModal");
rejectModal.addEventListener("show.bs.modal", function (event) {
  const button = event.relatedTarget;
  const orderId = button.getAttribute("data-orderid");
  document.getElementById("rejectOrderId").textContent = orderId;
});

// Approve action
document
  .getElementById("confirmApprove")
  .addEventListener("click", function () {
    console.log(
      "Approved:",
      document.getElementById("approveOrderId").textContent
    );
    const modal = bootstrap.Modal.getInstance(approveModal);
    modal.hide();
    // TODO: update table or call API
  });

// Reject action
document.getElementById("confirmReject").addEventListener("click", function () {
  console.log(
    "Rejected:",
    document.getElementById("rejectOrderId").textContent
  );
  const modal = bootstrap.Modal.getInstance(rejectModal);
  modal.hide();
  // TODO: update table or call API
});
