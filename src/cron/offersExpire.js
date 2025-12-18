const cron = require("node-cron");
const Category = require("../models/admin/categoryModel");
const CarVariant = require("../models/admin/carVariantModel");
const Accessory = require("../models/admin/productAccessoryModal");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    await Category.updateMany(
      {
        "offer.isActive": true,
        "offer.validTo": { $lte: now },
      },
      { $set: { "offer.isActive": false } }
    );

    await CarVariant.updateMany(
      {
        "offer.isActive": true,
        "offer.validTo": { $lte: now },
      },
      { $set: { "offer.isActive": false, discountedPrice: null } }
    );

    await Accessory.updateMany(
      {
        "offer.isActive": true,
        "offer.validTo": { $lte: now },
      },
      { $set: { "offer.isActive": false, discountedPrice: null } }
    );
    console.log("======================================");
    console.log("FROM CRON JOB : Offer expiry checked");
    console.log("======================================");
  } catch (err) {
    console.error("[DEV CRON] Offer expiry failed:", err);
  }
});
