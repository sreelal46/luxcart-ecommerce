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
});
