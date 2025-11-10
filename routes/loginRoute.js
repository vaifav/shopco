import { Router } from "express";
import { getLogin, logout, postLogin } from "../controllers/user/loginController.js";
import { getSignup, postSignup, signupWithGoogle } from "../controllers/user/signupContoller.js";
import { redirectIfAuthenticated } from "../middleware/loginMiddleware.js";
import passport from "passport";
import {
	getOtpPage,
	otpExpireTimer,
	resentOtpToEmail,
	sendOtp,
} from "../controllers/user/otpController.js";
import {
	getForgotPasswordPage,
	getUserEmailPage,
	sendToken,
	verifyToken,
} from "../controllers/user/forgotPasswordController.js";
import { changePassword, getChangePasswordPage } from "../controllers/user/personalInfoController.js";

const authenticate = Router();

authenticate
	.route("/login")
	.get(redirectIfAuthenticated, getLogin)
	.post(redirectIfAuthenticated, postLogin);

authenticate
	.route("/signup")
	.get(redirectIfAuthenticated, getSignup)
	.post(redirectIfAuthenticated, postSignup);

authenticate.route("/verifyotp").get(getOtpPage).post(sendOtp);
authenticate.route("/useremail").get(getUserEmailPage).post(sendToken);
authenticate.route("/forgotpassword").get(getForgotPasswordPage).post(verifyToken);
authenticate.route("/changepassword").get(getChangePasswordPage).post(changePassword);
authenticate.route("/changepassword/forgotpassword").post(sendToken);

authenticate.get(
	"/google/signup",
	passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
authenticate.get(
	"/auth/google/done",
	passport.authenticate("google", { failureRedirect: "/login", session: false }),
	signupWithGoogle
);

authenticate.get("/otpexpiredate", otpExpireTimer);

authenticate.get("/logout", logout);
authenticate.get("/admin/logout", logout);

authenticate.post("/resentotp", resentOtpToEmail);

export default authenticate;
