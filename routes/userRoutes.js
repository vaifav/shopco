import { Router } from "express";
import home from "../controllers/user/homeController.js";
import { getLogin, logout, postLogin } from "../controllers/user/loginController.js";
import { getSignup, postSignup } from "../controllers/user/signupContoller.js";
import { noCache, toHome, toLogin } from "../middleware/loginMiddleware.js";
const user = Router();

user.get("/", noCache, toLogin, home);
user.get("/login", noCache, toHome, getLogin);
user.post("/login", noCache, toHome, postLogin);
user.get("/logout", noCache, logout);
user.get("/signup", noCache, toHome, getSignup);
user.post("/signup", noCache, postSignup);

export default user;

// grouping of routes using prefix, mongoose hooks
