const express = require("express");
const route = express.Router();
const upload = require("../config/multer");
const Brand = require("../models/admin/brandModal");

//check session
const {
  checkSession,
  isLogin,
  isPasswordChange,
} = require("../middlewares/admin/adminAuth");

//page loading
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
} = require("../controllers/admin/pageLoad.controller");
const {
  loadOrderManagement,
  loadOneOrder,
  loadStockPage,
  loadReturnReq,
  loadCancelReq,
} = require("../controllers/admin/pageLoadTwo.controller");
//auth controller
const {
  verifyadmin,
  emailVerification,
  OTPVerification,
  PasswordChanging,
  resendOTP,
} = require("../controllers/admin/adminAuth.controller");

//user controller
const { blockOrUnblockUser } = require("../controllers/admin/user.controller");

//brand controller
const {
  addBrand,
  editBrand,
  softDeleteBrand,
} = require("../controllers/admin/brand.controller");

//category controller
const {
  addCategory,
  editCategory,
  softDeleteCategory,
} = require("../controllers/admin/category.controller");

//Type controller
const {
  addType,
  editType,
  softDeleteType,
} = require("../controllers/admin/type.controller");

//Product Controller
const {
  addCarProduct,
  editCarProduct,
  softDelete,
  addAccessoriesProduct,
  editAccessories,
} = require("../controllers/admin/product.controller");

//Order controller
const {
  updateOrderStatus,
  updateSingleItemStatus,
  returnApprove,
  returnReject,
  cancelApprove,
  cancelReject,
} = require("../controllers/admin/order.Controller");
//=========================================code section=======================================================

// Setup for admin layout for these routes only
route.use((req, res, next) => {
  res.locals.layout = "adminLayout";
  next();
});

// Admin Auth
route.get("/login", isLogin, adminLoadLoginPage);
route.post("/login", verifyadmin);
route.get("/logout", (req, res) => {
  //session destroying
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/admin/dashboard");
    }
    res.clearCookie("admin.sid");
    res.status(OK).redirect("/admin/login");
  });
});

//forgot-password setup
route.get("/verify-email-page", loadEmailVerify);
route.post("/verify-email", emailVerification);
route.get("/otp-verify-page", loadOTPVerify);
route.post("/otp-verify", OTPVerification);
route.get("/change-password-page", isPasswordChange, loadChangePassword);
route.post("/change-password", PasswordChanging);

//resend OTP
route.get("/resend-otp", resendOTP);

// Dashboard
route.get("/dashboard", checkSession, loadDashboard);

/// Brand Management
route.get("/brands-management", checkSession, loadBrands);
route.post(
  "/brands-management/add-brand",
  upload.single("image"),
  checkSession,
  addBrand
);
route.put(
  "/brands-management/edit-brand/:id",
  upload.single("image"),
  checkSession,
  editBrand
);
route.patch(
  "/brands-management/soft-delete-brand/:id",
  checkSession,
  softDeleteBrand
);

//Category Management
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

//Type Management
route.get("/types-management", checkSession, loadType);
route.post("/types-management/add-type", checkSession, addType);
route.put("/types-management/edit-type/:id", checkSession, editType);
route.patch(
  "/types-management/soft-delete-type/:id",
  checkSession,
  softDeleteType
);

//======================================PRODUCT MANAGEMENT===============================

//Product Management
route.get("/products-management", checkSession, loadProduct);
route.get("/products-management/add-car-product", checkSession, loadCarProduct);
route.post(
  "/products-management/add-car-product",
  upload.any(),
  checkSession,
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
  upload.any(),
  checkSession,
  editCarProduct
);

//soft delete car and accessories
route.patch(
  "/products-management/soft-delete-product/:id",
  checkSession,
  softDelete
);

//======================================ACCESSORY===============================

//load add accessories page
route.get(
  "/products-management/add-accessories-product",
  checkSession,
  loadAddAccessories
);
route.post(
  "/products-management/add-accessories-product",
  upload.any(),
  checkSession,
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
  upload.any(),
  checkSession,
  editAccessories
);

//=======================================ORDER MANAGEMENT==========================

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
//=======================================ORDER MANAGEMENT ( RETURN & CANCEL )==========================
route.get(
  "/orders-management/return-request-management",
  checkSession,
  loadReturnReq
);
route.post(
  "/orders-management/return-request-management/:returnId/approve",
  checkSession,
  returnApprove
);
route.post(
  "/orders-management/return-request-management/:returnId/reject",
  checkSession,
  returnReject
);
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

route.get("/stock-management", checkSession, loadStockPage);

route.get("/products-management/view-categories-product", (req, res) => {
  res.render("admin/products/accessories/view-accessories-product");
});
route.get("/sales-report", async (req, res) => {
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
  res.render("admin/salesReport", { layout: "adminLayout", sales });
});

route.get("/wallet", (req, res) => {
  res.render("admin/walletView");
});

route.get("/coupons-management", (req, res) => {
  res.render("admin/couponsManagement");
});

//=======================================USER MANAGEMENT==========================

//view all user
route.get("/users-management", checkSession, usersManagement);

//block user
route.patch("/users-management/block-unblock-user/:id", blockOrUnblockUser);

route.get("/users-management/user-details", (req, res) => {
  res.render("admin/userDetails");
});

route.get("/settings", (req, res) => {
  res.render("admin/settings");
});

module.exports = route;
