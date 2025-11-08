document.addEventListener("DOMContentLoaded", () => {
  // -------------------- Add Category --------------------
  const addCategoryForm = document.getElementById("addCategoryForm");
  const addAlert = document.getElementById("addAlert");
  const addCategoryModal = document.getElementById("addCategoryModal");

  const descriptionInput = document.getElementById("addDescription");
  const descriptionError = document.getElementById("descriptionError");
  const nameInput = document.getElementById("addName");
  const nameError = document.getElementById("nameError");
  const editCategoryDescriptionInput = document.getElementById(
    "editCategoryDescription"
  );
  const editDescriptionError = document.getElementById("editDescriptionError");
  const editCategoryNameInput = document.getElementById("editCategoryName");
  const editCategoryNameError = document.getElementById("editNameError");

  //category name validation
  function categoryNameValidation(input, error) {
    const categoryName = input.value.trim();
    if (!categoryName) {
      error.textContent = "Category name is Requaierd";
      error.style.display = "block";
      return false;
    } else if (categoryName.length < 3) {
      error.textContent = "Category name length must be greaterthan 3";
      error.style.display = "block";
      return false;
    } else {
      error.textContent = "";
      error.style.display = "none";
      return true;
    }
  }

  //category Country validation
  function categoryDescriptionValidation(input, error) {
    const categoryDescription = input.value.trim();
    if (!categoryDescription) {
      error.textContent = "Category Description Requaierd";
      error.style.display = "block";
      return false;
    } else if (categoryDescription.length < 10) {
      error.textContent = "Category Description length must be greaterthan 10";
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
    categoryNameValidation(nameInput, nameError)
  );
  descriptionInput.addEventListener("input", () =>
    categoryDescriptionValidation(descriptionInput, descriptionError)
  );
  editCategoryNameInput.addEventListener("input", () =>
    categoryNameValidation(editCategoryNameInput, editCategoryNameError)
  );
  editCategoryDescriptionInput.addEventListener("input", () =>
    categoryDescriptionValidation(
      editCategoryDescriptionInput,
      editDescriptionError
    )
  );

  // Reset form when modal opens
  addCategoryModal.addEventListener("shown.bs.modal", () => {
    addCategoryForm.reset();
    addAlert.classList.add("d-none");
    // Remove any checked state
    document
      .querySelectorAll('#addCategoryModal input[type="radio"]')
      .forEach((r) => (r.checked = false));
  });

  // -------------------- Add Category --------------------

  addCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameValid = categoryNameValidation(nameInput, nameError);
    const descValid = categoryDescriptionValidation(
      descriptionInput,
      descriptionError
    );

    if (!nameValid || !descValid) return;

    // Manual validation for radio buttons
    const radioChecked = document.querySelector(
      'input[name="productType"]:checked'
    );
    if (!radioChecked) {
      addAlert.className = "alert alert-warning text-center";
      addAlert.textContent = "Please select a product type";
      addAlert.classList.remove("d-none");
      return;
    }

    const data = Object.fromEntries(
      [...new FormData(addCategoryForm).entries()].map(([k, v]) => [
        k,
        v.trim(),
      ])
    );

    try {
      const res = await axios.post(
        "/admin/categorys-management/add-category",
        data
      );

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Category Added!",
          text: "The category has been added successfully.",
          timer: 1400,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "warning",
          title: "Failed",
          text: res.data.alert || "Failed to add category.",
        });
      }
    } catch (error) {
      console.error("Error from category adding", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.alert || "Something went wrong.",
      });
    }
  });

  // -------------------- Edit Category --------------------
  const editCategoryForm = document.getElementById("editCategoryForm");
  const editAlert = document.getElementById("editAlert");
  const editCategoryModal = document.getElementById("editCategoryModal");

  editCategoryModal.addEventListener("show.bs.modal", (e) => {
    editAlert.classList.add("d-none");

    const btn = e.relatedTarget;

    document.getElementById("editCategoryId").value = btn.dataset.id;
    document.getElementById("editCategoryName").value = btn.dataset.name;
    document.getElementById("editCategoryDescription").value =
      btn.dataset.description;

    const type = btn.dataset.type;
    document.getElementById("editTypeCar").checked = type === "Car";
    document.getElementById("editTypeAccessories").checked =
      type === "Accessories";
  });

  editCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editCategoryId").value;

    const nameValid = categoryNameValidation(
      editCategoryNameInput,
      editCategoryNameError
    );
    const descValid = categoryDescriptionValidation(
      editCategoryDescriptionInput,
      editDescriptionError
    );

    if (!nameValid || !descValid) return;

    const data = Object.fromEntries(
      [...new FormData(editCategoryForm).entries()].map(([k, v]) => [
        k,
        v.trim(),
      ])
    );

    try {
      const res = await axios.put(
        `/admin/categorys-management/edit-category/${id}`,
        data
      );
      console.log(res.data);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Category updated successfully.",
          timer: 1400,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "warning",
          title: "Update Failed",
          text: res.data.alert || "Failed to update category.",
        });
      }
    } catch (error) {
      console.error("Error from category editing", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.alert || "Something went wrong.",
      });
    }
  });

  // -------------------- List/Unlist --------------------
  const confirmListModal = document.getElementById("confirmListModal");
  const categoriesDeleteConfirm = document.getElementById(
    "categoriesDeleteConfirm"
  );

  confirmListModal.addEventListener("show.bs.modal", (e) => {
    const btn = e.relatedTarget;
    if (!btn || !btn.dataset.id) return e.preventDefault();
    document.getElementById("categoriesId").value = btn.dataset.id;
  });

  categoriesDeleteConfirm.addEventListener("click", async () => {
    const id = document.getElementById("categoriesId").value;
    const modalInstance = bootstrap.Modal.getInstance(confirmListModal);
    try {
      const res = await axios.patch(
        `/admin/categorys-management/soft-delete-category/${id}`
      );
      modalInstance.hide();
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Category Updated!",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: res.data.message || "Failed to update category",
        });
      }
    } catch (err) {
      modalInstance.hide();
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Something went wrong while updating the category",
      });
    }
  });

  // -------------------- Live Search --------------------
  const searchInput = document.getElementById("searchCategory");
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll("#categoryTable tr").forEach((tr) => {
      const name =
        tr.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
      const type =
        tr.querySelector("td:nth-child(3)")?.textContent.toLowerCase() || "";
      tr.style.display =
        name.includes(query) || type.includes(query) ? "" : "none";
    });
  });

  const paginationSection = document.getElementById("categoryPagination");

  // =============== SEARCH & PAGINATION ===============
  function debounce(cb, delay = 400) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), delay);
    };
  }

  async function loadCategories(page = 1) {
    const search = searchInput.value.trim();
    try {
      const res = await axios.get("/admin/categorys-management", {
        params: { search, page, limit: 12 },
      });

      if (res.data.success) {
        renderCategories(res.data.result);
        renderPagination(res.data.currentPage, res.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
    }
  }

  window.loadCategoryPage = function (page) {
    loadCategories(page);
  };

  function renderCategories(categories = []) {
    const tbody = document.getElementById("categoryTable");
    if (!tbody) return console.error("categoryTable element not found");

    if (!Array.isArray(categories)) {
      console.error("renderCategories expects an array");
      return;
    }

    if (categories.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">No Categories Found</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = categories
      .map((c, index) => {
        return `
        <tr>
          <td>${index + 1}</td>
          <td>${c.name}</td>
          <td><span class="badge bg-primary">${c.product}</span></td>
          <td>${c.description || "-"}</td>
          <td>total product</td>
          <td class="${c.isListed ? "text-success" : "text-danger"}">${
          c.isListed ? "Listed" : "Unlisted"
        }</td>
          
          <td>
            <button class="btn btn-sm btn-outline-info"
              data-id="${c._id}" data-name="${c.name}"
              data-bs-toggle="modal" data-bs-target="#addOfferModal">
              <i class="bi bi-tags-fill me-1"></i> Add Offer
            </button>
          </td>

          <td>
            <button class="btn btn-sm btn-outline-primary me-2"
              data-bs-toggle="modal" data-bs-target="#editCategoryModal"
              data-id="${c._id}" data-name="${c.name}" data-description="${
          c.description
        }" data-type="${c.product}">
              <i class="bi bi-pencil-fill"></i>
            </button>

            <button class="btn btn-sm ${
              c.isListed ? "btn-outline-warning" : "btn-outline-success"
            }"
              data-bs-toggle="modal" data-bs-target="#confirmListModal"
              data-id="${c._id}" data-status="${c.isListed}">
              <i class="bi ${
                c.isListed ? "bi-eye-slash-fill" : "bi-eye-fill"
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
        <a class="page-link" style="cursor:pointer" onclick="loadCategoryPage(${
          currentPage - 1
        })">
          <i class="bi bi-chevron-left"></i>
        </a>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" style="cursor:pointer" onclick="loadCategoryPage(${i})">${i}</a>
        </li>
      `;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadCategoryPage(${
          currentPage + 1
        })">
          <i class="bi bi-chevron-right"></i>
        </a>
      </li>
    `;

    html += `</ul>`;

    paginationSection.innerHTML = html;
  }

  const debouncedSearch = debounce(loadCategories, 400);
  searchInput.addEventListener("input", debouncedSearch);

  // FIRST LOAD
  loadCategories(1);
});
