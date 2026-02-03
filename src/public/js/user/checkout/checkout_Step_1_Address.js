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
  continueBtn.addEventListener("click", () => {
    const checked = document.querySelector(
      "input[name='selectedAddress']:checked",
    );
    if (!checked) {
      openModal();
      return;
    }
    window.location.href = `/cart/checkout-step-2/${checked.value}`;
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
