document.addEventListener("DOMContentLoaded", () => {
  // ---------- TOAST ----------
  function showMobileAlert(message, notification) {
    const alertBox = document.getElementById("mobileAlert");
    if (!alertBox) return;

    if (notification === "success") {
      alertBox.innerHTML = `<i class="bi bi-check-circle-fill success-icon"></i><span class="message-green">${message}</span>`;
    } else if (notification === "error") {
      alertBox.innerHTML = `<i class="bi bi-x-circle-fill error-icon"></i><span class="message-red">${message}</span>`;
    } else if (notification === "warning") {
      alertBox.innerHTML = `<i class="bi bi-exclamation-triangle-fill yellow-icon"></i><span class="message-yellow">${message}</span>`;
    } else {
      alertBox.innerHTML = `<span>${message}</span>`;
    }

    alertBox.classList.add("show");

    setTimeout(() => {
      alertBox.classList.remove("show");
    }, 2000);
  }

  // Make showMobileAlert globally accessible
  window.showMobileAlert = showMobileAlert;

  // ---------- REMOVE CART ITEM ----------
  function attachRemoveHandler(btn) {
    btn.addEventListener("click", async (e) => {
      // stop the <a> navigation
      e.preventDefault();
      e.stopPropagation();

      const itemId = btn.dataset.itemid;
      if (!itemId) return;

      try {
        const res = await axios.delete(`/cart/remove-product/${itemId}`);

        if (res.data.success) {
          showMobileAlert("Product removed from cart!", "success");
          setTimeout(() => location.reload(), 800);
        } else {
          showMobileAlert(res.data.alert || "Something went wrong", "error");
        }
      } catch (error) {
        showMobileAlert("INTERNAL SERVER ERROR", "error");
      }
    });
  }

  document.querySelectorAll(".remove-acc, .remove-car").forEach((btn) => {
    attachRemoveHandler(btn);
  });

  // ---------- QUANTITY + / - ----------
  // NOTE: you are using the same id="errorQuantity" in each item.
  // Ideally make it a class, but keeping your existing structure:
  const errorQuantity = document.getElementById("errorQuantity");

  document.addEventListener("click", (e) => {
    // delete button inside <a> (button or <i> icon)
    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn) {
      // Don't let the anchor navigate
      e.preventDefault();
      e.stopPropagation();
      // The real delete logic is in attachRemoveHandler
      return;
    }

    // PLUS button
    const plusBtn = e.target.closest(".plus");
    if (plusBtn) {
      e.preventDefault();
      e.stopPropagation();

      const itemId = plusBtn.dataset.itemid;
      const qtyEl = document.querySelector(
        `.qty-value[data-itemid="${itemId}"]`,
      );
      if (!qtyEl) return;

      let qty = parseInt(qtyEl.dataset.qty, 10) || 0;
      qty++;

      if (qty > 5) {
        if (errorQuantity) {
          errorQuantity.textContent = "Maximum reached";
          errorQuantity.style.display = "block";
        }
        return;
      }

      if (errorQuantity) {
        errorQuantity.textContent = "";
        errorQuantity.style.display = "none";
      }

      qtyEl.dataset.qty = qty;
      qtyEl.textContent = qty;

      setTimeout(async () => {
        try {
          const res = await axios.put(`/cart/change-quantity/${itemId}`, {
            quantityIncrease: qty,
            quantityDecrease: null,
          });
          if (res.data.success) {
            showMobileAlert("Quantity updated!", "success");
            setTimeout(() => window.location.reload(), 2000);
          } else {
            const msg = res.data.alert || "Something went wrong!";
            showMobileAlert(msg, "error");
            setTimeout(() => window.location.reload(), 2000);
          }
        } catch (error) {
          console.log("Error from change Quantity", error);
          const msg = error.response?.data.alert || "INTERNAL SERVER ISSUE";
          showMobileAlert(msg, "error");
          setTimeout(() => window.location.reload(), 2000);
        }
      }, 2000);

      return;
    }

    // MINUS button
    const minusBtn = e.target.closest(".minus");
    if (minusBtn) {
      e.preventDefault();
      e.stopPropagation();

      const itemId = minusBtn.dataset.itemid;
      const qtyEl = document.querySelector(
        `.qty-value[data-itemid="${itemId}"]`,
      );
      if (!qtyEl) return;

      let qty = parseInt(qtyEl.dataset.qty, 10) || 0;

      if (qty > 1) {
        if (errorQuantity) {
          errorQuantity.textContent = "";
          errorQuantity.style.display = "none";
        }
        qty--;
      }

      qtyEl.dataset.qty = qty;
      qtyEl.textContent = qty;

      setTimeout(async () => {
        try {
          const res = await axios.put(`/cart/change-quantity/${itemId}`, {
            quantityDecrease: qty,
            quantityIncrease: null,
          });
          if (res.data.success) {
            showMobileAlert("Quantity updated!", "success");
            setTimeout(() => window.location.reload(), 2000);
          } else {
            const msg = res.data.alert || "Something went wrong!";
            showMobileAlert(msg, "error");
            setTimeout(() => window.location.reload(), 2000);
          }
        } catch (error) {
          console.log("Error from change Quantity", error);
          const msg = error.response?.data.alert || "INTERNAL SERVER ISSUE";
          showMobileAlert(msg, "error");
          setTimeout(() => window.location.reload(), 2000);
        }
      }, 2000);

      return;
    }
  });
});

