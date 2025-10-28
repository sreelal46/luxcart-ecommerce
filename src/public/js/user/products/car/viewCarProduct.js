// Change variant - update price and carousel images
function changeVariant(button) {
  const priceBox = document.querySelector(".price");
  const carouselInner = document.querySelector(
    "#carImageCarousel .carousel-inner"
  );
  const carousel = bootstrap.Carousel.getOrCreateInstance(
    document.getElementById("carImageCarousel")
  );

  const price = button.getAttribute("data-price");
  const images = JSON.parse(button.getAttribute("data-images"));

  // Animate price update
  gsap.fromTo(
    priceBox,
    { scale: 0.9, opacity: 0.6 },
    { scale: 1, opacity: 1, duration: 0.3 }
  );
  priceBox.textContent = "₹" + price;

  // Update carousel images
  if (carouselInner) {
    carouselInner.innerHTML = "";
    images.forEach((img, i) => {
      const div = document.createElement("div");
      div.className = "carousel-item" + (i === 0 ? " active" : "");
      const zoomDiv = document.createElement("div");
      zoomDiv.className = "zoom-container";

      const imageElem = document.createElement("img");
      imageElem.src = img;
      imageElem.className = "d-block w-100 car-main-img";
      imageElem.alt = button.getAttribute("data-color");

      zoomDiv.appendChild(imageElem);
      div.appendChild(zoomDiv);
      carouselInner.appendChild(div);
    });
    // Reset to first image after updating items
    carousel.to(0);
  }

  // Highlight the active variant button
  document
    .querySelectorAll(".variant-btn")
    .forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");
}

// Zoom and pan feature
document.addEventListener("DOMContentLoaded", () => {
  const zoomContainers = document.querySelectorAll(".zoom-container");

  zoomContainers.forEach((container) => {
    const img = container.querySelector("img");

    let isZoomed = false;
    let startX,
      startY,
      x = 0,
      y = 0;

    // Desktop zoom on hover with pan
    container.addEventListener("mousemove", (e) => {
      if (window.innerWidth <= 768) return; // disable for mobile

      if (!isZoomed) {
        img.style.transform = "scale(1.5)";
        isZoomed = true;
      }

      const rect = container.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const moveX = (offsetX / rect.width) * 100;
      const moveY = (offsetY / rect.height) * 100;

      img.style.transformOrigin = `${moveX}% ${moveY}%`;
    });

    container.addEventListener("mouseleave", (e) => {
      if (window.innerWidth <= 768) return; // disable for mobile
      img.style.transform = "scale(1)";
      img.style.transformOrigin = "center center";
      isZoomed = false;
    });

    // Mobile double tap zoom toggle
    let lastTap = 0;

    container.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;

      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        if (isZoomed) {
          img.style.transform = "scale(1)";
          img.style.transformOrigin = "center center";
          isZoomed = false;
        } else {
          img.style.transform = "scale(2)";
          img.style.transformOrigin = "center center";
          isZoomed = true;
        }
        e.preventDefault();
      }

      lastTap = currentTime;
    });
  });
});

// Accordion toggle
function toggleAccordion(header) {
  const accordion = header.parentElement;
  const content = header.nextElementSibling;
  const isActive = accordion.classList.toggle("active");

  if (isActive) {
    gsap.to(content, {
      height: "auto",
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    });
  } else {
    gsap.to(content, {
      height: 0,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
    });
  }
}

// Description read more/less toggle
document.addEventListener("DOMContentLoaded", () => {
  const desc = document.getElementById("descriptionText");
  const btn = document.getElementById("toggleDescBtn");

  desc.style.maxHeight = "160px";
  desc.style.overflow = "hidden";

  btn.addEventListener("click", () => {
    const isExpanded = desc.classList.toggle("expanded");
    if (isExpanded) {
      gsap.to(desc, {
        maxHeight: desc.scrollHeight + "px",
        duration: 0.6,
        ease: "power2.out",
      });
      btn.textContent = "Read Less";
    } else {
      gsap.to(desc, { maxHeight: "160px", duration: 0.5, ease: "power2.in" });
      btn.textContent = "Read More";
    }
  });

  // Entrance animations
  gsap.from(
    ".car-header, .car-main-img, .price-box, .accordion, .related-card",
    {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
    }
  );
});
