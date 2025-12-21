const express = require("express");
const route = express.Router();
const upload = require("../config/multer");

// ====================== ADMIN LAYOUT ======================
route.use((req, res, next) => {
  res.locals.layout = "adminLayout";
  next();
});

// ====================== AUTH MIDDLEWARE ======================
const {
  checkSession,
  isLogin,
  isPasswordChange,
} = require("../middlewares/admin/adminAuth");

// ====================== PAGE LOAD CONTROLLERS ======================
const {
  adminLoadLoginPage,
  loadDashboard,
  loadChangePassword,
  loadEmailVerify,
  loadOTPVerify,
  loadBrands,
  loadCategory,
  loadType,
  loadProduct,
  loadCarProduct,
  loadViewCar,
  loadEditCar,
  loadAddAccessories,
  loadViewAccessories,
  loadEditAccessories,
  usersManagement,
  usersManagementDetail,
} = require("../controllers/admin/pageLoad.controller");

const {
  loadOrderManagement,
  loadOneOrder,
  loadStockPage,
  loadReturnReq,
  loadCancelReq,
} = require("../controllers/admin/pageLoadTwo.controller");

// ====================== AUTH CONTROLLERS ======================
const {
  verifyadmin,
  emailVerification,
  OTPVerification,
  PasswordChanging,
  resendOTP,
} = require("../controllers/admin/adminAuth.controller");

// ====================== AUTH ROUTES ======================
route.get("/login", isLogin, adminLoadLoginPage);
route.post("/login", verifyadmin);

route.get("/logout", checkSession, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.redirect("/admin/dashboard");
    }
    res.clearCookie("admin.sid");
    res.redirect("/admin/login");
  });
});

// forgot password
route.get("/verify-email-page", loadEmailVerify);
route.post("/verify-email", emailVerification);

route.get("/otp-verify-page", loadOTPVerify);
route.post("/otp-verify", OTPVerification);

route.get("/change-password-page", isPasswordChange, loadChangePassword);
route.post("/change-password", PasswordChanging);

route.get("/resend-otp", resendOTP);

// ====================== DASHBOARD ======================
route.get("/dashboard", checkSession, loadDashboard);

// ====================== BRAND ======================
const {
  addBrand,
  editBrand,
  softDeleteBrand,
} = require("../controllers/admin/brand.controller");

route.get("/brands-management", checkSession, loadBrands);
route.post(
  "/brands-management/add-brand",
  checkSession,
  upload.single("image"),
  addBrand
);
route.put(
  "/brands-management/edit-brand/:id",
  checkSession,
  upload.single("image"),
  editBrand
);
route.patch(
  "/brands-management/soft-delete-brand/:id",
  checkSession,
  softDeleteBrand
);

// ====================== CATEGORY ======================
const {
  addCategory,
  editCategory,
  softDeleteCategory,
  addOfferToCategory,
  removeOfferToCategory,
} = require("../controllers/admin/category.controller");

route.get("/categorys-management", checkSession, loadCategory);
route.post("/categorys-management/add-category", checkSession, addCategory);
route.put(
  "/categorys-management/edit-category/:id",
  checkSession,
  editCategory
);
route.patch(
  "/categorys-management/soft-delete-category/:id",
  checkSession,
  softDeleteCategory
);

//offers
route.put("/categorys-management/add-offer/:categoryId", addOfferToCategory);
route.patch(
  "/categorys-management/remove-offer/:categoryId",
  removeOfferToCategory
);
// ====================== TYPE ======================
const {
  addType,
  editType,
  softDeleteType,
} = require("../controllers/admin/type.controller");

route.get("/types-management", checkSession, loadType);
route.post("/types-management/add-type", checkSession, addType);
route.put("/types-management/edit-type/:id", checkSession, editType);
route.patch(
  "/types-management/soft-delete-type/:id",
  checkSession,
  softDeleteType
);

// ====================== PRODUCT ======================
const {
  addCarProduct,
  editCarProduct,
  softDelete,
  addAccessoriesProduct,
  editAccessories,
} = require("../controllers/admin/product.controller");

route.get("/products-management", checkSession, loadProduct);

