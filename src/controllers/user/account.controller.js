const {
  OK,
  FORBIDDEN,
  NOT_FOUND,
  UNAUTHORIZED,
} = require("../../constant/statusCode");
const Accessory = require("../../models/admin/productAccessoryModal");
const Car = require("../../models/admin/productCarModal");
const Cart = require("../../models/user/CartModel");
const User = require("../../models/user/UserModel");
const Address = require("../../models/user/addressModel");
const bcrypt = require("bcrypt");

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

    res.status(OK).json({ success: true, redirect: "/account/addresses" });
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
      }
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

//Cart management
const addToCart = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const { productType, productId, variantId } = req.body;
    console.log(variantId);

    let product;
    if (productType === "car") {
      product = await Car.findById(productId);
    } else if (productType === "accessory") {
      product = await Accessory.findById(productId);
    }

    if (!product) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Product not found" });
    }

    //finding cart user and updating
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [
          {
            carId: productType === "car" ? productId : null,
            accessoryId: productType === "accessory" ? productId : null,
            variantId: variantId || null,
            quantity: 1,
            price: product.price,
          },
        ],
      });
    } else {
      const item = cart.items.find(
        (item) =>
          item.carId?.toString() === productId ||
          item.accessoryId?.toString() === productId
      );

      if (item) {
        if (productType === "accessory") {
          item.quantity += 1;
        }
      } else {
        cart.items.push({
          carId: productType === "car" ? productId : null,
          accessoryId: productType === "accessory" ? productId : null,
          variantId: variantId || null,
          quantity: 1,
          price: product.price,
        });
      }
    }

    await cart.save();

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from add to cart", error);
    next(error);
  }
};

module.exports = {
  editEmail,
  editProfile,
  addAddress,
  editAddress,
  deleteAddress,
  setDeafaultAddress,
  changePassword,
  addToCart,
};
