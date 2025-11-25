require("dotenv").config();
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user/UserModel");

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;

          // Try to find user by Google ID first
          let user = await User.findOne({ googleId: profile.id });

          if (user) return done(null, user);

          // If not found, check email
          user = await User.findOne({ email });

          if (user) {
            if (user.authProvider === "local") {
              // Deny Google login if email is registered via password
              return done(null, false, {
                message:
                  "This email is registered using password. Please login manually.",
              });
            }

            //Link googleId if not already linked
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }

            return done(null, user);
          }

          // New Google user creation
          const newUser = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email,
            profileImage_url: profile.photos?.[0]?.value || null,
            authProvider: "google",
          });

          return done(null, newUser);
        } catch (err) {
          console.error("Passport Google Error:", err);
          done(err, null);
        }
      }
    )
  );

  // Serialize/Deserialize
  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).lean();
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
