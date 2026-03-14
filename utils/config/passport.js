const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../../model/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const tempUser = {
            isNewUser: true,
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
          };
          return done(null, tempUser);
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);
