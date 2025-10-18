// Prefill Offer Modal
const offerModal = document.getElementById("addOfferModal");
offerModal.addEventListener("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  const name = button.getAttribute("data-name");
  document.getElementById("offerCategoryName").textContent = name;
});

// Prefill List/Unlist Modal
const toggleStatusModal = document.getElementById("toggleStatusModal");
toggleStatusModal.addEventListener("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  const name = button.getAttribute("data-name");
  const status = button.getAttribute("data-status");
  document.getElementById("toggleStatusName").textContent = name;
  document.getElementById("toggleStatusAction").textContent = status;
});
