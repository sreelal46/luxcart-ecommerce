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
};
