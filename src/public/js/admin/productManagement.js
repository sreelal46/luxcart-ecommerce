document.addEventListener("DOMContentLoaded", () => {
  let targetCheckbox = null;

  // When the toggle switch is changed, save the checkbox and show confirmation modal
  document.body.addEventListener("change", (e) => {
    if (e.target.classList.contains("form-check-input")) {
      targetCheckbox = e.target;

      // Revert toggle immediately to preserve old state until confirmed
      e.target.checked = !e.target.checked;

      // Show the confirmation modal using Bootstrap's API
      const confirmListModal = new bootstrap.Modal(
        document.getElementById("confirmListModal")
      );
      confirmListModal.show();
    }
  });

  // On modal show: (optional if you want to do something with the event)
  const confirmListModalEl = document.getElementById("confirmListModal");
  confirmListModalEl.addEventListener("show.bs.modal", (e) => {
    // You can access e.relatedTarget here if needed
  });

  // Confirm button click inside modal - proceed with PATCH request
  document
    .getElementById("confirmListModal")
    .querySelector(".btn-danger")
    .addEventListener("click", async () => {
      if (!targetCheckbox) return;

      const productId = targetCheckbox.dataset.id;
      const newStatus = !targetCheckbox.checked; // Because we reverted state initially

      // Get Bootstrap modal instance to close later
      const confirmModal = bootstrap.Modal.getInstance(confirmListModalEl);

      try {
        // Make PATCH request to update product status
        const res = await axios.patch(
          `/admin/products-management/soft-delete-product/${productId}`,
          { listed: newStatus }
        );

        confirmModal.hide();

        if (res.data.success) {
          // Update toggle to new state on success
          targetCheckbox.checked = newStatus;

          Swal.fire({
            icon: "success",
            title: "Product status updated!",
            text: "The product has been successfully updated.",
            timer: 1500,
            showConfirmButton: false,
          }).then(() => window.location.reload());
        } else {
          Swal.fire({
            icon: "error",
            title: "Failed!",
            text: res.data.message || "Failed to update product status.",
          });
        }
      } catch (err) {
        confirmModal.hide();

        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Something went wrong while updating the product status.",
        });
      }
    });

  // Cancel button reverts toggle state, removes focus, and cleans up modal/backdrop
  document
    .getElementById("confirmListModal")
    .querySelector(".btn-secondary")
    .addEventListener("click", () => {
      if (targetCheckbox) {
        targetCheckbox.checked = !targetCheckbox.checked;
        targetCheckbox.blur();
      }
      const confirmModal = bootstrap.Modal.getInstance(confirmListModalEl);
      if (confirmModal) confirmModal.hide();

      // Remove modal-open class and any leftover backdrops
      document.body.classList.remove("modal-open");
      let backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((bd) => bd.parentNode.removeChild(bd));
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const allProductTable = document.getElementById("allProductTable");
  const carTable = document.getElementById("carTable");
  const accessoryTable = document.getElementById("accessoryTable");
  const showCarsBtn = document.getElementById("showCars");
  const showAccessoriesBtn = document.getElementById("showAccessories");
  const showAllProductBtn = document.getElementById("showAllProduct");

  showCarsBtn.addEventListener("click", () => {
    carTable.style.display = "block";
    allProductTable.style.display = "none";
    accessoryTable.style.display = "none";
    showCarsBtn.classList.add("active");
    showAccessoriesBtn.classList.remove("active");
    showAllProductBtn.classList.remove("active");
  });

  showAccessoriesBtn.addEventListener("click", () => {
    accessoryTable.style.display = "block";
    allProductTable.style.display = "none";
    carTable.style.display = "none";
    showAccessoriesBtn.classList.add("active");
    showAllProductBtn.classList.remove("active");
    showCarsBtn.classList.remove("active");
  });

  showAllProductBtn.addEventListener("click", () => {
    allProductTable.style.display = "block";
    accessoryTable.style.display = "none";
    carTable.style.display = "none";
    showAllProductBtn.classList.add("active");
    showAccessoriesBtn.classList.remove("active");
    showCarsBtn.classList.remove("active");
  });
});
// ---------- STATE ----------
const state = {
  page: 1,
  search: "",
};
// ---------- DEBOUNCE ----------
function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ---------- LOAD PRODUCTS ----------
async function loadProducts(page = 1, search = state.search) {
  const res = await axios.get(`/admin/products-management`, {
    params: { page, search },
  });
  if (!res.data.success) return;

  const { fullProducts, totalPages } = res.data;
  console.log(fullProducts);
  state.page = page;
  state.search = search;

  renderProducts(fullProducts);
  initTooltips();
  renderPagination(totalPages, page);
}

