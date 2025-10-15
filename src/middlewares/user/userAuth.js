const {
  OK,
  CREATED,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  GONE,
  INTERNAL_SERVER_ERROR,
} = require("../../constant/statusCode");

const User = require("../../models/user/UserModel");

const checkSession = async (req, res, next) => {
  try {
    if (!req.session.user) return res.status(UNAUTHORIZED).redirect("/login");
    //finding user
    const user = await User.findById(req.session.user.id).lean();
    console.log(user);
    //if user not found
    if (!user) return res.status(UNAUTHORIZED).redirect("/login");

    //if user is blocked
    if (user.isBlocked) return res.status(FORBIDDEN).redirect("/login");

    //assigning user to request object
    req.user = user;
    next();
  } catch (error) {
    //if any error
    console.log("check session error:", error);
    next(error);
  }
};

const isLogin = async (req, res, next) => {
  try {
    //cheking session
    if (!req.session.user) return res.status(UNAUTHORIZED).redirect("/login");

    //finding user
    const user = await User.findById(req.session.user.id).lean();

    //if user not found
    if (!user) return res.status(UNAUTHORIZED).redirect("/login");

    //if user is blocked
    if (user.isBlocked) return res.status(FORBIDDEN).redirect("/login");

    //assigning user to request object
    req.user = user;
    next();
  } catch (error) {
    //if any error
    console.log("is login error:", error);
    next(error);
  }
};

module.exports = { checkSession, isLogin };
