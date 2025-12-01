const Handlebars = require("handlebars");

module.exports = {
  // Existing equality helper
  eq: (a, b) => {
    return a?.toString() === b?.toString();
  },
  gt: function (a, b) {
    return a > b;
  },
  and: (a, b) => {
    return a && b;
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
};
