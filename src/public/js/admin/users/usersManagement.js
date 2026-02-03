let currentPage = 1;
let totalPagesGlobal = 1;

function initTooltips() {
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el);
  });
}

document.addEventListener("DOMContentLoaded", initTooltips);

/* FETCH USERS */
async function fetchUsers(page = 1) {
  currentPage = page;

  const search = document.getElementById("searchUserInput").value;
  const formData = new FormData(document.getElementById("filterUserForm"));
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
    const res = await axios.get("/admin/users-management", { params });
    renderUsers(res.data.users);
    renderPagination(res.data.pagination);
    updateStats(res.data.stats);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

/* SEARCH */
let searchTimeout;
document.getElementById("searchUserInput").addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchUsers(1);
  }, 300);
});

/* FILTER */
document.getElementById("applyFilter").addEventListener("click", () => {
  fetchUsers(1);
  const modalElement = document.getElementById("filterUserModal");
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
});

/* CLEAR FILTER */
document.getElementById("clearFilter").addEventListener("click", () => {
  document.getElementById("filterUserForm").reset();
  fetchUsers(1);
  const modalElement = document.getElementById("filterUserModal");
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
});

/* UPDATE STATS */
function updateStats(stats) {
  if (stats) {
    document.getElementById("totalUsers").textContent = stats.totalUsers || 0;
    document.getElementById("activeUsers").textContent = stats.activeUsers || 0;
    document.getElementById("blockedUsers").textContent =
      stats.blockedUsers || 0;
  }
}

/* RENDER USERS */
function renderUsers(users = []) {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = "";

  if (!Array.isArray(users) || users.length === 0) {
    tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted py-4">No users found</td>
        </tr>`;
    return;
  }

  users.forEach((user, index) => {
    const serialNumber = (currentPage - 1) * 10 + index + 1;
    const statusBadge = user.isBlocked
      ? '<span class="badge bg-danger-subtle text-danger fw-semibold">Blocked</span>'
      : '<span class="badge bg-success-subtle text-success fw-semibold">Active</span>';

    const actionBtn = user.isBlocked
      ? `<button class="btn btn-sm btn-outline-success" data-bs-toggle="modal" data-bs-target="#blockUserModal" 
            data-id="${user._id}" data-user="${user.name}" data-action="unblock">
            <i class="bi bi-unlock"></i>
          </button>`
      : `<button class="btn btn-sm btn-outline-warning" data-bs-toggle="modal" data-bs-target="#blockUserModal" 
            data-id="${user._id}" data-user="${user.name}" data-action="block">
            <i class="bi bi-lock"></i>
          </button>`;

    tbody.innerHTML += `
        <tr>
          <td class="fw-semibold text-muted">${serialNumber}</td>
          <td>
            <div class="d-flex align-items-center gap-3">
              <img src="${user.profileImage_url}" class="rounded-circle user-avatar" alt="profile">
              <div>
                <div class="fw-semibold text-dark">${user.name}</div>
                <div class="small text-muted">${user.email}</div>
              </div>
            </div>
          </td>
          <td class="text-muted">${user.phoneNumber || "-"}</td>
          <td>${statusBadge}</td>
          <td><span class="badge bg-primary-subtle text-primary">${user.orderCount || 0}</span></td>
          <td class="fw-semibold text-success">₹${user.walletBalance || 0}</td>
          <td class="text-center">
            <div class="d-flex justify-content-center align-items-center gap-2">
              <div data-bs-toggle="tooltip" title="View user">
                <a href="/admin/users-management/user-details/${user._id}" class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-eye"></i>
                </a>
              </div>
              <div data-bs-toggle="tooltip" title="${user.isBlocked ? "Unblock" : "Block"} user">
                ${actionBtn}
              </div>
            </div>
          </td>
        </tr>`;
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
    if (current > 1) fetchUsers(current - 1);
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
    firstBtn.onclick = () => fetchUsers(1);
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
    pageBtn.onclick = () => fetchUsers(i);
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
    lastBtn.onclick = () => fetchUsers(totalPages);
    container.appendChild(lastBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.textContent = "Next";
  nextBtn.disabled = current === totalPages;
  nextBtn.onclick = () => {
    if (current < totalPages) fetchUsers(current + 1);
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

  /* BLOCK/UNBLOCK USER */
  const blockUserModal = document.getElementById("blockUserModal");
  let selectedUserId = null;
  let selectedAction = null;

  blockUserModal.addEventListener("show.bs.modal", function (event) {
    const button = event.relatedTarget;
    selectedUserId = button.getAttribute("data-id");
    selectedAction = button.getAttribute("data-action");
    const userName = button.getAttribute("data-user");

    // Update modal text
    document.getElementById("blockActionText").textContent = selectedAction;
    document.getElementById("blockActionText2").textContent = selectedAction;
    document.getElementById("blockUserName").textContent = userName;
  });

  document
    .getElementById("confirmBlockUser")
    .addEventListener("click", async function () {
      if (!selectedUserId) return;

      try {
        const response = await axios.patch(
          `/admin/users-management/block-unblock-user/${selectedUserId}`,
        );

        if (response.data.success) {
          // Close modal
          const modal = bootstrap.Modal.getInstance(blockUserModal);
          modal.hide();

          // Refresh users list
          fetchUsers(currentPage);

          // Optional: Show success message
          console.log(`User ${selectedAction}ed successfully`);
        }
      } catch (error) {
        console.error(`Error ${selectedAction}ing user:`, error);
        alert(`Failed to ${selectedAction} user. Please try again.`);
      }
    });
});
