const User = require("../../models/user/UserModel");
const { OK, UNAUTHORIZED, FORBIDDEN } = require("../../constant/statusCode");

const checkSession = async (req, res, next) => {
  try {
    const isApiRequest =
      req.xhr || req.headers.accept?.includes("application/json");

    if (!req.session.user) {
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          alert: "Please login to continue",
          redirect: "/login",
        });
      }
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.user._id).lean();

    if (!user || user.isBlocked) {
      req.session.destroy(() => {});
      res.clearCookie("user.sid");

      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          alert: "Session expired. Please login again",
          redirect: "/login",
        });
      }
      return res.redirect("/login");
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage_url: user.profileImage_url,
      authProvider: user.authProvider,
    };

    req.user = user;
    next();
  } catch (error) {
    console.log("Error from user check session", error);
    next(error);
  }
};

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      const userId = req.session.user._id; //
      const user = await User.findById(userId).lean();

      //if user not found
      if (!user) {
        return req.session.destroy((err) => {
          if (err) {
            return console.error("Error destroying session:", err);
          }
          res.clearCookie("user.sid");
          res.status(OK).redirect("/login");
        });
      }

      //cheking user is blocked
      if (user.isBlocked) {
        return req.session.destroy((err) => {
          if (err) {
            return console.error("Error destroying session:", err);
          }
          res.clearCookie("user.sid");
          res.status(OK).redirect("/login");
        });
      }

      //if user found
      if (user) {
        req.user = user;
        return res.redirect("/homepage");
      }
    }
    next();
  } catch (error) {
    console.log("Error from user isLogin", error);
    next(error);
  }
};

const isPasswordChange = (req, res, next) => {
  if (req.session.userPasswordChanged) {
    return res.status(FORBIDDEN).redirect("/login");
  }
  next();
};

module.exports = { checkSession, isLogin, isPasswordChange };
