document.addEventListener("DOMContentLoaded", () => {
  const slide = document.querySelector(".logos-slide");
  const copy = slide.cloneNode(true);
  document.querySelector(".logos").appendChild(copy);

  gsap.registerPlugin(ScrollTrigger);

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
    "-=0.8"
  ); // slight overlap

  // Hero Button
  tl.from(
    ".hero-btn",
    {
      duration: 1,
      y: 20,
      opacity: 0,
      scale: 1, // avoid scale 0, use scale 1 for safety
    },
    "-=0.6"
  );
});

document.addEventListener("DOMContentLoaded", () => {
  // Enable ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // 🏎️ HERO SECTION
  gsap.from(".hero-content", {
    opacity: 0,
    y: 80,
    duration: 1.5,
    ease: "power4.out",
  });

  // 🚗 PREMIUM BRANDS
  gsap.fromTo(
    ".premium-brands",
    { opacity: 0, y: 80 },
    {
      scrollTrigger: {
        trigger: ".premium-brands",
        start: "top 90%", // triggers earlier
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

  // 🏁 FEATURED CATEGORIES
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

  // 💎 PREMIUM ACCESSORIES
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

  // 🌌 EXPERIENCE LUXCART
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
