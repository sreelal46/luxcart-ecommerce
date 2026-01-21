const Handlebars = require("handlebars");
const maximumAmount = parseInt(process.env.MAXIMUM_PAYMENT_AMOUNT) || 0;
let row = 0;

module.exports = {
  // Existing equality helper
  eq: (a, b) => {
    return a?.toString() === b?.toString();
  },

  amountCheck: (amount) => {
    return maximumAmount > amount;
  },

  gt: function (a, b) {
    return a > b;
  },

  gte: function (a, b) {
    return a >= b;
  },

  lt: function (a, b) {
    return a < b;
  },

  lte: function (a, b) {
    return a <= b;
  },

  and: (a, b) => {
    return a && b;
  },

  or: () => {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  },

  length: function (arr) {
    if (Array.isArray(arr)) return arr.length;
    return 0;
  },

  json: (context) => JSON.stringify(context),

  // New conditional helper (for <, >, ==, etc.)
  ifCond: (v1, operator, v2, options) => {
    switch (operator) {
      case "<":
        return v1 < v2 ? options.fn(this) : options.inverse(this);
      case "<=":
        return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case ">":
        return v1 > v2 ? options.fn(this) : options.inverse(this);
      case ">=":
        return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case "==":
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      case "===":
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case "!=":
        return v1 != v2 ? options.fn(this) : options.inverse(this);
      case "!==":
        return v1 !== v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  },

  getFirstVariantId: (car) => {
    return car.variantIds[0]._id;
  },

  includes: (arr, value) => {
    if (!arr) return false;
    return arr.includes(String(value));
  },

  getId: (obj) => {
    try {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      if (obj._id) return obj._id.toString();
      return "";
    } catch (err) {
      return "";
    }
  },

  ifEquals: (a, b, options) => {
    return a === b ? options.fn(this) : options.inverse(this);
  },

  stockStatus: (stock) => {
    if (stock === 0)
      return `<span class="badge bg-danger px-3 py-2">Out of Stock</span>`;
    if (stock < 10)
      return `<span class="badge bg-warning px-3 py-2">Low Stock</span>`;
    return `<span class="badge bg-success px-3 py-2">In Stock</span>`;
  },

  getMainStock: (product) => {
    if (product.variantIds && product.variantIds.length > 0) {
      return product.variantIds[0].stock; // main variant stock
    }
    return product.stock; // accessory or non-variant product
  },

  eqTwo: (a, b) => {
    return a === b;
  },

  rowNumber: () => {
    return ++row;
  },

  statusBadge: (status) => {
    switch (status) {
      case "requested":
        return "bg-warning text-dark";
      case "approved":
        return "bg-success";
      case "rejected":
        return "bg-danger";
      case "refunded":
        return "bg-primary";
      default:
        return "bg-secondary";
    }
  },

  orderStatusBadge: (status) => {
    const base = "badge-status";

    const map = {
      placed: "badge-placed",
      confirmed: "badge-confirmed",
      shipped: "badge-shipped",
      out_for_delivery: "badge-out-for-delivery",
      delivered: "badge-delivered",
      cancelled: "badge-cancelled",
      returned: "badge-returned",
    };

    return `${base} ${map[status] || ""}`;
  },

  canCancel: (status) => ["placed", "confirmed", "shipped"].includes(status),

  // ==========================================
  // PAYMENT HELPERS - NEW
  // ==========================================

  // Format currency in Indian Rupees
  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return "₹0.00";
    const num = parseFloat(amount);
    if (isNaN(num)) return "₹0.00";
    return (
      "₹" +
      num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  },

  // Check if order is fully paid
  isFullyPaid: (order) => {
    if (!order) return false;
    return (
      order.paymentStatus === "Paid" ||
      order.paidAmount >= order.totalAmount ||
      (order.remainingAmount !== undefined && order.remainingAmount <= 0)
    );
  },

  // Check if order is partially paid
  isPartiallyPaid: (order) => {
    if (!order) return false;
    return (
      order.paymentStatus === "Partially Paid" ||
      (order.paidAmount > 0 && order.paidAmount < order.totalAmount)
    );
  },

  // Check if order is pending payment
  isPendingPayment: (order) => {
    if (!order) return false;
    return (
      order.paymentStatus === "Pending" ||
      !order.paidAmount ||
      order.paidAmount <= 0
    );
  },

  // Calculate payment percentage
  paymentPercentage: (paidAmount, totalAmount) => {
    if (!totalAmount || totalAmount <= 0) return 0;
    const percentage = (paidAmount / totalAmount) * 100;
    return Math.round(percentage);
  },

  // Payment status badge with color
  paymentStatusBadge: (status) => {
    const statusMap = {
      Paid: "bg-success",
      "Partially Paid": "bg-warning text-dark",
      Pending: "bg-danger",
      Failed: "bg-dark",
      Refunded: "bg-info",
    };
    return statusMap[status] || "bg-secondary";
  },

  // Payment status icon
  paymentStatusIcon: (status) => {
    const iconMap = {
      Paid: "bi-check-circle-fill",
      "Partially Paid": "bi-clock-history",
      Pending: "bi-exclamation-triangle-fill",
      Failed: "bi-x-circle-fill",
      Refunded: "bi-arrow-counterclockwise",
    };
    return iconMap[status] || "bi-question-circle";
  },

  // Format date for display
  formatDate: (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Format date short (without time)
  formatDateShort: (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  },

  // Check if payment button should be shown
  shouldShowPaymentButton: (order) => {
    if (!order) return false;
    // Show button if: not fully paid AND has remaining amount
    return order.paymentStatus !== "Paid" && order.remainingAmount > 0;
  },

  // Get payment button text
  paymentButtonText: (order) => {
    if (!order) return "Pay Now";
    if (order.paidAmount > 0) {
      return `Pay Remaining ₹${order.remainingAmount.toLocaleString("en-IN")}`;
    }
    return `Pay Now ₹${order.totalAmount.toLocaleString("en-IN")}`;
  },

  // Payment type badge (for transactions)
  paymentTypeBadge: (type) => {
    const typeMap = {
      advance: { class: "bg-info", icon: "bi-cash-coin", text: "Advance" },
      remaining: { class: "bg-warning", icon: "bi-wallet2", text: "Remaining" },
      full: {
        class: "bg-success",
        icon: "bi-credit-card",
        text: "Full Payment",
      },
    };
    return (
      typeMap[type] || {
        class: "bg-secondary",
        icon: "bi-cash",
        text: "Payment",
      }
    );
  },

  // Check if amount is valid and positive
  isValidAmount: (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  },

  // Calculate final amount to pay (with refunds)
  calculateFinalAmount: (totalAmount, paidAmount, refunds) => {
    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    const refunded = parseFloat(refunds) || 0;
    return Math.max(0, total - paid + refunded);
  },

  // Payment method icon
  paymentMethodIcon: (method) => {
    const methodMap = {
      STRIPE: "bi-credit-card",
      COD: "bi-cash-coin",
      CARD: "bi-credit-card-2-front",
      NETBANKING: "bi-bank",
    };
    return methodMap[method] || "bi-wallet2";
  },

  // Check if payment method is online
  isOnlinePayment: (method) => {
    return ["STRIPE", "CARD", "NETBANKING"].includes(method);
  },

  // Get transaction status badge
  transactionStatusBadge: (status) => {
    const statusMap = {
      succeeded: "bg-success",
      pending: "bg-warning text-dark",
      failed: "bg-danger",
      refunded: "bg-info",
    };
    return statusMap[status] || "bg-secondary";
  },

  // Subtract numbers (useful for calculations in templates)
  subtract: (a, b) => {
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    return numA - numB;
  },

  // Add numbers
  add: (a, b) => {
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    return numA + numB;
  },

  // Multiply numbers
  multiply: (a, b) => {
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    return numA * numB;
  },

  // Divide numbers
  divide: (a, b) => {
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 1; // Avoid division by zero
    return numA / numB;
  },
  range: (from, to) => {
    let result = [];
    for (let i = from; i <= to; i++) result.push(i);
    return result;
  },
};
