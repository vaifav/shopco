import { City, Country, State } from "country-state-city";
import { getAddress, getSingleAddress} from "../../services/addressService.js";
import { getPersonalInfo } from "../../services/personalInfoService.js";

const countries = Country.getAllCountries();
const state = State.getAllStates();
const city = City.getAllCities();

const account = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const address = await getAddress(userId);
		const personalInfo = await getPersonalInfo(userId)

		let singleAddress = null;
		if (req.params.id) {
			singleAddress = await getSingleAddress(req.params.id, userId);
		}

		return res.render("user/account", { username: "", email: req.session.user.email, countries, state, city, address, singleAddress , personalInfo});
	} catch (error) {
		console.error("Error rendering account page:", error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};

export { account };
