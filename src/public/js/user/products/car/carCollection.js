document.addEventListener("DOMContentLoaded", () => {
  // GSAP timeline for page intro animations
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.from(".page-title", { opacity: 0, y: -30, duration: 0.7 })
    .from(".section-subtitle", { opacity: 0, y: 20, duration: 0.7 }, "-=0.5")
    .from(".filter-sidebar", { opacity: 0, x: -60, duration: 0.7 }, "-=0.3")
    .from(".search-input", { opacity: 0, y: 25, duration: 0.6 }, "-=0.3")
    .from(
      ".car-card",
      {
        opacity: 0,
        y: 30,
        duration: 0.7,
        stagger: 0.15,
      },
      "-=0.2"
    );

  // Button hover pulse for desktop view
  const buttons = document.querySelectorAll(".view-details-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      gsap.to(btn, { scale: 1.05, duration: 0.2, ease: "power1.out" });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { scale: 1, duration: 0.2, ease: "power1.out" });
    });
  });

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
