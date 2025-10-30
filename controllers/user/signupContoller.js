import createUser from "../../services/signupService.js";

const getSignup = async (req, res) => {
	return res.status(200).render("user/signup", { error: null });
};

const postSignup = async (req, res) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const email = req.body.email ? String(req.body.email).trim() : "";
	const password = req.body.password ? String(req.body.password) : "";
	const username = req.body.username ? String(req.body.username) : "";
	try {
		if (!email) {
			throw new Error("Email address is required.");
		} else if (!emailRegex.test(email)) {
			throw new Error("Please enter a valid email format (e.g., user@domain.com).");
		} else if (!password) {
			throw new Error("Password is required.");
		} else if (password.length <= 3) {
			throw new Error("Password must be greater than 3 characters.");
		} else if (!username) {
			throw new Error("Username is required.");
		} else if (username.length <= 3) {
			throw new Error("Username must be greater than 3 characters.");
		}
		
		const user = await createUser(req.body);
		req.session.user = {
			userId: user._id,
			username: user.username,
			email: user.email,
			role: user.role,
			isBlocked: user.isBlocked,
			isVerified: user.isVerified,
		};
		console.log(req.session.user);

		return res.status(201).redirect("/verifyotp");
	} catch (error) {
		console.log(error);
		return res.status(400).render("user/signup", { error: error.message });
	}
};

const signupWithGoogle = async (req, res) => {
	req.session.user = {
		userId: req.user._id,
		email: req.user.email,
		role: req.user.role,
		username: req.user.username,
		isBlocked: req.user.isBlocked,
		isVerified: req.user.isVerified,
	};

	return res.redirect("/");
};

export { getSignup, postSignup, signupWithGoogle };
