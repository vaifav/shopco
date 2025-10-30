import createUser from "../../services/signupService.js";

const getSignup = async (req, res) => {
	return res.status(200).render("user/signup", { error: null });
};

const postSignup = async (req, res) => {
	try {
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
