// Handle Edit Modal Prefill
const editModal = document.getElementById("editBrandModal");
editModal.addEventListener("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  const id = button.getAttribute("data-id");
  const name = button.getAttribute("data-name");
  const country = button.getAttribute("data-country");
  const image = button.getAttribute("data-image");

  document.getElementById("editBrandId").value = id;
  document.getElementById("editBrandName").value = name;
  document.getElementById("editBrandCountry").value = country;
  document.getElementById("currentBrandImage").src = image;
});

// Handle Delete Modal Prefill
const deleteModal = document.getElementById("deleteConfirmModal");
deleteModal.addEventListener("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  const id = button.getAttribute("data-id");
  const name = button.getAttribute("data-name");
  document.getElementById("deleteBrandId").value = id;
  document.getElementById("deleteBrandName").textContent = name;
});

document.addEventListener("DOMContentLoaded", () => {
  const brandNameInput = document.getElementById("brandName");
  const brandNameError = document.getElementById("brandNameError");
  const brandCountryInput = document.getElementById("brandCountry");
  const brandCountryError = document.getElementById("brandCountryError");
  const brandImageInput = document.getElementById("brandImageInput");
  const brandImageError = document.getElementById("brandImageError");
  const editAlert = document.getElementById("editAlert");

  //brand name validation
  function brndNameValidation(input, error) {
    const brandName = input.value.trim();
    if (!brandName) {
      error.textContent = "Brand name is Requaierd";
      error.style.display = "block";
    } else if (brandName.length < 3) {
      error.textContent = "Brand name length must be greaterthan 3";
      error.style.display = "block";
    } else {
      error.textContent = "";
      error.style.display = "none";
    }
  }

  //brand Country validation
  function brndCountryValidation(input, error) {
    const brandCountry = input.value.trim();
    if (!brandCountry) {
      error.textContent = "Brand Country is Requaierd";
      error.style.display = "block";
    } else if (brandCountry.length < 3) {
      error.textContent = "Brand Country length must be greaterthan 3";
      error.style.display = "block";
    } else {
      error.textContent = "";
      error.style.display = "none";
    }
  }

  brandNameInput.addEventListener("input", () =>
    brndNameValidation(brandNameInput, brandNameError)
  );
  brandCountryInput.addEventListener("input", () =>
    brndCountryValidation(brandCountryInput, brandCountryError)
  );

  let cropper;
  const addInput = document.getElementById("brandImageInput");
  const addPreview = document.getElementById("brandImagePreview");
  const alertDiv = document.getElementById("alert");

  // ADD BRAND CROP LOGIC
  // ============================
  addInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addPreview.src = reader.result;
      addPreview.classList.remove("d-none");
      if (cropper) cropper.destroy();
      cropper = new Cropper(addPreview, {
        aspectRatio: NaN,
        viewMode: 2,
        autoCropArea: 1,
      });
    };
    reader.readAsDataURL(file);
  });

  // ADD BRAND SUBMIT
  // ============================
  document
    .getElementById("addBrandForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      // Validate all fields
      brndNameValidation(brandNameInput, brandNameError);
      brndCountryValidation(brandCountryInput, brandCountryError);

      const brandName = brandNameInput.value.trim();
      const brandCountry = brandCountryInput.value.trim();

      if (!brandName || !brandCountry) return; // stop if invalid

      if (!brandImageInput.files || brandImageInput.files.length === 0) {
        brandImageError.textContent =
          "Please upload an image before submitting.";
        brandImageError.style.display = "block";
        return;
      } else {
        brandImageError.textContent = "";
        brandImageError.style.display = "none";
      }

      // Proceed with form submission (your existing code)
      const formData = new FormData();
      formData.append("name", brandName);
      formData.append("country", brandCountry);

      if (cropper) {
        const blob = await new Promise((resolve) =>
          cropper.getCroppedCanvas().toBlob(resolve, "image/png")
        );
        formData.append("image", blob, "cropped.png");
      }

      alertDiv.className = "alert alert-info text-center";
      alertDiv.textContent = "Processing...";
      alertDiv.classList.remove("d-none");

      try {
        const res = await axios.post(
          "/admin/brands-management/add-brand",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (res.data.success) {
          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: "Brand Added successfully!",
            timer: 1500,
            showConfirmButton: false,
          }).then(() => window.location.reload());
        } else {
          Swal.fire({
            icon: "warning",
            title: "Oops!",
            text: res.data?.alert || "Failed to add brand",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: error.response?.data?.alert || "Internal server error",
        });
      }
    });

  //  EDIT BRAND
  // ============================
  const editBrandModal = document.getElementById("editBrandModal");
  const editPreview = document.getElementById("currentBrandImage");
  const editInput = document.getElementById("editBrandImage");

  const editBrandNameInput = document.getElementById("editBrandName");
  const editBrandNameError = document.getElementById("editBrandNameError");
  const editBrandCountryInput = document.getElementById("editBrandCountry");
  const editBrandCountryError = document.getElementById(
    "editBrandCountryError"
  );

  editBrandNameInput.addEventListener("input", () =>
    brndNameValidation(editBrandNameInput, editBrandNameError)
  );
  editBrandCountryInput.addEventListener("input", () =>
    brndCountryValidation(editBrandCountryInput, editBrandCountryError)
  );
  let editCropper;

  //modal opens — fill data
  editBrandModal.addEventListener("show.bs.modal", (e) => {
    const btn = e.relatedTarget;
    document.getElementById("editBrandId").value = btn.dataset.id;
    document.getElementById("editBrandName").value = btn.dataset.name;
    document.getElementById("editBrandCountry").value = btn.dataset.country;
    editPreview.src = btn.dataset.image;
    editPreview.style.width = "200px";
    editPreview.style.height = "200px";
  });

  //image is changed in edit modal — allow cropping
  editInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editPreview.src = reader.result;
      if (editCropper) editCropper.destroy();
      editCropper = new Cropper(editPreview, {
        aspectRatio: NaN,
        viewMode: 2,
        autoCropArea: 1,
      });
    };
    reader.readAsDataURL(file);
  });

  //Edit Form is submitted
  // ============================
  document
    .getElementById("editBrandForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      // Trigger validation
      brndNameValidation(editBrandNameInput, editBrandNameError);
      brndCountryValidation(editBrandCountryInput, editBrandCountryError);

      const brandName = editBrandNameInput.value.trim();
      const brandCountry = editBrandCountryInput.value.trim();

      if (!brandName || !brandCountry) return; // stop if invalid

      const formData = new FormData();
      formData.append("name", brandName);
      formData.append("country", brandCountry);

      if (editCropper) {
        const blob = await new Promise((resolve) =>
          editCropper.getCroppedCanvas().toBlob(resolve, "image/png")
        );
        formData.append("image", blob, "updated.png");
      }

      editAlert.className = "alert alert-info text-center";
      editAlert.textContent = "Updating...";
      editAlert.classList.remove("d-none");

      try {
        const id = document.getElementById("editBrandId").value;
        const res = await axios.put(
          `/admin/brands-management/edit-brand/${id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (res.data.success) {
          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: "Brand updated successfully!",
            timer: 1500,
            showConfirmButton: false,
          }).then(() => window.location.reload());
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops!",
            text: res.data?.alert || "Failed to update brand",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: error.response?.data?.alert || "Internal server error",
        });
      }
    });

  // DELETE BRAND
  // ============================
  const deleteBrandModal = document.getElementById("deleteConfirmModal");
  deleteBrandModal.addEventListener("show.bs.modal", (e) => {
    const btn = e.relatedTarget;
    document.getElementById("deleteBrandId").value = btn.dataset.id;
    document.getElementById("deleteBrandName").textContent = btn.dataset.name;
  });

  document
    .getElementById("confirmDeleteBrand")
    .addEventListener("click", async () => {
      const id = document.getElementById("deleteBrandId").value;
      try {
        const res = await axios.patch(
          `/admin/brands-management/soft-delete-brand/${id}`
        );
        if (res.data.success) {
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        alert("Delete failed");
      }
    });

  //searching
  const searchBrandInput = document.getElementById("searchBrand");
  const paginationSection = document.getElementById("paginationSecction");

  // -------------------------------
  // SEARCH & PAGINATION
  // -------------------------------
  function debounce(cb, delay = 400) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), delay);
    };
  }

  async function applySearch(page = 1) {
    const search = searchBrandInput.value.trim();

    try {
      const res = await axios.get("/admin/brands-management", {
        params: { search, page, limit: 12 },
      });

      if (res.data.success) {
        renderBrand(res.data.result);
        renderPagination(res.data.currentPage, res.data.totalPages);
      } else {
        alertDiv.textContent = res.data.alert || "Invalid email or password.";
        alertDiv.style.display = "block";
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }

  window.loadPage = (page) => applySearch(page);

  function renderBrand(brands = []) {
    const tbody = document.getElementById("brandTable");
    if (!tbody) return;

    if (!Array.isArray(brands) || brands.length === 0) {
      tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          No Brands Found
        </td>
      </tr>
    `;
      return;
    }

    tbody.innerHTML = brands
      .map((brand, index) => {
        const { _id, name, country, image_url, isListed } = brand;

        return `
      <tr>
        <td class="fw-semibold text-muted">${index + 1}</td>

        <td>
          <div class="brand-logo">
            <img src="${image_url}" alt="${name}">
          </div>
        </td>

        <td class="fw-semibold text-dark">${name}</td>

        <td class="text-muted">${country}</td>

        <td>
          ${
            isListed
              ? `<span class="badge bg-success-subtle text-success fw-semibold">Listed</span>`
              : `<span class="badge bg-danger-subtle text-danger fw-semibold">Unlisted</span>`
          }
        </td>

        <td class="text-center">
          <div class="d-flex justify-content-center align-items-center gap-2">

            <!-- Edit -->
            <div data-bs-toggle="tooltip" title="Edit brand">
              <button
                class="btn btn-sm btn-outline-success edit-brand-btn"
                data-bs-toggle="modal"
                data-bs-target="#editBrandModal"
                data-id="${_id}"
                data-name="${name}"
                data-country="${country}"
                data-image="${image_url}">
                <i class="bi bi-pencil"></i>
              </button>
            </div>

            <!-- List / Unlist -->
            <div
              data-bs-toggle="tooltip"
              title="${isListed ? "Unlist brand" : "List brand"}">
              <button
                class="btn btn-sm ${
                  isListed ? "btn-outline-warning" : "btn-outline-success"
                } toggle-brand-status-btn"
                data-bs-toggle="modal"
                data-bs-target="#deleteConfirmModal"
                data-id="${_id}"
                data-name="${name}">
                <i class="bi ${isListed ? "bi-eye-slash" : "bi-eye"}"></i>
              </button>
            </div>

          </div>
        </td>
      </tr>
    `;
      })
      .join("");

    initTooltips();
  }
  function initTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      new bootstrap.Tooltip(el);
    });
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
        <a class="page-link" style="cursor:pointer" onclick="loadPage(${
          currentPage - 1
        })">
          <i class="bi bi-chevron-left"></i>
        </a>
      </li>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" style="cursor:pointer" onclick="loadPage(${i})">${i}</a>
        </li>`;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadPage(${
          currentPage + 1
        })">
          <i class="bi bi-chevron-right"></i>
        </a>
      </li>
    </ul>`;

    paginationSection.innerHTML = html;
  }

  const saveDebounce = debounce(applySearch, 400);
  searchBrandInput.addEventListener("input", saveDebounce);

  //Load initial data + pagination
  applySearch(1);
});
