const { OK, CONFLICT } = require("../../constant/statusCode");
const { saveCarWithVariants } = require("../helper/saveCarWithVariants");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");

const addCarProduct = async (req, res, next) => {
  try {
    //collecting data
    const carData = req.body;
    const name = carData.name?.trim();
    //finding duplicate
    const duplicate = await Car.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (duplicate)
      return res
        .status(CONFLICT)
        .json({ success: false, message: "Car name already exists." });

    // Group files by variant index
    const variantFiles = [];
    const filesByVariant = {};

    req.files.forEach((file) => {
      const match = file.fieldname.match(/variant_images(?:_(\d+))?\[\]/);
      const index = match && match[1] ? parseInt(match[1]) : 0;
      if (!filesByVariant[index]) filesByVariant[index] = [];
      filesByVariant[index].push(file);
    });

    for (let i = 0; i < Object.keys(filesByVariant).length; i++) {
      variantFiles.push(filesByVariant[i]);
    }

    const result = await saveCarWithVariants(carData, variantFiles);
    res
      .status(OK)
      .json({ success: true, redirect: "/admin/products-management" });
  } catch (err) {
    next(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const editCarProduct = async (req, res) => {
  try {
    const { id } = req.params;

    //finding car
    const existingCar = await Car.findById(id).populate("variantIds");
    if (!existingCar)
      return res
        .status(NOT_FOUND)
        .json({ success: false, message: "Car not found" });

    //finding duplicate
    // const name = existingCar.name;
    // const duplicate = await Car.findOne({
    //   name: { $regex: new RegExp(`^${name}$`, "i") },
    // });

    // if (duplicate)
    //   return res
    //     .status(CONFLICT)
    //     .json({ success: false, message: "Brand name already exists." });

    // Update basic car info
    existingCar.brand_id = req.body.brand;
    existingCar.category_id = req.body.category;
    existingCar.product_type_id = req.body.product_type;
    existingCar.description = req.body.description;
    existingCar.offer_price = req.body.offer_price || null;
    existingCar.year = req.body.year;
    existingCar.mileage = req.body.mileage;
    existingCar.warranty = req.body.warranty;
    existingCar.region = req.body.region;
    existingCar.top_speed = req.body.top_speed;
    existingCar.power_hp = req.body.power_hp;
    existingCar.engine = req.body.engine;
    existingCar.transmission = req.body.transmission;
    existingCar.drive_type = req.body.drive_type;
    existingCar.torque = req.body.torque;
    existingCar.acceleration_0_100 = req.body.acceleration_0_100;
    existingCar.interiorAndExteriorColor = req.body.interiorAndExteriorColor;
    existingCar.wheels = req.body.wheels;
    existingCar.upholstery = req.body.upholstery;
    existingCar.design = req.body.design;
    existingCar.cameras = req.body.cameras;
    existingCar.lane_assist =
      req.body.lane_assist === "true" || req.body.lane_assist === true;
    existingCar.sound_system = req.body.sound_system;
    existingCar.keyless_go =
      req.body.keyless_go === "true" || req.body.keyless_go === true;

    await existingCar.save();

    // Parse removed images sent from frontend
    const removedImages = req.body.removed_images
      ? JSON.parse(req.body.removed_images)
      : [];

    // Update each variant's info and images
    for (let i = 0; i < existingCar.variantIds.length; i++) {
      const variant = existingCar.variantIds[i];
      variant.price = req.body[`variant_${i}_price`];
      variant.stock = req.body[`variant_${i}_stock`];
      variant.color = req.body[`variant_${i}_color`];

      // Remove deleted images from variant's image_url
      variant.image_url = variant.image_url.filter(
        (imgUrl) => !removedImages.includes(imgUrl)
      );

      // Append newly uploaded images
      if (req.files) {
        const uploadedImages = req.files
          .filter((file) => file.fieldname === `variant_${i}_images`)
          .map((file) => file.path);

        if (uploadedImages.length > 0) {
          variant.image_url.push(...uploadedImages);
        }
      }

      await variant.save();
    }

    res.json({
      success: true,
      message: "Car product updated successfully",
      redirect: "/admin/products-management",
    });
  } catch (err) {
    console.error("Edit car error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

//car and accessory
const softDelete = async (req, res, next) => {
  try {
    //collecting data
    const id = req.params.id;

    const carProduct = await Car.findById(id);

    const accessoryProduct = await Accessory.findById(id);

    //if the product is car or accesories
    if (carProduct) {
      const carProductId = carProduct._id;

      if (carProduct.isListed) {
        await Car.updateOne(
          { _id: carProductId },
          { $set: { isListed: false } }
        );
      } else {
        await Car.updateOne(
          { _id: carProductId },
          { $set: { isListed: true } }
        );
      }
    }

    if (accessoryProduct) {
      const accessoryProductId = accessoryProduct._id;

      if (accessoryProduct.isListed) {
        await Accessory.updateOne(
          { _id: accessoryProductId },
          { $set: { isListed: false } }
        );
      } else {
        await Accessory.updateOne(
          { _id: accessoryProductId },
          { $set: { isListed: true } }
        );
      }
    }

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from softDelete car and accessory", error);
    next(error);
  }
};
// const softDeleteCar = async (req, res, next) => {
//   try {
//     console.log("......................", req.params.id);
//     const id = req.params.id;
//     const carProduct = await Car.findById(id);
//     const carProductId = carProduct._id;
//     console.log(carProduct);

//     if (carProduct.isListed) {
//       await Car.updateOne({ _id: carProductId }, { $set: { isListed: false } });
//     } else {
//       await Car.updateOne({ _id: carProductId }, { $set: { isListed: true } });
//     }
//     res.status(OK).json({ success: true });
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// };

const addAccessoriesProduct = async (req, res, next) => {
  try {
    //finding duplicate
    const name = req.body.name;
    const duplicate = await Accessory.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (duplicate)
      return res
        .status(CONFLICT)
        .json({ success: false, message: "Accessory name already exists." });

    //adding images
    const image_url = req.files.map((file) => file.path);
    const newAccessories = new Accessory({
      name: req.body.name,
      brand_id: req.body.brand_id,
      category_id: req.body.category_id,
      product_type_id: req.body.product_type_id,
      description: req.body.description,

      // Specification fields
      country_of_origin: req.body.country_of_origin,
      fabric: req.body.fabric,
      finish: req.body.finish,
      fitting: req.body.fitting,
      warranty: req.body.warranty,
      waterproof: req.body.waterproof,

      // Vehicle compatibility
      vehicle: req.body.vehicle,
      production_year: req.body.production_year,
      price: req.body.price,
      material: req.body.material,
      stock: req.body.stock,
      images: image_url,
    });

    await newAccessories.save();
    res.status(OK).json({
      success: true,
      redirect: "/admin/products-management",
      message: "Accessory added successfully.",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const editAccessories = async (req, res, next) => {
  try {
    //collecting data
    const { accessoryId, name } = req.body;

    //saving removed image path to array
    const removed_images = req.body.removed_images
      ? JSON.parse(req.body.removed_images)
      : [];

    //new image path
    const filePaths = req.files?.length ? req.files.map((f) => f.path) : [];

    //updating new data
    const updateData = {
      name: req.body.name,
      brand_id: req.body.brand_id,
      category_id: req.body.category_id,
      product_type_id: req.body.product_type_id,
      description: req.body.description,
      country_of_origin: req.body.country_of_origin,
      fabric: req.body.fabric,
      finish: req.body.finish,
      fitting: req.body.fitting,
      warranty: req.body.warranty,
      waterproof:
        req.body.waterproof === "true" || req.body.waterproof === true,
      vehicle: req.body.vehicle,
      production_year: req.body.production_year,
      price: req.body.price,
      material: req.body.material,
      stock: req.body.stock,
    };

    // Remove selected images (if any)
    if (removed_images.length > 0) {
      await Accessory.findByIdAndUpdate(accessoryId, {
        $pull: { images: { $in: removed_images } },
      });
    }

    //Add new images (if any)
    if (filePaths.length > 0) {
      await Accessory.findByIdAndUpdate(accessoryId, {
        $addToSet: { images: { $each: filePaths } },
      });
    }

    //Update fields
    await Accessory.findByIdAndUpdate(
      accessoryId,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      redirect: "/admin/products-management",
    });
  } catch (error) {
    console.error("Error updating accessory:", error);
    next(error);
  }
};

module.exports = {
  addCarProduct,
  editCarProduct,
  softDelete,
  addAccessoriesProduct,
  editAccessories,
};
