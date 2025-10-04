const home = async (req, res) => {
	const username = req.session.user.username;
	return res.render("user/home", { username });
};

export default home;
