const path = require("path");
const express = require("express");
const app = express();
const passport = require("passport");
const session = require("express-session");
const connectDB = require("./config/db");
const googleAuthRoutes = require("./routers/googleAuthRoutes");
const { engine } = require("express-handlebars");
require("dotenv").config();

//route importing
const userRoutes = require("./routers/userRoutes");

//env export
const PORT = parseInt(process.env.PORT) || 8080;

//view engine setup
app.engine(
  "hbs",
  engine({
    extname: "hbs",
    defaultLayout: "index",
    layoutsDir: __dirname + "/views/layouts/",
    partialsDir: path.join(__dirname, "views", "partial"),
  })
);
app.set("view engine", "hbs");
app.set("views", __dirname + "/views");

//Middileware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Passport middleware
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

//auth route
app.use("/auth", googleAuthRoutes);

// User route setup
app.use("/", userRoutes);

//Admin route setup
// app.use("/admin", adminRoutes);

//conneting Database
connectDB();

//server
console.log("======================================");
app.listen(PORT, () => console.log(`Working on : http://localhost:${PORT}/`));
