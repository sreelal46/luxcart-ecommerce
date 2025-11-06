document.addEventListener("DOMContentLoaded", () => {
  const filterToggleBtn = document.getElementById("filterToggleBtn");
  const mobileFilterPanel = document.getElementById("mobileFilterPanel");
  const closeFilterBtn = document.getElementById("closeFilterBtn");
  const filterSidebar = document.getElementById("filterSidebar");
  const paginationSection = document.getElementById("paginationSecction");

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

  async function applyFilters(searchInput, page = 1) {
    //search filter
    const search = searchInput.value.trim();

    //check box filter
    const checkBoxes = document.querySelectorAll(
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
      search,
      page,
      limit: 12,
    };

    try {
      const res = await axios.get("/cars-collection", {
        params,
        paramsSerializer: (params) => new URLSearchParams(params).toString(),
      });

      if (res.data.success) {
        const cars = res.data.result;
        renderProducts(cars);
        renderPagination(res.data.currentPage, res.data.totalPages);
      }
    } catch (error) {
      console.log("Error from Filtering", error);
    }
  }

  // Pagination Renderer
  window.loadPage = function (page) {
    const input = window.innerWidth < 768 ? searchInputMobile : searchInputDesk;
    applyFilters(input, page);
  };

  function renderPagination(currentPage, totalPages) {
    if (!paginationSection) return;

    if (totalPages <= 1) {
      paginationSection.style.display = "none";
      return;
    }

    paginationSection.style.display = "block";

    let html = `<ul class="pagination justify-content-center">`;

    html += `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadPage(${
          currentPage - 1
        })"><i class="bi bi-chevron-left"></i></a>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" style="cursor:pointer" onclick="loadPage(${i})">${i}</a>
        </li>
      `;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" style="cursor:pointer" onclick="loadPage(${
          currentPage + 1
        })"><i class="bi bi-chevron-right"></i></a>
      </li>
    `;

    html += `</ul>`;

    paginationSection.innerHTML = html;
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

  applyFilters(searchInput, 1);
});
