const fs = require("fs");
const path = require("path");

const helpers = {};

// Read all .js files inside helpers folder (except index.js)
fs.readdirSync(__dirname).forEach((file) => {
  if (file !== "index.js" && file.endsWith(".js")) {
    const helperModule = require(path.join(__dirname, file));
    Object.assign(helpers, helperModule);
  }
});

module.exports = helpers;
