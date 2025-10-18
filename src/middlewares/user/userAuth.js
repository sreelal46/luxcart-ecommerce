const User = require("../../models/user/UserModel");
const { OK, UNAUTHORIZED, FORBIDDEN } = require("../../constant/statusCode");

const checkSession = async (req, res, next) => {
  try {
    if (!req.session.user) {
      //No session — redirect to login
      console.log("From user checkSession", req.session.user);
      return res.status(UNAUTHORIZED).redirect("/login");
    }
    const userId = req.session.user._id;
    const user = await User.findById(userId).lean();

    if (!user) {
      req.session.destroy(() => res.redirect("/login"));
      return;
    }

    // req.user = user;
    // console.log("From checkSession:", req.user);
    next();
  } catch (error) {
    next(error);
  }
};

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      const userId = req.session.user._id; // 🆕 unified id key
      const user = await User.findById(userId).lean();

      //if user not found
      if (!user) {
        req.session.destroy(() => res.redirect("/login"));
        return;
      }

      //if user found
      if (user) {
        req.user = user;
        console.log("From isLogin:", req.user);
        return res.redirect("/homepage");
      }
    }
    next();
  } catch (error) {
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
