//add to cart axios call function
window.addToCartAxios = function (element, productType, productId, variantId) {
  element.addEventListener("click", async () => {
    const res = await axios.post("/cart/add", {
      productType,
      productId,
      variantId: changingVariantId || variantId,
    });

    if (res.data.success) {
    }
  });
};
