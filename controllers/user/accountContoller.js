import { City, Country, State } from "country-state-city";
import { getAddress, getSingleAddress, createAddress, updateAddress, deleteAddress } from "../../services/addressService.js";

const countries = Country.getAllCountries();
const state = State.getAllStates();
const city = City.getAllCities();

const account = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const address = await getAddress(userId);

		let singleAddress = null;
		if (req.params.id) {
			singleAddress = await getSingleAddress(req.params.id, userId);
		}

		return res.render("user/account", { username: "", countries, state, city, address, singleAddress });
	} catch (error) {
		console.error("Error rendering account page:", error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const addAddress = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const data = { ...req.body, userId };

		const newAddress = await createAddress(data);
		return res.status(201).json({
			success: true,
			message: "Address Created SucccessFully",
		});
	} catch (error) {
		console.error("Error adding address:", error.message);
		return res.status(500).json({
			success: false,
			message: `${error.message}`,
		});
	}
};

const editAddress = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const updateData = req.body;

		const updatedAddress = await updateAddress(req.params.id, userId, updateData);

		if (!updatedAddress) {
			return res.status(404).json({
				success: false,
				message: `Address Not Found`,
			});
		}

		return res.status(201).json({
			success: true,
			message: "Address Updatded SucccessFully",
		});
	} catch (error) {
		console.error("Error editing address:", error.message);
		return res.status(500).json({
			success: false,
			message: `${error.message}`,
		});
	}
};

const removeAddress = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const deletedAddress = await deleteAddress(req.params.id, userId);

		if (!deletedAddress) {
			return res.status(404).json({
				success: false,
				message: `Address Not Found`,
			});
		}

		return res.status(200).json({
			success: true,
			message: "Address deleted successfully",
		});
	} catch (error) {
		console.error("Error editing address:", error.message);
		return res.status(500).json({
			success: false,
			message: `${error.message}`,
		});
	}
};

export { account, addAddress, editAddress, removeAddress };
