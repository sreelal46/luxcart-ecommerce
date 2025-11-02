document.addEventListener("DOMContentLoaded", () => {
  const filterToggleBtn = document.getElementById("filterToggleBtn");
  const mobileFilterPanel = document.getElementById("mobileFilterPanel");
  const closeFilterBtn = document.getElementById("closeFilterBtn");

  // Create overlay dynamically
  const overlay = document.createElement("div");
  overlay.id = "filterOverlay";
  document.body.appendChild(overlay);

  function openPanel() {
    mobileFilterPanel.classList.add("active");
    mobileFilterPanel.setAttribute("aria-hidden", "false");
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closePanel() {
    mobileFilterPanel.classList.remove("active");
    mobileFilterPanel.setAttribute("aria-hidden", "true");
    overlay.style.display = "none";
    document.body.style.overflow = "";
  }

  // Open filter
  filterToggleBtn.addEventListener("click", openPanel);

  // Close filter with X button or outside click
  closeFilterBtn.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);

  // Clear all filters
  const clearBtn = document.getElementById("clearFiltersBtn");
  clearBtn.addEventListener("click", () => {
    const checkboxes = mobileFilterPanel.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((cb) => (cb.checked = false));
  });

  // Save filters and close
  const saveBtn = document.getElementById("saveFiltersBtn");
  saveBtn.addEventListener("click", () => {
    closePanel();
    // Add filter logic here if needed
  });
});
