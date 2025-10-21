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
    currentDeleteId = id; // ✅ store for later use
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
});
