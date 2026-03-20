import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import User, { IUser } from '../models/User';

type DoneCallback = (error: Error | null, user?: IUser | false) => void;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: DoneCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('No email provided by Google'));
          }

          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
              user.googleId = profile.id;
              if (!user.photoUrl && profile.photos?.[0]?.value) {
                user.photoUrl = profile.photos[0].value;
              }
              await user.save();
            } else {
              user = new User({
                email: email.toLowerCase(),
                googleId: profile.id,
                displayName: profile.displayName || 'User',
                photoUrl: profile.photos?.[0]?.value,
              });
              await user.save();
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name', 'photos'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: FacebookProfile,
        done: DoneCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('No email provided by Facebook'));
          }

          let user = await User.findOne({ facebookId: profile.id });

          if (!user) {
            user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
              user.facebookId = profile.id;
              if (!user.photoUrl && profile.photos?.[0]?.value) {
                user.photoUrl = profile.photos[0].value;
              }
              await user.save();
            } else {
              const name = profile.name
                ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim()
                : 'User';
              user = new User({
                email: email.toLowerCase(),
                facebookId: profile.id,
                displayName: name,
                photoUrl: profile.photos?.[0]?.value,
              });
              await user.save();
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, (user as IUser)._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
