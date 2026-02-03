const Cart = require("../../models/user/CartModel");

const defaultAvatar = process.env.DEFAULT_PROFILE_IMAGE_URL;
const locals = async (req, res, next) => {
  const userId = req.session?.user?._id;
  const cart = await Cart.findOne({ userId });
  const cartItemsLength = cart ? cart.items.length : 0;
  res.locals.admin = req.session.admin || null;
  res.locals.user = req.session.user || null;
  res.locals.footer = req.session.footer || null;
  res.locals.cartItemsLength = cartItemsLength;
  res.locals.defaultAvatar = defaultAvatar;
  next();
};

module.exports = { locals };
