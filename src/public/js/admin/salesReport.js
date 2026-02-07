let currentPage = 1;
let totalPagesGlobal = 1;

// Function to get current filter values from the form
function getCurrentFilters() {
  const filters = {
    search: document.getElementById("searchInput")?.value || "",
    category: document.querySelector('[name="category"]')?.value || "",
    dateFrom: document.querySelector('[name="dateFrom"]')?.value || "",
    dateTo: document.querySelector('[name="dateTo"]')?.value || "",
    minTotal: document.querySelector('[name="minTotal"]')?.value || "",
    maxTotal: document.querySelector('[name="maxTotal"]')?.value || "",
  };

  // Remove empty filters
  Object.keys(filters).forEach((key) => {
    if (!filters[key]) {
      delete filters[key];
    }
  });

  return filters;
}

// PDF Download
document.getElementById("downloadPDF").addEventListener("click", async () => {
  try {
    const filters = getCurrentFilters();
    const params = new URLSearchParams(filters).toString();

    console.log("Downloading PDF with filters:", filters);

    const response = await axios.get(
      `/admin/sales-report/pdf${params ? "?" + params : ""}`,
      { responseType: "blob" },
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      a.remove();
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    alert("Failed to download PDF. Please try again.");
  }
});

// Excel Download (if uncommented)
if (document.getElementById("downloadExcel")) {
  document
    .getElementById("downloadExcel")
    .addEventListener("click", async () => {
      try {
        const filters = getCurrentFilters();
        const params = new URLSearchParams(filters).toString();

        const response = await axios.get(
          `/admin/sales-report/excel${params ? "?" + params : ""}`,
          { responseType: "blob" },
        );

        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `sales-report-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          a.remove();
          window.URL.revokeObjectURL(url);
        }, 100);
      } catch (error) {
        console.error("Error downloading Excel:", error);
        alert("Failed to download Excel. Please try again.");
      }
    });
}

/* FETCH SALES */
async function fetchSales(page = 1) {
  currentPage = page;

  const search = document.getElementById("searchInput").value;
  const formData = new FormData(document.getElementById("filterForm"));
  const params = Object.fromEntries(formData.entries());

  params.search = search;
  params.page = page;
  params.limit = 10;
  params.ajax = true;

  try {
    const res = await axios.get("/admin/sales-report", { params });

    renderTable(res.data.sales);
    renderPagination(res.data.pagination);
    renderTotals(res.data.totals);
  } catch (error) {
    console.error("Error fetching sales:", error);
  }
}

/* SEARCH */
let searchTimeout;
document.getElementById("searchInput").addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchSales(1);
  }, 300);
});

/* FILTER */
document.getElementById("applyFilter").addEventListener("click", () => {
  fetchSales(1);
  const modalElement = document.getElementById("filterModal");
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
});

/* TABLE */
function renderTable(sales) {
  const tbody = document.getElementById("salesTableBody");
  tbody.innerHTML = "";

  if (!sales || !sales.length) {
    tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            No sales data available
          </td>
        </tr>`;
    return;
  }

  sales.forEach((s, i) => {
    const serialNumber = (currentPage - 1) * 10 + i + 1;
    tbody.innerHTML += `
        <tr>
          <td class="fw-semibold text-muted">${serialNumber}</td>
          <td class="fw-semibold text-dark">${s.buyer}</td>
          <td class="text-muted">${s.product}</td>
          <td class="text-muted small">${s.product_id}</td>
          <td class="text-center fw-semibold">${s.quantity}</td>
          <td class="text-end fw-semibold">₹${s.price}</td>
          <td class="text-muted">${s.category}</td>
          <td class="text-end fw-semibold">₹${s.total}</td>
        </tr>`;
  });
}

/* TOTAL CARDS */
function renderTotals(totals) {
  document.getElementById("totalRevenue").innerText =
    `₹${totals.totalRevenue.toLocaleString("en-IN")}`;
  document.getElementById("totalItemsSold").innerText =
    totals.totalItemsSold.toLocaleString("en-IN");
  document.getElementById("netSales").innerText =
    `₹${totals.netSales.toLocaleString("en-IN")}`;
}

/* PAGINATION */
function renderPagination({ totalPages, currentPage: current }) {
  totalPagesGlobal = totalPages;
  currentPage = current;

  const container = document.getElementById("pagination");
  if (!container) return;

  container.innerHTML = "";

  // Don't show pagination if only 1 page or no pages
  if (totalPages <= 1) {
    return;
  }

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.className = "page-btn";
  prevBtn.textContent = "Prev";
  prevBtn.disabled = current === 1;
  prevBtn.onclick = () => {
    if (current > 1) fetchSales(current - 1);
  };
  container.appendChild(prevBtn);

  // Page number buttons
  const maxVisiblePages = 5;
  let startPage = Math.max(1, current - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Adjust start if we're near the end
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // First page + ellipsis
  if (startPage > 1) {
    const firstBtn = document.createElement("button");
    firstBtn.className = "page-btn";
    firstBtn.textContent = "1";
    firstBtn.onclick = () => fetchSales(1);
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
    pageBtn.onclick = () => fetchSales(i);
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
    lastBtn.onclick = () => fetchSales(totalPages);
    container.appendChild(lastBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.textContent = "Next";
  nextBtn.disabled = current === totalPages;
  nextBtn.onclick = () => {
    if (current < totalPages) fetchSales(current + 1);
  };
  container.appendChild(nextBtn);
}

// Initialize pagination on page load
document.addEventListener("DOMContentLoaded", function () {
  try {
    // Get initial values from embedded JSON
    const initialDataScript = document.getElementById("initialData");
    if (initialDataScript) {
      const initialData = JSON.parse(initialDataScript.textContent);

      // Set global variables
      currentPage = initialData.currentPage || 1;
      totalPagesGlobal = initialData.totalPages || 1;

      // Render initial pagination if there are multiple pages
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
