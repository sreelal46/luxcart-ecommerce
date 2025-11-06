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
      const brandName = brandNameInput.value.trim();
      const brandCountry = brandCountryInput.value.trim();
      const brandImageInput = document.getElementById("brandImageInput");

      if (!brandName) return;
      if (!brandCountry) return;
      if (!brandImageInput.files || brandImageInput.files.length === 0) {
        brandImageError.textContent =
          "Please upload an image before submitting.";
        brandImageError.style.display = "block";
        return;
      } else {
        brandImageError.textContent = "";
        brandImageError.style.display = "none";
      }

      const formData = new FormData();
      formData.append("name", e.target.name.value);
      formData.append("country", e.target.country.value);

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
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (res.data.success) {
          alertDiv.className = "alert alert-success text-center";
          alertDiv.textContent = "Brand added successfully!";
          setTimeout(() => window.location.reload(), 500);
        } else {
          alertDiv.className = "alert alert-danger text-center";
          alertDiv.textContent = res.data.message || "Failed to add brand";
        }
      } catch (err) {
        console.error(err);
        alertDiv.className = "alert alert-danger text-center";
        alertDiv.textContent = "Upload failed";
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
  document
    .getElementById("editBrandForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editBrandId").value;

      const brandName = editBrandNameInput.value.trim();
      const brandCountry = editBrandCountryInput.value.trim();
      if (!brandName) return;
      if (!brandCountry) return;

      const formData = new FormData();
      formData.append("name", document.getElementById("editBrandName").value);
      formData.append(
        "country",
        document.getElementById("editBrandCountry").value
      );

      // If a new image was cropped
      if (editCropper) {
        const blob = await new Promise((resolve) =>
          editCropper.getCroppedCanvas().toBlob(resolve, "image/png")
        );
        formData.append("image", blob, "updated.png");
      }

      const localAlert = e.target.querySelector("#alert");
      localAlert.className = "alert alert-info text-center";
      localAlert.textContent = "Updating...";
      localAlert.classList.remove("d-none");

      try {
        const res = await axios.put(
          `/admin/brands-management/edit-brand/${id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (res.data.success) {
          localAlert.className = "alert alert-success text-center";
          localAlert.textContent = "Brand updated successfully!";
          setTimeout(() => window.location.reload(), 400);
        } else {
          localAlert.className = "alert alert-danger text-center";
          localAlert.textContent = res.data.message || "Failed to update brand";
        }
      } catch (err) {
        console.error(err);
        localAlert.className = "alert alert-danger text-center";
        localAlert.textContent = "Update failed";
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
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }

  window.loadPage = (page) => applySearch(page);

  function renderBrand(brands = []) {
    const tbody = document.getElementById("brandTable");
    if (!tbody) return console.error("brandTable element not found");

    tbody.innerHTML = brands
      .map((brand, index) => {
        const { _id, name, country, image_url, isListed } = brand;

        return `
        <tr>
          <td>${index + 1}</td>
          <td><img src="${image_url}" alt="${name}" class="rounded"
            style="width:50px; height:50px; object-fit:cover;"></td>
          <td class="fw-semibold">${name}</td>
          <td>${country}</td>
          <td class="${isListed ? "text-success" : "text-danger"}">
            ${isListed ? "Listed" : "Unlisted"}
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-2 editBrandBtn"
              data-id="${_id}" data-name="${name}" data-country="${country}"
              data-image="${image_url}" data-bs-toggle="modal"
              data-bs-target="#editBrandModal">
              <i class="bi bi-pencil-fill"></i>
            </button>
            <button class="btn btn-sm ${
              isListed ? "btn-outline-warning" : "btn-outline-success"
            } deleteBrandBtn"
              data-id="${_id}" data-name="${name}"
              data-bs-toggle="modal" data-bs-target="#deleteConfirmModal">
              <i class="bi ${
                isListed ? "bi-eye-slash-fill" : "bi-eye-fill"
              }"></i>
            </button>
          </td>
        </tr>`;
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

  // ✅ Load initial data + pagination
  applySearch(1);
});
