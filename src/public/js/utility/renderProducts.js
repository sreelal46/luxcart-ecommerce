window.renderProducts = function (products) {
  const container = document.getElementById("carList");

  const firstImage = (variantIds) => {
    if (variantIds && variantIds.length > 0) {
      const firstVariant = variantIds[0];
      if (firstVariant.image_url && firstVariant.image_url.length > 0) {
        return firstVariant.image_url[0];
      }
    }
    return "/images/default-car.jpg"; // fallback image
  };

  container.innerHTML = "";

  // Handle empty results
  if (!products.length) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 no-products">
        <img src="images/9264822.jpg" alt="No Products" width="350" class="mb-3 no-products-img">
        <h4 class="fw-semibold no-products-title">No Products Found</h4>
        <p class="text-muted no-products-text">Try adjusting your filters or search term.</p>
      </div>
    `;

    // Animate "No Products Found"
    gsap.from(".no-products", {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: "power2.out",
    });
    gsap.from(".no-products-img", {
      opacity: 0,
      scale: 0.8,
      duration: 0.8,
      delay: 0.1,
      ease: "back.out(1.7)",
    });
    gsap.from([".no-products-title", ".no-products-text"], {
      opacity: 0,
      y: 20,
      duration: 0.6,
      stagger: 0.15,
      delay: 0.2,
    });

    return;
  }

  // Render product cards
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4";
    card.innerHTML = `
      <div class="card car-card">
        <div class="car-image-wrapper position-relative">
          <img src="${firstImage(product.variantIds)}" alt="${
      product.name
    }" class="car-image" />
          ${
            product.category
              ? `<span class="badge category-badge position-absolute top-0 start-0 m-3 text-capitalize">${product.category}</span>`
              : ""
          }
        </div>
        <div class="card-body p-4">
          <h6 class="brand-name mb-2">${product.brand}</h6>
          <h5 class="car-name">${product.name}</h5>
          <div class="d-flex justify-content-between align-items-center mt-3">
            ${
              product.isListed
                ? `<span class="price-tag">₹${product.price.toLocaleString()}</span>`
                : `<span class="price-tag text-danger fw-bold">Not Available</span>`
            }
            <span class="year-badge">${product.year}</span>
          </div>
        </div>
        <div class="card-footer bg-white text-center border-0 p-3">
          <a href="/cars-collection/view-car-product/${
            product._id
          }" class="btn view-details-btn w-100">View Details</a>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Animate product cards
  gsap.from(".car-card", {
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.15,
    ease: "power2.out",
  });
};
