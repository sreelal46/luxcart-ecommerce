const Cart = require("../../models/user/CartModel");
const Admin = require("../../models/admin/adminModel");
const ContactMessage = require("../../models/admin/contactModal");
const defaultAvatar = process.env.DEFAULT_PROFILE_IMAGE_URL;

const locals = async (req, res, next) => {
  // Count unread contact messages for admin notification badge
  const unreadCount = await ContactMessage.countDocuments({
    isRead: false,
  });

  // Store notification count in res.locals for access in views
  res.locals.notificationCount = unreadCount;

  // Extract user ID from session
  const userId = req.session?.user?._id;

  // Fetch user's cart from database
  const cart = await Cart.findOne({ userId });

  // Fetch admin settings/info (assumes single admin document)
  const admin = await Admin.findOne();

  // Calculate cart items count, default to 0 if no cart exists
  const cartItemsLength = cart ? cart.items.length : 0;

  // Make admin session data available to views
  res.locals.admin = req.session.admin || null;

  // Make user session data available to views
  res.locals.user = req.session.user || null;

  // Populate footer data with admin contact information
  res.locals.footer = {
    address: admin.address,
    email: admin.email,
    phone: admin.phone,
  };

  // Make cart item count available to views (e.g., for cart badge)
  res.locals.cartItemsLength = cartItemsLength;

  // Make default avatar URL available to views
  res.locals.defaultAvatar = defaultAvatar;

  // Continue to next middleware/route handler
  next();
};

module.exports = { locals };
