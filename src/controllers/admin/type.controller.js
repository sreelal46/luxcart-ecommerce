const { OK, CONFLICT, NOT_FOUND } = require("../../constant/statusCode");
const Type = require("../../models/admin/typeModal");
const addType = async (req, res, next) => {
  try {
    //colleting data
    const { name, description } = req.body;

    //searching any duplicate
    const duplicate = await Type.findOne({
      name: { $regex: new RegExp(`/${name}/$`, "i") },
    }).lean();

    if (duplicate)
      return res
        .status(CONFLICT)
        .json({ success: false, alert: "This type is existing" });

    const newType = await new Type({
      name,
      description,
    });

    await newType.save();
    res.status(OK).json({ success: true, alert: "Success" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const editType = async (req, res, next) => {
  try {
    //collecting data
    const id = req.params.id;
    const { name, description } = req.body;

    //finding and updating
    const updateData = { name, description };
    await Type.findByIdAndUpdate(id, updateData);

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const softDeleteType = async (req, res, next) => {
  try {
    //collecting data
    const typeId = req.params.id;
    //finding the type
    const types = await Type.findById(typeId);
    if (!types)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Type not existing" });

    //updating type
    if (types.isListed) {
      await Type.updateOne({ _id: typeId }, { $set: { isListed: false } });
    } else {
      await Type.updateOne({ _id: typeId }, { $set: { isListed: true } });
    }
    res.status(OK).json({ success: true, alert: "success" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { addType, editType, softDeleteType };
