// // Prefill Offer Modal
// const offerModal = document.getElementById("addOfferModal");
// offerModal.addEventListener("show.bs.modal", (event) => {
//   const button = event.relatedTarget;
//   const name = button.getAttribute("data-name");
//   document.getElementById("offerCategoryName").textContent = name;
// });

// // Prefill List/Unlist Modal
// const toggleStatusModal = document.getElementById("toggleStatusModal");
// toggleStatusModal.addEventListener("show.bs.modal", (event) => {
//   const button = event.relatedTarget;
//   const name = button.getAttribute("data-name");
//   const status = button.getAttribute("data-status");
//   document.getElementById("toggleStatusName").textContent = name;
//   document.getElementById("toggleStatusAction").textContent = status;
// });

document.addEventListener("DOMContentLoaded", () => {
  // -------------------- Add Category --------------------
  const addCategoryForm = document.getElementById("addCategoryForm");
  const addAlert = document.getElementById("addAlert");
  const addCategoryModal = document.getElementById("addCategoryModal");

  // Reset form when modal opens
  addCategoryModal.addEventListener("shown.bs.modal", () => {
    addCategoryForm.reset();
    addAlert.classList.add("d-none");
    // Remove any checked state
    document
      .querySelectorAll('#addCategoryModal input[type="radio"]')
      .forEach((r) => (r.checked = false));
  });

  addCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

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

    const data = Object.fromEntries(new FormData(addCategoryForm).entries());
    addAlert.className = "alert alert-info text-center";
    addAlert.textContent = "Processing...";
    addAlert.classList.remove("d-none");

    try {
      const res = await axios.post(
        "/admin/categorys-management/add-category",
        data
      );
      if (res.data.success) {
        addAlert.className = "alert alert-success text-center";
        addAlert.textContent = "Category added successfully!";
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      addAlert.className = "alert alert-danger text-center";
      addAlert.textContent =
        err.response?.data?.alert || "Something went wrong";
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

    // Set radio buttons
    const type = btn.dataset.type;
    document.getElementById("editTypeCar").checked = type === "Car";
    document.getElementById("editTypeAccessories").checked =
      type === "Accessories";
  });

  editCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editCategoryId").value;
    const data = Object.fromEntries(new FormData(editCategoryForm).entries());
    editAlert.className = "alert alert-info text-center";
    editAlert.textContent = "Updating...";
    editAlert.classList.remove("d-none");

    try {
      const res = await axios.put(
        `/admin/categorys-management/edit-category/${id}`,
        data
      );
      if (res.data.success) {
        editAlert.className = "alert alert-success text-center";
        editAlert.textContent = "Category updated successfully!";
        setTimeout(() => window.location.reload(), 600);
      } else {
        editAlert.className = "alert alert-danger text-center";
        editAlert.textContent = res.data.message || "Failed to update Category";
      }
    } catch (err) {
      editAlert.className = "alert alert-danger text-center";
      editAlert.textContent = "Update failed";
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
});
