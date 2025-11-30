const Handlebars = require("handlebars");

module.exports = {
  inc: (value) => {
    return parseInt(value) + 1;
  },
  formatPrice: (price) => {
    if (!price) return "";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  formatDescription: (text) => {
    if (!text) return "";
    const formatted = text
      .split(/\n+/)
      .map(
        (p) =>
          `<p style="margin-bottom:12px; color:#555; line-height:1.7;">${p.trim()}</p>`
      )
      .join("");
    return new Handlebars.SafeString(formatted);
  },
  formattedDate: (date) => {
    const formatDate = new Date(date);
    return formatDate
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .replace(",", "");
  },
};
