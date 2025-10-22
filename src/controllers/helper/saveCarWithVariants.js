const Car = require("../../models/admin/productCarModal");
const CarVariant = require("../../models/admin/carVariantModel");

async function saveCarWithVariants(carData, variantFiles) {
  try {
    //Save main car
    const car = new Car({
      name: carData.name,
      brand_id: carData.brand, // ObjectId
      category_id: carData.category, // ObjectId
      product_type_id: carData.product_type, // ObjectId
      price: carData.variant_price[0], // main price
      description: carData.description,
      year: carData.year,
      mileage: carData.mileage,
      warranty: carData.warranty,
      region: carData.region,
      top_speed: carData.top_speed,
      power_hp: carData.power_hp,
      engine: carData.engine,
      transmission: carData.transmission,
      drive_type: carData.drive_type,
      torque: carData.torque,
      acceleration_0_100: carData.acceleration_0_100,
      interiorAndExteriorColor: carData.colors,
      wheels: carData.wheels,
      upholstery: carData.upholstery,
      design: carData.design,
      cameras: carData.cameras,
      lane_assist: carData.lane_assist === "true",
      sound_system: carData.sound_system,
      keyless_go: carData.keyless_go === "true",
    });

    const savedCar = await car.save();
    console.log("Car saved:", savedCar._id);

    // 2️⃣ Save variants
    const variantPromises = variantFiles.map((files, index) => {
      const imageUrls = files.map((f) => f.path); // Cloudinary URLs
      return new CarVariant({
        product_id: savedCar._id,
        price: carData.variant_price[index],
        color: carData.variant_color[index],
        stock: carData.variant_stock[index],
        image_url: imageUrls,
      }).save();
    });

    const savedVariants = await Promise.all(variantPromises);

    // 3️⃣ Update car document with variant IDs
    savedCar.variantIds = savedVariants.map((v) => v._id);
    await savedCar.save();

    console.log("All variants saved:", savedVariants.length);
    return { car: savedCar, variants: savedVariants };
  } catch (err) {
    console.error("Error saving car and variants:", err);
    throw err;
  }
}

module.exports = { saveCarWithVariants };
