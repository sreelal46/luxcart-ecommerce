const cron = require("node-cron");
const Category = require("../models/admin/categoryModel");
const Accessory = require("../models/admin/productAccessoryModal");
const CarVariant = require("../models/admin/carVariantModel");
const Car = require("../models/admin/productCarModal");

/**
 * Cron job to manage all offer operations
 * Runs every hour at minute 0
 */
const offerStatusCron = cron.schedule("0 0 * * *", async () => {
  try {
    console.log("[OFFER CRON] Starting offer management...");
    const now = new Date();

    // Step 1: Update offer statuses
    await updateOfferStatuses(now);

    // Step 2: Recalculate all prices
    await recalculateAllPrices(now);

    console.log("[OFFER CRON] Offer management completed successfully");
  } catch (err) {
    console.error("[OFFER CRON] Error:", err);
  }
});

/**
 * Update isActive status for all offers based on current time
 */
const updateOfferStatuses = async (now) => {
  console.log("[OFFER CRON] Updating offer statuses...");

  // Activate category offers that should be active
  const activatedCategories = await Category.updateMany(
    {
      "offer.isConfigured": true,
      "offer.isActive": false,
      "offer.validFrom": { $lte: now },
      "offer.validTo": { $gt: now },
    },
    { $set: { "offer.isActive": true } }
  );

  // Deactivate expired category offers
  const expiredCategories = await Category.updateMany(
    {
      "offer.isActive": true,
      "offer.validTo": { $lte: now },
    },
    { $set: { "offer.isActive": false, "offer.isConfigured": false } }
  );

  // Activate accessory product offers
  const activatedAccessories = await Accessory.updateMany(
    {
      "productOffer.isConfigured": true,
      "productOffer.isActive": false,
      "productOffer.validFrom": { $lte: now },
      "productOffer.validTo": { $gt: now },
    },
    { $set: { "productOffer.isActive": true } }
  );

  // Deactivate expired accessory product offers
  const expiredAccessories = await Accessory.updateMany(
    {
      "productOffer.isActive": true,
      "productOffer.validTo": { $lte: now },
    },
    {
      $set: {
        "productOffer.isActive": false,
        "productOffer.isConfigured": false,
      },
    }
  );

  // Activate car variant product offers
  const activatedVariants = await CarVariant.updateMany(
    {
      "productOffer.isConfigured": true,
      "productOffer.isActive": false,
      "productOffer.validFrom": { $lte: now },
      "productOffer.validTo": { $gt: now },
    },
    { $set: { "productOffer.isActive": true } }
  );

  // Deactivate expired car variant product offers
  const expiredVariants = await CarVariant.updateMany(
    {
      "productOffer.isActive": true,
      "productOffer.validTo": { $lte: now },
    },
    {
      $set: {
        "productOffer.isActive": false,
        "productOffer.isConfigured": false,
      },
    }
  );

  console.log(
    `   ├─ Categories: ${activatedCategories.modifiedCount} activated, ${expiredCategories.modifiedCount} expired`
  );
  console.log(
    `   ├─ Accessories: ${activatedAccessories.modifiedCount} activated, ${expiredAccessories.modifiedCount} expired`
  );
  console.log(
    `   └─ Car Variants: ${activatedVariants.modifiedCount} activated, ${expiredVariants.modifiedCount} expired`
  );
};

/**
 * Recalculate all prices for products with offers
 */
const recalculateAllPrices = async (now) => {
  console.log("[OFFER CRON] Recalculating prices...");

  // Step 1: Update categoryOffer field for all products from their categories
  await syncCategoryOffers();

  // Step 2: Calculate accessory prices
  const accessoryResult = await recalculateAccessoryPrices();

  // Step 3: Calculate car variant prices
  const variantResult = await recalculateCarVariantPrices();

  console.log(
    `   ├─ Accessories updated: ${accessoryResult.modifiedCount || 0}`
  );
  console.log(
    `   └─ Car Variants updated: ${variantResult.modifiedCount || 0}`
  );
};

/**
 * Sync category offers to all products in those categories
 */
