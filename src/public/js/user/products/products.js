document.addEventListener("DOMContentLoaded", () => {
  // Mobile filter panel toggle
  const filterToggleBtn = document.getElementById("filterToggleBtn");
  const mobileFilterPanel = document.getElementById("mobileFilterPanel");
  const closeFilterBtn = document.getElementById("closeFilterBtn");

  filterToggleBtn.addEventListener("click", () => {
    mobileFilterPanel.classList.add("active");
    mobileFilterPanel.setAttribute("aria-hidden", "false");
    // Optionally lock body scroll when filter open
    document.body.style.overflow = "hidden";
  });

  closeFilterBtn.addEventListener("click", () => {
    mobileFilterPanel.classList.remove("active");
    mobileFilterPanel.setAttribute("aria-hidden", "true");
    // Restore body scroll
    document.body.style.overflow = "";
  });

  // Clear and Save buttons can be wired up as needed
  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    const checkboxes = mobileFilterPanel.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((cb) => (cb.checked = false));
    // You may want to trigger filter reset logic here
  });

  document.getElementById("saveFiltersBtn").addEventListener("click", () => {
    // Collect selections and apply filters
    filterToggleBtn.click(); // Close filter panel after saving
    // Implement filter apply mechanism here
  });
});
