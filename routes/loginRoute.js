import { Router } from "express";
import { getLogin, logout, postLogin } from "../controllers/user/loginController.js";
import { getSignup, postSignup, signupWithGoogle } from "../controllers/user/signupContoller.js";
import { redirectIfAuthenticated } from "../middleware/loginMiddleware.js";
import passport from "passport";
import { getOtpPage, sendOtp } from "../controllers/user/otpController.js";
import {
	getForgotPasswordPage,
	getUserEmailPage,
	sendToken,
	verifyToken,
} from "../controllers/user/forgotPasswordController.js";

const authenticate = Router();

authenticate
	.route("/login")
	.get(redirectIfAuthenticated, getLogin)
	.post(redirectIfAuthenticated, postLogin);
authenticate
	.route("/signup")
	.get(redirectIfAuthenticated, getSignup)
	.post(redirectIfAuthenticated, postSignup);

authenticate.get(
	"/google/signup",
	passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
authenticate.get(
	"/auth/google/done",
	passport.authenticate("google", { failureRedirect: "/login", session: false }),
	signupWithGoogle
);

authenticate.get("/logout", logout);
authenticate.get("/admin/logout", logout);

authenticate.get("/verifyotp", getOtpPage);
authenticate.post("/verifyotp", sendOtp);

authenticate.get("/useremail", getUserEmailPage);
authenticate.post("/useremail", sendToken);

authenticate.get("/forgotpassword", getForgotPasswordPage);
authenticate.post("/forgotpassword", verifyToken);
export default authenticate;
