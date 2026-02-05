(function () {
  const continueBtn = document.getElementById("continueBtn");
  const overlay = document.getElementById("coOverlay");
  const closeX = document.getElementById("coModalClose");
  const closeBtn = document.getElementById("coCloseModal");
  const addAddrBtn = document.getElementById("coAddAddress");
  const radios = document.querySelectorAll('input[name="selectedAddress"]');
  const addressCards = document.querySelectorAll(".address-card");

  /* --- card click → check radio + highlight --- */
  addressCards.forEach((card) => {
    card.addEventListener("click", () => {
      radios.forEach((r) => (r.checked = false));
      addressCards.forEach((c) => c.classList.remove("selected"));

      const radio = card.querySelector('input[type="radio"]');
      radio.checked = true;
      card.classList.add("selected");
    });
  });

  /* --- modal helpers --- */
  function openModal() {
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  /* --- Continue click --- */
  function showErrorModal(title, message) {
    document.getElementById("errorTitle").textContent = title;
    document.getElementById("errorMessage").textContent = message;
    document.getElementById("errorModal").classList.add("show");
  }
  continueBtn.addEventListener("click", async () => {
    const checked = document.querySelector(
      "input[name='selectedAddress']:checked",
    );

    //Address not selected
    if (!checked) {
      openModal();
      return;
    }

    const cartId = continueBtn.dataset.cartid;
    const addressId = checked.value;

    try {
      //Availability check
      const res = await axios.get(
        `/cart/checkout-step-2/availability/${cartId}`,
      );

      if (res.data.success) {
        //Redirect only if available
        window.location.href = `/cart/checkout-step-2/${addressId}`;
      } else {
        showErrorModal(
          "Something went wrong",
          res.data.message ||
            "Some items are unavailable. Please update your cart.",
        );
      }
    } catch (error) {
      showErrorModal(
        "Something went wrong",
        error.response?.data?.message || "Please try again later.",
      );
    }
  });

  /* --- close triggers --- */
  closeX.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(); // click outside modal box
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  /* --- Add Address button in modal --- */
  addAddrBtn.addEventListener("click", () => {
    closeModal();
    window.location.href =
      "/account/addresses/add-address?from=checkout&cartId={{cartId}}";
  });
})();
function closeErrorModal() {
  document.getElementById("errorModal").classList.remove("show");
}