// ---------- SEARCH ----------
document.getElementById("searchProduct").addEventListener(
  "input",
  debounce((e) => {
    const value = e.target.value.trim();
    loadProducts(1, value);
  }, 500)
);

// ---------- RENDER TABLE ----------
function renderProducts(data) {
  const tbody = document.querySelector("#allProductTable tbody");
  tbody.innerHTML = "";

  data.forEach((item, index) => {
    const isCar = !!item.engine;
    const variant = isCar ? item.variantIds?.[0] : null;
    const price = isCar ? variant?.price : item.price;

    const offer = isCar ? variant?.productOffer : item.productOffer;

    /* ===== OFFER BADGE ===== */
    let offerBadge = `
      <span class="badge rounded-pill bg-danger">NO OFFER</span>
    `;

    if (offer?.isActive) {
      if (offer.discountType === "Percentage") {
        offerBadge = `
          <span class="badge rounded-pill bg-success">
            ${offer.discountValue}% OFF
          </span>
        `;
      } else {
        offerBadge = `
          <span class="badge rounded-pill bg-success">
            ₹ ${offer.discountValue.toLocaleString("en-IN")} OFF
          </span>
        `;
      }
    } else if (offer.isConfigured) {
      offerBadge = `<span class="badge rounded-pill bg-success">
            CONFIGUERD
          </span>`;
    }

    /* ===== OFFER ACTION BUTTON ===== */
    let offerActionBtn = `
      <div data-bs-toggle="tooltip" title="Add offer">
        <button
          class="btn btn-sm btn-outline-warning add-offer-btn"
          data-bs-toggle="modal"
          data-bs-target="#offerModal"
          data-id="${item._id}"
          data-producttype="${isCar ? "car" : "accessory"}"
          data-name="${item.name}">
          <i class="bi bi-percent"></i>
        </button>
      </div>
    `;

    if (offer?.isConfigured) {
      offerActionBtn = `
        <div data-bs-toggle="tooltip" title="View configured offer">
          <button
            class="btn btn-sm btn-outline-info view-offer-btn"
            data-bs-toggle="modal"
            data-bs-target="#offerViewModal"
            data-discount-type="${offer.discountType}"
            data-discount-value="${offer.discountValue}"
            data-valid-from="${offer.validFrom}"
            data-valid-to="${offer.validTo}"
            data-producttype="${isCar ? "car" : "accessory"}"
            data-productid="${item._id}">
            <i class="bi bi-eye"></i>
          </button>
        </div>
      `;
    }

    if (offer?.isActive) {
      offerActionBtn = `
        <div data-bs-toggle="tooltip" title="Remove offer">
          <button
            class="btn btn-sm btn-outline-danger remove-offer-btn"
            data-bs-toggle="modal"
            data-bs-target="#removeOfferModal"
            data-producttype="${isCar ? "car" : "accessory"}"
            data-productid="${item._id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
    }

    const viewLink = isCar
      ? `/admin/products-management/view-car-product/${item._id}`
      : `/admin/products-management/view-accessories-product/${item._id}`;

    const editLink = isCar
      ? `/admin/products-management/edit-car-product/${item._id}`
      : `/admin/products-management/edit-accessories-product/${item._id}`;

    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td class="fw-semibold text-muted">${index + 1}</td>

        <td>
          <div class="fw-semibold text-dark">${item.name}</div>
        </td>

        <td class="text-muted">${item.category_id?.name || "-"}</td>
        <td class="text-muted">${item.brand_id?.name || "-"}</td>

        <td class="text-end fw-semibold">
          ${price != null ? `₹ ${price.toLocaleString("en-IN")}` : "-"}
        </td>

        <td class="text-center">
          ${offerBadge}
        </td>

        <td class="text-center">
          ${
            item.isListed
              ? `<span class="badge bg-success-subtle text-success">Listed</span>`
              : `<span class="badge bg-danger-subtle text-danger">Unlisted</span>`
          }
        </td>

        <td class="text-center">
          <div class="d-flex justify-content-center gap-2">
            ${offerActionBtn}

            <div data-bs-toggle="tooltip" title="View product">
              <a href="${viewLink}" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-eye"></i>
              </a>
            </div>

            <div data-bs-toggle="tooltip" title="Edit product">
              <a href="${editLink}" class="btn btn-sm btn-outline-success">
                <i class="bi bi-pencil"></i>
              </a>
            </div>

            <div
              class="form-check form-switch"
              data-bs-toggle="tooltip"
              title="${item.isListed ? "Unlist product" : "List product"}">
              <input
                class="form-check-input"
                type="checkbox"
                data-id="${item._id}"
                ${item.isListed ? "checked" : ""}
                data-bs-toggle="modal"
                data-bs-target="#confirmListModal">
            </div>
          </div>
        </td>
      </tr>
      `
    );
  });

  initTooltips();
}

