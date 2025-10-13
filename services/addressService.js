import addressModel from "../models/addressModel.js";

const getAddress = async (userId) => {
	try {
		if (!userId) throw new Error("User ID is required");
		const addresses = await addressModel.find({ userId });
		return addresses;
	} catch (error) {
		console.error("Error fetching addresses:", error.message);
		throw new Error(error.message);
	}
};

const getSingleAddress = async (id, userId) => {
	try {
		if (!id || !userId) throw new Error("Address ID and User ID are required");
		const address = await addressModel.findOne({ _id: id, userId });
		if (!address) throw new Error("Address not found");
		return address;
	} catch (error) {
		console.error("Error fetching single address:", error.message);
		throw new Error(error.message);
	}
};

const createAddress = async (data) => {
	try {
		const requiredFields = ["userId", "fullName", "phone", "country", "state", "city", "street", "houseName", "pin"];

		for (const field of requiredFields) {
			if (!data[field]) throw new Error(`Field "${field}" is required`);
		}

		const address = await addressModel.create(data);
		return address;
	} catch (error) {
		console.error("Error creating address:", error.message);
		throw new Error(error.message);
	}
};

const updateAddress = async (id, userId, updateObj) => {
	try {
		if (!id || !userId) throw new Error("Address ID and User ID are required");
		const address = await addressModel.findOneAndUpdate({ _id: id, userId }, { $set: updateObj }, { new: true, runValidators: true });
		if (!address) throw new Error("Address not found or unauthorized");
		return address;
	} catch (error) {
		console.error("Error updating address:", error);
		throw new Error(error.message);
	}
};

const deleteAddress = async (id, userId) => {
	try {
		if (!id || !userId) throw new Error("Address ID and User ID are required");
		const deleted = await addressModel.findOneAndDelete({ _id: id, userId });
		if (!deleted) throw new Error("Address not found or unauthorized");
		return deleted;
	} catch (error) {
		console.error("Error deleting address:", error.message);
		throw new Error(error.message);
	}
};

export { getAddress, getSingleAddress, createAddress, updateAddress, deleteAddress };
