document.addEventListener("DOMContentLoaded", () => {
  // ── Toast notification ──────────────────────────────
  function showMobileAlert(message, type) {
    const alertBox = document.getElementById("mobileAlert");

    const icons = {
      success: "bi-check-circle-fill success-icon",
      error: "bi-x-circle-fill error-icon",
      warning: "bi-exclamation-triangle-fill yellow-icon",
    };

    const colors = {
      success: "message-green",
      error: "message-red",
      warning: "message-yellow",
    };

    alertBox.innerHTML = `
      <i class="bi ${icons[type]}"></i>
      <span class="${colors[type]}">${message}</span>
    `;
    alertBox.classList.add("show");

    setTimeout(() => alertBox.classList.remove("show"), 3000);
  }

  // ── Delegated click on the grid ─────────────────────
  //     Every .btn-remove-wishlist inside .wishlist-grid
  //     is handled by ONE listener — no matter how many cards exist.
  const grid = document.querySelector(".wishlist-grid");
  if (!grid) return; // nothing to do if the grid isn't on this page

  grid.addEventListener("click", async (e) => {
    // Walk up from the click target to find the remove button
    const btn = e.target.closest(".btn-remove-wishlist");
    if (!btn) return; // click was on something else inside the grid

    const itemId = btn.dataset.itemid;
    if (!itemId) return;

    // Prevent double-clicks while the request is in flight
    btn.disabled = true;
    btn.style.opacity = "0.5";

    try {
      const res = await axios.delete(`/account/wishlist/delete/${itemId}`);

      if (res.data.success) {
        showMobileAlert("Product removed from Wishlist!", "success");
        // Remove the card from the DOM instantly, then reload after toast
        const card = btn.closest(".wishlist-card");
        if (card) card.remove();
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const msg = res.data.alert || "Something went wrong";
        showMobileAlert(msg, "error");
        btn.disabled = false;
        btn.style.opacity = "";
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      const msg = err.response?.data?.alert || "Internal server error";
      showMobileAlert(msg, "error");
      btn.disabled = false;
      btn.style.opacity = "";
    }
  });
});
