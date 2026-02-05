const express = require("express");
const route = express.Router();
const upload = require("../config/multer");

// ====================== AUTH MIDDLEWARE ======================
const {
  isLogin,
  checkSession,
  isPasswordChange,
} = require("../middlewares/user/userAuth");

// ====================== PAGE LOAD CONTROLLERS ======================
const {
  loadLandingPage,
  loadHomePage,
  loadContactPage,
  loadAboutUsPage,
  loadPrivacyPolicyPage,
  loadShippingPage,
  loadWarrantyPage,
  loadFAQPage,
  sendMessage,
} = require("../controllers/user/homePage.controller");

const {
  loadCarCollection,
  loadSingleCarProduct,
  loadAllAccessories,
  loadSingleAccessories,
} = require("../controllers/user/productsPage.controller");

const {
  loadCheckoutStep1,
  loadCheckoutStep2,
  loadCheckoutStep4,
} = require("../controllers/user/checkoutPage.controller");

const {
  loadAccountPage,
  loadReferralsPage,
} = require("../controllers/user/refrralsAndAccountPage.controller");

// ====================== AUTH CONTROLLERS ======================
const {
  loadLoginPage,
  loadSignUpPage,
  loadEmailPage,
  loadForgotPassPage,
  createUser,
  verifyUser,
  logoutPage,
  forgotPassword,
} = require("../controllers/user/users.Auth.Controller");

const {
  loadSend_OTP_Page,
  loadVerify_OTP_Page,
  sendOTP,
  verifyOTP,
  resendOTP,
} = require("../controllers/user/otp.controller");

// ====================== HOME & AUTH ROUTES ======================
route.get("/", loadLandingPage);
route.get("/homepage", checkSession, loadHomePage);
route.get("/contact", checkSession, loadContactPage);
route.post("/contact/send-message", checkSession, sendMessage);
route.get("/about", checkSession, loadAboutUsPage);
route.get("/privacy-policy", checkSession, loadPrivacyPolicyPage);
route.get("/shipping", checkSession, loadShippingPage);
route.get("/warranty", checkSession, loadWarrantyPage);
route.get("/faq", checkSession, loadFAQPage);
route.get("/logout", logoutPage);

// login
route.get("/login", isLogin, loadLoginPage);
route.post("/login", verifyUser);

// signup
route.get("/signup", isLogin, loadSignUpPage);
route.post("/signup", createUser);

// OTP verification
route.get("/send-otp", isLogin, isPasswordChange, loadSend_OTP_Page);
route.post("/send-otp", sendOTP);

route.get("/verify-otp", isPasswordChange, loadVerify_OTP_Page);
route.post("/verify-otp", verifyOTP);

route.get("/resend-otp", resendOTP);

// forgot password
route.get("/forgot-password-email-verification", isLogin, loadEmailPage);
route.get("/forgot-password-otp", loadVerify_OTP_Page);
route.get("/forgot-password", isPasswordChange, loadForgotPassPage);
route.post("/forgot-password", forgotPassword);

// ====================== PRODUCTS ======================
// cars collection
route.get("/cars-collection", loadCarCollection);
route.get("/cars-collection/view-car-product/:carId", loadSingleCarProduct);

// accessories
route.get("/all-accessories", loadAllAccessories);
route.get("/all-accessories/view-accessory-product/:id", loadSingleAccessories);

// ====================== CART ======================
const {
  loadCartPage,
  addToCart,
  deleteFromCart,
  changeQuantity,
  applyCoupon,
  removeCoupon,
} = require("../controllers/user/cart.controller");

route.get("/cart", checkSession, loadCartPage);
route.post("/cart/add", checkSession, addToCart);
route.delete("/cart/remove-product/:itemId", checkSession, deleteFromCart);
route.put("/cart/change-quantity/:itemId", checkSession, changeQuantity);
route.patch("/cart/add-coupon/:couponId", checkSession, applyCoupon);
route.patch("/cart/remove-coupon", checkSession, removeCoupon);

// ====================== CHECKOUT ======================
const {
  checkWalletBalance,
  createOrder,
} = require("../controllers/user/createOrder.controller");

