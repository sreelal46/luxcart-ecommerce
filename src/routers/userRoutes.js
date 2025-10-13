const express = require("express");
const route = express.Router();
const {
  loadLandingPage,
  loadLoginPage,
  loadSignUpPage,
  createUser,
} = require("../controllers/userController");

route.get("/", loadLandingPage);
//User login page loading and user verification
route.get("/login", loadLoginPage);

//load signup page
route.get("/signup", loadSignUpPage);
route.post("/signup", createUser);

module.exports = route;
