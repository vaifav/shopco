import passport from "passport";
import { Strategy as Google } from "passport-google-oauth20";
import userModel from "../models/signupModel.js";

passport.use(
	new Google(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL,
		},
		async function (accessToken, refreshToken, profile, done) {
			try {
				let user = await userModel.findOne({ googleId: profile.id });
				if (!user) {
					user = await userModel.create({
						googleId: profile.id,
						email: profile.emails[0].value,
					});
				}
				return done(null, user);
			} catch (error) {
				return done(error, null);
			}
		}
	)
);

export default passport;
