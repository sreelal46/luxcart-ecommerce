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
          data,
        );

        if (res.data.success) {
          bootstrap.Modal.getInstance(
            document.getElementById("addCouponModal"),
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

    // Helper to format date for <input type="date">
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d)) return "";
      return d.toISOString().split("T")[0]; // YYYY-MM-DD
    };

    // Fill text / number inputs
    form.elements["code"].value = btn.dataset.code || "";
    form.elements["discount"].value = btn.dataset.discountvalue || "";
    form.elements["minOrderAmount"].value = btn.dataset.minorder || "";
    form.elements["usageLimit"].value = btn.dataset.usagelimit || "";
    form.elements["perUserLimit"].value = btn.dataset.usageperuser || "";

    // // Fill select inputs
    // if (form.elements["discountType"]) {
    //   const type = btn.dataset.discounttype || "percentage";
    //   form.elements["discountType"].value = type.toLowerCase();
    // }

    // Fill date inputs
    if (form.elements["validFrom"]) {
      form.elements["validFrom"].value = formatDate(btn.dataset.validfrom);
    }
    if (form.elements["validTo"]) {
      form.elements["validTo"].value = formatDate(btn.dataset.validto);
    }
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
          data,
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
  let selectedCouponCode = "";
  let selectedAction = "";
  let selectedCheckbox = null;

  /* ============================
     OPEN CONFIRM MODAL
     ============================ */
  document.addEventListener("click", (e) => {
    const wrapper = e.target.closest(".update-coupon-btn");
    if (!wrapper) return;

    const checkbox = wrapper.querySelector(".form-check-input");
    if (!checkbox) return;

    // prevent checkbox toggle
    e.preventDefault();

    selectedCheckbox = checkbox;
    selectedCouponId = checkbox.dataset.id;
    selectedCouponCode = checkbox.dataset.code;

    selectedAction = checkbox.checked ? "unlist" : "list";

    document.getElementById("confirmMessage").innerHTML = `
      Are you sure you want to <strong>${selectedAction.toUpperCase()}</strong>
      the coupon <strong>${selectedCouponCode}</strong>?
    `;

    const modal = new bootstrap.Modal(
      document.getElementById("confirmListModal"),
    );
    modal.show();
  });

  /* ============================
     CONFIRM LIST / UNLIST
     ============================ */
  document
    .getElementById("confirmListUnlistBtn")
    .addEventListener("click", async () => {
      if (!selectedCouponId) return;

      try {
        const res = await axios.patch(
          `/admin/coupons-management/softDeleteCoupon/${selectedCouponId}`,
        );

        if (res.data.success) {
          // toggle checkbox manually
          selectedCheckbox.checked = !selectedCheckbox.checked;

          bootstrap.Modal.getInstance(
            document.getElementById("confirmListModal"),
          ).hide();

          Swal.fire({
            icon: "success",
            title: `Coupon ${selectedAction}ed`,
            text: `Coupon has been ${selectedAction}ed successfully.`,
            timer: 1500,
            showConfirmButton: false,
          }).then(() => window.location.reload());
        }
      } catch (error) {
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
      selectedCouponCode = "";
      selectedAction = "";
      selectedCheckbox = null;
      document.getElementById("confirmMessage").innerHTML = "";
    });
});
let currentPage = 1;
let totalPagesGlobal = 1;

/* FETCH COUPONS */
async function fetchCoupons(page = 1) {
  currentPage = page;

  const search = document.getElementById("searchInput").value;
  const formData = new FormData(document.getElementById("filterForm"));
  const filters = Object.fromEntries(formData.entries());

  const params = {
    search: search,
    page: page,
    limit: 10,
    ajax: true,
    ...filters,
  };

  // Remove empty filters
  Object.keys(params).forEach((key) => {
    if (!params[key]) delete params[key];
  });

  try {
    const res = await axios.get("/admin/coupons-management", { params });
    renderTable(res.data.coupons);
    renderPagination(res.data.pagination);
  } catch (error) {
    console.error("Error fetching coupons:", error);
  }
}

/* SEARCH */
let searchTimeout;
document.getElementById("searchInput").addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchCoupons(1);
  }, 300);
});

/* FILTER */
document.getElementById("applyFilter").addEventListener("click", () => {
  fetchCoupons(1);
  const modalElement = document.getElementById("filterModal");
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
});

/* CLEAR FILTER */
document.getElementById("clearFilter").addEventListener("click", () => {
  document.getElementById("filterForm").reset();
  fetchCoupons(1);
  const modalElement = document.getElementById("filterModal");
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
});

