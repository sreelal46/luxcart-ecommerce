const express = require("express");
const passport = require("passport");
const router = express.Router();

// Step Google login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// Step Google callback (custom callback used here)
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      console.error("Google Auth Error:", err);
      return res.render("user/login", { alert: "Something went wrong!" });
    }

    // if (!user) {
    //   // info.message comes from done(null, false, { message: "..." })
    //   return res.json({
    //     success: false,
    //     alert: info?.message || "Login failed. Please try again.",
    //   });
    // }
    if (!user) {
      const message = encodeURIComponent(
        info?.message || "Login failed. Please try again."
      );
      return res.redirect(`/login?alert=${message}`);
    }

    // Success create session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      image_url: user.image_url,
      authProvider: user.authProvider,
    };

    req.session.save(() => {
      console.log("Google user session created:", req.session.user);
      res.redirect("/homepage");
    });
  })(req, res, next);
});

// Step Logout
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
