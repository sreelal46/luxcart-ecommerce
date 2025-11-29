document.addEventListener("DOMContentLoaded", () => {
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
    }, 2000);
  }

  function removeCart(element) {
    element.addEventListener("click", async () => {
      const itemId = element.dataset.itemid;

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
    removeCart(btn);
  });
});
const errorQuantity = document.getElementById("errorQuantity");
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (e.target.classList.contains("plus")) {
    e.preventDefault();
    e.stopPropagation();

    const itemId = e.target.dataset.itemid;
    const qtyEl = document.querySelector(`.qty-value[data-itemid="${itemId}"]`);
    let qty = parseInt(qtyEl.dataset.qty);

    qty++;
    if (qty > 5) {
      errorQuantity.textContent = "Maximum reached";
      errorQuantity.style.display = "block";
      return;
    }
    if (qty < 5) {
      errorQuantity.textContent = "";
      errorQuantity.style.display = "none";
    }
    qtyEl.dataset.qty = qty;
    qtyEl.textContent = qty;
  }

  if (e.target.classList.contains("minus")) {
    e.preventDefault();
    e.stopPropagation();

    const itemId = e.target.dataset.itemid;
    const qtyEl = document.querySelector(`.qty-value[data-itemid="${itemId}"]`);
    let qty = parseInt(qtyEl.dataset.qty);

    if (qty > 1) {
      errorQuantity.textContent = "";
      errorQuantity.style.display = "none";
      qty--;
    }
    qtyEl.dataset.qty = qty;
    qtyEl.textContent = qty;
  }
});