const {
  payment,
  fullPayment,
} = require("../controllers/user/payment.controller");
const {
  checkAvailability,
} = require("../controllers/user/checkoutPage.controller");
route.get(
  "/cart/checkout-step-1/availability/:cartId",
  checkSession,
  checkAvailability,
);
route.get("/cart/checkout-step-1/:cartId", checkSession, loadCheckoutStep1);
route.get(
  "/cart/checkout-step-2/availability/:cartId",
  checkSession,
  checkAvailability,
);
route.get("/cart/checkout-step-2/:addressId", checkSession, loadCheckoutStep2);
route.get(
  "/cart/checkout/wallet-balence/:cartTotal/:walletPaymentMethod",
  checkSession,
  checkWalletBalance,
);
route.post("/cart/create-payment/:paymentMethod", checkSession, payment);
route.post("/cart/checkout/create-order/:cartId", checkSession, createOrder);
route.get("/cart/checkout-step-4/:orderId", checkSession, loadCheckoutStep4);

// ====================== ACCOUNT ======================
route.get("/account", checkSession, loadAccountPage);

// profile
const {
  loadProfilePage,
  loadEditProfilePage,
  loadChangePassword,
  editEmail,
  editProfile,
  changePassword,
} = require("../controllers/user/profile.controller");

route.get("/account/profile", checkSession, loadProfilePage);
route.get(
  "/account/profile/edit-profile/:userId",
  checkSession,
  loadEditProfilePage,
);
route.post("/check-email", editEmail);
route.post(
  "/account/profile/edit-profile/:userId",
  checkSession,
  upload.any(),
  editProfile,
);
route.get("/account/change-password", checkSession, loadChangePassword);
route.post("/account/change-password/:userId", checkSession, changePassword);

// orders
const {
  loadOrderPage,
  loadOrderDetailPage,
  cancelOrder,
  returnOrder,
} = require("../controllers/user/order.controller");

route.get("/account/orders", checkSession, loadOrderPage);
route.get(
  "/account/orders/order-details/:orderId",
  checkSession,
  loadOrderDetailPage,
);
route.post(
  "/account/orders/order-details/cancel-request/:orderId/:itemId",
  checkSession,
  cancelOrder,
);
route.post(
  "/account/orders/order-details/return-request/:orderId/:itemId",
  checkSession,
  returnOrder,
);

// full payment
route.patch("/order/full-payment/:paymentMethod", checkSession, payment);
route.patch(
  "/order/full-payment/change-status/:orderId",
  checkSession,
  fullPayment,
);

// wishlist
const {
  loadWishlistPage,
  addToWishlist,
  deleteFromWishlist,
} = require("../controllers/user/wishlist.controller");

route.get("/account/wishlist", checkSession, loadWishlistPage);
route.post("/account/wishlist/add/:productId", checkSession, addToWishlist);
route.delete(
  "/account/wishlist/delete/:itemId",
  checkSession,
  deleteFromWishlist,
);

// addresses
const {
  loadAddressPage,
  loadAddAddressPage,
  loadEditAddressPage,
  addAddress,
  editAddress,
  deleteAddress,
  setDeafaultAddress,
} = require("../controllers/user/address.controller");

route.get("/account/addresses", checkSession, loadAddressPage);
route.get("/account/addresses/add-address", checkSession, loadAddAddressPage);
route.post("/account/addresses/add-address/:userId", checkSession, addAddress);
route.get(
  "/account/addresses/edit-address/:addressId",
  checkSession,
  loadEditAddressPage,
);
route.put(
  "/account/addresses/edit-address/:addressId",
  checkSession,
  editAddress,
);
route.patch(
  "/account/addresses/set-default-address/:addressId",
  checkSession,
  setDeafaultAddress,
);
route.delete(
  "/account/addresses/delete-address/:addressId",
  checkSession,
  deleteAddress,
);

// referrals
route.get("/account/referrals", checkSession, loadReferralsPage);

// wallet
const {
  loadwalletPage,
  addMoneyToWallet,
  verifyWalletPayment,
} = require("../controllers/user/wallet.controller");

route.get("/account/wallet", checkSession, loadwalletPage);
route.post("/account/wallet/add-money", checkSession, addMoneyToWallet);
route.post("/account/wallet/verify-payment", checkSession, verifyWalletPayment);

// ====================== INVOICE ======================
const { downloadInvoice } = require("../controllers/user/invoice.controller");

route.get(
  "/cart/checkout-success/download-invoice/:orderId",
  checkSession,
  downloadInvoice,
);

module.exports = route;
