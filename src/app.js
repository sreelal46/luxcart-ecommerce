require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const passport = require("passport");
const { userSession, adminSession } = require("./config/session");
const noCache = require("nocache");
require("./config/passport")(passport);
const googleAuthRoutes = require("./routers/googleAuth.routes");
const connectDB = require("./config/db");
const userRoutes = require("./routers/user.routes");
const adminRoutes = require("./routers/admin.routes");
const {
  errorHandling500,
  errorHandling404,
} = require("./middlewares/errors/errorHandling");

// PORT
const PORT = parseInt(process.env.PORT) || 8080;

// View Engine Setup
require("./config/hbsEngine")(app);
app.set("view cache", true);

// Static Folder
app.use(express.static(path.join(__dirname, "public")));

// Bootstrap Icons
app.use(
  "/bootstrap-icons",
  express.static(path.join(__dirname, "../node_modules/bootstrap-icons/font"))
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(noCache());

//for debuging
app.use((req, res, next) => {
  console.log("Request received:", req.method, req.url);
  next();
});

// SESSION SETUP
app.use("/admin", adminSession);
app.use("/", userSession);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Database Connect
connectDB();

// Make admin available in all views
app.use((req, res, next) => {
  res.locals.admin = req.session.admin || null;
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use("/auth", googleAuthRoutes);
app.use("/", userRoutes);
app.use("/admin", adminRoutes);

// Error Handling
app.use(errorHandling404);
app.use(errorHandling500);

//server connection
console.log("======================================");
app.listen(PORT, () => console.log(`Working on : http://localhost:${PORT}`));
