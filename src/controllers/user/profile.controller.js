const {
  OK,
  FORBIDDEN,
  NOT_FOUND,
  UNAUTHORIZED,
  CONFLICT,
} = require("../../constant/statusCode");
const User = require("../../models/user/UserModel");
const Address = require("../../models/user/addressModel");
const bcrypt = require("bcrypt");

//load profile page
const loadProfilePage = async (req, res, next) => {
  try {
    // finding user
    const userId = req.session.user._id;
    const user = await User.findById(userId).lean();

    //find user address
    const address = await Address.find({ userId }).lean();

    res.status(OK).render("user/account/profile", {
      layout: "userAccountLayout",
      user,
      address,
    });
  } catch (error) {
    console.log("Error from account profile page", error);
    next(error);
  }
};

// load edit profile page
const loadEditProfilePage = async (req, res, next) => {
  try {
    //find user
    const userId = req.params.userId;
    const user = await User.findById(userId).lean();

    res.status(OK).render("user/account/editProfile", {
      layout: "userAccountLayout",
      user,
    });
  } catch (error) {
    console.log("Error from account edit profile page", error);
    next(error);
  }
};

//load change password
const loadChangePassword = (req, res) => {
  res
    .status(OK)
    .render("user/account/changePassword", { layout: "userAccountLayout" });
};
//email check
const editEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  res.json({ exists: !!user });
};

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

    //seting default profile image
    if (deleteProfileImage === "true") {
      const defaultImage = User.schema.path("profileImage_url").defaultValue;

      await User.findByIdAndUpdate(req.session.user._id, {
        profileImage_url: defaultImage,
      });
    }

    // saving data
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
      { upsert: true },
    );

    res.status(OK).json({ success: true, redirect: "/account/profile" });
  } catch (error) {
    console.error("Error from edit profile PUT request", error);
    next(error);
  }
};

//change password
const changePassword = async (req, res, next) => {
  try {
    //colleting data
    const userId = req.params.userId;
    const { currentPassword, newPassword } = req.body;

    //finding user
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "User not Found" });

    //compare hash password
    const compare = await bcrypt.compare(currentPassword, user.password);
    if (!compare)
      return res
        .status(UNAUTHORIZED)
        .json({ success: false, alert: "Current Password not Matching" });

    //hashing password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const hashNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashNewPassword;
    await user.save();

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from chnage password in account", error);
    next(error);
  }
};

module.exports = {
  editEmail,
  editProfile,
  changePassword,
  loadEditProfilePage,
  loadProfilePage,
  loadChangePassword,
};
