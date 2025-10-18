const express = require("express");
const route = express.Router();

const {
  checkSession,
  isLogin,
  isPasswordChange,
} = require("../middlewares/admin/adminAuth");
const {
  adminLoadLoginPage,
  loadDashboard,
  loadChangePassword,
  loadEmailVerify,
  loadOTPVerify,
} = require("../controllers/admin/pageLoad.controller");
const {
  verifyadmin,
  emailVerification,
  OTPVerification,
  PasswordChanging,
  resendOTP,
} = require("../controllers/admin/adminAuth.controller");

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

//Brand Management
route.get("/brands-management", (req, res) => {
  res.render("admin/brandManagement");
});

//Category Management
route.get("/categorys-management", (req, res) => {
  res.render("admin/categoryManagement");
});

//Type Management
route.get("/types-management", (req, res) => {
  res.render("admin/typeManagement");
});

//Product Management
route.get("/products-management", (req, res) => {
  res.render("admin/productManagement");
});

route.get("/products-management/add-car-product", (req, res) => {
  res.render("admin/add-car-product");
});

route.get("/products-management/view-car-product", (req, res) => {
  res.render("admin/view-car-product");
});

route.get("/products-management/view-categories-product", (req, res) => {
  res.render("admin/view-accessories-product");
});

route.get("/products-management/add-accessories-product", (req, res) => {
  res.render("admin/add-accessories-product");
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
  res.render("admin/ordersManagement");
});

route.get("/orders-management/return-request-management", (req, res) => {
  res.render("admin/returnRequestManagement");
});

route.get("/users-management", (req, res) => {
  res.render("admin/usersManagement");
});

module.exports = route;
