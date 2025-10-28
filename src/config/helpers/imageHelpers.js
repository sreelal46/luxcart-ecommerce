module.exports = {
  firstImage: (variantIds) => {
    if (variantIds && variantIds.length > 0) {
      const firstVariant = variantIds[0];
      if (firstVariant.image_url && firstVariant.image_url.length > 0) {
        return firstVariant.image_url[0];
      }
    }
    // Fallback image path
    return "/images/default-car.jpg";
  },
};
