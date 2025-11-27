const Handlebars = require("handlebars");

module.exports = {
  // Existing equality helper
  eq: (a, b) => {
    return a?.toString() === b?.toString();
  },
  gt: function (a, b) {
    return a > b;
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
};
