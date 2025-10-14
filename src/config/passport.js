const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user/UserModel");

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;

          // First, try to find the user by Google ID
          let user = await User.findOne({ googleId: profile.id });

          // If user exists with Google ID, return it
          if (user) return done(null, user);

          // If user doesn't exist by Google ID, check if the email exists in the DB
          user = await User.findOne({ email });

          if (user) {
            if (user.authProvider === "google") {
              // If somehow Google user exists without googleId, update it
              if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
              }
              return done(null, user);
            }

            if (user.authProvider === "local") {
              // Email is registered locally, deny Google login
              return done(null, false, {
                message:
                  "This email is already registered with password. Please login using email & password.",
              });
            }
          }

          // If user does not exist, create a new one
          const newUser = {
            googleId: profile.id,
            name: profile.displayName,
            email,
            image_url: profile.photos[0].value,
            authProvider: "google",
          };

          user = await User.create(newUser);
          done(null, user);
        } catch (err) {
          console.error(err);
          done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