/* TABLE */
function renderTable(coupons) {
  const tbody = document.getElementById("couponsTableBody");
  tbody.innerHTML = "";

  if (!coupons || !coupons.length) {
    tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            No coupons available
          </td>
        </tr>`;
    return;
  }

  coupons.forEach((c, i) => {
    const serialNumber = (currentPage - 1) * 10 + i + 1;

    const discountBadge =
      c.discountType === "percentage"
        ? `<span class="badge bg-success-subtle text-success">${c.discountValue}%</span>`
        : `<span class="badge bg-info-subtle text-info">₹${c.discountValue}</span>`;

    const statusBadge = c.isListed
      ? `<span class="badge bg-success-subtle text-success">List</span>`
      : `<span class="badge bg-danger-subtle text-danger">Unlist</span>`;

    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB");
    };

    tbody.innerHTML += `
        <tr>
          <td class="fw-semibold text-muted">${serialNumber}</td>
          <td class="fw-semibold text-dark">${c.code}</td>
          <td>${discountBadge}</td>
          <td class="text-muted">₹${c.minOrderAmount}</td>
          <td class="text-muted text-nowrap">${formatDate(c.validFrom)} – ${formatDate(c.validTo)}</td>
          <td><span class="badge bg-secondary-subtle text-secondary">${c.usedBy?.length || 0}</span></td>
          <td>${statusBadge}</td>
          <td class="text-center">
            <div class="d-flex justify-content-center gap-2">
              <button class="btn btn-sm btn-outline-success edit-coupon-btn" 
                data-bs-toggle="modal" data-bs-target="#editCouponModal" 
                data-id="${c._id}" data-code="${c.code}"
                data-discounttype="${c.discountType}" data-discountvalue="${c.discountValue}"
                data-minorder="${c.minOrderAmount}" data-validfrom="${c.validFrom}"
                data-validto="${c.validTo}" data-usageperuser="${c.usagePerUser}"
                data-usagelimit="${c.usageLimit}">
                <i class="bi bi-pencil"></i>
              </button>
              <div class="form-check form-switch m-0 update-coupon-btn"
                title="${c.isListed ? "Unlist" : "List"} Coupon">
                <input class="form-check-input" type="checkbox" 
                  data-id="${c._id}" data-code="${c.code}" 
                  ${c.isListed ? "checked" : ""} />
              </div>
            </div>
          </td>
        </tr>`;
  });
}

/* PAGINATION */
function renderPagination({ totalPages, currentPage: current }) {
  totalPagesGlobal = totalPages;
  currentPage = current;

  const container = document.getElementById("pagination");
  if (!container) return;

  container.innerHTML = "";

  if (totalPages <= 1) return;

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.className = "page-btn";
  prevBtn.textContent = "Prev";
  prevBtn.disabled = current === 1;
  prevBtn.onclick = () => {
    if (current > 1) fetchCoupons(current - 1);
  };
  container.appendChild(prevBtn);

  // Page number buttons
  const maxVisiblePages = 5;
  let startPage = Math.max(1, current - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // First page + ellipsis
  if (startPage > 1) {
    const firstBtn = document.createElement("button");
    firstBtn.className = "page-btn";
    firstBtn.textContent = "1";
    firstBtn.onclick = () => fetchCoupons(1);
    container.appendChild(firstBtn);

    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.style.padding = "0 8px";
      container.appendChild(ellipsis);
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `page-btn ${i === current ? "active" : ""}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => fetchCoupons(i);
    container.appendChild(pageBtn);
  }

  // Ellipsis + last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.style.padding = "0 8px";
      container.appendChild(ellipsis);
    }

    const lastBtn = document.createElement("button");
    lastBtn.className = "page-btn";
    lastBtn.textContent = totalPages;
    lastBtn.onclick = () => fetchCoupons(totalPages);
    container.appendChild(lastBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.textContent = "Next";
  nextBtn.disabled = current === totalPages;
  nextBtn.onclick = () => {
    if (current < totalPages) fetchCoupons(current + 1);
  };
  container.appendChild(nextBtn);
}

// Initialize pagination on page load
document.addEventListener("DOMContentLoaded", function () {
  try {
    const initialDataScript = document.getElementById("initialData");
    if (initialDataScript) {
      const initialData = JSON.parse(initialDataScript.textContent);

      currentPage = initialData.currentPage || 1;
      totalPagesGlobal = initialData.totalPages || 1;

      if (initialData.totalPages > 1) {
        renderPagination({
          totalPages: initialData.totalPages,
          currentPage: initialData.currentPage,
        });
      }

      console.log("Pagination initialized:", initialData);
    }
  } catch (error) {
    console.error("Error initializing pagination:", error);
  }
});
