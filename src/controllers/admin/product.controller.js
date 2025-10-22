const { OK } = require("../../constant/statusCode");
const { saveCarWithVariants } = require("../helper/saveCarWithVariants");

const addCarProduct = async (req, res, next) => {
  try {
    const carData = req.body;

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

module.exports = { addCarProduct };
