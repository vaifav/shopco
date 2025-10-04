import createUser from "../../services/signupService.js";

const getSignup = async (req, res) => {
	return res.status(200).render("user/signup", { error: null });
};

const postSignup = async (req, res) => {
	try {
		const user = await createUser(req.body);
		req.session.user = {
			userId: user._id,
			username: `${user.fname} ${user.lname}`,
			email: user.email,
			role: user.role,
		};
		return res.status(201).redirect("/");
	} catch (error) {
		console.log(error);
		return res.status(400).render("user/signup", { error: error.message });
	}
};

export { getSignup, postSignup };
