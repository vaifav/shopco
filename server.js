import dotenv from "dotenv";
import express from "express";
import user from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import passport from "./config/passportGoogle.js";
import sessions from "./middleware/sessionMiddleware.js";
import authenticate from "./routes/loginRoute.js";
import admin from "./routes/adminRoute.js";
import { noCache } from "./middleware/loginMiddleware.js";
import { checkBlockStatus, requireAdminAuth } from "./middleware/authMiddleware.js";

dotenv.config();
const app = express();

await connectDB();

app.use(express.json());
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(sessions);

app.use(noCache);
app.use(passport.initialize());

app.use(authenticate); // login , signup
app.use(checkBlockStatus);
app.use("/admin", requireAdminAuth, admin);
app.use("/", user);

app.use("/pagenotfound", (req, res) => res.status(404).render("user/pagenotfound"));
app.use((req, res) => res.status(404).render("user/pagenotfound"));

app.use((err, req, res, next) => {
	console.error("Server Error:", err.stack);
	res.status(500).send({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
