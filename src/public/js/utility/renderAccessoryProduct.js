window.renderAccessories = function (accessories) {
  const formatPrice = (price) => {
    if (!price) return "";
    return price
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      .toLocaleString("en-IN");
  };
  const container = document.getElementById("car-list");

  container.innerHTML = "";

  if (!accessories.length) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 no-products">
        <img src="images/9264822.jpg" alt="No Products" width="350" class="mb-3 no-products-img">
        <h4 class="fw-semibold no-products-title">No Accessories Found</h4>
        <p class="text-muted no-products-text">Try adjusting filters or search.</p>
      </div>
    `;

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

  accessories.forEach((item) => {
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4";
    card.innerHTML = `
      <div class="card car-card h-100 d-flex flex-column">
        <div class="car-image-wrapper position-relative">
          <img src="${item?.images?.[0] || "/images/default-car.jpg"}" alt="${
      item.name
    }" class="car-image"/>
          ${
            item?.category_id?.name
              ? `<span class="badge category-badge position-absolute top-0 start-0 m-3 text-capitalize">${item.category_id.name}</span>`
              : ""
          }
        </div>
        <div class="card-body p-4 flex-grow-1">
          <h6 class="brand-name mb-2">${item?.brand_id?.name || ""}</h6>
          <h5 class="car-name">${item.name}</h5>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="price-tag">₹ ${formatPrice(item.price)}</span>
            <span class="year-badge">${item.production_year || ""}</span>
          </div>
        </div>
        <div class="card-footer bg-white text-center border-0 p-3">
          <a href="/all-accessories/view-accessory-product/${
            item._id
          }" class="btn view-details-btn w-100">View Details</a>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  gsap.from(".car-card", {
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.15,
    ease: "power2.out",
  });
};
