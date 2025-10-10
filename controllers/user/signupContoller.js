import createUser from "../../services/signupService.js";

const getSignup = async (req, res) => {
	return res.status(200).render("user/signup", { error: null });
};

const postSignup = async (req, res) => {
	try {
		const user = await createUser(req.body);
		req.session.user = {
			userId: user._id,
			email: user.email,
			role: user.role,
		};
		return res.status(201).redirect("/");
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
	};

	return res.redirect("/account");
};

export { getSignup, postSignup, signupWithGoogle };
