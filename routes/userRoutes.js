import { Router } from "express";
import home from "../controllers/user/homeController.js";
import { getLogin, logout, postLogin } from "../controllers/user/loginController.js";
import { getSignup, postSignup, signupWithGoogle } from "../controllers/user/signupContoller.js";
import { noCache, toHome, toLogin } from "../middleware/loginMiddleware.js";
import passport from "passport";
import { account } from "../controllers/user/accountContoller.js";
import { addAddress, editAddress, removeAddress } from "../controllers/user/addressController.js";
import { addPersonalInfo, editPersonlInfo } from "../controllers/user/personalInfoController.js";
const user = Router();

user.use(noCache);
user.get("/", toLogin, home);
user.get("/logout", logout);
user.get("/login", toHome, getLogin);
user.post("/login", toHome, postLogin);
user.get("/signup", toHome, getSignup);
user.post("/signup", postSignup);
user.get("/account", toLogin, account);

user.get("/google/signup", noCache, passport.authenticate("google", { scope: ["profile", "email"], session: false }));
user.get("/auth/google/done", passport.authenticate("google", { failureRedirect: "/login", session: false }), signupWithGoogle);

user.post("/account/manageaddress/add/", addAddress);
user.patch("/account/manageaddress/edit/:id", editAddress);
user.delete("/account/manageaddress/delete/:id", removeAddress);

user.post("/account/personalinfo/add", addPersonalInfo);
user.patch("/account/personalinfo/edit", editPersonlInfo);

export default user;

// grouping of routes using prefix, mongoose hooks
