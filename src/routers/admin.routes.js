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
  loadEditCar,
} = require("../controllers/admin/pageLoad.controller");

//auth controller
const {
  verifyadmin,
  emailVerification,
  OTPVerification,
  PasswordChanging,
  resendOTP,
} = require("../controllers/admin/adminAuth.controller");

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
  // editCarProduct,
} = require("../controllers/admin/product.controller");

//=========================================code section=======================================================

// Setup for admin layout for these routes only
route.use((req, res, next) => {
  res.locals.layout = "adminLayout";
  next();
});

// loading login page
route.get("/login", isLogin, adminLoadLoginPage);

// login POST
route.post("/login", verifyadmin);

//logout
route.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

//forgot-password setup
route.get("/verify-email-page", loadEmailVerify);
route.post("/verify-email", emailVerification);
route.get("/otp-verify-page", isPasswordChange, loadOTPVerify);
route.post("/otp-verify", OTPVerification);
route.get("/change-password-page", isPasswordChange, loadChangePassword);
route.post("/change-password", PasswordChanging);

//resend OTP
route.get("/resend-otp", resendOTP);

// Dashboard
route.get("/dashboard", checkSession, loadDashboard);

/// Brand Management
route.get("/brands-management", loadBrands);

// Add Brand
route.post("/brands-management/add-brand", upload.single("image"), addBrand);

//Edit Brands
route.put(
  "/brands-management/edit-brand/:id",
  upload.single("image"),
  editBrand
);
//soft delete
route.patch("/brands-management/soft-delete-brand/:id", softDeleteBrand);

//Category Management
route.get("/categorys-management", loadCategory);

//add category
route.post("/categorys-management/add-category", addCategory);

//edit category
route.put("/categorys-management/edit-category/:id", editCategory);

//soft delete cetegory
route.patch(
  "/categorys-management/soft-delete-category/:id",
  softDeleteCategory
);

//Type Management
route.get("/types-management", loadType);

//Type adding
route.post("/types-management/add-type", addType);

//type editing
route.put("/types-management/edit-type/:id", editType);

//Type soft delete
route.patch("/types-management/soft-delete-type/:id", softDeleteType);

//Product Management
route.get("/products-management", loadProduct);

//add Car product page
route.get("/products-management/add-car-product", loadCarProduct);

//add Car product page
route.post("/products-management/add-car-product", upload.any(), addCarProduct);

//Single car product
route.get("/products-management/view-car-product/:id", loadEditCar);
// route.put(
//   "/products-management/edit-car-product",
//   upload.any(),
//   editCarProduct
// );

// route.get("/products-management/view-car-product", (req, res) => {
//   res.render("admin/products/car/view-car-product");
// });

route.get("/products-management/view-categories-product", (req, res) => {
  res.render("admin/products/accessories/view-accessories-product");
});

route.get("/products-management/add-accessories-product", (req, res) => {
  res.render("admin/products/accessories/add-accessories-product");
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

route.get("/orders-management", (req, res) => {
  res.render("admin/orders/ordersManagement");
});

route.get("/orders-management/view-order", (req, res) => {
  res.render("admin/orders/orderDetails");
});

route.get("/orders-management/return-request-management", (req, res) => {
  res.render("admin/returnRequestManagement");
});

route.get("/users-management", (req, res) => {
  res.render("admin/usersManagement");
});

route.get("/users-management/user-details", (req, res) => {
  res.render("admin/userDetails");
});

route.get("/settings", (req, res) => {
  res.render("admin/settings");
});

module.exports = route;
