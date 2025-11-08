const session = require("express-session");
const MongoStore = require("connect-mongo");

const userSession = session({
  name: "user.sid",
  secret: process.env.USER_SESSION_SECRET || "dev-user-secret-change-me",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "userSessions",
    ttl: 7 * 24 * 60 * 60, // 7 days
  }),
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});

const adminSession = session({
  name: "admin.sid",
  secret: process.env.ADMIN_SESSION_SECRET || "dev-admin-secret-change-me",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "adminSessions",
    ttl: 24 * 60 * 60, // 1 day
  }),
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
});

module.exports = {
  userSession,
  adminSession,
};
