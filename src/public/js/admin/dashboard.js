let revenueChart;
let currentFilter = "yearly";

// Initialize Chart
function initChart() {
  const ctx = document.getElementById("revenueChart").getContext("2d");
  revenueChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Revenue (₹)",
          data: [],
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Orders",
          data: [],
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                if (context.dataset.label === "Revenue (₹)") {
                  label += "₹" + context.parsed.y.toLocaleString("en-IN");
                } else {
                  label += context.parsed.y;
                }
              }
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: {
            display: true,
            text: "Revenue (₹)",
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Orders",
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  });

  loadChartData(currentFilter);
}

// Load Chart Data
async function loadChartData(filter) {
  try {
    const response = await fetch(
      `/admin/dashboard/chart-data?filter=${filter}`,
    );
    const data = await response.json();

    revenueChart.data.labels = data.labels;
    revenueChart.data.datasets[0].data = data.revenue;
    revenueChart.data.datasets[1].data = data.orders;
    revenueChart.update();
  } catch (error) {
    console.error("Error loading chart data:", error);
  }
}

// Filter Buttons
document.querySelectorAll("[data-filter]").forEach((btn) => {
  btn.addEventListener("click", function () {
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    currentFilter = this.dataset.filter;
    loadChartData(currentFilter);
  });
});

// Load Top Products
async function loadTopProducts() {
  const tbody = document.getElementById("topProductsTable");
  try {
    console.log("Loading top products...");
    const response = await fetch("/admin/dashboard/top-products");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();
    console.log("Top products loaded:", products);

    if (!products || products.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">No product data available</td></tr>';
      return;
    }

    tbody.innerHTML = products
      .map(
        (p, i) => `
        <tr>
          <td class="fw-bold">${i + 1}</td>
          <td>${p.name || "N/A"}</td>
          <td>${p.brand || "N/A"}</td>
          <td><span class="badge bg-info-subtle text-info">${p.type || "N/A"}</span></td>
          <td class="text-center">${p.totalSold || 0}</td>
          <td class="text-end fw-bold">₹${(p.revenue || 0).toLocaleString("en-IN")}</td>
        </tr>
      `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading top products:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error loading data: ${error.message}</td></tr>`;
  }
}

// Load Top Categories
async function loadTopCategories() {
  const tbody = document.getElementById("topCategoriesTable");
  try {
    console.log("Loading top categories...");
    const response = await fetch("/admin/dashboard/top-categories");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const categories = await response.json();
    console.log("Top categories loaded:", categories);

    if (!categories || categories.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">No category data available</td></tr>';
      return;
    }

    tbody.innerHTML = categories
      .map(
        (c, i) => `
        <tr>
          <td class="fw-bold">${i + 1}</td>
          <td>${c.name || "N/A"}</td>
          <td>${c.product || "N/A"}</td>
          <td class="text-center">${c.totalSold || 0}</td>
          <td class="text-center">${c.orderCount || 0}</td>
          <td class="text-end fw-bold">₹${(c.totalRevenue || 0).toLocaleString("en-IN")}</td>
        </tr>
      `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading top categories:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error loading data: ${error.message}</td></tr>`;
  }
}

// Load Top Brands
async function loadTopBrands() {
  const tbody = document.getElementById("topBrandsTable");
  try {
    console.log("Loading top brands...");
    const response = await fetch("/admin/dashboard/top-brands");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const brands = await response.json();
    console.log("Top brands loaded:", brands);

    if (!brands || brands.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">No brand data available</td></tr>';
      return;
    }

    tbody.innerHTML = brands
      .map(
        (b, i) => `
        <tr>
          <td class="fw-bold">${i + 1}</td>
          <td>${b.name || "N/A"}</td>
          <td>${b.country || "N/A"}</td>
          <td class="text-center">${b.totalSold || 0}</td>
          <td class="text-center">${b.orderCount || 0}</td>
          <td class="text-end fw-bold">₹${(b.totalRevenue || 0).toLocaleString("en-IN")}</td>
        </tr>
      `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading top brands:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error loading data: ${error.message}</td></tr>`;
  }
}

// Generate Ledger
document
  .getElementById("generateLedgerBtn")
  .addEventListener("click", async function () {
    const startDate = document.getElementById("ledgerStartDate").value;
    const endDate = document.getElementById("ledgerEndDate").value;

    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    try {
      const response = await fetch(
        `/admin/dashboard/ledger?startDate=${startDate}&endDate=${endDate}`,
      );
      const data = await response.json();

      // Update summary
      document.getElementById("ledgerSummary").style.display = "block";
      document.getElementById("ledgerTotalOrders").textContent =
        data.summary.totalOrders;
      document.getElementById("ledgerTotalRevenue").textContent =
        "₹" + data.summary.totalRevenue.toLocaleString("en-IN");
      document.getElementById("ledgerPending").textContent =
        "₹" + data.summary.totalPending.toLocaleString("en-IN");

      // Update table
      const tbody = document.getElementById("ledgerTable");
      tbody.innerHTML = data.ledger
        .map(
          (item) => `
        <tr>
          <td>${new Date(item.date).toLocaleDateString("en-IN")}</td>
          <td class="fw-semibold">${item.orderId}</td>
          <td>${item.customerName}</td>
          <td>${item.productName}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-end">₹${item.unitPrice.toLocaleString("en-IN")}</td>
          <td class="text-end fw-bold">₹${item.itemTotal.toLocaleString("en-IN")}</td>
          <td>${item.paymentMethod}</td>
          <td>
            ${
              item.paymentStatus === "Paid"
                ? '<span class="badge bg-success">Paid</span>'
                : '<span class="badge bg-warning">Pending</span>'
            }
          </td>
        </tr>
      `,
        )
        .join("");

      // document.getElementById('downloadLedgerBtn').style.display = 'block';
    } catch (error) {
      console.error("Error generating ledger:", error);
      alert("Failed to generate ledger");
    }
  });

// Tab change listeners - using proper Bootstrap 5 event
const productsTab = document.getElementById("products-tab");
const categoriesTab = document.getElementById("categories-tab");
const brandsTab = document.getElementById("brands-tab");

productsTab.addEventListener("shown.bs.tab", function (event) {
  loadTopProducts();
});

categoriesTab.addEventListener("shown.bs.tab", function (event) {
  loadTopCategories();
});

brandsTab.addEventListener("shown.bs.tab", function (event) {
  loadTopBrands();
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  initChart();
  loadTopProducts(); // Load default tab data
});
