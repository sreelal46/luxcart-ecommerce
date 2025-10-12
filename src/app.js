const express = require("express");
const app = express();
const { engine } = require("express-handlebars");
require("dotenv").config();

//env export
const PORT = process.env.PORT || 5000;

//view engine setup
app.engine(
  "hbs",
  engine({
    extname: "hbs",
    defaultLayout: "index",
    layoutsDir: __dirname + "/views/layouts/",
  })
);
app.set("view engine", "hbs");
app.set("views", __dirname + "/views");

//route setup

app.get("/", (req, res) => {
  res.render("user/login");
});

//server
console.log("======================================");
app.listen(PORT, () => console.log(`Working on : http://localhost:${PORT}/`));
