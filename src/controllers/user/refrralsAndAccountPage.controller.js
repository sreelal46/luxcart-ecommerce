const { OK, NOT_FOUND } = require("../../constant/statusCode");
const Order = require("../../models/user/OrderModel");
const Referral = require("../../models/user/referral.Model");
const User = require("../../models/user/UserModel");
const Wishlist = require("../../models/user/wishlistModel");

//load account page
const loadAccountPage = async (req, res, next) => {
  try {
    //finding user
    const userId = req.session.user._id;
    const user = await User.findById(userId).lean();
    res.status(OK).render("user/account/welcome", {
      layout: "userAccountLayout",
      user,
    });
  } catch (error) {
    console.log("Error from account wellcom page", error);
    next(error);
  }
};

const loadReferralsPage = async (req, res, next) => {
  try {
    const userId = req.session.user._id;

    const user = await User.findById(userId).lean();
    if (!user) return res.redirect("/login");

    const referrals = await Referral.find({ referrer: userId })
      .populate("referredUser", "name email createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const result = referrals
      .filter((ref) => ref.referredUser) // safety check
      .map((ref) => ({
        name: ref.referredUser.name,
        email: ref.referredUser.email,
        joinedAt: new Date(ref.referredUser.createdAt).toDateString(),
        status: ref.status,
        reward: ref.rewardGiven ? "Credited" : "Pending",
      }));

    return res.status(200).render("user/account/referrals", {
      layout: "userAccountLayout",
      referralCode: user.referralCode,
      result,
    });
  } catch (error) {
    console.error("Load referrals error:", error);
    next(error);
  }
};

module.exports = {
  loadAccountPage,
  loadReferralsPage,
};
