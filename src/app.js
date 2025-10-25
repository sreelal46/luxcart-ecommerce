const path = require("path");
const express = require("express");
const app = express();
const passport = require("passport");
const session = require("express-session");
const noCache = require("nocache");
const FileStore = require("session-file-store")(session);
const { engine } = require("express-handlebars");
require("dotenv").config();

const connectDB = require("./config/db");
require("./config/passport")(passport);
const googleAuthRoutes = require("./routers/googleAuth.routes");
const userRoutes = require("./routers/user.routes");
const adminRoutes = require("./routers/admin.routes");
const {
  errorHandling500,
  errorHandling404,
} = require("./middlewares/errors/errorHandling");

// PORT
const PORT = parseInt(process.env.PORT) || 8080;

// View Engine Setup
app.engine(
  "hbs",
  engine({
    extname: "hbs",
    defaultLayout: "userLayout",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials"),
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
    helpers: {
      eq: function (a, b) {
        return a.toString() === b.toString();
      },
      firstImage: function (variantIds) {
        if (variantIds && variantIds.length > 0) {
          const firstVariant = variantIds[0];
          if (firstVariant.image_url && firstVariant.image_url.length > 0) {
            return firstVariant.image_url[0];
          }
        }
        // Fallback image path - ensure this exists in your public folder
        return "/images/default-car.jpg";
      },
    },
  })
);

app.set("view engine", "hbs");
app.set("view cache", true);
app.set("views", path.join(__dirname, "views"));

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
app.use(
  session({
    name: "luxcart.sid",
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    store: new FileStore({
      path: path.join(__dirname, "../sessions"),
      retries: 1,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: false,
      sameSite: "lax", //for Axios session work properly
    },
  })
);

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
app.listen(PORT, () =>
  console.log(`Working on : http://localhost:${PORT}/admin/login`)
);
