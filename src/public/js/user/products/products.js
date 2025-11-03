document.addEventListener("DOMContentLoaded", () => {
  const filterToggleBtn = document.getElementById("filterToggleBtn");
  const mobileFilterPanel = document.getElementById("mobileFilterPanel");
  const closeFilterBtn = document.getElementById("closeFilterBtn");
  const filterSidebar = document.getElementById("filterSidebar");
  const pagination = document.getElementById("paginationSecction");

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

  const clearBtnDesk = document.getElementById("clearFiltersBtnDesk");
  clearBtnDesk.addEventListener("click", () => {
    const checkboxes = filterSidebar.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => (cb.checked = false));
  });

  // Save filters and close
  const saveBtnDesk = document.getElementById("saveFiltersBtn");
  const saveBtnMob = document.getElementById("saveFiltersBtnMobile");

  async function applyFilters(sourcePanel) {
    closePanel();

    const checkBoxes = sourcePanel.querySelectorAll(
      'input[type="checkbox"]:checked'
    );
    const filter = {};

    checkBoxes.forEach((box) => {
      const group = box.name;
      if (!group) return; // skip invalid
      if (!filter[group]) filter[group] = [];
      filter[group].push(box.value);
    });

    console.log(filter);
    const params = {
      FilterPrice: filter.FilterPrice,
      FilterBrands: filter.FilterBrands,
      FilterCategories: filter.FilterCategories,
      FilterTypes: filter.FilterTypes,
    };

    try {
      const res = await axios.get("/cars-collection", {
        params,
        paramsSerializer: (params) => new URLSearchParams(params).toString(),
      });

      if (res.data.success) {
        const cars = res.data.result;
        renderProducts(cars);
        pagination.style.display = cars.length > 12 ? "block" : "none";
      }
    } catch (error) {
      console.log("Error from Filtering", error);
    }
  }

  // Attach listeners for both
  saveBtnDesk.addEventListener("click", () => applyFilters(filterSidebar));
  saveBtnMob.addEventListener("click", () => applyFilters(mobileFilterPanel));
});
