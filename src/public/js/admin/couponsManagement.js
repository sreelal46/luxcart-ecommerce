function initTooltips() {
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el);
  });
}
document.addEventListener("DOMContentLoaded", initTooltips);

document.addEventListener("DOMContentLoaded", () => {
  /* ===============================
     VALIDATION SETUP (REUSABLE)
     =============================== */
  function setupCouponValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const today = new Date().toISOString().split("T")[0];
    const inputs = form.querySelectorAll("input, select");

    const validFrom = form.querySelector('[name="validFrom"]');
    const validTo = form.querySelector('[name="validTo"]');

    validFrom.setAttribute("min", today);

    function showError(input, message) {
      input.classList.add("is-invalid");

      let error = input.nextElementSibling;
      if (!error || !error.classList.contains("invalid-feedback")) {
        error = document.createElement("div");
        error.className = "invalid-feedback";
        input.after(error);
      }
      error.innerText = message;
    }

    function clearError(input) {
      input.classList.remove("is-invalid");
      if (input.nextElementSibling?.classList.contains("invalid-feedback")) {
        input.nextElementSibling.remove();
      }
    }

    function validateField(input) {
      const name = input.name;
      const value = input.value.trim();

      clearError(input);

      if (!value) {
        showError(input, "This field is required");
        return false;
      }

      if (input.type === "number") {
        const num = Number(value);

        // Minimum Order Amount → allow 0
        if (name === "minOrderAmount" && num < 0) {
          showError(input, "Minimum order cannot be negative");
          return false;
        }

        // All other number fields must be > 0
        if (name !== "minOrderAmount" && num <= 0) {
          showError(input, "Value must be greater than zero");
          return false;
        }
      }

      if (name === "validFrom") {
        if (value < today) {
          showError(input, "From date cannot be in the past");
          return false;
        }
        validTo.setAttribute("min", value);
      }

      if (name === "validTo") {
        if (value <= validFrom.value) {
          showError(input, "To date must be greater than From date");
          return false;
        }
      }

      return true;
    }

    // live validation
    inputs.forEach((input) => {
      input.addEventListener("input", () => validateField(input));
      input.addEventListener("change", () => validateField(input));
    });

    // final validation on submit
    form.addEventListener("submit", (e) => {
      let isValid = true;
      inputs.forEach((input) => {
        if (!validateField(input)) isValid = false;
      });

      if (!isValid) {
        e.preventDefault();
      }
    });
  }

  setupCouponValidation("addCouponForm");
  setupCouponValidation("editCouponForm");

  /* ===============================
     SET COUPON ID ON EDIT MODAL
     =============================== */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".edit-coupon-btn");
    if (!btn) return;

    const modal = document.getElementById("editCouponModal");
    modal.dataset.id = btn.dataset.id;
  });

  /* ===============================
     ADD COUPON (AXIOS)
     =============================== */
  document
    .getElementById("addCouponForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;

      if (!form.checkValidity()) return;

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      data.discount = Number(data.discount);
      data.minOrderAmount = Number(data.minOrderAmount);
      data.usageLimit = Number(data.usageLimit);
      data.perUserLimit = Number(data.perUserLimit);
      data.isActive = data.isActive === "true";

      try {
        const res = await axios.post(
          "/admin/coupons-management/addCoupon",
          data
        );

        if (res.data.success) {
          bootstrap.Modal.getInstance(
            document.getElementById("addCouponModal")
          ).hide();

          form.reset();
          Swal.fire({
            icon: "success",
            title: "Coupon Added!",
            text: "The Coupon has been added successfully.",
            timer: 1400,
            showConfirmButton: false,
          }).then(() => window.location.reload());
        } else {
          Swal.fire({
            icon: "warning",
            title: "Failed",
            text: res.data.alert || "Failed to add coupon.",
          });
        }
      } catch (error) {
        console.error("Error from offer add coupon", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.alert || "INTERNAL SERVER ERROR",
        });
      }
    });

  /* ===============================
     EDIT COUPON
     =============================== */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".edit-coupon-btn");
    if (!btn) return;

    const modal = document.getElementById("editCouponModal");
    modal.dataset.id = btn.dataset.id;

    const form = modal.querySelector("#editCouponForm");

    // helper for date input
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      return new Date(dateStr).toISOString().split("T")[0];
    };

    form.elements["code"].value = btn.dataset.code || "";
    form.elements["discountType"].value = btn.dataset.discounttype || "";
    form.elements["discount"].value = btn.dataset.discountvalue || "";
    form.elements["minOrderAmount"].value = btn.dataset.minorder || "";
    form.elements["usageLimit"].value = btn.dataset.usagelimit || "";
    form.elements["perUserLimit"].value = btn.dataset.usageperuser || "";
    form.elements["isActive"].value =
      btn.dataset.active === "true" ? "true" : "false";
    form.elements["validFrom"].value = formatDate(btn.dataset.validfrom);
    form.elements["validTo"].value = formatDate(btn.dataset.validto);
  });

  document
    .getElementById("editCouponForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;

      if (!form.checkValidity()) return;

      const modal = document.getElementById("editCouponModal");
      const couponId = modal.dataset.id;

      if (!couponId) {
        alert("Coupon ID missing");
        return;
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      data.discount = Number(data.discount);
      data.minOrderAmount = Number(data.minOrderAmount);
      data.usageLimit = Number(data.usageLimit);
      data.perUserLimit = Number(data.perUserLimit);
      data.isActive = data.isActive === "true";

      try {
        const res = await axios.put(
          `/admin/coupons-management/editCoupon/${couponId}`,
          data
        );

        if (res.data.success) {
          bootstrap.Modal.getInstance(modal).hide();
          form.reset();
          Swal.fire({
            icon: "success",
            title: "Coupon Edited!",
            text: "The Coupon has been Edited successfully.",
            timer: 1400,
            showConfirmButton: false,
          }).then(() => window.location.reload());
        } else {
          Swal.fire({
            icon: "warning",
            title: "Failed",
            text: res.data.alert || "Failed to edit coupon.",
          });
        }
      } catch (error) {
        console.error("Error from offer edit coupon", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.alert || "INTERNAL SERVER ERROR",
        });
      }
    });

  let selectedCouponId = null;

  /* ============================
   OPEN DELETE MODAL
   ============================ */
  document.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".delete-coupon-btn");
    if (!deleteBtn) return;

    // store selected coupon id
    selectedCouponId = deleteBtn.dataset.id;

    // show coupon code in modal
    document.getElementById("deleteCouponName").innerText =
      deleteBtn.dataset.code || "";

    // open modal
    const modalEl = document.getElementById("confirmListModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  });

  /* ============================
   CONFIRM DELETE
   ============================ */
  document
    .getElementById("confirmDeleteCoupon")
    .addEventListener("click", async () => {
      if (!selectedCouponId) return;

      try {
        const res = await axios.patch(
          `/admin/coupons-management/softDeleteCoupon/${selectedCouponId}`
        );

        if (res.data.success) {
          // close modal
          bootstrap.Modal.getInstance(
            document.getElementById("confirmListModal")
          ).hide();

          Swal.fire({
            icon: "success",
            title: "Coupon Updated",
            text: "Coupon has been listed / unlisted successfully.",
            timer: 1400,
            showConfirmButton: false,
          }).then(() => window.location.reload());
        } else {
          Swal.fire({
            icon: "warning",
            title: "Failed",
            text: res.data.alert || "Failed to listed / unlisted coupon.",
          });
        }
      } catch (error) {
        console.error("Error listed / unlisted coupon", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.alert || "INTERNAL SERVER ERROR",
        });
      }
    });

  /* ============================
   RESET ON MODAL CLOSE
   ============================ */
  document
    .getElementById("confirmListModal")
    .addEventListener("hidden.bs.modal", () => {
      selectedCouponId = null;
      document.getElementById("deleteCouponName").innerText = "";
    });
});
