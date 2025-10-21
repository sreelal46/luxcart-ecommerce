const { OK } = require("../../constant/statusCode");
const Brand = require("../../models/admin/brandModal");

//adding new brand
const addBrand = async (req, res) => {
  try {
    const { name, country } = req.body;
    const imageFile = req.file;

    //if no image
    if (!imageFile) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//editing brand
const editBrand = async (req, res, next) => {
  try {
    const brandId = req.params.id;
    const { name, country } = req.body;

    const updateData = { name, country };
    if (req.file) updateData.image_url = req.file.path;

    await Brand.findByIdAndUpdate(brandId, updateData);

    res
      .status(200)
      .json({ success: true, redirect: "/admin/brands-management" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update brand" });
    next(err);
  }
};

const softDeleteBrand = async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log("deleting brand id====================", id);
    const brand = await Brand.findById(id);
    const brandId = brand._id;
    console.log("brand founed==============", brand);

    if (brand.isListed) {
      await Brand.updateOne({ _id: brandId }, { $set: { isListed: false } });
    } else {
      await Brand.updateOne({ _id: brandId }, { $set: { isListed: true } });
    }

    res.status(OK).json({ success: true, alert: "success" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { addBrand, editBrand, softDeleteBrand };
