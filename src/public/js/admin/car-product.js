document.getElementById("addVariantBtn").addEventListener("click", function () {
  const container = document.getElementById("variantSectionContainer");
  const variants = container.querySelectorAll(".variant-section");
  const newIndex = variants.length + 1;

  const clone = variants[0].cloneNode(true);
  clone.querySelector(".card-header span").textContent = `Variant #${newIndex}`;
  clone.querySelectorAll("input").forEach((input) => (input.value = ""));
  clone.querySelector(".remove-variant").classList.remove("d-none");
  container.appendChild(clone);

  // Add remove handler
  clone
    .querySelector(".remove-variant")
    .addEventListener("click", () => clone.remove());
});
