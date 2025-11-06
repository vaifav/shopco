import { getAllData } from "../../services/homeService.js";

const home = async (req, res) => {
	try {
		const data = await getAllData();
		return res.render("user/home", data);
	} catch (error) {
		console.error("Error Home product page:", error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};

export default home;
