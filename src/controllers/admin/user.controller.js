const { OK } = require("../../constant/statusCode");
const User = require("../../models/user/UserModel");

const blockOrUnblockUser = async (req, res, next) => {
  try {
    //collecting user data
    const userId = req.params.id;
    const user = await User.findById(userId);
    let status;

    //Updateing user
    if (user.isBlocked) {
      await User.findByIdAndUpdate(userId, {
        $set: { isBlocked: false },
      });
      status = "Unblock";
    } else {
      await User.findByIdAndUpdate(userId, {
        $set: { isBlocked: true },
      });
      status = "Block";
    }

    await res.status(OK).json({ success: true, status });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { blockOrUnblockUser };
