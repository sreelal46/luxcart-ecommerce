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
  state.page = page;
  state.search = search;

  renderProducts(fullProducts);
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
    const price = isCar ? item.variantIds?.[0]?.price : item.price;
    const stock = isCar ? item.variantIds?.[0]?.stock : item.stock;

    const actions = isCar
      ? `
        <a href="/admin/products-management/view-car-product/${
          item._id
        }" class="btn btn-sm btn-outline-primary me-2">
          <i class="bi bi-eye-fill"></i>
        </a>
        <a href="/admin/products-management/edit-car-product/${
          item._id
        }" class="btn btn-sm btn-outline-success me-2">
          <i class="bi bi-pencil-fill"></i>
        </a>
        <div class="form-check form-switch">
          <input class="form-check-input toggle-status" data-id="${
            item._id
          }" type="checkbox" ${
          item.isListed ? "checked" : ""
        } data-bs-toggle="modal" data-bs-target="#confirmListModal">
        </div>
      `
      : `
        <a href="/admin/products-management/view-accessories-product/${
          item._id
        }" class="btn btn-sm btn-outline-primary me-2">
          <i class="bi bi-eye-fill"></i>
        </a>
        <a href="/admin/products-management/edit-accessories-product/${
          item._id
        }" class="btn btn-sm btn-outline-success me-2">
          <i class="bi bi-pencil-fill"></i>
        </a>
        <div class="form-check form-switch">
          <input class="form-check-input toggle-status" data-id="${
            item._id
          }" type="checkbox" ${
          item.isListed ? "checked" : ""
        } data-bs-toggle="modal" data-bs-target="#confirmListModal">
        </div>
      `;

    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.category_id?.name || "-"}</td>
        <td>${item.brand_id?.name || "-"}</td>
        <td>${price ?? "-"}</td>
        <td>${stock ?? "-"}</td>
        <td><span class="badge bg-success">10% Off</span></td>
        <td class="${item.isListed ? "text-success" : "text-danger"}">
          ${item.isListed ? "Listed" : "Unlisted"}
        </td>
        <td>${actions}</td>
      </tr>
    `
    );
  });
}

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

// ---------- INITIAL LOAD ----------
loadProducts();
