const { OK, BAD_REQUEST } = require("../../constant/statusCode");
const CarVariant = require("../../models/admin/carVariantModel");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");

const addProductOffer = async (req, res, next) => {
  try {
    const { discountType, discountValue, validFrom, validTo, productType } =
      req.body;
    const { productId } = req.params;

    /* ========== VALIDATION ========== */

    if (!["Percentage", "Price"].includes(discountType)) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Invalid discount type" });
    }

    if (
      discountType === "Percentage" &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Percentage must be 1–100" });
    }

    if (discountType === "Price" && discountValue <= 0) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Price discount must be > 0" });
    }

    if (new Date(validFrom) >= new Date(validTo)) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Invalid date range" });
    }

    const now = new Date();
    const isActive = new Date(validFrom) <= now && new Date(validTo) > now;

    const offerPayload = {
      discountType,
      discountValue,
      validFrom,
      validTo,
      isActive: isActive,
      isConfigured: true,
    };

    /* ========== PRICE EXPRESSION ========== */

    const productPriceExpr = {
      $round: [
        discountType === "Percentage"
          ? {
              $subtract: [
                "$price",
                {
                  $multiply: ["$price", { $divide: [discountValue, 100] }],
                },
              ],
            }
          : { $subtract: ["$price", discountValue] },
        0,
      ],
    };

    /* ========== ACCESSORY ========== */

    if (productType === "accessory") {
      await Accessory.updateOne({ _id: productId }, [
        {
          $set: {
            productOffer: offerPayload,
            "offerPrices.productPrice": productPriceExpr,
          },
        },
        {
          $set: {
            "offerPrices.finalPrice": {
              $let: {
                vars: {
                  best: {
                    $cond: [
                      { $gt: ["$offerPrices.categoryPrice", 0] },
                      {
                        $min: [
                          "$offerPrices.productPrice",
                          "$offerPrices.categoryPrice",
                        ],
                      },
                      "$offerPrices.productPrice",
                    ],
                  },
                },
                in: {
                  $cond: [{ $lt: ["$$best", "$price"] }, "$$best", null],
                },
              },
            },
            appliedOffer: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$offerPrices.categoryPrice", 0] },
                    {
                      $lt: [
                        "$offerPrices.categoryPrice",
                        "$offerPrices.productPrice",
                      ],
                    },
                  ],
                },
                {
                  source: "CATEGORY",
                  discountType: "$categoryOffer.discountType",
                  discountValue: "$categoryOffer.discountValue",
                },
                {
                  source: "PRODUCT",
                  discountType,
                  discountValue,
                },
              ],
            },
          },
        },
      ]);
    }

    /* ========== CAR → VARIANTS ========== */

    if (productType === "car") {
      await CarVariant.updateMany({ product_id: productId }, [
        {
          $set: {
            productOffer: offerPayload,
            "offerPrices.productPrice": productPriceExpr,
          },
        },
        {
          $set: {
            "offerPrices.finalPrice": {
              $let: {
                vars: {
                  best: {
                    $cond: [
                      { $gt: ["$offerPrices.categoryPrice", 0] },
                      {
                        $min: [
                          "$offerPrices.productPrice",
                          "$offerPrices.categoryPrice",
                        ],
                      },
                      "$offerPrices.productPrice",
                    ],
                  },
                },
                in: {
                  $cond: [{ $lt: ["$$best", "$price"] }, "$$best", null],
                },
              },
            },
            appliedOffer: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$offerPrices.categoryPrice", 0] },
                    {
                      $lt: [
                        "$offerPrices.categoryPrice",
                        "$offerPrices.productPrice",
                      ],
                    },
                  ],
                },
                {
                  source: "CATEGORY",
                  discountType: "$categoryOffer.discountType",
                  discountValue: "$categoryOffer.discountValue",
                },
                {
                  source: "PRODUCT",
                  discountType,
                  discountValue,
                },
              ],
            },
          },
        },
      ]);
    }

    res.status(OK).json({ success: true, alert: "Product offer applied" });
  } catch (err) {
    next(err);
  }
};

const removeProductOffer = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { productType } = req.body;

    console.log("productId", productId);
    console.log("productType", productType);

    const pipeline = [
      {
        $unset: ["productOffer", "offerPrices.productPrice"],
      },
      {
        $set: {
          "offerPrices.finalPrice": {
            $cond: [
              {
                $and: [
                  { $gt: ["$offerPrices.categoryPrice", 0] },
                  { $lt: ["$offerPrices.categoryPrice", "$price"] },
                ],
              },
              "$offerPrices.categoryPrice",
              null,
            ],
          },
          appliedOffer: {
            $cond: [
              { $gt: ["$offerPrices.categoryPrice", 0] },
              {
                source: "CATEGORY",
                discountType: "$categoryOffer.discountType",
                discountValue: "$categoryOffer.discountValue",
              },
              null,
            ],
          },
        },
      },
    ];

    if (productType === "accessory") {
      await Accessory.updateOne({ _id: productId }, pipeline);
    }

    if (productType === "car") {
      await CarVariant.updateMany({ product_id: productId }, pipeline);
    }

    res.status(OK).json({ success: true, alert: "Product offer removed" });
  } catch (err) {
    next(err);
  }
};

module.exports = { addProductOffer, removeProductOffer };
