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
        `.qty-value[data-itemid="${itemId}"]`
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
        `.qty-value[data-itemid="${itemId}"]`
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

// Open Coupon Modal
document
  .getElementById("applyCouponBtn")
  ?.addEventListener("click", function () {
    document.getElementById("couponModal").classList.add("show");
  });

// Close Modal - X Button
document.getElementById("closeModal")?.addEventListener("click", function () {
  closeModal();
});

// Close modal when clicking outside
document.getElementById("couponModal")?.addEventListener("click", function (e) {
  if (e.target === this) {
    closeModal();
  }
});

// Close Modal Function
function closeModal() {
  document.getElementById("couponModal").classList.remove("show");
}

// Apply Coupon Buttons
document.querySelectorAll(".apply-btn").forEach((button) => {
  button.addEventListener("click", function (e) {
    e.preventDefault();
    const couponCode = this.getAttribute("data-coupon");
    applyCoupon(couponCode);
  });
});

// Apply Coupon Function
function applyCoupon(couponCode) {
  // Add your AJAX call here to apply the coupon
  console.log("Applying coupon:", couponCode);

  // Example: Send coupon to backend
  /*
  fetch('/api/apply-coupon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ couponCode: couponCode })
  })
  .then(response => response.json())
  .then(data => {
    if(data.success) {
      showAlert('Coupon applied successfully!', 'success');
      // Reload or update cart
      location.reload();
    } else {
      showAlert(data.message || 'Failed to apply coupon', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showAlert('Something went wrong!', 'error');
  });
  */

  // For now, just show alert and close modal
  showAlert(`Coupon ${couponCode} applied successfully!`, "success");
  closeModal();
}
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

document
  .querySelector(".place-order-btn")
  ?.addEventListener("click", function () {
    const cartId = "{{cart._id}}"; // This will be replaced by Handlebars
    window.location.href = `/cart/checkout-step-1/${cartId}`;
  });
