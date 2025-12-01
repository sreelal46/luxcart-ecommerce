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
//notification
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

// Description read more/less toggle with GSAP animation
document.addEventListener("DOMContentLoaded", () => {
  const desc = document.getElementById("descriptionText");
  const btn = document.getElementById("toggleDescBtn");

  if (!desc || !btn) return;

  // Initial collapsed state
  const collapsedHeight = 160;
  desc.style.maxHeight = collapsedHeight + "px";
  desc.style.overflow = "hidden";
  desc.style.transition = "none"; // disable CSS transitions to rely on GSAP only

  let isExpanded = false;

  btn.addEventListener("click", () => {
    if (!isExpanded) {
      // 🔹 Expand animation
      gsap.to(desc, {
        maxHeight: desc.scrollHeight + 40 + "px", // add little padding for natural feel
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      });
      gsap.fromTo(
        desc,
        { y: 10, opacity: 0.8 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
      btn.textContent = "Read Less";
    } else {
      // 🔹 Collapse animation
      gsap.to(desc, {
        maxHeight: collapsedHeight,
        duration: 0.6,
        ease: "power2.inOut",
      });
      gsap.fromTo(
        desc,
        { y: 0, opacity: 1 },
        { y: -10, opacity: 0.8, duration: 0.4, ease: "power2.in" }
      );
      btn.textContent = "Read More";
    }

    isExpanded = !isExpanded;
  });
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

  // Read product
  const productId = addToCartDesk.dataset.accessoryid;
  //add to cart axios call function
  function addToCartAxios(element, productType, productId) {
    element.addEventListener("click", async () => {
      try {
        const res = await axios.post("/cart/add", {
          productType,
          productId,
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

  addToCartAxios(addToCartDesk, "accessory", productId);
  addToCartAxios(addToCartMob, "accessory", productId);

  function directBuyAxios(element, productType, productId) {
    element.addEventListener("click", async () => {
      console.log("bue item clicked");
      try {
        const res = await axios.post("/cart/add", {
          productType,
          productId,
          directBuy: true,
        });

        if (res.data.success) {
          window.location.href = res.data.redirect;
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

  directBuyAxios(buyProductDesk, "accessory", productId);
});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("wishlistBtn");
  const heart = document.getElementById("heartIcon");
  const productId = btn.dataset.accessoryid;
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const isFilled = heart.classList.contains("bi-heart-fill");

    try {
      console.log("button cliced", productId);
      const res = await axios.post(`/account/wishlist/add/${productId}`, {
        variantId: null,
        productType: "accessory",
      });

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
