import { createAddress, updateAddress, deleteAddress } from "../../services/addressService.js";

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

export { addAddress, editAddress, removeAddress };
