import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";

dotenv.config();

const appSession = session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		sameSite: "lax",
		maxAge: 1000 * 60 * 60,
	},
	store: MongoStore.create({
		mongoUrl: process.env.MONGODB_URL,
		dbName: "shopco",
		collectionName: "sessions",
		ttl: 60 * 60,
	}),
});

export default appSession;
