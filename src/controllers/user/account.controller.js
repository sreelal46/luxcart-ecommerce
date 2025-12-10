const path = require("path");
const fs = require("fs");
const {
  OK,
  FORBIDDEN,
  NOT_FOUND,
  UNAUTHORIZED,
  CONFLICT,
} = require("../../constant/statusCode");
const carVariantModel = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Car = require("../../models/admin/productCarModal");
const Cart = require("../../models/user/CartModel");
const User = require("../../models/user/UserModel");
const Address = require("../../models/user/addressModel");
const bcrypt = require("bcrypt");
const generateInvoice = require("../../services/invoiceGenerator");
const Order = require("../../models/user/OrderModel");

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
    const { productType, productId, variantId, directBuy } = req.body;

    let product = null;
    if (productType === "car") product = await Car.findById(productId);
    if (productType === "accessory")
      product = await Accessory.findById(productId);

    if (!product) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Product not found" });
    }

    let variantCar = null;
    if (productType === "car") {
      variantCar = await carVariantModel.findById(variantId);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    let item = null;

    if (productType === "car") {
      item = cart.items.find((i) => i.variantId?.toString() === variantId);
    }

    if (productType === "accessory") {
      item = cart.items.find((i) => i.accessoryId?.toString() === productId);
    }

    if (!item) {
      cart.items.push({
        carId: productType === "car" ? productId : null,
        accessoryId: productType === "accessory" ? productId : null,
        variantId: productType === "car" ? variantId : null,
        quantity: 1,
        price: variantCar?.price || product.price,
      });
    }

    await cart.save();
    req.session.directBuy = null;
    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from add to cart", error);
    next(error);
  }
};

const deleteFromCart = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.session.user._id;

    if (!userId) {
      return res.status(403).redirect("/login");
    }

    // Load user's cart document
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Cart not found" });
    }

    // Remove the item
    cart.items = cart.items.filter((item) =>
      item._id.toString() === itemId ? false : true
    );

    // Save to trigger pre('save')
    await cart.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error from delete product from cart", error);
    next(error);
  }
};

const changeQuantity = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.session.user._id;
    const { quantityIncrease, quantityDecrease } = req.body;
    const cart = await Cart.findOne({ userId });
    const item = cart.items.find((i) => i._id.toString() === itemId);
    const accessoryId = item ? item.accessoryId : null;
    const accessory = await Accessory.findById(accessoryId.toString());

    if (!cart)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Cart not fount" });

    if (!item) {
      return res.status(NOT_FOUND).json({
        success: false,
        alert: "Item not found in cart",
      });
    }

    if (!accessory)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Accessory not found" });

    //Calculate new quantity
    let newQty = item.quantity;
    if (quantityIncrease !== null) newQty = quantityIncrease;
    if (quantityDecrease !== null) newQty = quantityDecrease;

    //Validate stock
    if (newQty > accessory.stock) {
      return res.status(CONFLICT).json({
        success: false,
        alert: `Only ${accessory.stock} items available`,
      });
    }

    //Update quantity safely
    cart.items = cart.items.map((i) => {
      if (i._id.toString() === itemId) i.quantity = newQty;
      return i;
    });

    await cart.save();
    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from Change Quantity", error);
    next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    console.log(orderId);
    const order = await Order.findById(orderId).populate(
      "items.carId items.variantId items.accessoryId"
    );

    // Full address
    const fullAddress =
      `${order.address.street}, ${order.address.landmark}, ` +
      `${order.address.city}, ${order.address.district}, ` +
      `${order.address.state} - ${order.address.pincode}`;

    // Format items
    const formattedItems = order.items.map((item) => ({
      description:
        item.accessoryId?.name ||
        item.variantId?.name ||
        item.carId?.name ||
        "Product",
      qty: item.quantity,
      price: item.price,
      total: item.totalItemAmount,
    }));

    // Data sent to PDF generator
    const invoiceData = {
      orderId: order.orderId,
      createdAt: order.createdAt,
      customerName: order.address.name,
      customerAddress: fullAddress,
      items: formattedItems,
      subtotal: order.subtotal,
      taxPercent: order.taxAmount
        ? Math.round((order.taxAmount / order.subtotal) * 100)
        : 0,
      taxAmount: order.taxAmount,
      discount: order.discount || 0,
      totalAmount: order.totalAmount,
    };

    // Invoice folder path
    const invoiceDir = path.join(__dirname, "../../public/invoices");

    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    // File path
    const filePath = path.join(invoiceDir, `invoice_${order.orderId}.pdf`);

    // Generate PDF
    await generateInvoice(invoiceData, filePath);

    // setTimeout(() => {
    //   res.status(OK).json({
    //     success: true,
    //     alert: "Invoice generated",
    //     file: `/invoices/invoice_${order.orderId}.pdf`,
    //   });
    // }, 2000);
    setTimeout(() => {
      return res.download(filePath, `invoice_${order.orderId}.pdf`);
    }, 2000);
  } catch (error) {
    console.log("Error download invoice:", error);
    next(error);
  }
};

module.exports = { downloadInvoice };

module.exports = {
  editEmail,
  editProfile,
  addAddress,
  editAddress,
  deleteAddress,
  setDeafaultAddress,
  changePassword,
  addToCart,
  deleteFromCart,
  changeQuantity,
  downloadInvoice,
};