// ========================================
// COUPON MODAL FUNCTIONALITY
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("couponModal");
  const openBtn = document.getElementById("applyCouponBtn");
  const closeBtn = document.getElementById("closeModal");

  // OPEN MODAL
  openBtn?.addEventListener("click", () => {
    modal.classList.add("show");
    document.body.style.overflow = "hidden"; // prevent background scroll
  });

  // CLOSE MODAL (X BUTTON)
  closeBtn?.addEventListener("click", closeModal);

  // CLOSE MODAL (Click outside)
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // EVENT DELEGATION FOR APPLY BUTTONS (CRITICAL FIX)
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("apply-btn")) {
      e.preventDefault();
      const couponCode = e.target.dataset.coupon;
      const couponId = e.target.dataset.id;

      if (!couponId) {
        showAlert("Invalid coupon", "error");
        return;
      }

      applyCoupon(couponCode, couponId);
    }
  });

  function closeModal() {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }
});

// ========================================
// APPLY COUPON (AXIOS)
// ========================================

async function applyCoupon(couponCode, couponId) {
  try {
    const res = await axios.patch(`/cart/add-coupon/${couponId}`);

    if (res.data.success) {
      showAlert(`Coupon ${couponCode} applied successfully!`, "success");
      document.getElementById("couponModal").classList.remove("show");
      setTimeout(() => location.reload(), 600);
    } else {
      showAlert(res.data.message || "Failed to apply coupon", "error");
    }
  } catch (error) {
    console.error("Coupon error:", error);
    showAlert(error.response?.data?.alert || "Something went wrong", "error");
  }
}

// ========================================
// REMOVE COUPON (AXIOS)
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  const removeCouponBtn = document.getElementById("removeCouponBtn");

  if (removeCouponBtn) {
    removeCouponBtn.addEventListener("click", async () => {
      try {
        const res = await axios.patch(`/cart/remove-coupon`);

        if (res.data.success) {
          showAlert(`Coupon Removed successfully!`, "success");
          document.getElementById("couponModal").classList.remove("show");
          setTimeout(() => location.reload(), 600);
        } else {
          showAlert(res.data.message || "Failed to Removed coupon", "error");
          document.getElementById("couponModal").classList.remove("show");
        }
      } catch (error) {
        console.error("Coupon error:", error);
        showAlert(
          error.response?.data?.alert || "Something went wrong",
          "error",
        );
        document.getElementById("couponModal").classList.remove("show");
      }
    });
  }
});

// ========================================
// TOAST NOTIFICATION FUNCTION
// ========================================

function showAlert(message, type = "success") {
  const alertBox = document.getElementById("mobileAlert");

  // Set icon based on type
  let icon = "";
  let colorClass = "";

  if (type === "success") {
    icon = '<i class="bi bi-check-circle-fill success-icon"></i>';
    colorClass = "message-green";
  } else if (type === "error") {
    icon = '<i class="bi bi-x-circle-fill error-icon"></i>';
    colorClass = "message-red";
  } else if (type === "warning") {
    icon = '<i class="bi bi-exclamation-triangle-fill yellow-icon"></i>';
    colorClass = "message-yellow";
  }

  alertBox.innerHTML = `${icon}<span class="${colorClass}">${message}</span>`;
  alertBox.classList.add("show");

  // Hide after 3 seconds
  setTimeout(() => {
    alertBox.classList.remove("show");
  }, 3000);
}

// ========================================
// MOBILE PLACE ORDER BUTTON
// ========================================

// MOBILE PLACE ORDER BUTTON
document.addEventListener("DOMContentLoaded", () => {
  const placeOrderBtn = document.querySelector(".place-order-btn");

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Get cart ID from the mobile bottom bar or any element with cart data
      const cartId =
        document.getElementById("proceedCheckoutBtn")?.dataset.cartid;

      if (!cartId) {
        showAlert("Unable to proceed. Cart ID not found.", "error");
        return;
      }

      try {
        const res = await axios.get(
          `/cart/checkout-step-1/availability/${cartId}`,
        );

        if (res.data.success) {
          window.location.href = `/cart/checkout-step-1/${cartId}`;
        } else {
          showErrorModal(
            "Checkout Blocked",
            res.data.message || "Unable to proceed to checkout.",
          );
        }
      } catch (error) {
        showErrorModal(
          "Something went wrong",
          error.response?.data?.message || "Please try again later.",
        );
      }
    });
  }
});
document
  .getElementById("proceedCheckoutBtn")
  .addEventListener("click", async () => {
    const cartId = document.getElementById("proceedCheckoutBtn").dataset.cartid;

    try {
      const res = await axios.get(
        `/cart/checkout-step-1/availability/${cartId}`,
      );

      // If backend allows checkout
      if (res.data.success) {
        window.location.href = `/cart/checkout-step-1/${cartId}`;
      } else {
        showErrorModal(
          "Checkout Blocked",
          res.data.message || "Unable to proceed to checkout.",
        );
      }
    } catch (error) {
      showErrorModal(
        "Something went wrong",
        error.response?.data?.message || "Please try again later.",
      );
    }
  });

function closeErrorModal() {
  document.getElementById("errorModal").classList.remove("show");
}

function showErrorModal(title, message) {
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("errorModal").classList.add("show");
}
