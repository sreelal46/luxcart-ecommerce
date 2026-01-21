// ---------- STATE ----------
const state = {
  page: 1,
  search: "",
  filters: {
    brand: "",
    category: "",
    productType: "",
    stockStatus: "",
  },
};

// ---------- DEBOUNCE ----------
function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ---------- LOAD STOCK ----------
async function loadStock(
  page = 1,
  search = state.search,
  filters = state.filters,
) {
  try {
    const params = {
      page,
      search: search || "",
    };

    // Add filter parameters if they exist
    if (filters.brand) params.brand = filters.brand;
    if (filters.category) params.category = filters.category;
    if (filters.productType) params.productType = filters.productType;
    if (filters.stockStatus) params.stockStatus = filters.stockStatus;

    const res = await axios.get(`/admin/stock-management`, {
      params,
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!res.data.success) {
      console.error("Failed to load stock");
      return;
    }

    const { fullProducts, totalPages } = res.data;
    console.log("Loaded stock:", fullProducts);

    state.page = page;
    state.search = search;
    state.filters = filters;

    renderStockTable(fullProducts);
    renderPagination(totalPages, page);
  } catch (error) {
    console.error("Error loading stock:", error);
  }
}

// ---------- SEARCH ----------
const searchInput = document.getElementById("searchStock");
if (searchInput) {
  searchInput.addEventListener(
    "input",
    debounce((e) => {
      const value = e.target.value.trim();
      console.log("Searching for:", value);
      loadStock(1, value, state.filters);
    }, 500),
  );
}

// ---------- FILTER FORM ----------
const filterForm = document.getElementById("stockFilterForm");
if (filterForm) {
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(filterForm);
    const filters = {
      brand: formData.get("brand") || "",
      category: formData.get("category") || "",
      productType: formData.get("productType") || "",
      stockStatus: formData.get("stockStatus") || "",
    };

    // Close the modal
    const filterModal = bootstrap.Modal.getInstance(
      document.getElementById("stockFilterModal"),
    );
    if (filterModal) filterModal.hide();

    // Load stock with filters
    loadStock(1, state.search, filters);
  });
}

// ---------- RESET FILTERS ----------
const resetFiltersBtn = document.getElementById("resetFilters");
if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener("click", () => {
    filterForm.reset();
    const emptyFilters = {
      brand: "",
      category: "",
      productType: "",
      stockStatus: "",
    };

    // Close the modal
    const filterModal = bootstrap.Modal.getInstance(
      document.getElementById("stockFilterModal"),
    );
    if (filterModal) filterModal.hide();

    loadStock(1, state.search, emptyFilters);
  });
}

// ---------- RENDER TABLE ----------
function renderStockTable(data) {
  const tbody = document.getElementById("stockTableBody");
  if (!tbody) {
    console.error("Table body not found");
    return;
  }

  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          <div class="text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            No products found
          </div>
        </td>
      </tr>
    `;
    return;
  }

  data.forEach((item, index) => {
    const isCar = !!item.variantIds && item.variantIds.length > 0;

    let variantStockHtml = "";
    if (isCar) {
      variantStockHtml = item.variantIds
        .map(
          (variant) =>
            `<div class="mb-1 text-muted">
          <strong class="text-dark">${variant.color}:</strong> ${variant.stock}
        </div>`,
        )
        .join("");
    } else {
      variantStockHtml = `<span class="fw-semibold">${item.stock || 0}</span>`;
    }

    const mainStock = isCar ? item.variantIds[0].stock : item.stock;
    const statusBadge = getStockStatusBadge(mainStock);

    const editLink = isCar
      ? `/admin/products-management/edit-car-product/${item._id}`
      : `/admin/products-management/edit-accessories-product/${item._id}`;

    const serialNumber = (state.page - 1) * 12 + index + 1;

    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td class="fw-semibold text-muted">${serialNumber}</td>
        
        <td>
          <div class="fw-semibold text-dark">${item.name}</div>
        </td>

        <td class="text-muted">${item.category_id?.name || "-"}</td>

        <td>${variantStockHtml}</td>

        <td>${statusBadge}</td>

        <td class="text-center">
          <div class="d-flex justify-content-center align-items-center">
            <div data-bs-toggle="tooltip" title="Edit stock">
              <a href="${editLink}" class="btn btn-sm btn-outline-success">
                <i class="bi bi-pencil-square"></i>
              </a>
            </div>
          </div>
        </td>
      </tr>
      `,
    );
  });

  initTooltips();
}

// ---------- STOCK STATUS BADGE ----------
function getStockStatusBadge(stock) {
  if (stock === 0) {
    return '<span class="badge bg-danger">Out of Stock</span>';
  } else if (stock < 10) {
    return '<span class="badge bg-warning text-dark">Low Stock</span>';
  } else {
    return '<span class="badge bg-success">In Stock</span>';
  }
}

// ---------- TOOLTIPS ----------
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]',
  );
  tooltipTriggerList.forEach((el) => {
    const existingTooltip = bootstrap.Tooltip.getInstance(el);
    if (existingTooltip) {
      existingTooltip.dispose();
    }
    new bootstrap.Tooltip(el, {
      placement: "top",
      trigger: "hover",
      delay: { show: 100, hide: 80 },
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTooltips();

  // Initialize pagination on page load
  const currentPage =
    parseInt(new URLSearchParams(window.location.search).get("page")) || 1;
  const totalPagesEl = document.getElementById("totalStockPages");
  if (totalPagesEl) {
    const totalPages = parseInt(totalPagesEl.dataset.total) || 1;
    renderPagination(totalPages, currentPage);
  }
});

// ---------- PAGINATION ----------
function renderPagination(totalPages, current) {
  const container = document.getElementById("stockPagination");
  if (!container) {
    console.error("Pagination container not found");
    return;
  }

  container.innerHTML = "";

  if (totalPages <= 1) {
    return; // No pagination needed for single page
  }

  // Previous button
  container.innerHTML += `
    <li class="page-item ${current === 1 ? "disabled" : ""}">
      <a class="page-link" style="cursor:pointer" onclick="loadStock(${
        current - 1
      }, '${state.search}', state.filters)">Prev</a>
    </li>
  `;

  // Page numbers with ellipsis for large page counts
  const maxVisible = 5;
  let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // First page
  if (startPage > 1) {
    container.innerHTML += `
      <li class="page-item">
        <a class="page-link" style="cursor:pointer" onclick="loadStock(1, '${state.search}', state.filters)">1</a>
      </li>
    `;
    if (startPage > 2) {
      container.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    container.innerHTML += `
      <li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadStock(${i}, '${state.search}', state.filters)">${i}</a>
      </li>
    `;
  }

  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      container.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    container.innerHTML += `
      <li class="page-item">
        <a class="page-link" style="cursor:pointer" onclick="loadStock(${totalPages}, '${state.search}', state.filters)">${totalPages}</a>
      </li>
    `;
  }

  // Next button
  container.innerHTML += `
    <li class="page-item ${current === totalPages ? "disabled" : ""}">
      <a class="page-link" style="cursor:pointer" onclick="loadStock(${
        current + 1
      }, '${state.search}', state.filters)">Next</a>
    </li>
  `;
}
