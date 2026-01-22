let currentPage = 1;
let totalPagesGlobal = 1;

function initTooltips() {
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el, {
      placement: "top",
      delay: { show: 100, hide: 80 },
    });
  });
}

document.addEventListener("DOMContentLoaded", initTooltips);

/* FETCH ORDERS */
async function fetchOrders(page = 1) {
  currentPage = page;

  const search = document.getElementById("searchOrderInput").value;
  const formData = new FormData(document.getElementById("filterOrderForm"));
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
    const res = await axios.get("/admin/orders-management", { params });
    renderOrders(res.data.orders);
    renderPagination(res.data.pagination);
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
}

/* SEARCH */
let searchTimeout;
document.getElementById("searchOrderInput").addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchOrders(1);
  }, 300);
});

/* FILTER */
document.getElementById("applyFilter").addEventListener("click", () => {
  fetchOrders(1);
  const modalElement = document.getElementById("filterOrderModal");
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
});

/* CLEAR FILTER */
document.getElementById("clearFilter").addEventListener("click", () => {
  document.getElementById("filterOrderForm").reset();
  fetchOrders(1);
  const modalElement = document.getElementById("filterOrderModal");
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
});

/* RENDER ORDERS */
function renderOrders(orders = []) {
  const tableBody = document.getElementById("ordersTableBody");
  tableBody.innerHTML = "";

  if (!Array.isArray(orders) || orders.length === 0) {
    tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            No orders found
          </td>
        </tr>`;
    return;
  }

  orders.forEach((order, index) => {
    const serialNumber = (currentPage - 1) * 10 + index + 1;

    tableBody.insertAdjacentHTML(
      "beforeend",
      `
        <tr>
          <td class="fw-semibold text-muted">${serialNumber}</td>
          <td class="fw-semibold text-muted small">${order.orderId}</td>
          <td class="fw-semibold text-dark">${order.address?.name || "-"}</td>
          <td class="text-muted">${order.items?.length ?? "-"}</td>
          <td class="text-nowrap text-muted">${new Date(order.createdAt).toLocaleDateString("en-GB")}</td>
          <td class="text-center">
            <div class="d-flex justify-content-center align-items-center gap-2">
              <div data-bs-toggle="tooltip" title="View order">
                <a href="/admin/orders-management/view-order/${order._id}" class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-eye"></i> View
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
    if (current > 1) fetchOrders(current - 1);
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
    firstBtn.onclick = () => fetchOrders(1);
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
    pageBtn.onclick = () => fetchOrders(i);
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
    lastBtn.onclick = () => fetchOrders(totalPages);
    container.appendChild(lastBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.textContent = "Next";
  nextBtn.disabled = current === totalPages;
  nextBtn.onclick = () => {
    if (current < totalPages) fetchOrders(current + 1);
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
