window.renderAccessories = function (accessories) {
  const container = document.getElementById("car-list");

  /* =============================
     PRICE FORMATTER
  ============================== */
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "";
    return Math.round(price).toLocaleString("en-IN");
  };

  /* =============================
     STOCK BADGE
  ============================== */
  const getStockBadge = (stock) => {
    if (stock === 0 || stock === null || stock === undefined) {
      return `
        <span class="badge stock-badge out-of-stock position-absolute top-0 end-0 m-3">
          Out of Stock
        </span>`;
    }

    if (stock <= 4) {
      return `
        <span class="badge stock-badge low-stock position-absolute top-0 end-0 m-3">
          Only ${stock} Left!
        </span>`;
    }

    return "";
  };

  /* =============================
     OFFER BADGE (POSITIONED AT BOTTOM-LEFT LIKE CARS)
  ============================== */
  const getAccessoryOfferBadge = (item) => {
    const now = new Date();
    const offer = item.productOffer || item.categoryOffer;

    // If final price already calculated
    if (item.offerPrices?.finalPrice && offer) {
      if (item.appliedOffer.discountType === "Percentage") {
        return `
          <span class="badge bg-success position-absolute bottom-0 start-0 m-3">
            ${item.appliedOffer.discountValue}% OFF
          </span>`;
      }

      if (item.appliedOffer.discountType === "Price") {
        return `
          <span class="badge bg-success position-absolute bottom-0 start-0 m-3">
            ₹${item.appliedOffer.discountValue} OFF
          </span>`;
      }
    }

    // Validate product/category offer
    if (
      offer &&
      offer.isActive &&
      new Date(offer.validFrom) <= now &&
      new Date(offer.validTo) >= now
    ) {
      if (offer.discountType === "Percentage") {
        return `
          <span class="badge bg-success position-absolute bottom-0 start-0 m-3">
            ${offer.discountValue}% OFF
          </span>`;
      }

      if (offer.discountType === "Price") {
        return `
          <span class="badge bg-success position-absolute bottom-0 start-0 m-3">
            ₹${offer.discountValue} OFF
          </span>`;
      }
    }

    return "";
  };

  /* =============================
     PRICE + OFFER HANDLER
  ============================== */
  const getAccessoryPriceHTML = (item) => {
    if (!item.isListed) {
      return `<span class="price-tag text-danger fw-bold">Not Available</span>`;
    }

    const originalPrice = Number(item.price);
    let offerPrice = item.offerPrices?.finalPrice;

    // Fallback calculation
    if (!offerPrice) {
      const offer = item.productOffer || item.categoryOffer;

      if (
        offer &&
        offer.isActive &&
        new Date(offer.validFrom) <= new Date() &&
        new Date(offer.validTo) >= new Date()
      ) {
        if (offer.discountType === "Percentage") {
          offerPrice =
            originalPrice - (originalPrice * offer.discountValue) / 100;
        }

        if (offer.discountType === "Price") {
          offerPrice = originalPrice - offer.discountValue;
        }
      }
    }

    if (offerPrice && offerPrice < originalPrice) {
      return `
        <div class="price-wrapper">
          <span class="offer-price fw-bold text-success">
            ₹${formatPrice(offerPrice)}
          </span>
          <span class="original-price text-muted text-decoration-line-through ms-2">
            ₹${formatPrice(originalPrice)}
          </span>
        </div>`;
    }

    return `<span class="price-tag">₹ ${formatPrice(originalPrice)}</span>`;
  };

  /* =============================
     CLEAR CONTAINER
  ============================== */
  container.innerHTML = "";

  /* =============================
     EMPTY STATE
  ============================== */
  if (!accessories.length) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 no-products">
        <img src="/images/empty-result.jpg" width="300" class="mb-4 opacity-75" />
        <h4>No Products Found</h4>
        <p class="text-muted">Try adjusting your filters.</p>
      </div>`;
    return;
  }

  /* =============================
     RENDER ACCESSORIES
  ============================== */
  accessories.forEach((item) => {
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4";

    card.innerHTML = `
      <div class="card car-card h-100 d-flex flex-column">
        <div class="car-image-wrapper position-relative">
          <img
            src="${item?.images?.[0] || "/images/default-car.jpg"}"
            alt="${item.name}"
            class="car-image"
          />
          ${getStockBadge(item.stock)}
          ${getAccessoryOfferBadge(item)}
        </div>

        <div class="card-body p-4 flex-grow-1">
          <h6 class="brand-name mb-2">${item?.brand_id?.name || ""}</h6>
          <h5 class="car-name">${item.name}</h5>

          <div class="d-flex justify-content-between align-items-center mt-3">
            ${getAccessoryPriceHTML(item)}
            <span class="year-badge">${item.production_year || ""}</span>
          </div>
        </div>

        <div class="card-footer bg-white text-center border-0 p-3">
          <a href="/all-accessories/view-accessory-product/${item._id}"
             class="btn view-details-btn w-100">
            View Details
          </a>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
};
