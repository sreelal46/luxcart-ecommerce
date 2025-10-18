// Populate Edit Modal from button data attributes
const editModal = document.getElementById("editCouponModal");
editModal.addEventListener("show.bs.modal", function (event) {
  const button = event.relatedTarget;
  const form = editModal.querySelector("form");

  form.querySelector('[name="code"]').value = button.getAttribute("data-code");
  form.querySelector('[name="discountType"]').value =
    button.getAttribute("data-discounttype");
  form.querySelector('[name="discount"]').value =
    button.getAttribute("data-discount");
  form.querySelector('[name="validFrom"]').value =
    button.getAttribute("data-validfrom");
  form.querySelector('[name="validTo"]').value =
    button.getAttribute("data-validto");
  form.querySelector('[name="usageLimit"]').value =
    button.getAttribute("data-usagelimit");
});

const deleteModal = document.getElementById("deleteCouponModal");
let couponToDelete = "";

deleteModal.addEventListener("show.bs.modal", function (event) {
  const button = event.relatedTarget;
  couponToDelete = button.getAttribute("data-code");
  document.getElementById("deleteCouponName").textContent = couponToDelete;
});

document
  .getElementById("confirmDeleteCoupon")
  .addEventListener("click", function () {
    // Here you can call your delete function or API
    console.log("Deleting coupon:", couponToDelete);

    // Optionally remove row from table
    const rows = document.querySelectorAll("#couponsTableBody tr");
    rows.forEach((row) => {
      if (row.querySelector("td:nth-child(2)").textContent === couponToDelete) {
        row.remove();
      }
    });

    // Close modal after deletion
    const modal = bootstrap.Modal.getInstance(deleteModal);
    modal.hide();
  });
