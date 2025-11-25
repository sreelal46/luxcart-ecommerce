const { OK, FORBIDDEN } = require("../../constant/statusCode");
const User = require("../../models/user/UserModel");
const Address = require("../../models/user/AddressModel");

//edit profile
const editProfile = async (req, res, next) => {
  try {
    // finding user
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(FORBIDDEN)
        .json({ success: false, alert: "User Not found" });

    //collecting Data
    const { deleteProfileImage, name, email, phone, dob } = req.body;
    const image_Url = req.files.map((p) => p.path)[0];

    await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        phoneNumber: phone,
        dob,
        profileImage_url: image_Url,
      },
      { upsert: true }
    );

    res.status(OK).json({ success: true, redirect: "/account/profile" });
  } catch (error) {
    console.error("Error from edit profile PUT request", error);
    next(error);
  }
};

//add address
const addAddress = async (req, res, next) => {
  try {
    //collecting data
    const userId = req.params.userId;

    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const {
      fullName,
      email,
      phone,
      label,
      street,
      landmark,
      city,
      district,
      state,
      zip,
    } = req.body;

    await Address.create({
      user: userId,
      fullName,
      email,
      phone,
      label,
      street,
      landmark,
      city,
      district,
      state,
      pinCode: zip,
    });

    res.status(OK).json({ success: true, redirect: "/account/addresses" });
  } catch (error) {
    console.log("Error from add address", error);
    next(error);
  }
};

module.exports = {
  editProfile,
  addAddress,
};
