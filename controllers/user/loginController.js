const getLogin = async (req, res) => {
	return res.render("user/login", { error: null });
};

export {getLogin}