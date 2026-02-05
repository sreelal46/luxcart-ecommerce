const { OK, CONFLICT, NOT_FOUND } = require("../../constant/statusCode");
const Type = require("../../models/admin/typeModal");

//load Type page
const loadType = async (req, res, next) => {
  try {
    let { search, page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search && search !== "undefined" && search.trim() !== "") {
      const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
      filter.$or = [{ name: regex }];
    }

    const [typess, totalType] = await Promise.all([
      Type.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Type.countDocuments(filter),
    ]);

    if (req.xhr || req.headers.accept.indexOf("application/json") > -1) {
      return res.json({
        success: true,
        result: typess,
        totalPages: Math.ceil(totalType / limit),
        currentPage: page,
      });
    }

    //fetch all data
    const types = await Type.find({}).sort({ createdAt: -1 }).lean();
    res.status(OK).render("admin/typeManagement", { types });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addType = async (req, res, next) => {
  try {
    //colleting data
    const { name, description } = req.body;

    //searching any duplicate
    const duplicate = await Type.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    }).lean();

    if (duplicate)
      return res
        .status(CONFLICT)
        .json({ success: false, alert: "This type is existing" });

    //new Types
    const newType = await new Type({
      name: name.trim(),
      description: description.trim(),
    });

    await newType.save();
    res.status(OK).json({ success: true, alert: "Success" });
  } catch (error) {
    console.log("Error from adding type", error);
    next(error);
  }
};

const editType = async (req, res, next) => {
  try {
    //collecting data
    const id = req.params.id;
    const { name, description } = req.body;

    //find any duplicate
    const typeData = await Type.findById(id).lean();

    if (typeData.name.toLowerCase() !== name.trim().toLowerCase()) {
      const duplicate = await Type.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });

      if (duplicate) {
        return res
          .status(CONFLICT)
          .json({ success: false, alert: "Type already exists." });
      }
    }

    //finding and updating
    const updateData = { name, description };
    await Type.findByIdAndUpdate(id, updateData);

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from editing type", error);
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

module.exports = { loadType, addType, editType, softDeleteType };