// car
route.get("/products-management/add-car-product", checkSession, loadCarProduct);
route.post(
  "/products-management/add-car-product",
  checkSession,
  upload.any(),
  addCarProduct
);
route.get(
  "/products-management/view-car-product/:id",
  checkSession,
  loadViewCar
);
route.get(
  "/products-management/edit-car-product/:id",
  checkSession,
  loadEditCar
);
route.put(
  "/products-management/edit-car-product/:id",
  checkSession,
  upload.any(),
  editCarProduct
);

// accessories
route.get(
  "/products-management/add-accessories-product",
  checkSession,
  loadAddAccessories
);
route.post(
  "/products-management/add-accessories-product",
  checkSession,
  upload.any(),
  addAccessoriesProduct
);
route.get(
  "/products-management/view-accessories-product/:id",
  checkSession,
  loadViewAccessories
);
route.get(
  "/products-management/edit-accessories-product/:id",
  checkSession,
  loadEditAccessories
);
route.put(
  "/products-management/edit-accessories-product/:id",
  checkSession,
  upload.any(),
  editAccessories
);

// soft delete
route.patch(
  "/products-management/soft-delete-product/:id",
  checkSession,
  softDelete
);
// ================= PRODUCT OFFER ===================
const {
  addProductOffer,
  removeProductOffer,
} = require("../controllers/admin/product.offer.controller");
route.put(
  "/products-management/add-offer/:productId",
  checkSession,
  addProductOffer
);
route.put(
  "/products-management/remove-offer/:productId",
  checkSession,
  removeProductOffer
);

// ====================== ORDER ======================
const {
  updateOrderStatus,
  updateSingleItemStatus,
  returnApprove,
  returnReject,
  cancelApprove,
  cancelReject,
} = require("../controllers/admin/order.controller");

route.get("/orders-management", checkSession, loadOrderManagement);
route.get("/orders-management/view-order/:orderId", checkSession, loadOneOrder);

route.patch(
  "/orders-management/update-status/:orderId",
  checkSession,
  updateOrderStatus
);
route.patch(
  "/orders-management/update-status/:orderId/:itemId",
  checkSession,
  updateSingleItemStatus
);

// return
route.get(
  "/orders-management/return-request-management",
  checkSession,
  loadReturnReq
);
route.patch(
  "/orders-management/return-request-management/:orderId/:itemId/approve",
  checkSession,
  returnApprove
);
route.patch(
  "/orders-management/return-request-management/:orderId/:itemId/reject",
  checkSession,
  returnReject
);

// cancel
route.get(
  "/orders-management/cancel-request-management",
  checkSession,
  loadCancelReq
);
route.patch(
  "/orders-management/cancel-request-management/:orderId/:itemId/approve",
  checkSession,
  cancelApprove
);
route.patch(
  "/orders-management/cancel-request-management/:orderId/:itemId/reject",
  checkSession,
  cancelReject
);

// ====================== STOCK ======================
route.get("/stock-management", checkSession, loadStockPage);

// ====================== USERS ======================
const { blockOrUnblockUser } = require("../controllers/admin/user.controller");

route.get("/users-management", checkSession, usersManagement);
route.get(
  "/users-management/user-details/:userId",
  checkSession,
  usersManagementDetail
);
route.patch(
  "/users-management/block-unblock-user/:id",
  checkSession,
  blockOrUnblockUser
);

// ====================== MISC ======================
route.get("/sales-report", checkSession, async (req, res) => {
  const sales = [
    {
      buyer: "John Doe",
      product: "Audi Q7",
      product_id: "LX001",
      quantity: 1,
      price: 6500000,
      category: "Car",
      total: 6500000,
    },
    {
      buyer: "Sarah Lee",
      product: "Seat Cover",
      product_id: "AC045",
      quantity: 2,
      price: 1500,
      category: "Accessories",
      total: 3000,
    },
  ];
  res.render("admin/salesReport", { sales });
});

route.get("/wallet", checkSession, (req, res) => {
  res.render("admin/walletView");
});

route.get("/coupons-management", checkSession, (req, res) => {
  res.render("admin/couponsManagement");
});

route.get("/settings", checkSession, (req, res) => {
  res.render("admin/settings");
});

module.exports = route;
