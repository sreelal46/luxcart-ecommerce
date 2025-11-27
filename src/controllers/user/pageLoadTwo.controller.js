const { OK } = require("../../constant/statusCode");
const Address = require("../../models/user/addressModel");
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

//load address page
const loadAddressPage = async (req, res, next) => {
  try {
    // finding address
    const userId = req.session.user._id;
    const address = await Address.find({ userId });

    res
      .status(OK)
      .render("user/account/address", { layout: "userAccountLayout", address });
  } catch (error) {
    console.log("Error from load address page", error);
    next(error);
  }
};

//load add address page
const loadAddAddressPage = (req, res) => {
  res
    .status(OK)
    .render("user/account/addAddress", { layout: "userAccountLayout" });
};

//load edit address
const loadEditAddressPage = async (req, res, next) => {
  try {
    const addressId = req.params.addressId;
    const address = await Address.findById(addressId).lean();

    res.status(OK).render("user/account/editAddress", {
      layout: "userAccountLayout",
      address,
    });
  } catch (error) {}
};

//load change password
const loadChangePassword = (req, res) => {
  res
    .status(OK)
    .render("user/account/changePassword", { layout: "userAccountLayout" });
};

//load order page
const loadOrderPage = async (req, res, next) => {
  try {
    res
      .status(OK)
      .render("user/account/orderHistory", { layout: "userAccountLayout" });
  } catch (error) {
    console.log("Error from order page load", error);
    next(error);
  }
};

//load cart page
const loadCartPage = async (req, res, next) => {
  try {
    res.status(OK).render("user/account/cart");
  } catch (error) {
    console.log("Error from cart page load", error);
    next(error);
  }
};

module.exports = {
  loadAccountPage,
  loadProfilePage,
  loadEditProfilePage,
  loadAddressPage,
  loadAddAddressPage,
  loadEditAddressPage,
  loadChangePassword,
  loadOrderPage,
  loadCartPage,
};
