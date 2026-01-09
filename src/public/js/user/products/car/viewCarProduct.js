let changingVariantId = null;
let changingVariantStock = null;
let cartItems = [];
let singleCarId;
let inCart;

const productId = document.getElementById("productId").value;
const defaultVariantId = document.getElementById("variantId").value;

// -----------------------------------------------------------
// CHANGE VARIANT
// -----------------------------------------------------------
async function changeVariantReq(button) {
  const priceBox = document.querySelector(".price");
  const originalPrice = document.querySelector(".original-price");
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

    if (!res.data.success) return;

    const variant = res.data.variant;

    cartItems = res.data.inCartVariants;
    changingVariantStock = variant.stock;
    inCart = res.data.inCart;

    /* ===== PRICE ANIMATION ===== */
    gsap.fromTo(
      priceBox,
      { scale: 0.9, opacity: 0.7 },
      { scale: 1, opacity: 1, duration: 0.3 }
    );

    /* ===== PRICE RENDER (IMPORTANT PART) ===== */
    if (variant.offerPrices?.finalPrice) {
      originalPrice.innerHTML = "";
      const discountText =
        variant.appliedOffer.discountType === "Percentage"
          ? `${variant.appliedOffer.discountValue}% OFF`
          : `₹${formatPrice(variant.appliedOffer.discountValue)} OFF`;

      priceBox.innerHTML = `
      <div class="price-wrapper">
        <div class="offer-price">
          ₹${formatPrice(variant.offerPrices.finalPrice)}
          <span class="offer-badge">${discountText}</span>
        </div>
        <div class="price original-price">
          ₹${formatPrice(variant.price)}
        </div>
        </div>
      `;
    } else {
      priceBox.innerHTML = `
        ₹${formatPrice(variant.price)}
      `;
    }

    /* ===== IMAGE UPDATE ===== */
    if (carouselInner) {
      carouselInner.innerHTML = "";

      variant.image_url.forEach((img, i) => {
        const div = document.createElement("div");
        div.className = `carousel-item ${i === 0 ? "active" : ""}`;

        const imgEl = document.createElement("img");
        imgEl.src = img;
        imgEl.className = "d-block w-100 car-main-img";

        div.appendChild(imgEl);
        carouselInner.appendChild(div);
      });

      carousel.to(0);
    }

    /* ===== ACTIVE VARIANT ===== */
    document
      .querySelectorAll(".variant-btn")
      .forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");
  } catch (err) {
    console.error("Variant change error:", err);
  }

  updateCartButton(inCart, changingVariantStock);
}

// -----------------------------------------------------------
// UPDATE ADD-TO-CART BUTTON & STOCK MESSAGE
// -----------------------------------------------------------
function updateCartButton(inCart, stock) {
  const cartBtnDesk = document.getElementById("addToCartDesk");
  console.log("Variant stock from updateCartButton", stock);

  document
    .querySelectorAll("#stockElement, #oldStock")
    .forEach((el) => el.remove());

  if (!cartBtnDesk) return;

  const currentVariant = changingVariantId;

  // ---------------- IN STOCK ----------------
  if (stock > 0) {
    cartBtnDesk.classList.remove("d-none");
    console.log("Variant stock from updateCartButton if stock ", stock);
    if (inCart) {
      cartBtnDesk.className = "btn btn-cart";
      cartBtnDesk.innerHTML = `<i class="bi bi-cart"></i> Go to Cart`;
      cartBtnDesk.setAttribute("href", "/cart");
      cartBtnDesk.removeAttribute("data-carid");
      cartBtnDesk.removeAttribute("data-variantId");
    } else {
      cartBtnDesk.className = "btn btn-cart";
      cartBtnDesk.innerHTML = `<i class="bi bi-cart"></i> Add to Cart`;
      cartBtnDesk.removeAttribute("href");
      cartBtnDesk.setAttribute("data-carid", singleCarId);
      cartBtnDesk.setAttribute("data-variantId", currentVariant);
    }

    return;
  }

  // ---------------- OUT OF STOCK ----------------
  cartBtnDesk.classList.add("d-none");

  const container = document.querySelector(".price-box");
  console.log("Parent container found:", container);
  console.log(
    "Variant stock from updateCartButton creating stockElement",
    stock
  );
  if (!container) return;
  console.log(
    "Variant stock from updateCartButton creating started stockElement",
    stock
  );
  const stockElement = document.createElement("div");
  stockElement.id = "stockElement";
  stockElement.className =
    "p-3 rounded-3 border border-danger bg-light text-danger mt-2 d-flex align-items-center";

  stockElement.innerHTML = `
    <i class="bi bi-exclamation-octagon-fill fs-5 me-2"></i>
    <span class="fw-semibold">Out of Stock</span>
  `;
  console.log(
    "Variant stock from updateCartButton creating finished stockElement",
    stock
  );
  container.appendChild(stockElement);
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
  console.log("after stock chnage and add to cart carid", productId);
  console.log("after stock chnage and add to cart carid", variantId);

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

  const btn = document.getElementById("wishlistBtn");
  const heart = document.getElementById("heartIcon");

  btn.addEventListener("click", async () => {
    const isFilled = heart.classList.contains("bi-heart-fill");

    try {
      console.log("first variant Id", variantId);

      const res = await axios.post(
        `/account/wishlist/add/${singleCarId ? singleCarId : productId}`,
        {
          variantId: changingVariantId || variantId,
          productType: "car",
        }
      );

      if (res.data.success) {
        // ---- UI TOGGLE FIXED ----
        if (isFilled) {
          // currently filled → set to unfilled
          heart.classList.remove("bi-heart-fill", "text-danger");
          heart.classList.add("bi-heart", "text-muted");
        } else {
          // currently unfilled → set to filled
          heart.classList.remove("bi-heart", "text-muted");
          heart.classList.add("bi-heart-fill", "text-danger");
        }

        showMobileAlert("Product added to Wishlist!", "success");
      } else {
        const msg = res.data.alert || "Something went wrong";
        showMobileAlert(msg, "error");
      }
    } catch (err) {
      console.error("Error from add to wishlist:", err);
      const msg = err.response?.data.alert || "INTERNAL SERVER ERROR";
      showMobileAlert(msg, "error");
    }
  });
});
