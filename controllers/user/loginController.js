import checkUser from "../../services/loginService.js";

const getLogin = async (req, res) => {
	return res.render("user/login", { error: null });
};

const postLogin = async (req, res) => {
	try {
		const user = await checkUser(req.body);
		if (!user) return res.render("user/login", { error: "Invalid Credentials" });
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
