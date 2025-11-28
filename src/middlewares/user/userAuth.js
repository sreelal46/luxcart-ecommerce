const User = require("../../models/user/UserModel");
const { OK, UNAUTHORIZED, FORBIDDEN } = require("../../constant/statusCode");

const checkSession = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(UNAUTHORIZED).redirect("/login");
    }
    const userId = req.session.user._id;
    const user = await User.findById(userId).lean();

    //checking user existing
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
