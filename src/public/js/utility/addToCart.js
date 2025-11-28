//add to cart axios call function
window.addToCartAxios = function (element, productType, productId, variantId) {
  element.addEventListener("click", async () => {
    try {
      const res = await axios.post("/cart/add", {
        productType,
        productId,
        variantId: changingVariantId || variantId,
      });

      if (res.data.success) {
        showMobileAlert("Product added to cart!", "success");
        // Change text
        element.textContent = "Go to Cart";
        // Change link URL
        element.href = "/cart";
      } else {
        const msg = res.data.alert || "Somthing went worng";
        showMobileAlert(msg, "error");
      }
    } catch (error) {
      console.log("Error from add to cart FRONTEND", error);
      const msg = error.response?.data.alert || "INTERNAL SERVER ERROR";
      showMobileAlert(msg, "error");
    }
  });
};
