const {
  OK,
  FORBIDDEN,
  NOT_FOUND,
  UNAUTHORIZED,
  CONFLICT,
} = require("../../constant/statusCode");
const User = require("../../models/user/UserModel");
const Address = require("../../models/user/addressModel");

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
  const { from, cartId } = req.query;
  if (from === "checkout")
    return res.status(OK).render("user/account/addAddress", {
      layout: "checkoutAddressLayout",
      from,
      cartId,
    });

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
//add address
const addAddress = async (req, res, next) => {
  try {
    //collecting data
    const userId = req.params.userId;

    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(NOT_FOUND).json({
        success: false,
        alert: "User not found",
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
    const { from, cartId } = req.query;

    await Address.create({
      userId,
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

    res.status(OK).json({
      success: true,
      redirect: from ? `/cart/checkout-step-1/${cartId}` : "/account/addresses",
    });
  } catch (error) {
    console.log("Error from add address", error);
    next(error);
  }
};

//edit address
const editAddress = async (req, res, next) => {
  try {
    //collecting data
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
    const addressId = req.params.addressId;

    const address = await Address.findById(addressId);

    if (!address)
      return res.status(FORBIDDEN).json({
        success: false,
        alert: "Address not found please try again later",
      });

    await Address.findOneAndUpdate(
      { _id: addressId },
      {
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
      },
    );

    res.status(OK).json({ success: true, redirect: "/account/addresses" });
  } catch (error) {
    console.log("Error from edit address", error);
    next(error);
  }
};

//set as default
const setDeafaultAddress = async (req, res, next) => {
  try {
    //find address
    const addressId = req.params.addressId;
    const userId = req.session.user._id;
    const address = await Address.findById(addressId);

    if (!address)
      return res
        .status(FORBIDDEN)
        .json({ success: false, alert: "Address not found" });

    //updating
    await Address.updateMany({ userId }, { $set: { defaultAddress: false } });
    await Address.findByIdAndUpdate(addressId, { defaultAddress: true });

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from set as default", error);
    next(error);
  }
};

//delete address
const deleteAddress = async (req, res, next) => {
  try {
    //find address
    const addressId = req.params.addressId;
    const address = await Address.findById(addressId);
    if (!address)
      return res
        .status(FORBIDDEN)
        .json({ success: false, alert: "Address not found" });
    await Address.deleteOne({ _id: addressId });
    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from delete address", error);
    next(error);
  }
};

module.exports = {
  loadAddressPage,
  loadAddAddressPage,
  loadEditAddressPage,
  addAddress,
  editAddress,
  deleteAddress,
  setDeafaultAddress,
};
