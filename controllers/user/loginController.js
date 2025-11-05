import checkUser from "../../services/loginService.js";

const getLogin = async (req, res) => {
	return res.render("user/login", { error: null });
};

const postLogin = async (req, res) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const email = req.body.email ? String(req.body.email).trim() : "";
	const password = req.body.password ? String(req.body.password) : "";
	try {
		if (!email) {
			throw new Error("Email address is required.");
		} else if (!emailRegex.test(email)) {
			throw new Error("Please enter a valid email format (e.g., user@domain.com).");
		} else if (!password) {
			throw new Error("Password is required.");
		} else if (password.length <= 3) {
			throw new Error("Password must be greater than 3 characters.");
		}

		const user = await checkUser(req.body);
		if (!user) return res.render("user/login", { error: "Invalid Credentials" });
		if (user.otpPage) {
			req.session.user = {
				userId: user.user._id,
				email: user.user.email,
				role: user.user.role,
				username: user.user.username,
				isBlocked: user.user.isBlocked,
				isVerified: user.user.isVerified,
			};
			return res.redirect("/verifyotp");
		}
		
		req.session.user = {
			userId: user._id,
			email: user.email,
			role: user.role,
			username: user.username,
			isBlocked: user.isBlocked,
			isVerified: user.isVerified,
		};

		return res.redirect("/");
	} catch (error) {
		console.log(error);
		return res.render("user/login", { error: error.message });
	}
};

const logout = async (req, res) => {
	req.session.destroy((err) => {
		if (err) return res.redirect("/");
	});
	res.clearCookie("connect.sid");
	return res.redirect("/login");
};

export { getLogin, logout, postLogin };
