import { getAllData } from "../../services/homeService.js";

const home = async (req, res) => {
	const data = await getAllData();
	const username = req.session.user.username;
	data.username;
	return res.render("user/home", data);
};

export default home;
