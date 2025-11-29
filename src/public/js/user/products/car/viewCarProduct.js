let changingVariantId = null;
let cartItems = [];
let singleCarId;
const productId = document.getElementById("productId").value;

async function changeVariantReq(button) {
  const priceBox = document.querySelector(".price");
  const carouselInner = document.querySelector(
    "#carImageCarousel .carousel-inner"
  );
  const carousel = bootstrap.Carousel.getOrCreateInstance(
    document.getElementById("carImageCarousel")
  );

  const variantId = button.getAttribute("data-variantid");
  changingVariantId = variantId;
  singleCarId = productId;

  const formatPrice = (price) => {
    if (!price) return "";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  try {
    const res = await axios.get(
      `/cars-collection/view-car-product/${productId}?variantId=${variantId}`
    );

    if (res.data.success) {
      cartItems = res.data.inCartVariants;

      // Price animation
      gsap.fromTo(
        priceBox,
        { scale: 0.9, opacity: 0.7 },
        { scale: 1, opacity: 1, duration: 0.3 }
      );

      priceBox.textContent = "₹ " + formatPrice(res.data.variant.price);

      // Image animation
      gsap.from("#carImageCarousel", {
        opacity: 0,
        x: -60,
        duration: 1,
        ease: "power2.out",
      });

      if (carouselInner) {
        carouselInner.innerHTML = "";
        res.data.variant.image_url.forEach((img, i) => {
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

        carousel.to(0);
      }

      // Highlight selected variant
      document
        .querySelectorAll(".variant-btn")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    }
  } catch (error) {
    console.log("Error from changing variant", error);
  }

  updateCartButton();
}

// Update Add-to-Cart / Go-to-Cart button
function updateCartButton() {
  const cartBtnDesk = document.getElementById("addToCartDesk");
  if (!cartBtnDesk) return;

  const currentVariant = changingVariantId;

  const inCart =
    Array.isArray(cartItems) &&
    currentVariant &&
    cartItems.includes(currentVariant);

  if (inCart) {
    cartBtnDesk.innerHTML = `<i class="bi bi-cart"></i> Go to Cart`;
    cartBtnDesk.setAttribute("href", "/cart");
    cartBtnDesk.removeAttribute("data-carid");
    cartBtnDesk.removeAttribute("data-variantId");
  } else {
    cartBtnDesk.innerHTML = `<i class="bi bi-cart"></i> Add to Cart`;
    cartBtnDesk.removeAttribute("href");

    if (currentVariant) {
      cartBtnDesk.setAttribute("data-variantId", currentVariant);
    }
    cartBtnDesk.setAttribute("data-carid", singleCarId);
  }
}

// Zoom feature (Desktop only)
document.addEventListener("DOMContentLoaded", () => {
  const zoomContainers = document.querySelectorAll(".zoom-container");

  zoomContainers.forEach((container) => {
    const img = container.querySelector("img");
    let isZoomed = false;

    // Desktop hover zoom
    container.addEventListener("mousemove", (e) => {
      if (window.innerWidth <= 768) return; // No mobile zoom

      if (!isZoomed) {
        img.style.transition = "transform 0.3s ease";
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

    container.addEventListener("mouseleave", () => {
      if (window.innerWidth <= 768) return; // No mobile zoom
      img.style.transform = "scale(1)";
      img.style.transformOrigin = "center center";
      isZoomed = false;
    });
  });
});

// Accordion toggle with GSAP
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

  if (desc && btn) {
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
  }

  //GSAP Entrance Animations (Desktop & Mobile)
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Mobile animations (fade & slide)
    gsap.from(".car-header", {
      opacity: 0,
      y: -20,
      duration: 0.6,
      ease: "power2.out",
    });
    gsap.from(".car-main-img", {
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      delay: 0.2,
      ease: "power2.out",
    });
    gsap.from(".price-box", {
      opacity: 0,
      y: 30,
      duration: 0.8,
      delay: 0.4,
      ease: "power2.out",
    });
    gsap.from(".accordion", {
      opacity: 0,
      y: 30,
      duration: 0.8,
      delay: 0.6,
      ease: "power2.out",
    });
  } else {
    //Desktop animations (slightly bolder)
    gsap.from(
      ".car-header, .car-main-img, .price-box, .accordion, .related-card",
      {
        opacity: 0,
        y: 40,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
      }
    );
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const addToCartDesk = document.getElementById("addToCartDesk");
  const buyProductDesk = document.getElementById("buyProductDesk");
  const addToCartMob = document.getElementById("addToCartMob");
  const buyProductMob = document.getElementById("buyProductMob");

  function showMobileAlert(message, notification) {
    const alertBox = document.getElementById("mobileAlert");
    if (notification === "success") {
      alertBox.innerHTML = `<i class="bi bi-check-circle-fill success-icon"></i><span class="message-green">${message}</span>`;
      alertBox.classList.add("show");
    } else if (notification === "error") {
      alertBox.innerHTML = `<i class="bi bi-x-circle-fill error-icon"></i><span class="message-red">${message}</span>`;
      alertBox.classList.add("show");
    } else if (notification === "warning") {
      alertBox.innerHTML = `<i class="bi bi-exclamation-triangle-fill yellow-icon"></i><span class="message-yellow">${message}</span>`;
      alertBox.classList.add("show");
    }

    setTimeout(() => {
      alertBox.classList.remove("show");
    }, 3000);
  }

  // Read product & variant ID from button
  const productId = addToCartDesk.dataset.carid;
  const variantId = addToCartDesk.dataset.variantid;

  //add to cart axios call function
  function addToCartAxios(element, productType, productId, variantId) {
    element.addEventListener("click", async () => {
      try {
        const res = await axios.post("/cart/add", {
          productType,
          productId,
          variantId: changingVariantId || variantId,
        });

        if (res.data.success) {
          showMobileAlert("Product added to cart!", "success");
          // Change text
          element.innerHTML = `<i class="bi bi-cart"></i> Go to Cart`;
          element.href = "/cart";
        } else {
          const msg = res.data.alert || "Somthing went worng";
          showMobileAlert(msg, "error");
        }
      } catch (error) {
        console.log("Error from add to cart FRONTEND", error);
        const msg = error.response?.data.alert || "INTERNAL SERVER ERROR";
        showMobileAlert(msg, "error");
      }
    });
  }

  addToCartAxios(addToCartDesk, "car", productId, variantId);
  addToCartAxios(addToCartMob, "car", productId, variantId);
});