const syncCategoryOffers = async () => {
  // Get all categories with active offers
  const categoriesWithOffers = await Category.find({
    "offer.isConfigured": true,
  });

  for (const category of categoriesWithOffers) {
    if (category.product === "Accessories") {
      await Accessory.updateMany(
        { category_id: category._id },
        { $set: { categoryOffer: category.offer } }
      );
    }

    if (category.product === "Car") {
      const cars = await Car.find({ category_id: category._id }, { _id: 1 });
      const carIds = cars.map((c) => c._id);
      await CarVariant.updateMany(
        { product_id: { $in: carIds } },
        { $set: { categoryOffer: category.offer } }
      );
    }
  }

  // Remove categoryOffer from products whose categories no longer have offers
  const categoryIdsWithOffers = categoriesWithOffers.map((c) => c._id);

  await Accessory.updateMany(
    {
      categoryOffer: { $exists: true },
      category_id: { $nin: categoryIdsWithOffers },
    },
    { $unset: { categoryOffer: "" } }
  );

  const carsWithoutOffers = await Car.find(
    { category_id: { $nin: categoryIdsWithOffers } },
    { _id: 1 }
  );
  const carIdsWithoutOffers = carsWithoutOffers.map((c) => c._id);

  await CarVariant.updateMany(
    {
      categoryOffer: { $exists: true },
      product_id: { $in: carIdsWithoutOffers },
    },
    { $unset: { categoryOffer: "" } }
  );
};

/**
 * Recalculate prices for all accessories
 */
