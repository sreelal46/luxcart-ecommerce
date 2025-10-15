const path = require("path");
const express = require("express");
const app = express();
const passport = require("passport");
const session = require("express-session");
const noCache = require("nocache");
const FileStore = require("session-file-store")(session);
const { engine } = require("express-handlebars");
const connectDB = require("./config/db");
const googleAuthRoutes = require("./routers/googleAuthRoutes");
const {
  errorHandling500,
  errorHandling404,
} = require("./middlewares/errors/errorHandling");
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

// Serve public folder
app.use(express.static(path.join(__dirname, "public")));

// Serve bootstrap-icons from node_modules
app.use(
  "/bootstrap-icons",
  express.static(
    path.join(__dirname, "../node_modules", "bootstrap-icons", "font")
  )
);

//Middileware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(noCache());

//session
app.use(
  session({
    name: "luxcart.sid", //cookie name
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    store: new FileStore(), //  for production use MongoStore or redis
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: false,
    },
  })
);

// Passport js middleware
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

//Google auth route
app.use("/auth", googleAuthRoutes);

// User route setup
app.use("/", userRoutes);

//Admin route setup
// app.use("/admin", adminRoutes);

//error handling middlewares
app.use(errorHandling404);
app.use(errorHandling500);

//conneting Database
connectDB();

//server
console.log("======================================");
app.listen(PORT, () => console.log(`Working on : http://localhost:${PORT}/`));
