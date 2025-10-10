import dotenv from "dotenv";
import express from "express";
import user from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import passport from "./config/passportGoogle.js";
import sessions from "./middleware/sessionMiddleware.js";

dotenv.config();
const app = express();

await connectDB();

app.use(express.json());
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(sessions);

app.use(passport.initialize());

app.use("/", user);
app.get("/pagenotfound/", (req, res) => res.render("user/pagenotfound"));

app.listen(process.env.PORT);
