document.addEventListener("DOMContentLoaded", () => {
  // ===== CLONE LOGO SLIDE FOR INFINITE SCROLL =====
  const slide = document.querySelector(".logos-slide");
  if (slide) {
    const copy = slide.cloneNode(true);
    const logosContainer = document.querySelector(".logos");
    if (logosContainer) logosContainer.appendChild(copy);
  }

  // ===== PAUSE ON HOVER (PREMIUM BRANDS TRACK) =====
  const track = document.querySelector(".brand-slide-track");
  if (track) {
    track.addEventListener("mouseenter", () => {
      track.style.animationPlayState = "paused";
    });
    track.addEventListener("mouseleave", () => {
      track.style.animationPlayState = "running";
    });
  }

  // ===== GSAP SETUP =====
  gsap.registerPlugin(ScrollTrigger);

  // ===== HERO SECTION ANIMATIONS =====
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // Hero Title
  tl.from(".hero-title", {
    duration: 1.5,
    y: 60,
    opacity: 0,
  });

  // Hero Subtitle
  tl.from(
    ".hero-subtitle",
    {
      duration: 1.2,
      y: 40,
      opacity: 0,
    },
    "-=0.8" // overlap
  );

  // Hero Button
  tl.from(
    ".hero-btn",
    {
      duration: 1,
      y: 20,
      opacity: 0,
      scale: 1,
    },
    "-=0.6"
  );

  // Extra hero fade-in for full section
  gsap.from(".hero-content", {
    opacity: 0,
    y: 80,
    duration: 1.5,
    ease: "power4.out",
  });

  // ===== PREMIUM BRANDS =====
  gsap.fromTo(
    ".premium-brands",
    { opacity: 0, y: 80 },
    {
      scrollTrigger: {
        trigger: ".premium-brands",
        start: "top 90%",
        toggleActions: "play none none reverse",
      },
      opacity: 1,
      y: 0,
      duration: 2,
      ease: "power3.out",
    }
  );

  gsap.from(".brand-logo", {
    scrollTrigger: {
      trigger: ".premium-brands",
      start: "top 70%",
    },
    opacity: 1,
    scale: 0.8,
    stagger: 0.1,
    duration: 3,
    ease: "back.out(1.7)",
  });

  // ===== FEATURED CATEGORIES =====
  gsap.from(".featured-categories h2, .featured-categories p", {
    scrollTrigger: {
      trigger: ".featured-categories",
      start: "top 80%",
    },
    opacity: 0,
    y: 0,
    stagger: 0.2,
    duration: 3,
  });

  gsap.from(".category-card", {
    scrollTrigger: {
      trigger: ".featured-categories",
      start: "top 70%",
    },
    opacity: 0,
    y: 0,
    duration: 3,
    stagger: 0.3,
    ease: "power3.out",
  });

  // ===== PREMIUM ACCESSORIES =====
  gsap.from(".premium-accessories h2", {
    scrollTrigger: {
      trigger: ".premium-accessories",
      start: "top 80%",
    },
    opacity: 0,
    y: 0,
    duration: 3,
  });

  gsap.from(".accessory-card", {
    scrollTrigger: {
      trigger: ".premium-accessories",
      start: "top 70%",
    },
    opacity: 0,
    y: 0,
    duration: 2,
    stagger: 0.2,
    ease: "power2.out",
  });

  // ===== EXPERIENCE LUXCART =====
  gsap.from(".experience-luxcart", {
    scrollTrigger: {
      trigger: ".experience-luxcart",
      start: "top 80%",
    },
    opacity: 0,
    scale: 0.9,
    duration: 1.2,
    ease: "power4.out",
  });
});
