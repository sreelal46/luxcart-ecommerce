const { OK, CONFLICT, NOT_FOUND } = require("../../constant/statusCode");
const Category = require("../../models/admin/categoryModel");

const addCategory = async (req, res, next) => {
  //collecting data
  const { name, description, productType } = req.body;
  console.log(req.body);

  try {
    //search any duplicate
    const duplicate = await Category.findOne({
      name: { $regex: new RegExp(`^/${name}/$`, "i") },
    }).lean();

    if (duplicate)
      return res
        .status(CONFLICT)
        .json({ success: false, alert: "This category is existing" });

    //creating new category
    const newCategory = new Category({
      name,
      product: productType,
      description,
    });

    await newCategory.save();

    res.status(OK).json({ success: true, alert: "Successfull" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const editCategory = async (req, res, next) => {
  try {
    //collecting data
    const { name, description, product } = req.body;
    console.log(req.body);
    const categorieId = req.params.id;

    //finding duplicate
    // const duplicate = await Category.findOne({
    //   name: { $regex: new RegExp(`^${name}$`, "i") },
    // });

    // if (duplicate)
    //   return res
    //     .status(CONFLICT)
    //     .json({ success: false, message: "Brand name already exists." });

    //searching
    const categoryData = await Category.findById(categorieId);
    if (!categoryData)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Category not found" });

    //updating data
    const updateData = { name, description, product };
    await Category.findByIdAndUpdate(categorieId, updateData);

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const softDeleteCategory = async (req, res, next) => {
  try {
    //collecting ID
    const id = req.params.id;

    //searching and unlisting or listing product
    const category = await Category.findById(id);
    if (!category)
      return res
        .status(NOT_FOUND)
        .json({ success: true, alet: "Somthing Wrong" });
    if (category.isListed) {
      await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    } else {
      await Category.updateOne({ _id: id }, { $set: { isListed: true } });
    }

    res.status(OK).json({ success: true, alert: "Unlisted " });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
module.exports = { addCategory, editCategory, softDeleteCategory };
