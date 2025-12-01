const { OK } = require("../../constant/statusCode");
const Order = require("../../models/user/OrderModel");

const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    const newStatus = req.body.status;
    if (!order)
      return res
        .status(OK)
        .json({ success: false, alert: "Order not found..please try again" });

    await Order.findByIdAndUpdate(
      { _id: orderId },
      { $set: { orderStatus: newStatus } }
    );

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from update order status", error);
    next(error);
  }
};

module.exports = { updateOrderStatus };
