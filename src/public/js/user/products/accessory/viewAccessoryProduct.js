// Accordion Toggle
function toggleAccordion(header) {
  const accordion = header.parentElement;
  const content = accordion.querySelector(".accordion-content");
  const icon = header.querySelector("i");
  const isActive = accordion.classList.toggle("active");

  // Rotate icon
  gsap.to(icon, {
    rotate: isActive ? 180 : 0,
    duration: 0.3,
    ease: "power2.out",
  });

  // Smooth expand/collapse
  if (isActive) {
    gsap.fromTo(
      content,
      { height: 0, opacity: 0 },
      { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" }
    );
  } else {
    gsap.to(content, {
      height: 0,
      opacity: 0,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }
}

// Page Animations
document.addEventListener("DOMContentLoaded", () => {
  const isMobile = window.innerWidth <= 768;

  // Shared easing and duration
  const duration = isMobile ? 0.7 : 1;
  const yDistance = isMobile ? 30 : 40;

  // Common animations for both desktop & mobile
  gsap.from(".accessory-header", {
    opacity: 0,
    y: -yDistance,
    duration,
    ease: "power2.out",
  });

  gsap.from("#accessoryImageCarousel", {
    opacity: 0,
    x: isMobile ? 0 : -60,
    scale: isMobile ? 0.9 : 1,
    duration,
    delay: 0.2,
    ease: "power2.out",
  });

  gsap.from(".price-box", {
    opacity: 0,
    x: isMobile ? 0 : 60,
    y: isMobile ? yDistance : 0,
    duration,
    delay: 0.4,
    ease: "power2.out",
  });

  gsap.from(".description-section", {
    opacity: 0,
    y: yDistance,
    duration,
    delay: 0.6,
    ease: "power2.out",
  });

  gsap.from(".accordion-section", {
    opacity: 0,
    y: yDistance,
    duration,
    delay: 0.8,
    ease: "power2.out",
  });

  // Hover button effect (both devices)
  document.querySelectorAll(".btn-buy, .btn-cart").forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      gsap.to(btn, { scale: 1.05, duration: 0.2, ease: "power1.out" });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { scale: 1, duration: 0.2, ease: "power1.out" });
    });
  });

  // Read More toggle
  const descText = document.getElementById("descriptionText");
  const toggleBtn = document.getElementById("toggleDescBtn");

  if (descText && toggleBtn) {
    const fullText = descText.innerHTML.trim();

    if (fullText.length > 350) {
      const shortText = fullText.slice(0, 350) + "...";
      descText.innerHTML = shortText;
      toggleBtn.style.display = "inline-block";

      toggleBtn.addEventListener("click", () => {
        const isExpanded = descText.innerHTML !== shortText;

        gsap.to(descText, {
          opacity: 0,
          duration: 0.25,
          onComplete: () => {
            descText.innerHTML = isExpanded ? shortText : fullText;
            toggleBtn.textContent = isExpanded ? "Read More" : "Show Less";
            gsap.to(descText, { opacity: 1, duration: 0.25 });
          },
        });
      });
    } else {
      toggleBtn.style.display = "none";
    }
  }

  // Zoom effect (desktop only)
  if (!isMobile) {
    document.querySelectorAll(".zoom-container img").forEach((img) => {
      img.addEventListener("mousemove", (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        e.target.style.transformOrigin = `${x}% ${y}%`;
      });
      img.addEventListener("mouseleave", (e) => {
        e.target.style.transformOrigin = "center center";
      });
    });
  }
});
