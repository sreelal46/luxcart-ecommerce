const express = require("express");
const passport = require("passport");
const router = express.Router();

// Google login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    console.log(" Google Auth Success:", req.user);

    // storing session
    req.session.user = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      image_url: req.user.image_url,
      authProvider: req.user.authProvider,
    };

    return res.redirect("/homepage");
  }
);

//logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("luxcart.sid");
      return res.redirect("/");
    });
  });
});

module.exports = router;
