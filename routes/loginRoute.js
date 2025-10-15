import { Router } from "express";
import { getLogin, logout, postLogin } from "../controllers/user/loginController.js";
import { getSignup, postSignup, signupWithGoogle } from "../controllers/user/signupContoller.js";
import { noCache, toHome, toLogin } from "../middleware/loginMiddleware.js";
import passport from "passport";

const credential = Router();

credential.use(noCache);
credential.get("/logout", logout);
credential.get("/login", toHome, getLogin);
credential.post("/login", toHome, postLogin);
credential.get("/signup", toHome, getSignup);
credential.post("/signup", toHome, postSignup);

credential.get("/google/signup", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
credential.get("/auth/google/done", passport.authenticate("google", { failureRedirect: "/login", session: false }), signupWithGoogle);

export default credential;
