const { OK } = require("../../constant/statusCode");
const Address = require("../../models/user/AddressModel");
const User = require("../../models/user/UserModel");

//load account page
const loadAccountPage = async (req, res, next) => {
  try {
    //finding user
    const userId = req.session.user._id;
    const user = await User.findById(userId).lean();

    res
      .status(OK)
      .render("user/account/welcome", { layout: "userAccountLayout", user });
  } catch (error) {
    console.log("Error from account wellcom page", error);
    next(error);
  }
};
//load profile page
const loadProfilePage = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId).lean();

    res
      .status(OK)
      .render("user/account/profile", { layout: "userAccountLayout", user });
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

const loadAddressPage = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const address = await Address.find({ user: userId });
    console.log("nice addresssssssss", address);

    res
      .status(OK)
      .render("user/account/address", { layout: "userAccountLayout", address });
  } catch (error) {
    console.log("Error from load address page", error);
    next(error);
  }
};

const loadAddAddressPage = (req, res) => {
  res
    .status(OK)
    .render("user/account/addAddress", { layout: "userAccountLayout" });
};

module.exports = {
  loadAccountPage,
  loadProfilePage,
  loadEditProfilePage,
  loadAddressPage,
  loadAddAddressPage,
};
