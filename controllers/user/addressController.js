import { createAddress, updateAddress, deleteAddress } from "../../services/addressService.js";
import { City, Country, State } from "country-state-city";
import { getAddress, getSingleAddress } from "../../services/addressService.js";
import { getPersonalInfo } from "../../services/personalInfoService.js";

const getAddressPage = async (req, res) => {
	const countries = Country.getAllCountries();
	const state = State.getAllStates();
	const city = City.getAllCities();

	try {
		const userId = req.session.user.userId;
		const address = await getAddress(userId);
		const personalInfo = await getPersonalInfo(userId);

		let singleAddress = null;
		if (req.params.id) {
			singleAddress = await getSingleAddress(req.params.id, userId);
		}

		return res.render("user/address", {
			username: "",
			countries,
			state,
			city,
			address,
			singleAddress,
			personalInfo: {
				avatar: personalInfo?.personalInfo?.avatar,
				fname: personalInfo?.personalInfo?.fname,
			},
			email: personalInfo.email,
		});
	} catch (error) {
		console.error("Error rendering account page:", error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const addAddress = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const data = { ...req.body, userId };

		const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
		const pinCode = req.body.pin;
		if (!pinCode || typeof pinCode !== "string") {
			return res.status(400).json({
				success: false,
				message: "Pincode is required and must be a string.",
			});
		}
		if (!PINCODE_REGEX.test(pinCode)) {
			return res.status(400).json({
				success: false,
				message: "Invalid pincode format. Pincode must be 6 digits and cannot start with 0.",
			});
		}

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

		const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
		const pinCode = req.body.pin;
		if (!pinCode || typeof pinCode !== "string") {
			return res.status(400).json({
				success: false,
				message: "Pincode is required and must be a string.",
			});
		}
		if (!PINCODE_REGEX.test(pinCode)) {
			return res.status(400).json({
				success: false,
				message: "Invalid pincode format. Pincode must be 6 digits and cannot start with 0.",
			});
		}

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

export { getAddressPage, addAddress, editAddress, removeAddress };
