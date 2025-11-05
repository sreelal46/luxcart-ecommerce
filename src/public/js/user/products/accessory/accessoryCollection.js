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

  //searching
  const searchInput = document.getElementById("searchInputDesk");
  const searchInputMobile = document.getElementById("searchInputMob");

  function debounce(cb, delay = 400) {
    let timer;
    return function (...arg) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        cb(...arg);
      }, delay);
    };
  }

  // Save filters and close
  const saveBtnDesk = document.getElementById("saveFiltersBtn");
  const saveBtnMob = document.getElementById("saveFiltersBtnMobile");

  async function applyFilters(searchInput) {
    //search filter
    const search = searchInput.value.trim();

    //check box filter
    const checkBoxes = document.querySelectorAll(
      'input[type="checkbox"]:checked'
    );
    const filter = {};

    checkBoxes.forEach((box) => {
      const group = box.name;
      if (!group) return;
      if (!filter[group]) filter[group] = [];
      filter[group].push(box.value);
    });

    const params = {
      FilterPrice: filter.FilterPrice,
      FilterBrands: filter.FilterBrands,
      FilterCategories: filter.FilterCategories,
      FilterTypes: filter.FilterTypes,
      search,
    };

    try {
      const res = await axios.get("/all-accessories", {
        params,
        paramsSerializer: (params) => new URLSearchParams(params).toString(),
      });

      if (res.data.success) {
        const accessory = res.data.result;
        console.log(accessory);
        renderProducts(accessory);
        pagination.style.display = accessory.length > 12 ? "block" : "none";
      }
    } catch (error) {
      console.log("Error from Filtering", error);
    }
  }

  // Attach listeners
  const saveDebouns = debounce(() => applyFilters(searchInput), 500);
  const saveDebounsMobile = debounce(
    () => applyFilters(searchInputMobile),
    500
  );
  searchInput.addEventListener("input", saveDebouns);
  searchInputMobile.addEventListener("input", saveDebounsMobile);
  saveBtnDesk.addEventListener("click", () => applyFilters(searchInput));
  saveBtnMob.addEventListener("click", () => {
    closePanel(), applyFilters(searchInputMobile);
  });
});
