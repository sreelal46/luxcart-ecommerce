const cron = require("node-cron");
const Category = require("../models/admin/categoryModel");
const Car = require("../models/admin/productCarModal");
const CarVariant = require("../models/admin/carVariantModel");
const Accessory = require("../models/admin/productAccessoryModal");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    const expiredCategories = await Category.find({
      "offer.isActive": true,
      "offer.validTo": { $lte: now },
    });

    if (!expiredCategories.length) return;

    await Category.updateMany(
      { _id: { $in: expiredCategories.map((c) => c._id) } },
      { $set: { "offer.isActive": false } }
    );

    for (const category of expiredCategories) {
      const pipeline = [
        { $unset: ["categoryOffer", "offerPrices.categoryPrice"] },
        {
          $set: {
            "offerPrices.finalPrice": {
              $cond: [
                {
                  $and: [
                    { $gt: ["$offerPrices.productPrice", 0] },
                    { $lt: ["$offerPrices.productPrice", "$price"] },
                  ],
                },
                "$offerPrices.productPrice",
                null,
              ],
            },
          },
        },
      ];

      if (category.product === "Accessories") {
        await Accessory.updateMany({ category_id: category._id }, pipeline);
      }

      if (category.product === "Car") {
        const cars = await Car.find({ category_id: category._id }, { _id: 1 });
        const carIds = cars.map((c) => c._id);
        await CarVariant.updateMany({ product_id: { $in: carIds } }, pipeline);
      }
    }
    console.log("================================================");
    console.log("[CRON] Expired category offers handled correctly");
    console.log("================================================");
  } catch (err) {
    console.error("[CRON ERROR]", err);
  }
});
