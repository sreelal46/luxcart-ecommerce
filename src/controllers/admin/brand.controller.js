const {
  OK,
  CONFLICT,
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
} = require("../../constant/statusCode");
const Brand = require("../../models/admin/brandModal");

//adding new brand
const addBrand = async (req, res) => {
  try {
    //collect data
    const { name, country } = req.body;
    const imageFile = req.file;
    //finding data
    const duplicate = await Brand.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (duplicate)
      return res
        .status(CONFLICT)
        .json({ success: false, alert: "Brand name already exists." });

    //if no image
    if (!imageFile) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "No image uploaded" });
    }
    //creating new brand
    const newBrand = new Brand({
      name,
      country,
      image_url: imageFile.path,
    });
    await newBrand.save();

    res.json({ success: true, redirect: "/admin/brands-management" });
  } catch (err) {
    console.error("Brand Add Error:", err);
    res
      .status(INTERNAL_SERVER_ERROR)
      .json({ success: false, alert: "Internal server error" });
  }
};

//editing brand
const editBrand = async (req, res, next) => {
  try {
    //colleting data
    const brandId = req.params.id;
    const { name, country } = req.body;

    const barndData = await Brand.findById(brandId).lean();

    if (barndData.name.toLowerCase() !== name.trim().toLowerCase()) {
      const duplicate = await Brand.findOne({
        _id: { $ne: brandId },
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });

      if (duplicate)
        return res
          .status(CONFLICT)
          .json({ success: false, alert: "Brand already exists." });
    }
    //updating data
    const updateData = { name, country };
    if (req.file) updateData.image_url = req.file.path;

    await Brand.findByIdAndUpdate(brandId, updateData);

    res
      .status(OK)
      .json({ success: true, redirect: "/admin/brands-management" });
  } catch (err) {
    console.error("Error from edidting brand", err);
    res
      .status(INTERNAL_SERVER_ERROR)
      .json({ success: false, alert: "Failed to update brand" });
    next(err);
  }
};

const softDeleteBrand = async (req, res, next) => {
  try {
    //colleting data
    const id = req.params.id;
    const brand = await Brand.findById(id);
    const brandId = brand._id;
    //update data
    if (brand.isListed) {
      await Brand.updateOne({ _id: brandId }, { $set: { isListed: false } });
    } else {
      await Brand.updateOne({ _id: brandId }, { $set: { isListed: true } });
    }

    res.status(OK).json({ success: true, alert: "success" });
  } catch (error) {
    console.log("Error from soft delete brand", error);
    next(error);
  }
};

module.exports = { addBrand, editBrand, softDeleteBrand };
