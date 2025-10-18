// Prefill Edit Type Modal
const editTypeModal = document.getElementById("editTypeModal");
editTypeModal.addEventListener("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  document.getElementById("editTypeId").value = button.getAttribute("data-id");
  document.getElementById("editTypeName").value =
    button.getAttribute("data-name");
  document.getElementById("editTypeDescription").value =
    button.getAttribute("data-description");
});

// Prefill Delete Type Modal
const deleteTypeModal = document.getElementById("deleteTypeModal");
deleteTypeModal.addEventListener("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  document.getElementById("deleteTypeName").textContent =
    button.getAttribute("data-name");
});
