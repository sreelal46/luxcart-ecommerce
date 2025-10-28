const path = require("path");
const { engine } = require("express-handlebars");
const helpers = require("./helpers/index"); // Import all helpers

module.exports = (app) => {
  app.engine(
    "hbs",
    engine({
      extname: "hbs",
      defaultLayout: "userLayout",
      layoutsDir: path.join(__dirname, "../views/layouts"),
      partialsDir: path.join(__dirname, "../views/partials"),
      runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
      },
      helpers: helpers, // All helpers loaded here
    })
  );

  app.set("view engine", "hbs");
  app.set("views", path.join(__dirname, "../views"));
};