const recalculateAccessoryPrices = async () => {
  return await Accessory.updateMany({}, [
    {
      $set: {
        "offerPrices.productPrice": {
          $cond: [
            {
              $and: [
                { $eq: ["$productOffer.isActive", true] },
                { $eq: ["$productOffer.isConfigured", true] },
              ],
            },
            {
              $round: [
                {
                  $cond: [
                    { $eq: ["$productOffer.discountType", "Percentage"] },
                    {
                      $subtract: [
                        "$price",
                        {
                          $multiply: [
                            "$price",
                            { $divide: ["$productOffer.discountValue", 100] },
                          ],
                        },
                      ],
                    },
                    { $subtract: ["$price", "$productOffer.discountValue"] },
                  ],
                },
                0,
              ],
            },
            0,
          ],
        },
        "offerPrices.categoryPrice": {
          $cond: [
            {
              $and: [
                { $eq: ["$categoryOffer.isActive", true] },
                { $eq: ["$categoryOffer.isConfigured", true] },
              ],
            },
            {
              $round: [
                {
                  $cond: [
                    { $eq: ["$categoryOffer.discountType", "Percentage"] },
                    {
                      $subtract: [
                        "$price",
                        {
                          $multiply: [
                            "$price",
                            { $divide: ["$categoryOffer.discountValue", 100] },
                          ],
                        },
                      ],
                    },
                    { $subtract: ["$price", "$categoryOffer.discountValue"] },
                  ],
                },
                0,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $set: {
        "offerPrices.finalPrice": {
          $let: {
            vars: {
              productPrice: "$offerPrices.productPrice",
              categoryPrice: "$offerPrices.categoryPrice",
              originalPrice: "$price",
            },
            in: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$$productPrice", 0] },
                    { $gt: ["$$categoryPrice", 0] },
                  ],
                },
                {
                  $let: {
                    vars: {
                      best: { $min: ["$$productPrice", "$$categoryPrice"] },
                    },
                    in: {
                      $cond: [
                        { $lt: ["$$best", "$$originalPrice"] },
                        "$$best",
                        null,
                      ],
                    },
                  },
                },
                {
                  $cond: [
                    { $gt: ["$$productPrice", 0] },
                    {
                      $cond: [
                        { $lt: ["$$productPrice", "$$originalPrice"] },
                        "$$productPrice",
                        null,
                      ],
                    },
                    {
                      $cond: [
                        {
                          $and: [
                            { $gt: ["$$categoryPrice", 0] },
                            { $lt: ["$$categoryPrice", "$$originalPrice"] },
                          ],
                        },
                        "$$categoryPrice",
                        null,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        appliedOffer: {
          $let: {
            vars: {
              productPrice: "$offerPrices.productPrice",
              categoryPrice: "$offerPrices.categoryPrice",
            },
            in: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$$productPrice", 0] },
                    { $gt: ["$$categoryPrice", 0] },
                    { $lt: ["$$productPrice", "$$categoryPrice"] },
                  ],
                },
                {
                  source: "PRODUCT",
                  discountType: "$productOffer.discountType",
                  discountValue: "$productOffer.discountValue",
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $gt: ["$$categoryPrice", 0] },
                        { $lt: ["$$categoryPrice", "$price"] },
                      ],
                    },
                    {
                      source: "CATEGORY",
                      discountType: "$categoryOffer.discountType",
                      discountValue: "$categoryOffer.discountValue",
                    },
                    {
                      $cond: [
                        {
                          $and: [
                            { $gt: ["$$productPrice", 0] },
                            { $lt: ["$$productPrice", "$price"] },
                          ],
                        },
                        {
                          source: "PRODUCT",
                          discountType: "$productOffer.discountType",
                          discountValue: "$productOffer.discountValue",
                        },
                        null,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  ]);
};

/**
 * Recalculate prices for all car variants
 */
const recalculateCarVariantPrices = async () => {
  return await CarVariant.updateMany({}, [
    {
      $set: {
        "offerPrices.productPrice": {
          $cond: [
            {
              $and: [
                { $eq: ["$productOffer.isActive", true] },
                { $eq: ["$productOffer.isConfigured", true] },
              ],
            },
            {
              $round: [
                {
                  $cond: [
                    { $eq: ["$productOffer.discountType", "Percentage"] },
                    {
                      $subtract: [
                        "$price",
                        {
                          $multiply: [
                            "$price",
                            { $divide: ["$productOffer.discountValue", 100] },
                          ],
                        },
                      ],
                    },
                    { $subtract: ["$price", "$productOffer.discountValue"] },
                  ],
                },
                0,
              ],
            },
            0,
          ],
        },
        "offerPrices.categoryPrice": {
          $cond: [
            {
              $and: [
                { $eq: ["$categoryOffer.isActive", true] },
                { $eq: ["$categoryOffer.isConfigured", true] },
              ],
            },
            {
              $round: [
                {
                  $cond: [
                    { $eq: ["$categoryOffer.discountType", "Percentage"] },
                    {
                      $subtract: [
                        "$price",
                        {
                          $multiply: [
                            "$price",
                            { $divide: ["$categoryOffer.discountValue", 100] },
                          ],
                        },
                      ],
                    },
                    { $subtract: ["$price", "$categoryOffer.discountValue"] },
                  ],
                },
                0,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $set: {
        "offerPrices.finalPrice": {
          $let: {
            vars: {
              productPrice: "$offerPrices.productPrice",
              categoryPrice: "$offerPrices.categoryPrice",
              originalPrice: "$price",
            },
            in: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$$productPrice", 0] },
                    { $gt: ["$$categoryPrice", 0] },
                  ],
                },
                {
                  $let: {
                    vars: {
                      best: { $min: ["$$productPrice", "$$categoryPrice"] },
                    },
                    in: {
                      $cond: [
                        { $lt: ["$$best", "$$originalPrice"] },
                        "$$best",
                        null,
                      ],
                    },
                  },
                },
                {
                  $cond: [
                    { $gt: ["$$productPrice", 0] },
                    {
                      $cond: [
                        { $lt: ["$$productPrice", "$$originalPrice"] },
                        "$$productPrice",
                        null,
                      ],
                    },
                    {
                      $cond: [
                        {
                          $and: [
                            { $gt: ["$$categoryPrice", 0] },
                            { $lt: ["$$categoryPrice", "$$originalPrice"] },
                          ],
                        },
                        "$$categoryPrice",
                        null,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        appliedOffer: {
          $let: {
            vars: {
              productPrice: "$offerPrices.productPrice",
              categoryPrice: "$offerPrices.categoryPrice",
            },
            in: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$$productPrice", 0] },
                    { $gt: ["$$categoryPrice", 0] },
                    { $lt: ["$$productPrice", "$$categoryPrice"] },
                  ],
                },
                {
                  source: "PRODUCT",
                  discountType: "$productOffer.discountType",
                  discountValue: "$productOffer.discountValue",
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $gt: ["$$categoryPrice", 0] },
                        { $lt: ["$$categoryPrice", "$price"] },
                      ],
                    },
                    {
                      source: "CATEGORY",
                      discountType: "$categoryOffer.discountType",
                      discountValue: "$categoryOffer.discountValue",
                    },
                    {
                      $cond: [
                        {
                          $and: [
                            { $gt: ["$$productPrice", 0] },
                            { $lt: ["$$productPrice", "$price"] },
                          ],
                        },
                        {
                          source: "PRODUCT",
                          discountType: "$productOffer.discountType",
                          discountValue: "$productOffer.discountValue",
                        },
                        null,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  ]);
};

// Start the cron job
const startOfferCron = () => {
  offerStatusCron.start();
  console.log("[OFFER CRON] Started - Running every hour");

  // Run immediately on startup
  console.log(" [OFFER CRON] Running initial calculation...");
  setTimeout(async () => {
    try {
      const now = new Date();
      await updateOfferStatuses(now);
      await recalculateAllPrices(now);
      console.log(" [OFFER CRON] Initial calculation completed");
    } catch (err) {
      console.error("[OFFER CRON] Initial calculation failed:", err);
    }
  }, 2000);
};

// Stop the cron job
const stopOfferCron = () => {
  offerStatusCron.stop();
  console.log("🛑 [OFFER CRON] Stopped");
};

// In offerCron.js
module.exports = {
  startOfferCron,
  stopOfferCron,
  recalculateAllPrices,
  recalculateAccessoryPrices,
  recalculateCarVariantPrices,
  updateOfferStatuses,
};
