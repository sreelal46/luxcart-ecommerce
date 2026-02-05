const Order = require("../../models/user/OrderModel");
const path = require("path");
const fs = require("fs");
const generateInvoice = require("../../services/invoiceGenerator");

const downloadInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId)
      .populate("items.carId items.variantId items.accessoryId")
      .populate("appliedCoupon.couponId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const fullAddress =
      `${order.address.street}, ${order.address.landmark}, ` +
      `${order.address.city}, ${order.address.district}, ` +
      `${order.address.state} - ${order.address.pincode}`;

    // Format items with status categorization
    const formattedItems = order.items.map((item) => {
      const isCancelled =
        item.fulfillmentStatus.status === "cancelled" &&
        item.cancel?.approvedAt;

      const isReturned =
        item.fulfillmentStatus.status === "returned" && item.return?.approvedAt;

      let status = "ACTIVE";
      let refundAmount = 0;

      if (isCancelled) {
        status = "CANCELLED";
        refundAmount = item.cancel.refundAmount || 0;
      } else if (isReturned) {
        status = "RETURNED";
        refundAmount = item.return.refundAmount || 0;
      }

      const description =
        item.accessoryId?.name ||
        (item.carId?.name && item.variantId?.color
          ? `${item.carId.name} (${item.variantId.color})`
          : item.productName);

      return {
        description,
        qty: item.quantity,
        price: item.price,
        offerPrice: item.offerPrice,
        tax: item.accessoryTax || 0,
        status,
        refundAmount,
        total: item.totalItemAmount,
      };
    });

    // Calculate refunded amounts
    const refundedAmount = order.items.reduce(
      (sum, item) =>
        sum + (item.cancel?.approvedAt ? item.cancel.refundAmount || 0 : 0),
      0,
    );

    const returnRefundAmount = order.items.reduce(
      (sum, item) =>
        sum + (item.return?.approvedAt ? item.return.refundAmount || 0 : 0),
      0,
    );

    const totalRefunds = refundedAmount + returnRefundAmount;

    // Payment tracking from new schema
    const totalAmount = order.totalAmount || 0;
    const paidAmount = order.paidAmount || 0;
    const remainingAmount = order.remainingAmount || 0;
    const advanceAmount = order.advanceAmount || 0; // Expected advance (for reference)

    // Prepare coupon details if applied
    let couponDetails = null;
    if (order.appliedCoupon && order.appliedCoupon.code) {
      couponDetails = {
        code: order.appliedCoupon.code,
        discountType: order.appliedCoupon.discountType,
        discountValue: order.appliedCoupon.discountValue,
        couponDiscount: order.appliedCoupon.couponDiscount || 0,
      };
    }

    // Payment transactions for detailed breakdown
    const paymentTransactions = order.paymentTransactions || [];

    const invoiceData = {
      orderId: order.orderId,
      createdAt: order.createdAt,
      customerName: order.address.name,
      customerAddress: fullAddress,

      items: formattedItems,

      // Detailed pricing breakdown
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      taxPercent: order.taxPercent,
      shippingCharges: order.shippingCharges || 0,

      // Coupon information
      couponDetails: couponDetails,
      discount: order.discount || 0,

      // Total amount
      totalAmount: totalAmount,

      // Payment tracking (NEW)
      advanceAmount: advanceAmount, // Expected advance (for reference)
      paidAmount: paidAmount, // Actual amount paid
      remainingAmount: remainingAmount, // Amount still owed
      paymentTransactions: paymentTransactions, // Transaction history

      // Refunds
      refundedAmount: refundedAmount,
      returnRefundAmount: returnRefundAmount,
      totalRefundAmount: totalRefunds,

      // Payment info
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentId: order.stripePaymentIntentId || order.paymentId,
      trackingId: order.trackingId,

      address: order.address,
    };

    const invoiceDir = path.join(__dirname, "../../public/invoices");
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    const filePath = path.join(invoiceDir, `invoice_${order.orderId}.pdf`);

    const options = {
      companyInfo: {
        name: "LUXCART India Pvt. Ltd.",
        address: "123 Business Park, MG Road",
        city: "Bangalore, Karnataka - 560001",
        gstin: "29XXXXXXXXXXXXX",
        phone: "+91-XXXX-XXXXXX",
        email: "support@luxcart.com",
      },
      terms: [
        "Payment is due within 30 days of invoice date.",
        "Please include invoice number on your payment.",
        "Refunds for cancelled items will be processed within 5–7 business days.",
        "Returns must be initiated within 7 days of delivery.",
        "Cars once sold are non-returnable and non-refundable.",
        "Late payments may incur additional charges.",
      ],
      highQuality: true,
      addWatermark: false,
    };

    await generateInvoice(invoiceData, filePath, options);

    setTimeout(() => {
      return res.download(filePath, `invoice_${order.orderId}.pdf`, (err) => {
        if (err) {
          console.error("Download error:", err);
          next(err);
        }
      });
    }, 1000);
  } catch (error) {
    console.error("Invoice generation error:", error);
    next(error);
  }
};

module.exports = { downloadInvoice };
