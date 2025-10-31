document.addEventListener("DOMContentLoaded", () => {
  const isMobile = window.innerWidth <= 768; // breakpoint check
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (isMobile) {
    // 🌿 Mobile Animations (simpler, shorter, fade + slight slide)
    tl.from(".page-title", { opacity: 0, y: -20, duration: 0.5 })
      .from(".section-subtitle", { opacity: 0, y: 15, duration: 0.5 }, "-=0.3")
      .from(".search-input", { opacity: 0, y: 15, duration: 0.4 }, "-=0.3")
      .from(
        ".car-card",
        {
          opacity: 0,
          y: 25,
          duration: 0.4,
          stagger: 0.1,
        },
        "-=0.2"
      )
      .from(".filter-sidebar", { opacity: 0, x: -30, duration: 0.5 }, "-=0.4");
  } else {
    // 💻 Desktop Animations (more detailed, layered movement)
    tl.from(".page-title", { opacity: 0, y: -30, duration: 0.7 })
      .from(".section-subtitle", { opacity: 0, y: 20, duration: 0.7 }, "-=0.5")
      .from(".filter-sidebar", { opacity: 0, x: -60, duration: 0.7 }, "-=0.3")
      .from(".search-input", { opacity: 0, y: 25, duration: 0.6 }, "-=0.3")
      .from(
        ".car-card",
        {
          opacity: 0,
          y: 30,
          duration: 0.6,
          stagger: 0.15,
        },
        "-=0.2"
      );
  }

  // ✨ Button hover pulse — only for desktop
  if (!isMobile) {
    const buttons = document.querySelectorAll(".view-details-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        gsap.to(btn, { scale: 1.05, duration: 0.2, ease: "power1.out" });
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { scale: 1, duration: 0.2, ease: "power1.out" });
      });
    });
  }
});
