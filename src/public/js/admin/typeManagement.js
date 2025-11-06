document.addEventListener("DOMContentLoaded", () => {
  //add Type
  const addTypeForm = document.getElementById("addTypeForm");
  const addTypeModal = document.getElementById("addTypeModal");
  addTypeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(addTypeForm);
    const data = Object.fromEntries(formData.entries());
    try {
      // Bootstrap way to close modal
      const modalInstance = bootstrap.Modal.getInstance(addTypeModal);
      modalInstance.hide();

      const res = await axios.post("/admin/types-management/add-type", data);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Type Added!",
          text: "The new type has been added successfully.",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.reload();
        });
      } else {
        modalInstance.hidden();
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: res.data.message || "Could not add type.",
        });
      }
    } catch (error) {
      modalInstance.hidden();
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Something went wrong while adding the type.",
      });
    }
  });

  // Prefill Edit Type Modal
  const editTypeModal = document.getElementById("editTypeModal");
  editTypeModal.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    document.getElementById("editTypeId").value =
      button.getAttribute("data-id");
    document.getElementById("editTypeName").value =
      button.getAttribute("data-name");
    document.getElementById("editTypeDescription").value =
      button.getAttribute("data-description");
  });

  //edit form submiting
  const editTypeForm = document.getElementById("editTypeForm");
  editTypeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editTypeId").value;
    const formData = new FormData(editTypeForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await axios.put(
        `/admin/types-management/edit-type/${id}`,
        data
      );

      if (res.data.success) {
        // Show SweetAlert success popup
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Type updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("Edit Type Error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Something went wrong. Try again.",
      });
    }
  });

  const deleteTypeModal = document.getElementById("deleteTypeModal");
  const deleteConfirmBtn = document.getElementById("typeSoftDelete");
  let currentDeleteId = null;

  // Prefill delete modal
  deleteTypeModal.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    const name = button.getAttribute("data-name");
    const id = button.getAttribute("data-id");

    document.getElementById("deleteTypeName").textContent = name;
    currentDeleteId = id;
  });

  // Soft delete action
  deleteConfirmBtn.addEventListener("click", async () => {
    if (!currentDeleteId) return;

    try {
      const res = await axios.patch(
        `/admin/types-management/soft-delete-type/${currentDeleteId}`
      );

      if (res.data.success) {
        // Optional: SweetAlert confirmation
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Type status changed successfully.",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  });

  const searchInput = document.getElementById("searchType");
  const paginationSection = document.getElementById("typePagination");

  // =============== SEARCH & PAGINATION ===============
  function debounce(cb, delay = 400) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), delay);
    };
  }

  async function loadTypes(page = 1) {
    const search = searchInput.value.trim();

    try {
      const res = await axios.get("/admin/types-management", {
        params: { search, page, limit: 10 },
      });

      if (res.data.success) {
        renderTypes(res.data.result);
        renderPagination(res.data.currentPage, res.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching type data:", error);
    }
  }

  window.loadTypePage = function (page) {
    loadTypes(page);
  };

  function renderTypes(types = []) {
    const tbody = document.getElementById("typeTable");
    if (!tbody) return console.error("typeTable element not found");

    if (!Array.isArray(types)) {
      console.error("renderTypes expects an array");
      return;
    }

    if (types.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">No Types Found</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = types
      .map((t, index) => {
        return `
        <tr>
          <td>${index + 1}</td>
          <td>${t.name}</td>
          <td>${t.description || "-"}</td>
          <td class="${t.isListed ? "text-success" : "text-danger"}">${
          t.isListed ? "Listed" : "Unlisted"
        }</td>

          <td>
            <button class="btn btn-sm btn-outline-primary me-2"
              data-bs-toggle="modal" data-bs-target="#editTypeModal"
              data-id="${t._id}" data-name="${t.name}" data-description="${
          t.description
        }">
              <i class="bi bi-pencil-fill"></i>
            </button>

            <button class="btn btn-sm ${
              t.isListed ? "btn-outline-warning" : "btn-outline-success"
            }"
              data-bs-toggle="modal" data-bs-target="#deleteTypeModal"
              data-id="${t._id}" data-name="${t.name}">
              <i class="bi ${
                t.isListed ? "bi-eye-slash-fill" : "bi-eye-fill"
              }"></i>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");
  }

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
        <a class="page-link" style="cursor:pointer" onclick="loadTypePage(${
          currentPage - 1
        })">
          <i class="bi bi-chevron-left"></i>
        </a>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" style="cursor:pointer" onclick="loadTypePage(${i})">${i}</a>
        </li>
      `;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadTypePage(${
          currentPage + 1
        })">
          <i class="bi bi-chevron-right"></i>
        </a>
      </li>
    `;

    html += `</ul>`;

    paginationSection.innerHTML = html;
  }

  const debouncedSearch = debounce(loadTypes, 400);
  searchInput.addEventListener("input", debouncedSearch);

  // FIRST LOAD
  loadTypes(1);
});
