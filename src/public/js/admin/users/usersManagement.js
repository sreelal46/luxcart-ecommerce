function initTooltips() {
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el, {
      placement: "top",
      delay: { show: 100, hide: 80 },
    });
  });
}

document.addEventListener("DOMContentLoaded", initTooltips);

// Search functionality
document
  .getElementById("searchUserInput")
  .addEventListener("keyup", function () {
    const searchText = this.value.toLowerCase();
    const rows = document.querySelectorAll("#usersTableBody tr");
    rows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      row.style.display = rowText.includes(searchText) ? "" : "none";
    });
  });

// Populate Block/Unblock modal
const blockUserModal = document.getElementById("blockUserModal");
let currentAction = "";
let currentUser = "";
let currentUserId;

blockUserModal.addEventListener("show.bs.modal", function (event) {
  const button = event.relatedTarget;
  currentAction = button.getAttribute("data-action"); // block or unblock
  currentUser = button.getAttribute("data-user");
  currentUserId = button.getAttribute("data-id");

  document.getElementById("blockUserName").textContent = currentUser;
  document.getElementById("blockActionText").textContent = currentAction;
});

document
  .getElementById("confirmBlockUser")
  .addEventListener("click", async function () {
    try {
      // API request
      const res = await axios.patch(
        `/admin/users-management/block-unblock-user/${currentUserId}`
      );

      if (res.data.success) {
        await Swal.fire({
          title: `User ${
            res.data.status === "Block" ? "Blocked" : "Unblocked"
          }!`,
          text: `${currentUser} has been successfully ${
            res.data.status === "Block" ? "blocked" : "unblocked"
          }.`,
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
        });

        // Reload the page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);

      Swal.fire({
        title: "Error!",
        text: "Something went wrong while updating the user status.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }

    // Close modal after action
    const modal = bootstrap.Modal.getInstance(blockUserModal);
    modal.hide();
  });

document.addEventListener("DOMContentLoaded", () => {
  // ---------- STATE ----------
  const state = {
    page: 1,
    limit: 12,
    search: "",
  };

  // ---------- DEBOUNCE ----------
  function debounce(fn, delay = 450) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  // ---------- RENDER ROWS ----------
  function renderUsers(users, baseIndex) {
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = "";

    users.forEach((u, i) => {
      const idx = baseIndex + i + 1;
      const isBlocked = !!u.isBlocked;
      const statusBadge = isBlocked
        ? `<span class="badge bg-danger">Blocked</span>`
        : `<span class="badge bg-success">Active</span>`;

      const btnLabel = isBlocked ? "Unblock" : "Block";
      const btnAction = isBlocked ? "unblock" : "block";

      tbody.insertAdjacentHTML(
        "beforeend",
        `
      <tr>
        <td>${idx}</td>
        <td class="d-flex align-items-center">
          <img src="${
            u.avatarUrl || "/images/user-avatar.jpg"
          }" class="rounded-circle me-2" alt="profile" style="width:36px;height:36px;object-fit:cover;">
          <div class="text-start">
            <div class="fw-bold">${u.name || "-"}</div>
            <small class="text-muted">${u.email || "-"}</small>
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>${u.orderCount ?? 0}</td>
        <td>
          <a href="/admin/users-management/user-details/${
            u._id
          }" style="text-decoration: none;">
            <button class="btn btn-sm btn-info rounded-pill me-1"><i class="bi bi-eye-fill"></i> View</button>
          </a>
          <button class="btn btn-sm btn-warning rounded-pill"
                  data-bs-toggle="modal"
                  data-bs-target="#blockUserModal"
                  data-id="${u._id}"
                  data-user="${(u.name || "").replace(/"/g, "&quot;")}"
                  data-action="${btnAction}">${btnLabel}</button>
        </td>
      </tr>
    `
      );
    });
  }

  // ---------- RENDER PAGINATION ----------
  function renderUsersPagination(totalPages, current) {
    const el = document.getElementById("usersPagination");
    el.innerHTML = "";

    const s = state.search.replace(/'/g, "\\'");

    el.insertAdjacentHTML(
      "beforeend",
      `
    <li class="page-item ${current === 1 ? "disabled" : ""}">
      <a class="page-link" style="cursor:pointer" onclick="loadUsers(${
        current - 1
      }, '${s}')">Prev</a>
    </li>
  `
    );

    for (let i = 1; i <= totalPages; i++) {
      el.insertAdjacentHTML(
        "beforeend",
        `
      <li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadUsers(${i}, '${s}')">${i}</a>
      </li>
    `
      );
    }

    el.insertAdjacentHTML(
      "beforeend",
      `
    <li class="page-item ${current === totalPages ? "disabled" : ""}">
      <a class="page-link" style="cursor:pointer" onclick="loadUsers(${
        current + 1
      }, '${s}')">Next</a>
    </li>
  `
    );
  }

  // ---------- LOAD USERS (Axios) ----------
  async function loadUsers(page = 1, search = state.search) {
    const res = await axios.get("/admin/users-management", {
      params: { page, limit: state.limit, search },
    });

    if (!res.data || !res.data.success) return;

    const { users, totalPages, currentPage, limit } = res.data;

    state.page = currentPage;
    state.search = search;
    state.limit = limit;

    const baseIndex = (currentPage - 1) * limit;

    renderUsers(users, baseIndex);
    renderUsersPagination(totalPages, currentPage);
  }

  // ---------- SEARCH (debounced) ----------
  document.getElementById("searchUserInput").addEventListener(
    "input",
    debounce((e) => {
      const v = e.target.value.trim();
      loadUsers(1, v);
    }, 500)
  );

  // ---------- MODAL: Populate + Confirm ----------
  const blockUserModal = document.getElementById("blockUserModal");
  let currentAction = "";
  let currentUser = "";
  let currentUserId = "";

  blockUserModal.addEventListener("show.bs.modal", function (event) {
    const button = event.relatedTarget;
    currentAction = button.getAttribute("data-action"); // "block" | "unblock"
    currentUser = button.getAttribute("data-user") || "";
    currentUserId = button.getAttribute("data-id");

    const actionText = currentAction; // keep lower
    document.getElementById("blockActionText").textContent = actionText;
    document.getElementById("blockActionText2").textContent = actionText;
    document.getElementById("blockUserName").textContent = currentUser;
  });

  document
    .getElementById("confirmBlockUser")
    .addEventListener("click", async function () {
      try {
        const res = await axios.patch(
          `/admin/users-management/block-unblock-user/${currentUserId}`
        );
        if (res.data && res.data.success) {
          await Swal.fire({
            title: `User ${
              res.data.status === "Block" ? "Blocked" : "Unblocked"
            }!`,
            text: `${currentUser} has been successfully ${
              res.data.status === "Block" ? "blocked" : "unblocked"
            }.`,
            icon: "success",
            timer: 1600,
            showConfirmButton: false,
          });

          // Refresh current page with current search (no full reload)
          await loadUsers(state.page, state.search);
        } else {
          throw new Error("Unexpected response");
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: "Error!",
          text: "Something went wrong while updating the user status.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        const modal = bootstrap.Modal.getInstance(blockUserModal);
        modal && modal.hide();
      }
    });

  // ---------- INITIAL LOAD ----------
  loadUsers();
});
