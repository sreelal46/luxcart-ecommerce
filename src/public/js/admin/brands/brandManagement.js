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
