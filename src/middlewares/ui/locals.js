const Cart = require("../../models/user/CartModel");
const Admin = require("../../models/admin/adminModel");
const ContactMessage = require("../../models/admin/contactModal");
const defaultAvatar = process.env.DEFAULT_PROFILE_IMAGE_URL;

const locals = async (req, res, next) => {
  const unreadCount = await ContactMessage.countDocuments({
    isRead: false,
  });

  res.locals.notificationCount = unreadCount;
  const userId = req.session?.user?._id;
  const cart = await Cart.findOne({ userId });
  const admin = await Admin.findOne();
  const cartItemsLength = cart ? cart.items.length : 0;
  res.locals.admin = req.session.admin || null;
  res.locals.user = req.session.user || null;
  res.locals.footer = {
    address: admin.address,
    email: admin.email,
    phone: admin.phone,
  };
  res.locals.cartItemsLength = cartItemsLength;
  res.locals.defaultAvatar = defaultAvatar;
  next();
};

module.exports = { locals };
