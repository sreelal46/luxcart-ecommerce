const Handlebars = require("handlebars");

module.exports = {
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
};
