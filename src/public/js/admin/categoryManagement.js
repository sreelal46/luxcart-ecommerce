document.addEventListener("DOMContentLoaded", () => {
  // -------------------- Add Category --------------------
  const addCategoryForm = document.getElementById("addCategoryForm");
  const addAlert = document.getElementById("addAlert");
  const addCategoryModal = document.getElementById("addCategoryModal");

  const descriptionInput = document.getElementById("addDescription");
  const descriptionError = document.getElementById("descriptionError");
  const nameInput = document.getElementById("addName");
  const nameError = document.getElementById("nameError");
  const editCategoryDescriptionInput = document.getElementById(
    "editCategoryDescription"
  );
  const editDescriptionError = document.getElementById("editDescriptionError");
  const editCategoryNameInput = document.getElementById("editCategoryName");
  const editCategoryNameError = document.getElementById("editNameError");

  //category name validation
  function categoryNameValidation(input, error) {
    const categoryName = input.value.trim();
    if (!categoryName) {
      error.textContent = "Category name is Requaierd";
      error.style.display = "block";
      return false;
    } else if (categoryName.length < 3) {
      error.textContent = "Category name length must be greaterthan 3";
      error.style.display = "block";
      return false;
    } else {
      error.textContent = "";
      error.style.display = "none";
      return true;
    }
  }

  //category Country validation
  function categoryDescriptionValidation(input, error) {
    const categoryDescription = input.value.trim();
    if (!categoryDescription) {
      error.textContent = "Category Description Requaierd";
      error.style.display = "block";
      return false;
    } else if (categoryDescription.length < 10) {
      error.textContent = "Category Description length must be greaterthan 10";
      error.style.display = "block";
      return false;
    } else {
      error.textContent = "";
      error.style.display = "none";
      return true;
    }
  }

  //live validation
  nameInput.addEventListener("input", () =>
    categoryNameValidation(nameInput, nameError)
  );
  descriptionInput.addEventListener("input", () =>
    categoryDescriptionValidation(descriptionInput, descriptionError)
  );
  editCategoryNameInput.addEventListener("input", () =>
    categoryNameValidation(editCategoryNameInput, editCategoryNameError)
  );
  editCategoryDescriptionInput.addEventListener("input", () =>
    categoryDescriptionValidation(
      editCategoryDescriptionInput,
      editDescriptionError
    )
  );

  // Reset form when modal opens
  addCategoryModal.addEventListener("shown.bs.modal", () => {
    addCategoryForm.reset();
    addAlert.classList.add("d-none");
    // Remove any checked state
    document
      .querySelectorAll('#addCategoryModal input[type="radio"]')
      .forEach((r) => (r.checked = false));
  });

  // -------------------- Add Category --------------------

  addCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameValid = categoryNameValidation(nameInput, nameError);
    const descValid = categoryDescriptionValidation(
      descriptionInput,
      descriptionError
    );

    if (!nameValid || !descValid) return;

    // Manual validation for radio buttons
    const radioChecked = document.querySelector(
      'input[name="productType"]:checked'
    );
    if (!radioChecked) {
      addAlert.className = "alert alert-warning text-center";
      addAlert.textContent = "Please select a product type";
      addAlert.classList.remove("d-none");
      return;
    }

    const data = Object.fromEntries(
      [...new FormData(addCategoryForm).entries()].map(([k, v]) => [
        k,
        v.trim(),
      ])
    );

    try {
      const res = await axios.post(
        "/admin/categorys-management/add-category",
        data
      );

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Category Added!",
          text: "The category has been added successfully.",
          timer: 1400,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "warning",
          title: "Failed",
          text: res.data.alert || "Failed to add category.",
        });
      }
    } catch (error) {
      console.error("Error from category adding", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.alert || "Something went wrong.",
      });
    }
  });

  // -------------------- Edit Category --------------------
  const editCategoryForm = document.getElementById("editCategoryForm");
  const editAlert = document.getElementById("editAlert");
  const editCategoryModal = document.getElementById("editCategoryModal");

  editCategoryModal.addEventListener("show.bs.modal", (e) => {
    editAlert.classList.add("d-none");
    const btn = e.relatedTarget;
    document.getElementById("editCategoryId").value = btn.dataset.id;
    document.getElementById("editCategoryName").value = btn.dataset.name;
    document.getElementById("editCategoryDescription").value =
      btn.dataset.description;
    const type = btn.dataset.type;
    document.getElementById("editTypeCar").checked = type === "Car";
    document.getElementById("editTypeAccessories").checked =
      type === "Accessories";
  });

  editCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editCategoryId").value;

    const nameValid = categoryNameValidation(
      editCategoryNameInput,
      editCategoryNameError
    );
    const descValid = categoryDescriptionValidation(
      editCategoryDescriptionInput,
      editDescriptionError
    );

    if (!nameValid || !descValid) return;

    const data = Object.fromEntries(
      [...new FormData(editCategoryForm).entries()].map(([k, v]) => [
        k,
        v.trim(),
      ])
    );

    try {
      const res = await axios.put(
        `/admin/categorys-management/edit-category/${id}`,
        data
      );
      console.log(res.data);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Category updated successfully.",
          timer: 1400,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "warning",
          title: "Update Failed",
          text: res.data.alert || "Failed to update category.",
        });
      }
    } catch (error) {
      console.error("Error from category editing", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.alert || "Something went wrong.",
      });
    }
  });

  // -------------------- List/Unlist --------------------
  const confirmListModal = document.getElementById("confirmListModal");
  const categoriesDeleteConfirm = document.getElementById(
    "categoriesDeleteConfirm"
  );

  confirmListModal.addEventListener("show.bs.modal", (e) => {
    const btn = e.relatedTarget;
    if (!btn || !btn.dataset.id) return e.preventDefault();
    document.getElementById("categoriesId").value = btn.dataset.id;
  });

  categoriesDeleteConfirm.addEventListener("click", async () => {
    const id = document.getElementById("categoriesId").value;
    const modalInstance = bootstrap.Modal.getInstance(confirmListModal);
    try {
      const res = await axios.patch(
        `/admin/categorys-management/soft-delete-category/${id}`
      );
      modalInstance.hide();
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Category Updated!",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: res.data.message || "Failed to update category",
        });
      }
    } catch (err) {
      modalInstance.hide();
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Something went wrong while updating the category",
      });
    }
  });

  // -------------------- Live Search --------------------
  const searchInput = document.getElementById("searchCategory");
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll("#categoryTable tr").forEach((tr) => {
      const name =
        tr.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
      const type =
        tr.querySelector("td:nth-child(3)")?.textContent.toLowerCase() || "";
      tr.style.display =
        name.includes(query) || type.includes(query) ? "" : "none";
    });
  });

  const paginationSection = document.getElementById("categoryPagination");

  // =============== SEARCH & PAGINATION ===============
  function debounce(cb, delay = 400) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), delay);
    };
  }

  async function loadCategories(page = 1) {
    const search = searchInput.value.trim();
    try {
      const res = await axios.get("/admin/categorys-management", {
        params: { search, page, limit: 12 },
      });

      if (res.data.success) {
        renderCategories(res.data.result);
        initTooltips();
        renderPagination(res.data.currentPage, res.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
    }
  }

  window.loadCategoryPage = function (page) {
    loadCategories(page);
  };

  function renderCategories(categories = []) {
    const tbody = document.getElementById("categoryTable");
    if (!tbody) return;

    if (!Array.isArray(categories) || categories.length === 0) {
      tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          No Categories Found
        </td>
      </tr>
    `;
      return;
    }

    tbody.innerHTML = categories
      .map(
        (c, index) => `
      <tr>
        <td class="fw-semibold text-muted">${index + 1}</td>

        <td><div class="fw-semibold text-dark">${c.name}</div></td>

        <td>
          <span class="badge bg-light text-dark border">${c.product}</span>
        </td>

        <td class="text-muted">${c.description || "-"}</td>

        <td class="text-center">
          <span class="badge bg-light text-dark border">total product</span>
        </td>

        <td>
          <span class="badge rounded-pill bg-success">10% OFF</span>
        </td>

        <td>
          ${
            c.isListed
              ? `<span class="badge bg-success-subtle text-success fw-semibold">Listed</span>`
              : `<span class="badge bg-danger-subtle text-danger fw-semibold">Unlisted</span>`
          }
        </td>

        <td class="text-center">
          <div class="d-flex justify-content-center align-items-center gap-2">
${
  c.offer.isActive
    ? `
      <!-- REMOVE OFFER -->
      <div data-bs-toggle="tooltip" title="Remove offer">
        <button
          class="btn btn-sm btn-outline-danger remove-offer-btn"
          data-bs-toggle="modal"
          data-bs-target="#removeOfferModal"
          data-id="${c._id}"
          data-name="${c.name}">
          <i class="bi bi-trash-fill"></i>
        </button>
      </div>`
    : `
      <!-- ADD OFFER -->
      <div data-bs-toggle="tooltip" title="Add offer">
        <button
          class="btn btn-sm btn-outline-success add-offer-btn"
          data-bs-toggle="modal"
          data-bs-target="#offerModal"
          data-id="${c._id}"
          data-name="${c.name}">
          <i class="bi bi-percent"></i>
        </button>
      </div>`
}
            <!-- EDIT -->
            <div data-bs-toggle="tooltip" title="Edit category">
              <button
                class="btn btn-sm btn-outline-success"
                data-bs-toggle="modal"
                data-bs-target="#editCategoryModal"
                data-id="${c._id}"
                data-name="${c.name}"
                data-description="${c.description || ""}"
                data-type="${c.product}">
                <i class="bi bi-pencil"></i>
              </button>
            </div>

            <!-- LIST / UNLIST -->
            <div
              class="form-check form-switch m-0"
              data-bs-toggle="tooltip"
              title="${c.isListed ? "Unlist category" : "List category"}">
              <input
                class="form-check-input category-toggle-status"
                type="checkbox"
                data-id="${c._id}"
                ${c.isListed ? "checked" : ""}
                data-bs-toggle="modal"
                data-bs-target="#confirmListModal">
            </div>

          </div>
        </td>
      </tr>
    `
      )
      .join("");

    initTooltips();
  }

  function initTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      new bootstrap.Tooltip(el);
    });
  }

  initTooltips();

  function renderPagination(currentPage, totalPages) {
    if (!paginationSection) return;

    if (totalPages <= 1) {
      paginationSection.style.display = "none";
      return;
    }

    paginationSection.style.display = "block";

    let html = `<ul class="pagination justify-content-center">`;

    html += `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadCategoryPage(${
          currentPage - 1
        })">
          <i class="bi bi-chevron-left"></i>
        </a>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" style="cursor:pointer" onclick="loadCategoryPage(${i})">${i}</a>
        </li>
      `;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadCategoryPage(${
          currentPage + 1
        })">
          <i class="bi bi-chevron-right"></i>
        </a>
      </li>
    `;

    html += `</ul>`;

    paginationSection.innerHTML = html;
  }

  const debouncedSearch = debounce(loadCategories, 400);
  searchInput.addEventListener("input", debouncedSearch);
  // Add Offer Modal
  document.addEventListener("click", (e) => {
    if (e.target.closest(".add-offer-btn")) {
      const btn = e.target.closest(".add-offer-btn");
      document.getElementById("offerProductId").value = btn.dataset.id;
    }
  });

  // Remove Offer Modal
  document.addEventListener("click", (e) => {
    if (e.target.closest(".remove-offer-btn")) {
      const btn = e.target.closest(".remove-offer-btn");

      document.getElementById("removeOfferProductId").value = btn.dataset.id;
      document.getElementById("removeOfferProductName").innerText =
        btn.dataset.name;
    }
  });

  const offerForm = document.getElementById("offerForm");

  const discountInput = offerForm.discountValue;
  const validFromInput = offerForm.validFrom;
  const validToInput = offerForm.validTo;

  const discountError = document.getElementById("dicountError");
  const fromError = document.getElementById("ValidateFromtError");
  const toError = document.getElementById("ValidateTotError");

  /* ===============================
   HELPERS
================================ */
  function isEmpty(value) {
    return !value || value.trim() === "";
  }

  /* ===============================
   LIVE VALIDATION
================================ */

  // Discount
  discountInput.addEventListener("input", () => {
    const value = Number(discountInput.value);

    if (!value || value <= 0) {
      discountError.textContent = "Enter a valid positive number";
    } else {
      discountError.textContent = "";
    }
  });

  // helper: remove seconds & milliseconds
  function normalizeToMinute(date) {
    date.setSeconds(0, 0);
    return date;
  }

  // Valid From
  validFromInput.addEventListener("change", () => {
    if (isEmpty(validFromInput.value)) {
      fromError.textContent = "Start date & time is required";
      return;
    }

    const fromDate = normalizeToMinute(new Date(validFromInput.value));
    const now = normalizeToMinute(new Date());

    // only past is invalid
    if (fromDate < now) {
      fromError.textContent = "Start time must be current or future";
    } else {
      fromError.textContent = "";
    }
  });

  // Valid To
  validToInput.addEventListener("change", () => {
    if (isEmpty(validToInput.value)) {
      toError.textContent = "Expiry date & time is required";
      return;
    }

    if (isEmpty(validFromInput.value)) {
      toError.textContent = "Select start date first";
      return;
    }

    const fromDate = normalizeToMinute(new Date(validFromInput.value));
    const toDate = normalizeToMinute(new Date(validToInput.value));

    // SAME DATE allowed, but time must be greater
    if (toDate <= fromDate) {
      toError.textContent = "Expiry time must be greater than start time";
    } else {
      toError.textContent = "";
    }
  });

  /* ===============================
   SUBMIT
================================ */
  const addOfferBtn = document.getElementById("addOffer");
  const categoryId = addOfferBtn.getAttribute("data-id");

  // helper: normalize date to minute precision
  function normalizeToMinute(date) {
    date.setSeconds(0, 0);
    return date;
  }

  offerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;

    const discountType = offerForm.discountType.value;
    const discountValue = Number(discountInput.value);
    const validFrom = validFromInput.value;
    const validTo = validToInput.value;

    const now = normalizeToMinute(new Date());

    // Clear previous errors
    discountError.textContent = "";
    fromError.textContent = "";
    toError.textContent = "";

    // Discount validation
    if (!discountValue || discountValue <= 0) {
      discountError.textContent = "Enter a valid positive number";
      isValid = false;
    }

    // From validation
    if (isEmpty(validFrom)) {
      fromError.textContent = "Start date & time is required";
      isValid = false;
    } else {
      const fromDate = normalizeToMinute(new Date(validFrom));

      //only past is invalid
      if (fromDate < now) {
        fromError.textContent = "Start time must be current or future";
        isValid = false;
      }
    }

    // To validation
    if (isEmpty(validTo)) {
      toError.textContent = "Expiry date & time is required";
      isValid = false;
    } else if (!isEmpty(validFrom)) {
      const fromDate = normalizeToMinute(new Date(validFrom));
      const toDate = normalizeToMinute(new Date(validTo));

      // SAME DATE allowed, but time must be greater
      if (toDate <= fromDate) {
        toError.textContent = "Expiry time must be greater than start time";
        isValid = false;
      }
    }

    if (!isValid) return;

    try {
      const res = await axios.put(
        `/admin/categorys-management/add-offer/${categoryId}`,
        {
          discountType,
          discountValue,
          validFrom,
          validTo,
        }
      );

      if (res.data.success) {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("offerModal")
        );
        modal.hide();

        Swal.fire({
          icon: "success",
          title: "Offer Added!",
          text: "The Offer has been added successfully.",
          timer: 1400,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "warning",
          title: "Failed",
          text: res.data.alert || "Failed to add category.",
        });
      }
    } catch (error) {
      console.error("Error from offer adding to category", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.alert || "INTERNAL SERVER ERROR",
      });
    }
  });

  const removeOffer = document.getElementById("removeOffer");
  const confirmRemoveOffer = document.getElementById("confirmRemoveOffer");
  const dltCategoryId = removeOffer.getAttribute("data-id");

  confirmRemoveOffer.addEventListener("click", async () => {
    try {
      const res = await axios.patch(
        `/admin/categorys-management/remove-offer/${dltCategoryId}`
      );
      if (res.data.success) {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("removeOfferModal")
        );
        modal.hide();
        Swal.fire({
          icon: "success",
          title: "Offer Removed!",
          text: "The Offer has been removed successfully.",
          timer: 1400,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "warning",
          title: "Failed",
          text: res.data.alert || "Failed to add category.",
        });
      }
    } catch (error) {
      console.log("Error from remove offer from category", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.alert || "INTERNEL SERVER ERROR.",
      });
    }
  });
  // FIRST LOAD
  loadCategories(1);
});
