document.addEventListener("DOMContentLoaded", () => {
  //add Type
  const addTypeForm = document.getElementById("addTypeForm");
  const addTypeModal = document.getElementById("addTypeModal");
  const addAlert = document.getElementById("addAlert");
  const descriptionInput = document.getElementById("description");
  const descriptionError = document.getElementById("descriptionError");
  const nameInput = document.getElementById("nameInput");
  const nameError = document.getElementById("nameError");
  const editTypeDescriptionInput = document.getElementById(
    "editTypeDescription"
  );
  const editDescriptionError = document.getElementById("editDescriptionError");
  const editTypeNameInput = document.getElementById("editTypeName");
  const editNameError = document.getElementById("editNameError");

  //Type name validation
  function typeNameValidation(input, error) {
    const typeName = input.value.trim();
    if (!typeName) {
      error.textContent = "Type name is Requaierd";
      error.style.display = "block";
      return false;
    } else if (typeName.length < 3) {
      error.textContent = "Type name length must be greaterthan 3";
      error.style.display = "block";
      return false;
    } else {
      error.textContent = "";
      error.style.display = "none";
      return true;
    }
  }

  //Type Country validation
  function typeDescriptionValidation(input, error) {
    const TypeDescription = input.value.trim();
    if (!TypeDescription) {
      error.textContent = "Type Description Requaierd";
      error.style.display = "block";
      return false;
    } else if (TypeDescription.length < 10) {
      error.textContent = "Type Description length must be greaterthan 10";
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
    typeNameValidation(nameInput, nameError)
  );
  descriptionInput.addEventListener("input", () =>
    typeDescriptionValidation(descriptionInput, descriptionError)
  );
  editTypeNameInput.addEventListener("input", () =>
    typeNameValidation(editTypeNameInput, editNameError)
  );
  editTypeDescriptionInput.addEventListener("input", () =>
    typeDescriptionValidation(editTypeDescriptionInput, editDescriptionError)
  );

  addTypeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameValid = typeNameValidation(nameInput, nameError);
    const descValid = typeDescriptionValidation(
      descriptionInput,
      descriptionError
    );

    if (!nameValid || !descValid) return;

    // build trimmed data safely
    const data = {};
    new FormData(addTypeForm).forEach((v, k) => {
      data[k] = typeof v === "string" ? v.trim() : v;
    });

    // basic client-side validation
    if (!data.name) {
      addAlert.className = "alert alert-warning text-center";
      addAlert.textContent = "Type name is required.";
      addAlert.classList.remove("d-none");
      return;
    }

    try {
      const res = await axios.post("/admin/types-management/add-type", data);

      if (res.data?.success) {
        const modalInstance =
          bootstrap.Modal.getInstance(addTypeModal) ||
          new bootstrap.Modal(addTypeModal);

        modalInstance.hide();

        Swal.fire({
          icon: "success",
          title: "Type Added!",
          text: "The new type has been added successfully.",
          timer: 1200,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "warning",
          title: "Update Failed",
          text: res.data.alert || "Failed to add Type.",
        });
      }
    } catch (error) {
      console.error("Error from type adding", error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: error.response?.data?.alert || "Internal server error",
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

    const nameValid = typeNameValidation(editTypeNameInput, editNameError);
    const descValid = typeDescriptionValidation(
      editTypeDescriptionInput,
      editDescriptionError
    );

    if (!nameValid || !descValid) return;

    const id = document.getElementById("editTypeId").value;
    // const formData = new FormData(editTypeForm);
    const data = {};
    new FormData(editTypeForm).forEach((v, k) => {
      data[k] = typeof v === "string" ? v.trim() : v;
    });

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
      } else {
        Swal.fire({
          icon: "warning",
          title: "Update Failed",
          text: res.data.alert || "Failed to update Type.",
        });
      }
    } catch (error) {
      console.error("Edit Type Error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: error.response?.data?.alert || "Something went wrong. Try again.",
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
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Type status changed successfully.",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "warning",
          title: "Update Failed",
          text: res.data.alert || "Failed to editing Type.",
        });
      }
    } catch (error) {
      console.error("Error from type editing", error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: error.response?.data?.alert || "Internal server error",
      });
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
        <td colspan="5" class="text-center text-muted py-4">
          No Types Found
        </td>
      </tr>
    `;
      return;
    }

    tbody.innerHTML = types
      .map(
        (t, index) => `
      <tr>
        <td class="fw-semibold text-muted">${index + 1}</td>

        <td>
          <div class="fw-semibold text-dark">${t.name}</div>
        </td>

        <td class="text-muted">
          ${t.description || "-"}
        </td>

        <td>
          ${
            t.isListed
              ? `<span class="badge bg-success-subtle text-success fw-semibold">Listed</span>`
              : `<span class="badge bg-danger-subtle text-danger fw-semibold">Unlisted</span>`
          }
        </td>

        <td class="text-center">
          <div class="d-flex justify-content-center align-items-center gap-2">

            <!-- Edit -->
            <div data-bs-toggle="tooltip" title="Edit type">
              <button
                class="btn btn-sm btn-outline-success"
                data-bs-toggle="modal"
                data-bs-target="#editTypeModal"
                data-id="${t._id}"
                data-name="${t.name}"
                data-description="${t.description || ""}">
                <i class="bi bi-pencil"></i>
              </button>
            </div>

            <!-- List / Unlist -->
            <div
              data-bs-toggle="tooltip"
              title="${t.isListed ? "Unlist type" : "List type"}">
              <button
                class="btn btn-sm ${
                  t.isListed ? "btn-outline-warning" : "btn-outline-success"
                }"
                data-bs-toggle="modal"
                data-bs-target="#deleteTypeModal"
                data-id="${t._id}"
                data-name="${t.name}">
                <i class="bi ${t.isListed ? "bi-eye-slash" : "bi-eye"}"></i>
              </button>
            </div>

          </div>
        </td>
      </tr>
    `
      )
      .join("");

    initTooltips(); // REQUIRED after DOM update
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