function initTooltips() {
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el, {
      placement: "top",
      trigger: "hover",
      delay: { show: 100, hide: 80 },
    });
  });
}

document.addEventListener("DOMContentLoaded", initTooltips);

// ---------- PAGINATION ----------
function renderPagination(totalPages, current) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  container.innerHTML += `
    <li class="page-item ${current === 1 ? "disabled" : ""}">
      <a class="page-link" style="cursor:pointer" onclick="loadProducts(${
        current - 1
      }, '${state.search}')">Prev</a>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    container.innerHTML += `
      <li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadProducts(${i}, '${
      state.search
    }')">${i}</a>
      </li>
    `;
  }

  container.innerHTML += `
    <li class="page-item ${current === totalPages ? "disabled" : ""}">
      <a class="page-link" style="cursor:pointer" onclick="loadProducts(${
        current + 1
      }, '${state.search}')">Next</a>
    </li>
  `;
}

/* ===============================
   ELEMENTS
================================ */
const offerForm = document.getElementById("offerForm");
const discountInput = offerForm.discountValue;
const validFromInput = offerForm.validFrom;
const validToInput = offerForm.validTo;

const discountError = document.getElementById("dicountError");
const fromError = document.getElementById("ValidateFromtError");
const toError = document.getElementById("ValidateTotError");

const confirmRemoveOffer = document.getElementById("confirmRemoveOffer");

/* ================================
   VIEW OFFER MODAL
================================ */
document.addEventListener("click", function (e) {
  const viewBtn = e.target.closest(".view-offer-btn");
  if (!viewBtn) return;

  const {
    discountType,
    discountValue,
    validFrom,
    validTo,
    productid,
    producttype,
    name,
  } = viewBtn.dataset;

  // Fill View Offer Modal
  document.getElementById("viewDiscountType").textContent = discountType || "—";

  document.getElementById("viewDiscountValue").textContent =
    discountType === "Percentage"
      ? `${discountValue}%`
      : `₹ ${Number(discountValue).toLocaleString("en-IN")}`;

  document.getElementById("viewValidFrom").textContent = new Date(
    validFrom
  ).toLocaleString();

  document.getElementById("viewValidTo").textContent = new Date(
    validTo
  ).toLocaleString();

  // Store ALL data on Delete button inside View modal
  const deleteBtn = document.getElementById("deleteOfferFromView");

  deleteBtn.dataset.discountType = discountType;
  deleteBtn.dataset.discountValue = discountValue;
  deleteBtn.dataset.validFrom = validFrom;
  deleteBtn.dataset.validTo = validTo;
  deleteBtn.dataset.productid = productid; // IMPORTANT: lowercase
  deleteBtn.dataset.producttype = producttype;
  deleteBtn.dataset.name = name;
});

/* ================================
   REMOVE OFFER MODAL (BOTH FLOWS)
================================ */
function fillRemoveOfferModal(btn) {
  const { discountType, discountValue, validFrom, validTo, productid, name } =
    btn.dataset;

  document.getElementById("removeOfferProductName").textContent =
    name || "this product";

  document.getElementById("removeDiscountType").textContent =
    discountType || "—";

  document.getElementById("removeDiscountValue").textContent =
    discountType === "Percentage"
      ? `${discountValue}%`
      : `₹ ${Number(discountValue).toLocaleString("en-IN")}`;

  document.getElementById("removeValidFrom").textContent = new Date(
    validFrom
  ).toLocaleString();

  document.getElementById("removeValidTo").textContent = new Date(
    validTo
  ).toLocaleString();

  document.getElementById("removeOfferProductId").value = productid;
  document.getElementById("removeOfferProductId").value = name;
}

document.addEventListener("click", function (e) {
  const removeBtn = e.target.closest(".remove-offer-btn, #deleteOfferFromView");
  if (!removeBtn) return;

  fillRemoveOfferModal(removeBtn);
});

/* ---------------- HELPERS ---------------- */
const isEmpty = (v) => !v || v.trim() === "";

function normalizeToMinute(date) {
  date.setSeconds(0, 0);
  return date;
}

/* ---------------- OPEN ADD MODAL ---------------- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-offer-btn");
  if (!btn) return;

  offerForm.dataset.productId = btn.dataset.id;
  offerForm.dataset.productType = btn.dataset.producttype;
  offerForm.reset();

  discountError.textContent = "";
  fromError.textContent = "";
  toError.textContent = "";
});

/* ---------------- LIVE VALIDATION ---------------- */

// Discount
function validateDiscount() {
  const v = Number(discountInput.value);
  discountError.textContent =
    !v || v <= 0 ? "Enter a valid positive number" : "";
  return v > 0;
}

// From DateTime
function validateFromDateTime() {
  if (isEmpty(validFromInput.value)) {
    fromError.textContent = "Start date & time is required";
    return false;
  }

  const from = normalizeToMinute(new Date(validFromInput.value));
  const now = normalizeToMinute(new Date());

  if (from < now) {
    fromError.textContent = "Start time must be current or future";
    return false;
  }

  fromError.textContent = "";
  return true;
}

// To DateTime
function validateToDateTime() {
  if (isEmpty(validToInput.value)) {
    toError.textContent = "Expiry date & time is required";
    return false;
  }

  if (!validateFromDateTime()) {
    toError.textContent = "Select valid start date & time first";
    return false;
  }

  const from = normalizeToMinute(new Date(validFromInput.value));
  const to = normalizeToMinute(new Date(validToInput.value));

  if (to <= from) {
    toError.textContent = "Expiry time must be greater than start time";
    return false;
  }

  toError.textContent = "";
  return true;
}

// Attach LIVE listeners
discountInput.addEventListener("input", validateDiscount);

validFromInput.addEventListener("input", validateFromDateTime);
validFromInput.addEventListener("change", validateFromDateTime);

validToInput.addEventListener("input", validateToDateTime);
validToInput.addEventListener("change", validateToDateTime);

/* ---------------- SUBMIT OFFER ---------------- */
offerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateDiscount() || !validateFromDateTime() || !validateToDateTime()) {
    return;
  }
  try {
    const res = await axios.put(
      `/admin/products-management/add-offer/${offerForm.dataset.productId}`,
      {
        discountType: offerForm.discountType.value,
        discountValue: Number(discountInput.value),
        validFrom: validFromInput.value,
        validTo: validToInput.value,
        productType: offerForm.dataset.productType,
      }
    );

    if (res.data.success) {
      bootstrap.Modal.getInstance(document.getElementById("offerModal")).hide();

      Swal.fire({
        icon: "success",
        title: "Offer Added",
        timer: 1400,
        showConfirmButton: false,
      }).then(() => location.reload());
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data?.alert || "Somthing went wrong",
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.response?.data?.alert || "INTERNAL SERVER ERROR",
    });
  }
});

/* ---------------- REMOVE OFFER ---------------- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".remove-offer-btn");
  if (!btn) return;

  const confirmBtn = document.getElementById("confirmRemoveOffer");

  // reset previous state
  confirmBtn.dataset.productId = "";
  confirmBtn.dataset.productType = "";

  confirmBtn.dataset.productId = btn.dataset.id;
  confirmBtn.dataset.productType = btn.dataset.producttype;
});

/* ---------------- REMOVE FROM VIEW OFFER ---------------- */
document.getElementById("deleteOfferFromView").addEventListener("click", () => {
  const confirmBtn = document.getElementById("confirmRemoveOffer");

  // 🔥 reset previous state
  confirmBtn.dataset.productId = "";
  confirmBtn.dataset.productType = "";

  confirmBtn.dataset.productId = document.getElementById(
    "deleteOfferFromView"
  ).dataset.productId;
  confirmBtn.dataset.productType = document.getElementById(
    "deleteOfferFromView"
  ).dataset.productType;
});

document
  .getElementById("confirmRemoveOffer")
  .addEventListener("click", async function () {
    try {
      const productId = this.dataset.productId;
      const productType = this.dataset.productType;

      if (!productId) {
        Swal.fire("Error", "Invalid product reference", "error");
        return;
      }

      const res = await axios.patch(
        `/admin/products-management/remove-offer/${productId}`,
        { productType }
      );

      if (res.data.success) {
        bootstrap.Modal.getInstance(
          document.getElementById("removeOfferModal")
        ).hide();

        Swal.fire({
          icon: "success",
          title: "Offer Removed",
          timer: 1200,
          showConfirmButton: false,
        }).then(() => location.reload());
      } else {
        Swal.fire("Error", res.data.alert || "Failed", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  });
